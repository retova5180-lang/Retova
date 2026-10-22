(() => {
  "use strict";

  const client = window.supabase.createClient(
    "https://bfqsqgfyyewnfxekirfv.supabase.co",
    "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-"
  );
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  async function loadTrending() {
    const topics = document.querySelector("#trendingTopics");
    const posts = document.querySelector("#trendingPosts");
    topics.innerHTML = "<p>Loading trending topics…</p>";
    posts.innerHTML = "<p>Loading popular posts…</p>";

    const { data: tags, error: tagError } = await client
      .from("hashtags")
      .select("tag, posts_count")
      .order("posts_count", { ascending: false })
      .limit(10);

    if (tagError) {
      topics.innerHTML = "<p>Trending topics are unavailable right now.</p>";
    } else if (!tags?.length) {
      topics.innerHTML = "<p>No trending topics yet. Hashtags from new posts will appear here.</p>";
    } else {
      topics.innerHTML = tags.map((tag, index) => `
        <article class="trend-card">
          <span class="trend-rank">#${index + 1}</span>
          <h3>#${escapeHTML(tag.tag)}</h3>
          <p>${Number(tag.posts_count || 0)} posts</p>
        </article>
      `).join("");
    }

    const { data: feed, error: feedError } = await client
      .from("posts")
      .select("id, content, image, media_type, likes_count, comments_count, created_at, users(username, display_name)")
      .eq("privacy", "public")
      .order("likes_count", { ascending: false })
      .limit(20);

    if (feedError) {
      posts.innerHTML = "<p>Popular posts could not be loaded. Check the posts access policy.</p>";
    } else if (!feed?.length) {
      posts.innerHTML = "<p>No public posts yet. Be the first to share something.</p>";
    } else {
      posts.innerHTML = feed.map(post => `
        <article class="trend-card">
          <h3>${escapeHTML(post.users?.display_name || post.users?.username || "ARS member")}</h3>
          <p>${escapeHTML(post.content || "")}</p>
          ${post.image ? `<img src="${escapeHTML(post.image)}" alt="Post media" loading="lazy">` : ""}
          <footer>♥ ${Number(post.likes_count || 0)} · Comments ${Number(post.comments_count || 0)}</footer>
        </article>
      `).join("");
    }
  }

  document.querySelector("#refreshTrending").addEventListener("click", () => {
    loadTrending().catch(() => {
      document.querySelector("#trendingPosts").textContent = "Trending could not be refreshed.";
    });
  });
  loadTrending().catch(() => {
    document.querySelector("#trendingTopics").textContent = "Trending topics are unavailable right now.";
    document.querySelector("#trendingPosts").textContent = "Popular posts are unavailable right now.";
  });
})();