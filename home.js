(() => {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = {
    user: null,
    sessionUser: null,
    posts: [],
    stories: [],
    followingIds: [],
    mediaFile: null,
    mediaUrl: "",
    storyFile: null,
    storyUrl: "",
    storyDraftMediaPath: "",
    storyRotation: 0,
    storyZoom: 1,
    storyCropX: 50,
    storyCropY: 50,
    storyTextSize: 24,
    storyTextPosition: { x: 50, y: 50 },
    storySticker: "",
    storyDrawing: [],
    storyUndoStack: [],
    storyDrawingEnabled: false,
    storyDrawingColor: "#ffffff",
    storyActiveStroke: null,
    storyEditorSnapshot: null,
    storyTextDragging: false,
    previewFromEditor: false,
    storyEditorPreviewUrl: "",
    storyDraftTimer: null,
    likes: new Set(),
    comments: new Map(),
    conversations: [],
    conversationProfiles: {},
    activeConversationId: null
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function toast(message) {
    const region = $("#toastRegion");
    if (!region) return;
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), 3500);
  }

  function setMessage(selector, message, type = "") {
    const element = $(selector);
    if (!element) return;
    element.textContent = message;
    element.className = "form-message" + (type ? " " + type : "");
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function avatarMarkup(user, extraClass = "") {
    const name = user?.display_name || user?.displayName || user?.username || "A";
    const avatar = user?.avatar || "";
    if (avatar) {
      return '<img class="avatar ' + extraClass + '" src="' + escapeHTML(avatar) + '" alt="' + escapeHTML(name) + '">';
    }
    return '<span class="avatar ' + extraClass + '">' + escapeHTML(name.trim().charAt(0).toUpperCase() || "A") + "</span>";
  }

  function currentUserId() {
    return state.sessionUser?.id || state.user?.id || null;
  }

  function storyDraftStorageKey() {
    return "ars_story_draft:" + (currentUserId() || "guest");
  }

  async function getSessionAndProfile() {
    if (!supabase) {
      toast("The ARS data service could not be loaded.");
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) console.warn("Could not read Supabase session:", sessionError);
    state.sessionUser = sessionData?.session?.user || null;

    try {
      const localUser = JSON.parse(localStorage.getItem("ars_user") || "{}");
      state.user = localUser && typeof localUser === "object" ? localUser : {};
    } catch {
      state.user = {};
    }

    if (!state.sessionUser && !state.user?.id) {
      toast("Please sign in to use your ARS account.");
      return;
    }

    const id = currentUserId();
    if (id) {
      const { data: profile, error } = await supabase
        .from("users")
        .select("id, username, display_name, email, bio, avatar, cover, verified, plan, streak, xp, vip_badge_enabled")
        .eq("id", id)
        .maybeSingle();

      if (!error && profile) {
        state.user = { ...state.user, ...profile, displayName: profile.display_name || state.user.displayName };
        try {
          localStorage.setItem("ars_user", JSON.stringify(state.user));
        } catch (storageError) {
          console.warn("Could not update local profile cache:", storageError);
        }
      } else if (error) {
        console.warn("Profile load warning:", error.message);
      }
    }

    updateProfileChrome();
  }

  function updateProfileChrome() {
    const user = state.user || {};
    const displayName = user.display_name || user.displayName || user.username || "Your profile";
    const username = user.username ? "@" + user.username : "@you";
    $("#displayName").textContent = displayName;
    $("#username").textContent = username;

    const targets = ["#headerAvatar", "#railAvatar", "#composerAvatar", "#ownStoryAvatar"];
    targets.forEach(selector => {
      const element = $(selector);
      if (!element) return;
      if (user.avatar) {
        element.style.backgroundImage = 'url("' + String(user.avatar).replace(/"/g, "%22") + '")';
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";
        element.textContent = "";
      } else {
        element.style.backgroundImage = "";
        element.textContent = (user.display_name || user.displayName || user.username || "A").trim().charAt(0).toUpperCase();
      }
    });

    $("#vipBadge").classList.toggle("hidden", !(user.vip_badge_enabled || user.plan === "vip" || user.plan === "premium"));
  }

  function relativeTime(dateValue) {
    const date = new Date(dateValue || Date.now());
    if (Number.isNaN(date.getTime())) return "Recently";
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    if (seconds < 604800) return Math.floor(seconds / 86400) + "d ago";
    return date.toLocaleDateString();
  }

  function safeMediaType(post) {
    if (post.media_type) return post.media_type;
    const value = String(post.image || "").toLowerCase();
    if (/\.(mp4|webm|mov)(\?|$)/.test(value)) return "video";
    if (/\.(mp3|wav|ogg|m4a)(\?|$)/.test(value)) return "audio";
    return post.image ? "image" : "text";
  }

  function mediaMarkup(post) {
    const media = post.image || "";
    if (!media) return "";
    const type = safeMediaType(post);
    if (type === "video") return '<video class="post-media" controls preload="metadata" src="' + escapeHTML(media) + '"></video>';
    if (type === "audio") return '<audio class="post-audio" controls preload="metadata" src="' + escapeHTML(media) + '"></audio>';
    return '<img class="post-media" loading="lazy" src="' + escapeHTML(media) + '" alt="Post media">';
  }

  async function loadFeed(sortMode = "latest") {
    const feed = $("#feed");
    const empty = $("#feedEmpty");
    feed.innerHTML = '<div class="panel loading-card">Loading your feed…</div>';
    empty.classList.add("hidden");

    if (!supabase) {
      feed.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }

    if (!currentUserId()) {
      feed.innerHTML = "";
      empty.classList.remove("hidden");
      $("#feedEmpty p").textContent = "Sign in to see your community feed.";
      return;
    }

    const { data: followRows, error: followError } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", currentUserId());

    if (followError) {
      console.warn("Following list could not be loaded:", followError.message);
    }

    state.followingIds = [...new Set((followRows || []).map(row => row.following_id).filter(Boolean))];
    const visibleAuthorIds = [...new Set([currentUserId(), ...state.followingIds])];

    const { data, error } = await supabase
      .from("posts")
      .select("id, created_at, user_id, content, image, likes_count, comments_count, reposts_count, views_count, media_type, privacy, location, mentions, hashtags, allow_comments")
      .in("user_id", visibleAuthorIds)
      .order(sortMode === "trending" ? "likes_count" : "created_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      console.error("Feed load failed:", error);
      feed.innerHTML = "";
      empty.classList.remove("hidden");
      $("#feedEmpty p").textContent = "We couldn't load posts right now. Check your connection or database access, then refresh.";
      return;
    }

    const rows = (data || []).filter(post => {
      if (post.privacy === "private") return post.user_id === currentUserId();
      return true;
    });
    state.posts = rows;

    const ids = [...new Set(rows.map(post => post.user_id).filter(Boolean))];
    let profiles = {};
    if (ids.length) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, username, display_name, avatar, verified, plan")
        .in("id", ids);
      if (!usersError) {
        profiles = Object.fromEntries((users || []).map(user => [user.id, user]));
      }
    }

    if (!rows.length) {
      feed.innerHTML = "";
      empty.classList.remove("hidden");
      $("#feedEmpty p").textContent = "No new posts from your community yet. Explore these public posts and accounts to get started.";
      loadSuggestedPosts(sortMode).catch(error => {
        console.warn("Suggested posts could not be loaded:", error);
        $("#suggestedPostsEmpty").innerHTML = '<p class="muted">Suggested posts are unavailable right now.</p>';
      });
      return;
    }

    const displayRows = await Promise.all(rows.map(async post => ({
      ...post,
      image: await resolvePostMedia(post.image)
    })));

    displayRows.sort((first, second) => {
      const firstPlan = String(profiles[first.user_id]?.plan || "").toLowerCase();
      const secondPlan = String(profiles[second.user_id]?.plan || "").toLowerCase();
      const firstSubscriber = ["vip", "premium", "subscriber"].includes(firstPlan) ? 1 : 0;
      const secondSubscriber = ["vip", "premium", "subscriber"].includes(secondPlan) ? 1 : 0;

      if (firstSubscriber !== secondSubscriber) {
        return secondSubscriber - firstSubscriber;
      }

      if (sortMode === "trending") {
        const engagementDifference = Number(second.likes_count || 0) - Number(first.likes_count || 0);
        if (engagementDifference !== 0) return engagementDifference;
      }

      return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
    });

    feed.innerHTML = displayRows.map(post => renderPost(post, profiles[post.user_id] || {})).join("");
    loadComments(rows.map(post => post.id)).catch(error => console.warn("Comments load warning:", error));
    loadLikeStates(rows.map(post => post.id)).catch(error => console.warn("Like state warning:", error));
    renderTrending(rows);
  }

  function renderPost(post, profile) {
    const author = profile.display_name || profile.username || "ARS member";
    const username = profile.username ? "@" + profile.username : "ARS member";
    const avatar = profile.avatar
      ? '<img class="avatar" src="' + escapeHTML(profile.avatar) + '" alt="' + escapeHTML(author) + '">'
      : '<span class="avatar">' + escapeHTML(author.trim().charAt(0).toUpperCase()) + "</span>";
    const body = post.content ? '<div class="post-body">' + escapeHTML(post.content) + "</div>" : "";
    const location = post.location ? '<div class="post-location">⌖ ' + escapeHTML(post.location) + "</div>" : "";
    const tags = Array.isArray(post.hashtags) ? post.hashtags : [];
    const tagMarkup = tags.length ? '<div class="post-tags">' + tags.map(tag => escapeHTML(String(tag).startsWith("#") ? tag : "#" + tag)).join(" ") + "</div>" : "";
    const commentsEnabled = post.allow_comments !== false;
    return '<article class="panel post-card" data-post-id="' + escapeHTML(post.id) + '">' +
      '<div class="post-head">' + avatar +
      '<div class="post-author"><strong>' + escapeHTML(author) + (profile.verified ? " ✓" : "") + '</strong><span>' + escapeHTML(username) + " · " + escapeHTML(relativeTime(post.created_at)) + "</span></div>" +
      '<button class="post-menu" type="button" data-post-menu="' + escapeHTML(post.id) + '" aria-label="Post options">···</button></div>' +
      body + location + mediaMarkup(post) + tagMarkup +
      '<div class="post-stats"><span><b data-likes-count="' + escapeHTML(post.id) + '">' + Number(post.likes_count || 0) + '</b> likes</span><span>' + Number(post.comments_count || 0) + ' comments · ' + Number(post.views_count || 0) + ' views</span></div>' +
      '<div class="post-actions"><button class="post-action" type="button" data-like="' + escapeHTML(post.id) + '">♡ Like</button>' + (commentsEnabled ? '<button class="post-action" type="button" data-comment-focus="' + escapeHTML(post.id) + '">▤ Comment</button>' : "") + '<button class="post-action" type="button" data-share="' + escapeHTML(post.id) + '">↗ Share</button><button class="post-action" type="button" data-save="' + escapeHTML(post.id) + '">♧ Save</button></div>' +
      (commentsEnabled ? '<div class="post-comments"><div class="comment-list" id="comments-' + escapeHTML(post.id) + '"></div><form class="comment-form" data-comment-form="' + escapeHTML(post.id) + '"><input name="comment" maxlength="1000" placeholder="Write a comment…" aria-label="Write a comment"><button type="submit">Send</button></form></div>' : "") +
      "</article>";
  }

  async function loadLikeStates(postIds) {
    const userId = currentUserId();
    if (!userId || !postIds.length) return;
    const { data, error } = await supabase.from("likes").select("post_id").eq("user_id", userId).in("post_id", postIds);
    if (error) return;
    state.likes = new Set((data || []).map(row => String(row.post_id)));
    $$("[data-like]").forEach(button => {
      const liked = state.likes.has(button.dataset.like);
      button.classList.toggle("liked", liked);
      button.textContent = liked ? "♥ Liked" : "♡ Like";
    });
  }

  async function loadComments(postIds) {
    if (!postIds.length) return;
    const { data, error } = await supabase.from("comments").select("id, post_id, user_id, content, created_at").in("post_id", postIds).order("created_at", { ascending: true }).limit(120);
    if (error) {
      console.warn("Could not load comments:", error.message);
      return;
    }
    const userIds = [...new Set((data || []).map(row => row.user_id).filter(Boolean))];
    let usersById = {};
    if (userIds.length) {
      const { data: users } = await supabase.from("users").select("id, username, display_name").in("id", userIds);
      usersById = Object.fromEntries((users || []).map(user => [user.id, user]));
    }
    (data || []).forEach(comment => {
      const target = $("#comments-" + CSS.escape(String(comment.post_id)));
      if (!target) return;
      const author = usersById[comment.user_id]?.username || usersById[comment.user_id]?.display_name || "Member";
      const node = document.createElement("div");
      node.className = "comment-item";
      const strong = document.createElement("strong");
      strong.textContent = author;
      const text = document.createElement("span");
      text.textContent = comment.content || "";
      node.append(strong, text);
      target.append(node);
    });
  }

  function renderTrending(posts) {
    const list = $("#trendingList");
    const counts = new Map();
    posts.forEach(post => {
      (String(post.content || "").match(/#[\p{L}\p{N}_]+/gu) || []).forEach(tag => {
        const key = tag.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    list.innerHTML = top.length ? top.map((item, index) =>
      '<div class="trend-item"><span class="trend-number">0' + (index + 1) + '</span><div><strong>' + escapeHTML(item[0]) + '</strong><span>' + item[1] + (item[1] === 1 ? " post" : " posts") + "</span></div></div>"
    ).join("") : '<p class="muted">Hashtags from posts will appear here.</p>';
  }

  async function loadSuggestions() {
    if (!supabase || !currentUserId()) return;

    const { data: followingRows } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", currentUserId());
    const followedIds = new Set((followingRows || []).map(row => row.following_id));
    const { data, error } = await supabase.from("users")
      .select("id, username, display_name, avatar, verified")
      .neq("id", currentUserId())
      .limit(30);

    const targets = [$("#suggestedUsers"), $("#suggestedUsersEmpty")].filter(Boolean);
    const renderTargets = markup => targets.forEach(target => {
      target.innerHTML = markup;
    });

    if (error) {
      renderTargets('<p class="muted">Suggestions are unavailable right now.</p>');
      return;
    }

    const users = (data || []).filter(user => !followedIds.has(user.id)).slice(0, 5);
    if (!users.length) {
      renderTargets('<p class="muted">No suggested accounts yet.</p>');
      return;
    }

    renderTargets(users.map(user => {
      const title = user.display_name || user.username || "ARS member";
      const avatar = user.avatar
        ? '<img class="avatar" src="' + escapeHTML(user.avatar) + '" alt="">'
        : '<span class="avatar">' + escapeHTML(title.charAt(0).toUpperCase()) + "</span>";
      return '<div class="suggested-user">' + avatar + '<div class="suggested-info"><strong>' + escapeHTML(title) + '</strong><span>' + escapeHTML(user.username ? "@" + user.username : "ARS member") + '</span></div><button class="follow-button" data-follow="' + escapeHTML(user.id) + '" type="button">Follow</button></div>';
    }).join(""));
  }

  async function loadSuggestedPosts(sortMode = "latest") {
    if (!supabase || !currentUserId()) return;

    const list = $("#suggestedPostsEmpty");
    if (!list) return;
    list.innerHTML = '<p class="muted">Finding public posts…</p>';

    const excludedAuthors = [...new Set([currentUserId(), ...state.followingIds])];
    const { data, error } = await supabase.from("posts")
      .select("id, created_at, user_id, content, image, likes_count, comments_count, reposts_count, views_count, media_type, privacy, location, mentions, hashtags, allow_comments")
      .eq("privacy", "public")
      .order(sortMode === "trending" ? "likes_count" : "created_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    const suggestions = (data || [])
      .filter(post => !excludedAuthors.includes(post.user_id))
      .slice(0, 3);

    if (!suggestions.length) {
      list.innerHTML = '<p class="muted">No public suggested posts are available yet.</p>';
      return;
    }

    const ids = [...new Set(suggestions.map(post => post.user_id).filter(Boolean))];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, display_name, avatar, verified, plan")
      .in("id", ids);
    if (usersError) {
      console.warn("Suggested post authors could not be loaded:", usersError.message);
    }

    const profiles = Object.fromEntries((users || []).map(user => [user.id, user]));
    const displayRows = await Promise.all(suggestions.map(async post => ({
      ...post,
      image: await resolvePostMedia(post.image)
    })));

    state.posts = displayRows;
    list.innerHTML = displayRows.map(post => renderPost(post, profiles[post.user_id] || {})).join("");
    await Promise.allSettled([
      loadComments(displayRows.map(post => post.id)),
      loadLikeStates(displayRows.map(post => post.id))
    ]);
  }

  async function loadStories() {
    const row = $("#storiesRow");
    $("#storiesLoading")?.remove();
    if (!supabase) return;
    const userId = currentUserId();
    if (!userId) {
      state.stories = [];
      row.querySelectorAll(".story-item:not(.add-story)").forEach(item => item.remove());
      return;
    }

    const { data: followingRows, error: followingError } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", userId);
    if (followingError) {
      console.warn("Story follower list could not be loaded:", followingError.message);
    }

    const followingIds = [...new Set((followingRows || []).map(item => item.following_id).filter(Boolean))];
    const { data: userRows, error: userRowsError } = await supabase
      .from("users")
      .select("id")
      .neq("id", userId)
      .limit(30);
    if (userRowsError) {
      console.warn("Suggested story accounts could not be loaded:", userRowsError.message);
    }

    const followingSet = new Set(followingIds);
    const suggestedIds = (userRows || [])
      .map(user => user.id)
      .filter(id => id && id !== userId && !followingSet.has(id))
      .slice(0, 5);
    const storyAuthorIds = [...new Set([userId, ...followingIds, ...suggestedIds])];
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("stories")
      .select("id, created_at, user_id, image, viewers_count, expires_at, media_type, story_text, text_color, filter, edit_metadata, location, mentions, hashtags, original_image, rotation_degrees, zoom, privacy")
      .in("user_id", storyAuthorIds)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.warn("Stories load warning:", error.message);
      row.insertAdjacentHTML("beforeend", '<p class="muted loading-inline">Stories are unavailable right now.</p>');
      return;
    }
    const stories = (data || []).filter(story => story.privacy !== "private" || story.user_id === currentUserId());
    state.stories = stories;
    const userIds = [...new Set(stories.map(story => story.user_id).filter(Boolean))];
    let usersById = {};
    if (userIds.length) {
      const { data: users } = await supabase.from("users").select("id, username, display_name, avatar").in("id", userIds);
      usersById = Object.fromEntries((users || []).map(user => [user.id, user]));
    }
    row.querySelectorAll(".story-item:not(.add-story)").forEach(item => item.remove());
    stories.forEach(story => {
      const user = usersById[story.user_id] || {};
      const name = user.display_name || user.username || "ARS member";
      const avatar = user.avatar
        ? '<img class="avatar" src="' + escapeHTML(user.avatar) + '" alt="">'
        : '<span class="avatar">' + escapeHTML(name.charAt(0).toUpperCase()) + "</span>";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "story-item unseen";
      button.dataset.storyId = story.id;
      button.innerHTML = '<span class="story-ring">' + avatar + '</span><span>' + escapeHTML(name) + "</span>";
      row.append(button);
    });
  }

  async function uploadMedia(file, bucket) {
    const userId = currentUserId();
    if (!userId) throw new Error("Sign in before uploading media.");
    const extension = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = userId + "/" + Date.now() + "-" + crypto.randomUUID() + "." + extension;
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
    if (error) throw error;
    if (bucket === "private-post-media" || bucket === "story-media") {
      return data.path;
    }
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicData.publicUrl;
  }

  async function resolvePostMedia(image) {
    if (!image) return "";
    if (/^https?:\/\//i.test(image)) return image;
    const { data, error } = await supabase.storage.from("private-post-media").createSignedUrl(image, 3600);
    if (error) {
      console.warn("Post media URL unavailable:", error.message);
      return "";
    }
    return data?.signedUrl || "";
  }

  function fileMediaType(file) {
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type.startsWith("image/")) return "image";
    return "text";
  }

  function resetPostMedia() {
    if (state.mediaUrl) URL.revokeObjectURL(state.mediaUrl);
    state.mediaFile = null;
    state.mediaUrl = "";
    $("#postMedia").value = "";
    $("#postMediaPreview").classList.add("hidden");
    ["#postImagePreview", "#postVideoPreview", "#postAudioPreview"].forEach(selector => {
      const element = $(selector);
      element.classList.add("hidden");
      if (element.tagName !== "IMG") element.removeAttribute("src");
    });
  }

  function handlePostFile(file) {
    resetPostMedia();
    if (!file) return;
    if (!/^(image|video|audio)\//.test(file.type)) {
      setMessage("#postMessage", "Choose an image, video, or audio file.", "error");
      return;
    }
    state.mediaFile = file;
    state.mediaUrl = URL.createObjectURL(file);
    $("#postMediaPreview").classList.remove("hidden");
    const type = fileMediaType(file);
    const target = type === "video" ? $("#postVideoPreview") : type === "audio" ? $("#postAudioPreview") : $("#postImagePreview");
    target.src = state.mediaUrl;
    target.classList.remove("hidden");
    setMessage("#postMessage", "");
  }

  function parseTags(value) {
    return [...new Set((String(value || "").match(/#[\p{L}\p{N}_]+/gu) || []).map(tag => tag.toLowerCase()))];
  }

  async function publishPost(event) {
    event.preventDefault();
    if (!supabase || !currentUserId()) {
      setMessage("#postMessage", "Your ARS session is not ready. Sign in again and retry.", "error");
      return;
    }
    const content = $("#postText").value.trim();
    const file = state.mediaFile;
    if (!content && !file) {
      setMessage("#postMessage", "Write something or attach media before publishing.", "error");
      return;
    }

    const button = $("#publishPost");
    button.disabled = true;
    button.textContent = "Publishing…";
    setMessage("#postMessage", "Publishing your post…");
    try {
      let mediaUrl = null;
      let mediaType = "text";
      if (file) {
        mediaType = fileMediaType(file);
        mediaUrl = await uploadMedia(file, "private-post-media");
      }
      const mentions = $("#postMention").value.trim().split(/[\s,]+/).map(item => item.replace(/^@/, "")).filter(Boolean);
      const location = $("#postLocation").value.trim();
      const hashtags = parseTags($("#postHashtags").value + " " + content).map(tag => tag.replace(/^#/, ""));
      const post = {
        user_id: currentUserId(),
        content,
        image: mediaUrl,
        media_type: mediaType,
        privacy: $("#postPrivacy").value,
        location: location || null,
        mentions,
        hashtags,
        allow_comments: $("#allowComments").checked,
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        views_count: 0
      };
      const { data, error } = await supabase.from("posts").insert(post).select("id").single();
      if (error) throw error;

      const shouldStory = $("#postToStory").getAttribute("aria-pressed") === "true";
      if (shouldStory && file && mediaType !== "audio") {
        const storyMediaPath = await uploadMedia(file, "story-media");
        const { error: storyError } = await supabase.from("stories").insert({
          user_id: currentUserId(),
          image: storyMediaPath,
          original_image: storyMediaPath,
          media_type: mediaType === "video" ? "video" : "image",
          story_text: content.slice(0, 240),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          privacy: $("#postPrivacy").value,
          viewers_count: 0
        });
        if (storyError) console.warn("Post published, but sharing it to story failed:", storyError.message);
      }
      closeDialog("postDialog");
      $("#postForm").reset();
      $("#postToStory").setAttribute("aria-pressed", "false");
      resetPostMedia();
      setMessage("#postMessage", "");
      toast("Your post was published.");
      await loadFeed();
      if (shouldStory) await loadStories();
    } catch (error) {
      console.error("Post publish failed:", error);
      setMessage("#postMessage", error.message || "Could not publish the post. Check storage and database permissions.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Publish post";
    }
  }

  async function toggleLike(postId, button) {
    const userId = currentUserId();
    if (!userId) return toast("Sign in to like posts.");
    const liked = state.likes.has(String(postId));
    button.disabled = true;
    try {
      if (liked) {
        const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
        if (error) throw error;
        state.likes.delete(String(postId));
      } else {
        const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
        if (error) throw error;
        state.likes.add(String(postId));
      }
      button.classList.toggle("liked", !liked);
      button.textContent = liked ? "♡ Like" : "♥ Liked";
      const count = $('[data-likes-count="' + CSS.escape(String(postId)) + '"]');
      if (count) count.textContent = String(Math.max(0, Number(count.textContent) + (liked ? -1 : 1)));
    } catch (error) {
      console.error("Like action failed:", error);
      toast("Couldn't update the like. Please try again.");
    } finally {
      button.disabled = false;
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    const form = event.target;
    const postId = form.dataset.commentForm;
    const input = form.elements.comment;
    const content = input.value.trim();
    if (!content) return;
    if (!currentUserId()) return toast("Sign in to comment.");
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: currentUserId(), content });
      if (error) throw error;
      input.value = "";
      const list = $("#comments-" + CSS.escape(String(postId)));
      const node = document.createElement("div");
      node.className = "comment-item";
      const strong = document.createElement("strong");
      strong.textContent = state.user?.username || state.user?.display_name || "You";
      const span = document.createElement("span");
      span.textContent = content;
      node.append(strong, span);
      list?.append(node);
      toast("Comment added.");
    } catch (error) {
      console.error("Comment failed:", error);
      toast("Couldn't add your comment. Check database permissions.");
    } finally {
      button.disabled = false;
    }
  }

  async function savePost(postId) {
    if (!currentUserId()) return toast("Sign in to save posts.");
    try {
      const { error } = await supabase.from("bookmarks").insert({ post_id: postId, user_id: currentUserId() });
      if (error && !/duplicate|unique/i.test(error.message || "")) throw error;
      toast("Post saved.");
    } catch (error) {
      console.error("Save post failed:", error);
      toast("Couldn't save this post.");
    }
  }

  async function followUser(userId, button) {
    if (!currentUserId()) return toast("Sign in to follow people.");
    if (userId === currentUserId()) return;
    button.disabled = true;
    try {
      const { error } = await supabase.from("followers").insert({ follower_id: currentUserId(), following_id: userId });
      if (error && !/duplicate|unique/i.test(error.message || "")) throw error;
      button.textContent = "Following";
      toast("You're now following this account.");
    } catch (error) {
      console.error("Follow failed:", error);
      toast("Couldn't follow this account. Check the followers table permissions.");
      button.disabled = false;
    }
  }

  function storyEditorSnapshot() {
    return {
      text: $("#storyText").value,
      textColor: $("#storyTextColor").value,
      filter: $("#storyFilter").value,
      rotation: state.storyRotation,
      zoom: state.storyZoom,
      cropX: state.storyCropX,
      cropY: state.storyCropY,
      textSize: state.storyTextSize,
      textPosition: { ...state.storyTextPosition },
      sticker: state.storySticker,
      penColor: state.storyDrawingColor,
      drawing: JSON.parse(JSON.stringify(state.storyDrawing))
    };
  }

  function updateStoryUndoButton() {
    const button = $("#storyUndo");
    if (button) button.disabled = state.storyUndoStack.length === 0;
  }

  function commitStoryEditorChange() {
    const next = storyEditorSnapshot();
    const previous = state.storyEditorSnapshot;
    if (previous && JSON.stringify(previous) !== JSON.stringify(next)) {
      state.storyUndoStack.push(previous);
      if (state.storyUndoStack.length > 30) state.storyUndoStack.shift();
    }
    state.storyEditorSnapshot = next;
    updateStoryUndoButton();
  }

  function applyStoryEditorSnapshot(snapshot) {
    if (!snapshot) return;
    $("#storyText").value = snapshot.text || "";
    $("#storyTextColor").value = snapshot.textColor || "#ffffff";
    $("#storyFilter").value = snapshot.filter || "none";
    $("#storyZoomRange").value = String(snapshot.zoom || 1);
    $("#storyCropX").value = String(snapshot.cropX ?? 50);
    $("#storyCropY").value = String(snapshot.cropY ?? 50);
    $("#storyTextSize").value = String(snapshot.textSize || 24);
    $("#storySticker").value = snapshot.sticker || "";
    $("#storyPenColor").value = snapshot.penColor || "#ffffff";
    state.storyRotation = Number(snapshot.rotation || 0);
    state.storyZoom = Number(snapshot.zoom || 1);
    state.storyCropX = Number(snapshot.cropX ?? 50);
    state.storyCropY = Number(snapshot.cropY ?? 50);
    state.storyTextSize = Number(snapshot.textSize || 24);
    state.storyTextPosition = snapshot.textPosition || { x: 50, y: 50 };
    state.storySticker = snapshot.sticker || "";
    state.storyDrawingColor = snapshot.penColor || "#ffffff";
    state.storyDrawing = Array.isArray(snapshot.drawing) ? JSON.parse(JSON.stringify(snapshot.drawing)) : [];
    updateStoryText();
    setStoryPreviewFilter();
    drawStoryCanvas();
  }

  function undoStoryEdit() {
    const previous = state.storyUndoStack.pop();
    if (!previous) return;
    applyStoryEditorSnapshot(previous);
    state.storyEditorSnapshot = storyEditorSnapshot();
    updateStoryUndoButton();
    scheduleStoryDraftSave();
  }

  function setStoryPreviewFilter() {
    const image = $("#storyImagePreview");
    const video = $("#storyVideoPreview");
    const filter = $("#storyFilter").value;
    const isVideo = Boolean(state.storyFile?.type.startsWith("video/"));
    $("#storyPreview").classList.toggle("is-video", isVideo);
    image.style.filter = filter === "none" ? "none" : filter;
    image.style.transform = "rotate(" + state.storyRotation + "deg) scale(" + state.storyZoom + ")";
    image.style.objectPosition = state.storyCropX + "% " + state.storyCropY + "%";
    video.style.filter = "none";
    video.style.transform = "none";
    const photoControls = [
      "#storyRotate", "#storyZoomRange", "#storyCropX", "#storyCropY",
      "#storyFilter", "#storyTextSize", "#storyTextColor", "#storySticker",
      "#storyPenColor", "#storyPenToggle"
    ];
    photoControls.forEach(selector => {
      const control = $(selector);
      if (control) control.disabled = isVideo;
    });
    const canvas = $("#storyDrawingCanvas");
    if (canvas) canvas.classList.toggle("is-drawing", state.storyDrawingEnabled && !isVideo);
  }

  function updateStoryText() {
    const overlay = $("#storyTextOverlay");
    const textInput = $("#storyText");
    const colorInput = $("#storyTextColor");
    const sizeInput = $("#storyTextSize");
    const stickerInput = $("#storySticker");
    if (sizeInput) state.storyTextSize = Number(sizeInput.value || 24);
    if (colorInput) overlay.style.color = colorInput.value;
    overlay.textContent = textInput.value;
    overlay.style.fontSize = state.storyTextSize + "px";
    overlay.style.left = state.storyTextPosition.x + "%";
    overlay.style.top = state.storyTextPosition.y + "%";
    if (stickerInput) state.storySticker = stickerInput.value;
    $("#storyStickerOverlay").textContent = state.storySticker;
  }

  function drawStoryCanvas() {
    const canvas = $("#storyDrawingCanvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    state.storyDrawing.forEach(stroke => {
      const points = stroke.points || [];
      if (!points.length) return;
      context.beginPath();
      context.strokeStyle = stroke.color || "#ffffff";
      context.lineWidth = Number(stroke.width || 3);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.moveTo(points[0].x / 100 * width, points[0].y / 100 * height);
      points.slice(1).forEach(point => {
        context.lineTo(point.x / 100 * width, point.y / 100 * height);
      });
      context.stroke();
    });
  }

  function addDrawingPoint(event) {
    if (!state.storyActiveStroke) return;
    const rect = $("#storyDrawingCanvas").getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    state.storyActiveStroke.points.push({
      x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100))
    });
    drawStoryCanvas();
  }

  function toggleStoryDrawing() {
    state.storyDrawingEnabled = !state.storyDrawingEnabled;
    const button = $("#storyPenToggle");
    button.setAttribute("aria-pressed", String(state.storyDrawingEnabled));
    button.textContent = state.storyDrawingEnabled ? "✎ Drawing on" : "✎ Draw";
    setStoryPreviewFilter();
  }

  function previewStoryBeforePublish() {
    if (!state.storyFile) {
      toast("Choose a photo or video before previewing your story.");
      return;
    }
    createEditedStoryFile(state.storyFile).then(previewFile => {
      if (state.storyEditorPreviewUrl) URL.revokeObjectURL(state.storyEditorPreviewUrl);
      state.storyEditorPreviewUrl = URL.createObjectURL(previewFile);
      const isVideo = previewFile.type.startsWith("video/");
      const media = isVideo
        ? '<video controls autoplay playsinline src="' + escapeHTML(state.storyEditorPreviewUrl) + '"></video>'
        : '<img src="' + escapeHTML(state.storyEditorPreviewUrl) + '" alt="Story preview">';
      $("#storyViewerContent").innerHTML = media;
      $("#storyViewerFooter").innerHTML = '<p class="muted">Preview only — this story has not been published.</p>';
      state.previewFromEditor = true;
      closeDialog("storyDialog");
      openDialog("storyViewer");
    }).catch(error => {
      console.error("Story preview failed:", error);
      toast("Could not prepare the preview. Please try again.");
    });
  }

  async function createEditedStoryFile(file) {
    if (!file || !file.type.startsWith("image/")) return file;
    let image;
    let temporaryUrl = "";
    if (typeof createImageBitmap === "function") {
      image = await createImageBitmap(file);
    } else {
      temporaryUrl = URL.createObjectURL(file);
      image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("The selected image could not be opened."));
        element.src = temporaryUrl;
      });
    }

    try {
      const output = document.createElement("canvas");
      output.width = 1080;
      output.height = 1920;
      const context = output.getContext("2d");
      if (!context) throw new Error("Image editing is unavailable in this browser.");

      const sourceWidth = image.width || image.naturalWidth;
      const sourceHeight = image.height || image.naturalHeight;
      const quarterTurn = Math.abs(state.storyRotation) % 180 === 90;
      const fitScale = Math.max(
        output.width / (quarterTurn ? sourceHeight : sourceWidth),
        output.height / (quarterTurn ? sourceWidth : sourceHeight)
      );
      context.fillStyle = "#08070d";
      context.fillRect(0, 0, output.width, output.height);
      context.filter = $("#storyFilter").value === "none" ? "none" : $("#storyFilter").value;
      context.save();
      context.translate(output.width / 2, output.height / 2);
      context.rotate(state.storyRotation * Math.PI / 180);
      context.scale(fitScale * state.storyZoom, fitScale * state.storyZoom);
      context.translate(
        (state.storyCropX - 50) / 50 * sourceWidth * 0.25,
        (state.storyCropY - 50) / 50 * sourceHeight * 0.25
      );
      context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
      context.restore();
      context.filter = "none";

      const previewRect = $("#storyPreview").getBoundingClientRect();
      const widthScale = output.width / Math.max(1, previewRect.width);
      const heightScale = output.height / Math.max(1, previewRect.height);
      state.storyDrawing.forEach(stroke => {
        const points = stroke.points || [];
        if (!points.length) return;
        context.beginPath();
        context.strokeStyle = stroke.color || "#ffffff";
        context.lineWidth = Number(stroke.width || 3) * widthScale;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.moveTo(points[0].x / 100 * output.width, points[0].y / 100 * output.height);
        points.slice(1).forEach(point => {
          context.lineTo(point.x / 100 * output.width, point.y / 100 * output.height);
        });
        context.stroke();
      });

      const storyText = $("#storyText").value.trim();
      if (storyText) {
        const fontSize = state.storyTextSize * widthScale;
        context.font = "800 " + fontSize + "px system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = $("#storyTextColor").value;
        context.shadowColor = "rgba(0, 0, 0, .85)";
        context.shadowBlur = 12 * widthScale;
        const maxWidth = output.width * 0.84;
        const words = storyText.split(/\s+/);
        const lines = [];
        let line = "";
        words.forEach(word => {
          const candidate = line ? line + " " + word : word;
          if (line && context.measureText(candidate).width > maxWidth) {
            lines.push(line);
            line = word;
          } else {
            line = candidate;
          }
        });
        if (line) lines.push(line);
        const lineHeight = fontSize * 1.2;
        const centerY = state.storyTextPosition.y / 100 * output.height;
        lines.forEach((textLine, index) => {
          context.fillText(
            textLine,
            state.storyTextPosition.x / 100 * output.width,
            centerY + (index - (lines.length - 1) / 2) * lineHeight,
            maxWidth
          );
        });
        context.shadowBlur = 0;
      }

      if (state.storySticker) {
        const stickerSize = 42 * widthScale;
        context.font = stickerSize + "px system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(state.storySticker, output.width * 0.5, output.height * 0.25);
      }

      const blob = await new Promise((resolve, reject) => {
        output.toBlob(result => result ? resolve(result) : reject(new Error("The edited image could not be exported.")), "image/jpeg", 0.92);
      });
      const name = (file.name || "story").replace(/\.[^.]+$/, "");
      return new File([blob], name + "-edited.jpg", { type: "image/jpeg" });
    } finally {
      if (typeof image.close === "function") image.close();
      if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    }
  }

  function resetStoryPreview() {
    if (state.storyUrl) URL.revokeObjectURL(state.storyUrl);
    state.storyFile = null;
    state.storyUrl = "";
    state.storyRotation = 0;
    state.storyZoom = 1;
    state.storyCropX = 50;
    state.storyCropY = 50;
    state.storyTextSize = 24;
    state.storyTextPosition = { x: 50, y: 50 };
    state.storySticker = "";
    state.storyDrawing = [];
    state.storyUndoStack = [];
    state.storyDrawingEnabled = false;
    state.storyDrawingColor = "#ffffff";
    state.storyActiveStroke = null;
    state.storyEditorSnapshot = null;
    $("#storyMedia").value = "";
    $("#storyPreview").classList.add("hidden");
    $("#storyPreview").classList.remove("is-video");
    $("#storyImagePreview").classList.add("hidden");
    $("#storyVideoPreview").classList.add("hidden");
    $("#storyImagePreview").removeAttribute("src");
    $("#storyVideoPreview").removeAttribute("src");
    $("#storyText").value = "";
    $("#storyTextOverlay").textContent = "";
    $("#storyStickerOverlay").textContent = "";
    $("#storyFilter").value = "none";
    $("#storyZoomRange").value = "1";
    $("#storyCropX").value = "50";
    $("#storyCropY").value = "50";
    $("#storyTextSize").value = "24";
    $("#storySticker").value = "";
    $("#storyPenColor").value = "#ffffff";
    $("#storyPenToggle").setAttribute("aria-pressed", "false");
    $("#storyPenToggle").textContent = "✎ Draw";
    $("#storyDrawingCanvas").classList.remove("is-drawing");
    drawStoryCanvas();
    updateStoryUndoButton();
    state.storyEditorSnapshot = storyEditorSnapshot();
  }

  async function handleStoryFile(file) {
    if (!file) return;
    if (!/^(image|video)\//.test(file.type)) {
      setMessage("#storyMessage", "Choose a photo or video for your story.", "error");
      return;
    }

    const savedFields = readStoryDraftFields();
    const previousDraftMediaPath = state.storyDraftMediaPath;
    resetStoryPreview();
    applyStoryDraftFields(savedFields);
    state.storyDraftMediaPath = previousDraftMediaPath;

    state.storyFile = file;
    state.storyUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    const target = isVideo ? $("#storyVideoPreview") : $("#storyImagePreview");
    target.src = state.storyUrl;
    target.classList.remove("hidden");
    $("#storyPreview").classList.remove("hidden");
    setStoryPreviewFilter();
    updateStoryText();
    drawStoryCanvas();
    state.storyEditorSnapshot = storyEditorSnapshot();
    scheduleStoryDraftSave();
    try {
      await uploadStoryDraftMedia(file);
    } catch (error) {
      console.warn("Cloud story media draft upload failed:", error);
      setMessage("#storyMessage", "Draft media could not sync across devices yet; the local preview is still available.", "error");
    }
  }

  function readStoryDraftFields() {
    return {
      text: $("#storyText").value,
      textColor: $("#storyTextColor").value,
      filter: $("#storyFilter").value,
      duration: $("#storyDuration").value,
      privacy: $("#storyPrivacy").value,
      location: $("#storyLocation").value,
      mention: $("#storyMention").value,
      hashtags: $("#storyHashtags").value,
      rotation: state.storyRotation,
      zoom: state.storyZoom,
      cropX: state.storyCropX,
      cropY: state.storyCropY,
      textSize: state.storyTextSize,
      textPosition: state.storyTextPosition,
      sticker: state.storySticker,
      penColor: state.storyDrawingColor,
      drawing: state.storyDrawing
    };
  }

  async function persistStoryDraft() {
    const draft = readStoryDraftFields();
    try {
      localStorage.setItem(storyDraftStorageKey(), JSON.stringify(draft));
    } catch (error) {
      console.warn("Local story draft save warning:", error);
    }
    if (!supabase || !currentUserId()) return;
    const { error } = await supabase.from("story_drafts").upsert({
      user_id: currentUserId(),
      draft_data: draft,
      media_url: state.storyDraftMediaPath || null,
      media_type: state.storyFile?.type.startsWith("video/") ? "video" : state.storyFile ? "image" : null,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (error) console.warn("Cloud story draft save warning:", error.message);
  }

  function scheduleStoryDraftSave() {
    if (state.storyDraftTimer) window.clearTimeout(state.storyDraftTimer);
    state.storyDraftTimer = window.setTimeout(() => {
      persistStoryDraft().catch(error => console.warn("Story draft save failed:", error));
    }, 350);
  }

  function applyStoryDraftFields(draft) {
    if (!draft) return;
    $("#storyText").value = draft.text || "";
    $("#storyTextColor").value = draft.textColor || "#ffffff";
    $("#storyFilter").value = draft.filter || "none";
    $("#storyDuration").value = String(draft.duration || "24");
    $("#storyPrivacy").value = draft.privacy || "public";
    $("#storyLocation").value = draft.location || "";
    $("#storyMention").value = draft.mention || "";
    $("#storyHashtags").value = draft.hashtags || "";
    $("#storyZoomRange").value = String(draft.zoom || 1);
    $("#storyCropX").value = String(draft.cropX ?? 50);
    $("#storyCropY").value = String(draft.cropY ?? 50);
    $("#storyTextSize").value = String(draft.textSize || 24);
    $("#storySticker").value = draft.sticker || "";
    $("#storyPenColor").value = draft.penColor || "#ffffff";
    state.storyRotation = Number(draft.rotation || 0);
    state.storyZoom = Number(draft.zoom || 1);
    state.storyCropX = Number(draft.cropX ?? 50);
    state.storyCropY = Number(draft.cropY ?? 50);
    state.storyTextSize = Number(draft.textSize || 24);
    state.storyTextPosition = draft.textPosition || { x: 50, y: 50 };
    state.storySticker = draft.sticker || "";
    state.storyDrawingColor = draft.penColor || "#ffffff";
    state.storyDrawing = Array.isArray(draft.drawing) ? draft.drawing : [];
    updateStoryText();
    setStoryPreviewFilter();
    drawStoryCanvas();
    state.storyEditorSnapshot = storyEditorSnapshot();
  }

  async function restoreStoryDraft() {
    let draft = null;
    let mediaPath = "";
    try {
      draft = JSON.parse(localStorage.getItem(storyDraftStorageKey()) || "null");
    } catch (error) {
      console.warn("Local story draft restore warning:", error);
    }

    if (supabase && currentUserId()) {
      const { data, error } = await supabase.from("story_drafts")
        .select("draft_data, media_url, media_type")
        .eq("user_id", currentUserId())
        .maybeSingle();
      if (!error && data) {
        draft = data.draft_data || draft;
        mediaPath = data.media_url || "";
      } else if (error) {
        console.warn("Cloud story draft restore warning:", error.message);
      }
    }

    applyStoryDraftFields(draft);
    if (mediaPath && supabase && currentUserId()) {
      const { data, error } = await supabase.storage.from("private-post-media").download(mediaPath);
      if (!error && data) {
        const mediaType = data.type || (mediaPath.match(/\.(mp4|webm|mov)$/i) ? "video/mp4" : "image/jpeg");
        state.storyFile = new File([data], mediaPath.split("/").pop() || "story-draft", { type: mediaType });
        state.storyDraftMediaPath = mediaPath;
        state.storyUrl = URL.createObjectURL(state.storyFile);
        const isVideo = state.storyFile.type.startsWith("video/");
        const target = isVideo ? $("#storyVideoPreview") : $("#storyImagePreview");
        target.src = state.storyUrl;
        target.classList.remove("hidden");
        $("#storyPreview").classList.remove("hidden");
        setStoryPreviewFilter();
        updateStoryText();
        drawStoryCanvas();
      } else if (error) {
        console.warn("Could not restore story draft media:", error.message);
      }
    }
  }

  async function uploadStoryDraftMedia(file) {
    if (!supabase || !currentUserId()) return;
    const extension = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = currentUserId() + "/story-drafts/" + Date.now() + "-" + crypto.randomUUID() + "." + extension;
    const { data, error } = await supabase.storage.from("private-post-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw error;
    if (state.storyDraftMediaPath) {
      await supabase.storage.from("private-post-media").remove([state.storyDraftMediaPath]);
    }
    state.storyDraftMediaPath = data.path;
    await persistStoryDraft();
  }

  async function publishStory(event) {
    event.preventDefault();
    if (!supabase || !currentUserId()) {
      setMessage("#storyMessage", "Your ARS session is not ready. Sign in again and retry.", "error");
      return;
    }
    if (!state.storyFile) {
      setMessage("#storyMessage", "Choose a photo or video first.", "error");
      return;
    }
    const button = $("#publishStory");
    button.disabled = true;
    button.textContent = "Publishing…";
    setMessage("#storyMessage", "Publishing your story…");
    try {
      let sourceFile = state.storyFile;
      if (state.storyDraftMediaPath) {
        const { data: draftBlob, error: draftDownloadError } = await supabase.storage.from("private-post-media").download(state.storyDraftMediaPath);
        if (draftDownloadError) throw draftDownloadError;
        sourceFile = new File([draftBlob], state.storyFile.name || "story-media", { type: state.storyFile.type });
      }
      const isVideo = sourceFile.type.startsWith("video/");
      const publishFile = await createEditedStoryFile(sourceFile);
      const url = await uploadMedia(publishFile, "story-media");
      const hours = Number($("#storyDuration").value || 24);
      const mentionNames = $("#storyMention").value.trim().split(/[\s,]+/).map(value => value.replace(/^@/, "")).filter(Boolean);
      let mentions = [];
      if (mentionNames.length) {
        const { data: mentionedUsers, error: mentionError } = await supabase.from("users").select("id, username").in("username", mentionNames);
        if (mentionError) console.warn("Story mentions could not be resolved:", mentionError.message);
        mentions = (mentionedUsers || []).map(user => user.id);
      }
      const hashtags = parseTags($("#storyHashtags").value).map(tag => tag.replace(/^#/, ""));
      const story = {
        user_id: currentUserId(),
        image: url,
        original_image: url,
        media_type: isVideo ? "video" : "image",
        story_text: $("#storyText").value.trim(),
        text_position: isVideo ? "center" : "custom",
        text_color: $("#storyTextColor").value,
        filter: isVideo ? "none" : $("#storyFilter").value,
        sticker: isVideo ? null : state.storySticker || null,
        zoom: isVideo ? 1 : state.storyZoom,
        rotation_degrees: isVideo ? 0 : state.storyRotation,
        crop_data: isVideo ? {} : { x: state.storyCropX, y: state.storyCropY, zoom: state.storyZoom },
        drawing_data: isVideo ? [] : state.storyDrawing,
        text_overlays: !isVideo && $("#storyText").value.trim() ? [{
          text: $("#storyText").value.trim(),
          color: $("#storyTextColor").value,
          size: state.storyTextSize,
          x: state.storyTextPosition.x,
          y: state.storyTextPosition.y
        }] : [],
        sticker_data: !isVideo && state.storySticker ? [{
          emoji: state.storySticker,
          x: 50,
          y: 25
        }] : [],
        edit_metadata: {
          text_baked: !isVideo,
          edited: !isVideo,
          crop_x: state.storyCropX,
          crop_y: state.storyCropY,
          text_size: state.storyTextSize
        },
        location: $("#storyLocation").value.trim() || null,
        mentions,
        hashtags,
        expires_at: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
        privacy: $("#storyPrivacy").value,
        viewers_count: 0
      };
      const { error } = await supabase.from("stories").insert(story);
      if (error) throw error;
      localStorage.removeItem(storyDraftStorageKey());
      if (state.storyDraftMediaPath) await supabase.storage.from("private-post-media").remove([state.storyDraftMediaPath]);
      await supabase.from("story_drafts").delete().eq("user_id", currentUserId());
      state.storyDraftMediaPath = "";
      closeDialog("storyDialog");
      resetStoryPreview();
      $("#storyForm").reset();
      $("#storyTextColor").value = "#ffffff";
      toast("Your story is live.");
      await loadStories();
    } catch (error) {
      console.error("Story publish failed:", error);
      setMessage("#storyMessage", error.message || "Could not publish the story. Check the story-media bucket and database permissions.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Publish story";
    }
  }

  async function openStoryViewer(storyId) {
    const story = state.stories.find(item => String(item.id) === String(storyId));
    if (!story) return;
    const isVideo = story.media_type === "video";
    let storyMediaUrl = story.image || "";
    if (storyMediaUrl && !/^https?:\/\//i.test(storyMediaUrl)) {
      const { data: signedMedia, error: mediaError } = await supabase.storage.from("story-media").createSignedUrl(storyMediaUrl, 3600);
      if (mediaError) {
        console.warn("Story media could not be opened:", mediaError.message);
        toast("This story media is unavailable to your account.");
        return;
      }
      storyMediaUrl = signedMedia?.signedUrl || "";
    }
    const media = isVideo
      ? '<video controls autoplay playsinline src="' + escapeHTML(storyMediaUrl) + '"></video>'
      : '<img src="' + escapeHTML(storyMediaUrl) + '" alt="Story">';
    const showCaption = story.story_text && !(story.edit_metadata && story.edit_metadata.text_baked);
    $("#storyViewerContent").innerHTML = media + (showCaption ? '<div class="viewer-caption" style="color:' + escapeHTML(story.text_color || "#ffffff") + '">' + escapeHTML(story.story_text) + "</div>" : "");
    const ownsStory = currentUserId() === story.user_id;
    $("#storyViewerFooter").innerHTML =
      '<button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="💜">💜</button>' +
      '<button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="🔥">🔥</button>' +
      '<button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="😂">😂</button>' +
      '<button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="😍">😍</button>' +
      '<button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="👏">👏</button>' +
      '<button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="😮">😮</button>' +
      '<span class="muted" id="storyViewsCount">' + Number(story.viewers_count || 0) + " views</span>" +
      (ownsStory
        ? '<button type="button" class="story-delete-button" data-delete-story="' + escapeHTML(story.id) + '">Delete story</button><div class="story-viewer-list" id="storyViewerList"></div>'
        : "");
    openDialog("storyViewer");
    const userId = currentUserId();
    if (userId && userId !== story.user_id) {
      const { error } = await supabase.from("story_views").upsert({ story_id: story.id, viewer_id: userId }, { onConflict: "story_id,viewer_id" });
      if (error) console.warn("Story view was not recorded:", error.message);
    }

    const { data: refreshedStory } = await supabase.from("stories").select("viewers_count").eq("id", story.id).maybeSingle();
    if (refreshedStory) {
      story.viewers_count = refreshedStory.viewers_count || 0;
      $("#storyViewsCount").textContent = story.viewers_count + " views";
    }

    if (userId && userId === story.user_id) {
      const { data: views, error: viewsError } = await supabase.from("story_views").select("viewer_id").eq("story_id", story.id);
      if (viewsError) {
        console.warn("Story viewer list unavailable:", viewsError.message);
        return;
      }
      const viewerIds = [...new Set((views || []).map(view => view.viewer_id).filter(Boolean))];
      if (viewerIds.length) {
        const { data: viewers } = await supabase.from("users").select("id, username, display_name, avatar").in("id", viewerIds);
        const names = (viewers || []).map(viewer => viewer.display_name || viewer.username || "ARS member");
        $("#storyViewerList").textContent = "Viewed by: " + names.join(", ");
      } else {
        $("#storyViewerList").textContent = "No viewers yet.";
      }
    }
  }

  async function deleteStory(storyId) {
    const story = state.stories.find(item => String(item.id) === String(storyId));
    if (!story || story.user_id !== currentUserId()) {
      toast("You can only delete your own story.");
      return;
    }
    if (!window.confirm("Delete this story? This cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", story.id)
        .eq("user_id", currentUserId());
      if (error) throw error;

      if (story.image && !/^https?:\/\//i.test(story.image)) {
        const { error: storageError } = await supabase.storage.from("story-media").remove([story.image]);
        if (storageError) {
          console.warn("Story was deleted, but its media file could not be removed:", storageError.message);
        }
      }

      closeDialog("storyViewer");
      toast("Story deleted.");
      await loadStories();
    } catch (error) {
      console.error("Story deletion failed:", error);
      toast("Could not delete this story. Check your permissions and try again.");
    }
  }

  async function reactToStory(storyId, emoji) {
    if (!currentUserId()) return toast("Sign in to react to stories.");
    const allowed = ["💜", "🔥", "😂", "😍", "👏", "😮"];
    if (!allowed.includes(emoji)) return;
    try {
      const { error } = await supabase.from("story_reactions").upsert({ story_id: storyId, user_id: currentUserId(), emoji }, { onConflict: "story_id,user_id" });
      if (error) throw error;
      toast("Reaction sent.");
    } catch (error) {
      console.error("Story reaction failed:", error);
      toast("Couldn't send the reaction. Please try again.");
    }
  }

  async function searchPosts(query) {
    const term = query.trim();
    if (!term) return loadFeed();
    const { data, error } = await supabase.from("posts")
      .select("id, created_at, user_id, content, image, likes_count, comments_count, reposts_count, views_count, media_type, privacy, location, mentions, hashtags, allow_comments")
      .ilike("content", "%" + term.replace(/[%_]/g, "") + "%")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      toast("Search failed. Please try again.");
      console.error("Search failed:", error);
      return;
    }
    state.posts = data || [];
    const feed = $("#feed");
    if (!state.posts.length) {
      feed.innerHTML = '<div class="panel loading-card">No posts matched “' + escapeHTML(term) + '”.</div>';
      $("#feedEmpty").classList.add("hidden");
      return;
    }
    const ids = [...new Set(state.posts.map(post => post.user_id).filter(Boolean))];
    const { data: users } = await supabase.from("users").select("id, username, display_name, avatar, verified").in("id", ids);
    const profiles = Object.fromEntries((users || []).map(user => [user.id, user]));
    const displayRows = await Promise.all(state.posts.map(async post => ({
      ...post,
      image: await resolvePostMedia(post.image)
    })));
    feed.innerHTML = displayRows.map(post => renderPost(post, profiles[post.user_id] || {})).join("");
    loadComments(state.posts.map(post => post.id));
    loadLikeStates(state.posts.map(post => post.id));
  }

  async function openMessages() {
    if (!supabase || !currentUserId()) {
      toast("Sign in to open your messages.");
      return;
    }

    openDialog("messagesDialog");
    $("#messagesList").innerHTML = '<p class="muted">Loading conversations…</p>';
    $("#conversationPanel").classList.add("hidden");
    $("#messagesStatus").textContent = "";
    state.activeConversationId = null;

    const userId = currentUserId();
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("id, user1_id, user2_id, last_message, created_at")
      .or("user1_id.eq." + userId + ",user2_id.eq." + userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Messages load failed:", error);
      $("#messagesList").innerHTML = '<p class="muted">Messages could not be loaded.</p>';
      setMessage("#messagesStatus", "Check your connection and conversation permissions.", "error");
      return;
    }

    state.conversations = conversations || [];
    if (!state.conversations.length) {
      $("#messagesList").innerHTML = '<p class="muted">No conversations yet.</p>';
      return;
    }

    const otherUserIds = [...new Set(state.conversations.map(conversation => (
      conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id
    )).filter(Boolean))];
    const { data: profiles, error: profilesError } = otherUserIds.length
      ? await supabase.from("users").select("id, username, display_name, avatar").in("id", otherUserIds)
      : { data: [], error: null };

    if (profilesError) {
      console.warn("Conversation profiles unavailable:", profilesError.message);
    }

    state.conversationProfiles = Object.fromEntries((profiles || []).map(profile => [profile.id, profile]));
    $("#messagesList").innerHTML = state.conversations.map(conversation => {
      const otherId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
      const profile = state.conversationProfiles[otherId] || {};
      const name = profile.display_name || profile.username || "ARS member";
      const preview = conversation.last_message || "Open conversation";
      return '<button class="conversation-choice" type="button" data-conversation-id="' + escapeHTML(conversation.id) + '">' +
        (profile.avatar
          ? '<img class="avatar" src="' + escapeHTML(profile.avatar) + '" alt="">'
          : '<span class="avatar">' + escapeHTML(name.charAt(0).toUpperCase() || "A") + "</span>") +
        '<span><strong>' + escapeHTML(name) + '</strong><br><span class="muted">' + escapeHTML(preview) + "</span></span></button>";
    }).join("");
  }

  async function openConversation(conversationId) {
    const conversation = state.conversations.find(item => item.id === conversationId);
    if (!conversation || !supabase) return;

    state.activeConversationId = conversationId;
    const userId = currentUserId();
    const otherId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
    const profile = state.conversationProfiles[otherId] || {};
    $("#conversationTitle").textContent = profile.display_name || profile.username || "ARS member";
    $("#conversationPanel").classList.remove("hidden");
    $("#conversationMessages").innerHTML = '<p class="muted">Loading messages…</p>';

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Conversation messages failed to load:", error);
      $("#conversationMessages").innerHTML = '<p class="muted">Messages could not be loaded.</p>';
      return;
    }

    if (!messages?.length) {
      $("#conversationMessages").innerHTML = '<p class="muted">No messages in this conversation yet.</p>';
      return;
    }

    $("#conversationMessages").innerHTML = messages.map(message =>
      '<div class="message-bubble' + (message.sender_id === userId ? " own" : "") + '">' +
      escapeHTML(message.content || "") +
      '<div class="muted">' + escapeHTML(relativeTime(message.created_at)) + "</div></div>"
    ).join("");
    $("#conversationMessages").scrollTop = $("#conversationMessages").scrollHeight;

    $$(".conversation-choice").forEach(button => {
      button.classList.toggle("active", button.dataset.conversationId === conversationId);
    });
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = $("#messageText").value.trim();
    const conversationId = state.activeConversationId;
    if (!content || !conversationId || !currentUserId()) return;

    const button = $("#messageForm").querySelector("button");
    button.disabled = true;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId(),
        content
      });
      if (error) throw error;

      const { error: conversationError } = await supabase
        .from("conversations")
        .update({ last_message: content })
        .eq("id", conversationId);
      if (conversationError) {
        console.warn("Conversation preview update failed:", conversationError.message);
      }

      $("#messageText").value = "";
      const conversation = state.conversations.find(item => item.id === conversationId);
      if (conversation) conversation.last_message = content;
      await openConversation(conversationId);
      toast("Message sent.");
    } catch (error) {
      console.error("Message send failed:", error);
      setMessage("#messagesStatus", "The message could not be sent. Check your access and try again.", "error");
    } finally {
      button.disabled = false;
    }
  }

  function setActiveNavigation(section) {
    $(".bottom-item, .nav-item, .rail-tool").forEach(item => {
      item.classList.toggle("active", item.dataset.nav === section);
    });
  }

  function navigate(section) {
    setActiveNavigation(section);
    document.body.classList.toggle("trending-mode", section === "trending");

    if (section === "profile") {
      window.location.href = "profile.html";
      return;
    }

    if (section === "home") {
      $("#feedTitle").textContent = "Your feed";
      loadFeed("latest");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (section === "trending") {
      $("#feedTitle").textContent = "Trending";
      loadFeed("trending");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (section === "messages") {
      openMessages();
      return;
    }

    const destinations = {
      search: "search.html",
      streak: "streak.html",
      notifications: "notifications.html"
    };

    if (destinations[section]) {
      window.location.href = destinations[section];
    }
  }

  function bindEvents() {
    $$("[data-open]").forEach(button => button.addEventListener("click", () => openDialog(button.dataset.open)));
    $$("[data-close]").forEach(button => button.addEventListener("click", () => closeDialog(button.dataset.close)));
    $("[data-nav]").forEach(button => button.addEventListener("click", event => {
      event.preventDefault();
      navigate(button.dataset.nav);
    }));
    $("#messagesList").addEventListener("click", event => {
      const button = event.target.closest("[data-conversation-id]");
      if (button) openConversation(button.dataset.conversationId);
    });
    $("#messageForm").addEventListener("submit", sendMessage);
    $("#openWheel").addEventListener("click", () => {
      window.location.href = "rewards.html";
    });
    $("#openStory").addEventListener("click", () => openDialog("storyDialog"));
    $("#refreshFeed").addEventListener("click", loadFeed);
    $("#refreshStories").addEventListener("click", loadStories);
    $("#postForm").addEventListener("submit", publishPost);
    $("#storyForm").addEventListener("submit", publishStory);
    $("#postMedia").addEventListener("change", event => handlePostFile(event.target.files?.[0]));
    $("#removePostMedia").addEventListener("click", resetPostMedia);
    $("#postToStory").addEventListener("click", event => {
      const button = event.currentTarget;
      const active = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "◉ Will also post to story" : "◉ Also to story";
    });
    $("#storyMedia").addEventListener("change", event => handleStoryFile(event.target.files?.[0]));
    ["#storyText", "#storyTextColor", "#storyTextSize", "#storySticker", "#storyPenColor",
      "#storyZoomRange", "#storyCropX", "#storyCropY", "#storyFilter", "#storyDuration",
      "#storyPrivacy", "#storyLocation", "#storyMention", "#storyHashtags"].forEach(selector => {
      const control = $(selector);
      control.addEventListener("input", () => {
        if (selector === "#storyZoomRange") state.storyZoom = Number(control.value || 1);
        if (selector === "#storyCropX") state.storyCropX = Number(control.value || 50);
        if (selector === "#storyCropY") state.storyCropY = Number(control.value || 50);
        if (selector === "#storyTextSize") state.storyTextSize = Number(control.value || 24);
        if (selector === "#storySticker") state.storySticker = control.value;
        if (selector === "#storyPenColor") state.storyDrawingColor = control.value;
        updateStoryText();
        setStoryPreviewFilter();
        drawStoryCanvas();
        commitStoryEditorChange();
        scheduleStoryDraftSave();
      });
      control.addEventListener("change", () => {
        setStoryPreviewFilter();
        scheduleStoryDraftSave();
      });
    });
    $("#storyRotate").addEventListener("click", () => {
      state.storyRotation = (state.storyRotation + 90) % 360;
      setStoryPreviewFilter();
      commitStoryEditorChange();
      scheduleStoryDraftSave();
    });
    $("#storyPenToggle").addEventListener("click", toggleStoryDrawing);
    $("#storyUndo").addEventListener("click", undoStoryEdit);
    $("#storyPreviewButton").addEventListener("click", previewStoryBeforePublish);

    const drawingCanvas = $("#storyDrawingCanvas");
    drawingCanvas.addEventListener("pointerdown", event => {
      if (!state.storyDrawingEnabled || !state.storyFile || state.storyFile.type.startsWith("video/")) return;
      event.preventDefault();
      drawingCanvas.setPointerCapture(event.pointerId);
      state.storyActiveStroke = {
        color: state.storyDrawingColor,
        width: 3,
        points: []
      };
      state.storyDrawing.push(state.storyActiveStroke);
      addDrawingPoint(event);
    });
    drawingCanvas.addEventListener("pointermove", event => {
      if (state.storyActiveStroke) addDrawingPoint(event);
    });
    const finishDrawing = () => {
      if (!state.storyActiveStroke) return;
      state.storyActiveStroke = null;
      commitStoryEditorChange();
      scheduleStoryDraftSave();
    };
    drawingCanvas.addEventListener("pointerup", finishDrawing);
    drawingCanvas.addEventListener("pointercancel", finishDrawing);

    const textOverlay = $("#storyTextOverlay");
    textOverlay.addEventListener("pointerdown", event => {
      if (!state.storyFile || state.storyFile.type.startsWith("video/") || !$("#storyText").value.trim()) return;
      event.preventDefault();
      state.storyTextDragging = true;
      textOverlay.setPointerCapture(event.pointerId);
    });
    textOverlay.addEventListener("pointermove", event => {
      if (!state.storyTextDragging) return;
      const rect = $("#storyPreview").getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      state.storyTextPosition = {
        x: Math.max(8, Math.min(92, (event.clientX - rect.left) / rect.width * 100)),
        y: Math.max(8, Math.min(92, (event.clientY - rect.top) / rect.height * 100))
      };
      updateStoryText();
    });
    const finishTextMove = () => {
      if (!state.storyTextDragging) return;
      state.storyTextDragging = false;
      commitStoryEditorChange();
      scheduleStoryDraftSave();
    };
    textOverlay.addEventListener("pointerup", finishTextMove);
    textOverlay.addEventListener("pointercancel", finishTextMove);
    $("#storyViewer").addEventListener("close", () => {
      if (state.storyEditorPreviewUrl) {
        URL.revokeObjectURL(state.storyEditorPreviewUrl);
        state.storyEditorPreviewUrl = "";
      }
      if (state.previewFromEditor) {
        state.previewFromEditor = false;
        openDialog("storyDialog");
      }
    });
    $("#globalSearch").addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchPosts(event.currentTarget.value);
      }
    });
    document.addEventListener("click", event => {
      const like = event.target.closest("[data-like]");
      if (like) return toggleLike(like.dataset.like, like);
      const focusComment = event.target.closest("[data-comment-focus]");
      if (focusComment) {
        const input = $('[data-comment-form="' + CSS.escape(focusComment.dataset.commentFocus) + '"] input');
        input?.focus();
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const share = event.target.closest("[data-share]");
      if (share) {
        const url = window.location.origin + window.location.pathname + "#post-" + encodeURIComponent(share.dataset.share);
        if (navigator.share) navigator.share({ title: "ARS post", url }).catch(() => {});
        else if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => toast("Post link copied.")).catch(() => toast(url));
        else toast(url);
        return;
      }
      const save = event.target.closest("[data-save]");
      if (save) return savePost(save.dataset.save);
      const follow = event.target.closest("[data-follow]");
      if (follow) return followUser(follow.dataset.follow, follow);
      const story = event.target.closest("[data-story-id]");
      if (story) return openStoryViewer(story.dataset.storyId);
      const deleteStoryButton = event.target.closest("[data-delete-story]");
      if (deleteStoryButton) return deleteStory(deleteStoryButton.dataset.deleteStory);
      const reaction = event.target.closest("[data-react-story]");
      if (reaction) return reactToStory(reaction.dataset.reactStory, reaction.dataset.emoji);
      const menu = event.target.closest("[data-post-menu]");
      if (menu) {
        const post = state.posts.find(item => String(item.id) === String(menu.dataset.postMenu));
        if (post?.user_id === currentUserId()) {
          if (window.confirm("Delete this post? This cannot be undone.")) {
            supabase.from("posts").delete().eq("id", post.id).eq("user_id", currentUserId()).then(({ error }) => {
              if (error) toast("Could not delete this post.");
              else { toast("Post deleted."); loadFeed(); }
            });
          }
        } else {
          toast("Post options are limited for other people's posts.");
        }
      }
    });
    document.addEventListener("submit", event => {
      if (event.target.matches("[data-comment-form]")) submitComment(event);
    });
    ["postDialog", "storyDialog", "storyViewer", "messagesDialog"].forEach(id => {
      const dialog = document.getElementById(id);
      dialog.addEventListener("click", event => {
        if (event.target === dialog) closeDialog(id);
      });
    });
  }

  async function init() {
    bindEvents();
    await getSessionAndProfile();
    await restoreStoryDraft();

    if (window.location.hash === "#profile") {
      setActiveNavigation("profile");
      toast("The Profile page will be added after Home is complete.");
    }

    if (currentUserId()) {
      const showTrending = window.location.hash === "#trending";
      await Promise.allSettled([
        loadFeed(showTrending ? "trending" : "latest"),
        loadStories(),
        loadSuggestions()
      ]);

      if (showTrending) {
        setActiveNavigation("trending");
        document.body.classList.add("trending-mode");
        $("#feedTitle").textContent = "Trending";
      }

      if (window.location.hash === "#messages") {
        await openMessages();
      }
    } else {
      $("#feed").innerHTML = '<div class="panel loading-card">Sign in to see your ARS feed.</div>';
      $("#storiesLoading").textContent = "Sign in to see stories.";
      if (window.location.hash === "#messages") {
        toast("Sign in to open your messages.");
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(error => {
      console.error("ARS Home initialization failed:", error);
      toast("Home could not finish loading. Refresh the page and try again.");
    });
  });
})();