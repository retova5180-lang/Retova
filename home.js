const KEYS = {
  user: "ars_user",
  letter: "ars_letter",
  letterColor: "ars_letter_color",
  bg: "ars_background",
  posts: "ars_local_posts",
  stories: "ars_local_stories",
  streak: "ars_streak_state",
  wheel: "ars_wheel_week",
  plan: "ars_plan"
};

let currentUser = {};
let posts = [];
let stories = [];
let currentPage = "homePage";
let currentCommentPost = null;
let currentStory = null;
let wheelRotation = 0;

const $ = id => document.getElementById(id);

const esc = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    char =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]
  );

const uid = prefix =>
  `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

const fmt = number => {
  number = Number(number || 0);

  if (number >= 1000000) {
    return `${(number / 1000000)
      .toFixed(1)
      .replace(".0", "")}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000)
      .toFixed(1)
      .replace(".0", "")}K`;
  }

  return String(number);
};

const timeAgo = iso => {
  const seconds = Math.max(
    0,
    (Date.now() - new Date(iso).getTime()) / 1000
  );

  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }

  return `${Math.floor(seconds / 86400)}d`;
};

const refreshIcons = () => {
  window.lucide?.createIcons?.();
};

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2200);
}

function normalizeUser() {
  currentUser = read(KEYS.user, {
    id: "local-user",
    display_name: "You",
    username: "you",
    verified: false
  });

  if (!currentUser.id) {
    currentUser.id = "local-user";
  }

  currentUser.display_name =
    currentUser.display_name ||
    currentUser.name ||
    "You";

  currentUser.username =
    currentUser.username ||
    "you";
}

function getUser() {
  return {
    ...currentUser,

    letter:
      localStorage.getItem(KEYS.letter) ||
      currentUser.letter ||
      "R",

    letterColor:
      localStorage.getItem(KEYS.letterColor) ||
      currentUser.letterColor ||
      "#8d2cff"
  };
}

function avatarMarkup(user = {}, cls = "avatar") {

  if (user.avatar === "wheel") {
    return `
      <div class="${cls} wheel-avatar">
        <i data-lucide="orbit"></i>
      </div>
    `;
  }

  const image =
    user.avatar &&
    /^https?:|^data:image/.test(user.avatar);

  const letter =
    (
      user.letter ||
      localStorage.getItem(KEYS.letter) ||
      "R"
    )
      .slice(0, 1)
      .toUpperCase();

  const color =
    user.letterColor ||
    localStorage.getItem(KEYS.letterColor) ||
    "#8d2cff";

  if (image) {
    return `
      <div class="${cls}">
        <img src="${esc(user.avatar)}" alt="">
      </div>
    `;
  }

  return `
    <div
      class="${cls}"
      style="--avatar:${esc(color)}"
    >
      <span>${esc(letter)}</span>
    </div>
  `;
}

function extractHashtags(text = "") {
  return [
    ...text.matchAll(
      /(^|\s)#([a-zA-Z0-9_]+)/g
    )
  ]
    .map(match => match[2].toLowerCase())
    .filter(
      (value, index, array) =>
        array.indexOf(value) === index
    );
}

function richText(text = "") {
  return esc(text).replace(
    /(^|\s)#([a-zA-Z0-9_]+)/g,
    (match, space, tag) =>
      `${space}<button
        class="hashtag"
        data-hashtag="${esc(tag)}"
      >#${esc(tag)}</button>`
  );
}

function normalizePost(post) {
  return {
    ...post,

    id: post.id || uid("post"),

    user_id:
      post.user_id ||
      "local",

    display_name:
      post.display_name ||
      "You",

    username:
      post.username ||
      "you",

    avatar:
      post.avatar ||
      "",

    letter:
      post.letter ||
      "R",

    letterColor:
      post.letterColor ||
      "#8d2cff",

    verified:
      Boolean(post.verified),

    text:
      post.text ||
      "",

    image:
      post.image ||
      "",

    created_at:
      post.created_at ||
      new Date().toISOString(),

    likes:
      Number(post.likes || 0),

    comments:
      Number(post.comments || 0),

    reposts:
      Number(post.reposts || 0),

    views:
      Number(post.views || 0),

    liked:
      Boolean(post.liked),

    reposted:
      Boolean(post.reposted),

    bookmarked:
      Boolean(post.bookmarked),

    comments_data:
      Array.isArray(post.comments_data)
        ? post.comments_data
        : [],

    hashtags:
      Array.isArray(post.hashtags)
        ? post.hashtags
        : extractHashtags(post.text)
  };
}

