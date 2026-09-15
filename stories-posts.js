(() => {
  "use strict";

  /*
    ΛRS — STORIES + POSTS
    Standalone feed system.

    This file does NOT depend on home.js.
    It renders directly into:
      #stories
      #feed

    It also handles:
      - Stories
      - Story viewer
      - Posts
      - Likes
      - Reposts
      - Saves
      - Replies
      - Hashtags
      - Post menu
  */

  const STORIES_KEY = "ars_stories_standalone";
  const POSTS_KEY = "ars_posts_standalone";
  const ACTIONS_KEY = "ars_posts_actions";

  const storiesContainer = document.getElementById("stories");
  const feedContainer = document.getElementById("feed");

  if (!storiesContainer || !feedContainer) {
    console.error(
      "ΛRS Stories/Posts: #stories or #feed was not found."
    );
    return;
  }

  /* -------------------------------------------------------
     CSS
  ------------------------------------------------------- */

  const style = document.createElement("style");

  style.textContent = `
    /* ==============================
       STORIES
    ============================== */

    #stories {
      display: flex !important;
      align-items: flex-start;
      gap: 12px;
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 14px 16px 12px;
      scrollbar-width: none;
    }

    #stories::-webkit-scrollbar {
      display: none;
    }

    .ars-story {
      position: relative;
      flex: 0 0 70px;
      width: 70px;
      border: 0;
      outline: 0;
      padding: 0;
      background: transparent;
      color: #fff;
      cursor: pointer;
      text-align: center;
      font: inherit;
    }

    .ars-story-ring {
      width: 62px;
      height: 62px;
      margin: 0 auto 6px;
      padding: 3px;
      border-radius: 50%;
      background:
        linear-gradient(
          135deg,
          #8b3dff,
          #d946ef,
          #ff4ca8
        );
    }

    .ars-story.seen .ars-story-ring {
      background: #39333f;
    }

    .ars-story-avatar {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      border-radius: 50%;
      border: 3px solid #07070a;
      background:
        linear-gradient(
          135deg,
          #20152c,
          #5d2b83
        );
      color: #fff;
      font-size: 20px;
      font-weight: 800;
    }

    .ars-story-name {
      display: block;
      width: 70px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #aaa2b2;
      font-size: 11px;
      line-height: 1.2;
    }

    .ars-story-plus {
      position: absolute;
      top: 43px;
      right: 3px;
      width: 21px;
      height: 21px;
      display: grid;
      place-items: center;
      border: 2px solid #07070a;
      border-radius: 50%;
      background: #8b3dff;
      color: white;
      font-size: 14px;
      font-weight: 900;
    }

    .ars-wheel-story .ars-story-avatar {
      background:
        repeating-conic-gradient(
          from 0deg,
          #8b3dff 0deg 30deg,
          #2b163d 30deg 60deg
        );
      font-size: 24px;
    }

    /* ==============================
       FEED
    ============================== */

    #feed {
      display: block !important;
      width: 100%;
      margin: 0;
      padding: 0;
    }

    .ars-post {
      width: 100%;
      box-sizing: border-box;
      padding: 17px 16px 15px;
      border-top: 1px solid rgba(255,255,255,.07);
      background: rgba(5,5,8,.78);
    }

    .ars-post-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .ars-post-user {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .ars-post-avatar {
      width: 43px;
      height: 43px;
      flex: 0 0 43px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 50%;
      color: white;
      font-weight: 800;
      font-size: 17px;
    }

    .ars-post-info {
      min-width: 0;
    }

    .ars-post-name {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #fff;
      font-size: 14px;
      font-weight: 800;
    }

    .ars-verified {
      color: #b66cff;
      font-size: 14px;
    }

    .ars-post-meta {
      margin-top: 2px;
      color: #77707f;
      font-size: 12px;
    }

    .ars-post-menu {
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: #716978;
      cursor: pointer;
    }

    .ars-post-menu:hover {
      background: rgba(139,61,255,.1);
      color: #c78cff;
    }

    .ars-post-text {
      margin: 13px 0 12px 53px;
      color: #f2edf5;
      font-size: 15px;
      line-height: 1.55;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }

    .ars-hashtag {
      color: #b96cff;
      font-weight: 700;
    }

    .ars-repost {
      margin: 2px 0 8px 53px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #a96aff;
      font-size: 12px;
      font-weight: 700;
    }

    .ars-post-media {
      margin-left: 53px;
      height: 220px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      background:
        radial-gradient(
          circle at 20% 20%,
          rgba(195,75,255,.55),
          transparent 34%
        ),
        radial-gradient(
          circle at 80% 70%,
          rgba(255,76,168,.22),
          transparent 35%
        ),
        linear-gradient(
          135deg,
          #120c19,
          #32124d,
          #100a17
        );
    }

    .ars-post-media img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }

    .ars-post-stats {
      display: flex;
      gap: 13px;
      margin: 11px 0 0 53px;
      color: #6f6877;
      font-size: 10px;
      overflow-x: auto;
      white-space: nowrap;
      scrollbar-width: none;
    }

    .ars-post-stats::-webkit-scrollbar {
      display: none;
    }

    .ars-post-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 8px 0 0 53px;
    }

    .ars-post-action-group {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .ars-post-action {
      min-width: 42px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: #716978;
      cursor: pointer;
      font-size: 11px;
    }

    .ars-post-action:hover {
      background: rgba(139,61,255,.1);
      color: #c88cff;
    }

    .ars-post-action.like-active {
      color: #ff65ba;
    }

    .ars-post-action.repost-active {
      color: #a873ff;
    }

    .ars-post-action.save-active {
      color: #c681ff;
    }

    .ars-post-views {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #6d6674;
      font-size: 10px;
    }

    .ars-empty-feed {
      padding: 50px 20px;
      text-align: center;
      color: #77707f;
    }

    .ars-empty-feed strong {
      display: block;
      margin-bottom: 5px;
      color: #c9c1d1;
    }

    /* ==============================
       STORY VIEWER
    ============================== */

    .ars-story-viewer {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0,0,0,.88);
    }

    .ars-story-viewer.open {
      display: flex;
    }

    .ars-story-viewer-card {
      position: relative;
      width: min(430px, 100%);
      height: min(760px, 90vh);
      overflow: hidden;
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,.12);
      background:
        linear-gradient(
          160deg,
          #22142f,
          #08070b 70%
        );
      box-shadow: 0 30px 90px rgba(0,0,0,.7);
    }

    .ars-story-close {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 5;
      width: 38px;
      height: 38px;
      border: 0;
      border-radius: 50%;
      background: rgba(0,0,0,.5);
      color: white;
      cursor: pointer;
    }

    .ars-story-progress {
      position: absolute;
      top: 12px;
      left: 14px;
      right: 64px;
      z-index: 5;
      height: 3px;
      overflow: hidden;
      border-radius: 99px;
      background: rgba(255,255,255,.25);
    }

    .ars-story-progress span {
      display: block;
      width: 100%;
      height: 100%;
      background: white;
    }

    .ars-story-viewer-avatar {
      position: absolute;
      top: 30px;
      left: 18px;
      z-index: 4;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: 2px solid white;
      border-radius: 50%;
      color: white;
      font-weight: 800;
    }

    .ars-story-viewer-name {
      position: absolute;
      top: 38px;
      left: 68px;
      z-index: 4;
      color: white;
      font-size: 13px;
      font-weight: 800;
    }

    .ars-story-viewer-content {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      padding: 30px;
      text-align: center;
    }

    .ars-story-viewer-content .ars-story-big-letter {
      font-size: 100px;
      font-weight: 900;
      color: white;
    }

    .ars-story-viewer-content .ars-story-message {
      position: absolute;
      left: 24px;
      right: 24px;
      bottom: 35px;
      color: white;
      font-size: 17px;
      font-weight: 700;
      text-shadow: 0 2px 15px black;
    }

    @media (min-width: 700px) {
      #stories,
      #feed {
        max-width: 680px;
        margin-left: auto;
        margin-right: auto;
      }
    }

    @media (max-width: 520px) {
      .ars-post-media {
        height: 185px;
      }
    }
  `;

  document.head.appendChild(style);

  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const stories = [
    {
      id: "you",
      name: "You",
      letter: "R",
      mine: true,
      gradient: ["#8b3dff", "#c54dff"],
      text: "Add your first story."
    },
    {
      id: "lina",
      name: "Lina",
      letter: "L",
      gradient: ["#8b3dff", "#c54dff"],
      text: "Sunset always hits different 💜"
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
      text: "Weekend mood ✨"
    },
    {
      id: "wheel",
      name: "Wheel",
      wheel: true
    },
    {
      id: "apple",
      name: "Apple",
      letter: "",
      gradient: ["#09090b", "#44444c"],
      verified: true,
      text: "Apple updates."
    }
  ];

  const posts = [
    {
      id: "ars-post-1",
      name: "Lina",
      username: "lina.ae",
      letter: "L",
      gradient: ["#8b3dff", "#c54dff"],
      verified: true,
      time: "12m",
      text: "Sunset always hits different 💜 #sunset #mood",
      likes: 2400,
      comments: 186,
      reposts: 312,
      views: 48000,
      media: true
    },
    {
      id: "ars-post-2",
      name: "Noah",
      username: "noah.vibes",
      letter: "N",
      gradient: ["#252b38", "#5b6578"],
      verified: true,
      time: "45m",
      text: "Focused on the journey. #focus #life",
      likes: 910,
      comments: 73,
      reposts: 118,
      views: 18400,
      media: true
    },
    {
      id: "ars-post-3",
      name: "Sara",
      username: "sara.vibes",
      letter: "S",
      gradient: ["#8b3dff", "#ee4cff"],
      time: "1h",
      text: "Reposted this because it deserved another look. #inspiration",
      likes: 1260,
      comments: 74,
      reposts: 31,
      views: 22000,
      repost: true,
      media: true
    }
  ];

  const actions = {
    likes: new Set(),
    reposts: new Set(),
    saves: new Set()
  };

  /* -------------------------------------------------------
     HELPERS
  ------------------------------------------------------- */

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function formatNumber(value) {
    const number = Number(value) || 0;

    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    }

    if (number >= 1000) {
      return (number / 1000).toFixed(1) + "K";
    }

    return String(number);
  }

  function hashtagText(text) {
    return escapeHTML(text).replace(
      /(^|\\s)(#[a-zA-Z0-9_]+)/g,
      '$1<span class="ars-hashtag">$2</span>'
    );
  }

  function icon(name, size = 16) {
    return `
      <i
        data-lucide="${escapeHTML(name)}"
        width="${size}"
        height="${size}"
      ></i>
    `;
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* -------------------------------------------------------
     STORIES
  ------------------------------------------------------- */

  function renderStories() {
    storiesContainer.innerHTML = stories
      .map(story => {
        if (story.wheel) {
          return `
            <button
              class="ars-story ars-wheel-story"
              type="button"
              data-ars-wheel
            >
              <div class="ars-story-ring">
                <div class="ars-story-avatar">
                  <div class="ars-wheel-symbol">✦</div>
                </div>
              </div>

              <span class="ars-story-name">
                Wheel
              </span>
            </button>
          `;
        }

        return `
          <button
            class="ars-story"
            type="button"
            data-ars-story="${escapeHTML(story.id)}"
          >
            <div class="ars-story-ring">
              <div
                class="ars-story-avatar"
                style="
                  background:
                  linear-gradient(
                    135deg,
                    ${escapeHTML(story.gradient[0])},
                    ${escapeHTML(story.gradient[1])}
                  );
                "
              >
                ${escapeHTML(story.letter)}
              </div>
            </div>

            ${
              story.mine
                ? `<span class="ars-story-plus">+</span>`
                : ""
            }

            <span class="ars-story-name">
              ${escapeHTML(story.name)}
            </span>
          </button>
        `;
      })
      .join("");

    refreshIcons();
  }

  function openStory(storyId) {
    const story = stories.find(
      item => item.id === storyId
    );

    if (!story) return;

    let viewer = document.getElementById(
      "arsStandaloneStoryViewer"
    );

    if (!viewer) {
      viewer = document.createElement("div");

      viewer.id =
        "arsStandaloneStoryViewer";

      viewer.className =
        "ars-story-viewer";

      viewer.innerHTML = `
        <div class="ars-story-viewer-card">

          <button
            class="ars-story-close"
            type="button"
            data-ars-close-story
            aria-label="Close story"
          >
            ${icon("x", 19)}
          </button>

          <div class="ars-story-progress">
            <span></span>
          </div>

          <div
            class="ars-story-viewer-avatar"
            data-ars-viewer-avatar
          ></div>

          <div
            class="ars-story-viewer-name"
            data-ars-viewer-name
          ></div>

          <div
            class="ars-story-viewer-content"
            data-ars-viewer-content
          ></div>

        </div>
      `;

      document.body.appendChild(viewer);

      viewer.addEventListener(
        "click",
        event => {
          if (
            event.target === viewer ||
            event.target.closest(
              "[data-ars-close-story]"
            )
          ) {
            viewer.classList.remove("open");
          }
        }
      );
    }

    const avatar =
      viewer.querySelector(
        "[data-ars-viewer-avatar]"
      );

    const name =
      viewer.querySelector(
        "[data-ars-viewer-name]"
      );

    const content =
      viewer.querySelector(
        "[data-ars-viewer-content]"
      );

    avatar.textContent =
      story.letter || "Λ";

    avatar.style.background =
      `linear-gradient(
        135deg,
        ${story.gradient[0]},
        ${story.gradient[1]}
      )`;

    name.textContent =
      story.name;

    content.style.background =
      `radial-gradient(
        circle at 20% 20%,
        ${story.gradient[0]}99,
        transparent 35%
      ),
      linear-gradient(
        145deg,
        #09070d,
        ${story.gradient[1]}88,
        #08070b
      )`;

    content.innerHTML = `
      <div class="ars-story-big-letter">
        ${escapeHTML(story.letter || "Λ")}
      </div>

      <div class="ars-story-message">
        ${escapeHTML(
          story.text ||
          "Welcome to ΛRS."
        )}
      </div>
    `;

    viewer.classList.add("open");

    refreshIcons();
  }

  /* -------------------------------------------------------
     POSTS
  ------------------------------------------------------- */

  function avatarMarkup(post) {
    return `
      <div
        class="ars-post-avatar"
        style="
          background:
          linear-gradient(
            135deg,
            ${escapeHTML(post.gradient[0])},
            ${escapeHTML(post.gradient[1])}
          );
        "
      >
        ${escapeHTML(post.letter)}
      </div>
    `;
  }

  function renderPosts() {
    feedContainer.innerHTML = posts
      .map(post => {
        const liked =
          actions.likes.has(post.id);

        const reposted =
          actions.reposts.has(post.id);

        const saved =
          actions.saves.has(post.id);

        return `
          <article
            class="ars-post"
            data-ars-post="${escapeHTML(post.id)}"
          >

            <div class="ars-post-header">

              <div class="ars-post-user">

                ${avatarMarkup(post)}

                <div class="ars-post-info">

                  <div class="ars-post-name">
                    ${escapeHTML(post.name)}

                    ${
                      post.verified
                        ? `
                          <span class="ars-verified">
                            ${icon("badge-check", 14)}
                          </span>
                        `
                        : ""
                    }
                  </div>

                  <div class="ars-post-meta">
                    @${escapeHTML(post.username)}
                    ·
                    ${escapeHTML(post.time)}
                  </div>

                </div>

              </div>

              <button
                class="ars-post-menu"
                type="button"
                data-ars-menu
                aria-label="More options"
              >
                ${icon("more-horizontal", 18)}
              </button>

            </div>

            ${
              post.repost
                ? `
                  <div class="ars-repost">
                    ${icon("repeat-2", 14)}
                    Reposted
                  </div>
                `
                : ""
            }

            <div class="ars-post-text">
              ${hashtagText(post.text)}
            </div>

            ${
              post.media
                ? `
                  <div class="ars-post-media">
                    <span>
                      ΛRS post media
                    </span>
             
