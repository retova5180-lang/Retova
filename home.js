"use strict";

/*
  ARS / ΛRS HOME
  Source of truth:
  1. ARS requirements
  2. Reference design
  3. Existing correct functionality

  Storage:
  ars_user
  ars_plan
  ars_local_posts
  ars_local_stories
  ars_streak_state
  ars_wheel_week
  ars_bookmark_<postId>
*/

const SUPABASE_URL =
  "https://bfqsqgfyyewnfxekirfv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

const supabaseClient =
  window.supabase?.createClient
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      )
    : null;

const USER_KEY = "ars_user";
const PLAN_KEY = "ars_plan";
const POSTS_KEY = "ars_local_posts";
const STORIES_KEY = "ars_local_stories";
const STREAK_KEY = "ars_streak_state";
const WHEEL_KEY = "ars_wheel_week";
const LEGACY_POSTS_KEY = "ars_home_posts_v5";
const LEGACY_STORIES_KEY = "ars_stories";

let currentUser = readJSON(USER_KEY, null);
let plan = localStorage.getItem(PLAN_KEY) || "free";

let posts = [];
let stories = [];

let currentCommentPost = null;
let currentStory = null;
let currentPage = "homePage";
let wheelRotation = 0;
let toastTimer = null;

const $ = (id) => document.getElementById(id);

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix = "ars") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCount(value) {
  const n = Number(value) || 0;

  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M`;
  }

  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  }

  return String(n);
}

function timeAgo(timestamp) {
  const time = new Date(timestamp).getTime();

  if (!Number.isFinite(time)) {
    return "";
  }

  const diff = Math.max(0, Date.now() - time);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function toast(message) {
  const element = $("toast");

  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2200);
}

function refreshIcons() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}

/* -------------------------------------------------------
   USER
------------------------------------------------------- */

function normalizeUser() {
  if (!currentUser) {
    currentUser = {
      id: "local-user",
      username: "user",
      display_name: "ARS User",
      email: "",
      avatar: "",
      bio: ""
    };
  }

  currentUser.id ||= "local-user";
  currentUser.username ||= "user";
  currentUser.display_name ||= currentUser.name || "ARS User";
  currentUser.avatar ||= "";
  currentUser.bio ||= "";

  writeJSON(USER_KEY, currentUser);
}

function getUserName() {
  return currentUser.display_name || "ARS User";
}

function getUserHandle() {
  const username = currentUser.username || "user";
  return username.startsWith("@") ? username : `@${username}`;
}

function userAvatarHTML(user, className = "post-avatar") {
  const avatar = user?.avatar || "";
  const name = user?.display_name || user?.name || "R";
  const letter = name.trim().charAt(0).toUpperCase() || "R";

  if (avatar) {
    return `
      <span class="avatar ${className}">
        <img src="${esc(avatar)}" alt="">
      </span>
    `;
  }

  return `
    <span class="avatar ${className}">
      ${esc(letter)}
    </span>
  `;
}

function renderProfile() {
  const name = getUserName();
  const handle = getUserHandle();

  $("profileName").textContent = name;
  $("profileHandle").textContent = handle;
  $("profileBio").textContent = currentUser.bio || "";

  const topAvatar = $("topAvatar");

  if (currentUser.avatar) {
    topAvatar.innerHTML = `<img src="${esc(currentUser.avatar)}" alt="">`;
  } else {
    topAvatar.textContent =
      name.trim().charAt(0).toUpperCase() || "R";
  }

  const profileAvatar = $("profileAvatar");

  if (currentUser.avatar) {
    profileAvatar.innerHTML =
      `<img src="${esc(currentUser.avatar)}" alt="">`;
  } else {
    profileAvatar.textContent =
      name.trim().charAt(0).toUpperCase() || "R";
  }

  $("profilePosts").textContent = posts.filter(
    (post) => String(post.user_id) === String(currentUser.id)
  ).length;

  $("profileFollowers").textContent =
    Number(currentUser.followers || 0);

  $("profileFollowing").textContent =
    Number(currentUser.following || 0);
}

/* -------------------------------------------------------
   POSTS
------------------------------------------------------- */

function normalizePost(post) {
  const normalized = {
    id: post.id || uid("post"),
    user_id: post.user_id || post.userId || "unknown",
    display_name:
      post.display_name ||
      post.name ||
      post.user?.display_name ||
      "User",
    username:
      post.username ||
      post.handle ||
      post.user?.username ||
      "user",
    avatar:
      post.avatar ||
      post.user?.avatar ||
      "",
    verified:
      Boolean(
        post.verified ||
        post.user?.verified
      ),
    text: String(post.text || post.content || ""),
    image:
      post.image ||
      post.image_url ||
      post.media ||
      "",
    created_at:
      post.created_at ||
      post.createdAt ||
      new Date().toISOString(),
    likes: Number(post.likes || 0),
    comments: Number(post.comments || 0),
    reposts: Number(post.reposts || 0),
    views: Number(post.views || 0),
    liked: Boolean(post.liked),
    reposted: Boolean(post.reposted),
    comments_data: Array.isArray(post.comments_data)
      ? post.comments_data
      : [],
    hashtags: Array.isArray(post.hashtags)
      ? post.hashtags
      : extractHashtags(post.text || post.content || "")
  };

  return normalized;
}

function loadPosts() {
  let stored = readJSON(POSTS_KEY, null);

  if (!Array.isArray(stored)) {
    const legacy = readJSON(LEGACY_POSTS_KEY, []);

    if (Array.isArray(legacy) && legacy.length) {
      stored = legacy.map(normalizePost);
      writeJSON(POSTS_KEY, stored);
    } else {
      stored = [];
    }
  }

  posts = stored.map(normalizePost);
}

function savePosts() {
  writeJSON(POSTS_KEY, posts);
}

function extractHashtags(text) {
  const matches =
    String(text || "").match(/#[\p{L}\p{N}_]+/gu) || [];

  return [...new Set(
    matches.map((tag) => tag.slice(1).toLowerCase())
  )];
}

function renderPostText(text) {
  const escaped = esc(text);

  return escaped.replace(
    /(^|\s)(#[\p{L}\p{N}_]+)/gu,
    `$1<button type="button" class="hashtag" data-hashtag="$2">$2</button>`
  );
}

function postMedia(post) {
  if (!post.image) {
    return "";
  }

  return `
    <img
      class="post-media"
      src="${esc(post.image)}"
      alt=""
      loading="lazy"
      onerror="this.style.display='none'"
    >
  `;
}

function verifiedHTML(verified) {
  if (!verified) return "";

  return `
    <span class="verified" aria-label="Verified">
      <i data-lucide="check"></i>
    </span>
  `;
}

function renderPosts(list = posts, container = $("feed")) {
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i data-lucide="file-text"></i>
        </div>
        <h2>No posts yet</h2>
        <p>Create a post and it will appear here.</p>
      </div>
    `;

    refreshIcons();
    return;
  }

  container.innerHTML = list.map((post) => {
    const handle = post.username.startsWith("@")
      ? post.username
      : `@${post.username}`;

    const liked = Boolean(post.liked);
    const bookmarked =
      localStorage.getItem(`ars_bookmark_${post.id}`) === "1";

    return `
      <article class="post-card" data-post-id="${esc(post.id)}">

        <div class="post-head">

          ${userAvatarHTML(
            {
              display_name: post.display_name,
              avatar: post.avatar
            },
            "post-avatar"
          )}

          <div class="post-user">
            <div class="post-name">
              <span>${esc(post.display_name)}</span>
              ${verifiedHTML(post.verified)}
            </div>

            <div class="post-meta">
              ${esc(handle)} · ${esc(timeAgo(post.created_at))}
            </div>
          </div>

          <button
            class="post-menu"
            type="button"
            data-menu="${esc(post.id)}"
            aria-label="More"
          >
            <i data-lucide="more-horizontal"></i>
          </button>

        </div>

        ${
          post.text
            ? `<div class="post-text">${renderPostText(post.text)}</div>`
            : ""
        }

        ${postMedia(post)}

        <div class="post-actions">

          <button
            class="action-button ${liked ? "liked" : ""}"
            type="button"
            data-action="like"
            data-id="${esc(post.id)}"
          >
            <i data-lucide="heart"></i>
            <span>${formatCount(post.likes)}</span>
          </button>

          <button
            class="action-button"
            type="button"
            data-action="comment"
            data-id="${esc(post.id)}"
          >
            <i data-lucide="message-circle"></i>
            <span>${formatCount(post.comments)}</span>
          </button>

          <button
            class="action-button ${post.reposted ? "liked" : ""}"
            type="button"
            data-action="repost"
            data-id="${esc(post.id)}"
          >
            <i data-lucide="repeat-2"></i>
            <span>${formatCount(post.reposts)}</span>
          </button>

          <button
            class="action-button ${bookmarked ? "bookmarked" : ""}"
            type="button"
            data-action="bookmark"
            data-id="${esc(post.id)}"
          >
            <i data-lucide="bookmark"></i>
          </button>

          <button
            class="action-button"
            type="button"
            data-action="view"
            data-id="${esc(post.id)}"
          >
            <i data-lucide="eye"></i>
            <span>${formatCount(post.views)}</span>
          </button>

        </div>
      </article>
    `;
  }).join("");

  refreshIcons();
}