function normalizeStory(story) {
  return {
    ...story,

    id:
      story.id ||
      uid("story"),

    user_id:
      story.user_id ||
      "local",

    display_name:
      story.display_name ||
      "You",

    username:
      story.username ||
      "you",

    avatar:
      story.avatar ||
      "",

    letter:
      story.letter ||
      "R",

    letterColor:
      story.letterColor ||
      "#8d2cff",

    image:
      story.image ||
      "",

    text:
      story.text ||
      "",

    textColor:
      story.textColor ||
      "#fff",

    textPosition:
      story.textPosition ||
      "center",

    created_at:
      story.created_at ||
      new Date().toISOString()
  };
}

/*
 * Demo mode is intentionally opt-in.
 *
 * Open:
 * ?demo=1
 *
 * It only exists so the visual reference
 * can be inspected without inserting demo
 * data into the normal production state.
 */

function demoEnabled() {
  return (
    new URLSearchParams(
      location.search
    ).get("demo") === "1"
  );
}

const demoImages = [
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85"
];

function ensureDemo() {

  if (!demoEnabled()) {
    return;
  }

  if (
    !localStorage.getItem(KEYS.posts) ||
    !read(KEYS.posts, []).length
  ) {

    const demoPosts = [

      {
        id: "demo-lina",
        user_id: "demo-lina",
        display_name: "Lina",
        username: "lina.ae",
        letter: "L",
        letterColor: "#9b38ff",
        verified: true,
        text:
          "Sunset always hits different 💜",
        image: demoImages[0],
        likes: 2400,
        comments: 186,
        reposts: 312,
        views: 48000,
        created_at:
          new Date(
            Date.now() -
            12 * 60000
          ).toISOString()
      },

      {
        id: "demo-apple",
        user_id: "demo-apple",
        display_name: "Apple",
        username: "apple",
        avatar:
          "https://logo.clearbit.com/apple.com",
        verified: true,
        text:
          "Apple Intelligence expands to more languages later this year.",
        image: demoImages[1],
        likes: 28400,
        comments: 1800,
        reposts: 3900,
        views: 2400000,
        created_at:
          new Date(
            Date.now() -
            28 * 60000
          ).toISOString()
      },

      {
        id: "demo-noah",
        user_id: "demo-noah",
        display_name: "Noah",
        username: "noah.vibes",
        letter: "N",
        letterColor: "#8d2cff",
        verified: true,
        text:
          "Focused on the journey. #focus #life",
        image: demoImages[2],
        likes: 980,
        comments: 72,
        reposts: 44,
        views: 12000,
        created_at:
          new Date(
            Date.now() -
            45 * 60000
          ).toISOString()
      }

    ];

    write(
      KEYS.posts,
      demoPosts.map(normalizePost)
    );
  }

  if (
    !localStorage.getItem(KEYS.stories) ||
    !read(KEYS.stories, []).length
  ) {

    const demoStories = [

      {
        id: "s-lina",
        user_id: "demo-lina",
        display_name: "Lina",
        username: "lina.ae",
        letter: "L",
        letterColor: "#9b38ff",
        image: demoImages[0],
        text: "Golden hour",
        created_at:
          new Date(
            Date.now() -
            20 * 60000
          ).toISOString()
      },

      {
        id: "s-noah",
        user_id: "demo-noah",
        display_name: "Noah",
        username: "noah.vibes",
        letter: "N",
        letterColor: "#8d2cff",
        image: demoImages[1],
        text: "Focus",
        created_at:
          new Date(
            Date.now() -
            35 * 60000
          ).toISOString()
      },

      {
        id: "s-sara",
        user_id: "demo-sara",
        display_name: "Sara",
        username: "sara",
        letter: "S",
        letterColor: "#a946ff",
        image: demoImages[2],
        text: "Today",
        created_at:
          new Date(
            Date.now() -
            50 * 60000
          ).toISOString()
      },

      {
        id: "s-wheel",
        user_id: "demo-wheel",
        display_name: "Wheel",
        username: "ars.wheel",
        avatar: "wheel",
        image: demoImages[1],
        text: "Your weekly challenge",
        created_at:
          new Date(
            Date.now() -
            60 * 60000
          ).toISOString()
      },

      {
        id: "s-apple",
        user_id: "demo-apple",
        display_name: "Apple",
        username: "apple",
        avatar:
          "https://logo.clearbit.com/apple.com",
        image: demoImages[1],
        text: "Innovation",
        created_at:
          new Date(
            Date.now() -
            70 * 60000
          ).toISOString()
      },

      {
        id: "s-ferrari",
        user_id: "demo-ferrari",
        display_name: "Ferrari",
        username: "ferrari",
        avatar:
          "https://logo.clearbit.com/ferrari.com",
        image: demoImages[2],
        text: "Drive",
        created_at:
          new Date(
            Date.now() -
            80 * 60000
          ).toISOString()
      },

      {
        id: "s-bmw",
        user_id: "demo-bmw",
        display_name: "BMW",
        username: "bmw",
        avatar:
          "https://logo.clearbit.com/bmw.com",
        image: demoImages[0],
        text: "The road",
        created_at:
          new Date(
            Date.now() -
            90 * 60000
          ).toISOString()
      }

    ];

    write(
      KEYS.stories,
      demoStories.map(normalizeStory)
    );
  }
}

