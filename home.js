(() => {
  "use strict";

  const POST_KEY = "ars_local_posts";
  const STORY_KEY = "ars_local_stories";
  const STATE_KEY = "ars_home_state";
  const STREAK_KEY = "ars_streak_state";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const feed = $("#feed");
  const stories = $("#stories");
  const detail = $("#postDetail");
  const detailBody = $("#detailPostBody");
  const replies = $("#detailReplies");
  const replyForm = $("#replyForm");
  const replyInput = $("#replyInput");
  const replyCount = $("#replyCount");

  let activePostId = null;

  const app = {
    posts: [],
    stories: [],
    liked: new Set(),
    reposted: new Set(),
    saved: new Set()
  };

  const demoPosts = [
    {
      id: "demo-1",
      name: "Apple",
      username: "apple",
      letter: "A",
      gradient: ["#202020", "#666"],
      verified: true,
      time: "12m",
      text: "A cleaner way to create, share and discover what matters to you. #ARS #CreateShareConnect",
      images: [],
      videos: [],
      likes: 28400,
      comments: 1843,
      reposts: 3902,
      views: 2400000,
      replies: [
        {
          name: "Lina",
          letter: "L",
          text: "This looks amazing.",
          likes: 24
        },
        {
          name: "Noah",
          letter: "N",
          text: "Can't wait for this.",
          likes: 8
        }
      ]
    },

    {
      id: "demo-2",
      name: "Lina",
      username: "lina",
      letter: "L",
      gradient: ["#8B3DFF", "#C54DFF"],
      verified: false,
      vip: true,
      time: "28m",
      text: "Finally finished my new workspace setup. ✨ #Workspace #Purple",
      images: [],
      videos: [],
      likes: 4211,
      comments: 291,
      reposts: 88,
      views: 119000,
      replies: [
        {
          name: "Maya",
          letter: "M",
          text: "Love the purple setup!",
          likes: 13
        }
      ]
    },

    {
      id: "demo-3",
      name: "Noah",
      username: "noah",
      letter: "N",
      gradient: ["#2563EB", "#06B6D4"],
      verified: false,
      vip: false,
      time: "43m",
      text: "Morning thoughts. Keep moving even when nobody is watching. #Motivation",
      images: [],
      videos: [],
      likes: 831,
      comments: 41,
      reposts: 12,
      views: 15200,
      replies: [
        {
          name: "Omar",
          letter: "O",
          text: "Needed this today.",
          likes: 11
        }
      ]
    },

    {
      id: "demo-4",
      name: "Sara",
      username: "sara",
      letter: "S",
      gradient: ["#F43F5E", "#FB7185"],
      verified: false,
      vip: false,
      time: "1h",
      text: "Small wins still count. 🌙 #DailyLife #SmallWins",
      images: [],
      videos: [],
      likes: 1260,
      comments: 74,
      reposts: 31,
      views: 22000,
      replies: []
    },

    {
      id: "demo-5",
      name: "Alex",
      username: "alex",
      letter: "Λ",
      gradient: ["#8B3DFF", "#EC4899"],
      verified: false,
      vip: false,
      time: "2h",
      text: "Reposted this because it deserved another look. #ARS",
      images: [],
      videos: [],
      likes: 320,
      reposts: 19,
      comments: 18,
      views: 6800,
      repostOf: "demo-1",
      replies: []
    }
  ];

  const demoStories = [
    {
      id: "s1",
      name: "You",
      letter: "R",
      gradient: ["#8B3DFF", "#C54DFF"],
      mine: true,
      seen: false,
      text: "Your first story can start here."
    },

    {
      id: "s2",
      name: "Lina",
      letter: "L",
      gradient: ["#8B3DFF", "#C54DFF"],
      seen: false,
      text: "Late night setup ✨"
    },

    {
      id: "s3",
      name: "Noah",
      letter: "N",
      gradient: ["#2563EB", "#06B6D4"],
      seen: false,
      text: "Good morning!"
    },

    {
      id: "s4",
      name: "Sara",
      letter: "S",
      gradient: ["#F43F5E", "#FB7185"],
      seen: true,
      text: "Weekend mood."
    },

    {
      id: "s5",
      name: "Alex",
      letter: "Λ",
      gradient: ["#8B3DFF", "#EC4899"],
      seen: false,
      text: "New post is up."
    }
  ];

  const demoReplies = [
    {
      name: "Emma",
      letter: "E",
      text: "Love this.",
      likes: 7
    },

    {
      name: "Omar",
      letter: "O",
      text: "Exactly what I needed today.",
      likes: 11
    }
  ];

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#039;",
          '"': "&quot;"
        })[char]
    );

  const fmt = (number) => {
    const n = Number(number) || 0;

    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(1)}M`;
    }

    if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}K`;
    }

    return String(n);
  };

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || "null"
      );

      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  };

  const localDateKey = () => {
    const d = new Date();

    const y = d.getFullYear();

    const m = String(
      d.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      d.getDate()
    ).padStart(2, "0");

    return `${y}-${m}-${day}`;
  };

  const daysBetween = (fromKey, toKey) => {
    if (!fromKey || !toKey) {
      return 999;
    }

    const from = new Date(
      `${fromKey}T00:00:00`
    );

    const to = new Date(
      `${toKey}T00:00:00`
    );

    return Math.round(
      (to - from) / 86400000
    );
  };

  function profile() {
    try {
      return (
        JSON.parse(
          localStorage.getItem("ars_user")
        ) || {}
      );
    } catch {
      return {};
    }
  }

  function userAvatar() {
    const user = profile();

    return {
      letter: String(
        user.letter || "R"
      ).slice(0, 1),

      gradient: [
        user.letterColor || "#8B3DFF",
        user.background || "#C54DFF"
      ],

      name:
        user.displayName ||
        user.name ||
        "You"
    };
  }

  function streak() {
    const today = localDateKey();

    const current = read(
      STREAK_KEY,
      {
        count: 0,
        lastDate: null
      }
    );

    const s = {
      count: Number(current.count) || 0,
      lastDate: current.lastDate || null
    };

    if (s.lastDate === today) {
      return s;
    }

    if (!s.lastDate) {
      s.count = 1;
    } else {
      const gap = daysBetween(
        s.lastDate,
        today
      );

      s.count =
        gap === 1
          ? s.count + 1
          : 1;
    }

    s.lastDate = today;

    write(STREAK_KEY, s);

    return s;
  }

  function updateStreakUI() {
    const s = read(
      STREAK_KEY,
      {
        count: 0
      }
    );

    const element =
      $("#streakCount");

    if (element) {
      element.textContent =
        String(
          Number(s.count) || 0
        );
    }
  }

  function load() {
    const state = read(
      STATE_KEY,
      {}
    );

    app.liked = new Set(
      Array.isArray(state.liked)
        ? state.liked
        : []
    );

    app.reposted = new Set(
      Array.isArray(state.reposted)
        ? state.reposted
        : []
    );

    app.saved = new Set(
      Array.isArray(state.saved)
        ? state.saved
        : []
    );

    const localPosts =
      read(
        POST_KEY,
        []
      );

    const localStories =
      read(
        STORY_KEY,
        []
      );

    app.posts = [
      ...localPosts,
      ...demoPosts
    ].map(normalizePost);

    app.stories = [
      ...localStories.filter(
        (story) =>
          !story.expiresAt ||
          story.expiresAt > Date.now()
      ),

      ...demoStories
    ];
  }

  function saveState() {
    write(
      STATE_KEY,
      {
        liked: [
          ...app.liked
        ],

        reposted: [
          ...app.reposted
        ],

        saved: [
          ...app.saved
        ]
      }
    );
  }

  function normalizePost(post) {
    return {
      ...post,

      likes:
        Number(post.likes) || 0,

      comments:
        Number(post.comments) || 0,

      reposts:
        Number(post.reposts) || 0,

      views:
        Number(post.views) || 0,

      images:
        Array.isArray(post.images)
          ? post.images
          : [],

      videos:
        Array.isArray(post.videos)
          ? post.videos
          : [],

      replies:
        Array.isArray(post.replies)
          ? post.replies
          : []
    };
  }

  function avatarHTML(
    person,
    small = false
  ) {
    const gradient =
      Array.isArray(person.gradient)
        ? person.gradient
        : [
            "#8B3DFF",
            "#C54DFF"
          ];

    const letter =
      person.letter ||
      person.name?.[0] ||
      "Λ";

    return `
      <div
        class="${small ? "reply-avatar" : "post-avatar"}"
        style="
          background:
            linear-gradient(
              135deg,
              ${esc(gradient[0])},
              ${esc(gradient[1])}
            )
        "
      >
        ${esc(letter)}
      </div>
    `;
  }

  function hashtagHTML(text) {
    const escaped =
      esc(text);

    return escaped.replace(
      /(^|\s)(#[a-zA-Z0-9_]+)/g,
      '$1<span class="hashtag" data-hashtag="$2">$2</span>'
    );
  }

  function postHTML(
    post,
    detailMode = false
  ) {
    const liked =
      app.liked.has(post.id);

    const reposted =
      app.reposted.has(post.id);

    const saved =
      app.saved.has(post.id);

    const images =
      post.images
        .map(
          (src) => `
            <div class="post-image">
              <img
                src="${esc(src)}"
                alt="Post image"
                loading="lazy"
              >
            </div>
          `
        )
        .join("");

    const videos =
      post.videos
        .map(
          (src) => `
            <div class="post-image">
              <video
                class="post-video"
                src="${esc(src)}"
                controls
                playsinline
              ></video>
            </div>
          `
        )
        .join("");

    return `
      <article
        class="post ${
          detailMode
            ? "detail-post"
            : "clickable"
        }"
        data-id="${esc(post.id)}"
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

                ${
                  post.vip
                    ? `
                      <span class="vip">
                        VIP
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
          ${hashtagHTML(post.text)}
        </div>


        ${images}

        ${videos}


        <div class="post-stats">

          <span>
            ${fmt(post.likes)} likes
          </span>

          <span>
            ${fmt(post.comments)} replies
          </span>

          <span>
            ${fmt(post.reposts)} reposts
          </span>

          <span>
            ${fmt(post.views)} views
          </span>

        </div>


        <div class="post-actions">

          <div class="post-left-actions">

            <button
              class="action ${
                liked ? "liked" : ""
              }"
              data-action="like"
              type="button"
              aria-label="Like"
            >
              <i data-lucide="heart"></i>
              <span class="count">
                ${fmt(post.likes)}
              </span>
            </button>


            <button
              class="action"
              data-action="reply"
              type="button"
              aria-label="Reply"
            >
              <i data-lucide="message-circle"></i>
              <span class="count">
                ${fmt(post.comments)}
              </span>
            </button>


            <button
              class="action ${
                reposted ? "active" : ""
              }"
              data-action="repost"
              type="button"
              aria-label="Repost"
            >
              <i data-lucide="repeat-2"></i>
              <span class="count">
                ${fmt(post.reposts)}
              </span>
            </button>


            <button
              class="action ${
                saved ? "active" : ""
              }"
              data-action="save"
              type="button"
              aria-label="Save"
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
    if (!stories) return;

    stories.innerHTML =
      app.stories
        .map(
          (story) => `
            <button
              class="
                story
                ${story.seen ? "seen" : ""}
                ${story.mine ? "mine" : ""}
              "
              data-story-id="${esc(story.id)}"
              type="button"
            >

              <div class="story-ring">

                <div
                  class="story-avatar"
                  style="
                    background:
                      linear-gradient(
                        135deg,
                        ${esc(
                          story.gradient?.[0] ||
                          "#8B3DFF"
                        )},
                        ${esc(
                          story.gradient?.[1] ||
                          "#C54DFF"
                        )}
                      )
                  "
                >
                  ${esc(
                    story.letter ||
                    story.name?.[0] ||
                    "Λ"
                  )}
                </div>

              </div>


              ${
                story.mine
                  ? `
                    <span class="story-plus">
                      +
                    </span>
                  `
                  : ""
              }


              <div class="story-name">
                ${esc(story.name)}
              </div>

            </button>
          `
        )
        .join("");

    refreshIcons();
  }

  function renderPosts() {
    if (!feed) return;

    if (!app.posts.length) {
      feed.innerHTML = `
        <div class="empty-state">
          <strong>
            No posts yet
          </strong>

          <span>
            Create the first post.
          </span>
        </div>
      `;

      return;
    }

    feed.innerHTML =
      app.posts
        .map((post) =>
          postHTML(post)
        )
        .join("");

    refreshIcons();
  }

  function refreshIcons() {
    if (
      window.lucide
    ) {
      window.lucide.createIcons();
    }
  }

  function openStory(id) {
    const story =
      app.stories.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!story) return;

    story.seen = true;

    renderStories();

    const name =
      $("#storyViewerName");

    const avatar =
      $("#storyViewerAvatar");

    const image =
      $("#storyViewerImage");

    const text =
      $("#storyViewerText");

    if (name) {
      name.textContent =
        story.name ||
        "Story";
    }

    if (avatar) {
      avatar.textContent =
        story.letter ||
        story.name?.[0] ||
        "Λ";

      avatar.style.background =
        `linear-gradient(
          135deg,
          ${story.gradient?.[0] || "#8B3DFF"},
          ${story.gradient?.[1] || "#C54DFF"}
        )`;
    }

    if (image) {
      image.style.backgroundImage =
        story.images?.[0]
          ? `url("${String(
              story.images[0]
            ).replace(
              /"/g,
              '\\"'
            )}")`
          : "none";
    }

    if (text) {
      text.textContent =
        story.text ||
        "";
    }

    $("#storyViewer")
      ?.classList
      .remove("hidden");

    $("#storyViewer")
      ?.setAttribute(
        "aria-hidden",
        "false"
      );
  }

  function closeStory() {
    $("#storyViewer")
      ?.classList
      .add("hidden");

    $("#storyViewer")
      ?.setAttribute(
        "aria-hidden",
        "true"
      );
  }

  function getReplies(post) {
    return post.replies?.length
      ? post.replies
      : demoReplies.map(
          (reply) => ({
            ...reply
          })
        );
  }

  function openPostDetail(id) {
    const post =
      app.posts.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!post) return;

    activePostId =
      post.id;

    detailBody.innerHTML =
      postHTML(
        post,
        true
      );

    const list =
      getReplies(post);

    replyCount.textContent =
      String(
        list.length
      );

    replies.innerHTML =
      list
        .map(
          (reply) => `
            <div class="reply">

              ${avatarHTML(
                reply,
                true
              )}

              <div class="reply-main">

                <div class="reply-name">
                  ${esc(reply.name)}
                </div>

                <div class="reply-text">
                  ${hashtagHTML(
                    reply.text
                  )}
                </div>

                <div class="reply-like">
                  ♥ ${fmt(
                    reply.likes || 0
                  )}
                </div>

              </div>

            </div>
          `
        )
        .join("");

    detail
      .classList
      .remove("hidden");

    detail.setAttribute(
      "aria-hidden",
      "false"
    );

    refreshIcons();
  }

  function closeDetail() {
    detail?.classList.add(
      "hidden"
    );

    detail?.setAttribute(
      "aria-hidden",
      "true"
    );

    activePostId =
      null;
  }

  function addReply(text) {
    const post =
      app.posts.find(
        (item) =>
          String(item.id) ===
          String(activePostId)
      );

    const cleanText =
      String(
        text || ""
      ).trim();

    if (
      !post ||
      !cleanText
    ) {
      return;
    }

    const user =
      userAvatar();

    post.replies =
      post.replies || [];

    post.replies.push({
      name: user.name,
      letter: user.letter,
      text: cleanText,
      likes: 0
    });

    post.comments += 1;

    persistPost(post);

    o
