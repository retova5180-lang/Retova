(() => {
  "use strict";
  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = selector => document.querySelector(selector);
  const state = { user: null, profiles: new Map(), streaks: [] };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }
  function toast(message) {
    const region = $("#toastRegion");
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), 3500);
  }
  function setMessage(selector, message, type = "") {
    const element = $(selector);
    if (!element) return;
    element.textContent = message;
    element.className = "status-message" + (type ? " " + type : "");
  }
  function empty(message) { return '<p class="empty-state">' + escapeHTML(message) + "</p>"; }
  function monthStart() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  }
  function relativeTime(value) {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value || Date.now()).getTime()) / 1000));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  }
  async function requireSession() {
    if (!supabase) throw new Error("The ARS data service could not load.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    state.user = data.session?.user || null;
    if (!state.user?.id) {
      window.location.replace("index.html");
      throw new Error("Please sign in to manage streaks.");
    }
  }
  async function loadProfiles(ids) {
    const missing = [...new Set(ids.filter(Boolean))].filter(id => !state.profiles.has(id));
    if (!missing.length) return;
    const { data, error } = await supabase.from("users").select("id,username,display_name,avatar").in("id", missing);
    if (error) { console.warn("Streak profiles unavailable:", error.message); return; }
    (data || []).forEach(profile => state.profiles.set(profile.id, profile));
  }
  function nameOf(id) {
    const profile = state.profiles.get(id) || {};
    return profile.display_name || profile.username || "ARS member";
  }
  function avatarOf(id) {
    const profile = state.profiles.get(id) || {};
    const name = nameOf(id);
    return profile.avatar
      ? '<img class="avatar" src="' + escapeHTML(profile.avatar) + '" alt="' + escapeHTML(name) + '">'
      : '<span class="avatar" aria-hidden="true">' + escapeHTML(name.charAt(0).toUpperCase() || "A") + "</span>";
  }
  async function loadInvitations() {
    const uid = state.user.id;
    const [receivedResult, sentResult] = await Promise.all([
      supabase.from("streak_invites").select("id,from_user_id,to_user_id,status,created_at").eq("to_user_id", uid).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("streak_invites").select("id,from_user_id,to_user_id,status,created_at").eq("from_user_id", uid).eq("status", "pending").order("created_at", { ascending: false })
    ]);
    if (receivedResult.error) throw receivedResult.error;
    if (sentResult.error) throw sentResult.error;
    const received = receivedResult.data || [];
    const sent = sentResult.data || [];
    await loadProfiles([...received.map(row => row.from_user_id), ...sent.map(row => row.to_user_id)]);
    $("#receivedInvites").innerHTML = received.length ? received.map(row =>
      '<article class="invite-item">' + avatarOf(row.from_user_id) +
      '<div class="item-copy"><strong>' + escapeHTML(nameOf(row.from_user_id)) + '</strong><p>Invited you to start a shared streak.</p><small>Sent ' + escapeHTML(relativeTime(row.created_at)) + '</small></div>' +
      '<div class="item-actions"><button class="primary-button" data-invite-id="' + escapeHTML(row.id) + '" data-invite-response="accepted" type="button">Accept</button><button class="secondary-button" data-invite-id="' + escapeHTML(row.id) + '" data-invite-response="declined" type="button">Decline</button></div></article>'
    ).join("") : empty("No invitations waiting for your response.");
    $("#sentInvites").innerHTML = sent.length ? sent.map(row =>
      '<article class="invite-item">' + avatarOf(row.to_user_id) +
      '<div class="item-copy"><strong>' + escapeHTML(nameOf(row.to_user_id)) + '</strong><p>Waiting for them to accept your invitation.</p><small>Sent ' + escapeHTML(relativeTime(row.created_at)) + '</small></div><span class="status-chip">Pending</span></article>'
    ).join("") : empty("You have no pending invitations sent.");
  }
  async function loadStreaks() {
    const { data, error } = await supabase.from("streaks")
      .select("id,user_a_id,user_b_id,streak_count,last_activity_at,updated_at,status,setup_started_at,setup_days_completed,last_activity_user_a,last_activity_user_b,broken_at,recovery_grace_date")
      .or("user_a_id.eq." + state.user.id + ",user_b_id.eq." + state.user.id)
      .order("updated_at", { ascending: false }).limit(100);
    if (error) throw error;
    state.streaks = data || [];
    await loadProfiles(state.streaks.map(row => row.user_a_id === state.user.id ? row.user_b_id : row.user_a_id));
    const ids = state.streaks.map(row => row.id);
    const used = new Map();
    if (ids.length) {
      const { data: restores, error: restoreError } = await supabase.from("streak_restores")
        .select("streak_id").in("streak_id", ids).eq("restore_month", monthStart());
      if (restoreError) throw restoreError;
      (restores || []).forEach(row => used.set(row.streak_id, (used.get(row.streak_id) || 0) + 1));
    }
    const groups = {
      setup: state.streaks.filter(row => row.status === "setup"),
      active: state.streaks.filter(row => row.status === "active"),
      broken: state.streaks.filter(row => row.status === "broken")
    };
    $("#setupStreaks").innerHTML = groups.setup.length ? groups.setup.map(row => renderStreak(row, used.get(row.id) || 0)).join("") : empty("Accepted invitations appear here during the three-day setup.");
    $("#activeStreaks").innerHTML = groups.active.length ? groups.active.map(row => renderStreak(row, used.get(row.id) || 0)).join("") : empty("No active streaks yet. Complete a three-day setup to start one.");
    $("#brokenStreaks").innerHTML = groups.broken.length ? groups.broken.map(row => renderStreak(row, used.get(row.id) || 0)).join("") : empty("No broken streaks. Keep interacting daily to protect your count.");
  }
  function renderStreak(row, usedAttempts) {
    const otherId = row.user_a_id === state.user.id ? row.user_b_id : row.user_a_id;
    const status = row.status;
    const label = status === "setup" ? "3-day setup" : status === "broken" ? "Broken" : "Active";
    const remaining = Math.max(0, 3 - usedAttempts);
    let detail = "";
    let action = "";
    if (status === "setup") {
      detail = "Both people need at least one like or story view each day for three consecutive days. Progress: " + Math.min(3, Number(row.setup_days_completed || 0)) + "/3 days.";
    } else if (status === "active") {
      detail = "Both people must like a post or view the other person's story daily. Last activity: " + relativeTime(row.last_activity_at) + ".";
    } else {
      detail = "Previous count: " + Number(row.streak_count || 0) + " days. Shared recovery attempts remaining this month: " + remaining + ".";
      action = remaining
        ? '<button class="primary-button recover-button" type="button" data-recover-streak="' + escapeHTML(row.id) + '">Recover streak</button>'
        : '<span class="status-chip broken">No restores left this month</span>';
    }
    const count = status === "setup"
      ? '<span class="streak-count">' + Math.min(3, Number(row.setup_days_completed || 0)) + '/3</span>'
      : '<span class="streak-count">🔥 ' + Number(row.streak_count || 0) + '</span>';
    return '<article class="streak-item">' + avatarOf(otherId) +
      '<div class="item-copy"><strong>' + escapeHTML(nameOf(otherId)) + '</strong><span class="status-chip ' + status + '">' + label + '</span><p>' + escapeHTML(detail) + '</p></div>' +
      '<div class="item-actions">' + count + action + '</div></article>';
  }
  async function refreshDashboard() {
    $("#refreshStreaks").disabled = true;
    try {
      await supabase.rpc("refresh_streak_status");
      await Promise.all([loadInvitations(), loadStreaks()]);
      setMessage("#streakMessage", "");
    } catch (error) {
      console.error("Streak refresh failed:", error);
      setMessage("#streakMessage", error.message || "Could not refresh streaks.", "error");
    } finally {
      $("#refreshStreaks").disabled = false;
    }
  }
  async function sendInvite(event) {
    event.preventDefault();
    const button = $("#sendInviteButton");
    const username = $("#inviteUsername").value.trim().replace(/^@/, "");
    if (!username) return setMessage("#inviteMessage", "Enter an ARS username first.", "error");
    button.disabled = true;
    button.textContent = "Sending…";
    setMessage("#inviteMessage", "Sending your invitation…");
    try {
      const { error } = await supabase.rpc("send_streak_invite", { p_to_username: username });
      if (error) throw error;
      $("#inviteForm").reset();
      setMessage("#inviteMessage", "Invitation sent. Setup begins after they accept.", "success");
      await loadInvitations();
    } catch (error) {
      console.error("Streak invite failed:", error);
      setMessage("#inviteMessage", error.message || "Could not send the invitation.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Send invite";
    }
  }
  async function respondToInvite(id, response, button) {
    button.disabled = true;
    try {
      const { error } = await supabase.rpc("respond_streak_invite", { p_invite_id: id, p_response: response });
      if (error) throw error;
      toast(response === "accepted" ? "Invitation accepted. Your three-day setup has started." : "Invitation declined.");
      await refreshDashboard();
    } catch (error) {
      console.error("Invite response failed:", error);
      toast(error.message || "Could not respond to the invitation.");
      button.disabled = false;
    }
  }
  async function recoverStreak(id, button) {
    if (!window.confirm("Use one shared recovery attempt to restore this streak?")) return;
    button.disabled = true;
    button.textContent = "Recovering…";
    try {
      const { data, error } = await supabase.rpc("recover_streak", { p_streak_id: id });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      toast("Streak recovered. " + Number(result?.remaining_attempts ?? 0) + " shared attempts remain this month.");
      await refreshDashboard();
    } catch (error) {
      console.error("Streak recovery failed:", error);
      toast(error.message || "Could not recover this streak.");
      button.disabled = false;
      button.textContent = "Recover streak";
    }
  }
  function bindEvents() {
    $("#inviteForm").addEventListener("submit", sendInvite);
    $("#refreshStreaks").addEventListener("click", refreshDashboard);
    document.addEventListener("click", event => {
      const response = event.target.closest("[data-invite-response]");
      if (response) return respondToInvite(response.dataset.inviteId, response.dataset.inviteResponse, response);
      const recover = event.target.closest("[data-recover-streak]");
      if (recover) recoverStreak(recover.dataset.recoverStreak, recover);
    });
  }
  async function init() {
    bindEvents();
    try {
      await requireSession();
      await refreshDashboard();
    } catch (error) {
      console.error("Streak initialization failed:", error);
      setMessage("#streakMessage", error.message || "Could not load streaks.", "error");
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();