function loadData() {
  posts = read(
    KEYS.posts,
    []
  ).map(normalizePost);

  stories = read(
    KEYS.stories,
    []
  ).map(normalizeStory);
}

function savePosts() {
  write(KEYS.posts, posts);
}

function saveStories() {
  write(KEYS.stories, stories);
}

function renderTopAvatar() {
  $("profileButton").innerHTML =
    avatarMarkup(
      getUser(),
      "avatar"
    );

  refreshIcons();
}

function renderStories() {

  const me = getUser();

  const mine = stories.filter(
    story =>
      String(story.user_id) ===
      String(me.id)
  );

  const people = [];

  if (mine[0]) {

    people.push({
      story: mine[0],
      mine: true
    });

  } else {

    people.push({
      story: {
        ...me,
        id: "new",
        image: "",
        text: ""
      },
      mine: true
    });

  }

  const seen = new Set([
    String(me.id)
  ]);

  stories.forEach(story => {

    if (
      !seen.has(
        String(story.user_id)
      )
    ) {

      people.push({
        story,
        mine: false
      });

      seen.add(
        String(story.user_id)
      );
    }

  });

  $("stories").innerHTML =
    people
      .map(({ story, mine }) => {

        const name =
          mine
            ? "You"
            : story.display_name;

        const plus =
          mine
            ? `
              <span class="story-plus">
                <i data-lucide="plus"></i>
              </span>
            `
            : "";

        const verified =
          !mine &&
          story.verified
            ? `
              <span class="verified">
                <i data-lucide="badge-check"></i>
              </span>
            `
            : "";

        return `
          <button
            class="story-item"
            data-story-group="${esc(story.user_id)}"
          >
            ${avatarMarkup(
              story,
              "story-avatar"
            )}

            ${plus}

            <span class="story-name">
              ${esc(name)}
              ${verified}
            </span>
          </button>
        `;
      })
      .join("");

  refreshIcons();
}

function postAvatar(post) {
  return avatarMarkup(
    {
      ...post,
      letter:
        post.letter ||
        "R",
      letterColor:
        post.letterColor ||
        "#8d2cff"
    },
    "post-avatar"
  );
}

function renderPosts(
  list = posts,
  target = $("feed")
) {

  if (!list.length) {

    target.innerHTML = `
      <div class="empty-feed">

        <i data-lucide="file-text"></i>

        <h2>No posts yet</h2>

        <p>
          Create a post and it will appear here.
        </p>

      </div>
    `;

    refreshIcons();

    return;
  }

  target.innerHTML =
    list
      .map(post => `

        <article
          class="post-card"
          data-post-id="${esc(post.id)}"
        >

          <div class="post-head">

            ${postAvatar(post)}

            <div class="post-user">

              <strong>
                ${esc(post.display_name)}

                ${
                  post.verified
                    ? `
                      <span class="verified">
                        <i data-lucide="badge-check"></i>
                      </span>
                    `
                    : ""
                }

              </strong>

              <span>
                @${esc(post.username)}
                ·
                ${timeAgo(post.created_at)}
              </span>

            </div>

            <button
              class="more"
              data-menu="${esc(post.id)}"
            >
              <i data-lucide="more-horizontal"></i>
            </button>

          </div>

          <div class="post-text">
            ${richText(post.text)}
          </div>

          ${
            post.image
              ? `
                <img
                  class="post-image"
                  src="${esc(post.image)}"
                  alt=""
                  loading="lazy"
                >
              `
              : ""
          }

          <div class="actions">

            <button
              class="${post.liked ? "liked" : ""}"
              data-action="like"
              data-id="${esc(post.id)}"
            >
              <i data-lucide="heart"></i>
              <span>${fmt(post.likes)}</span>
            </button>

            <button
              data-action="comment"
              data-id="${esc(post.id)}"
            >
              <i data-lucide="message-circle"></i>
              <span>${fmt(post.comments)}</span>
            </button>

            <button
              class="${post.reposted ? "reposted" : ""}"
              data-action="repost"
              data-id="${esc(post.id)}"
            >
              <i data-lucide="repeat-2"></i>
              <span>${fmt(post.reposts)}</span>
            </button>

            <button
              class="${post.bookmarked ? "bookmarked" : ""}"
              data-action="bookmark"
              data-id="${esc(post.id)}"
            >
              <i data-lucide="bookmark"></i>
            </button>

            <button
              class="views"
              data-action="view"
              data-id="${esc(post.id)}"
            >
              <i data-lucide="eye"></i>
              <span>${fmt(post.views)}</span>
            </button>

          </div>

        </article>

      `)
      .join("");

  refreshIcons();
}

