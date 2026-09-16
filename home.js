(() => {
  "use strict";

  const POST_KEY = "ars_local_posts";
  const STORY_KEY = "ars_local_stories";
  const STATE_KEY = "ars_home_state";

  const $ = (selector, root = document) => {
    return root.querySelector(selector);
  };

  const feed = $("#feed");
  const storiesEl = $("#stories");

  const postDetail = $("#postDetail");
  const detailPostBody = $("#detailPostBody");
  const detailReplies = $("#detailReplies");
  const replyForm = $("#replyForm");
  const replyInput = $("#replyInput");
  const replyCount = $("#replyCount");
  const replyAvatar = $("#replyAvatar");

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
      id: "demo-story-you",
      name: "You",
      letter: "R",
      gradient: ["#8b3dff", "#c54dff"],
      mine: true,
      text: "Add your first story."
    },
    {
      id: "demo-story-lina",
      name: "Lina",
      letter: "L",
      gradient: ["#8b3dff", "#c54dff"],
      text: "Sunset always hits different 💜",
      image:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85"
    },
    {
      id: "demo-story-noah",
      name: "Noah",
      letter: "N",
      gradient: ["#252b38", "#5b6578"],
      text: "Focused on the journey."
    },
    {
      id: "demo-story-sara",
      name: "Sara",
      letter: "S",
      gradient: ["#8b3dff", "#ee4cff"],
      text: "Weekend mood ✨",
      image:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=85"
    },
    {
      id: "demo-story-wheel",
      name: "Wheel",
      wheel: true,
      text: "Spin the wheel."
    },
    {
      id: "demo-story-apple",
      name: "Apple",
      letter: "",
      gradient: ["#09090b", "#44444c"],
      verified: true,
      text: "Apple updates."
    },
    {
      id: "demo-story-ferrari",
      name: "Ferrari",
      letter: "F",
      gradient: ["#f01825", "#721018"],
      verified: true,
      text: "Racing weekend."
    },
    {
      id: "demo-story-bmw",
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
      text:
        "Apple Intelligence expands to more languages later this year.",
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
      text:
        "Reposted this because it deserved another look. #inspiration",
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

  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) => {
        const map = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        };

        return map[character];
      }
    );
  }

  function formatNumber(value) {
    const number = Number(value) || 0;

    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    }

    if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}K`;
    }

    return String(number);
  }

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        return fallback;
      }

      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch {
      return;
    }
  }

  function getUser() {
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

  function getMyAvatar() {
    const user = getUser();

    return {
      name: user.displayName || "You",
      username: user.username || "you",
      letter: user.letter || "R",
      avatar: user.avatar || "",
      letterColor:
        user.letterColor || "#8b3dff",
      background:
        user.background || "#c54dff"
    };
  }

  function normalizePost(post) {
    return {
      ...post,
      likes: Number(post.likes) || 0,
      comments: Number(post.comments) || 0,
      reposts: Number(post.reposts) || 0,
      views: Number(post.views) || 0,
      replies: Array.isArray(post.replies)
        ? post.replies
        : []
    };
  }

  function loadState() {
    const savedState =
      readStorage(
        STATE_KEY,
        {}
      );

    state.liked = new Set(
      Array.isArray(savedState.liked)
        ? savedState.liked
        : []
    );

    state.reposted = new Set(
      Array.isArray(savedState.reposted)
        ? savedState.reposted
        : []
    );

    state.saved = new Set(
      Array.isArray(savedState.saved)
        ? savedState.saved
        : []
    );

    const localPosts =
      readStorage(
        POST_KEY,
        []
      )
        .filter(Boolean)
        .map(normalizePost);

    state.posts = [
      ...localPosts,
      ...demoPosts
    ].map(normalizePost);

    const now = Date.now();

    const localStories =
      readStorage(
        STORY_KEY,
        []
      ).filter(
        (story) =>
          !story.expiresAt ||
          Number(story.expiresAt) > now
      );

    state.stories = [
      ...localStories,
      ...demoStories
    ];
  }

  function saveState() {
    writeStorage(
      STATE_KEY,
      {
        liked: [...state.liked],
        reposted: [...state.reposted],
        saved: [...state.saved]
      }
    );
  }

  function saveLocalPost(post) {
    if (
      !String(post.id).startsWith("post-")
    ) {
      return;
    }

    const posts =
      readStorage(
        POST_KEY,
        []
      );

    const index =
      posts.findIndex(
        (item) =>
          String(item.id) ===
          String(post.id)
      );

    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.unshift(post);
    }

    writeStorage(
      POST_KEY,
      posts
    );
  }

  function avatarHTML(person, reply = false) {
    const gradient =
      Array.isArray(person.gradient)
        ? person.gradient
        : ["#8b3dff", "#c54dff"];

    const className =
      reply
        ? "reply-avatar"
        : "post-avatar";

    if (person.avatar) {
      return `
        <div
          class="${className}"
          style="background:linear-gradient(135deg,${escapeHTML(
            gradient[0]
          )},${escapeHTML(gradient[1])})"
        >
          <img
            src="${escapeHTML(person.avatar)}"
            alt=""
          >
        </div>
      `;
    }

    return `
      <div
        class="${className}"
        style="background:linear-gradient(135deg,${escapeHTML(
          gradient[0]
        )},${escapeHTML(gradient[1])})"
      >
        ${escapeHTML(
          person.letter ||
          person.name?.[0] ||
          "Λ"
        )}
      </div>
    `;
  }

  function textHTML(text) {
    return escapeHTML(text).replace(
      /(^|\s)(#[a-zA-Z0-9_]+)/g,
      "$1<span class=\"hashtag\">$2</span>"
    );
  }

  function mediaHTML(post) {
    const images = [];

    if (post.image) {
      images.push({
        type: "image",
        data: post.image
      });
    }

    if (Array.isArray(post.images)) {
      post.images.forEach(
        (image) => {
          if (image) {
            images.push({
              type: "image",
              data: image
            });
          }
        }
      );
    }

    if (post.video) {
      images.push({
        type: "video",
        data: post.video
      });
    }

    if (Array.isArray(post.videos)) {
      post.videos.forEach(
        (video) => {
          if (video) {
            images.push({
              type: "video",
              data: video
            });
          }
        }
      );
    }

    const uniqueMedia =
      images.filter(
        (item, index, array) =>
          array.findIndex(
            (other) =>
              other.data === item.data
          ) === index
      );

    return uniqueMedia
      .map((media) => {
        if (media.type === "video") {
          return `
            <video
              class="post-video"
              controls
              playsinline
              preload="metadata"
              src="${escapeHTML(media.data)}"
            ></video>
          `;
        }

        return `
          <div class="post-image">
            <img
              src="${escapeHTML(media.data)}"
              alt="Post media"
              loading="lazy"
            >
          </div>
        `;
      })
      .join("");
  }

  function postHTML(post, detail = false) {
    const liked =
      state.liked.has(post.id);

    const reposted =
      state.reposted.has(post.id);

    const saved =
      state.saved.has(post.id);

    return `
      <article
        class="post ${detail ? "detail-post" : "clickable"}"
        data-post-id="${escapeHTML(post.id)}"
      >

        <div class="post-header">

          <div class="post-user">
            ${avatarHTML(post)}

            <div class="post-info">

              <div class="post-name">

                ${escapeHTML(post.name)}

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
                @${escapeHTML(
                  post.username || "user"
                )}
              </div>

              <div class="post-time">
                ${escapeHTML(
                  post.time || "now"
                )}
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
          <span>
            ${formatNumber(post.likes)} likes
          </span>

          <span>
            ${formatNumber(post.comments)} replies
          </span>

          <span>
            ${formatNumber(post.reposts)} reposts
          </span>

          <span>
            ${formatNumber(post.views)} views
          </span>
        </div>

        <div class="post-actions">

          <div class="post-left-actions">

            <button
              class="action ${liked ? "liked" : ""}"
              type="button"
              data-action="like"
            >
              <i data-lucide="heart"></i>
              <span>
                ${formatNumber(post.likes)}
              </span>
            </button>

            <button
              class="action"
              type="button"
              data-action="reply"
            >
              <i data-lucide="message-circle"></i>
              <span>
                ${formatNumber(post.comments)}
              </span>
            </button>

            <button
              class="action ${reposted ? "reposted" : ""}"
              type="button"
              data-action="repost"
            >
              <i data-lucide="repeat-2"></i>
              <span>
                ${formatNumber(post.reposts)}
              </span>
            </button>

            <button
              class="action ${saved ? "saved" : ""}"
              type="button"
              data-action="save"
              aria-label="Save"
            >
              <i data-lucide="bookmark"></i>
            </button>

          </div>

          <div class="action-views">
            <i data-lucide="eye"></i>
            ${formatNumber(post.views)}
          </div>

        </div>

      </article>
    `;
  }

  function renderStories() {
    if (!storiesEl) {
      return;
    }

    storiesEl.innerHTML =
      state.stories
        .map((story) => {
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

          const gradient =
            Array.isArray(story.gradient)
              ? story.gradient
              : ["#8b3dff", "#c54dff"];

          return `
            <button
              class="story ${
                story.seen
                  ? "seen"
                  : ""
              } ${
                story.mine
                  ? "mine"
                  : ""
              }"
              type="button"
              data-story-id="${escapeHTML(
                story.id
              )}"
            >

              <div class="story-ring">

                <div
                  class="story-avatar"
                  style="background:linear-gradient(135deg,${escapeHTML(
                    gradient[0]
                  )},${escapeHTML(
                    gradient[1]
                  )})"
                >

                  ${
                    story.avatar
                      ? `
                        <img
                          src="${escapeHTML(
                            story.avatar
                          )}"
                          alt=""
                        >
                      `
                      : escapeHTML(
                          story.letter ||
                          story.name?.[0] ||
                          "Λ"
                        )
                  }

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
                ${escapeHTML(
                  story.name
                )}
              </div>

            </button>
          `;
        })
        .join("");

    refreshIcons();
  }

  function renderPosts() {
    if (!feed) {
      return;
    }

    if (!state.posts.length) {
      feed.innerHTML = `
        <div class="empty-state">
          <strong>No posts yet</strong>
          <span>
            Create the first post.
          </span>
        </div>
      `;

      return;
    }

    feed.innerHTML =
      state.posts
        .map(
          (post) =>
            postHTML(post)
        )
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

  function renderReply(reply) {
    return `
      <div class="reply">

        ${avatarHTML(
          reply,
          true
        )}

        <div class="reply-body">

          <div class="reply-name">
            ${escapeHTML(
              reply.name || "User"
            )}
          </div>

          <div class="reply-text">
            ${escapeHTML(
              reply.text || ""
            )}
          </div>

          <div class="reply-likes">
            ${formatNumber(
              reply.likes
            )} likes
          </div>

        </div>

      </div>
    `;
  }

  function openPost(postId) {
    const post =
      state.posts.find(
        (item) =>
          String(item.id) ===
          String(postId)
      );

    if (!post || !postDetail) {
      return;
    }

    activePostId = post.id;

    postDetail.classList.remove(
      "hidden"
    );

    postDetail.setAttribute(
      "aria-hidden",
      "false"
    );

    if (detailPostBody) {
      detailPostBody.innerHTML =
        postHTML(
          post,
          true
        );
    }

    if (detailReplies) {
      detailReplies.innerHTML =
        post.replies.length
          ? post.replies
              .map(renderReply)
              .join("")
          : `
            <div class="empty-state">
              <span>
                No replies yet.
              </span>
            </div>
          `;
    }

    if (replyCount) {
      replyCount.textContent =
        String(
          post.replies.length
        );
    }

    updateReplyAvatar();
    refreshIcons();
  }

  function closePost() {
    if (!postDetail) {
      return;
    }

    postDetail.classList.add(
      "hidden"
    );

    postDetail.setAttribute(
      "aria-hidden",
      "true"
    );

    activePostId = null;
  }

  function openStory(storyId) {
    const story =
      state.stories.find(
        (item) =>
          String(item.id) ===
          String(storyId)
      );

    if (!story) {
      return;
    }

    story.seen = true;

    renderStories();

    const viewer =
      $("#storyViewer");

    const vi 
