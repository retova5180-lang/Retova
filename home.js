import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

(() => {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
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
  const LOGIN_PAGE = "index.html";
  const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const elements = {
    sidebarProfileLink: $("#sidebar-profile-link"),
    sidebarAvatar: $("#sidebar-avatar"),
    sidebarDisplayName: $("#sidebar-display-name"),
    sidebarUsername: $("#sidebar-username"),
    notificationBadge: $("#notification-badge"),
    messagesBadge: $("#messages-badge"),
    openPostDialog: $("#open-post-dialog"),
    mobileSearchButton: $("#mobile-search-button"),
    mobileNotificationsButton: $("#mobile-notifications-button"),
    feedRefreshButton: $("#feed-refresh-button"),
    wheelAttemptsText: $("#wheel-attempts-text"),
    openWheelButton: $("#open-wheel-button"),
    wheelResult: $("#wheel-result"),
    wheelResultText: $("#wheel-result-text"),
    wheelDialog: $("#wheel-dialog"),
    wheelVisual: $("#wheel-visual"),
    wheelInner: $("#wheel-inner"),
    wheelDialogStatus: $("#wheel-dialog-status"),
    wheelDialogResult: $("#wheel-dialog-result"),
    spinWheelButton: $("#spin-wheel-button"),
    viewAllStories: $("#view-all-stories"),
    storiesTrack: $("#stories-track"),
    openStoryDialog: $("#open-story-dialog"),
    createStoryAvatar: $("#create-story-avatar"),
    storiesLoading: $("#stories-loading"),
    storyDialog: $("#story-dialog"),
    createStoryForm: $("#create-story-form"),
    storyUploadArea: $("#story-upload-area"),
    storyUploadPlaceholder: $("#story-upload-placeholder"),
    chooseStoryMedia: $("#choose-story-media"),
    storyPreview: $("#story-preview"),
    storyPreviewImage: $("#story-preview-image"),
    storyPreviewVideo: $("#story-preview-video"),
    removeStoryMedia: $("#remove-story-media"),
    storyMediaInput: $("#story-media-input"),
    storyText: $("#story-text"),
    storyFormError: $("#story-form-error"),
    publishStoryButton: $("#publish-story-button"),
    storyViewerDialog: $("#story-viewer-dialog"),
    storyViewerProgress: $("#story-viewer-progress"),
    storyViewerAvatar: $("#story-viewer-avatar"),
    storyViewerDisplayName: $("#story-viewer-display-name"),
    storyViewerTime: $("#story-viewer-time"),
    closeStoryViewer: $("#close-story-viewer"),
    storyViewerContent: $("#story-viewer-content"),
    storyViewerImage: $("#story-viewer-image"),
    storyViewerVideo: $("#story-viewer-video"),
    storyViewerCaption: $("#story-viewer-caption"),
    storyPreviousButton: $("#story-previous-button"),
    storyNextButton: $("#story-next-button"),
    composerAvatar: $("#composer-avatar"),
    composerPrompt: $("#composer-prompt"),
    composerPhotoButton: $("#composer-photo-button"),
    composerVideoButton: $("#composer-video-button"),
    composerHashtagButton: $("#composer-hashtag-button"),
    composerOpenButton: $("#composer-open-button"),
    feedSectionTitle: $("#feed-section-title"),
    feedLoading: $("#feed-loading"),
    postsList: $("#posts-list"),
    feedEmptyState: $("#feed-empty-state"),
    emptyFeedCreateButton: $("#empty-feed-create-button"),
    feedErrorState: $("#feed-error-state"),
    feedErrorMessage: $("#feed-error-message"),
    retryFeedButton: $("#retry-feed-button"),
    loadMorePosts: $("#load-more-posts"),
    feedEndMessage: $("#feed-end-message"),
    rightSidebarAvatar: $("#right-sidebar-avatar"),
    rightSidebarDisplayName: $("#right-sidebar-display-name"),
    rightSidebarUsername: $("#right-sidebar-username"),
    accountVerifiedLabel: $("#account-verified-label"),
    accountPostsCount: $("#account-posts-count"),
    accountFollowersCount: $("#account-followers-count"),
    accountFollowingCount: $("#account-following-count"),
    accountPlanName: $("#account-plan-name"),
    refreshSuggestionsButton: $("#refresh-suggestions-button"),
    suggestionsList: $("#suggestions-list"),
    suggestionsLoading: $("#suggestions-loading"),
    currentYear: $("#current-year"),
    mobileCreatePostButton: $("#mobile-create-post-button"),
    mobileNotificationBadge: $("#mobile-notification-badge"),
    mobileNavAvatar: $("#mobile-nav-avatar"),
    postDialog: $("#post-dialog"),
    createPostForm: $("#create-post-form"),
    postDialogAvatar: $("#post-dialog-avatar"),
    postDialogDisplayName: $("#post-dialog-display-name"),
    postDialogUsername: $("#post-dialog-username"),
    postContent: $("#post-content"),
    postAddHashtag: $("#post-add-hashtag"),
    postAddEmoji: $("#post-add-emoji"),
    postCharacterCounter: $("#post-character-counter"),
    postMediaPreview: $("#post-media-preview"),
    postMediaPreviewImage: $("#post-media-preview-image"),
    postMediaPreviewVideo: $("#post-media-preview-video"),
    removePostMedia: $("#remove-post-media"),
    choosePostImage: $("#choose-post-image"),
    choosePostVideo: $("#choose-post-video"),
    choosePostHashtag: $("#choose-post-hashtag"),
    postMediaInput: $("#post-media-input"),
    postFormError: $("#post-form-error"),
    publishPostButton: $("#publish-post-button"),
    toastContainer: $("#toast-container"),
    appLiveStatus: $("#app-live-status")
  };

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

  function setLiveStatus(message) {
    setText(elements.appLiveStatus, message);
  }

  function showToast(message, type = "info") {
    const container = elements.toastContainer;

    if (!container) {
      setLiveStatus(message);
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

  function setFormError(element, message) {
    setText(element, message);
    setHidden(element, !message);
  }

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
    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) throw error;

      const authUser = data?.session?.user;
      if (!authUser) {
        writeStorage(STORAGE.loggedIn, "false");
        window.location.replace(LOGIN_PAGE);
        return false;
      }

      const localUser = getUser();
      if (localUser.id && localUser.id !== authUser.id) {
        console.warn("ARS local profile ID differs from the authenticated user.");
      }

      saveUser({
        ...localUser,
        id: authUser.id,
        email: authUser.email || localUser.email || ""
      });

      writeStorage(STORAGE.loggedIn, "true");
      return true;
    } catch (error) {
      console.error("ARS session check failed:", error);
      showToast(
        "Your session could not be verified. Please refresh or log in again.",
        "error"
      );
      return false;
    }
  }

  function applyAvatar(element, user = {}) {
    if (!element) return;

    const letter = user.letter ||
      readStorage(STORAGE.letter, "") ||
      getInitial(user.displayName || user.display_name || user.username);

    const letterColor = user.letterColor ||
      readStorage(STORAGE.letterColor, "#ffffff");

    const background = user.background ||
      readStorage(
        STORAGE.background,
        "linear-gradient(135deg, #8b3dff, #c54dff)"
      );

    element.replaceChildren();

    if (user.avatar) {
      const image = document.createElement("img");
      image.src = user.avatar;
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
    const displayName = user.displayName ||
      user.display_name ||
      user.username ||
      "ARS Member";

    const username = user.username
      ? `@${String(user.username).replace(/^@/, "")}`
      : "@member";

    [
      elements.sidebarAvatar,
      elements.composerAvatar,
      elements.rightSidebarAvatar,
      elements.mobileNavAvatar,
      elements.postDialogAvatar,
      elements.createStoryAvatar
    ].forEach(element => applyAvatar(element, user));

    setText(elements.sidebarDisplayName, displayName);
    setText(elements.sidebarUsername, username);
    setText(elements.rightSidebarDisplayName, displayName);
    setText(elements.rightSidebarUsername, username);
    setText(elements.postDialogDisplayName, displayName);
    setText(elements.postDialogUsername, username);
    setText(elements.accountPlanName, user.plan || "Free");

    setHidden(elements.accountVerifiedLabel, !user.verified);
    setText(elements.accountPostsCount, user.posts_count ?? 0);
    setText(elements.accountFollowersCount, user.followers_count ?? 0);
    setText(elements.accountFollowingCount, user.following_count ?? 0);
  }

  async function refreshAccountFromSupabase() {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabaseClient
        .from("users")
        .select(
          "id, username, display_name, email, bio, avatar, cover, verified, plan, streak, xp"
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
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

  let loadedPosts = [];
  let nextPostsOffset = 0;
  let isLoadingFeed = false;
  let isPublishing = false;
  let hasMorePosts = true;
  let feedRequestNumber = 0;

  function setFeedLoading(message = "Loading posts...") {
    setText(elements.feedLoading, message);
    setHidden(elements.feedLoading, false);
    setHidden(elements.feedEmptyState, true);
    setHidden(elements.feedErrorState, true);
  }

  function setFeedReady() {
    setHidden(elements.feedLoading, true);
    setHidden(elements.feedErrorState, true);
  }

  function setFeedError(message) {
    setText(elements.feedErrorMessage, message);
    setHidden(elements.feedLoading, true);
    setHidden(elements.feedEmptyState, true);
    setHidden(elements.feedErrorState, false);
  }

  function normalizePost(row) {
    if (!row || typeof row !== "object") return null;

    const localUser = getUser();
    const userId = row.user_id || "";
    const currentUserId = getCurrentUserId();
    const isOwnPost = Boolean(currentUserId && userId === currentUserId);
    const author = row.users || {};
    const authorName = author.display_name ||
      (isOwnPost ? localUser.displayName : "") ||
      author.username ||
      (isOwnPost ? localUser.username : "") ||
      "ARS Member";

    return {
      id: row.id,
      userId,
      content: String(row.content ?? ""),
      image: row.image || "",
      mediaType: row.media_type || "",
      createdAt: row.created_at || null,
      authorName: String(authorName),
      authorUsername: String(
        author.username || (isOwnPost ? localUser.username : "") || ""
      ),
      authorAvatar: String(
        author.avatar || (isOwnPost ? localUser.avatar : "") || ""
      ),
      verified: Boolean(author.verified),
      likesCount: Number(row.likes_count || 0),
      commentsCount: Number(row.comments_count || 0),
      repostsCount: Number(row.reposts_count || 0),
      isOwnPost
    };
        }
   function getPostTimestamp(post) {
    const timestamp = new Date(post.createdAt || 0).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function sortPosts(posts) {
    return [...posts].sort(
      (first, second) =>
        getPostTimestamp(second) - getPostTimestamp(first)
    );
  }

  function renderPostMedia(post, body) {
    if (!post.image) return;

    const media = document.createElement(
      post.mediaType === "video" ? "video" : "img"
    );

    media.className = "post-media";
    media.src = post.image;
    media.loading = "lazy";

    if (media instanceof HTMLImageElement) {
      media.alt = "Post media";
    } else {
      media.controls = true;
      media.preload = "metadata";
    }

    media.referrerPolicy = "no-referrer";
    body.appendChild(media);
  }

  function renderPostCard(post) {
    const card = document.createElement("article");
    card.className = "post-card";
    card.dataset.postId = String(post.id);

    const header = document.createElement("header");
    header.className = "post-header";

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

    const body = document.createElement("div");
    body.className = "post-body";

    const content = document.createElement("div");
    content.className = "post-content";
    content.textContent = post.content;
    body.appendChild(content);

    renderPostMedia(post, body);

    const footer = document.createElement("footer");
    footer.className = "post-footer";

    const likes = document.createElement("span");
    likes.className = "post-likes-count";
    likes.textContent = `${post.likesCount} likes`;

    const comments = document.createElement("span");
    comments.className = "post-comments-count";
    comments.textContent = `${post.commentsCount} comments`;

    const reposts = document.createElement("span");
    reposts.className = "post-reposts-count";
    reposts.textContent = `${post.repostsCount} reposts`;

    footer.append(likes, comments, reposts);

    if (post.isOwnPost) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "post-delete-button";
      deleteButton.dataset.action = "delete-post";
      deleteButton.dataset.postId = String(post.id);
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", "Delete your post");
      footer.appendChild(deleteButton);
    }

    card.append(header, body, footer);
    return card;
  }

  function renderFeed() {
    if (!elements.postsList) return;

    const posts = sortPosts(loadedPosts);
    const fragment = document.createDocumentFragment();

    posts.forEach(post => {
      fragment.appendChild(renderPostCard(post));
    });

    elements.postsList.replaceChildren(fragment);

    setHidden(elements.feedLoading, true);
    setHidden(elements.feedErrorState, true);
    setHidden(elements.feedEmptyState, posts.length > 0);
    setHidden(elements.loadMorePosts, !hasMorePosts);
    setHidden(
      elements.feedEndMessage,
      hasMorePosts || posts.length === 0
    );

    if (posts.length === 0) {
      setText(
        elements.feedEndMessage,
        "You are all caught up."
      );
    }
  }

  async function loadPosts({ reset = true, silent = false } = {}) {
    if (isLoadingFeed) return;

    if (reset) {
      nextPostsOffset = 0;
      hasMorePosts = true;
    }

    if (!hasMorePosts && !reset) return;

    const requestId = ++feedRequestNumber;
    isLoadingFeed = true;

    if (!silent) {
      setFeedLoading("Loading posts...");
    }

    try {
      const { data, error } = await supabaseClient
        .from("posts")
        .select(
          "id, created_at, user_id, content, image, media_type, likes_count, comments_count, reposts_count, users(id, username, display_name, avatar, verified)"
        )
        .order("created_at", { ascending: false })
        .range(
          nextPostsOffset,
          nextPostsOffset + PAGE_SIZE - 1
        );

      if (requestId !== feedRequestNumber) return;
      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      const normalized = rows
        .map(normalizePost)
        .filter(post => post && post.id);

      if (reset) {
        loadedPosts = normalized;
      } else {
        const existingIds = new Set(
          loadedPosts.map(post => String(post.id))
        );

        loadedPosts = loadedPosts.concat(
          normalized.filter(
            post => !existingIds.has(String(post.id))
          )
        );
      }

      nextPostsOffset += rows.length;
      hasMorePosts = rows.length === PAGE_SIZE;

      renderFeed();
      setFeedReady();

      if (rows.length === 0 && reset) {
        setHidden(elements.feedEmptyState, false);
        setText(
          elements.feedEndMessage,
          "No posts have been shared yet."
        );
      }

      setLiveStatus(`${loadedPosts.length} posts loaded.`);
    } catch (error) {
      console.error("ARS feed loading failed:", error);

      if (requestId === feedRequestNumber) {
        setFeedError(
          error?.message ||
          "Could not load posts. Please try again."
        );
      }
    } finally {
      if (requestId === feedRequestNumber) {
        isLoadingFeed = false;
      }
    }
  }

  function updateCharacterCount() {
    const content = elements.postContent;
    const counter = elements.postCharacterCounter;
    const button = elements.publishPostButton;

    if (!content) return;

    const length = content.value.length;
    const overLimit = length > MAX_POST_LENGTH;

    setText(counter, `${length}/${MAX_POST_LENGTH}`);
    counter?.classList.toggle("is-over-limit", overLimit);

    if (button) {
      button.disabled =
        !content.value.trim() ||
        overLimit ||
        isPublishing;
    }
  }

  function openDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
      return;
    }

    dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
      return;
    }

    dialog.removeAttribute("open");
  }

  function openPostComposer() {
    setFormError(elements.postFormError, "");
    updateCharacterCount();
    openDialog(elements.postDialog);
    elements.postContent?.focus();
  }

  async function publishPost(event) {
    event?.preventDefault();

    if (isPublishing) return;

    const content = elements.postContent?.value.trim() || "";

    if (!content) {
      setFormError(
        elements.postFormError,
        "Write something before publishing."
      );

      elements.postContent?.focus();
      return;
    }

    if (content.length > MAX_POST_LENGTH) {
      setFormError(
        elements.postFormError,
        `Your post must be ${MAX_POST_LENGTH} characters or fewer.`
      );

      return;
    }

    isPublishing = true;
    updateCharacterCount();
    setFormError(elements.postFormError, "");

    if (elements.publishPostButton) {
      elements.publishPostButton.textContent = "Publishing...";
    }

    try {
      const {
        data: sessionData,
        error: sessionError
      } = await supabaseClient.auth.getSession();

      if (sessionError) throw sessionError;

      const authUser = sessionData?.session?.user;

      if (!authUser) {
        writeStorage(STORAGE.loggedIn, "false");
        window.location.replace(LOGIN_PAGE);
        return;
      }

      const { data, error } = await supabaseClient
        .from("posts")
        .insert({
          user_id: authUser.id,
          content
        })
        .select(
          "id, created_at, user_id, content, image, media_type, likes_count, comments_count, reposts_count"
        )
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "The published post was not returned."
        );
      }

      elements.postContent.value = "";
      updateCharacterCount();
      closeDialog(elements.postDialog);

      showToast(
        "Post published successfully.",
        "success"
      );

      const post = normalizePost(data);

      if (post) {
        loadedPosts = [
          post,
          ...loadedPosts.filter(
            item => String(item.id) !== String(post.id)
          )
        ];
      }

      renderFeed();
      setLiveStatus("Your post has been published.");
    } catch (error) {
      console.error("ARS post publishing failed:", error);

      setFormError(
        elements.postFormError,
        error?.message ||
        "Could not publish your post. Please try again."
      );
    } finally {
      isPublishing = false;

      if (elements.publishPostButton) {
        elements.publishPostButton.textContent = "Publish Post";
      }

      updateCharacterCount();
    }
  }

  async function deletePost(postId) {
    const post = loadedPosts.find(
      item => String(item.id) === String(postId)
    );

    if (!post || !post.isOwnPost) {
      showToast(
        "You can only delete your own posts.",
        "error"
      );

      return;
    }

    if (
      !window.confirm(
        "Delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

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

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(
          "The post was not deleted. Check your database permissions."
        );
      }

      loadedPosts = loadedPosts.filter(
        item => String(item.id) !== String(postId)
      );

      renderFeed();
      showToast("Post deleted.", "success");
    } catch (error) {
      console.error("ARS post deletion failed:", error);

      showToast(
        error?.message || "Could not delete this post.",
        "error"
      );
    }
      }
    let selectedPostMedia = null;
  let selectedStoryMedia = null;
  let storyGroups = [];
  let activeStoryGroupIndex = 0;
  let activeStoryIndex = 0;
  let storyViewerTimer = null;

  function clearMediaPreview(type) {
    const isPost = type === "post";
    const selectedMedia = isPost
      ? selectedPostMedia
      : selectedStoryMedia;

    if (selectedMedia?.previewUrl) {
      URL.revokeObjectURL(selectedMedia.previewUrl);
    }

    if (isPost) {
      selectedPostMedia = null;
      setHidden(elements.postMediaPreview, true);

      if (elements.postMediaPreviewImage) {
        elements.postMediaPreviewImage.removeAttribute("src");
        setHidden(elements.postMediaPreviewImage, true);
      }

      if (elements.postMediaPreviewVideo) {
        elements.postMediaPreviewVideo.pause();
        elements.postMediaPreviewVideo.removeAttribute("src");
        elements.postMediaPreviewVideo.load();
        setHidden(elements.postMediaPreviewVideo, true);
      }

      if (elements.postMediaInput) {
        elements.postMediaInput.value = "";
      }
    } else {
      selectedStoryMedia = null;
      setHidden(elements.storyPreview, true);

      if (elements.storyPreviewImage) {
        elements.storyPreviewImage.removeAttribute("src");
        setHidden(elements.storyPreviewImage, true);
      }

      if (elements.storyPreviewVideo) {
        elements.storyPreviewVideo.pause();
        elements.storyPreviewVideo.removeAttribute("src");
        elements.storyPreviewVideo.load();
        setHidden(elements.storyPreviewVideo, true);
      }

      if (elements.storyMediaInput) {
        elements.storyMediaInput.value = "";
      }
    }
  }

  function showMediaPreview(file, type) {
    if (!file) return;

    const isPost = type === "post";
    const input = isPost
      ? elements.postMediaInput
      : elements.storyMediaInput;
    const imageElement = isPost
      ? elements.postMediaPreviewImage
      : elements.storyPreviewImage;
    const videoElement = isPost
      ? elements.postMediaPreviewVideo
      : elements.storyPreviewVideo;
    const previewContainer = isPost
      ? elements.postMediaPreview
      : elements.storyPreview;
    const errorElement = isPost
      ? elements.postFormError
      : elements.storyFormError;

    const allowedImage = file.type.startsWith("image/");
    const allowedVideo = file.type.startsWith("video/");
    const maxBytes = 50 * 1024 * 1024;

    if (!allowedImage && !allowedVideo) {
      setFormError(
        errorElement,
        "Choose a supported image or video file."
      );

      if (input) input.value = "";
      return;
    }

    if (file.size > maxBytes) {
      setFormError(
        errorElement,
        "The selected file must be smaller than 50 MB."
      );

      if (input) input.value = "";
      return;
    }

    clearMediaPreview(type);

    const previewUrl = URL.createObjectURL(file);
    const media = {
      file,
      mediaType: allowedVideo ? "video" : "image",
      previewUrl
    };

    if (isPost) {
      selectedPostMedia = media;
    } else {
      selectedStoryMedia = media;
    }

    if (allowedVideo) {
      if (imageElement) {
        imageElement.removeAttribute("src");
        setHidden(imageElement, true);
      }

      if (videoElement) {
        videoElement.src = previewUrl;
        setHidden(videoElement, false);
      }
    } else {
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.load();
        setHidden(videoElement, true);
      }

      if (imageElement) {
        imageElement.src = previewUrl;
        setHidden(imageElement, false);
      }
    }

    setHidden(previewContainer, false);
    setFormError(errorElement, "");
  }

  function insertAtCursor(input, text) {
    if (!input) return;

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;

    input.setRangeText(text, start, end, "end");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  function addPostHashtag() {
    const input = elements.postContent;
    if (!input) return;

    const prefix = input.value && !/\s$/.test(input.value)
      ? " #"
      : "#";

    insertAtCursor(input, `${prefix}`);
  }

  function addPostEmoji() {
    const emojis = ["✨", "💜", "🔥", "🌟", "😊"];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const input = elements.postContent;

    if (!input) return;

    const prefix = input.value && !/\s$/.test(input.value)
      ? " "
      : "";

    insertAtCursor(input, `${prefix}${emoji}`);
  }

  function getStoryMediaUrl(story) {
    return story.image || story.media_url || "";
  }

  function normalizeStory(row) {
    if (!row || typeof row !== "object") return null;

    const currentUserId = getCurrentUserId();
    const user = row.users || {};
    const storyUserId = row.user_id || "";

    return {
      id: row.id,
      userId: storyUserId,
      image: getStoryMediaUrl(row),
      mediaType: row.media_type || "image",
      text: String(row.story_text || ""),
      createdAt: row.created_at || null,
      expiresAt: row.expires_at || null,
      viewersCount: Number(row.viewers_count || 0),
      displayName: user.display_name ||
        user.username ||
        (storyUserId === currentUserId
          ? getUser().displayName || getUser().username
          : "") ||
        "ARS Member",
      username: user.username || "",
      avatar: user.avatar || "",
      isOwnStory: Boolean(
        currentUserId && storyUserId === currentUserId
      )
    };
  }

  function groupStories(stories) {
    const groups = new Map();

    stories.forEach(story => {
      if (!story) return;

      if (!groups.has(story.userId)) {
        groups.set(story.userId, {
          userId: story.userId,
          displayName: story.displayName,
          username: story.username,
          avatar: story.avatar,
          isOwnStory: story.isOwnStory,
          stories: []
        });
      }

      groups.get(story.userId).stories.push(story);
    });

    return Array.from(groups.values()).map(group => ({
      ...group,
      stories: group.stories.sort((first, second) => {
        const firstTime = new Date(first.createdAt || 0).getTime();
        const secondTime = new Date(second.createdAt || 0).getTime();

        return firstTime - secondTime;
      })
    }));
  }

  function renderStoryAvatar(group) {
    const avatar = document.createElement("div");
    avatar.className = "story-avatar";

    if (group.avatar) {
      const image = document.createElement("img");
      image.src = group.avatar;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";

      image.addEventListener("error", () => {
        image.remove();
        avatar.textContent = getInitial(group.displayName);
      }, { once: true });

      avatar.appendChild(image);
    } else {
      avatar.textContent = getInitial(group.displayName);
    }

    return avatar;
  }

  function renderStories() {
    const track = elements.storiesTrack;
    if (!track) return;

    const fragment = document.createDocumentFragment();

    storyGroups.forEach((group, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "story-item";
      button.dataset.storyGroupIndex = String(index);
      button.setAttribute(
        "aria-label",
        `View ${group.displayName}'s story`
      );

      const avatar = renderStoryAvatar(group);
      const name = document.createElement("span");
      name.className = "story-item-name";
      name.textContent = group.isOwnStory
        ? "Your story"
        : group.displayName;

      button.append(avatar, name);
      fragment.appendChild(button);
    });

    track.replaceChildren(fragment);
    setHidden(elements.storiesLoading, true);
  }

  async function loadStories() {
    if (!elements.storiesTrack) return;

    setHidden(elements.storiesLoading, false);

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabaseClient
        .from("stories")
        .select(
          "id, created_at, user_id, image, viewers_count, expires_at, media_type, story_text, users(id, username, display_name, avatar)"
        )
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const stories = (Array.isArray(data) ? data : [])
        .map(normalizeStory)
        .filter(story => story && story.userId && story.image);

      storyGroups = groupStories(stories);
      renderStories();
    } catch (error) {
      console.error("ARS stories loading failed:", error);
      setHidden(elements.storiesLoading, true);

      showToast(
        "Stories could not be loaded right now.",
        "error"
      );
    }
  }

  function stopStoryViewerTimer() {
    if (storyViewerTimer !== null) {
      window.clearTimeout(storyViewerTimer);
      storyViewerTimer = null;
    }
  }

  function getActiveStory() {
    const group = storyGroups[activeStoryGroupIndex];
    if (!group) return null;

    return group.stories[activeStoryIndex] || null;
  }

  function renderStoryProgress(group) {
    const container = elements.storyViewerProgress;
    if (!container) return;

    const fragment = document.createDocumentFragment();

    group.stories.forEach((story, index) => {
      const segment = document.createElement("span");
      segment.className = "story-progress-segment";

      if (index < activeStoryIndex) {
        segment.classList.add("is-complete");
      } else if (index === activeStoryIndex) {
        segment.classList.add("is-active");
      }

      segment.dataset.storyId = String(story.id);
      fragment.appendChild(segment);
    });

    container.replaceChildren(fragment);
  }

  function renderActiveStory() {
    const group = storyGroups[activeStoryGroupIndex];
    const story = getActiveStory();

    if (!group || !story) {
      closeStoryViewer();
      return;
    }

    stopStoryViewerTimer();

    setText(elements.storyViewerDisplayName, story.displayName);
    setText(elements.storyViewerTime, formatDate(story.createdAt));
    setText(elements.storyViewerCaption, story.text);

    applyAvatar(elements.storyViewerAvatar, {
      displayName: story.displayName,
      username: story.username,
      avatar: story.avatar
    });

    const isVideo = story.mediaType === "video";

    if (elements.storyViewerImage) {
      elements.storyViewerImage.removeAttribute("src");
      setHidden(elements.storyViewerImage, isVideo);
    }

    if (elements.storyViewerVideo) {
      elements.storyViewerVideo.pause();
      elements.storyViewerVideo.removeAttribute("src");
      elements.storyViewerVideo.load();
      setHidden(elements.storyViewerVideo, !isVideo);
    }

    if (isVideo && elements.storyViewerVideo) {
      elements.storyViewerVideo.src = story.image;
      elements.storyViewerVideo.controls = true;
    } else if (elements.storyViewerImage) {
      elements.storyViewerImage.src = story.image;
      elements.storyViewerImage.alt = `${story.displayName}'s story`;
    }

    setHidden(elements.storyViewerCaption, !story.text);
    renderStoryProgress(group);

    storyViewerTimer = window.setTimeout(() => {
      showNextStory();
    }, isVideo ? 15000 : 5000);
  }

  function openStoryViewer(groupIndex, storyIndex = 0) {
    if (
      groupIndex < 0 ||
      groupIndex >= storyGroups.length
    ) {
      return;
    }

    activeStoryGroupIndex = groupIndex;
    activeStoryIndex = storyIndex;

    openDialog(elements.storyViewerDialog);
    renderActiveStory();
  }

  function closeStoryViewer() {
    stopStoryViewerTimer();

    if (elements.storyViewerVideo) {
      elements.storyViewerVideo.pause();
    }

    closeDialog(elements.storyViewerDialog);
  }

  function showNextStory() {
    stopStoryViewerTimer();

    const group = storyGroups[activeStoryGroupIndex];

    if (!group) {
      closeStoryViewer();
      return;
    }

    if (activeStoryIndex + 1 < group.stories.length) {
      activeStoryIndex += 1;
      renderActiveStory();
      return;
    }

    if (activeStoryGroupIndex + 1 < storyGroups.length) {
      activeStoryGroupIndex += 1;
      activeStoryIndex = 0;
      renderActiveStory();
      return;
    }

    closeStoryViewer();
  }

  function showPreviousStory() {
    stopStoryViewerTimer();

    if (activeStoryIndex > 0) {
      activeStoryIndex -= 1;
      renderActiveStory();
      return;
    }

    if (activeStoryGroupIndex > 0) {
      activeStoryGroupIndex -= 1;

      const previousGroup = storyGroups[activeStoryGroupIndex];
      activeStoryIndex = previousGroup.stories.length - 1;

      renderActiveStory();
      return;
    }

    renderActiveStory();
        }
   async function recordStoryView(story) {
    const viewerId = getCurrentUserId();

    if (!viewerId || !story?.id || story.userId === viewerId) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from("story_views")
        .upsert(
          {
            story_id: story.id,
            viewer_id: viewerId
          },
          {
            onConflict: "story_id,viewer_id",
            ignoreDuplicates: true
          }
        );

      if (error) {
        console.warn("ARS story view could not be recorded:", error);
      }
    } catch (error) {
      console.warn("ARS story view error:", error);
    }
  }

  async function publishStory(event) {
    event?.preventDefault();

    const userId = getCurrentUserId();
    const media = selectedStoryMedia;
    const caption = elements.storyText?.value.trim() || "";

    if (!userId) {
      showToast("Please log in to publish a story.", "error");
      return;
    }

    if (!media) {
      setFormError(
        elements.storyFormError,
        "Choose an image or video for your story."
      );
      return;
    }

    const button = elements.publishStoryButton;

    if (button) {
      button.disabled = true;
      button.textContent = "Publishing...";
    }

    setFormError(elements.storyFormError, "");

    try {
      showToast(
        "Story publishing requires a configured Supabase Storage bucket.",
        "error"
      );
    } catch (error) {
      console.error("ARS story publishing failed:", error);

      setFormError(
        elements.storyFormError,
        error?.message || "Could not publish your story."
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Publish Story";
      }
    }
  }

  function resetStoryForm() {
    clearMediaPreview("story");

    if (elements.storyText) {
      elements.storyText.value = "";
    }

    setFormError(elements.storyFormError, "");
  }

  function openStoryComposer() {
    resetStoryForm();
    openDialog(elements.storyDialog);
  }

  function closeStoryComposer() {
    closeDialog(elements.storyDialog);
    resetStoryForm();
  }

  function getSelectedFeedTab() {
    const selected = $(
      '[data-feed-tab][aria-selected="true"]'
    );

    return selected?.dataset.feedTab || "latest";
  }

  function updateFeedTabs(selectedTab) {
    const tabs = $$("[data-feed-tab]");

    tabs.forEach(tab => {
      const active = tab.dataset.feedTab === selectedTab;

      tab.setAttribute("aria-selected", String(active));
      tab.classList.toggle("is-active", active);
      tab.tabIndex = active ? 0 : -1;
    });

    if (elements.feedSectionTitle) {
      elements.feedSectionTitle.textContent =
        selectedTab === "following"
          ? "Following"
          : "Latest Posts";
    }
  }

  function selectFeedTab(tabName) {
    const allowedTabs = new Set(["latest", "following"]);

    if (!allowedTabs.has(tabName)) {
      return;
    }

    updateFeedTabs(tabName);

    if (tabName === "latest") {
      loadPosts({ reset: true });
      return;
    }

    loadFollowingFeed();
  }

  async function loadFollowingFeed() {
    const userId = getCurrentUserId();

    if (!userId) {
      setFeedError("Please log in to view your following feed.");
      return;
    }

    if (isLoadingFeed) {
      return;
    }

    isLoadingFeed = true;
    setFeedLoading("Loading posts from accounts you follow...");

    try {
      const { data: relationships, error: relationshipError } =
        await supabaseClient
          .from("followers")
          .select("following_id")
          .eq("follower_id", userId);

      if (relationshipError) {
        throw relationshipError;
      }

      const followingIds = [
        ...new Set(
          (relationships || [])
            .map(row => row.following_id)
            .filter(Boolean)
        )
      ];

      if (followingIds.length === 0) {
        loadedPosts = [];
        hasMorePosts = false;
        renderFeed();
        setFeedReady();
        setHidden(elements.feedEmptyState, false);
        return;
      }

      const { data, error } = await supabaseClient
        .from("posts")
        .select(
          "id, created_at, user_id, content, image, media_type, likes_count, comments_count, reposts_count, users(id, username, display_name, avatar, verified)"
        )
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        throw error;
      }

      loadedPosts = (data || [])
        .map(normalizePost)
        .filter(Boolean);

      hasMorePosts = false;
      renderFeed();
      setFeedReady();
    } catch (error) {
      console.error("ARS following feed failed:", error);

      setFeedError(
        error?.message || "Could not load your following feed."
      );
    } finally {
      isLoadingFeed = false;
    }
  }

  async function loadAccountCounts() {
    const userId = getCurrentUserId();

    if (!userId) {
      return;
    }

    try {
      const [
        postsResult,
        followersResult,
        followingResult
      ] = await Promise.all([
        supabaseClient
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabaseClient
          .from("followers")
          .select("id", { count: "exact", head: true })
          .eq("following_id", userId),
        supabaseClient
          .from("followers")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", userId)
      ]);

      if (postsResult.error) {
        throw postsResult.error;
      }

      if (followersResult.error) {
        throw followersResult.error;
      }

      if (followingResult.error) {
        throw followingResult.error;
      }

      setText(
        elements.accountPostsCount,
        postsResult.count ?? 0
      );

      setText(
        elements.accountFollowersCount,
        followersResult.count ?? 0
      );

      setText(
        elements.accountFollowingCount,
        followingResult.count ?? 0
      );
    } catch (error) {
      console.warn("ARS account counts failed:", error);
    }
  }

  async function loadNotificationsCount() {
    const userId = getCurrentUserId();

    if (!userId) {
      return;
    }

    try {
      const { count, error } = await supabaseClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) {
        throw error;
      }

      const unreadCount = Number(count || 0);

      [
        elements.notificationBadge,
        elements.mobileNotificationBadge
      ].forEach(badge => {
        if (!badge) {
          return;
        }

        badge.textContent = unreadCount > 99
          ? "99+"
          : String(unreadCount);

        setHidden(badge, unreadCount === 0);
      });
    } catch (error) {
      console.warn("ARS notification count failed:", error);
    }
  }

  async function loadSuggestions() {
    const userId = getCurrentUserId();

    if (!userId || !elements.suggestionsList) {
      return;
    }

    setHidden(elements.suggestionsLoading, false);

    try {
      const { data: relationships, error: relationshipError } =
        await supabaseClient
          .from("followers")
          .select("following_id")
          .eq("follower_id", userId);

      if (relationshipError) {
        throw relationshipError;
      }

      const excludedIds = new Set([
        userId,
        ...(relationships || []).map(row => row.following_id)
      ]);

      const { data, error } = await supabaseClient
        .from("users")
        .select("id, username, display_name, avatar, verified, plan")
        .neq("id", userId)
        .limit(20);

      if (error) {
        throw error;
      }

      const suggestions = (data || [])
        .filter(user => !excludedIds.has(user.id))
        .slice(0, 8);

      const fragment = document.createDocumentFragment();

      suggestions.forEach(user => {
        const item = document.createElement("div");
        item.className = "suggestion-item";

        const avatar = document.createElement("div");
        avatar.className = "suggestion-avatar";
        applyAvatar(avatar, user);

        const details = document.createElement("div");
        details.className = "suggestion-details";

        const name = document.createElement("strong");
        name.textContent =
          user.display_name || user.username || "ARS Member";

        const username = document.createElement("span");
        username.textContent = user.username
          ? `@${user.username.replace(/^@/, "")}`
          : "";

        const followButton = document.createElement("button");
        followButton.type = "button";
        followButton.textContent = "Follow";
        followButton.dataset.action = "follow-user";
        followButton.dataset.userId = user.id;

        details.append(name, username);
        item.append(avatar, details, followButton);
        fragment.appendChild(item);
      });

      elements.suggestionsList.replaceChildren(fragment);
    } catch (error) {
      console.warn("ARS suggestions failed:", error);
    } finally {
      setHidden(elements.suggestionsLoading, true);
    }
  }

  async function followUser(targetUserId) {
    const userId = getCurrentUserId();

    if (!userId || !targetUserId || userId === targetUserId) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from("followers")
        .insert({
          follower_id: userId,
          following_id: targetUserId
        });

      if (error) {
        throw error;
      }

      showToast("You are now following this account.", "success");
      await Promise.all([
        loadSuggestions(),
        loadAccountCounts()
      ]);
    } catch (error) {
      console.error("ARS follow action failed:", error);

      showToast(
        error?.code === "23505"
          ? "You are already following this account."
          : error?.message || "Could not follow this account.",
        "error"
      );
    }
}
   let isSpinningWheel = false;

  async function loadWheelAttempts() {
    const userId = getCurrentUserId();

    if (!userId) {
      setText(elements.wheelAttemptsText, "Log in to use the wheel");
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);

      const { count, error } = await supabaseClient
        .from("wheel_spins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("spin_date", today);

      if (error) {
        throw error;
      }

      setText(
        elements.wheelAttemptsText,
        `${count || 0} spins used today`
      );
    } catch (error) {
      console.warn("ARS wheel attempts failed:", error);
      setText(elements.wheelAttemptsText, "Attempts unavailable");
    }
  }

  async function spinWheel() {
    if (isSpinningWheel) {
      return;
    }

    const userId = getCurrentUserId();

    if (!userId) {
      showToast("Please log in to spin the wheel.", "error");
      return;
    }

    isSpinningWheel = true;

    if (elements.spinWheelButton) {
      elements.spinWheelButton.disabled = true;
      elements.spinWheelButton.textContent = "Spinning...";
    }

    setText(elements.wheelDialogStatus, "Finding your challenge...");
    setHidden(elements.wheelDialogResult, true);

    try {
      const { data: challenges, error: challengeError } =
        await supabaseClient
          .from("wheel_challenges")
          .select("id, title, category, reward_xp, image_required")
          .limit(100);

      if (challengeError) {
        throw challengeError;
      }

      if (!Array.isArray(challenges) || challenges.length === 0) {
        throw new Error("No wheel challenges are available yet.");
      }

      const challenge =
        challenges[Math.floor(Math.random() * challenges.length)];

      const today = new Date().toISOString().slice(0, 10);

      const { count, error: countError } = await supabaseClient
        .from("wheel_spins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("spin_date", today);

      if (countError) {
        throw countError;
      }

      const attemptNumber = (count || 0) + 1;

      const { error: insertError } = await supabaseClient
        .from("wheel_spins")
        .insert({
          user_id: userId,
          spin_date: today,
          attempt_number: attemptNumber,
          reward_code: "challenge",
          reward_payload: {
            challenge_id: challenge.id,
            title: challenge.title,
            category: challenge.category,
            reward_xp: challenge.reward_xp,
            image_required: challenge.image_required
          }
        });

      if (insertError) {
        throw insertError;
      }

      if (elements.wheelVisual) {
        elements.wheelVisual.classList.remove("is-spinning");
        void elements.wheelVisual.offsetWidth;
        elements.wheelVisual.classList.add("is-spinning");
      }

      setText(elements.wheelDialogStatus, "Your challenge is ready!");
      setText(elements.wheelDialogResult, challenge.title);
      setHidden(elements.wheelDialogResult, false);
      setText(elements.wheelResultText, challenge.title);
      setHidden(elements.wheelResult, false);

      showToast("Your challenge has been selected!", "success");
      await loadWheelAttempts();
    } catch (error) {
      console.error("ARS wheel spin failed:", error);

      setText(
        elements.wheelDialogStatus,
        error?.message || "Could not spin the wheel."
      );

      showToast(
        error?.message || "Could not spin the wheel.",
        "error"
      );
    } finally {
      isSpinningWheel = false;

      if (elements.spinWheelButton) {
        elements.spinWheelButton.disabled = false;
        elements.spinWheelButton.textContent = "Spin the Wheel";
      }
    }
  }

  async function logout() {
    const confirmed = window.confirm("Are you sure you want to log out?");

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        throw error;
      }

      removeStorage(STORAGE.user);
      removeStorage(STORAGE.loggedIn);
      window.location.replace(LOGIN_PAGE);
    } catch (error) {
      console.error("ARS logout failed:", error);

      showToast(
        error?.message || "Could not log out. Please try again.",
        "error"
      );
    }
  }

  function handlePostListClick(event) {
    const button = event.target.closest("[data-action]");

    if (!button || !elements.postsList?.contains(button)) {
      return;
    }

    const action = button.dataset.action;
    const postId = button.dataset.postId;

    if (action === "delete-post" && postId) {
      deletePost(postId);
    }
  }

  function handleStoryTrackClick(event) {
    const button = event.target.closest("[data-story-group-index]");

    if (!button || !elements.storiesTrack?.contains(button)) {
      return;
    }

    const groupIndex = Number(button.dataset.storyGroupIndex);

    if (Number.isInteger(groupIndex)) {
      openStoryViewer(groupIndex);
    }
  }

  function handleSuggestionClick(event) {
    const button = event.target.closest('[data-action="follow-user"]');

    if (!button || !elements.suggestionsList?.contains(button)) {
      return;
    }

    const targetUserId = button.dataset.userId;

    if (targetUserId) {
      followUser(targetUserId);
    }
  }

  function setupEvents() {
    elements.openPostDialog?.addEventListener(
      "click",
      openPostComposer
    );

    elements.composerOpenButton?.addEventListener(
      "click",
      openPostComposer
    );

    elements.composerPrompt?.addEventListener(
      "click",
      openPostComposer
    );

    elements.mobileCreatePostButton?.addEventListener(
      "click",
      openPostComposer
    );

    elements.emptyFeedCreateButton?.addEventListener(
      "click",
      openPostComposer
    );

    elements.createPostForm?.addEventListener(
      "submit",
      publishPost
    );

    elements.postContent?.addEventListener(
      "input",
      updateCharacterCount
    );

    elements.postAddHashtag?.addEventListener(
      "click",
      addPostHashtag
    );

    elements.choosePostHashtag?.addEventListener(
      "click",
      addPostHashtag
    );

    elements.postAddEmoji?.addEventListener(
      "click",
      addPostEmoji
    );

    elements.choosePostImage?.addEventListener("click", () => {
      if (elements.postMediaInput) {
        elements.postMediaInput.accept = "image/*";
        elements.postMediaInput.click();
      }
    });

    elements.choosePostVideo?.addEventListener("click", () => {
      if (elements.postMediaInput) {
        elements.postMediaInput.accept = "video/*";
        elements.postMediaInput.click();
      }
    });

    elements.composerPhotoButton?.addEventListener("click", () => {
      openPostComposer();

      if (elements.postMediaInput) {
        elements.postMediaInput.accept = "image/*";
        elements.postMediaInput.click();
      }
    });

    elements.composerVideoButton?.addEventListener("click", () => {
      openPostComposer();

      if (elements.postMediaInput) {
        elements.postMediaInput.accept = "video/*";
        elements.postMediaInput.click();
      }
    });

    elements.postMediaInput?.addEventListener("change", event => {
      const file = event.target.files?.[0];

      if (file) {
        showMediaPreview(file, "post");
      }
    });

    elements.removePostMedia?.addEventListener("click", () => {
      clearMediaPreview("post");
    });

    elements.postsList?.addEventListener(
      "click",
      handlePostListClick
    );

    elements.feedRefreshButton?.addEventListener("click", () => {
      loadPosts({ reset: true });
    });

    elements.retryFeedButton?.addEventListener("click", () => {
      loadPosts({ reset: true });
    });

    elements.loadMorePosts?.addEventListener("click", () => {
      loadPosts({ reset: false });
    });

    elements.storiesTrack?.addEventListener(
      "click",
      handleStoryTrackClick
    );

    elements.openStoryDialog?.addEventListener(
      "click",
      openStoryComposer
    );

    elements.chooseStoryMedia?.addEventListener("click", () => {
      elements.storyMediaInput?.click();
    });

    elements.storyUploadArea?.addEventListener("click", event => {
      if (event.target.closest("button")) {
        return;
      }

      elements.storyMediaInput?.click();
    });

    elements.storyMediaInput?.addEventListener("change", event => {
      const file = event.target.files?.[0];

      if (file) {
        showMediaPreview(file, "story");
      }
    });

    elements.removeStoryMedia?.addEventListener("click", () => {
      clearMediaPreview("story");
    });

    elements.createStoryForm?.addEventListener(
      "submit",
      publishStory
    );

    elements.storyDialog?.addEventListener("close", resetStoryForm);

    elements.closeStoryViewer?.addEventListener(
      "click",
      closeStoryViewer
    );

    elements.storyPreviousButton?.addEventListener(
      "click",
      showPreviousStory
    );

    elements.storyNextButton?.addEventListener(
      "click",
      showNextStory
    );

    elements.storyViewerDialog?.addEventListener("click", event => {
      if (event.target === elements.storyViewerDialog) {
        closeStoryViewer();
      }
    });

    elements.viewAllStories?.addEventListener("click", () => {
      if (storyGroups.length > 0) {
        openStoryViewer(0);
      }
    });

    elements.refreshSuggestionsButton?.addEventListener(
      "click",
      loadSuggestions
    );

    elements.suggestionsList?.addEventListener(
      "click",
      handleSuggestionClick
    );

    elements.openWheelButton?.addEventListener("click", () => {
      openDialog(elements.wheelDialog);
      loadWheelAttempts();
    });

    elements.spinWheelButton?.addEventListener(
      "click",
      spinWheel
    );

    elements.mobileSearchButton?.addEventListener("click", () => {
      window.location.href = "search.html";
    });

    elements.mobileNotificationsButton?.addEventListener(
      "click",
      () => {
        window.location.href = "notifications.html";
      }
    );

    elements.sidebarProfileLink?.addEventListener("click", event => {
      event.preventDefault();
      window.location.href = "profile.html";
    });

    $$("[data-feed-tab]").forEach(tab => {
      tab.addEventListener("click", () => {
        selectFeedTab(tab.dataset.feedTab);
      });
    });

    $$("[data-action='logout']").forEach(button => {
      button.addEventListener("click", logout);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        stopStoryViewerTimer();
      }
    });
  }

  async function init() {
    if (elements.currentYear) {
      elements.currentYear.textContent = String(
        new Date().getFullYear()
      );
    }

    setupEvents();
    renderAccount();

    const authenticated = await requireSession();

    if (!authenticated) {
      return;
    }

    renderAccount();
    updateCharacterCount();

    await Promise.all([
      refreshAccountFromSupabase(),
      loadPosts({ reset: true }),
      loadStories(),
      loadAccountCounts(),
      loadNotificationsCount(),
      loadSuggestions(),
      loadWheelAttempts()
    ]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();
