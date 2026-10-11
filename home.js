
(() => {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const state = {
    db: null,
    user: null,
    posts: [],
    feed: "latest",
    request: 0
  };

  const el = {
    searchForm: $("#searchForm"),
    searchInput: $("#searchInput"),
    profileButton: $("#profileButton"),
    profileMenu: $("#profileMenu"),
    logoutButton: $("#logoutButton"),
    postContent: $("#postContent"),
    characterCount: $("#characterCount"),
    publish: $("#publishPostButton"),
    composerMessage: $("#composerMessage"),
    refresh: $("#refreshFeedButton"),
    feedCount: $("#feedCount"),
    feedStatus: $("#feedStatus"),
    posts: $("#postsList"),
    empty: $("#feedEmpty"),
    error: $("#feedError"),
    errorMessage: $("#feedErrorMessage"),
    retry: $("#retryFeedButton"),
    toast: $("#toastContainer")
  };

  function readUser() {
    try {
      return JSON.parse(localStorage.getItem("ars_user") || "{}") || {};
    } catch {
      return {};
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function initials(value) {
    return [...String(value || "ARS")][0]?.toUpperCase() || "A";
  }

  function setText(node, value) {
    if (node) node.textContent = String(value ?? "");
  }

  function setMessage(text, type = "") {
    if (!el.composerMessage) return;
    el.composerMessage.textContent = text;
    el.composerMessage.className = "form-message";
    if (type) el.composerMessage.classList.add(type);
  }

  function showToast(text) {
    if (!el.toast) return;
    const item = document.createElement("div");
    item.className = "toast";
    item.setAttribute("role", "status");
    item.textContent = text;
    el.toast.append(item);
    setTimeout(() => item.remove(), 3500);
  }

  function normalizeUser(raw = {}) {
    const local = readUser();
    return {
      id: raw.id || local.id || "",
      username: raw.username || local.username || "member",
      display_name:
        raw.display_name || raw.displayName ||
        local.display_name || local.displayName || "ARS Member",
      avatar: raw.avatar || local.avatar || "",
      verified: Boolean(raw.verified),
      streak: Number(raw.streak || 0),
      xp: Number(raw.xp || 0),
      letter: raw.letter || local.letter || ""
    };
  }

  function paintAvatar(node, user) {
    if (!node) return;
    node.replaceChildren();

    if (user.avatar && /^https?:\/\//i.test(user.avatar)) {
      const img = document.createElement("img");
      img.src = user.avatar;
      img.alt = "";
      img.loading = "lazy";
      img.onerror = () => {
        node.textContent = initials(user.display_name);
      };
      node.append(img);
    } else {
      node.textContent = user.letter || initials(user.display_name);
    }
  }

  function renderAccount() {
    const user = state.user || normalizeUser();

    [
      $("#headerAvatar"),
      $("#composerAvatar"),
      $("#accountAvatar")
    ].forEach(node => paintAvatar(node, user));

    setText($("#accountDisplayName"), user.display_name);
    setText($("#accountUsername"), "@" + user.username.replace(/^@/, ""));
    setText($("#accountStreak"), user.streak);
    setText($("#accountXp"), user.xp);
    setText($("#currentYear"), new Date().getFullYear());
  }

  function formatDate(value) {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "Recently";

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  async function attachAuthors(posts) {
    if (!state.db || !posts.length) return posts;

    const ids = [...new Set(posts.map(post => post.user_id).filter(Boolean))];
    if (!ids.length) return posts;

    const { data, error } = await state.db
      .from("users")
      .select("id, username, display_name, avatar, verified")
      .in("id", ids);

    if (error) {
      console.warn("ARS: Could not load post authors.", error.message);
      return posts;
    }

    const users = new Map(
      (data || []).map(user => [String(user.id), user])
    );

    return posts.map(post => ({
      ...post,
      author: users.get(String(post.user_id)) || {}
    }));
  }

  function createPostElement(post) {
    const author = post.author || {};
    const name = author.display_name || author.username || "ARS Member";
    const avatar = author.avatar || "";
    const node = document.createElement("article");

    node.className = "post-card";
    node.dataset.postId = String(post.id || "");

    const avatarHTML =
      avatar && /^https?:\/\//i.test(avatar)
        ? '<img src="' + escapeHTML(avatar) + '" alt="" loading="lazy">'
        : escapeHTML(initials(name));

    node.innerHTML =
      '<div class="post-top">' +
        '<span class="avatar">' + avatarHTML + '</span>' +
        '<div class="post-author">' +
          '<strong>' + escapeHTML(name) +
            (author.verified
              ? ' <span class="verified-badge" aria-label="Verified">✓</span>'
              : '') +
          '</strong>' +
          '<span>@' + escapeHTML(author.username || "member") +
            ' · <time>' + escapeHTML(formatDate(post.created_at)) + '</time>' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div class="post-content">' +
        escapeHTML(post.content || "").replace(/\n/g, "<br>") +
      '</div>' +
      '<div class="post-actions">' +
        '<button class="post-action" type="button" data-action="share">Share</button>' +
      '</div>';

    const image = node.querySelector(".avatar img");
    if (image) {
      image.onerror = () => {
        image.parentElement.textContent = initials(name);
      };
    }

    return node;
  }

  function sortedPosts() {
    const posts = [...state.posts];

    if (state.feed === "popular") {
      posts.sort((a, b) =>
        Number(b.likes_count || b.likes || 0) -
          Number(a.likes_count || a.likes || 0) ||
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
    } else {
      posts.sort((a, b) =>
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
    }

    return posts;
  }

  function setFeedStatus(text, visible = true) {
    if (!el.feedStatus) return;
    el.feedStatus.textContent = text;
    el.feedStatus.hidden = !visible;
  }

  function renderPosts(posts = sortedPosts()) {
    if (!el.posts) return;

    el.posts.replaceChildren();
    setText(el.feedCount, posts.length || "");
    setFeedStatus("", false);

    if (el.error) el.error.hidden = true;
    if (el.empty) el.empty.hidden = posts.length > 0;

    if (!posts.length) return;

    const fragment = document.createDocumentFragment();
    posts.forEach(post => fragment.append(createPostElement(post)));
    el.posts.append(fragment);
  }

  async function loadPosts() {
    if (!state.db) {
      setFeedStatus("", false);
      if (el.error) el.error.hidden = false;
      setText(
        el.errorMessage,
        "Supabase could not initialize. Check the connection and configuration."
      );
      return;
    }

    const request = ++state.request;
    setFeedStatus("Loading posts...");
    if (el.empty) el.empty.hidden = true;
    if (el.error) el.error.hidden = true;
    if (el.refresh) el.refresh.disabled = true;

    try {
      const { data, error } = await state.db
        .from("posts")
        .select("id, user_id, content, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (request !== state.request) return;
      if (error) throw error;

      state.posts = await attachAuthors(data || []);

      if (request === state.request) renderPosts();
    } catch (error) {
      console.error("ARS feed error:", error);

      if (request === state.request) {
        setFeedStatus("", false);
        if (el.error) el.error.hidden = false;
        setText(
          el.errorMessage,
          error.message || "Could not load posts. Please try again."
        );
      }
    } finally {
      if (request === state.request && el.refresh) {
        el.refresh.disabled = false;
      }
    }
  }

  async function publishPost() {
    const content = el.postContent?.value.trim() || "";

    if (!content) {
      setMessage("Write something before publishing.", "error");
      el.postContent?.focus();
      return;
    }

    if (content.length > 5000) {
      setMessage("Your post must be 5,000 characters or fewer.", "error");
      return;
    }

    if (!state.db) {
      setMessage("Publishing service is unavailable. Refresh the page.", "error");
      return;
    }

    let userId = state.user?.id;

    try {
      const auth = await state.db.auth.getUser();
      if (!auth.error && auth.data?.user?.id) {
        userId = auth.data.user.id;
      }
    } catch (error) {
      console.warn("ARS: Could not verify session.", error);
    }

    if (!userId) {
      setMessage("Your session could not be verified. Please log in again.", "error");
      return;
    }

    if (el.publish) {
      el.publish.disabled = true;
      el.publish.textContent = "Publishing...";
    }

    setMessage("Publishing your post...", "success");

    try {
      const { data, error } = await state.db
        .from("posts")
        .insert({ user_id: userId, content })
        .select("id, user_id, content, created_at")
        .single();

      if (error) throw error;

      const [post] = await attachAuthors([data]);
      state.posts.unshift(post);
      el.postContent.value = "";
      updateCharacterCount();
      renderPosts();
      setMessage("Your post has been published.", "success");
      showToast("Post published successfully.");
    } catch (error) {
      console.error("ARS publish error:", error);
      setMessage(
        error.message || "Could not publish your post. Please try again.",
        "error"
      );
    } finally {
      if (el.publish) {
        el.publish.disabled = false;
        el.publish.textContent = "Publish Post";
      }
    }
  }

  function updateCharacterCount() {
    if (!el.postContent || !el.characterCount) return;

    const length = el.postContent.value.length;
    el.characterCount.textContent = length + " / 5000";
    el.characterCount.classList.toggle("limit-reached", length >= 5000);
  }

  function focusComposer() {
    $("#composerCard")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    setTimeout(() => el.postContent?.focus({ preventScroll: true }), 150);
  }

  function searchPosts(query) {
    const term = query.trim().toLowerCase();

    if (!term) {
      renderPosts();
      return;
    }

    const results = sortedPosts().filter(post => {
      const author = post.author || {};

      return String(post.content || "").toLowerCase().includes(term) ||
        String(author.username || "").toLowerCase().includes(term) ||
        String(author.display_name || "").toLowerCase().includes(term);
    });

    if (el.empty) {
      el.empty.hidden = results.length > 0;
      setText(el.empty.querySelector("h3"), "No matching posts");
      setText(el.empty.querySelector("p"), "Try a different search term.");
    }

    renderPosts(results);
  }

  function wireEvents() {
    el.postContent?.addEventListener("input", updateCharacterCount);
    el.publish?.addEventListener("click", publishPost);
    el.refresh?.addEventListener("click", loadPosts);
    el.retry?.addEventListener("click", loadPosts);

    [
      "#openComposerButton",
      "#communityPostButton",
      "#mobileCreateButton"
    ].forEach(selector => {
      $(selector)?.addEventListener("click", focusComposer);
    });

    $$(".feed-tab").forEach(button => {
      button.addEventListener("click", () => {
        state.feed = button.dataset.feed || "latest";

        $$(".feed-tab").forEach(tab => {
          const active = tab === button;
          tab.classList.toggle("active", active);
          tab.setAttribute("aria-pressed", String(active));
        });

        renderPosts();
      });
    });

    el.profileButton?.addEventListener("click", event => {
      event.stopPropagation();
      if (!el.profileMenu) return;

      el.profileMenu.hidden = !el.profileMenu.hidden;
      el.profileButton.setAttribute(
        "aria-expanded",
        String(!el.profileMenu.hidden)
      );
    });

    document.addEventListener("click", event => {
      if (
        el.profileMenu &&
        !el.profileMenu.contains(event.target) &&
        !el.profileButton?.contains(event.target)
      ) {
        el.profileMenu.hidden = true;
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && el.profileMenu) {
        el.profileMenu.hidden = true;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        el.searchInput?.focus();
      }
    });

    el.logoutButton?.addEventListener("click", async () => {
      try {
        if (state.db) await state.db.auth.signOut();
        localStorage.setItem("ars_logged_in", "false");
      } catch (error) {
        console.warn("ARS sign out warning:", error);
      }

      window.location.href = "index.html";
    });

    el.searchForm?.addEventListener("submit", event => {
      event.preventDefault();
      searchPosts(el.searchInput?.value || "");
      $("#mainContent")?.scrollIntoView({ behavior: "smooth" });
    });

    el.searchInput?.addEventListener("input", () => {
      if (!el.searchInput.value.trim()) renderPosts();
    });

    el.posts?.addEventListener("click", async event => {
      const button = event.target.closest('[data-action="share"]');
      if (!button) return;

      const post = button.closest("[data-post-id]");
      const url = new URL(window.location.href);
      url.hash = "post-" + (post?.dataset.postId || "");

      try {
        if (navigator.share) {
          await navigator.share({ title: "ARS post", url: url.href });
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url.href);
          showToast("Post link copied.");
        } else {
          window.prompt("Copy this post link:", url.href);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          showToast("Could not share this post.");
        }
      }
    });

    $("#notificationsButton")?.addEventListener("click", () => {
      showToast("Notifications are not connected yet.");
    });

    [
      "#navNotificationsLink",
      "#mobileNotificationsLink",
      "#exploreLink",
      "#mobileExploreLink",
      "#messagesLink",
      "#bookmarksLink",
      "#sidebarProfileLink",
      "#viewProfileLink",
      "#accountProfileLink",
      "#mobileProfileLink",
      "#settingsLink"
    ].forEach(selector => {
      $(selector)?.addEventListener("click", event => {
        const node = $(selector);

        if (node?.getAttribute("href")?.startsWith("#")) {
          event.preventDefault();
        }

        const messages = {
          "#exploreLink": "Explore is not connected yet.",
          "#mobileExploreLink": "Explore is not connected yet.",
          "#messagesLink": "Messages are not connected yet.",
          "#bookmarksLink": "Bookmarks are not connected yet.",
          "#settingsLink": "Settings are not connected yet."
        };

        showToast(messages[selector] || "This section is not connected yet.");
      });
    });
  }

  async function initialize() {
    if (window.supabase?.createClient) {
      state.db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
    }

    state.user = normalizeUser(readUser());
    renderAccount();
    updateCharacterCount();
    wireEvents();

    if (state.db) {
      try {
        const { data } = await state.db.auth.getUser();

        if (data?.user) {
          const authUser = data.user;
          const metadata = authUser.user_metadata || {};

          const result = await state.db
            .from("users")
            .select("id, username, display_name, avatar, verified, plan, streak, xp")
            .eq("id", authUser.id)
            .maybeSingle();

          state.user = normalizeUser(
            result.data || {
              id: authUser.id,
              username: metadata.username,
              display_name: metadata.display_name,
              ...readUser()
            }
          );

          renderAccount();
        }
      } catch (error) {
        console.warn("ARS: Could not refresh account details.", error);
      }
    }

    await loadPosts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