function findPost(id) {
  return posts.find(
    post =>
      String(post.id) ===
      String(id)
  );
}

function postAction(
  action,
  id
) {

  const post = findPost(id);

  if (!post) {
    return;
  }

  if (action === "like") {

    post.liked =
      !post.liked;

    post.likes =
      Math.max(
        0,
        post.likes +
        (post.liked ? 1 : -1)
      );
  }

  if (action === "repost") {

    post.reposted =
      !post.reposted;

    post.reposts =
      Math.max(
        0,
        post.reposts +
        (post.reposted ? 1 : -1)
      );
  }

  if (action === "bookmark") {

    post.bookmarked =
      !post.bookmarked;
  }

  if (action === "view") {

    post.views++;

    toast(
      "View counted."
    );
  }

  if (action === "comment") {

    openComments(post);

    return;
  }

  savePosts();

  renderPosts();

  renderProfilePosts();

  renderTrending();
}

function renderProfile() {

  const user = getUser();

  $("profileHero").innerHTML = `

    <div class="profile-card">

      ${avatarMarkup(
        user,
        "profile-avatar"
      )}

      <div>

        <h1>
          ${esc(user.display_name)}
        </h1>

        <p>
          @${esc(user.username)}
        </p>

        <span>
          ${esc(
            user.bio ||
            "Welcome to ARS."
          )}
        </span>

      </div>

    </div>

  `;

  renderProfilePosts();
}

function renderProfilePosts() {

  if (!$("profilePostsList")) {
    return;
  }

  renderPosts(
    posts.filter(
      post =>
        String(post.user_id) ===
        String(getUser().id)
    ),
    $("profilePostsList")
  );
}

function extractTrendCounts() {

  const counts = {};

  posts.forEach(post => {

    (
      post.hashtags ||
      extractHashtags(post.text)
    ).forEach(tag => {

      counts[tag] =
        (counts[tag] || 0) + 1;

    });

  });

  return counts;
}

function renderTrending() {

  const counts =
    extractTrendCounts();

  const items =
    Object.entries(counts)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 10);

  if (!items.length) {

    $("trendingList").innerHTML = `
      <div class="empty-state">

        <i data-lucide="flame"></i>

        <h2>No trends yet</h2>

        <p>
          Use hashtags in posts to create trends.
        </p>

      </div>
    `;

  } else {

    $("trendingList").innerHTML =
      items
        .map(
          ([tag, count], index) => `
            <button
              class="trend"
              data-trending-tag="${esc(tag)}"
            >

              <b>
                ${index + 1}
              </b>

              <div>

                <strong>
                  #${esc(tag)}
                </strong>

                <span>
                  ${fmt(count)}
                  post${count === 1 ? "" : "s"}
                </span>

              </div>

              <i data-lucide="chevron-right"></i>

            </button>
          `
        )
        .join("");
  }

  refreshIcons();
}

function showPage(id) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.toggle(
        "active",
        page.id === id
      );

    });

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.page === id
      );

    });

  currentPage = id;

  if (
    id ===
    "trendingPage"
  ) {
    renderTrending();
  }

  if (
    id ===
    "profilePage"
  ) {
    renderProfile();
  }

  if (
    id ===
    "streakPage"
  ) {
    renderStreak();
  }

  if (
    id ===
    "wheelPage"
  ) {

    if (!item) return;

    const action = item.dataset.menuAction;
    const postId = item.dataset.postId || "";

    const post = posts.find(
      (entry) => String(entry.id) === String(postId)
    );

    closeMenu();

    if (!post) {
      toast("Post not found.");
      return;
    }

    await handlePostMenuAction(action, post);
  }
);

