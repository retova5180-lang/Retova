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
  async function mediaInfo(post, isPrivateAccount = false) {
    if (!post?.image || typeof post.image !== "string") return null;
    let item = { url: post.image.trim(), type: post.media_type || "image" };
    if (item.url.startsWith("[")) {
      try {
        const entries = JSON.parse(item.url);
        const first = Array.isArray(entries) ? entries[0] : null;
        if (typeof first === "string") {
          item = { url: first, type: /\.(mp4|webm|mov|ogg)(?:$|[?#])/i.test(first) || post.media_type === "video" ? "video" : "image" };
        } else if (first && typeof first === "object") {
          item = { url: first.url || first.image || "", type: first.type || first.media_type || post.media_type || "image" };
        } else {
          return null;
        }
      } catch {
        return null;
      }
    }
    if (!item.url) return null;
    let url = item.url;
    if (!url.startsWith("data:")) {
      let bucket = post.privacy === "public" && !isPrivateAccount ? "post-media" : "private-post-media";
      let exactBucket = false;
      if (/^https?:\/\//i.test(url)) {
        const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/(post-media|private-post-media)\/(.+?)(?:\?|$)/i);
        if (!match) return { url, type: item.type === "video" ? "video" : "image" };
        bucket = match[1];
        exactBucket = true;
        try { url = decodeURIComponent(match[2]); } catch { url = match[2]; }
      }
      const buckets = exactBucket ? [bucket] : [bucket, bucket === "post-media" ? "private-post-media" : "post-media"];
      let signedUrl = "";
      let lastError = null;
      for (const candidate of buckets) {
        const { data, error } = await client.storage.from(candidate).createSignedUrl(url, 1800);
        if (!error && data?.signedUrl) { signedUrl = data.signedUrl; break; }
        lastError = error;
      }
      if (!signedUrl) {
        if (lastError) console.warn("Could not resolve post search media:", lastError.message);
        return null;
      }
      url = signedUrl;
    }
    return url ? { url, type: item.type === "video" ? "video" : "image" } : null;
  }
  function avatar(user) {
    const name = user.display_name || user.username || "ARS member";
    return user.avatar && /^https?:\/\//i.test(user.avatar)
      ? `<img class="account-avatar" src="${escapeHTML(user.avatar)}" alt="" loading="lazy">`
      : `<span class="avatar" aria-hidden="true">${escapeHTML(name[0]?.toUpperCase() || "A")}</span>`;
  }
  async function peopleResults(query) {
    const normalized = String(query || "").trim().replace(/^@+/, "").trim();
    if (!normalized) return [];
    const pattern = `%${normalized}%`;
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
    if (tab === "all" || tab === "posts") jobs.push(client.from("posts").select("id,user_id,content,image,media_type,privacy,created_at,likes_count").eq("privacy", "public").ilike("content", `%${q}%`).order("created_at", { ascending:false }).limit(20).then(result => ({ kind:"posts", ...result })));
    const results = await Promise.all(jobs);
    let html = "";
    for (const result of results) {
      if (result.error) { html += `<p class="muted">Could not load ${result.kind} results. Please try again.</p>`; continue; }
      if (result.kind === "people") {
        html += '<h3>People</h3>';
        html += result.data.length ? result.data.map(user => `<article class="result-card person-result">${avatar(user)}<div><b>${escapeHTML(user.display_name || user.username || "ARS member")}</b> ${user.verified ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="#a855f7" style="vertical-align:middle;margin-left:3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : ""}<br><small>@${escapeHTML(user.username || "member")}</small>${user.bio ? `<p>${escapeHTML(user.bio)}</p>` : ""}</div></article>`).join("") : '<p class="muted">No matching accounts.</p>';
      } else {
        const ids = [...new Set((result.data || []).map(post => post.user_id).filter(Boolean))];
        const profileResult = ids.length ? await client.from("user_profiles").select("id,username,display_name,avatar,verified,is_private").in("id", ids) : { data:[] };
        const profiles = new Map((profileResult.data || []).map(user => [user.id, user]));
        html += '<h3>Posts</h3>';
        if (result.data?.length) {
          const cards = await Promise.all(result.data.map(async post => {
            const user = profiles.get(post.user_id) || { is_private: true };
            const media = await mediaInfo(post, user.is_private);
            const mediaMarkup = media?.url
              ? (media.type === "video"
                ? `<video class="search-post-media" src="${escapeHTML(media.url)}" controls playsinline preload="metadata"></video>`
                : `<img class="search-post-media" src="${escapeHTML(media.url)}" alt="Post media" loading="lazy">`)
              : "";
            return `<article class="result-card post-result">${mediaMarkup}<div><b>@${escapeHTML(user.username || "ARS member")}</b><p>${escapeHTML(post.content || "")}</p><small>${formatCount(post.likes_count)} likes</small></div></article>`;
          }));
          html += cards.join("");
        } else {
          html += '<p class="muted">No matching public posts.</p>';
        }
      }
    }
    $("#resultsList").innerHTML = html || '<p class="muted">No results found.</p>';
  }
  async function loadDiscover() {
    if (!client) { $("#suggestedList").innerHTML = '<p class="muted">Accounts are unavailable right now.</p>'; $("#popularList").innerHTML = '<p class="muted">Posts are unavailable right now.</p>'; return; }
    const [usersResult, postsResult] = await Promise.all([
      client.from("user_profiles").select("id,username,display_name,avatar,verified").order("username", { ascending:true }).limit(8),
      client.from("posts").select("id,user_id,content,image,media_type,privacy,likes_count").eq("privacy", "public").order("likes_count", { ascending:false }).limit(6)
    ]);
    if (usersResult.error) $("#suggestedList").innerHTML = '<p class="muted">Suggested accounts are unavailable.</p>';
    else renderAccounts(usersResult.data || []);
    if (postsResult.error) { $("#popularList").innerHTML = '<p class="muted">Popular posts are unavailable.</p>'; return; }
    const posts = postsResult.data || [], ids = [...new Set(posts.map(post => post.user_id).filter(Boolean))];
    const users = ids.length ? await client.from("user_profiles").select("id,username,is_private").in("id", ids) : { data:[] };
    const names = new Map((users.data || []).map(user => [user.id, user.username]));
    const privateProfiles = new Map((users.data || []).map(user => [user.id, user.is_private]));
    if (posts.length) {
      const cards = await Promise.all(posts.map(async post => {
        const media = await mediaInfo(post, privateProfiles.get(post.user_id) ?? true);
        const visual = media?.url
          ? (media.type === "video"
            ? `<video src="${escapeHTML(media.url)}" controls playsinline preload="metadata"></video>`
            : `<img src="${escapeHTML(media.url)}" alt="" loading="lazy">`)
          : "";
        return `<article class="popular-card">${visual}<div class="popular-copy"><b>@${escapeHTML(names.get(post.user_id) || "ARS member")}</b><span>${escapeHTML((post.content || "A moment on ARS").slice(0, 72))}</span><small>${formatCount(post.likes_count)} likes</small></div></article>`;
      }));
      $("#popularList").innerHTML = cards.join("");
    } else {
      $("#popularList").innerHTML = '<p class="muted">No public posts yet.</p>';
    }
  }
  function renderAccounts(accounts) {
    const visible = showAllAccounts ? accounts : accounts.slice(0, 3);
    $("#suggestedList").innerHTML = visible.length ? visible.map(user => `<a href="profile.html?user=${encodeURIComponent(user.username || "")}" class="suggested">${avatar(user)}<span><b>${escapeHTML(user.display_name || user.username || "ARS member")} ${user.verified ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="#a855f7" style="vertical-align:middle;margin-left:3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : ""}</b><small>@${escapeHTML(user.username || "member")}</small></span></a>`).join("") : '<p class="muted">New creators will appear here.</p>';
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
