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
    mediaFile: null,
    mediaUrl: "",
    storyFile: null,
    storyUrl: "",
    storyDraftMediaPath: "",
    storyRotation: 0,
    storyZoom: 1,
    storyCropMode: false,
    storyDrawingEnabled: false,
    storyDrawingStrokes: [],
    storyCurrentStroke: null,
    storyDraftTimer: null,
    likes: new Set(),
    comments: new Map()
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

  async function loadFeed() {
    const feed = $("#feed");
    const empty = $("#feedEmpty");
    feed.innerHTML = '<div class="panel loading-card">Loading your feed…</div>';
    empty.classList.add("hidden");

    if (!supabase) {
      feed.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .select("id, created_at, user_id, content, image, likes_count, comments_count, reposts_count, views_count, media_type, privacy, location, mentions, hashtags, allow_comments")
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
      $("#feedEmpty p").textContent = "Follow people or share your first moment to get things moving.";
      return;
    }

    const displayRows = await Promise.all(rows.map(async post => ({
      ...post,
      image: await resolvePostMedia(post.image)
    })));
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
      '<div class="post-actions"><button class="post-action" type="button" data-like="' + escapeHTML(post.id) + '"><span aria-hidden="true">♡</span><span>Like</span></button><button class="post-action" type="button" data-comment-focus="' + escapeHTML(post.id) + '"><span aria-hidden="true">▢</span><span>Comment</span></button><button class="post-action" type="button" data-share="' + escapeHTML(post.id) + '"><span aria-hidden="true">↗</span><span>Share</span></button><button class="post-action" type="button" data-save="' + escapeHTML(post.id) + '"><span aria-hidden="true">♧</span><span>Save</span></button></div>' +
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
    const { data, error } = await supabase.from("users")
      .select("id, username, display_name, avatar, verified")
      .neq("id", currentUserId())
      .limit(5);
    if (error) {
      $("#suggestedUsers").innerHTML = '<p class="muted">Suggestions are unavailable right now.</p>';
      return;
    }
    const users = data || [];
    if (!users.length) {
      $("#suggestedUsers").innerHTML = '<p class="muted">You’re all caught up.</p>';
      return;
    }
    $("#suggestedUsers").innerHTML = users.map(user => {
      const title = user.display_name || user.username || "ARS member";
      const avatar = user.avatar
        ? '<img class="avatar" src="' + escapeHTML(user.avatar) + '" alt="">'
        : '<span class="avatar">' + escapeHTML(title.charAt(0).toUpperCase()) + "</span>";
      return '<div class="suggested-user">' + avatar + '<div class="suggested-info"><strong>' + escapeHTML(title) + '</strong><span>' + escapeHTML(user.username ? "@" + user.username : "ARS member") + '</span></div><button class="follow-button" data-follow="' + escapeHTML(user.id) + '" type="button">Follow</button></div>';
    }).join("");
  }

  async function loadStories() {
    const row = $("#storiesRow");
    $("#storiesLoading")?.remove();
    if (!supabase) return;
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("stories")
      .select("id, created_at, user_id, image, viewers_count, expires_at, media_type, story_text, text_color, filter, location, mentions, hashtags, original_image, rotation_degrees, zoom, privacy")
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

    if (currentUserId()) {
      const followedIds = new Set(stories.map(story => story.user_id));
      const { data: suggested, error: suggestionError } = await supabase
        .from("users")
        .select("id, username, display_name, avatar")
        .neq("id", currentUserId())
        .limit(8);
      if (!suggestionError) {
        (suggested || []).filter(user => !followedIds.has(user.id)).slice(0, 6).forEach(user => {
          const name = user.display_name || user.username || "ARS member";
          const avatar = user.avatar
            ? '<img class="avatar" src="' + escapeHTML(user.avatar) + '" alt="">'
            : '<span class="avatar">' + escapeHTML(name.charAt(0).toUpperCase()) + "</span>";
          const suggestion = document.createElement("div");
          suggestion.className = "story-item suggested-story";
          suggestion.innerHTML = '<span class="story-ring">' + avatar + '</span><span>' + escapeHTML(name) + '</span>';
          row.append(suggestion);
        });
      }
    }
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

  function setStoryPreviewFilter() {
    const image = $("#storyImagePreview");
    const video = $("#storyVideoPreview");
    const filter = $("#storyFilter").value;
    [image, video].forEach(element => {
      element.style.filter = filter === "none" ? "none" : filter;
      element.style.transform = "rotate(" + state.storyRotation + "deg) scale(" + state.storyZoom + ")";
      element.style.objectFit = state.storyCropMode ? "cover" : "contain";
    });
  }

  function redrawStoryDrawing() {
    const canvas = $("#storyDrawingCanvas");
    if (!canvas) return;
    const preview = $("#storyPreview");
    const width = Math.max(1, preview.clientWidth);
    const height = Math.max(1, preview.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    state.storyDrawingStrokes.forEach(stroke => {
      if (!Array.isArray(stroke.points) || stroke.points.length < 1) return;
      context.strokeStyle = stroke.color || "#ffffff";
      context.lineWidth = stroke.width || 4;
      context.beginPath();
      context.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      stroke.points.slice(1).forEach(point => context.lineTo(point.x * canvas.width, point.y * canvas.height));
      if (stroke.points.length === 1) {
        context.lineTo(stroke.points[0].x * canvas.width + 0.1, stroke.points[0].y * canvas.height + 0.1);
      }
      context.stroke();
    });
  }

  function setStoryDrawingEnabled(enabled) {
    state.storyDrawingEnabled = enabled;
    const canvas = $("#storyDrawingCanvas");
    const button = $("#storyDraw");
    canvas.classList.toggle("drawing-active", enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.textContent = enabled ? "✓ Finish drawing" : "✎ Draw";
    $("#storyEditorHint").textContent = enabled
      ? "Draw directly on the photo with your finger or mouse."
      : "Edits autosave to your account. Use Undo to remove the last drawing stroke.";
  }

  function updateStoryText() {
    const overlay = $("#storyTextOverlay");
    overlay.textContent = $("#storyText").value;
    overlay.style.color = $("#storyTextColor").value;
  }

  function resetStoryPreview() {
    if (state.storyUrl) URL.revokeObjectURL(state.storyUrl);
    state.storyFile = null;
    state.storyUrl = "";
    state.storyRotation = 0;
    state.storyZoom = 1;
    state.storyCropMode = false;
    state.storyDrawingStrokes = [];
    state.storyCurrentStroke = null;
    setStoryDrawingEnabled(false);
    $("#storyCrop").textContent = "□ Crop";
    $("#storyMedia").value = "";
    $("#storyPreview").classList.add("hidden");
    $("#storyImagePreview").classList.add("hidden");
    $("#storyVideoPreview").classList.add("hidden");
    $("#storyImagePreview").removeAttribute("src");
    $("#storyVideoPreview").removeAttribute("src");
    $("#storyText").value = "";
    $("#storyTextOverlay").textContent = "";
    $("#storyFilter").value = "none";
    redrawStoryDrawing();
  }

  async function handleStoryFile(file) {
    resetStoryPreview();
    state.storyDraftMediaPath = "";
    if (!file) {
      scheduleStoryDraftSave();
      return;
    }
    if (!/^(image|video)\//.test(file.type)) {
      setMessage("#storyMessage", "Choose a photo or video for your story.", "error");
      return;
    }
    state.storyFile = file;
    state.storyUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    const target = isVideo ? $("#storyVideoPreview") : $("#storyImagePreview");
    target.src = state.storyUrl;
    target.classList.remove("hidden");
    $("#storyPreview").classList.remove("hidden");
    setStoryPreviewFilter();
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
      cropMode: state.storyCropMode,
      drawingStrokes: state.storyDrawingStrokes
    };
  }

  async function persistStoryDraft() {
    const draft = readStoryDraftFields();
    try {
      localStorage.setItem("ars_story_draft", JSON.stringify(draft));
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
    state.storyRotation = Number(draft.rotation || 0);
    state.storyZoom = Number(draft.zoom || 1);
    state.storyCropMode = Boolean(draft.cropMode);
    state.storyDrawingStrokes = Array.isArray(draft.drawingStrokes) ? draft.drawingStrokes : [];
    redrawStoryDrawing();
    updateStoryText();
    setStoryPreviewFilter();
  }

  async function restoreStoryDraft() {
    let draft = null;
    let mediaPath = "";
    try {
      draft = JSON.parse(localStorage.getItem("ars_story_draft") || "null");
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
      const url = await uploadMedia(sourceFile, "story-media");
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
        media_type: state.storyFile.type.startsWith("video/") ? "video" : "image",
        story_text: $("#storyText").value.trim(),
        text_color: $("#storyTextColor").value,
        filter: $("#storyFilter").value,
        zoom: state.storyZoom,
        rotation_degrees: state.storyRotation,
        drawing_data: state.storyDrawingStrokes,
        location: $("#storyLocation").value.trim() || null,
        mentions,
        hashtags,
        expires_at: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
        privacy: $("#storyPrivacy").value,
        viewers_count: 0
      };
      const { error } = await supabase.from("stories").insert(story);
      if (error) throw error;
      localStorage.removeItem("ars_story_draft");
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

  function storyDrawingMarkup(value) {
    let strokes = value;
    if (typeof strokes === "string") {
      try {
        strokes = JSON.parse(strokes);
      } catch {
        strokes = [];
      }
    }
    if (!Array.isArray(strokes) || !strokes.length) return "";
    const paths = strokes.map(stroke => {
      const points = Array.isArray(stroke.points) ? stroke.points : [];
      if (!points.length) return "";
      const coordinates = points.map(point => ({
        x: Math.max(0, Math.min(1, Number(point.x) || 0)) * 1000,
        y: Math.max(0, Math.min(1, Number(point.y) || 0)) * 1000
      }));
      const path = coordinates.map((point, index) =>
        (index === 0 ? "M " : "L ") + point.x.toFixed(2) + " " + point.y.toFixed(2)
      ).join(" ");
      const color = /^#[0-9a-f]{3,8}$/i.test(stroke.color || "") ? stroke.color : "#ffffff";
      const width = Math.max(1, Math.min(24, Number(stroke.width) || 4));
      return '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="' + width + '" stroke-linecap="round" stroke-linejoin="round"></path>';
    }).join("");
    return paths ? '<svg class="viewer-drawing" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">' + paths + "</svg>" : "";
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
    $("#storyViewerContent").innerHTML = '<div class="viewer-media-wrap">' + media + storyDrawingMarkup(story.drawing_data) + "</div>" + (story.story_text ? '<div class="viewer-caption" style="color:' + escapeHTML(story.text_color || "#ffffff") + '">' + escapeHTML(story.story_text) + "</div>" : "");
    $("#storyViewerFooter").innerHTML = '<button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="💜">💜</button><button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="🔥">🔥</button><button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="😂">😂</button><button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="😍">😍</button><button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="👏">👏</button><button type="button" data-react-story="' + escapeHTML(story.id) + '" data-emoji="😮">😮</button><span class="muted" id="storyViewsCount">' + Number(story.viewers_count || 0) + " views</span><div class=\"story-viewer-list\" id=\"storyViewerList\"></div>";
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

  async function loadWheelContent() {
    const status = $("#wheelStatus");
    const challengesTarget = $("#wheelChallenges");
    const rewardsTarget = $("#wheelRewards");
    const userId = currentUserId();

    status.textContent = "Loading rewards and challenges…";
    challengesTarget.innerHTML = '<p class="muted">Loading challenges…</p>';
    rewardsTarget.innerHTML = '<p class="muted">Loading rewards…</p>';

    const challengeResult = await supabase
      .from("wheel_challenges")
      .select("id, title, category, reward_xp, image_required")
      .order("created_at", { ascending: false })
      .limit(30);

    if (challengeResult.error) {
      challengesTarget.innerHTML = '<p class="muted">Challenges are unavailable right now.</p>';
      console.warn("Wheel challenges load failed:", challengeResult.error.message);
    } else if (!challengeResult.data?.length) {
      challengesTarget.innerHTML = '<p class="muted">No challenges have been published yet.</p>';
    } else {
      challengesTarget.innerHTML = challengeResult.data.map(challenge =>
        '<article class="wheel-challenge"><div><strong>' + escapeHTML(challenge.title || "ARS challenge") +
        '</strong><span>' + escapeHTML(challenge.category || "Community") + '</span></div><b>' +
        Number(challenge.reward_xp || 0) + ' XP</b>' +
        (challenge.image_required ? '<small>Photo required</small>' : '') + '</article>'
      ).join("");
    }

    if (!userId) {
      rewardsTarget.innerHTML = '<p class="muted">Sign in to see your rewards.</p>';
      status.textContent = "Explore ARS challenges and rewards.";
      return;
    }

    const rewardResult = await supabase
      .from("user_rewards")
      .select("id, reward_code, reward_payload, starts_at, expires_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (rewardResult.error) {
      rewardsTarget.innerHTML = '<p class="muted">Your rewards could not be loaded.</p>';
      console.warn("User rewards load failed:", rewardResult.error.message);
    } else if (!rewardResult.data?.length) {
      rewardsTarget.innerHTML = '<p class="muted">Your earned rewards will appear here.</p>';
    } else {
      rewardsTarget.innerHTML = rewardResult.data.map(reward => {
        const payload = reward.reward_payload && typeof reward.reward_payload === "object"
          ? reward.reward_payload
          : {};
        const label = payload.title || payload.label || reward.reward_code || "ARS reward";
        const expires = reward.expires_at
          ? "Expires " + new Date(reward.expires_at).toLocaleDateString()
          : "No expiry listed";
        return '<article class="wheel-reward"><strong>' + escapeHTML(String(label)) +
          '</strong><span>' + escapeHTML(expires) + '</span></article>';
      }).join("");
    }

    status.textContent = "Your challenges and rewards.";
  }

  function navigate(section) {
    const destinations = {
      home: "home.html",
      search: "search.html",
      trending: "trending.html",
      messages: "messages.html",
      streak: "streak.html",
      profile: "profile.html",
      notifications: "notifications.html"
    };

    if (destinations[section] && section !== "home") {
      window.location.href = destinations[section];
      return;
    }

    if (section === "home") {
      window.location.href = destinations.home;
    }
  }

  function bindEvents() {
    $$("[data-open]").forEach(button => button.addEventListener("click", () => openDialog(button.dataset.open)));
    $$("[data-close]").forEach(button => button.addEventListener("click", () => closeDialog(button.dataset.close)));
    $$("[data-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.nav)));
    $("#openStory").addEventListener("click", () => openDialog("storyDialog"));
    $("#openWheel").addEventListener("click", () => {
      openDialog("wheelDialog");
      loadWheelContent().catch(error => {
        console.error("Rewards panel failed:", error);
        $("#wheelStatus").textContent = "Rewards are unavailable right now.";
      });
    });
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
    $("#storyText").addEventListener("input", () => { updateStoryText(); scheduleStoryDraftSave(); });
    $("#storyTextColor").addEventListener("input", () => { updateStoryText(); scheduleStoryDraftSave(); });
    ["#storyFilter", "#storyDuration", "#storyPrivacy", "#storyLocation", "#storyMention", "#storyHashtags"].forEach(selector => {
      $(selector).addEventListener("input", () => { setStoryPreviewFilter(); scheduleStoryDraftSave(); });
      $(selector).addEventListener("change", () => { setStoryPreviewFilter(); scheduleStoryDraftSave(); });
    });
    $("#storyRotate").addEventListener("click", () => {
      state.storyRotation = (state.storyRotation + 90) % 360;
      setStoryPreviewFilter();
      scheduleStoryDraftSave();
    });
    $("#storyCrop").addEventListener("click", () => {
      state.storyCropMode = !state.storyCropMode;
      $("#storyCrop").textContent = state.storyCropMode ? "□ Fit image" : "□ Crop";
      setStoryPreviewFilter();
      scheduleStoryDraftSave();
    });
    $("#storySticker").addEventListener("click", () => {
      const sticker = window.prompt("Enter a sticker or emoji to add to your story", "💜");
      if (sticker && sticker.trim()) {
        $("#storyText").value = ($("#storyText").value + " " + sticker.trim()).trim();
        updateStoryText();
        scheduleStoryDraftSave();
      }
    });
    $("#storyDraw").addEventListener("click", () => {
      setStoryDrawingEnabled(!state.storyDrawingEnabled);
    });
    $("#storyUndo").addEventListener("click", () => {
      if (state.storyCurrentStroke) state.storyCurrentStroke = null;
      else state.storyDrawingStrokes.pop();
      redrawStoryDrawing();
      scheduleStoryDraftSave();
    });
    const drawingCanvas = $("#storyDrawingCanvas");
    drawingCanvas.addEventListener("pointerdown", event => {
      if (!state.storyDrawingEnabled) return;
      event.preventDefault();
      drawingCanvas.setPointerCapture(event.pointerId);
      const bounds = drawingCanvas.getBoundingClientRect();
      state.storyCurrentStroke = { color: $("#storyTextColor").value, width: 4, points: [{
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height
      }] };
      state.storyDrawingStrokes.push(state.storyCurrentStroke);
      redrawStoryDrawing();
    });
    drawingCanvas.addEventListener("pointermove", event => {
      if (!state.storyDrawingEnabled || !state.storyCurrentStroke) return;
      const bounds = drawingCanvas.getBoundingClientRect();
      state.storyCurrentStroke.points.push({
        x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
        y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
      });
      redrawStoryDrawing();
    });
    const finishDrawing = () => {
      if (!state.storyCurrentStroke) return;
      state.storyCurrentStroke = null;
      scheduleStoryDraftSave();
    };
    drawingCanvas.addEventListener("pointerup", finishDrawing);
    drawingCanvas.addEventListener("pointercancel", finishDrawing);
    window.addEventListener("resize", redrawStoryDrawing);
    $("#storyZoom").addEventListener("click", () => {
      state.storyZoom = state.storyZoom >= 1.6 ? 1 : Math.round((state.storyZoom + .2) * 10) / 10;
      setStoryPreviewFilter();
      scheduleStoryDraftSave();
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
    ["postDialog", "storyDialog", "storyViewer"].forEach(id => {
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
    if (currentUserId()) {
      await Promise.allSettled([loadFeed(), loadStories(), loadSuggestions()]);
    } else {
      $("#feed").innerHTML = '<div class="panel loading-card">Sign in to see your ARS feed.</div>';
      $("#storiesLoading").textContent = "Sign in to see stories.";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(error => {
      console.error("ARS Home initialization failed:", error);
      toast("Home could not finish loading. Refresh the page and try again.");
    });
  });
})();