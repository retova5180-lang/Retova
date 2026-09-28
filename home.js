(() => {
  "use strict";

  /* =========================================================
     ARS HOME
     - Home
     - Stories
     - Posts
     - Like
     - Comment
     - Repost
     - Bookmark
     - Views
     - Search
     - Trending
     - Notifications
     - Messages
     - Profile
     - Wheel
     - Streak
     - Create Post
     - ARSHome bridge
  ========================================================= */


  /* =========================
     SUPABASE
  ========================== */

  const SUPABASE_URL =
    "https://bfqsqgfyyewnfxekirfv.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

  const supabaseClient =
    window.supabase?.createClient?.(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    ) || null;


  /* =========================
     HELPERS
  ========================== */

  const $ = (id) =>
    document.getElementById(id);


  function readJSON(key, fallback) {

    try {

      const raw =
        localStorage.getItem(key);

      if (!raw) {
        return fallback;
      }

      const value =
        JSON.parse(raw);

      return value ?? fallback;

    } catch {

      return fallback;

    }

  }


  function esc(value) {

    return String(value ?? "")
      .replace(
        /[&<>"']/g,
        (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        })[char]
      );

  }


  function count(value) {

    const number =
      Number(value) || 0;

    if (number >= 1000000) {

      return (
        number % 1000000
          ? (number / 1000000).toFixed(1)
          : (number / 1000000).toFixed(0)
      ) + "M";

    }


    if (number >= 1000) {

      return (
        number % 1000
          ? (number / 1000).toFixed(1)
          : (number / 1000).toFixed(0)
      ) + "K";

    }


    return String(number);

  }


  function toast(message) {

    const element =
      $("toast");

    if (!element) {
      return;
    }

    element.textContent =
      message;

    element.classList.add("show");

    clearTimeout(
      window.__arsToastTimer
    );

    window.__arsToastTimer =
      setTimeout(
        () => {
          element.classList.remove("show");
        },
        2200
      );

  }


  /* =========================
     STORAGE KEYS
  ========================== */

  const USER_KEY =
    "ars_user";

  const PLAN_KEY =
    "ars_plan";

  const WHEEL_KEY =
    "ars_wheel_week";

  const STREAK_KEY =
    "ars_streak_state";

  const POSTS_KEY =
    "ars_local_posts";

  const STORIES_KEY =
    "ars_local_stories";

  const LEGACY_POSTS_KEY =
    "ars_home_posts_v5";

  const LEGACY_STORIES_KEY =
    "ars_stories";


  /* =========================
     STATE
  ========================== */

  let currentUser =
    readJSON(
      USER_KEY,
      null
    );

  let plan =
    localStorage.getItem(
      PLAN_KEY
    ) || "free";


  let posts =
    loadPosts();


  let stories =
    loadStories();


  let currentCommentPost =
    null;


  let wheelRotation =
    0;


  let initialized =
    false;


  /* =========================
     POSTS
  ========================== */

  function loadPosts() {

    let raw =
      localStorage.getItem(
        POSTS_KEY
      );


    if (
      raw === null &&
      localStorage.getItem(
        LEGACY_POSTS_KEY
      ) !== null
    ) {

      raw =
        localStorage.getItem(
          LEGACY_POSTS_KEY
        );

    }


    const data =
      (() => {

        try {

          return raw
            ? JSON.parse(raw)
            : [];

        } catch {

          return [];

        }

      })();


    const list =
      Array.isArray(data)
        ? data.filter(Boolean)
        : [];


    if (
      localStorage.getItem(
        POSTS_KEY
      ) === null &&
      list.length
    ) {

      localStorage.setItem(
        POSTS_KEY,
        JSON.stringify(list)
      );

    }


    return list;

  }


  function savePosts() {

    localStorage.setItem(
      POSTS_KEY,
      JSON.stringify(posts)
    );

  }


  function findPost(id) {

    return posts.find(
      (post) =>
        String(post.id) ===
        String(id)
    );

  }


  /* =========================
     STORIES
  ========================== */

  function normalizeStory(story) {

    if (
      !story ||
      typeof story !== "object"
    ) {

      return null;

    }


    const item = {
      ...story
    };


    item.id =
      String(
        item.id ||
        `story_${Date.now()}`
      );


    item.name =
      item.name ||
      item.username ||
      "You";


    return item;

  }


  function loadStories() {

    let raw =
      localStorage.getItem(
        STORIES_KEY
      );


    if (
      raw === null &&
      localStorage.getItem(
        LEGACY_STORIES_KEY
      ) !== null
    ) {

      raw =
        localStorage.getItem(
          LEGACY_STORIES_KEY
        );

    }


    let data = [];

    try {

      data =
        raw
          ? JSON.parse(raw)
          : [];

    } catch {

      data = [];

    }


    if (!Array.isArray(data)) {
      data = [];
    }


    const now =
      Date.now();


    const active =
      data
        .map(normalizeStory)
        .filter(Boolean)
        .filter((story) => {

          const expiry =
            Date.parse(
              story.expires_at ||
              story.expiresAt ||
              story.expires ||
              ""
            );


          if (!expiry) {
            return true;
          }


          return expiry > now;

        });


    localStorage.setItem(
      STORIES_KEY,
      JSON.stringify(active)
    );


    return active;

  }


  /* =========================
     LUCIDE
  ========================== */

  function refreshLucide() {

    if (
      window.lucide &&
      typeof window.lucide.createIcons ===
        "function"
    ) {

      window.lucide.createIcons({
        attrs:{
          "stroke-width":1.9
        }
      });

    }

  }


  /* =========================
     PROFILE
  ========================== */

  function renderProfile() {

    const user =
      currentUser || {};


    const name =
      user.display_name ||
      user.username ||
      "ARS User";


    const handle =
      user.username
        ? `@${user.username}`
        : "@user";


    const letter =
      localStorage.getItem(
        "ars_letter"
      ) ||
      name.charAt(0) ||
      "A";


    if ($("topAvatarLetter")) {

      $("topAvatarLetter").textContent =
        letter;

    }


    if ($("profileAvatar")) {

      $("profileAvatar").textContent =
        letter;

    }


    if ($("profileName")) {

      $("profileName").textContent =
        name;

    }


    if ($("profileHandle")) {

      $("profileHandle").textContent =
        handle;

    }


    if ($("profilePostsCount")) {

      $("profilePostsCount").textContent =
        String(
          posts.filter(
            (post) =>
              post.handle === handle
          ).length
        );

    }

  }


  /* =========================
     STORIES RENDER
  ========================== */

  function renderStories() {

    const container =
      $("stories");


    if (!container) {
      return;
    }


    const ordered =
      [...stories].sort(
        (a,b) => {

          const aYou =
            a.id === "you" ||
            a.you;

          const bYou =
            b.id === "you" ||
            b.you;


          if (aYou && !bYou) {
            return -1;
          }

          if (!aYou && bYou) {
            return 1;
          }

          return 0;

        }
      );


    container.innerHTML =
      ordered.map(
        (story) => {

          const isYou =
            story.id === "you" ||
            story.you;


          const source =
            story.src ||
            story.image ||
            story.media;


          let content = "";


          if (
            source &&
            !story.video
          ) {

            content = `
              <img
                src="${esc(source)}"
                alt="${esc(story.name)}"
              >
            `;

          }


          else if (
            story.video
          ) {

            content = `
              <span class="story-letter">
                <i data-lucide="play"></i>
              </span>
            `;

          }


          else if (
            story.logo
          ) {

            content = `
              <span class="story-letter brand-story">
                <img
                  src="${esc(story.logo)}"
                  alt="${esc(story.name)}"
                >
              </span>
            `;

          }


          else if (
            story.wheel
          ) {

            content = `
              <span class="story-letter">
                <i data-lucide="circle-dot"></i>
              </span>
            `;

          }


          else {

            content = `
              <span class="story-letter">
                ${esc(
                  story.letter ||
                  story.name?.charAt(0) ||
                  "A"
                )}
              </span>
            `;

          }


          return `
            <button
              class="story ${isYou ? "you" : ""}"
              data-story="${esc(story.id)}"
              type="button"
            >

              <span class="story-ring">
                ${content}
              </span>

              <span class="story-name">
                ${esc(story.name)}
              </span>

            </button>
          `;

        }
      ).join("");


    refreshLucide();

  }


  /* =========================
     POST AVATAR
  ========================== */

  function postAvatar(post) {

    if (post.avatar) {

      return `
        <img
          class="post-avatar"
          src="${esc(post.avatar)}"
          alt=""
        >
      `;

    }


    if (post.imageAvatar) {

      return `
        <img
          class="post-avatar"
          src="${esc(post.imageAvatar)}"
          alt=""
        >
      `;

    }


    if (
      post.name === "Apple"
    ) {

      return `
        <div
          class="post-avatar post-letter apple-avatar"
        >
          <img
            src="https://cdn.simpleicons.org/apple/FFFFFF"
            alt="Apple"
          >
        </div>
      `;

    }


    return `
      <div
        class="post-avatar post-letter"
      >
        ${esc(
          post.letter ||
          post.name?.charAt(0) ||
          "A"
        )}
      </div>
    `;

  }


  /* =========================
     POST MEDIA
  ========================== */

  function postMedia(post) {

    let source =
      post.image ||
      post.video ||
      "";


    let type =
      post.video
        ? "video"
        : "image";


    if (
      !source &&
      Array.isArray(post.media) &&
      post.media.length
    ) {

      const media =
        post.media[0];


      if (
        typeof media === "string"
      ) {

        source = media;

      } else {

        source =
          media.url ||
          media.src ||
          "";


        type =
          media.type === "video"
            ? "video"
            : "image";

      }

    }


    if (!source) {
      return "";
    }


    if (type === "video") {

      return `
        <video
          class="post-image"
          controls
          playsinline
          preload="metadata"
          src="${esc(source)}"
        ></video>
      `;

    }


    return `
      <img
        class="post-image"
        src="${esc(source)}"
        alt=""
        loading="lazy"
      >
    `;

  }


  /* =========================
     POSTS RENDER
  ========================== */

  function renderPosts() {

    const feed =
      $("feed");


    if (!feed) {
      return;
    }


    if (!posts.length) {

      feed.innerHTML = `
        <div class="result-card">
          No posts yet.
        </div>
      `;

      return;

    }


    feed.innerHTML =
      posts.map(
        (post) => {

          const liked =
            Boolean(
              post.liked
            );


          const reposted =
            Boolean(
              post.reposted
            );


          const bookmarked =
            localStorage.getItem(
              `ars_bookmark_${post.id}`
            ) === "true";


          const text =
            esc(
              post.text || ""
            ).replace(
              /(#\w+)/g,
              '<span class="tag">$1</span>'
            );


          return `
            <article
              class="post-card"
              data-post-id="${esc(post.id)}"
            >

              <div class="post-head">

                ${postAvatar(post)}

                <div class="post-info">

                  <div class="post-name">

                    ${esc(
                      post.name ||
                      "ARS User"
                    )}

                    ${
                      post.verified
                        ? '<span class="verified">✓</span>'
                        : ""
                    }

                  </div>

                  <div class="post-meta">

                    ${esc(
                      post.handle ||
                      "@user"
                    )}

                    ·

                    ${esc(
                      post.time ||
                      "now"
                    )}

                  </div>

                </div>


                <button
                  class="more"
                  data-more="${esc(post.id)}"
                  type="button"
                  aria-label="More"
                >
                  <i data-lucide="more-horizontal"></i>
                </button>

              </div>


              ${
                text
                  ? `
                    <div class="post-text">
                      ${text}
                    </div>
                  `
                  : ""
              }


              ${postMedia(post)}


              <div class="post-actions">

                <button
                  class="post-action like ${
                    liked
                      ? "active"
                      : ""
                  }"
                  data-action="like"
                  data-id="${esc(post.id)}"
                  type="button"
                  aria-label="Like"
                >

                  <i data-lucide="heart"></i>

                  <span>
                    ${count(post.likes)}
                  </span>

                </button>


                <button
                  class="post-action"
                  data-action="comment"
                  data-id="${esc(post.id)}"
                  type="button"
                  aria-label="Comments"
                >

                  <i data-lucide="message-circle"></i>

                  <span>
                    ${count(post.comments)}
                  </span>

                </button>


                <button
                  class="post-action ${
                    reposted
                      ? "reposted"
                      : ""
                  }"
                  data-action="repost"
                  data-id="${esc(post.id)}"
                  type="button"
                  aria-label="Repost"
                >

                  <i data-lucide="repeat-2"></i>

                  <span>
                    ${count(post.reposts)}
                  </span>

                </button>


                <button
                  class="post-action ${
                    bookmarked
                      ? "bookmarked"
                      : ""
                  }"
                  data-action="bookmark"
                  data-id="${esc(post.id)}"
                  type="button"
                  aria-label="Bookmark"
                >

                  <i data-lucide="bookmark"></i>

                </button>


                <span
                  class="post-action views"
                  aria-label="Views"
                >

                  <i data-lucide="eye"></i>

                  <span>
                    ${count(post.views)}
                  </span>

                </span>

              </div>

            </article>
          `;

        }
      ).join("");


    refreshLucide();

    renderProfile();

  }


  /* =========================
     POST ACTIONS
  ========================== */

  function postAction(
    action,
    id
  ) {

    const post =
      findPost(id);


    if (!post) {
      return;
    }


    if (
      action === "like"
    ) {

      post.liked =
        !post.liked;


      post.likes =
        Math.max(
          0,
          Number(post.likes || 0) +
          (
            post.liked
              ? 1
              : -1
          )
        );


      savePosts();

      renderPosts();

      toast(
        post.liked
          ? "Liked"
          : "Like removed"
      );

      return;

    }


    if (
      action === "repost"
    ) {

      post.reposted =
        !post.reposted;


      post.reposts =
        Math.max(
          0,
          Number(post.reposts || 0) +
          (
            post.reposted
              ? 1
              : -1
          )
        );


      savePosts();

      renderPosts();

      toast(
        post.reposted
          ? "Reposted"
          : "Repost removed"
      );

      return;

    }


    if (
      action === "bookmark"
    ) {

      const key =
        `ars_bookmark_${id}`;


      const next =
        localStorage.getItem(
          key
        ) !== "true";


      localStorage.setItem(
        key,
        String(next)
      );


      renderPosts();


      toast(
        next
          ? "Saved"
          : "Removed from bookmarks"
      );

      return;

    }


    if (
      action === "comment"
    ) {

      openComments(id);

    }

  }


  /* =========================
     POST MENU
  ========================== */

  function closeMenu() {

    document
      .querySelectorAll(
        ".post-menu"
      )
      .forEach(
        (menu) =>
          menu.remove()
      );


    $("postMenuBackdrop")
      ?.classList
      .remove("show");

  }


  function openPostMenu(
    button,
    id
  ) {

    closeMenu();


    const menu =
      document.createElement(
        "div"
      );


    menu.className =
      "post-menu";


    menu.innerHTML = `
      <button
        type="button"
        data-menu-action="repost"
      >
        <i data-lucide="repeat-2"></i>
        Repost
      </button>

      <button
        type="button"
        data-menu-action="bookmark"
      >
        <i data-lucide="bookmark"></i>
        Bookmark
      </button>

      <button
        type="button"
        data-menu-action="share"
      >
        <i data-lucide="share-2"></i>
        Share
      </button>

      <button
        type="button"
        data-menu-action="copy"
      >
        <i data-lucide="copy"></i>
        Copy Link
      </button>

      <button
        type="button"
        data-menu-action="report"
      >
        <i data-lucide="flag"></i>
        Report
      </button>

      <button
        type="button"
        class="danger"
        data-menu-action="hide"
      >
        <i data-lucide="eye-off"></i>
        Hide Post
      </button>
    `;


    document.body.appendChild(
      menu
    );


    const rect =
      button.getBoundingClientRect();


    menu.style.top =
      `${rect.bottom + 8}px`;


    menu.style.right =
      `${Math.max(
        12,
        window.innerWidth -
        rect.right
      )}px`;


    $("postMenuBackdrop")
      ?.classList
      .add("show");


    refreshLucide();


    menu.addEventListener(
      "click",
      async (event) => {

        const item =
          event.target.closest(
            "[data-menu-action]"
          