async function handlePostMenuAction(action, post) {
  if (!post) return;

  if (action === "repost") {
    const index = posts.findIndex(
      (entry) => String(entry.id) === String(post.id)
    );

    if (index === -1) return;

    posts[index].reposted = !Boolean(posts[index].reposted);

    posts[index].reposts = Math.max(
      0,
      Number(posts[index].reposts || 0) +
        (posts[index].reposted ? 1 : -1)
    );

    savePosts();
    renderPosts();
    renderProfile();
    renderTrending();

    toast(
      posts[index].reposted
        ? "Reposted."
        : "Repost removed."
    );

    return;
  }

  if (action === "bookmark") {
    const key = `ars_bookmark_${post.id}`;
    const saved =
      localStorage.getItem(key) === "true";

    localStorage.setItem(
      key,
      String(!saved)
    );

    toast(
      saved
        ? "Removed from bookmarks."
        : "Saved to bookmarks."
    );

    return;
  }

  if (action === "share") {
    const shareText =
      post.text ||
      "Check out this post on ARS.";

    const shareUrl =
      `${window.location.origin}${window.location.pathname}#post-${post.id}`;

    if (
      navigator.share &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: "ARS",
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        if (error?.name !== "AbortError") {
          toast("Unable to share this post.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${shareText}\n${shareUrl}`
        );

        toast("Post link copied.");
      } catch (error) {
        toast("Unable to copy the post link.");
      }
    }

    return;
  }

  if (action === "copy") {
    try {
      await navigator.clipboard.writeText(
        post.text || ""
      );

      toast("Post text copied.");
    } catch (error) {
      toast("Unable to copy the text.");
    }

    return;
  }

  if (action === "report") {
    toast("Report submitted.");

    if (supabaseClient && currentUser?.id) {
      try {
        await supabaseClient
          .from("reports")
          .insert({
            reporter_id: currentUser.id,
            post_id: post.id,
            reason: "user_report"
          });
      } catch (error) {
        // Keep the local UI usable if reports are unavailable.
      }
    }

    return;
  }

  if (action === "not-interested") {
    const hiddenKey =
      `ars_hidden_post_${post.id}`;

    localStorage.setItem(
      hiddenKey,
      "true"
    );

    posts = posts.filter(
      (entry) =>
        String(entry.id) !==
        String(post.id)
    );

    savePosts();
    renderPosts();
    renderProfile();
    renderTrending();

    toast("Post hidden.");
  }
}

function openComments(postId) {
  const post = posts.find(
    (entry) =>
      String(entry.id) === String(postId)
  );

  if (!post) {
    toast("Post not found.");
    return;
  }

  currentCommentPost = post;

  const modal = $("commentsModal");
  const list = $("commentsList");

  if (!modal || !list) return;

  const comments =
    Array.isArray(post.comments_data)
      ? post.comments_data
      : [];

  if (!comments.length) {
    list.innerHTML = `
      <div class="empty-state compact">
        <i data-lucide="message-circle"></i>
        <h2>No comments yet</h2>
        <p>Be the first to comment.</p>
      </div>
    `;
  } else {
    list.innerHTML = comments
      .map((comment) => {
        const name =
          comment.display_name ||
          comment.username ||
          "User";

        const username =
          comment.username
            ? `@${comment.username}`
            : "";

        return `
          <article class="comment-item">
            <div class="avatar small">
              ${avatarMarkup({
                avatar: comment.avatar,
                letter:
                  comment.letter ||
                  String(name).charAt(0),
                color:
                  comment.letter_color ||
                  "#9b38ff"
              })}
            </div>

            <div class="comment-content">
              <div class="comment-meta">
                <strong>${esc(name)}</strong>
                ${
                  username
                    ? `<span>${esc(username)}</span>`
                    : ""
                }
              </div>

              <p>${richText(
                comment.text || ""
              )}</p>
            </div>
          </article>
        `;
      })
      .join("");
  }

  modal.classList.add("open");

  refreshIcons();

  const input = $("commentInput");

  if (input) {
    input.value = "";
    setTimeout(
      () => input.focus(),
      100
    );
  }
}

function closeComments() {
  const modal = $("commentsModal");

  if (modal) {
    modal.classList.remove("open");
  }

  currentCommentPost = null;
}

async function sendComment() {
  if (!currentCommentPost) return;

  const input = $("commentInput");

  if (!input) return;

  const text =
    input.value.trim();

  if (!text) {
    toast("Write a comment first.");
    return;
  }

  const user = getUser();

  const comment = {
    id: uid("comment"),
    user_id:
      user?.id ||
      "",
    display_name:
      getUserName(),
    username:
      user?.username ||
      "",
    avatar:
      user?.avatar ||
      "",
    letter:
      localStorage.getItem(
        "ars_letter"
      ) ||
      "R",
    letter_color:
      localStorage.getItem(
        "ars_letter_color"
      ) ||
      "#9b38ff",
    text,
    created_at:
      new Date().toISOString()
  };

  const index =
    posts.findIndex(
      (entry) =>
        String(entry.id) ===
        String(currentCommentPost.id)
    );

  if (index === -1) return;

  if (
    !Array.isArray(
      posts[index].comments_data
    )
  ) {
    posts[index].comments_data = [];
  }

  posts[index].comments_data.push(
    comment
  );

  posts[index].comments =
    posts[index].comments_data.length;

  savePosts();

  currentCommentPost =
    posts[index];

  input.value = "";

  renderPosts();
  renderProfile();

  openComments(
    currentCommentPost.id
  );

  toast("Comment added.");
}