function findPost(id) {
  return posts.find(
    (post) => String(post.id) === String(id)
  );
}

function postAction(action, id) {
  const post = findPost(id);

  if (!post) return;

  if (action === "like") {
    post.liked = !post.liked;
    post.likes = Math.max(
      0,
      post.likes + (post.liked ? 1 : -1)
    );

    savePosts();
    renderPosts();
    renderProfile();
    return;
  }

  if (action === "repost") {
    post.reposted = !post.reposted;
    post.reposts = Math.max(
      0,
      post.reposts + (post.reposted ? 1 : -1)
    );

    savePosts();
    renderPosts();
    return;
  }

  if (action === "bookmark") {
    const key = `ars_bookmark_${post.id}`;
    const active = localStorage.getItem(key) === "1";

    if (active) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, "1");
    }

    renderPosts();
    return;
  }

  if (action === "view") {
    post.views += 1;
    savePosts();
    renderPosts();
    return;
  }

  if (action === "comment") {
    openComments(post.id);
  }
}

/* -------------------------------------------------------
   COMMENTS
------------------------------------------------------- */

function openComments(postId) {
  const post = findPost(postId);

  if (!post) return;

  currentCommentPost = post;
  $("commentsModal").classList.add("open");

  renderComments();
}

function renderComments() {
  const post = currentCommentPost;

  if (!post) return;

  const list = $("commentsList");

  if (!post.comments_data.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i data-lucide="message-circle"></i>
        </div>
        <h2>No comments yet</h2>
        <p>Be the first to comment.</p>
      </div>
    `;

    refreshIcons();
    return;
  }

  list.innerHTML = post.comments_data.map((comment) => `
    <div class="comment">
      <strong>${esc(comment.name || "User")}</strong>
      <span>${esc(comment.text || "")}</span>
    </div>
  `).join("");

  refreshIcons();
}

function sendComment() {
  const post = currentCommentPost;
  const input = $("commentInput");

  if (!post || !input) return;

  const text = input.value.trim();

  if (!text) return;

  post.comments_data.push({
    id: uid("comment"),
    user_id: currentUser.id,
    name: getUserName(),
    text,
    created_at: new Date().toISOString()
  });

  post.comments = post.comments_data.length;

  input.value = "";

  savePosts();
  renderComments();
  renderPosts();
}

/* -------------------------------------------------------
   STORIES
------------------------------------------------------- */

function normalizeStory(story) {
  return {
    id: story.id || uid("story"),
    user_id: story.user_id || story.userId || "unknown",
    display_name:
      story.display_name ||
      story.name ||
      "User",
    username:
      story.username ||
      "user",
    avatar:
      story.avatar ||
      "",
    text:
      String(story.text || ""),
    image:
      story.image ||
      story.image_url ||
      "",
    created_at:
      story.created_at ||
      story.createdAt ||
      new Date().toISOString(),
    viewed: Boolean(story.viewed)
  };
}

function loadStories() {
  let stored = readJSON(STORIES_KEY, null);

  if (!Array.isArray(stored)) {
    const legacy = readJSON(LEGACY_STORIES_KEY, []);

    if (Array.isArray(legacy) && legacy.length) {
      stored = legacy.map(normalizeStory);
      writeJSON(STORIES_KEY, stored);
    } else {
      stored = [];
    }
  }

  stories = stored.map(normalizeStory);
}

function saveStories() {
  writeJSON(STORIES_KEY, stories);
}

function renderStories() {
  const container = $("stories");

  if (!container) return;

  const grouped = [];

  const ownStories = stories.filter(
    (story) =>
      String(story.user_id) === String(currentUser.id)
  );

  grouped.push({
    id: "you",
    display_name: "You",
    username: currentUser.username || "user",
    avatar: currentUser.avatar || "",
    own: true,
    stories: ownStories
  });

  const groups = new Map();

  stories
    .filter(
      (story) =>
        String(story.user_id) !== String(currentUser.id)
    )
    .forEach((story) => {
      const key = String(
        story.user_id || story.username || story.display_name
      );

      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          display_name: story.display_name,
          username: story.username,
          avatar: story.avatar,
          stories: []
        });
      }

      groups.get(key).stories.push(story);
    });

  groups.forEach((group) => grouped.push(group));

  if (!grouped.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = grouped.map((group) => {
    const letter =
      (group.display_name || "R")
        .trim()
        .charAt(0)
        .toUpperCase() || "R";

    let avatar = `
      <span class="avatar story-avatar">
        ${esc(letter)}
      </span>
    `;

    if (group.avatar) {
      avatar = `
        <span class="avatar story-avatar">
          <img src="${esc(group.avatar)}" alt="">
        </span>
      `;
    }

    if (group.display_name === "Wheel") {
      avatar = `
        <span class="avatar story-avatar story-wheel">
          <i data-lucide="circle-dot"></i>
        </span>
      `;
    }

    const plus = group.own
      ? `
        <span class="story-plus">
          <i data-lucide="plus"></i>
        </span>
      `
      : "";

    const check =
      !group.own && group.stories.length
        ? `
          <span class="story-check">
            <i data-lucide="check"></i>
          </span>
        `
        : "";

    return `
      <div class="story">
        <button
          class="story-button"
          type="button"
          data-story-group="${esc(group.id)}"
        >
          <span class="story-ring">
            ${avatar}
          </span>
          ${plus}
          ${check}
        </button>

        <span class="story-name">
          ${esc(group.display_name || "User")}
        </span>
      </div>
    `;
  }).join("");

  refreshIcons();
}

function getStoryGroup(id) {
  if (id === "you") {
    return stories.filter(
      (story) =>
        String(story.user_id) === String(currentUser.id)
    );
  }

  return stories.filter(
    (story) =>
      String(story.user_id) === String(id)
  );
}

function openStoryGroup(id) {
  const groupStories = getStoryGroup(id);

  if (!groupStories.length) {
    if (id === "you") {
      openStoryModal();
    }

    return;
  }

  currentStory = groupStories[0];

  currentStory.viewed = true;
  saveStories();

  renderStories();
  showStory(currentStory);
}

function showStory(story) {
  $("storyViewer").classList.add("open");

  $("storyViewerName").textContent =
    story.display_name || "User";

  $("storyViewerTime").textContent =
    timeAgo(story.created_at);

  const avatar = $("storyViewerAvatar");

  if (story.avatar) {
    avatar.innerHTML =
      `<img src="${esc(story.avatar)}" alt="">`;
  } else {
    avatar.textContent =
      (story.display_name || "R")
        .trim()
        .charAt(0)
        .toUpperCase();
  }

  const content = $("storyViewerContent");

  if (story.image) {
    content.innerHTML = `
      <img
        src="${esc(story.image)}"
        alt=""
        onerror="this.remove()"
      >
      ${
        story.text
          ? `<div>${esc(story.text)}</div>`
          : ""
      }
    `;
  } else {
    content.textContent =
      story.text || "";
  }

  refreshIcons();
}

function openStoryModal() {
  $("createStoryModal").classList.add("open");
}

function publishStory() {
  const text = $("createStoryText").value.trim();
  const image = $("createStoryImage").value.trim();

  if (!text && !image) {
    toast("Add text or an image.");
    return;
  }

  const story = normalizeStory({
    id: uid("story"),
    user_id: currentUser.id,
    display_name: getUserName(),
    username: currentUser.username,
    avatar: currentUser.avatar,
    text,
    image,
    created_at: new Date().toISOString(),
    viewed: false
  });

  stories.unshift(story);
  saveStories();
  renderStories();

  $("createStoryText").value = "";
  $("createStoryImage").value = "";
  $("createStoryModal").classList.remove("open");

  toast("Story added.");
}

/* -------------------------------------------------------
   CREATE POST
------------------------------------------------------- */

function openCreatePost() {
  $("createPostModal").classList.add("open");
}

function publishPost() {
  const text = $("createPostText").value.trim();
  const image = $("createPostImage").value.trim();

  if (!text && !image) {
    toast("Write something or add an image.");
    return;
  }

  const post = normalizePost({
    id: uid("post"),
    user_id: currentUser.id,
    display_name: getUserName(),
    username: currentUser.username,
    avatar: currentUser.avatar,
    verified: Boolean(currentUser.verified),
    text,
    image,
    created_at: new Date().toISOString(),
    likes: 0,
    comments: 0,
    reposts: 0,
    views: 0,
    liked: false,
     reposted: false,
    comments_data: [],
    hashtags: extractHashtags(text)
  });

  posts.unshift(post);
  savePosts();

  $("createPostText").value = "";
  $("createPostImage").value = "";
  $("createPostModal").classList.remove("open");

  renderPosts();
  renderProfile();
  renderTrending();

  toast("Post published.");
}

/* -------------------------------------------------------
   HASHTAGS / SEARCH
------------------------------------------------------- */

function getHashtagCounts() {
  const counts = {};

  posts.forEach((post) => {
    const tags = Array.isArray(post.hashtags)
      ? post.hashtags
      : extractHashtags(post.text);

    tags.forEach((tag) => {
      const key = tag.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
  });

  return counts;
}

function renderTrending() {
  const container = $("trendingList");

  const counts = getHashtagCounts();

  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!entries.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i data-lucide="flame"></i>
        </div>
        <h2>No trends yet</h2>
        <p>Hashtags will appear here when people use them.</p>
      </div>
    `;

    refreshIcons();
    return;
  }

  container.innerHTML = entries.map(
    ([tag, count], index) => `
      <button
        class="trending-item"
        type="button"
        data-trending-tag="${esc(tag)}"
      >
        <div class="trending-rank">#${index + 1}</div>
        <div class="trending-tag">#${esc(tag)}</div>
        <div class="trending-count">
          ${formatCount(count)} post${count === 1 ? "" : "s"}
        </div>
      </button>
    `
  ).join("");

  refreshIcons();
}

