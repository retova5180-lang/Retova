(() => {
  "use strict";

  const POST_KEY = "ars_local_posts";
  const STORY_KEY = "ars_local_stories";
  const STATE_KEY = "ars_home_state";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const feed = $("#feed");
  const storiesEl = $("#stories");
  const postDetail = $("#postDetail");
  const detailPostBody = $("#detailPostBody");
  const detailReplies = $("#detailReplies");
  const replyForm = $("#replyForm");
  const replyInput = $("#replyInput");
  const replyCount = $("#replyCount");

  let activePostId = null;

  const state = {
    posts: [],
    stories: [],
    liked: new Set(),
    reposted: new Set(),
    saved: new Set()
  };

  const demoStories = [
    {
      id: "you",
      name: "You",
      letter: "R",
      gradient: ["#8b3dff", "#c54dff"],
      mine: true,
      text: "Add your first story."
    },
    {
      id: "lina",
      name: "Lina",
      letter: "L",
      gradient: ["#8b3dff", "#c54dff"],
      text: "Sunset always hits different 💜",
      image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=85"
    },
    {
      id: "noah",
      name: "Noah",
      letter: "N",
      gradient: ["#252b38", "#5b6578"],
      text: "Focused on the journey."
    },
    {
      id: "sara",
      name: "Sara",
      letter: "S",
      gradient: ["#8b3dff", "#ee4cff"],
      text: "Weekend mood ✨",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=85"
    },
    {
      id: "wheel",
      name: "Wheel",
      wheel: true,
      text: "Spin the wheel."
    },
    {
      id: "apple",
      name: "Apple",
      letter: "",
      gradient: ["#09090b", "#44444c"],
      verified: true,
      text: "Apple updates."
    },
    {
      id: "ferrari",
      name: "Ferrari",
      letter: "F",
      gradient: ["#f01825", "#721018"],
      verified: true,
      text: "Racing weekend."
    },
    {
      id: "bmw",
      name: "BMW",
      letter: "M",
      gradient: ["#111111", "#4a4a52"],
      verified: true,
      text: "Driven by progress."
    }
  ];

  const demoPosts = [
    {
      id: "demo-lina",
      name: "Lina",
      username: "lina.ae",
      letter: "L",
      gradient: ["#8b3dff", "#c54dff"],
      verified: true,
      time: "12m",
      text: "Sunset always hits different 💜 #sunset #mood",
      image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85",
      likes: 2400,
      comments: 186,
      reposts: 312,
      views: 48000,
      replies: [
        {
          name: "Noah",
          letter: "N",
          gradient: ["#252b38", "#5b6578"],
          text: "This is beautiful 💜",
          likes: 24
        },
        {
          name: "Sara",
          letter: "S",
          gradient: ["#8b3dff", "#ee4cff"],
          text: "The colors are perfect.",
          likes: 11
        }
      ]
    },
    {
      id: "demo-apple",
      name: "Apple",
      username: "apple",
      letter: "",
      gradient: ["#0a0a0c", "#3b3b43"],
      verified: true,
      time: "28m",
      text: "Apple Intelligence expands to more languages later this year.",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85",
      likes: 28400,
      comments: 1800,
      reposts: 3900,
      views: 2400000,
      replies: [
        {
          name: "Lina",
          letter: "L",
          gradient: ["#8b3dff", "#c54dff"],
          text: "Huge update.",
          likes: 19
        }
      ]
    },
    {
      id: "demo-noah",
      name: "Noah",
      username: "noah.vibes",
      letter: "N",
      gradient: ["#17171c", "#51515a"],
      verified: true,
      time: "45m",
      text: "Focused on the journey. #focus #life",
      image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=85",
      likes: 910,
      comments: 73,
      reposts: 118,
      views: 18400,
      replies: [
        {
          name: "Lina",
          letter: "L",
          gradient: ["#8b3dff", "#c54dff"],
          text: "Keep going 🔥",
          likes: 7
        }
      ]
    },
    {
      id: "demo-repost",
      name: "Sara",
      username: "sara.vibes",
      letter: "S",
      gradient: ["#8b3dff", "#e34dff"],
      verified: false,
      time: "1h",
      text: "Reposted this because it deserved another look. #inspiration",
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
      likes: 1260,
      comments: 74,
      reposts: 31,
      views: 22000,
      repostOf: "demo-lina",
      replies: []
    }
  ];

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));

  const fmt = value => {
    const number = Number(value) || 0;

    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    }

    if (number >= 1000) {
      return (number / 1000).toFixed(1) + "K";
    }

    return String(number);
  };

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));

  function user() {
    try {
      return JSON.parse(localStorage.getItem("ars_user")) || {};
    } catch {
      return {};
    }
  }

  function myAvatar() {
    const u = user();

    return {
      letter: u.letter || "R",
      color: u.letterColor || "#8b3dff",
      background: u.background || "#c54dff",
      name: u.displayName || "You"
    };
  }

  function normalize(post) {
    return {
      ...post,
      likes: Number(post.likes) || 0,
      comments: Number(post.comments) || 0,
      reposts: Number(post.reposts) || 0,
      views: Number(post.views) || 0,
      replies: Array.isArray(post.replies) ? post.replies : []
    };
  }

  function load() {
    const saved = read(STATE_KEY, {});

    state.liked = new Set(saved.liked || []);
    state.reposted = new Set(saved.reposted || []);
    state.saved = new Set(saved.saved || []);

    const localPosts = read(POST_KEY, [])
      .filter(Boolean)
      .map(normalize);

    state.posts = [
      ...localPosts,
      ...demoPosts
    ].map(normalize);

    const localStories = read(STORY_KEY, [])
      .filter(story =>
        !story.expiresAt ||
        story.expiresAt > Date.now()
      );

    state.stories = [
      ...localStories,
      ...demoStories
    ];
  }

  function saveState() {
    write(STATE_KEY, {
      liked: [...state.liked],
      reposted: [...state.reposted],
      saved: [...state.saved]
    });
  }

  function avatarHTML(person, reply = false) {
    const gradient =
      person.gradient ||
      ["#8b3dff", "#c54dff"];

    const className =
      reply
        ? "reply-avatar"
        : "post-avatar";

    const image =
      person.avatar ||
      "";

    return `
      <div
        class="${className}"
        style="background:linear-gradient(135deg,${esc(gradient[0])},${esc(gradient[1])})"
      >
        ${
          image
            ? `<img src="${esc(image)}" alt="">`
            : esc(
                person.letter ||
                person.name?.[0] ||
                "Λ"
              )
        }
      </div>
    `;
  }

  function textHTML(text) {
    return esc(text).replace(
      /(^|\s)(#[a-zA-Z0-9_]+)/g,
      '$1<span class="hashtag">$2</span>'
    );
  }

  function postHTML(post, detail = false) {
    const liked =
      state.liked.has(post.id);

    const reposted =
      state.reposted.has(post.id);

    const saved =
      state.saved.has(post.id);

    const mediaImage =
      post.image ||
      post.images?.[0] ||
      "";

    const mediaVideo =
      post.video ||
      post.videos?.[0] ||
      "";

    return `
      <article
        class="post ${detail ? "detail-post" : "clickable"}"
        data-post-id="${esc(post.id)}"
      >
        <div class="post-header">
          <div class="post-user">
            ${avatarHTML(post)}

            <div class="post-info">
              <div class="post-name">
                ${esc(post.name)}

                ${
                  post.verified
                    ? `
                      <span class="verify">
                        <i data-lucide="badge-check"></i>
                      </span>
                    `
                    : ""
                }
              </div>

              <div class="post-username">
                @${esc(post.username)}
              </div>

              <div class="post-time">
                ${esc(post.time)}
              </div>
            </div>
          </div>

          <button
            class="post-more"
            type="button"
            data-action="more"
            aria-label="More"
          >
            <i data-lucide="more-horizontal"></i>
          </button>
        </div>

        ${
          post.repostOf
            ? `
              <div class="repost-label">
                <i data-lucide="repeat-2"></i>
                Reposted
              </div>
            `
            : ""
        }

        <div class="post-content">
          ${textHTML(post.text)}
        </div>

        ${
          mediaImage
            ? `
              <div class="post-image">
                <img
                  src="${esc(mediaImage)}"
                  alt="Post media"
                  loading="lazy"
                >
              </div>
            `
            : ""
        }

        ${
          mediaVideo
            ? `
              <video
                class="post-video"
                controls
                playsinline
                preload="metadata"
                src="${esc(mediaVideo)}"
              ></video>
            `
            : ""
        }

        <div class="post-stats">
          <span>${fmt(post.likes)} likes</span>
          <span>${fmt(post.comments)} replies</span>
          <span>${fmt(post.reposts)} reposts</span>
          <span>${fmt(post.views)} views</span>
        </div>

        <div class="post-actions">
          <div class="post-left-actions">
            <button
              class="action ${liked ? "liked" : ""}"
              data-action="like"
              type="button"
            >
              <i data-lucide="heart"></i>
              <span>${fmt(post.likes)}</span>
            </button>

            <button
              class="action"
              data-action="reply"
              type="button"
            >
              <i data-lucide="message-circle"></i>
              <span>${fmt(post.comments)}</span>
            </button>

            <button
              class="action ${reposted ? "reposted" : ""}"
              data-action="repost"
              type="button"
            >
              <i data-lucide="repeat-2"></i>
              <span>${fmt(post.reposts)}</span>
            </button>

            <button
              class="action ${saved ? "saved" : ""}"
              data-action="save"
              type="button"
            >
              <i data-lucide="bookmark"></i>
            </button>
          </div>

          <div class="action-views">
            <i data-lucide="eye"></i>
            ${fmt(post.views)}
          </div>
        </div>
      </article>
    `;
  }

  function renderStories() {
    if (!storiesEl) return;

    storiesEl.innerHTML =
      state.stories
        .map(story => {
          if (story.wheel) {
            return `
              <button
                class="story story-wheel"
                type="button"
                data-wheel-story
              >
                <div class="story-ring">
                  <div class="story-avatar"></div>
                </div>

                <div class="story-name">
                  Wheel
                </div>
              </button>
            `;
          }

          return `
            <button
              class="story ${story.seen ? "seen" : ""} ${story.mine ? "mine" : ""}"
              type="button"
              data-story-id="${esc(story.id)}"
            >
              <div class="story-ring">
                <div
                  class="story-avatar"
                  style="background:linear-gradient(135deg,${esc(story.gradient?.[0] || "#8b3dff")},${esc(story.gradient?.[1] || "#c54dff")})"
                >
                  ${
                    story.image
                      ? `<img src="${esc(story.image)}" alt="">`
                      : esc(
                          story.letter ||
                          story.name?.[0] ||
                          "Λ"
                        )
                  }
                </div>
              </div>

              ${
                story.mine
                  ? `<span class="story-plus">+</span>`
                  : ""
              }

              <div class="story-name">
                ${esc(story.name)}
              </div>
            </button>
          `;
        })
        .join("");

    icons();
  }

  function renderPosts() {
    if (!feed) return;

    if (!state.posts.length) {
      feed.innerHTML = `
        <div class="empty-state">
          <strong>No posts yet</strong>
          <span>Create the first post.</span>
        </div>
      `;
      return;
    }

    feed.innerHTML =
      state.posts
        .map(post => postHTML(post))
        .join("");

    icons();
  }

  function icons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function openStory(id) {
    const story =
      state.stories.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!story) return;

    story.seen = true;
    renderStories();

    $("#storyViewerName").textContent =
      story.name;

    $("#storyViewerAvatar").textContent =
      story.letter ||
      story.name?.[0] ||
      "Λ";

    $("#storyViewerAvatar").style.background =
      `linear-gradient(
        135deg,
        ${story.gradient?.[0] || "#8b3dff"},
        ${story.gradient?.[1] || "#c54dff"}
      )`;

    const image =
      $("#storyViewerImage");

    image.style.backgroundImage =
      story.image
        ? `url("${story.image}")`
        : "none";

    $("#storyViewerText").textContent =
      story.text || "";

    $("#storyViewer")
      .classList.remove("hidden");

    $("#storyViewer")
      .setAttribute(
        "aria-hidden",
        "false"
      );
  }

  function closeStory() {
    $("#storyViewer")
      ?.classList.add("hidden");

    $("#storyViewer")
      ?.setAttribute(
        "aria-hidden",
        "true"
      );
  }

  function openPost(id) {
    const post =
      state.posts.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!post) return;

    activePostId =
      post.id;

    detailPostBody.innerHTML =
      postHTML(
        post,
        true
      );

    const replies =
      post.replies || [];

    replyCount.textContent =
      replies.length;

    detailReplies.innerHTML =
      replies.length
        ? replies
            .map(
              reply => `
                <div class="reply">
                  ${avatarHTML(reply, true)}

                  <div class="reply-main">
                    <div class="reply-name">
                      ${esc(reply.name)}
                    </div>

                    <div class="reply-text">
                      ${esc(reply.text)}
                    </div>

                    <div class="reply-like">
                      ♥ ${fmt(reply.likes)}
                    </div>
                  </div>
                </div>
              `
            )
            .join("")
        : `
            <div class="empty-state">
              <strong>No replies yet.</strong>
              <span>Be the first to reply.</span>
            </div>
          `;

    postDetail
      .classList.remove("hidden");

    postDetail
      .setAttribute(
        "aria-hidden",
        "false"
      );

    icons();
  }

  function closePost() {
    postDetail
      ?.classList.add("hidden");

    postDetail
      ?.setAttribute(
        "aria-hidden",
        "true"
      );

    activePostId = null;
  }

  function persist(post) {
    if (
      !String(post.id)
        .startsWith("local-")
    ) {
      return;
    }

    const posts =
      read(
        POST_KEY,
        []
      );

    const index =
      posts.findIndex(
        item =>
          String(item.id) ===
          String(post.id)
      );

    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.unshift(post);
    }

    write(
      POST_KEY,
      posts
    );
  }

  function action(id, type) {
    const post =
      state.posts.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!post) return;

    if (type === "like") {
      if (
        state.liked.has(
          post.id
        )
      ) {
        state.liked.delete(
          post.id
        );

        post.likes =
          Math.max(
            0,
            post.likes - 1
          );
      } else {
        state.liked.add(
          post.id
        );

        post.likes += 1;
      }
    }

    if (type === "repost") {
      if (
        state.reposted.has(
          post.id
        )
      ) {
        state.reposted.delete(
          post.id
        );

        post.reposts =
          Math.max(
            0,
            post.reposts - 1
          );
      } else {
        state.reposted.add(
          post.id
        );

        post.reposts += 1;
      }
    }

    if (type === "save") {
      if (
        state.saved.has(
          post.id
        )
      ) {
        state.saved.delete(
          post.id
        );
      } else {
        state.saved.add(
          post.id
        );
      }
    }

    saveState();
    persist(post);
    renderPosts();
  }

  function addReply(text) {
    const post =
      state.posts.find(
        item =>
          String(item.id) ===
          String(activePostId)
      );

    if (!post || !text.trim()) return;

    const me =
      myAvatar();

    post.replies =
      post.replies || [];

    post.replies.push({
      name: me.name,
      letter: me.letter,
      gradient: [
        me.color,
        me.background
      ],
      text: text.trim(),
      likes: 0
    });

    post.comments += 1;

    persist(post);
    openPost(post.id);
  }

  document.addEventListener(
    "click",
    event => {
      const wheelStory =
        event.target.closest(
          "[data-wheel-story]"
        );

      if (wheelStory) {
        window.openWheel?.();
        return;
      }

      const story =
        event.target.closest(
          "[data-story-id]"
        );

      if (story) {
        openStory(
          story.dataset.storyId
        );
        return;
      }

      const post =
        event.target.closest(
          ".post"
        );

      if (!post) return;

      const clickedAction =
        event.target.closest(
          "[data-action]"
        );

      const actionName =
        clickedAction?.dataset.action;

      if (actionName) {
        event.stopPropagation();

        if (actionName === "reply") {
          openPost(
            post.dataset.postId
          );
        } else if (
          actionName !== "more"
        ) {
          action(
            post.dataset.postId,
            actionName
          );
        }

        return;
      }

      if (
        post.classList.contains(
          "clickable"
        )
      ) {
        openPost(
          post.dataset.postId
        );
      }
    }
  );

  $("#headerWheel")
    ?.addEventListener(
      "click",
      () => window.ope
(() => {
  "use strict";

  const POST_KEY = "ars_local_posts";
  const STORY_KEY = "ars_local_stories";
  const STATE_KEY = "ars_home_state";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const feed = $("#feed");
  const storiesEl = $("#stories");
  const postDetail = $("#postDetail");
  const detailPostBody = $("#detailPostBody");
  const detailReplies = $("#detailReplies");
  const replyForm = $("#replyForm");
  const replyInput = $("#replyInput");
  const replyCount = $("#replyCount");

  let activePostId = null;

  const state = {
    posts: [],
    stories: [],
    liked: new Set(),
    reposted: new Set(),
    saved: new Set()
  };

  const demoStories = [
    {
      id: "you",
      name: "You",
      letter: "R",
      gradient: ["#8b3dff", "#c54dff"],
      mine: true,
      text: "Add your first story."
    },
    {
      id: "lina",
      name: "Lina",
      letter: "L",
      gradient: ["#8b3dff", "#c54dff"],
      text: "Sunset always hits different 💜",
      image:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=85"
    },
    {
      id: "noah",
      name: "Noah",
      letter: "N",
      gradient: ["#252b38", "#5b6578"],
      text: "Focused on the journey."
    },
    {
      id: "sara",
      name: "Sara",
      letter: "S",
      gradient: ["#8b3dff", "#ee4cff"],
      text: "Weekend mood ✨",
      image:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=85"
    },
    {
      id: "wheel",
      name: "Wheel",
      wheel: true,
      text: "Spin the wheel."
    },
    {
      id: "apple",
      name: "Apple",
      letter: "",
      gradient: ["#09090b", "#44444c"],
      verified: true,
      text: "Apple updates."
    },
    {
      id: "ferrari",
      name: "Ferrari",
      letter: "F",
      gradient: ["#f01825", "#721018"],
      verified: true,
      text: "Racing weekend."
    },
    {
      id: "bmw",
      name: "BMW",
      letter: "M",
      gradient: ["#111111", "#4a4a52"],
      verified: true,
      text: "Driven by progress."
    }
  ];

  const demoPosts = [
    {
      id: "demo-lina",
      name: "Lina",
      username: "lina.ae",
      letter: "L",
      gradient: ["#8b3dff", "#c54dff"],
      verified: true,
      time: "12m",
      text: "Sunset always hits different 💜 #sunset #mood",
      image:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85",
      likes: 2400,
      comments: 186,
      reposts: 312,
      views: 48000,
      replies: [
        {
          name: "Noah",
          letter: "N",
          gradient: ["#252b38", "#5b6578"],
          text: "This is beautiful 💜",
          likes: 24
        },
        {
          name: "Sara",
          letter: "S",
          gradient: ["#8b3dff", "#ee4cff"],
          text: "The colors are perfect.",
          likes: 11
        }
      ]
    },
    {
      id: "demo-apple",
      name: "Apple",
      username: "apple",
      letter: "",
      gradient: ["#0a0a0c", "#3b3b43"],
      verified: true,
      time: "28m",
      text: "Apple Intelligence expands to more languages later this year.",
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85",
      likes: 28400,
      comments: 1800,
      reposts: 3900,
      views: 2400000,
      replies: [
        {
          name: "Lina",
          letter: "L",
          gradient: ["#8b3dff", "#c54dff"],
          text: "Huge update.",
          likes: 19
        }
      ]
    },
    {
      id: "demo-noah",
      name: "Noah",
      username: "noah.vibes",
      letter: "N",
      gradient: ["#17171c", "#51515a"],
      verified: true,
      time: "45m",
      text: "Focused on the journey. #focus #life",
      image:
        "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=85",
      likes: 910,
      comments: 73,
      reposts: 118,
      views: 18400,
      replies: [
        {
          name: "Lina",
          letter: "L",
          gradient: ["#8b3dff", "#c54dff"],
          text: "Keep going 🔥",
          likes: 7
        }
      ]
    },
    {
      id: "demo-repost",
      name: "Sara",
      username: "sara.vibes",
      letter: "S",
      gradient: ["#8b3dff", "#e34dff"],
      verified: false,
      time: "1h",
      text: "Reposted this because it deserved another look. #inspiration",
      image:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
      likes: 1260,
      comments: 74,
      reposts: 31,
      views: 22000,
      repostOf: "demo-lina",
      replies: []
    }
  ];

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));

  const fmt = value => {
    const number = Number(value) || 0;

    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    }

    if (number >= 1000) {
      return (number / 1000).toFixed(1) + "K";
    }

    return String(number);
  };

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  function user() {
    try {
      return JSON.parse(localStorage.getItem("ars_user")) || {};
    } catch {
      return {};
    }
  }

  function myAvatar() {
    const u = user();

    return {
      letter: u.letter || "R",
      color: u.letterColor || "#8b3dff",
      background: u.background || "#c54dff",
      name: u.displayName || "You"
    };
  }

  function normalize(post) {
    return {
      ...post,
      likes: Number(post.likes) || 0,
      comments: Number(post.comments) || 0,
      reposts: Number(post.reposts) || 0,
      views: Number(post.views) || 0,
      replies: Array.isArray(post.replies) ? post.replies : []
    };
  }

  function load() {
    const saved = read(STATE_KEY, {});

    state.liked = new Set(saved.liked || []);
    state.reposted = new Set(saved.reposted || []);
    state.saved = new Set(saved.saved || []);

    const localPosts = read(POST_KEY, [])
      .filter(Boolean)
      .map(normalize);

    state.posts = [
      ...localPosts,
      ...demoPosts
    ].map(normalize);

    const localStories = read(STORY_KEY, [])
      .filter(story => {
        return !story.expiresAt || story.expiresAt > Date.now();
      });

    state.stories = [
      ...localStories,
      ...demoStories
    ];
  }

  function saveState() {
    write(STATE_KEY, {
      liked: [...state.liked],
      reposted: [...state.reposted],
      saved: [...state.saved]
    });
  }

  function avatarHTML(person, reply = false) {
    const gradient =
      person.gradient ||
      ["#8b3dff", "#c54dff"];

    const className =
      reply
        ? "reply-avatar"
        : "post-avatar";

    const image =
      person.avatar ||
      "";

    return `
      <div
        class="${className}"
        style="background:linear-gradient(135deg,${esc(
          gradient[0]
        )},${esc(gradient[1])})"
      >
        ${
          image
            ? `<img src="${esc(image)}" alt="">`
            : esc(
                person.letter ||
                person.name?.[0] ||
                "Λ"
              )
        }
      </div>
    `;
  }

  function textHTML(text) {
    return esc(text).replace(
      /(^|\s)(#[a-zA-Z0-9_]+)/g,
      '$1<span class="hashtag">$2</span>'
    );
  }

  function postHTML(post, detail = false) {
    const liked =
      state.liked.has(post.id);

    const reposted =
      state.reposted.has(post.id);

    const saved =
      state.saved.has(post.id);

    const mediaImage =
      post.image ||
      post.images?.[0] ||
      "";

    const mediaVideo =
      post.video ||
      post.videos?.[0] ||
      "";

    return `
      <article
        class="post ${detail ? "detail-post" : "clickable"}"
        data-post-id="${esc(post.id)}"
      >
        <div class="post-header">
          <div class="post-user">
            ${avatarHTML(post)}

            <div class="post-info">
              <div class="post-name">
                ${esc(post.name)}

                ${
                  post.verified
                    ? `
                      <span class="verify">
                        <i data-lucide="badge-check"></i>
                      </span>
                    `
                    : ""
                }
              </div>

              <div class="post-username">
                @${esc(post.username)}
              </div>

              <div class="post-time">
                ${esc(post.time)}
              </div>
            </div>
          </div>

          <button
            class="post-more"
            type="button"
            data-action="more"
            aria-label="More"
          >
            <i data-lucide="more-horizontal"></i>
          </button>
        </div>

        ${
          post.repostOf
            ? `
              <div class="repost-label">
                <i data-lucide="repeat-2"></i>
                Reposted
              </div>
            `
            : ""
        }

        <div class="post-content">
          ${textHTML(post.text)}
        </div>

        ${
          mediaImage
            ? `
              <div class="post-image">
                <img
                  src="${esc(mediaImage)}"
                  alt="Post media"
                  loading="lazy"
                >
              </div>
            `
            : ""
        }

        ${
          mediaVideo
            ? `
              <video
                class="post-video"
                controls
                playsinline
                preload="metadata"
                src="${esc(mediaVideo)}"
              ></video>
            `
            : ""
        }

        <div class="post-stats">
          <span>${fmt(post.likes)} likes</span>
          <span>${fmt(post.comments)} replies</span>
          <span>${fmt(post.reposts)} reposts</span>
          <span>${fmt(post.views)} views</span>
        </div>

        <div class="post-actions">
          <div class="post-left-actions">
            <button
              class="action ${liked ? "liked" : ""}"
              data-action="like"
              type="button"
            >
              <i data-lucide="heart"></i>
              <span>${fmt(post.likes)}</span>
            </button>

            <button
              class="action"
              data-action="reply"
              type="button"
            >
              <i data-lucide="message-circle"></i>
              <span>${fmt(post.comments)}</span>
            </button>

            <button
              class="action ${reposted ? "reposted" : ""}"
              data-action="repost"
              type="button"
            >
              <i data-lucide="repeat-2"></i>
              <span>${fmt(post.reposts)}</span>
            </button>

            <button
              class="action ${saved ? "saved" : ""}"
              data-action="save"
              type="button"
            >
              <i data-lucide="bookmark"></i>
            </button>
          </div>

          <div class="action-views">
            <i data-lucide="eye"></i>
            ${fmt(post.views)}
          </div>
        </div>
      </article>
    `;
  }

  function renderStories() {
    if (!storiesEl) return;

    storiesEl.innerHTML =
      state.stories
        .map(story => {
          if (story.wheel) {
            return `
              <button
                class="story story-wheel"
                type="button"
                data-wheel-story
              >
                <div class="story-ring">
                  <div class="story-avatar"></div>
                </div>

                <div class="story-name">
                  Wheel
                </div>
              </button>
            `;
          }

          return `
            <button
              class="story ${story.seen ? "seen" : ""} ${
                story.mine ? "mine" : ""
              }"
              type="button"
              data-story-id="${esc(story.id)}"
            >
              <div class="story-ring">
                <div
                  class="story-avatar"
                  style="background:linear-gradient(
                    135deg,
                    ${esc(story.gradient?.[0] || "#8b3dff")},
                    ${esc(story.gradient?.[1] || "#c54dff")}
                  )"
                >
                  ${
                    story.image
                      ? `<img src="${esc(story.image)}" alt="">`
                      : esc(
                          story.letter ||
                          story.name?.[0] ||
                          "Λ"
                        )
                  }
                </div>
              </div>

              ${
                story.mine
                  ? `<span class="story-plus">+</span>`
                  : ""
              }

              <div class="story-name">
                ${esc(story.name)}
              </div>
            </button>
          `;
        })
        .join("");

    icons();
  }

  function renderPosts() {
    if (!feed) return;

    if (!state.posts.length) {
      feed.innerHTML = `
        <div class="empty-state">
          <strong>No posts yet</strong>
          <span>Create the first post.</span>
        </div>
      `;
      return;
    }

    feed.innerHTML =
      state.posts
        .map(post => postHTML(post))
        .join("");

    icons();
  }

  function icons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function openStory(id) {
    const story =
      state.stories.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!story) return;

    story.seen = true;
    renderStories();

    const viewerName = $("#storyViewerName");
    const viewerAvatar = $("#storyViewerAvatar");
    const viewerImage = $("#storyViewerImage");
    const viewerText = $("#storyViewerText");
    const viewer = $("#storyViewer");

    if (!viewerName || !viewerAvatar || !viewerImage || !viewerText || !viewer) {
      return;
    }

    viewerName.textContent = story.name;

    viewerAvatar.textContent =
      story.letter ||
      story.name?.[0] ||
      "Λ";

    viewerAvatar.style.background =
      `linear-gradient(
        135deg,
        ${story.gradient?.[0] || "#8b3dff"},
        ${story.gradient?.[1] || "#c54dff"}
      )`;

    viewerImage.style.backgroundImage =
      story.image
        ? `url("${story.image}")`
        : "none";

    viewerText.textContent =
      story.text || "";

    viewer.classList.remove("hidden");
    viewer.setAttribute("aria-hidden", "false");
  }

  function closeStory() {
    const viewer = $("#storyViewer");

    if (!viewer) return;

    viewer.classList.add("hidden");
    viewer.setAttribute("aria-hidden", "true");
  }

  function openPost(id) {
    const post =
      state.posts.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!post) return;

    if (!detailPostBody || !detailReplies || !replyCount || !postDetail) {
      return;
    }

    activePostId = post.id;

    detailPostBody.innerHTML =
      postHTML(post, true);

    const replies =
      post.replies || [];

    replyCount.textContent =
      replies.length;

    detailReplies.innerHTML =
      replies.length
        ? replies
            .map(
              reply => `
                <div class="reply">
                  ${avatarHTML(reply, true)}

                  <div class="reply-main">
                    <div class="reply-name">
                      ${esc(reply.name)}
                    </div>

                    <div class="reply-text">
                      ${esc(reply.text)}
                    </div>

                    <div class="reply-like">
                      ♥ ${fmt(reply.likes)}
                    </div>
                  </div>
                </div>
              `
            )
            .join("")
        : `
            <div class="empty-state">
              <strong>No replies yet.</strong>
              <span>Be the first to reply.</span>
            </div>
          `;

    postDetail.classList.remove("hidden");

    postDetail.setAttribute(
      "aria-hidden",
      "false"
    );

    icons();
  }

  function closePost() {
    if (!postDetail) return;

    postDetail.classList.add("hidden");

    postDetail.setAttribute(
      "aria-hidden",
      "true"
    );

    activePostId = null;
  }

  function persist(post) {
    if (
      !String(post.id)
        .startsWith("local-")
    ) {
      return;
    }

    const posts =
      read(
        POST_KEY,
        []
      );

    const index =
      posts.findIndex(
        item =>
          String(item.id) ===
          String(post.id)
      );

    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.unshift(post);
    }

    write(
      POST_KEY,
      posts
    );
  }

  function action(id, type) {
    const post =
      state.posts.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!post) return;

    if (type === "like") {
      if (
        state.liked.has(
          post.id
        )
      ) {
        state.liked.delete(
          post.id
        );

        post.likes =
          Math.max(
            0,
            post.likes - 1
          );
      } else {
        state.liked.add(
          post.id
        );

        post.likes += 1;
      }
    }

    if (type === "repost") {
      if (
        state.reposted.has(
          post.id
        )
      ) {
        state.reposted.delete(
          post.id
        );

        post.reposts =
          Math.max(
            0,
            post.reposts - 1
          );
      } else {
        state.reposted.add(
          post.id
        );

        post.reposts += 1;
      }
    }

    if (type === "save") {
      if (
        state.saved.has(
          post.id
        )
      ) {
        state.saved.delete(
          post.id
        );
      } else {
        state.saved.add(
          post.id
        );
      }
    }

    saveState();
    persist(post);
    renderPosts();
  }

  function addReply(text) {
    const post =
      state.posts.find(
        item =>
          String(item.id) ===
          String(activePostId)
      );

    if (!post || !text.trim()) return;

    const me =
      myAvatar();

    post.replies =
      post.replies || [];

    post.replies.push({
      name: me.name,
      letter: me.letter,
      gradient: [
        me.color,
        me.background
      ],
      text: text.trim(),
      likes: 0
    });

    post.comments += 1;

    persist(post);
    openPost(post.id);
  }

  document.addEventListener(
    "click",
    event => {
      const wheelStory =
        event.target.closest(
          "[data-wheel-story]"
        );

      if (wheelStory) {
        window.openWheel?.();
        return;
      }

      const story =
        event.target.closest(
          "[data-story-id]"
        );

      if (story) {
        openStory(
          story.dataset.storyId
        );
        return;
      }

      const post =
        event.target.closest(
          ".post"
        );

      if (!post) return;

      const clickedAction =
        event.target.closest(
          "[data-action]"
        );

      const actionName =
        clickedAction?.dataset.action;

      if (actionName) {
        event.stopPropagation();

        if (actionName === "reply") {
          openPost(
            post.dataset.postId
          );
       