function increasePostView(postId) {
  const index =
    posts.findIndex(
      (entry) =>
        String(entry.id) ===
        String(postId)
    );

  if (index === -1) return;

  if (
    sessionStorage.getItem(
      `ars_viewed_${postId}`
    ) === "true"
  ) {
    return;
  }

  sessionStorage.setItem(
    `ars_viewed_${postId}`,
    "true"
  );

  posts[index].views =
    Number(posts[index].views || 0) +
    1;

  savePosts();
}

function openCreatePost() {
  const modal =
    $("createPostModal");

  if (!modal) return;

  modal.classList.add("open");

  const avatar =
    $("composeAvatar");

  if (avatar) {
    avatar.innerHTML =
      avatarMarkup(getUser());
  }

  refreshIcons();

  setTimeout(() => {
    $("createPostText")?.focus();
  }, 100);
}

function closeCreatePost() {
  const modal =
    $("createPostModal");

  if (modal) {
    modal.classList.remove("open");
  }
}

function openCreateStory() {
  const modal =
    $("createStoryModal");

  if (!modal) return;

  modal.classList.add("open");

  resetStoryEditor();

  refreshIcons();
}

function closeCreateStory() {
  const modal =
    $("createStoryModal");

  if (modal) {
    modal.classList.remove("open");
  }
}

function resetStoryEditor() {
  const input =
    $("storyImage");

  const text =
    $("storyText");

  const position =
    $("storyPosition");

  const color =
    $("storyTextColor");

  const image =
    $("storyImagePreview");

  const empty =
    $("storyCanvasEmpty");

  const textPreview =
    $("storyTextPreview");

  if (input) input.value = "";

  if (text) text.value = "";

  if (position) {
    position.value = "center";
  }

  if (color) {
    color.value = "#ffffff";
  }

  if (image) {
    image.removeAttribute("src");
    image.style.display = "none";
  }

  if (empty) {
    empty.style.display = "flex";
  }

  if (textPreview) {
    textPreview.textContent = "";
    textPreview.style.color =
      "#ffffff";
    textPreview.style.top =
      "50%";
    textPreview.style.transform =
      "translateY(-50%)";
  }
}

function updateStoryPreview() {
  const text =
    $("storyText")?.value.trim() ||
    "";

  const position =
    $("storyPosition")?.value ||
    "center";

  const color =
    $("storyTextColor")?.value ||
    "#ffffff";

  const preview =
    $("storyTextPreview");

  if (!preview) return;

  preview.textContent = text;
  preview.style.color = color;

  if (position === "top") {
    preview.style.top = "12%";
    preview.style.transform =
      "translateY(0)";
  } else if (
    position === "bottom"
  ) {
    preview.style.top = "88%";
    preview.style.transform =
      "translateY(-100%)";
  } else {
    preview.style.top = "50%";
    preview.style.transform =
      "translateY(-50%)";
  }
}

function readFileAsDataURL(file) {
  return new Promise(
    (resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(
          String(
            reader.result || ""
          )
        );

      reader.onerror = () =>
        reject(
          new Error(
            "Unable to read file."
          )
        );

      reader.readAsDataURL(file);
    }
  );
}

async function publishStory() {
  const file =
    $("storyImage")?.files?.[0];

  const text =
    $("storyText")?.value.trim() ||
    "";

  if (!file) {
    toast("Choose a photo first.");
    return;
  }

  if (!file.type.startsWith("image/")) {
    toast("Please choose an image.");
    return;
  }

  try {
    const image =
      await readFileAsDataURL(file);

    const position =
      $("storyPosition")?.value ||
      "center";

    const textColor =
      $("storyTextColor")?.value ||
      "#ffffff";

    const user =
      getUser();

    const story =
      normalizeStory({
        id: uid("story"),
        user_id:
          user?.id || "",
        display_name:
          getUserName(),
        username:
          user?.username || "",
        avatar:
          user?.avatar || "",
        letter:
          localStorage.getItem(
            "ars_letter"
          ) ||
          "R",
        letter_color:
          localStorage.getItem(
            "ars_letter_color"
          ) ||
          "#9b38ff",
        image,
        text,
        text_color:
          textColor,
        text_position:
          position,
        created_at:
          new Date().toISOString()
      });

    stories.unshift(story);

    saveStories();

    closeCreateStory();

    renderStories();

    toast("Story shared.");
  } catch (error) {
    toast("Unable to create story.");
  }
}

