(() => {
  "use strict";
  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = selector => document.querySelector(selector);
  let currentTab = "all", lastQuery = "", showAllAccounts = false;
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);
  const formatCount = value => {
    const n = Number(value || 0);
    return n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : n.toLocaleString();
  };
  function getRecent() {
    try { const value = JSON.parse(localStorage.getItem("ars_search_history") || "[]"); return Array.isArray(value) ? value.filter(x => typeof x === "string") : []; }
    catch { return []; }
  }
  function renderRecent() {
    const list = getRecent(), section = $("#recentSection");
    section.classList.toggle("hidden", !list.length);
    $("#recentList").innerHTML = list.map(q => `<div class="recent"><span class="clock" aria-hidden="true">◷</span><button class="term" type="button" data-term="${escapeHTML(q)}">${escapeHTML(q)}</button><button type="button" data-remove="${escapeHTML(q)}" aria-label="Remove ${escapeHTML(q)}">×</button></div>`).join("");
  }
  function setRecent(query) {
    const list = [query, ...getRecent().filter(item => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
    try { localStorage.setItem("ars_search_history", JSON.stringify(list)); } catch { /* History is optional if storage is unavailable. */ }
    renderRecent();
  }
  function mediaURL(image) {
    if (!image || typeof image !== "string") return "";
    let value = image.trim();
    if (value.startsWith("[")) {
      try { const entries = JSON.parse(value); value = typeof entries?.[0] === "string" ? entries[0] : (entries?.[0]?.url || ""); } catch { return ""; }
    }
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
    return client?.storage.from("post-media").getPublicUrl(value).data?.publicUrl || "";
  }
  function avatar(user) {
    const name = user.display_name || user.username || "ARS member";
    return user.avatar && /^https?:\/\//i.test(user.avatar)
      ? `<img class="account-avatar" src="${escapeHTML(user.avatar)}" alt="" loading="lazy">`
      : `<span class="avatar" aria-hidden="true">${escapeHTML(name[0]?.toUpperCase() || "A")}</span>`;
  }
  async function peopleResults(query) {
    const pattern = `%${query}%`;
    const columns = ["username", "display_name", "bio"];
    const answers = await Promise.all(columns.map(column => client.from("user_profiles").select("id,username,display_name,bio,avatar,verified").ilike(column, pattern).limit(20)));
    const seen = new Set(), people = [];
    for (const answer of answers) {
      if (answer.error) throw answer.error;
      for (const user of answer.data || []) if (!seen.has(user.id)) { seen.add(user.id); people.push(user); }
    }
    return people.slice(0, 20);
  }
  async function search(query, tab = "all") {
    const q = query.trim();
    if (!q) return;
    if (!client) { $("#resultsSection").classList.remove("hidden"); $("#resultsList").innerHTML = '<p class="muted">Search is unavailable right now. Please reload and try again.</p>'; return; }
    lastQuery = q; currentTab = tab; setRecent(q); $("#query").value = q;
    $("#resultsSection").classList.remove("hidden"); $("#resultsList").innerHTML = '<p class="muted" role="status">Searching ARS…</p>';
    document.querySelectorAll(".result-tabs [data-tab]").forEach(button => { const active = button.dataset.tab === tab; button.classList.toggle("selected", active); button.setAttribute("aria-pressed", String(active)); });
    const jobs = [];
    if (tab === "all" || tab === "people") jobs.push(peopleResults(q).then(data => ({ kind:"people", data })).catch(error => ({ kind:"people", error })));
    if (tab === "all" || tab === "posts") jobs.push(client.from("posts").select("id,user_id,content,image,media_type,created_at,likes_count").eq("privacy", "public").ilike("content", `%${q}%`).order("created_at", { ascending:false }).limit(20).then(result => ({ kind:"posts", ...result })));
    const results = await Promise.all(jobs);
    let html = "";
    for (const result of results) {
      if (result.error) { html += `<p class="muted">Could not load ${result.kind} results. Please try again.</p>`; continue; }
      if (result.kind === "people") {
        html += '<h3>People</h3>';
        html += result.data.length ? result.data.map(user => `<article class="result-card person-result">${avatar(user)}<div><b>${escapeHTML(user.display_name || user.username || "ARS member")}</b> ${user.verified ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="#a855f7" style="vertical-align:middle;margin-left:3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : ""}<br><small>@${escapeHTML(user.username || "member")}</small>${user.bio ? `<p>${escapeHTML(user.bio)}</p>` : ""}</div></article>`).join("") : '<p class="muted">No matching accounts.</p>';
      } else {
        const ids = [...new Set((result.data || []).map(post => post.user_id).filter(Boolean))];
        const profileResult = ids.length ? await client.from("user_profiles").select("id,username,display_name,avatar,verified").in("id", ids) : { data:[] };
        const profiles = new Map((profileResult.data || []).map(user => [user.id, user]));
        html += '<h3>Posts</h3>';
        html += result.data?.length ? result.data.map(post => {
          const user = profiles.get(post.user_id) || {}, media = mediaURL(post.image);
          const mediaMarkup = media && !((post.media_type || "").toLowerCase().includes("video")) ? `<img class="search-post-media" src="${escapeHTML(media)}" alt="Post media" loading="lazy">` : "";
          return `<article class="result-card post-result">${mediaMarkup}<div><b>@${escapeHTML(user.username || "ARS member")}</b><p>${escapeHTML(post.content || "")}</p><small>${formatCount(post.likes_count)} likes</small></div></article>`;
        }).join("") : '<p class="muted">No matching public posts.</p>';
      }
    }
    $("#resultsList").innerHTML = html || '<p class="muted">No results found.</p>';
  }
  async function loadDiscover() {
    if (!client) { $("#suggestedList").innerHTML = '<p class="muted">Accounts are unavailable right now.</p>'; $("#popularList").innerHTML = '<p class="muted">Posts are unavailable right now.</p>'; return; }
    const [usersResult, postsResult] = await Promise.all([
      client.from("user_profiles").select("id,username,display_name,avatar,verified").order("username", { ascending:true }).limit(8),
      client.from("posts").select("id,user_id,content,image,media_type,likes_count").eq("privacy", "public").order("likes_count", { ascending:false }).limit(6)
    ]);
    if (usersResult.error) $("#suggestedList").innerHTML = '<p class="muted">Suggested accounts are unavailable.</p>';
    else renderAccounts(usersResult.data || []);
    if (postsResult.error) { $("#popularList").innerHTML = '<p class="muted">Popular posts are unavailable.</p>'; return; }
    const posts = postsResult.data || [], ids = [...new Set(posts.map(post => post.user_id).filter(Boolean))];
    const users = ids.length ? await client.from("user_profiles").select("id,username").in("id", ids) : { data:[] };
    const names = new Map((users.data || []).map(user => [user.id, user.username]));
    $("#popularList").innerHTML = posts.length ? posts.map(post => {
      const media = mediaURL(post.image), visual = media && !String(post.media_type || "").includes("video") ? `<img src="${escapeHTML(media)}" alt="" loading="lazy">` : "";
      return `<article class="popular-card">${visual}<div class="popular-copy"><b>@${escapeHTML(names.get(post.user_id) || "ARS member")}</b><span>${escapeHTML((post.content || "A moment on ARS").slice(0, 72))}</span><small>${formatCount(post.likes_count)} likes</small></div></article>`;
    }).join("") : '<p class="muted">No public posts yet.</p>';
  }
  function renderAccounts(accounts) {
    const visible = showAllAccounts ? accounts : accounts.slice(0, 3);
    $("#suggestedList").innerHTML = visible.length ? visible.map(user => `<a href="profile.html?user=${encodeURIComponent(user.username || "")}" class="suggested">${avatar(user)}<span><b>${escapeHTML(user.display_name || user.username || "ARS member")} ${user.verified ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="#a855f7" style="vertical-align:middle;margin-left:3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : ""}</b><small>@${escapeHTML(user.username || "member")}</small></span></div>`).join("") : '<p class="muted">New creators will appear here.</p>';
    const button = $("#seeAccounts");
    if (button) { button.classList.toggle("hidden", accounts.length <= 3); button.textContent = showAllAccounts ? "Show Less ‹" : "See More ›"; }
  }
  $("#searchForm").addEventListener("submit", event => { event.preventDefault(); search($("#query").value); });
  $("#clearQuery").addEventListener("click", () => { $("#query").value = ""; $("#query").focus(); });
  $("#clearRecent").addEventListener("click", () => { localStorage.removeItem("ars_search_history"); renderRecent(); });
  $("#recentList").addEventListener("click", event => {
    const remove = event.target.closest("[data-remove]");
    if (remove) { localStorage.setItem("ars_search_history", JSON.stringify(getRecent().filter(item => item !== remove.dataset.remove))); renderRecent(); return; }
    const term = event.target.closest("[data-term]"); if (term) search(term.dataset.term);
  });
  document.querySelectorAll(".trend").forEach(button => button.addEventListener("click", () => search(button.dataset.query)));
  document.querySelectorAll(".result-tabs [data-tab]").forEach(button => button.addEventListener("click", () => { if (lastQuery) search(lastQuery, button.dataset.tab); }));
  $("#seeTrending").addEventListener("click", () => search("trending"));
  $("#seeAccounts")?.addEventListener("click", () => { showAllAccounts = !showAllAccounts; loadDiscover(); });
  renderRecent();
  loadDiscover();
})();
