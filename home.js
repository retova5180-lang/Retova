(() => {
  "use strict";

  const POST_KEY = "ars_local_posts";
  const STORY_KEY = "ars_local_stories";
  const STATE_KEY = "ars_home_state";

  const $ = (selector) => document.querySelector(selector);

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

  const demos = [
    {
      id: "demo-1",
      name: "Apple",
      username: "apple",
      letter: "A",
      gradient: ["#202020", "#666666"],
      verified: true,
      time: "12m",
      text:
        "A cleaner way to create, share and discover what matters to you.",
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
          gradient: ["#8B3DFF", "#C54DFF"],
          text: "This looks amazing.",
          likes: 24
        },
        {
          name: "Noah",
          letter: "N",
          gradient: ["#2563EB", "#06B6D4"],
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
      text: "Finally finished my new workspace setup. ✨",
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
          gradient: ["#EC4899", "#F97316"],
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
      text:
        "Morning thoughts. Keep moving even when nobody is watching.",
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
          gradient: ["#334155", "#64748B"],
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
      text: "Small wins still count. 🌙",
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
      text:
        "Reposted this because it deserved another look.",
      images: [],
      videos: [],
      likes: 320,
      comments: 18,
      reposts: 19,
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
    },
    {
      id: "wheel-story",
      name: "Wheel",
      wheel: true,
      text: "Spin the daily wheel."
    }
  ];

  const demoReplies = [
    {
      name: "Emma",
      letter: "E",
      gradient: ["#8B3DFF", "#C54DFF"],
      text: "Love this.",
      likes: 7
    },
    {
      name: "Omar",
      letter: "O",
      gradient: ["#334155", "#64748B"],
      text: "Exactly what I needed today.",
      likes: 11
    }
  ];

  function esc(value) {
    return String(value ?? "").replace(
      /[&<>'"]/g,
      (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;"
      }[character])
    );
  }

  function fmt(value) {
    const number = Number(value) || 0;

    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    }

    if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}K`;
    }

    return String(number);
  }

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("ΛRS storage error:", error);
    }
  }

  function profile() {
    try {
      return JSON.parse(localStorage.getItem("ars_user")) || {};
    } catch {
      return {};
    }
  }

  function userAvatar() {
    const user = profile();

    return {
      letter: user.letter || "R",
      avatar: user.avatar || "",
      gradient: [
        user.letterColor || "#8B3DFF",
        user.background || "#C54DFF"
      ],
      name: user.displayName || user.name || "You",
      username: user.username || "you"
    };
  }

  function load() {
    const savedState = read(STATE_KEY, {});

    app.liked = new Set(savedState.liked || []);
    app.reposted = new Set(savedState.reposted || []);
    app.saved = new Set(savedState.saved || []);

    const localPosts = read(POST_KEY, [])
      .filter(Boolean)
      .map(normalizePost);

    app.posts = [...localPosts, ...demos].map(normalizePost);

    const localStories = read(STORY_KEY, [])
      .filter(
        (story) =>
          !story.expiresAt ||
          Number(story.expiresAt) > Date.now()
      )
      .map((story) => ({
        ...story,
        mine: true
      }));

    app.stories = [...localStories, ...demoStories];
  }

  function saveState() {
    write(STATE_KEY, {
      liked: [...app.liked],
      reposted: [...app.reposted],
      saved: [...app.saved]
    });
  }

  function normalizePost(post) {
    return {
      ...post,
      likes: Number(post.likes) || 0,
      comments: Number(post.comments) || 0,
      reposts: Number(post.reposts) || 0,
      views: Number(post.views) || 0,

      images: Array.isArray(post.images)
        ? post.images
        : post.image
          ? [post.image]
          : [],

      videos: Array.isArray(post.videos)
        ? post.videos
        : post.video
          ? [post.video]
          : [],

      replies: Array.isArray(post.replies)
        ? post.replies
        : []
    };
  }

  function avatarHTML(person, small = false) {
    const gradient =
      person.gradient || ["#8B3DFF", "#C54DFF"];

    const className = small
      ? "reply-avatar"
      : "post-avatar";

    const avatar = person.avatar || "";

    return `
      <div
        class="${className}"
        style="background:linear-gradient(135deg,${esc(
          gradient[0]
        )},${esc(gradient[1])})"
      >
        ${
          avatar
            ? `<img src="${esc(avatar)}" alt="">`
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

  function mediaHTML(post) {
    const images = post.images || [];
    const videos = post.videos || [];

    const imageMarkup = images
      .map(
        (image) => `
          <div class="post-image">
            <img
              src="${esc(image)}"
              alt="Post media"
              loading="lazy"
            >
          </div>
        `
      )
      .join("");

    const videoMarkup = videos
      .map(
        (video) => `
          <video
            class="post-video"
            controls
            playsinline
            preload="metadata"
            src="${esc(video)}"
          ></video>
        `
      )
      .join("");

    return imageMarkup + videoMarkup;
  }

  function postHTML(post, detailMode = false) {
    const liked = app.liked.has(post.id);
    const reposted = app.reposted.has(post.id);
    const saved = app.saved.has(post.id);

    return `
      <article
        class="post ${
          detailMode ? "detail-post" : "clickable"
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
                @${esc(post.username || "user")}
              </div>

              <div class="post-time">
                ${esc(post.time || "now")}
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
          ${textHTML(post.text || "")}
        </div>

        ${mediaHTML(post)}

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
              <span class="count">
                ${fmt(post.likes)}
              </span>
            </button>

            <button
              class="action"
              data-action="reply"
              type="button"
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

    stories.innerHTML = app.stories
      .map((story) => {
        if (story.wheel) {
          return `
            <button
              class="story story-wheel"
              type="button"
              data-wheel-story
              aria-label="Open Wheel"
            >
              <div class="story-ring">
                <div class="story-avatar wheel-story-avatar">
                  <span>ΛRS</span>
                </div>
              </div>

              <div class="story-name">
                Wheel
              </div>
            </button>
          `;
        }

        const gradient =
          story.gradient ||
          ["#8B3DFF", "#C54DFF"];

        const avatar = story.avatar || "";

        return `
          <button
            class="story ${
              story.seen ? "seen" : ""
            } ${story.mine ? "mine" : ""}"
            data-story-id="${esc(story.id)}"
            type="button"
            aria-label="Open ${esc(
              story.name
            )} story"
          >
            <div class="story-ring">

              <div
                class="story-avatar"
                style="background:linear-gradient(135deg,${esc(
                  gradient[0]
                )},${esc(gradient[1])})"
              >
                ${
                  avatar
                    ? `<img src="${esc(
                        avatar
                      )}" alt="">`
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
                ? '<span class="story-plus">+</span>'
                : ""
            }

            <div class="story-name">
              ${esc(story.name)}
            </div>
          </button>
        `;
      })
      .join("");

    refreshIcons();
  }

  function renderPosts() {
    if (!feed) return;

    if (!app.posts.length) {
      feed.innerHTML = `
        <div class="empty-state">
          <strong>No posts yet</strong>
          <span>Create the first post.</span>
        </div>
      `;

      return;
    }

    feed.innerHTML = app.posts
      .map((post) => postHTML(post))
      .join("");

    refreshIcons();
  }

  function refreshIcons() {
    if (
      window.lucide &&
      typeof window.lucide.createIcons ===
        "function"
    ) {
      window.lucide.createIcons();
    }
  }

  function openStory(id) {
    const story = app.stories.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!story) return;

    story.seen = true;
    renderStories();

    const viewer = $("#storyViewer");
    const viewerName = $("#storyViewerName");
    const viewerAvatar = $(
      "#storyViewerAvatar"
    );
    const viewerImage = $(
      "#storyViewerImage"
    );
    const viewerVideo = $(
      "#storyViewerVideo"
    );
    const viewerText = $(
      "#storyViewerText"
    );

    if (
      !viewer ||
      !viewerName ||
      !viewerAvatar ||
      !viewerImage ||
      !viewerText
    ) {
      return;
    }

    viewerName.textContent =
      story.name || "Story";

    viewerAvatar.textContent =
      story.letter ||
      story.name?.[0] ||
      "Λ";

    viewerAvatar.style.background =
      `linear-gradient(135deg,${
        story.gradient?.[0] ||
        "#8B3DFF"
      },${
        story.gradient?.[1] ||
        "#C54DFF"
      })`;

    const image =
      story.images?.[0] ||
      story.image ||
      "";

    const video =
      story.videos?.[0] ||
      story.video ||
      "";

    viewerImage.style.backgroundImage =
      image
        ? `url("${String(image).replace(
            /"/g,
            '\\"'
          )}")`
        : "none";

    if (viewerVideo) {
      viewerVideo.pause();
      viewerVideo.removeAttribute("src");
      viewerVideo.load();
      viewerVideo.classList.add(
        "hidden"
      );

      if (video) {
        viewerVideo.src = video;
        viewerVideo.classList.remove(
          "hidden"
        );

        viewerImage.style.backgroundImage =
          "none";

        viewerVideo.load();

        viewerVideo.play().catch(
          () => {}
        );
      }
    }

    viewerText.textContent =
      story.text || "";

    viewer.classList.remove("hidden");

    viewer.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  function closeStory() {
    const viewer = $("#storyViewer");
    const video = $(
      "#storyViewerVideo"
    );

    if (video) {
      video.pause();
    }

    viewer?.classList.add("hidden");

    viewer?.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  function getReplies(post) {
    return post.replies?.length
      ? post.replies
      : demoReplies.map((reply) => ({
          ...reply
        }));
  }

  function openPostDetail(id) {
    const post = app.posts.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (
      !post ||
      !detail ||
      !detailBody ||
      !replies ||
      !replyCount
    ) {
      return;
    }

    activePostId = post.id;

    detailBody.innerHTML =
      postHTML(post, true);

    const list = getReplies(post);

    replyCount.textContent =
      String(list.length);

    replies.innerHTML = list
      .map(
        (reply) => `
          <div class="reply">
            ${avatarHTML(reply, true)}

            <div class="reply-main">
              <div class="reply-name">
                ${esc(reply.name)}
              </div>

              <div class="reply-text">
                ${textHTML(reply.text)}
              </div>

              <div class="reply-like">
                ♥ ${fmt(reply.likes || 0)}
              </div>
            </div>
          </div>
        `
      )
      .join("");

    detail.classList.remove(
      "hidden"
    );

    detail.setAttribute(
      "aria-hidden",
      "false"
    );

    refreshIcons();
  }

  function closeDetail() {
    detail?.classList.add("hidden");

    detail?.setAttribute(
      "aria-hidden",
      "true"
    );

    activePostId = null;
  }

  function persistPost(post) {
    const localPosts =
      read(POST_KEY, []);

    const index =
      localPosts.findIndex(
        (item) =>
          String(item.id) ===
          String(post.id)
      );

    if (index >= 0) {
      localPosts[index] = post;
    } else if (
      String(post.id).startsWith(
        "local-"
      )
    ) {
      localPosts.unshift(post);
    } else {
      return;
    }

    write(
      POST_KEY,
      localPosts
    );
  }

  function completeChallenge(id) {
    if (
      window.ARSWheel &&
      typeof window.ARSWheel
        .completeChallenge ===
        "function"
    ) {
      window.ARSWheel.completeChallenge(
        id
      );
    }
  }

  function toggleAction(id, action) {
    const post = app.posts.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!post) return;

    if (action === "like") {
      if (app.liked.has(post.id)) {
        app.liked.delete(post.id);

        post.likes = Math.max(
          0,
          post.likes - 1
        );
      } else {
        app.liked.add(post.id);

        post.likes += 1;

        completeChallenge(
          "like"
        );
      }
    }

    if (action === "repost") {
      if (
        app.reposted.has(post.id)
      ) {
  