async function publishPost() {
  const textarea =
    $("createPostText");

  const fileInput =
    $("createPostImage");

  const text =
    textarea?.value.trim() ||
    "";

  const file =
    fileInput?.files?.[0];

  if (!text && !file) {
    toast("Write something or add an image.");
    return;
  }

  if (
    file &&
    !file.type.startsWith("image/")
  ) {
    toast("Please choose an image.");
    return;
  }

  try {
    let image = "";

    if (file) {
      image =
        await readFileAsDataURL(file);
    }

    const user =
      getUser();

    const post =
      normalizePost({
        id: uid("post"),
        user_id:
          user?.id || "",
        display_name:
          getUserName(),
        username:
          user?.username || "",
        avatar:
          user?.avatar || "",
        verified:
          Boolean(
            user?.verified
          ),
        text,
        image,
        created_at:
          new Date().toISOString(),
        likes: 0,
        comments: 0,
        reposts: 0,
        views: 0,
        liked: false,
        reposted: false,
        comments_data: [],
        hashtags:
          extractHashtags(text)
      });

    posts.unshift(post);

    savePosts();

    if (textarea) {
      textarea.value = "";
    }

    if (fileInput) {
      fileInput.value = "";
    }

    const preview =
      $("postImagePreview");

    if (preview) {
      preview.innerHTML = "";
    }

    closeCreatePost();

    renderPosts();
    renderProfile();
    renderTrending();

    toast("Post published.");
  } catch (error) {
    toast("Unable to publish post.");
  }
}

function openStoryViewer(story) {
  if (!story) return;

  const viewer =
    $("storyViewer");

  const media =
    $("storyViewerMedia");

  const text =
    $("storyViewerText");

  const user =
    $("storyViewerUser");

  if (
    !viewer ||
    !media ||
    !text ||
    !user
  ) {
    return;
  }

  media.innerHTML = story.image
    ? `<img src="${escAttr(story.image)}" alt="">`
    : "";

  text.textContent =
    story.text || "";

  text.style.color =
    story.text_color ||
    "#ffffff";

  const position =
    story.text_position ||
    "center";

  if (position === "top") {
    text.style.top = "12%";
    text.style.transform =
      "translateY(0)";
  } else if (
    position === "bottom"
  ) {
    text.style.top = "88%";
    text.style.transform =
      "translateY(-100%)";
  } else {
    text.style.top = "50%";
    text.style.transform =
      "translateY(-50%)";
  }

  user.innerHTML = `
    <div class="story-user-avatar">
      ${avatarMarkup(story)}
    </div>
    <div>
      <strong>${esc(
        story.display_name ||
        story.username ||
        "User"
      )}</strong>
      ${
        story.username
          ? `<span>@${esc(
              story.username
            )}</span>`
          : ""
      }
    </div>
  `;

  viewer.classList.add("open");

  refreshIcons();
}

function closeStoryViewer() {
  const viewer =
    $("storyViewer");

  if (viewer) {
    viewer.classList.remove("open");
  }
}

function openStoryGroup(userId) {
  const userStories =
    stories.filter(
      (story) =>
        String(story.user_id || story.username) ===
        String(userId || "")
    );

  if (!userStories.length) {
    const fallback =
      stories.find(
        (story) =>
          String(
            story.username || ""
          ) === String(userId || "")
      );

    if (fallback) {
      openStoryViewer(fallback);
    }

    return;
  }

  openStoryViewer(
    userStories[0]
  );
}

function showPage(pageId) {
  const pages =
    document.querySelectorAll(
      ".page"
    );

  pages.forEach((page) => {
    page.classList.toggle(
      "active",
      page.id === pageId
    );
  });

  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.page ===
          pageId
      );
    });

  const fab =
    $("createPost");

  if (fab) {
    fab.style.display =
      pageId === "homePage"
        ? ""
        : "none";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (
    pageId === "searchPage"
  ) {
    $("searchInput")?.focus();
  }
}

