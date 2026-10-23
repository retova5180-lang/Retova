(() => {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = selector => document.querySelector(selector);

  const state = {
    user: null,
    isSubscriber: false,
    spinning: false,
    rotation: 0
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function toast(message) {
    const region = $("#toastRegion");
    if (!region) return;
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), 3500);
  }

  function relativeTime(value) {
    const date = new Date(value || Date.now());
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  }

  async function requireSession() {
    if (!supabase) {
      throw new Error("The ARS data service could not load. Refresh the page and try again.");
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    state.user = data.session?.user || null;
    if (!state.user?.id) {
      window.location.replace("index.html");
      throw new Error("Please sign in to use Rewards & Challenges.");
    }
  }

  async function loadMembership() {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan,active,expires_at")
      .eq("user_id", state.user.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("Subscription status could not be loaded:", error.message);
      state.isSubscriber = false;
    } else {
      const now = Date.now();
      state.isSubscriber = (data || []).some(item => !item.expires_at || new Date(item.expires_at).getTime() > now);
    }

    const chip = $("#planStatus");
    chip.textContent = state.isSubscriber ? "VIP · Unlimited spins" : "Free plan";
    chip.classList.toggle("vip", state.isSubscriber);
  }

  async function loadAllowance() {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("wheel_spins")
      .select("id")
      .eq("user_id", state.user.id)
      .eq("spin_date", today);

    if (error) {
      $("#spinAllowance").textContent = "Spin allowance unavailable";
      console.warn("Spin allowance could not be loaded:", error.message);
      return;
    }

    const used = (data || []).length;
    if (state.isSubscriber) {
      $("#spinAllowance").textContent = used + " spins today · no daily limit";
      $("#spinButton").disabled = false;
      return;
    }

    const remaining = Math.max(0, 2 - used);
    $("#spinAllowance").textContent = remaining + " free spin" + (remaining === 1 ? "" : "s") + " remaining today";
    $("#spinButton").disabled = remaining === 0;
    if (!remaining) $("#wheelStatus").textContent = "Your two free spins have been used today. Come back tomorrow or subscribe for unlimited spins.";
  }

  async function loadChallenges() {
    const list = $("#challengeList");
    list.innerHTML = '<p class="empty-state">Loading challenges…</p>';
    const { data, error } = await supabase
      .from("wheel_challenges")
      .select("id,title,category,reward_xp,image_required,created_at")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      list.innerHTML = '<p class="empty-state">Challenges could not be loaded. Please refresh and try again.</p>';
      console.error("Challenge loading failed:", error);
      return [];
    }

    if (!data?.length) {
      list.innerHTML = '<p class="empty-state">No challenges are configured yet.</p>';
      return [];
    }

    list.innerHTML = data.map(challenge => {
      const category = String(challenge.category || "challenge").replace(/_/g, " ");
      return '<article class="challenge-item">' +
        '<span class="challenge-icon" aria-hidden="true">✦</span>' +
        '<div class="challenge-copy"><strong>' + escapeHTML(challenge.title) + '</strong>' +
        '<p>' + escapeHTML(category) + (challenge.image_required ? " · Photo proof required" : "") + '</p></div>' +
        '<span class="challenge-xp">+' + Number(challenge.reward_xp || 0) + ' XP</span>' +
        '</article>';
    }).join("");

    return data;
  }

  async function loadHistory() {
    const list = $("#spinHistory");
    list.innerHTML = '<p class="empty-state">Loading spin history…</p>';
    const { data, error } = await supabase
      .from("wheel_spins")
      .select("id,spin_date,attempt_number,reward_code,reward_payload,created_at")
      .eq("user_id", state.user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      list.innerHTML = '<p class="empty-state">Spin history could not be loaded.</p>';
      console.error("Spin history loading failed:", error);
      return;
    }

    if (!data?.length) {
      list.innerHTML = '<p class="empty-state">Your completed spins will appear here.</p>';
      return;
    }

    list.innerHTML = data.map(spin => {
      const payload = spin.reward_payload || {};
      const title = payload.title || payload.challenge_title || spin.reward_code || "ARS reward";
      const xp = Number(payload.reward_xp || payload.xp || 0);
      return '<article class="history-item"><div><strong>' + escapeHTML(title) +
        '</strong><small>' + escapeHTML(relativeTime(spin.created_at)) + ' · Spin ' +
        Number(spin.attempt_number || 1) + '</small></div><span class="history-xp">+' + xp + ' XP</span></article>';
    }).join("");
  }

  async function spinWheel() {
    if (state.spinning || !state.user) return;
    const button = $("#spinButton");
    const wheel = $("#wheel");
    state.spinning = true;
    button.disabled = true;
    button.textContent = "Spinning…";
    $("#wheelStatus").textContent = "The wheel is choosing your challenge…";
    $("#resultPanel").classList.add("hidden");

    try {
      const { data, error } = await supabase.rpc("spin_rewards_wheel");
      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.challenge) {
        throw new Error("The wheel returned no challenge. Please try again.");
      }

      const extraDegrees = 1800 + Math.floor(Math.random() * 1080);
      state.rotation += extraDegrees;
      wheel.style.transform = "rotate(" + state.rotation + "deg)";
      await new Promise(resolve => window.setTimeout(resolve, 4300));

      const challenge = result.challenge;
      $("#resultTitle").textContent = challenge.title || "Your new challenge";
      $("#resultDescription").textContent = challenge.description ||
        (challenge.image_required ? "Complete this challenge and attach photo proof." : "Complete this challenge to earn your XP reward.");
      $("#resultXp").textContent = "+" + Number(challenge.reward_xp || 0) + " XP";
      $("#resultCategory").textContent = String(challenge.category || "Challenge").replace(/_/g, " ");
      $("#resultPanel").classList.remove("hidden");
      $("#wheelStatus").textContent = "Challenge selected! Complete it to earn your reward.";
      toast("Your challenge is ready.");
      await Promise.all([loadAllowance(), loadHistory()]);
    } catch (error) {
      console.error("Wheel spin failed:", error);
      $("#wheelStatus").textContent = error.message || "The wheel could not spin. Please try again.";
      toast(error.message || "The wheel could not spin.");
    } finally {
      state.spinning = false;
      button.textContent = "Spin the wheel";
      await loadAllowance();
    }
  }

  function bindEvents() {
    $("#spinButton").addEventListener("click", spinWheel);
    $("#refreshChallenges").addEventListener("click", () => loadChallenges().catch(error => toast(error.message)));
    $("#refreshHistory").addEventListener("click", () => loadHistory().catch(error => toast(error.message)));
  }

  async function init() {
    bindEvents();
    try {
      await requireSession();
      await Promise.all([loadMembership(), loadChallenges(), loadHistory()]);
      await loadAllowance();
    } catch (error) {
      $("#wheelStatus").textContent = error.message || "Rewards could not be loaded.";
      $("#spinButton").disabled = true;
      console.error("Rewards initialization failed:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();