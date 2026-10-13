
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

  const supabaseClient = window.supabase?.createClient(
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

  function getInitial(value, fallback = "A") {
    const text = String(value ?? "").trim();
    return text ? Array.from(text)[0].toUpperCase() : fallback;
  }

  function formatDate(value) {
    if (!value) return "Recently";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";

    const difference = Math.max(0, Date.now() - date.getTime());
    const minute = 60000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (difference < minute) return "Just now";
    if (difference < hour) {
      return `${Math.floor(difference / minute)}m ago`;
    }
    if (difference < day) {
      return `${Math.floor(difference / hour)}h ago`;
    }
    if (difference < 7 * day) {
      return `${Math.floor(difference / day)}d ago`;
    }

    return date.toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function setText(element, value) {
    if (element) element.textContent = String(value ?? "");
  }

  function setHidden(element, hidden) {
    if (element) element.hidden = Boolean(hidden);
  }

  function setComposerMessage(message, type = "") {
    const element = elements.composerMessage;
    if (!element) return;

    element.textContent = message;
    element.className = "form-message";
    if (type) element.classList.add(type);
  }

  /* =========================================
     USER AND SESSION
  ========================================= */

  function getUser() {
    return readJSON(STORAGE.user, {}) || {};
  }

  function saveUser(user) {
    return writeStorage(STORAGE.user, JSON.stringify(user || {}));
  }

  function getCurrentUserId() {
    const user = getUser();
    return user.id || user.user_id || null;
  }

  async function requireSession() {
    if (!supabaseClient) {
      showFatalError(
        "Supabase could not be initialized. Check the Supabase script and configuration."
      );
      return false;
    }

    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;

      if (!data?.session) {
        writeStorage(STORAGE.loggedIn, "false");
        window.location.replace("index.html");
        return false;
      }

      const authUser = data.session.user;
      const localUser = getUser();

      if (localUser.id && localUser.id !== authUser.id) {
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
     LOADING AND ERROR STATES
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
      window.setTimeout(() => toast.remove(), 250);
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

    const username = user.username
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
        displayName: data.display_name || current.displayName || "",
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
    elements.profileButton?.setAttribute("aria-expanded", "false");
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
      count
        ? `${count} ${count === 1 ? "post" : "posts"}`
        : "0 posts"
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

    const currentUserId = getCurrentUserId();

    const isOwnPost =
      Boolean(currentUserId) &&
      userId === currentUserId;

    const authorName =
      author.display_name ||
      author.displayName ||
      row.display_name ||
      (isOwnPost ? localUser.displayName : "") ||
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
      verified: Boolean(
        author.verified ?? row.verified ?? false
      ),
      isOwnPost
    };
  }

  function getPostTimestamp(post) {
    const value = new Date(post.createdAt || 0).getTime();
    return Number.isFinite(value) ? value : 0;
  }

  function sortPosts(posts) {
    const result = [...posts];

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
      setFeedError(
        "Supabase is unavailable. Please refresh the page."
      );
      return;
    }

    const requestId = ++feedRequestNumber;
    isLoadingFeed = true;

    if (!options.silent) {
      setFeedLoading("Loading posts...");
    }

    try {
      const { data, error } = await supabaseClient
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (requestId !== feedRequestNumber) return;
      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];

      loadedPosts = rows
        .map(normalizePost)
        .filter(Boolean)
        .filter(post => post.id !== null);

      renderFeed();

      if (loadedPosts.length === 0) {
        setFeedReady();
        setHidden(elements.feedEmpty, true);
        setText(
          elements.feedStatus,
          "No posts have been shared yet."
        );
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
      deleteButton.setAttribute(
        "aria-label",
        "Delete your post"
      );
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
        throw new Error(
          "The post was not returned after publishing."
        );
      }

      if (elements.postContent) {
        elements.postContent.value = "";
      }

      updateCharacterCount();
      setComposerMessage(
        "Your post has been published.",
        "success"
      );

      const newPost = normalizePost(data);

      if (newPost) {
        loadedPosts = [
          newPost,
          ...loadedPosts.filter(
            post => post.id !== newPost.id
          )
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
      showToast(
        "You can only delete your own posts.",
        "error"
      );
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
        showToast(
          "Your session could not be verified.",
          "error"
        );
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
    
/* CHARACTER COUNT */

function updateCharacterCount() {
  if (!postContent || !characterCount) return;

  const length = postContent.value.length;
  characterCount.textContent = `${length}/${MAX_POST_LENGTH}`;

  const isOverLimit = length > MAX_POST_LENGTH;
  characterCount.classList.toggle("is-over-limit", isOverLimit);

  if (publishButton) {
    publishButton.disabled =
      !postContent.value.trim() ||
      isOverLimit ||
      isPublishing;
  }
}

/* FEED TABS */

function updateFeedTabs() {
  feedTabs.forEach((tab) => {
    const isActive = tab.dataset.feed === currentFeed;

    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
  });
}

function selectFeed(feed) {
  if (feed !== "latest" && feed !== "popular") return;

  currentFeed = feed;
  updateFeedTabs();

  /*
   * The current database query does not retrieve a reliable popularity
   * score. Until that data exists, both tabs display posts newest-first.
   */
  renderFeed();
}

/* SEARCH */

function handleSearch(event) {
  event.preventDefault();

  if (!searchInput) return;

  searchQuery = searchInput.value.trim();
  renderFeed();
}

/* COMPOSER */

function openComposer() {
  if (!postContent) return;

  postContent.focus();

  if (composer) {
    composer.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}

/* LOGOUT */

async function logout() {
  if (isLoggingOut) return;

  isLoggingOut = true;

  if (logoutButton) {
    logoutButton.disabled = true;
  }

  try {
    if (!supabaseClient) {
      window.location.replace(LOGIN_PAGE);
      return;
    }

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Sign-out failed:", error);
      showToast("Unable to sign out. Please try again.", "error");
      return;
    }

    window.location.replace(LOGIN_PAGE);
  } catch (error) {
    console.error("Unexpected sign-out error:", error);
    showToast("Unable to sign out. Please try again.", "error");
  } finally {
    isLoggingOut = false;

    if (logoutButton) {
      logoutButton.disabled = false;
    }
  }
}

/* UNAVAILABLE SECTIONS */

function openUnavailableSection(section) {
  const messages = {
    notifications: "Notifications are not available yet.",
    explore: "Explore is not available yet.",
    messages: "Messages are not available yet.",
    bookmarks: "Bookmarks are not available yet.",
    profile: "Profile details are not available yet.",
    settings: "Settings are not available yet.",
  };

  const message = messages[section];

  if (message) {
    showToast(message, "info");
  }
}

/* NAVIGATION */

function handleNavigationLink(event, section) {
  event.preventDefault();

  if (section === "home") {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    return;
  }

  openUnavailableSection(section);
}

/* EVENT SETUP */

function setupEvents() {
  if (postContent) {
    postContent.addEventListener("input", updateCharacterCount);
  }

  if (composerForm) {
    composerForm.addEventListener("submit", publishPost);
  }

  if (searchForm) {
    searchForm.addEventListener("submit", handleSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      if (!searchInput.value.trim() && searchQuery) {
        searchQuery = "";
        renderFeed();
      }
    });
  }

  feedTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      selectFeed(tab.dataset.feed);
    });

    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();

      const currentIndex = feedTabs.indexOf(tab);
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex =
        (currentIndex + direction + feedTabs.length) % feedTabs.length;

      const nextTab = feedTabs[nextIndex];

      if (nextTab) {
        selectFeed(nextTab.dataset.feed);
        nextTab.focus();
      }
    });
  });

  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  if (profileMenuButton) {
    profileMenuButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleProfileMenu();
    });
  }

  if (profileMenu) {
    profileMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  document.addEventListener("click", (event) => {
    if (
      profileMenu &&
      profileMenuButton &&
      !profileMenu.contains(event.target) &&
      !profileMenuButton.contains(event.target)
    ) {
      closeProfileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProfileMenu();
    }
  });

  if (createPostButton) {
    createPostButton.addEventListener("click", openComposer);
  }

  if (messagesLink) {
    messagesLink.addEventListener("click", (event) => {
      event.preventDefault();
      showToast("Messages will be enabled later.", "info");
    });
  }

  navigationLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const section = link.dataset.section;

      if (!section) {
        event.preventDefault();
        return;
      }

      handleNavigationLink(event, section);
    });
  });

  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-post]");

    if (!deleteButton) return;

    event.preventDefault();

    const postId = deleteButton.dataset.deletePost;

    if (postId) {
      deletePost(postId);
    }
  });
}

/* INITIALIZATION */

async function init() {
  if (currentYearElement) {
    currentYearElement.textContent = String(new Date().getFullYear());
  }

  updateCharacterCount();
  updateFeedTabs();
  setupEvents();
  closeProfileMenu();

  const hasSession = await requireSession();

  if (!hasSession) return;

  renderAccount();
  await refreshAccountFromSupabase();
  await loadPosts();
}

/* START APPLICATION */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
})();