function runSearch(value) {
  const query =
    String(value || "")
      .trim()
      .toLowerCase();

  const home =
    $("searchHome");

  const results =
    $("searchResults");

  if (!results) return;

  if (!query) {
    results.innerHTML = "";

    if (home) {
      home.style.display = "";
    }

    refreshIcons();
    return;
  }

  if (home) {
    home.style.display = "none";
  }

  const matches =
    posts.filter((post) => {
      const text =
        String(
          post.text || ""
        ).toLowerCase();

      const name =
        String(
          post.display_name || ""
        ).toLowerCase();

      const username =
        String(
          post.username || ""
        ).toLowerCase();

      const hashtags =
        Array.isArray(
          post.hashtags
        )
          ? post.hashtags
              .join(" ")
              .toLowerCase()
          : "";

      return (
        text.includes(query) ||
        name.includes(query) ||
        username.includes(query) ||
        hashtags.includes(query)
      );
    });

  if (!matches.length) {
    results.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search-x"></i>
        <h2>No results</h2>
        <p>Nothing matched "${esc(
          value
        )}".</p>
      </div>
    `;

    refreshIcons();
    return;
  }

  results.innerHTML =
    matches
      .map(
        (post) =>
          postCardMarkup(post)
      )
      .join("");

  refreshIcons();
}

function renderTrending() {
  const container =
    $("trendingList");

  if (!container) return;

  const counts =
    new Map();

  posts.forEach((post) => {
    const tags =
      Array.isArray(
        post.hashtags
      )
        ? post.hashtags
        : extractHashtags(
            post.text || ""
          );

    tags.forEach((tag) => {
      const normalized =
        String(tag)
          .replace(/^#/, "")
          .toLowerCase();

      if (!normalized) return;

      counts.set(
        normalized,
        (counts.get(
          normalized
        ) || 0) + 1
      );
    });
  });

  const trending =
    Array.from(
      counts.entries()
    )
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          a[0].localeCompare(
            b[0]
          )
      )
      .slice(0, 20);

  if (!trending.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="flame"></i>
        <h2>No trends yet</h2>
        <p>Hashtags will appear here as people post.</p>
      </div>
    `;

    refreshIcons();
    return;
  }

  container.innerHTML =
    trending
      .map(
        ([tag, total], index) => `
          <button
            class="trend-item"
            type="button"
            data-trend="${escAttr(
              tag
            )}"
          >
            <span class="trend-rank">
              ${index + 1}
            </span>

            <span class="trend-main">
              <strong>#${esc(
                tag
              )}</strong>
              <small>
                ${total}
                ${
                  total === 1
                    ? "post"
                    : "posts"
                }
              </small>
            </span>

            <i data-lucide="chevron-right"></i>
          </button>
        `
      )
      .join("");

  refreshIcons();
}

function renderStreak() {
  const number =
    $("streakNumber");

  const text =
    $("streakText");

  const dots =
    $("weekDots");

  const done =
    $("streakDone");

  const state =
    readJSON(
      STREAK_KEY,
      {}
    );

  const streak =
    Number(
      state.streak ||
        currentUser?.streak ||
        0
    );

  if (number) {
    number.textContent =
      String(streak);
  }

  if (text) {
    text.textContent =
      streak === 1
        ? "day streak"
        : "day streak";
  }

  if (dots) {
    const active =
      Number(
        state.today ||
          (streak > 0
            ? 1
            : 0)
      );

    dots.innerHTML =
      Array.from(
        { length: 7 },
        (_, index) => `
          <span class="${
            index <
            Math.min(
              active,
              7
            )
              ? "active"
              : ""
          }"></span>
        `
      ).join("");
  }

  if (done) {
    done.textContent =
      streak > 0
        ? "Keep the streak alive."
        : "Complete an activity to start your streak.";
  }
}

function renderWheel() {
  const counter =
    $("spinCount 
         );
        }
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      closeMenu();
      closeComments();
      closeCreatePost();
      closeCreateStory();
      closeStoryViewer();
    }
  );
}

function init() {
  if (initialized) return;

  initialized = true;

  currentUser =
    getUser();

  plan =
    localStorage.getItem(
      PLAN_KEY
    ) ||
    currentUser?.plan ||
    "free";

  ensureDemo();

  loadData();

  renderProfile();
  renderStories();
  renderPosts();
  renderTrending();
  renderStreak();
  renderWheel();

  bindEvents();

  refreshIcons();
}

window.ARSHome = {
  getPosts: () => posts,
  getStories: () => stories,
  refresh: () => {
    loadData();
    renderStories();
    renderPosts();
    renderTrending();
    renderProfile();
    renderStreak();
    renderWheel();
    refreshIcons();
  },
  openCreatePost,
  openCreateStory,
  openStreak: () =>
    showPage("streakPage"),
  openWheel: () =>
    showPage("wheelPage"),
  search: runSearch
};

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    init,
    { once: true }
  );
} else {
  init();
}

})();
   
