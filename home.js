(() => {
  "use strict";

  /* =========================
     SUPABASE
  ========================= */

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_7H3rW2lFh8x2vJm7L8m6Qw9N5s3Y2xZ1";

  let supabaseClient = null;

  if (window.supabase) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }


  /* =========================
     LOCAL DATA
  ========================= */

  const USER_KEY = "ars_user";
  const LOGGED_IN_KEY = "ars_logged_in";

  const LETTER_KEY = "ars_letter";
  const LETTER_COLOR_KEY = "ars_letter_color";
  const BACKGROUND_KEY = "ars_background";

  const WHEEL_KEY = "ars_wheel_spins_week";
  const STREAK_DONE_KEY = "ars_streak_done_today";
  const STREAK_COUNT_KEY = "ars_streak_count";


  let currentUser = null;
  let currentPlan = "free";


  /* =========================
     MOCK STORIES
  ========================= */

  const stories = [
    {
      name: "Your Story",
      letter: "+",
      own: true
    },
    {
      name: "Alex",
      letter: "A"
    },
    {
      name: "Mia",
      letter: "M"
    },
    {
      name: "Ryan",
      letter: "R"
    },
    {
      name: "Luna",
      letter: "L"
    },
    {
      name: "Noah",
      letter: "N"
    }
  ];


  /* =========================
     POSTS
  ========================= */

  let posts = [
    {
      id: 1,
      name: "Alex Carter",
      username: "alex",
      letter: "A",
      text: "Small steps every day can turn into something huge. ✨",
      likes: 128,
      comments: 18,
      reposts: 7,
      views: 1420,
      liked: false,
      reposted: false,
      bookmarked: false
    },

    {
      id: 2,
      name: "Mia",
      username: "mia",
      letter: "M",
      text: "What's one thing you're looking forward to this week? 💜",
      likes: 94,
      comments: 24,
      reposts: 5,
      views: 981,
      liked: false,
      reposted: false,
      bookmarked: false
    },

    {
      id: 3,
      name: "Ryan",
      username: "ryan",
      letter: "R",
      text: "Create something. Share something. Connect with someone.",
      likes: 73,
      comments: 12,
      reposts: 4,
      views: 714,
      liked: false,
      reposted: false,
      bookmarked: false
    }
  ];


  /* =========================
     WHEEL CONTENT
  ========================= */

  const wheelItems = [
    {
      type: "CHALLENGE",
      title: "Take a 15-minute walk",
      description: "Go outside and take a relaxing 15-minute walk.",
      reward: "+50 XP"
    },

    {
      type: "REWARD",
      title: "XP Reward",
      description: "You received a bonus for spinning the wheel.",
      reward: "+100 XP"
    },

    {
      type: "QUESTION",
      title: "Question of the Day",
      description: "What is one small thing that made you smile today?",
      reward: "+25 XP"
    },

    {
      type: "BONUS",
      title: "Bonus Challenge",
      description: "Post a Story showing something you enjoyed today.",
      reward: "+75 XP"
    },

    {
      type: "CHALLENGE",
      title: "Read for 10 minutes",
      description: "Take some quiet time and read something interesting.",
      reward: "+50 XP"
    },

    {
      type: "REWARD",
      title: "Lucky Reward",
      description: "You found a lucky wheel reward.",
      reward: "+150 XP"
    }
  ];


  /* =========================
     SEARCH CONTENT
  ========================= */

  const trendingHashtags = [
    {
      tag: "#ARS",
      posts: "12.4K posts"
    },

    {
      tag: "#Weekend",
      posts: "8.7K posts"
    },

    {
      tag: "#Create",
      posts: "6.2K posts"
    },

    {
      tag: "#Photography",
      posts: "5.9K posts"
    },

    {
      tag: "#DailyChallenge",
      posts: "4.8K posts"
    }
  ];


  const suggestedPeople = [
    {
      name: "Alex Carter",
      username: "@alex",
      letter: "A"
    },

    {
      name: "Mia",
      username: "@mia",
      letter: "M"
    },

    {
      name: "Ryan",
      username: "@ryan",
      letter: "R"
    },

    {
      name: "Luna",
      username: "@luna",
      letter: "L"
    }
  ];


  const trendingTopics = [
    {
      category: "Trending",
      title: "Weekend plans",
      posts: "24.5K posts"
    },

    {
      category: "Trending",
      title: "Daily challenges",
      posts: "18.2K posts"
    },

    {
      category: "Trending",
      title: "Photography",
      posts: "15.7K posts"
    },

    {
      category: "Trending",
      title: "Creative ideas",
      posts: "11.3K posts"
    }
  ];


  /* =========================
     HELPERS
  ========================= */

  function $(id) {
    return document.getElementById(id);
  }


  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function showToast(message) {
    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.__arsToastTimer);

    window.__arsToastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }


  function getLocalUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }


  function getInitial() {
    const letter =
      localStorage.getItem(LETTER_KEY) ||
      currentUser?.display_name?.charAt(0) ||
      currentUser?.username?.charAt(0) ||
      "A";

    return String(letter).charAt(0).toUpperCase();
  }


  /* =========================
     AUTH
  ========================= */

  async function checkAuth() {

    if (!supabaseClient) {
      currentUser = getLocalUser();

      if (!currentUser) {
        window.location.href = "index.html";
        return false;
      }

      currentPlan = currentUser.plan || "free";
      return true;
    }


    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();


    if (error || !session) {

      const fallbackUser = getLocalUser();

      if (!fallbackUser) {
        window.location.href = "index.html";
        return false;
      }

      currentUser = fallbackUser;
      currentPlan = fallbackUser.plan || "free";

      return true;
    }


    currentUser = {
      id: session.user.id,
      email: session.user.email,
      username:
        session.user.user_metadata?.username ||
        getLocalUser()?.username ||
        "",
      display_name:
        session.user.user_metadata?.display_name ||
        getLocalUser()?.display_name ||
        ""
    };


    try {
      const { data } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data) {
        currentUser = {
          ...currentUser,
          ...data
        };

        currentPlan = data.plan || "free";
      }
    } catch {
      currentPlan = currentUser.plan || "free";
    }


    localStorage.setItem(
      USER_KEY,
      JSON.stringify(currentUser)
    );

    localStorage.setItem(LOGGED_IN_KEY, "true");

    return true;
  }


  /* =========================
     AVATAR
  ========================= */

  function updateAvatars() {

    const initial = getInitial();

    const topAvatar = $("topAvatar");
    const createAvatar = $("createPostAvatar");
    const profileAvatar = $("profileAvatarLarge");

    if (topAvatar) {
      topAvatar.textContent = initial;
    }

    if (createAvatar) {
      createAvatar.textContent = initial;
    }

    if (profileAvatar) {
      profileAvatar.textContent = initial;
    }
  }


  /* =========================
     PROFILE
  ========================= */

  function renderProfile() {

    const name =
      currentUser?.display_name ||
      currentUser?.username ||
      "User";

    const username =
      currentUser?.username ||
      "username";

    if ($("profileDisplayName")) {
      $("profileDisplayName").textContent = name;
    }

    if ($("profileUsername")) {
      $("profileUsername").textContent =
        username.startsWith("@")
          ? username
          : "@" + username;
    }

    if ($("profilePosts")) {
      $("profilePosts").textContent = posts.length;
    }

    if ($("profileFollowers")) {
      $("profileFollowers").textContent =
        currentUser?.followers || 0;
    }

    if ($("profileLikes")) {
      $("profileLikes").textContent =
        posts.reduce((sum, post) => sum + post.likes, 0);
    }
  }


  /* =========================
     STORIES
  ========================= */

  function renderStories() {

    const container = $("stories");

    if (!container) return;

    container.innerHTML = stories.map(story => {

      const displayLetter = story.own
        ? "+"
        : story.letter;

      return `
        <div class="story">
          <div class="story-avatar">
            <div class="story-avatar-inner">
              ${escapeHTML(displayLetter)}
            </div>
          </div>

          <div class="story-name">
            ${escapeHTML(story.name)}
          </div>
        </div>
      `;

    }).join("");
  }


  /* =========================
     POST MENU
  ========================= */

  function closeAllPostMenus() {
    document
      .querySelectorAll(".post-menu")
      .forEach(menu => menu.remove());
  }


  function createPostMenu(post) {

    closeAllPostMenus();

    const card = document.querySelector(
      `.post-card[data-post-id="${post.id}"]`
    );

    if (!card) return;


    const menu = document.createElement("div");

    menu.className = "post-menu";

    menu.innerHTML = `
      <button data-menu-action="repost">
        <span>↻</span>
        <span>Repost</span>
      </button>

      <button data-menu-action="bookmark">
        <span>🔖</span>
        <span>Bookmark</span>
      </button>

      <button data-menu-action="share">
        <span>↗</span>
        <span>Share</span>
      </button>

      <button data-menu-action="copy">
        <span>▣</span>
        <span>Copy Link</span>
      </button>

      <button data-menu-action="report" class="danger">
        <span>⚑</span>
        <span>Report</span>
      </button>

      <button data-menu-action="block" class="danger">
        <span>⊘</span>
        <span>Block User</span>
      </button>

      <button data-menu-action="hide">
        <span>◌</span>
        <span>Hide Post</span>
      </button>
    `;


    menu.addEventListener("click", event => {

      const button =
        event.target.closest("[data-menu-action]");

      if (!button) return;

      const action = button.dataset.menuAction;

      handlePostMenuAction(action, post);

      menu.remove();
    });


    card.appendChild(menu);
  }


  async function handlePostMenuAction(action, post) {

    if (action === "repost") {

      post.reposted = !post.reposted;

      if (post.reposted) {
        post.reposts++;
      } else {
        post.reposts = Math.max(0, post.reposts - 1);
      }

      renderPosts();

      showToast(
        post.reposted
          ? "Post reposted"
          : "Repost removed"
      );

      return;
    }


    if (action === "bookmark") {

      post.bookmarked = !post.bookmarked;

      renderPosts();

      showToast(
        post.bookmarked
          ? "Saved to bookmarks"
          : "Removed from bookmarks"
      );

      return;
    }


    if (action === "share") {

      if (navigator.share) {

        try {
          await navigator.share({
            title: "ARS",
            text: post.text
          });
        } catch {
          // User cancelled share.
        }

      } else {

        showToast("Share options opened");

      }

      return;
    }


    if (action === "copy") {

      const link =
        window.location.origin +
        window.location.pathname +
        "?post=" +
        post.id;

      try {

        await navigator.clipboard.writeText(link);

        showToast("Post link copied");

      } catch {

        showToast("Copy link unavailable");

      }

      return;
    }


    if (action === "report") {
      showToast("Report option selected");
      return;
    }


    if (action === "block") {
      showToast("Block option selected");
      return;
    }


    if (action === "hide") {

      const index =
        posts.findIndex(item => item.id === post.id);

      if (index !== -1) {
        posts.splice(index, 1);
      }

      renderPosts();

      showToast("Post hidden");

      return;
    }
  }


  /* =========================
     POSTS
  ========================= */

  function renderPosts() {

    const feed = $("feed");

    if (!feed) return;


    feed.innerHTML = posts.map(post => {

      const likeClass =
        post.liked ? "liked" : "";

      const repostClass =
        post.reposted ? "reposted" : "";

      const bookmarkClass =
        post.bookmarked ? "bookmarked" : "";


      return `
        <article class="post-card" data-post-id="${post.id}">

          <div class="post-header">

            <div class="avatar-circle">
              ${escapeHTML(post.letter)}
            </div>

            <div class="post-user-info">
              <strong>${escapeHTML(post.name)}</strong>
              <span>@${escapeHTML(post.username)}</span>
            </div>

            <button
              class="more-button"
              data-more-post="${post.id}"
              aria-label="More options"
            >
              ⋯
            </button>

          </div>


          <div class="post-text">
            ${escapeHTML(post.text)}
          </div>


          <div class="post-actions">

            <button
              class="post-action ${likeClass}"
              data-action="like"
              data-post="${post.id}"
            >
              <span class="action-icon">
                ${post.liked ? "♥" : "♡"}
              </span>

              <span class="action-count">
                ${post.likes}
              </span>
            </button>


            <button
              class="post-action"
              data-action="comment"
              data-post="${post.id}"
            >
              <span class="action-icon">◌</span>

              <span class="action-count">
                ${post.comments}
              </span>
            </button>


            <button
              class="post-action ${repostClass}"
              data-action="repost"
              data-post="${post.id}"
            >
              <span class="action-icon">↻</span>

              <span class="action-count">
                ${post.reposts}
              </span>
            </button>


            <button
              class="post-action ${bookmarkClass}"
              data-action="bookmark"
              data-post="${post.id}"
            >
              <span class="action-icon">
                ${post.bookmarked ? "🔖" : "♧"}
              </span>
            </button>


            <button
              class="post-action"
              data-action="share"
              data-post="${post.id}"
            >
              <span class="action-icon">↗</span>
            </button>


            <span class="post-action">
              <span class="action-icon">◉</span>

              <span class="action-count">
                ${post.views}
              </span>
            </span>

          </div>

        </article>
      `;

    }).join("");
  }


  /* =========================
     POST ACTIONS
  ========================= */

  function setupPostActions() {

    const feed = $("feed");

    if (!feed) return;


    feed.addEventListener("click", async event => {

      const moreButton =
        event.target.closest("[data-more-post]");

      if (moreButton) {

        event.stopPropagation();

        const postId =
          Number(moreButton.dataset.morePost);

        const post =
          posts.find(item => item.id === postId);

        if (post) {
          createPostMenu(post);
        }

        return;
      }


      const actionButton =
        event.target.closest("[data-action]");

      if (!actionButton) return;


      const action =
        actionButton.dataset.action;

      const postId =
        Number(actionButton.dataset.post);

      const post =
        posts.find(item => item.id === postId);

      if (!post) return;


      if (action === "like") {

        post.liked = !post.liked;

        if (post.liked) {
          post.likes++;
        } else {
          post.likes = Math.max(0, post.likes - 1);
        }

        renderPosts();

        return;
      }


      if (action === "comment") {

        showToast("Comments opened");

        return;
      }


      if (action === "repost") {

        post.reposted = !post.reposted;

        if (post.reposted) {
          post.reposts++;
        } else {
          post.reposts =
            Math.max(0, post.reposts - 1);
        }

        renderPosts();

        return;
      }


      if (action === "bookmark") {

        post.bookmarked = !post.bookmarked;

        renderPosts();

        showToast(
          post.bookmarked
            ? "Saved to bookmarks"
            : "Removed from bookmarks"
        );

        return;
      }


      if (action === "share") {

        if (navigator.share) {

          try {

            await navigator.share({
              title: "ARS",
              text: post.text
            });

          } catch {
            // Cancelled.
          }

        } else {

          showToast("Share options opened");

        }

      }

    });
  }


  /* =========================
     SEARCH
  ========================= */

  function renderSearchHome() {

    const hashtags = $("trendingHashtags");
    const people = $("suggestedPeople");
    const topics = $("trendingTopics");

    if (hashtags) {

      hashtags.innerHTML =
        trendingHashtags.map((item, index) => `
          <div class="trend-item">

            <div class="trend-left">

              <span class="trend-number">
                ${index + 1}
              </span>

              <div>
                <strong>${escapeHTML(item.tag)}</strong>

                <small>
                  ${escapeHTML(item.posts)}
                </small>
              </div>

            </div>

            <span>›</span>

          </div>
        `).join("");
    }


    if (people) {

      people.innerHTML =
        suggestedPeople.map(person => `
          <div class="suggested-person">

            <div class="suggested-person-top">

              <div class="avatar-circle">
                ${escapeHTML(person.letter)}
              </div>

              <div>
                <strong>
                  ${escapeHTML(person.name)}
                </strong>

                <small>
                  ${escapeHTML(person.username)}
                </small>
              </div>

            </div>

            <button class="follow-suggested">
              Follow
            </button>

          </div>
        `).join("");
    }


    if (topics) {

      topics.innerHTML =
        trendingTopics.map(topic => `
          <div class="topic-item">

            <small>
              ${escapeHTML(topic.category)}
            </small>

            <strong>
              ${escapeHTML(topic.title)}
            </strong>

            <span>
              ${escapeHTML(topic.posts)}
            </span>

          </div>
        `).join("");
    }
  }


  function performSearch(query) {

    const resultsContainer =
      $("liveSearchResults");

    const results =
      $("searchResults");

    const homeContent =
      $("searchHomeContent");

    const clearButton =
      $("clearSearch");


    const cleanQuery =
      query.trim().toLowerCase();


    if (!cleanQuery) {

      if (resultsContainer) {
        resultsContainer.cl
