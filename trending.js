(() => {
  "use strict";
  const db = window.supabase?.createClient(
    "https://bfqsqgfyyewnfxekirfv.supabase.co",
    "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-"
  );
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
  const timeAgo = value => {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return "just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  };
  function card(post, index, profile) {
    const name = profile?.display_name || profile?.username || "ARS member";
    const media = post.media_url
      ? '<img src="' + esc(post.media_url) + '" alt="Post media" loading="lazy">'
      : "";
    return '<article class="trend-card"><span class="trend-rank">TRENDING #' + (index + 1) + '</span>' +
      '<h3>' + esc(name) + '</h3><p>' + esc(post.content || "Shared a moment on ARS.") + '</p>' +
      media + '<footer>' + esc(timeAgo(post.created_at)) + '</footer></article>';
  }
  async function load() {
    $("#trendingPosts").innerHTML = '<p class="empty">Loading popular posts…</p>';
    $("#trendingTopics").innerHTML = '<p class="empty">Finding active topics…</p>';
    if (!db) throw new Error("ARS data service could not load.");
    const sessionResult = await db.auth.getSession();
    if (sessionResult.error) throw sessionResult.error;
    const user = sessionResult.data.session?.user;
    if (!user?.id) {
      window.location.replace("index.html");
      return;
    }
    const result = await db.from("posts")
      .select("id,user_id,content,media_url,created_at,privacy")
      .eq("privacy", "public")
      .order("created_at", { ascending: false })
      .limit(50);
    if (result.error) throw result.error;
    const posts = result.data || [];
    const ids = [...new Set(posts.map(post => post.user_id).filter(Boolean))];
    let profiles = {};
    if (ids.length) {
      const profileResult = await db.from("users")
        .select("id,username,display_name")
        .in("id", ids);
      if (profileResult.error) throw profileResult.error;
      profiles = Object.fromEntries((profileResult.data || []).map(profile => [profile.id, profile]));
    }
    const visiblePosts = posts.slice(0, 20);
    $("#trendingPosts").innerHTML = visiblePosts.length
      ? visiblePosts.map((post, index) => card(post, index, profiles[post.user_id])).join("")
      : '<p class="empty">No public posts are trending yet. Check back soon.</p>';
    const counts = new Map();
    for (const post of posts) {
      const tags = (post.content || "").match(/#[\p{L}\p{N}_]+/gu) || [];
      for (const tag of tags) {
        const key = tag.toLowerCase();
        const current = counts.get(key) || { label: tag, count: 0 };
        current.count += 1;
        counts.set(key, current);
      }
    }
    const topics = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);
    $("#trendingTopics").innerHTML = topics.length
      ? topics.map((topic, index) => '<article class="trend-card"><span class="trend-rank">TOPIC #' + (index + 1) + '</span><h3>' + esc(topic.label) + '</h3><p>' + topic.count + (topic.count === 1 ? ' public post' : ' public posts') + '</p></article>').join("")
      : '<p class="empty">Hashtags from public posts will appear here.</p>';
  }
  function showError(error) {
    const message = esc(error?.message || "Could not load trending content.");
    $("#trendingPosts").innerHTML = '<p class="empty">' + message + '</p>';
    $("#trendingTopics").innerHTML = '<p class="empty">Topics are unavailable until posts can be loaded.</p>';
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("#refreshTrending").addEventListener("click", () => load().catch(showError));
    load().catch(showError);
  });
})();