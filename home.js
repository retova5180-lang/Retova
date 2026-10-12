(() => {
  "use strict";

  /* =========================================
     ARS HOME — SUPABASE CONFIGURATION
  ========================================= */

  const SUPABASE_URL =
    "https://bfqsqgfyyewnfxekirfv.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

  const STORAGE = {
    user: "ars_user",
    loggedIn: "ars_logged_in",
    letter: "ars_letter",
    letterColor: "ars_letter_color",
    background: "ars_background"
  };

  const PAGE_SIZE = 30;
  const MAX_POST_LENGTH = 5000;

  const supabaseClient =
    window.supabase?.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    ) || null;

  /* =========================================
     DOM HELPERS
  ========================================= */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const elements = {
    searchForm: $("#searchForm"),
    searchInput: $("#searchInput"),

    notificationsButton: $("#notificationsButton"),
    profileButton: $("#profileButton"),
    profileMenu: $("#profileMenu"),
    viewProfileLink: $("#viewProfileLink"),
    settingsLink: $("#settingsLink"),
    logoutButton: $("#logoutButton"),

    exploreLink: $("#exploreLink"),
    navNotificationsLink: $("#navNotificationsLink"),
    messagesLink: $("#messagesLink"),
    bookmarksLink: $("#bookmarksLink"),
    sidebarProfileLink: $("#sidebarProfileLink"),

    openComposerButton: $("#openComposerButton"),
    refreshFeedButton: $("#refreshFeedButton"),
    retryFeedButton: $("#retryFeedButton"),

    composerCard: $("#composerCard"),
    composerAvatar: $("#composerAvatar"),
    postContent: $("#postContent"),
    characterCount: $("#characterCount"),
    publishPostButton: $("#publishPostButton"),
    composerMessage: $("#composerMessage"),

    feedCount: $("#feedCount"),
    feedStatus: $("#feedStatus"),
    postsList: $("#postsList"),
    feedEmpty: $("#feedEmpty"),
    feedError: $("#feedError"),
    feedErrorMessage: $("#feedErrorMessage"),

    headerAvatar: $("#headerAvatar"),
    accountAvatar: $("#accountAvatar"),
    accountDisplayName: $("#accountDisplayName"),
    accountUsername: $("#accountUsername"),
    accountStreak: $("#accountStreak"),
    accountXp: $("#accountXp"),

    accountProfileLink: $("#accountProfileLink"),
    communityPostButton: $("#communityPostButton"),

    mobileExploreLink: $("#mobileExploreLink"),
    mobileCreateButton: $("#mobileCreateButton"),
    mobileNotificationsLink: $("#mobileNotificationsLink"),
    mobileProfileLink: $("#mobileProfileLink"),

    currentYear: $("#currentYear"),
    toastContainer: $("#toastContainer"),
    loadingOverlay: $("#loadingOverlay"),
    loadingMessage: $("#loadingMessage")
  };

  /* =========================================
     SAFE STORAGE
  ========================================= */

  function readStorage(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      console.error("ARS storage read error:", error);
      return fallback;
    }
  }

  function readJSON(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("ARS storage JSON error:", error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch (error) {
      console.error("ARS storage write error:", error);
      return false;
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("ARS storage removal error:", error);
    }
  }

  /* =========================================
     SECURITY AND FORMATTING
  ========================================= */

  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
    );
  }

  function getInitial(value, fallback = "A") {
    const text = String(value ?? "").trim();
    return text ? Array.from(text)[0].toUpperCase() : fallback;
  }

  function formatDate(value) {
    if (!value) return "Recently";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    const now = Date.now();
    const difference = Math.max(0, now - date.getTime());
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (difference < minute) return "Just now";
    if (difference < hour) {
      const count = Math.floor(difference / minute);
      return `${count}m ago`;
    }

    if (difference < day) {
      const count = Math.floor(difference / hour);
      return `${count}h ago`;
    }

    if (difference < 7 * day) {
      const count = Math.floor(difference / day);
      return `${count}d ago`;
    }

    return date.toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function setText(element, value) {
    if (element) {
      element.textContent = String(value ?? "");
    }
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden = Boolean(hidden);
    }
  }

  function setComposerMessage(message, type = "") {
    const element = elements.composerMessage;
    if (!element) return;

    element.textContent = message;
    element.className = "form-message";

    if (type) {
      element.classList.add(type);
    }
  }

  /* =========================================
     USER AND SESSION
  ========================================= */

  function getUser() {
    return readJSON(STORAGE.user, {}) || {};
  }

  function saveUser(user) {
    return writeStorage(
      STORAGE.user,
      JSON.stringify(user || {})
    );
  }

  function getCurrentUserId() {
    const user = getUser();
    return user.id || user.user_id || null;
  }

  function isLoggedInLocally() {
    return readStorage(STORAGE.loggedIn) === "true";
  }

  async function requireSession() {
    if (!supabaseClient) {
      showFatalError(
        "Supabase could not be initialized. Check the Supabase script and configuration."
      );
      return false;
    }

    try {
      const { data, error } =
        await supabaseClient.auth.getSession();

      if (error) throw error;

      if (!data?.session) {
        writeStorage(STORAGE.loggedIn, "false");
        window.location.replace("index.html");
        return false;
      }

      const authUser = data.session.user;
      const localUser = getUser();

      if (
        localUser.id &&
        localUser.id !== authUser.id
      ) {
        console.warn(
          "ARS local profile ID differs from the authenticated user."
        );
      }

      if (!localUser.id) {
        localUser.id = authUser.id;
        localUser.email = authUser.email || "";
        saveUser(localUser);
      }

      writeStorage(STORAGE.loggedIn, "true");
      return true;
    } catch (error) {
      console.error("ARS session check failed:", error);

      showFatalError(
        "Your session could not be verified. Please refresh the page or log in again."
      );

      return false;
    }
  }

  /* =========================================
     LOADING OVERLAY
  ========================================= */

  function showLoading(message = "Please wait...") {
    setText(elements.loadingMessage, message);
    setHidden(elements.loadingOverlay, false);
  }

  function hideLoading() {
    setHidden(elements.loadingOverlay, true);
  }

  function showFatalError(message) {
    console.error("ARS:", message);

    setText(elements.feedErrorMessage, message);
    setHidden(elements.feedError, false);
    setHidden(elements.feedStatus, true);
  }

  /* =========================================
     TOAST NOTIFICATIONS
  ========================================= */

  function showToast(message, type = "info") {
    const container = elements.toastContainer;

    if (!container) {
      console.info("ARS:", message);
      return;
    }

    const toast = document.createElement("div");
    toast.className = `ars-toast ars-toast-${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = String(message);

    container.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("is-removing");

      window.setTimeout(() => {
        toast.remove();
      }, 250);
    }, 3500);
  }

  /* =========================================
     AVATAR AND ACCOUNT DETAILS
  ========================================= */

  function applyAvatar(element, user) {
    if (!element) return;

    const letter =
      user.letter ||
      readStorage(STORAGE.letter, "") ||
      getInitial(user.displayName || user.username);

    const letterColor =
      user.letterColor ||
      readStorage(STORAGE.letterColor, "#ffffff");

    const background =
      user.background ||
      readStorage(
        STORAGE.background,
        "linear-gradient(135deg, #8b3dff, #c54dff)"
      );

    const avatarUrl = user.avatar || "";

    element.replaceChildren();

    if (avatarUrl) {
      const image = document.createElement("img");
      image.src = avatarUrl;
      image.alt = "Profile avatar";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";

      image.addEventListener("error", () => {
        image.remove();
        element.textContent = getInitial(letter);
      }, { once: true });

      element.appendChild(image);
    } else {
      element.textContent = getInitial(letter);
    }

    element.style.color = letterColor;
    element.style.background = background;
  }

  function renderAccount(user = getUser()) {
    const displayName =
      user.displayName ||
      user.display_name ||
      user.username ||
      "ARS Member";

    const username =
      user.username
        ? `@${String(user.username).replace(/^@/, "")}`
        : "@member";

    applyAvatar(elements.headerAvatar, user);
    applyAvatar(elements.composerAvatar, user);
    applyAvatar(elements.accountAvatar, user);

    setText(elements.accountDisplayName, displayName);
    setText(elements.accountUsername, username);
    setText(elements.accountStreak, user.streak ?? 0);
    setText(elements.accountXp, user.xp ?? 0);

    if (elements.accountDisplayName) {
      elements.accountDisplayName.title = displayName;
    }
  }

  async function refreshAccountFromSupabase() {
    const userId = getCurrentUserId();
    if (!userId || !supabaseClient) return;

    try {
      const { data, error } = await supabaseClient
        .from("users")
        .select(
          "id, username, display_name, email, bio, avatar, cover, verified, plan, streak, xp"
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("ARS profile refresh:", error.message);
        return;
      }

      if (!data) return;

      const current = getUser();

      const updated = {
        ...current,
        id: data.id,
        username: data.username || current.username || "",
        displayName:
          data.display_name ||
          current.displayName ||
          "",
        email: data.email || current.email || "",
        bio: data.bio ?? current.bio ?? "",
        avatar: data.avatar ?? current.avatar ?? "",
        cover: data.cover ?? current.cover ?? "",
        verified: data.verified ?? current.verified ?? false,
        plan: data.plan || current.plan || "free",
        streak: data.streak ?? current.streak ?? 0,
        xp: data.xp ?? current.xp ?? 0
      };

      saveUser(updated);
      renderAccount(updated);
    } catch (error) {
      console.warn("ARS profile refresh failed:", error);
    }
  }

  /* =========================================
     PROFILE MENU
  ========================================= */

  function closeProfileMenu() {
    setHidden(elements.profileMenu, true);

    elements.profileButton?.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  function toggleProfileMenu() {
    if (!elements.profileMenu) return;

    const opening = elements.profileMenu.hidden;
    setHidden(elements.profileMenu, !opening);

    elements.profileButton?.setAttribute(
      "aria-expanded",
      String(opening)
    );
  }

  /* =========================================
     FEED STATE
  ========================================= */

  let currentFeed = "latest";
  let currentSearch = "";
  let loadedPosts = [];
  let isLoadingFeed = false;
  let isPublishing = false;
  let feedRequestNumber = 0;

  /* =========================================
     FEED STATUS
  ========================================= */

  function setFeedLoading(message = "Loading posts...") {
    setText(elements.feedStatus, message);
    setHidden(elements.feedStatus, false);
    setHidden(elements.feedEmpty, true);
    setHidden(elements.feedError, true);
  }

  function setFeedReady() {
    setHidden(elements.feedStatus, true);
    setHidden(elements.feedError, true);
  }

  function setFeedError(message) {
    setText(elements.feedErrorMessage, message);
    setHidden(elements.feedStatus, true);
    setHidden(elements.feedEmpty, true);
    setHidden(elements.feedError, false);
  }

  function updateFeedCount(count) {
    setText(
      elements.feedCount,
      count ? `${count} ${count === 1 ? "post" : "posts"}` : "0 posts"
    );
  }

  /* =========================================
     POST DATA HELPERS
  ========================================= */

  function normalizePost(row) {
    if (!row || typeof row !== "object") {
      return null;
    }

    const author = row.users || row.profiles || {};
    const localUser = getUser();

    const userId =
      row.user_id ||
      row.author_id ||
      row.profile_id ||
      "";

    const isOwnPost =
      Boolean(getCurrentUserId()) &&
      userId === getCurrentUserId();

    const authorName =
      author.display_name ||
      author.displayName ||
      row.display_name ||
      (isOwnPost
        ? localUser.displayName
        : "") ||
      author.username ||
      row.username ||
      (isOwnPost ? localUser.username : "") ||
      "ARS Member";

    const authorUsername =
      author.username ||
      row.username ||
      (isOwnPost ? localUser.username : "") ||
      "";

    const authorAvatar =
      author.avatar ||
      row.avatar ||
      (isOwnPost ? localUser.avatar : "") ||
      "";

    const content =
      row.content ??
      row.body ??
      row.text ??
      "";

    const createdAt =
      row.created_at ||
      row.createdAt ||
      row.inserted_at ||
      null;

    return {
      id: row.id ?? row.post_id ?? null,
      userId,
      content: String(content),
      createdAt,
      authorName: String(authorName),
      authorUsername: String(authorUsername),
      authorAvatar: String(authorAvatar),
      verified: Boolean(author.verified ?? row.verified ?? false),
      isOwnPost
    };
  }

  function getPostTimestamp(post) {
    const value = new Date(post.createdAt || 0).getTime();
    return Number.isFinite(value) ? value : 0;
  }

  function sortPosts(posts) {
    const result = [...posts];

    if (currentFeed === "popular") {
      /*
       * No likes-count column is assumed here.
       * Popular currently uses newest-first ordering until
       * the real engagement schema is confirmed.
       */
      result.sort(
        (a, b) => getPostTimestamp(b) - getPostTimestamp(a)
      );
      return result;
    }

    result.sort(
      (a, b) => getPostTimestamp(b) - getPostTimestamp(a)
    );

    return result;
  }

  function filterPosts(posts) {
    const query = currentSearch.trim().toLowerCase();

    if (!query) return posts;

    return posts.filter(post => {
      const text = [
        post.content,
        post.authorName,
        post.authorUsername
      ].join(" ").toLowerCase();

      return text.includes(query);
    });
  }

  /* =========================================
     LOAD POSTS
  ========================================= */

  async function loadPosts(options = {}) {
    if (isLoadingFeed) return;

    if (!supabaseClient) {
      setFeedError("Supabase is unavailable. Please refresh the page.");
      return;
    }

    const requestId = ++feedRequestNumber;
    isLoadingFeed = true;

    if (!options.silent) {
      setFeedLoading("Loading posts...");
    }

    try {
      /*
       * The existing project references the "users" table
       * in auth.js. Posts are read from "posts".
       *
       * The query deliberately avoids assuming a relationship
       * name for a joined author record.
       */
      const { data, error } = await supabaseClient
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (requestId !== feedRequestNumber) return;

      if (error) {
        throw error;
      }

      const rows = Array.isArray(data) ? data : [];

      loadedPosts = rows
        .map(normalizePost)
        .filter(Boolean)
        .filter(post => post.id !== null);

      renderFeed();

      if (!loadedPosts.length) {
        setFeedReady();
        setHidden(elements.feedEmpty, true);
        setText(elements.feedStatus, "No posts have been shared yet.");
        setHidden(elements.feedStatus, false);
      }
    } catch (error) {
      console.error("ARS posts load error:", error);

      if (requestId === feedRequestNumber) {
        setFeedError(
          error?.message ||
          "Could not load posts. Check your posts table and access policies."
        );
      }
    } finally {
      if (requestId === feedRequestNumber) {
        isLoadingFeed = false;
      }
    }
    }
    /* =========================================
     RENDER POST CARD
  ========================================= */

  function renderPostCard(post) {
    const card = document.createElement("article");
    card.className = "post-card";
    card.dataset.postId = String(post.id);

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    if (post.authorAvatar) {
      const image = document.createElement("img");
      image.src = post.authorAvatar;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";

      image.addEventListener("error", () => {
        image.remove();
        avatar.textContent = getInitial(post.authorName);
      }, { once: true });

      avatar.appendChild(image);
    } else {
      avatar.textContent = getInitial(post.authorName);
    }

    const header = document.createElement("div");
    header.className = "post-header";

    const authorDetails = document.createElement("div");
    authorDetails.className = "post-author-details";

    const nameLine = document.createElement("div");
    nameLine.className = "post-author-name";

    const name = document.createElement("strong");
    name.textContent = post.authorName;
    nameLine.appendChild(name);

    if (post.verified) {
      const verified = document.createElement("span");
      verified.className = "post-verified";
      verified.textContent = "✓";
      verified.setAttribute("aria-label", "Verified account");
      nameLine.appendChild(verified);
    }

    const username = document.createElement("span");
    username.className = "post-author-username";
    username.textContent = post.authorUsername
      ? `@${post.authorUsername.replace(/^@/, "")}`
      : "";

    const time = document.createElement("time");
    time.className = "post-time";
    time.textContent = formatDate(post.createdAt);

    if (post.createdAt) {
      const date = new Date(post.createdAt);
      if (!Number.isNaN(date.getTime())) {
        time.dateTime = date.toISOString();
      }
    }

    authorDetails.append(nameLine, username, time);
    header.append(avatar, authorDetails);

    const content = document.createElement("div");
    content.className = "post-content";
    content.textContent = post.content;

    const body = document.createElement("div");
    body.className = "post-body";
    body.appendChild(content);

    const footer = document.createElement("div");
    footer.className = "post-footer";

    if (post.isOwnPost) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "post-delete-button";
      deleteButton.textContent = "Delete";
      deleteButton.dataset.action = "delete";
      deleteButton.dataset.postId = String(post.id);
      deleteButton.setAttribute("aria-label", "Delete your post");
      footer.appendChild(deleteButton);
    }

    card.append(header, body);

    if (footer.childElementCount) {
      card.appendChild(footer);
    }

    return card;
  }

  /* =========================================
     RENDER FEED
  ========================================= */

  function renderFeed() {
    if (!elements.postsList) return;

    const orderedPosts = sortPosts(loadedPosts);
    const visiblePosts = filterPosts(orderedPosts);

    const fragment = document.createDocumentFragment();

    visiblePosts.forEach(post => {
      fragment.appendChild(renderPostCard(post));
    });

    elements.postsList.replaceChildren(fragment);

    updateFeedCount(visiblePosts.length);
    setFeedReady();

    if (visiblePosts.length === 0 && currentSearch.trim()) {
      setText(
        elements.feedStatus,
        "No posts match your search."
      );
      setHidden(elements.feedStatus, false);
      setHidden(elements.feedEmpty, true);
      return;
    }

    if (visiblePosts.length === 0) {
      setHidden(elements.feedEmpty, false);
    } else {
      setHidden(elements.feedEmpty, true);
    }
  }

  /* =========================================
     PUBLISH POST
  ========================================= */

  async function publishPost() {
    if (isPublishing) return;

    if (!supabaseClient) {
      setComposerMessage(
        "Supabase is unavailable. Please refresh the page.",
        "error"
      );
      return;
    }

    const content = elements.postContent?.value.trim() || "";

    if (!content) {
      setComposerMessage(
        "Write something before publishing your post.",
        "error"
      );
      elements.postContent?.focus();
      return;
    }

    if (content.length > MAX_POST_LENGTH) {
      setComposerMessage(
        `Your post must be ${MAX_POST_LENGTH} characters or fewer.`,
        "error"
      );
      return;
    }

    isPublishing = true;

    if (elements.publishPostButton) {
      elements.publishPostButton.disabled = true;
      elements.publishPostButton.textContent = "Publishing...";
    }

    setComposerMessage("Publishing your post...");

    try {
      const {
        data: sessionData,
        error: sessionError
      } = await supabaseClient.auth.getSession();

      if (sessionError) throw sessionError;

      const authUser = sessionData?.session?.user;

      if (!authUser) {
        writeStorage(STORAGE.loggedIn, "false");
        window.location.replace("index.html");
        return;
      }

      /*
       * These are the two insert fields used here:
       * user_id and content.
       * The posts table must support both fields and
       * permit authenticated users to insert their own posts.
       */
      const { data, error } = await supabaseClient
        .from("posts")
        .insert({
          user_id: authUser.id,
          content
        })
        .select("*")
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("The post was not returned after publishing.");
      }

      elements.postContent.value = "";
      updateCharacterCount();
      setComposerMessage("Your post has been published.", "success");

      const newPost = normalizePost(data);

      if (newPost) {
        loadedPosts = [
          newPost,
          ...loadedPosts.filter(post => post.id !== newPost.id)
        ];
      }

      currentFeed = "latest";
      currentSearch = "";

      if (elements.searchInput) {
        elements.searchInput.value = "";
      }

      updateFeedTabs();
      renderFeed();

      showToast("Post published successfully.", "success");
    } catch (error) {
      console.error("ARS publish post error:", error);

      setComposerMessage(
        error?.message ||
          "Could not publish your post. Please try again.",
        "error"
      );
    } finally {
      isPublishing = false;

      if (elements.publishPostButton) {
        elements.publishPostButton.disabled = false;
        elements.publishPostButton.textContent = "Publish Post";
      }
    }
  }

  /* =========================================
     DELETE OWN POST
  ========================================= */

  async function deletePost(postId) {
    const post = loadedPosts.find(
      item => String(item.id) === String(postId)
    );

    if (!post) {
      showToast("This post could not be found.", "error");
      return;
    }

    if (!post.isOwnPost) {
      showToast("You can only delete your own posts.", "error");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      const {
        data: sessionData,
        error: sessionError
      } = await supabaseClient.auth.getSession();

      if (sessionError) throw sessionError;

      const authUser = sessionData?.session?.user;

      if (!authUser || authUser.id !== post.userId) {
        showToast("Your session could not be verified.", "error");
        return;
      }

      const { data, error } = await supabaseClient
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("user_id", authUser.id)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        showToast(
          "The post was not deleted. Check your database permissions.",
          "error"
        );
        return;
      }

      loadedPosts = loadedPosts.filter(
        item => String(item.id) !== String(postId)
      );

      renderFeed();
      showToast("Post deleted.", "success");
    } catch (error) {
      console.error("ARS delete post error:", error);

      showToast(
        error?.message || "Could not delete this post.",
        "error"
      );
    }
  }

  /* =========================================
     CHARACTER COUNTER
  ========================================= */

  function updateCharacterCount() {
    if (!elements.postContent || !elements.characterCount) {
      return;
    }

    const length = elements.postContent.value.length;

    elements.characterCount.textContent =
      `${length} / ${MAX_POST_LENGTH}`;

    elements.characterCount.classList.toggle(
      "limit-reached",
      length >= MAX_POST_LENGTH
    );
  }

  /* =========================================
     FEED TABS
  ========================================= */

  function updateFeedTabs() {
    $$(".feed-tab").forEach(button => {
      const active = button.dataset.feed === currentFeed;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function selectFeed(feed) {
    if (!["latest", "popular"].includes(feed)) return;

    currentFeed = feed;
    updateFeedTabs();
    renderFeed();

    /*
     * Popular uses newest-first ordering for now.
     * A true popularity ranking requires the actual
     * likes/reactions schema and count relationship.
     */
  }

  /* =========================================
     SEARCH
  ========================================= */

  function handleSearch(event) {
    event?.preventDefault();

    currentSearch = elements.searchInput?.value.trim() || "";
    renderFeed();

    if (currentSearch) {
      showToast(
        `Search results for "${currentSearch}"`,
        "info"
      );
    }
  }

  /* =========================================
     COMPOSER CONTROLS
  ========================================= */

  function openComposer() {
    if (!elements.composerCard) return;

    elements.composerCard.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    elements.postContent?.focus();
  }

  /* =========================================
     LOG OUT
  ========================================= */

  async function logout() {
    closeProfileMenu();
    showLoading("Signing out...");

    try {
      if (supabaseClient) {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;
      }

      writeStorage(STORAGE.loggedIn, "false");
      removeStorage(STORAGE.user);

      window.location.replace("index.html");
    } catch (error) {
      console.error("ARS logout error:", error);
      hideLoading();

      showToast(
        error?.message || "Could not sign out. Please try again.",
        "error"
      );
    }
  }

  /* =========================================
     NAVIGATION
  ========================================= */

  function openUnavailableSection(section) {
    closeProfileMenu();

    const messages = {
      explore: "The Explore page is not connected in this version.",
      notifications: "The Notifications page is not connected in this version.",
      messages: "The Messages page is not connected in this version.",
      bookmarks: "The Bookmarks page is not connected in this version.",
      profile: "The Profile page is not connected in this version.",
      settings: "The Settings page is not connected in this version."
    };

    showToast(messages[section] || "This section is not available.", "info");
  }

  function handleNavigationLink(event, section) {
    event.preventDefault();
    openUnavailableSection(section);
  }

  /* =========================================
     EVENT LISTENERS
  ========================================= */

  function setupEvents() {
    elements.searchForm?.addEventListener(
      "submit",
      handleSearch
    );

    elements.searchInput?.addEventListener("input", () => {
      currentSearch = elements.searchInput.value.trim();
      renderFeed();
    });

    elements.profileButton?.addEventListener(
      "click",
      event => {
        event.stopPropagation();
        toggleProfileMenu();
      }
    );

    document.addEventListener("click", event => {
      if (
        elements.profileMenu &&
        !elements.profileMenu.hidden &&
        !elements.profileMenu.contains(event.target) &&
        !elements.profileButton?.contains(event.target)
      ) {
        closeProfileMenu();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeProfileMenu();
      }
    });

    elements.logoutButton?.addEventListener(
      "click",
      logout
    );

    elements.openComposerButton?.addEventListener(
      "click",
      openComposer
    );

    elements.communityPostButton?.addEventListener(
      "click",
      openComposer
    );

    elements.mobileCreateButton?.addEventListener(
      "click",
      openComposer
    );

    elements.publishPostButton?.addEventListener(
      "click",
      publishPost
    );

    elements.postContent?.addEventListener(
      "input",
      updateCharacterCount
    );

    elements.refreshFeedButton?.addEventListener(
      "click",
      () => loadPosts()
    );

    elements.retryFeedButton?.addEventListener(
      "click",
      () => loadPosts()
    );

    $$(".feed-tab").forEach(button => {
      button.addEventListener("click", () => {
        selectFeed(button.dataset.feed);
      });
    });

    elements.postsList?.addEventListener("click", event => {
      const button = event.target.closest(
        'button[data-action="delete"]'
      );

      if (!button) return;

      deletePost(button.dataset.postId);
    });

    elements.notificationsButton?.addEventListener(
      "click",
      () => openUnavailableSection("notifications")
    );

    elements.navNotificationsLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "notifications")
    );

    elements.mobileNotificationsLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "notifications")
    );

    elements.exploreLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "explore")
    );

    elements.mobileExploreLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "explore")
    );

    elements.messagesLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "messages")
    );

    elements.bookmarksLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "bookmarks")
    );

    elements.sidebarProfileLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "profile")
    );

    elements.mobileProfileLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "profile")
    );

    elements.accountProfileLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "profile")
    );

    elements.viewProfileLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "profile")
    );

    elements.settingsLink?.addEventListener(
      "click",
      event => handleNavigationLink(event, "settings")
    );
  }

  /* =========================================
     INITIALIZATION
  ========================================= */

  async function init() {
    if (elements.currentYear) {
      elements.currentYear.textContent =
        String(new Date().getFullYear());
    }

    updateCharacterCount();
    renderAccount();
    setupEvents();
    updateFeedTabs();
    closeProfileMenu();

    const sessionAvailable = await requireSession();

    if (!sessionAvailable) return;

    renderAccount();
    await refreshAccountFromSupabase();
    await loadPosts();
  }

  /* =========================================
     START APPLICATION
  ========================================= */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})();
