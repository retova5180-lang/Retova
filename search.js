(() => {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = selector => document.querySelector(selector);
  const recentKey = "ars_recent_searches";
  let currentUser = null;

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
    window.setTimeout(() => item.remove(), 3000);
  }

  function getRecent() {
    try {
      const parsed = JSON.parse(localStorage.getItem(recentKey) || "[]");
      return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  function saveRecent(term) {
    const normalized = term.trim();
    if (!normalized) return;
    const recent = [normalized, ...getRecent().filter(item => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 8);
    localStorage.setItem(recentKey, JSON.stringify(recent));
    renderRecent();
  }

  function renderRecent() {
    const recent = getRecent();
    const container = $("#recentSearches");
    if (!recent.length) {
      container.innerHTML = '<p class="empty-copy">Your recent searches will appear here.</p>';
      return;
    }
    container.innerHTML = recent.map(term =>
      '<span class="recent-chip"><button type="button" data-recent-query="' + escapeHTML(term) + '">' + escapeHTML(term) + '</button><button type="button" data-remove-recent="' + escapeHTML(term) + '" aria-label="Remove ' + escapeHTML(term) + '">×</button></span>'
    ).join("");
  }

  function renderAccounts(users) {
    const container = $("#suggestedAccounts");
    if (!users.length) {
      container.innerHTML = '<p class="empty-copy">No suggested accounts available right now.</p>';
      return;
    }
    container.innerHTML = users.map(user => {
      const name = user.display_name || user.username || "ARS member";
      const avatar = user.avatar
        ? '<img class="account-avatar" src="' + escapeHTML(user.avatar) + '" alt="">'
        : '<span class="account-avatar">' + escapeHTML(name.charAt(0).toUpperCase()) + '</span>';
      return '<div class="account-row">' + avatar +
        '<span class="account-info"><strong>' + escapeHTML(name) + (user.verified ? ' <span aria-label="Verified">✓</span>' : '') + '</strong><small>@' + escapeHTML(user.username || "member") + '</small></span>' +
        '<button class="follow-button" type="button" data-follow-user="' + escapeHTML(user.id) + '">Follow</button></div>';
    }).join("");
  }

  async function loadAccounts() {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    currentUser = sessionData?.session?.user || null;
    let query = supabase.from("users").select("id, username, display_name, avatar, verified").limit(6);
    if (currentUser?.id) query = query.neq("id", currentUser.id);
    const { data, error } = await query;
    if (error) {
      console.warn("Suggested accounts unavailable:", error.message);
      $("#suggestedAccounts").innerHTML = '<p class="empty-copy">Could not load suggested accounts.</p>';
      return;
    }
    renderAccounts(data || []);
  }

  async function loadPopularContent() {
    if (!supabase) return;
    const container = $("#popularContent");
    const { data, error } = await supabase
      .from("posts")
      .select("id, content, image, media_type, likes_count, created_at")
      .eq("privacy", "public")
      .order("likes_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) {
      console.warn("Popular content unavailable:", error.message);
      container.innerHTML = '<p class="empty-copy">Popular content is unavailable right now.</p>';
      return;
    }
    if (!data?.length) {
      container.innerHTML = '<p class="empty-copy">Popular posts will appear here as the community shares.</p>';
      return;
    }
    container.innerHTML = data.map(post => {
      const content = post.content || (post.media_type ? "Shared " + post.media_type : "Shared a moment");
      const media = post.image
        ? '<div class="popular-media"><span>' + (post.media_type === "video" ? "▶" : "✦") + '</span></div>'
        : '<div class="popular-media popular-media-text"><span>ΛRS</span></div>';
      return '<article class="popular-card" data-popular-post="' + escapeHTML(post.id) + '">' +
        media + '<div class="popular-card-copy"><strong>' + escapeHTML(content.slice(0, 92)) + '</strong>' +
        '<small>♥ ' + Number(post.likes_count || 0) + ' likes</small></div></article>';
    }).join("");
  }

  async function runSearch(value) {
    const term = value.trim();
    if (!term) {
      $("#resultsSection").hidden = true;
      return;
    }
    saveRecent(term);
    $("#resultsSection").hidden = false;
    $("#searchResults").innerHTML = '<p class="empty-copy">Searching ARS…</p>';
    if (!supabase) {
      $("#searchResults").innerHTML = '<p class="empty-copy">Search service is unavailable.</p>';
      return;
    }
    const { data, error } = await supabase.from("posts")
      .select("id, content, created_at, hashtags, location")
      .ilike("content", "%" + term.replace(/[%_]/g, "") + "%")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.warn("Post search failed:", error.message);
      $("#searchResults").innerHTML = '<p class="empty-copy">Search could not be completed.</p>';
      return;
    }
    const results = data || [];
    $("#resultCount").textContent = String(results.length);
    if (!results.length) {
      $("#searchResults").innerHTML = '<p class="empty-copy">No posts found for “' + escapeHTML(term) + '”. Try another search.</p>';
      return;
    }
    $("#searchResults").innerHTML = results.map(post =>
      '<article class="result-item"><strong>' + escapeHTML(post.location || "ARS post") + '</strong><p>' +
      escapeHTML(post.content || post.hashtags || "Shared a moment.") + '</p></article>'
    ).join("");
  }

  async function followUser(userId, button) {
    if (!currentUser?.id) {
      toast("Sign in to follow accounts.");
      return;
    }
    button.disabled = true;
    try {
      const { error } = await supabase.from("followers").insert({ follower_id: currentUser.id, following_id: userId });
      if (error) throw error;
      button.textContent = "Following";
      toast("Account followed.");
    } catch (error) {
      console.warn("Follow action failed:", error);
      button.disabled = false;
      toast("Could not follow this account.");
    }
  }

  function bindEvents() {
    $("#searchInput").addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        runSearch(event.currentTarget.value);
      }
    });
    $("#searchInput").addEventListener("input", event => {
      $("#clearSearch").hidden = !event.currentTarget.value;
    });
    $("#clearSearch").addEventListener("click", () => {
      $("#searchInput").value = "";
      $("#clearSearch").hidden = true;
      $("#searchInput").focus();
      $("#resultsSection").hidden = true;
    });
    $("#clearAll").addEventListener("click", () => {
      localStorage.removeItem(recentKey);
      renderRecent();
    });
    $("#refreshContent").addEventListener("click", () => {
      loadAccounts();
      loadPopularContent();
      toast("Explore refreshed.");
    });
    document.addEventListener("click", event => {
      const recent = event.target.closest("[data-recent-query]");
      if (recent) {
        $("#searchInput").value = recent.dataset.recentQuery;
        runSearch(recent.dataset.recentQuery);
        return;
      }
      const remove = event.target.closest("[data-remove-recent]");
      if (remove) {
        const term = remove.dataset.removeRecent;
        localStorage.setItem(recentKey, JSON.stringify(getRecent().filter(item => item !== term)));
        renderRecent();
        return;
      }
      const trend = event.target.closest("[data-query]");
      if (trend) {
        $("#searchInput").value = trend.dataset.query;
        runSearch(trend.dataset.query);
        return;
      }
      const follow = event.target.closest("[data-follow-user]");
      if (follow) followUser(follow.dataset.followUser, follow);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    renderRecent();
    loadAccounts();
    loadPopularContent();
  });
})();