function search(value) {
  const query = value.trim().toLowerCase();

  if (!query) {
    $("searchHome").style.display = "block";
    $("searchResults").innerHTML = "";
    return;
  }

  $("searchHome").style.display = "none";

  const normalized = query.startsWith("#")
    ? query.slice(1)
    : query;

  const results = posts.filter((post) => {
    const tags = post.hashtags || extractHashtags(post.text);

    return (
      post.text.toLowerCase().includes(query) ||
      post.display_name.toLowerCase().includes(query) ||
      post.username.toLowerCase().includes(normalized) ||
      tags.some((tag) =>
        tag.toLowerCase().includes(normalized)
      )
    );
  });

  const container = $("searchResults");

  if (!results.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i data-lucide="search-x"></i>
        </div>
        <h2>No results</h2>
        <p>Nothing matched your search.</p>
      </div>
    `;

    refreshIcons();
    return;
  }

  container.innerHTML = results.map((post) => `
    <button
      class="search-result"
      type="button"
      data-search-post="${esc(post.id)}"
    >
      <div class="search-result-title">
        ${esc(post.display_name)}
      </div>
      <div class="search-result-meta">
        ${esc(post.text.slice(0, 140))}
      </div>
    </button>
  `).join("");
}

function searchHashtag(tag) {
  const clean = String(tag)
    .replace(/^#/, "")
    .toLowerCase();

  const input = $("searchInput");

  showPage("searchPage");

  input.value = `#${clean}`;

  $("searchHome").style.display = "none";

  const results = posts.filter((post) => {
    const tags =
      post.hashtags || extractHashtags(post.text);

    return tags
      .map((item) => item.toLowerCase())
      .includes(clean);
  });

  $("searchResults").innerHTML = results.length
    ? results.map((post) => `
        <button
          class="search-result"
          type="button"
          data-search-post="${esc(post.id)}"
        >
          <div class="search-result-title">
            ${esc(post.display_name)}
          </div>
          <div class="search-result-meta">
            ${esc(post.text.slice(0, 140))}
          </div>
        </button>
      `).join("")
    : `
      <div class="empty-state">
        <div class="empty-icon">
          <i data-lucide="hash"></i>
        </div>
        <h2>No posts</h2>
        <p>No posts currently use #${esc(clean)}.</p>
      </div>
    `;

  refreshIcons();
}

/* -------------------------------------------------------
   NAVIGATION
------------------------------------------------------- */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle(
      "active",
      page.id === pageId
    );
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle(
      "active",
      item.dataset.page === pageId
    );
  });

  currentPage = pageId;

  if (pageId === "trendingPage") {
    renderTrending();
  }

  if (pageId === "profilePage") {
    renderProfile();
    renderPosts(
      posts.filter(
        (post) =>
          String(post.user_id) ===
          String(currentUser.id)
      ),
      $("profilePostsList")
    );
  }

  if (pageId === "streakPage") {
    renderStreak();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* -------------------------------------------------------
   STREAK
------------------------------------------------------- */

function getStreakState() {
  const state = readJSON(
    STREAK_KEY,
    {
      count: 0,
      lastDay: ""
    }
  );

  return {
    count: Number(state.count || 0),
    lastDay: state.lastDay || ""
  };
}

function todayKey() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function registerDailyStreak() {
  const state = getStreakState();
  const today = todayKey();

  if (state.lastDay === today) {
    return state;
  }

  if (state.lastDay === yesterdayKey()) {
    state.count += 1;
  } else {
    state.count = 1;
  }

  state.lastDay = today;

  writeJSON(STREAK_KEY, state);

  return state;
}

function renderStreak() {
  const state = getStreakState();

  $("streakNumber").textContent = state.count;
  $("streakText").textContent =
    state.count === 1 ? "day streak" : "day streak";

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay();
  const adjusted = today === 0 ? 6 : today - 1;

  $("weekDots").innerHTML = days.map(
    (day, index) => `
      <div class="week-dot ${
        index <= adjusted && state.count > 0
          ? "done"
          : ""
      }">
        ${day}
      </div>
    `
  ).join("");

  $("streakDone").textContent =
    state.lastDay === todayKey()
      ? "Today's streak is active."
      : "Keep your streak alive today.";

  refreshIcons();
}

/* -------------------------------------------------------
   WHEEL
------------------------------------------------------- */

function getWheelState() {
  return readJSON(
    WHEEL_KEY,
    {
      week: "",
      spins: 0
    }
  );
}

function currentWeekKey() {
  const date = new Date();
  const first = new Date(
    date.getFullYear(),
    0,
    1
  );

  const week =
    Math.ceil(
      (
        (
          (
            date - first
          ) /
          86400000
        ) +
        first.getDay() +
        1
      ) /
      7
    );

  return `${date.getFullYear()}-${week}`;
}

function renderWheel() {
  const state = getWheelState();

  $("spinCounter").textContent =
    `${state.spins} ${state.spins === 1 ? "spin" : "spins"}`;

  $("planLabel").textContent =
    plan.charAt(0).toUpperCase() + plan.slice(1);
}

function spinWheel() {
  const state = getWheelState();
  const week = currentWeekKey();

  if (state.week !== week) {
    state.week = week;
    state.spins = 0;
  }

  const limit = plan === "premium" ? 5 : 1;

  if (state.spins >= limit) {
    toast("Your weekly spins are finished.");
    return;
  }

  state.spins += 1;
  writeJSON(WHEEL_KEY, state);

  const rotation =
    360 * (4 + Math.floor(Math.random() * 4));

  wheelRotation += rotation;

  $("wheel").style.transform =
    `rotate(${wheelRotation}deg)`;

  const challenges = [
    "Create a post today.",
    "Use a hashtag in your next post.",
    "View three posts.",
    "Keep your streak active.",
    "Share something from your day."
  ];

  const challenge =
    challenges[
      Math.floor(Math.random() * challenges.length)
    ];

  setTimeout(() => {
    $("challengeResult").textContent =
      `Challenge: ${challenge}`;

    toast("Wheel challenge selected.");
  }, 2200);

  renderWheel();
}

/* -------------------------------------------------------
   POST MENU
------------------------------------------------------- */

function openPostMenu(postId) {
  const post = findPost(postId);

  if (!post) return;

  const backdrop = $("postMenuBackdrop");

  backdrop.innerHTML = `
    <div
      class="modal"
      style="display:flex"
      data-inline-menu="true"
    >
      <div class="modal-card" style="max-width:380px">

        <div class="modal-header">
          <h2>Post</h2>

          <button
            class="modal-close"
            type="button"
            data-close-menu="true"
          >
            <i data-lucide="x"></i>
          </button>
        </div>

        <button
          class="secondary-button"
          style="width:100%;margin-bottom:10px"
          type="button"
          data-menu-action="share"
        >
          <i data-lucide="share-2"></i>
          Share
        </button>

        <button
          class="secondary-button"
          style="width:100%;margin-bottom:10px"
          type="button"
          data-menu-action="copy"
        >
          <i data-lucide="copy"></i>
          Copy text
        </button>

        <button
          class="secondary-button"
          style="width:100%"
          type="button"
          data-menu-action="bookmark"
        >
          <i data-lucide="bookmark"></i>
          Bookmark
        </button>

      </div>
    </div>
  `;

  backdrop.dataset.postId = postId;
  backdrop.classList.add("open");

  refreshIcons();
}

function closePostMenu() {
  const backdrop = $("postMenuBackdrop");

  backdrop.classList.remove("open");
  backdrop.innerHTML = "";
  delete backdrop.dataset.postId;
}

async function menuAction(action) {
  const post = findPost(
    $("postMenuBackdrop").dataset.postId
  );

  if (!post) return;

  if (action === "bookmark") {
    postAction("bookmark", post.id);
    closePostMenu();
    return;
  }

  if (action === "copy") {
    try {
      await navigator.clipboard.writeText(
        post.text || ""
      );

      toast("Post text copied.");
    } catch {
      toast("Copy is not available.");
    }

    closePostMenu();
    return;
  }

  if (action === "share") {
    const url =
      `${location.origin}${location.pathname}#post-${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "ARS",
          text: post.text || "ARS post",
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Post link copied.");
      }
    } catch {
      // Share cancelled.
    }

    closePostMenu();
  }
}

/* -------------------------------------------------------
   EVENTS
------------------------------------------------------- */

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  $("profileButton").addEventListener(
    "click",
    () => showPage("profilePage")
  );

  $("wheelButton").addEventListener(
    "click",
    () => showPage("wheelPage")
  );

  $("createPost").addEventListener(
    "click",
    openCreatePost
  );

  $("createPostClose").addEventListener(
    "click",
    () => $("createPostModal").classList.remove("open")
  );

  $("createStoryOpen").addEventListener(
    "click",
    () => {
      $("createPostModal").classList.remove("open");
      openStoryModal();
    }
  );

  $("createStoryClose").addEventListener(
    "click",
    () => $("createStoryModal").classList.remove("open")
  );

  $("publishPost").addEventListener(
    "click",
    publishPost
  );

  $("publishStory").addEventListener(
    "click",
    publishStory
  );

  $("storyViewerClose").addEventListener(
    "click",
    () => {
      $("storyViewer").classList.remove("open");
      currentStory = null;
    }
  );

  $("commentsClose").addEventListener(
    "click",
    () => {
      $("commentsModal").classList.remove("open");
      currentCommentPost = null;
    }
  );

  $("sendComment").addEventListener(
    "click",
    sendComment
  );

  $("commentInput").addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendComment();
      }
    }
  );

  $("searchInput").addEventListener(
    "input",
    (event) => search(event.target.value)
  );

  $("spinButton").addEventListener(
    "click",
    spinWheel
  );

  $("openStreakFromWheel").addEventListener(
    "click",
    () => showPage("streakPage")
  );

  $("profileEditButton").addEventListener(
    "click",
    () => {
      toast(
        "Profile editing is managed from your profile settings."
      );
    }
  );

  $("stories").addEventListener(
    "click",
    (event) => {
      const button =
        event.target.closest("[data-story-group]");

      if (!button) return;

      openStoryGroup(
        button.dataset.storyGroup
      );
    }
  );

  $("feed").addEventListener(
    "click",
    (event) => {
      const action =
        event.target.closest("[data-action]");

      if (action) {
        postAction(
          action.dataset.action,
          action.dataset.id
        );
        return;
      }

      const menu =
        event.target.closest("[data-menu]");

      if (menu) {
        openPostMenu(menu.dataset.menu);
        return;
      }

      const hashtag =
        event.target.closest("[data-hashtag]");

      if (hashtag) {
        event.preventDefault();
        event.stopPropagation();

        searchHashtag(
          hashtag.dataset.hashtag
        );
      }
    }
  );

  $("searchResults").addEventListener(
    "click",
    (event) => {
      const result =
        event.target.closest("[data-search-post]");

      if (!result) return;

      const post = findPost(
        result.dataset.searchPost
      );

      if (!post) return;

      showPage("homePage");

      requestAnimationFrame(() => {
        const element =
          document.querySelector(
            `[data-post-id="${CSS.escape(post.id)}"]`
          );

        element?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
    }
  );

  $("trendingList").addEventListener(
    "click",
    (event) => {
      const item =
        event.target.closest("[data-trending-tag]");

      if (!item) return;

      searchHashtag(
        item.dataset.trendingTag
      );
    }
  );

  $("postMenuBackdrop").addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        $("postMenuBackdrop")
      ) {
        closePostMenu();
        return;
      }

      const close =
        event.target.closest("[data-close-menu]");

      if (close) {
        closePostMenu();
        return;
      }

      const action =
        event.target.closest("[data-menu-action]");

      if (action) {
        menuAction(
          action.dataset.menuAction
        );
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape") return;

      document.querySelectorAll(".modal.open")
        .forEach((modal) => {
          modal.classList.remove("open");
        });

      closePostMenu();
    }
  );
}

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */

function initialize() {
  normalizeUser();

  loadPosts();
  loadStories();

  registerDailyStreak();

  renderProfile();
  renderStories();
  renderPosts();
  renderTrending();
  renderStreak();
  renderWheel();

  bindEvents();

  refreshIcons();

  window.ARSHome = {
    posts,
    stories,

    refresh: () => {
      loadPosts();
      loadStories();
      renderStories();
      renderPosts();
      renderTrending();
      renderProfile();
    },

    createPost: publishPost,
    createStory: publishStory,
    openStory: openStoryGroup,
    searchHashtag,
    showPage
  };
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initialize,
    { once: true }
  );
} else {
  initialize();
    }
