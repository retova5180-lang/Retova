(() => {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const STORAGE = { user: "ars_user", loggedIn: "ars_logged_in" };
  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  let currentUser = null;
  let selectedPostFile = null;
  let selectedStoryFile = null;
  let stories = [];
  let activeCommentPostId = null;
  let activePost = null;
  let previewUrls = [];
  let hiddenPostIds = new Set();

  try {
    hiddenPostIds = new Set(JSON.parse(localStorage.getItem("ars_hidden_posts") || "[]"));
  } catch { hiddenPostIds = new Set(); }

  function readLocalUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE.user) || "{}"); }
    catch { return {}; }
  }

  function showMessage(title, body) {
    $("#messageTitle").textContent = title;
    $("#messageBody").textContent = body;
    openDialog("messageDialog");
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog && !dialog.open) dialog.showModal();
  }

  function closeDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog?.open) dialog.close();
  }

  function avatarMarkup(user, extra = "") {
    const photo = typeof user?.avatar === "string" ? user.avatar : "";
    const letter = user?.letter || user?.username?.[0]?.toUpperCase() || "A";
    const color = user?.letterColor || "#ffffff";
    const background = user?.background || "linear-gradient(135deg,#8b3dff,#c54dff)";
    if (photo && /^https:\/\//i.test(photo)) {
      return '<span class="avatar '+extra+'" style="background-image:url(&quot;'+escapeHTML(photo)+'&quot;)"></span>';
    }
    return '<span class="avatar '+extra+'" style="color:'+escapeHTML(color)+';background:'+escapeHTML(background)+'">'+escapeHTML(letter)+'</span>';
  }

  function setProfileHeader() {
    const name = currentUser.display_name || currentUser.displayName || currentUser.username || "Welcome";
    $("#myName").textContent = name;
    $("#myHandle").textContent = currentUser.username ? "@"+currentUser.username : "@you";
    const avatar = $("#myAvatar");
    if (currentUser.avatar && /^https:\/\//i.test(currentUser.avatar)) {
      avatar.textContent = "";
      avatar.style.backgroundImage = 'url("'+currentUser.avatar.replace(/["\\]/g, "")+'")';
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
    } else {
      avatar.textContent = currentUser.letter || currentUser.username?.[0]?.toUpperCase() || "R";
      avatar.style.color = currentUser.letterColor || "#ffffff";
      avatar.style.background = currentUser.background || "linear-gradient(135deg,#8b3dff,#c54dff)";
    }
  }

  async function requireSession() {
    if (!client) throw new Error("ARS connection could not start. Reload the page and try again.");
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    if (!session?.user) {
      localStorage.setItem(STORAGE.loggedIn, "false");
      location.replace("index.html");
      return null;
    }
    const authUser = session.user;
    const local = readLocalUser();
    const { data: profile, error: profileError } = await client.from("users")
      .select("id,username,display_name,email,bio,avatar,cover,verified,plan,streak,xp,vip_badge_enabled")
      .eq("id", authUser.id).maybeSingle();
    if (profileError) throw new Error("Could not load your ARS profile: "+profileError.message);
    currentUser = {
      ...local, ...(profile || {}), id: authUser.id,
      username: profile?.username || local.username || authUser.user_metadata?.username || "",
      displayName: profile?.display_name || local.displayName || authUser.user_metadata?.display_name || "",
      avatar: profile?.avatar || local.avatar || "",
      letter: local.letter || local.profileLetter || local.username?.[0]?.toUpperCase() || "R",
      letterColor: local.letterColor || local.letter_color || "#ffffff",
      background: local.background || "linear-gradient(135deg,#8b3dff,#c54dff)"
    };
    localStorage.setItem(STORAGE.user, JSON.stringify(currentUser));
    localStorage.setItem(STORAGE.loggedIn, "true");
    return currentUser;
  }

  async function resolvePostMedia(post) {
    if (!post.image) return "";
    if (/^https?:\/\//i.test(post.image)) return post.image;
    if (post.privacy === "public") {
      const { data } = client.storage.from("post-media").getPublicUrl(post.image);
      return data?.publicUrl || "";
    }
    const { data, error } = await client.storage.from("private-post-media").createSignedUrl(post.image, 1800);
    if (error) {
      console.warn("Private post media unavailable:", error.message);
      return "";
    }
    return data?.signedUrl || "";
  }

  async function loadFeed() {
    const feed = $("#feed");
    feed.innerHTML = '<div class="empty-state">Loading your feed…</div>';
    const { data: posts, error } = await client.from("posts")
      .select("id,created_at,user_id,content,image,media_type,privacy,likes_count,comments_count,reposts_count,views_count,allow_comments")
      .or("privacy.eq.public,privacy.eq.followers,and(privacy.eq.private,user_id.eq."+currentUser.id+")")
      .order("created_at", { ascending: false }).limit(30);
    if (error) {
      console.error("Feed load failed:", error);
      feed.innerHTML = '<div class="empty-state">We couldn’t load the feed. Please try again.</div>';
      return;
    }
    const visible = (posts || []).filter(post => !hiddenPostIds.has(post.id));
    if (!visible.length) {
      feed.innerHTML = '<div class="empty-state">Your feed is quiet for now.<br>Be the first to share something with ARS.</div>';
      return;
    }
    const postIds = visible.map(post => post.id);
    const userIds = [...new Set(visible.map(post => post.user_id).filter(Boolean))];
    const [userResult, likeResult, bookmarkResult, repostResult] = await Promise.all([
      client.from("users").select("id,username,display_name,avatar,verified").in("id", userIds),
      client.from("likes").select("post_id").eq("user_id", currentUser.id).in("post_id", postIds),
      client.from("bookmarks").select("post_id").eq("user_id", currentUser.id).in("post_id", postIds),
      client.from("reposts").select("post_id").eq("user_id", currentUser.id).in("post_id", postIds)
    ]);
    for (const result of [userResult, likeResult, bookmarkResult, repostResult]) {
      if (result.error) console.warn("Feed detail query:", result.error.message);
    }
    const userMap = new Map((userResult.data || []).map(user => [user.id, user]));
    const liked = new Set((likeResult.data || []).map(row => row.post_id));
    const saved = new Set((bookmarkResult.data || []).map(row => row.post_id));
    const reposted = new Set((repostResult.data || []).map(row => row.post_id));
    const displayPosts = await Promise.all(visible.map(async post => ({
      ...post, displayImage: await resolvePostMedia(post)
    })));
    feed.innerHTML = displayPosts.map(post => renderPost(
      post, userMap.get(post.user_id) || {}, liked.has(post.id), saved.has(post.id), reposted.has(post.id)
    )).join("");
  }

  function renderPost(post, user, isLiked, isSaved, isReposted) {
    const name = user.display_name || user.username || "ARS member";
    const handle = user.username ? "@"+user.username : "member";
    const date = post.created_at ? new Date(post.created_at).toLocaleString([], {
      month:"short", day:"numeric", hour:"numeric", minute:"2-digit"
    }) : "";
    let media = "";
    if (post.displayImage) {
      if (post.media_type === "video") {
        media = '<video class="post-media" src="'+escapeHTML(post.displayImage)+'" controls playsinline preload="metadata"></video>';
      } else {
        media = '<img class="post-media" src="'+escapeHTML(post.displayImage)+'" alt="Post media" loading="lazy">';
      }
    }
    const commentsDisabled = post.allow_comments === false;
    return '<article class="post-card" data-post-id="'+escapeHTML(post.id)+'">'+
      '<div class="post-head">'+avatarMarkup(user)+'<div class="post-author"><strong>'+escapeHTML(name)+(user.verified?' <span style="color:#c17bff" aria-label="Verified">◆</span>':'')+'</strong><small>'+escapeHTML(handle)+' · '+escapeHTML(date)+'</small></div><button class="post-menu" data-action="menu" aria-label="Post options">⋯</button></div>'+
      (post.content ? '<p class="post-content">'+escapeHTML(post.content)+'</p>' : '')+media+
      '<div class="post-actions">'+
      '<button class="post-action '+(isLiked?'active':'')+'" data-action="like" aria-pressed="'+isLiked+'">♡ '+Number(post.likes_count||0)+'</button>'+
      '<button class="post-action" data-action="comment" '+(commentsDisabled?'disabled aria-disabled="true" title="Comments are turned off"':'')+'>▢ '+Number(post.comments_count||0)+'</button>'+
      '<button class="post-action '+(isReposted?'active':'')+'" data-action="repost" aria-pressed="'+isReposted+'">⟳ '+Number(post.reposts_count||0)+'</button>'+
      '<button class="post-action '+(isSaved?'active':'')+'" data-action="bookmark" aria-pressed="'+isSaved+'">'+(isSaved?'✓ Saved':'♧ Save')+'</button></div></article>';
  }

  async function loadStories() {
    const row = $("#storiesRow");
    const { data, error } = await client.from("stories")
      .select("id,user_id,image,media_type,story_text,created_at,expires_at,privacy")
      .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }).limit(50);
    if (error) {
      console.warn("Stories load failed:", error.message);
      stories = [];
      row.innerHTML = '<button class="story-item add-story" id="addStory"><span class="story-ring"><b>＋</b></span><small>Your story</small></button><p class="story-empty">Stories could not be loaded.</p>';
      return;
    }
    stories = data || [];
    const ids = [...new Set(stories.map(story => story.user_id).filter(Boolean))];
    const { data: users, error: usersError } = ids.length
      ? await client.from("users").select("id,username,display_name,avatar").in("id", ids)
      : { data: [], error: null };
    if (usersError) console.warn("Story profiles:", usersError.message);
    const userMap = new Map((users || []).map(user => [user.id, user]));
    row.innerHTML = '<button class="story-item add-story" id="addStory"><span class="story-ring"><b>＋</b></span><small>Your story</small></button>'+
      stories.map((story, index) => {
        const user = userMap.get(story.user_id) || {};
        const label = user.username || user.display_name || "Story";
        const thumb = user.avatar && /^https:\/\//i.test(user.avatar)
          ? '<img src="'+escapeHTML(user.avatar)+'" alt="">'
          : '<span>'+escapeHTML(label[0]?.toUpperCase() || "A")+'</span>';
        return '<button class="story-item" data-story-index="'+index+'" aria-label="View '+escapeHTML(label)+' story"><span class="story-ring">'+thumb+'</span><small>'+escapeHTML(label)+'</small></button>';
      }).join("");
  }

  async function loadNotifications() {
    const { count, error } = await client.from("notifications")
      .select("id", { count:"exact", head:true }).eq("user_id", currentUser.id).eq("is_read", false);
    if (error) {
      console.warn("Notifications count:", error.message);
      return;
    }
    $("#notificationDot").classList.toggle("hidden", !(count > 0));
  }

  async function openActivity() {
    const list = $("#activityList");
    list.innerHTML = '<p class="muted">Loading activity…</p>';
    openDialog("activityDialog");
    const { data, error } = await client.from("notifications")
      .select("id,sender_id,type,post_id,is_read,metadata,created_at")
      .eq("user_id", currentUser.id).order("created_at", { ascending:false }).limit(50);
    if (error) { list.textContent = "Could not load activity: "+error.message; return; }
    if (!data?.length) { list.innerHTML = '<p class="muted">You’re all caught up.</p>'; return; }
    const senderIds = [...new Set(data.map(item => item.sender_id).filter(Boolean))];
    const { data: senders } = senderIds.length
      ? await client.from("users").select("id,username,display_name").in("id", senderIds)
      : { data: [] };
    const senderMap = new Map((senders || []).map(user => [user.id, user]));
    list.innerHTML = data.map(item => {
      const sender = senderMap.get(item.sender_id) || {};
      const label = sender.display_name || sender.username || "Someone";
      const type = String(item.type || "activity").replace(/[_-]/g, " ");
      return '<button class="activity-item '+(item.is_read?'':'unread')+'" data-notification-id="'+escapeHTML(item.id)+'"><strong>'+escapeHTML(label)+'</strong> '+escapeHTML(type)+'<small>'+escapeHTML(new Date(item.created_at).toLocaleString())+'</small></button>';
    }).join("");
    const unread = data.filter(item => !item.is_read).map(item => item.id);
    if (unread.length) {
      const { error: markError } = await client.from("notifications").update({ is_read:true }).in("id", unread);
      if (!markError) $("#notificationDot").classList.add("hidden");
      else console.warn("Could not mark notifications read:", markError.message);
    }
  }

  async function uploadMedia(file, bucket, folder) {
    if (!file) throw new Error("Choose a file first.");
    const maxBytes = 100 * 1024 * 1024;
    if (file.size > maxBytes) throw new Error("The selected file is larger than 100 MB.");
    if (!/^image\//.test(file.type) && !/^video\//.test(file.type)) throw new Error("Only image and video files are supported.");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "upload";
    const path = currentUser.id+"/"+folder+"/"+crypto.randomUUID()+"-"+safeName;
    const { data, error } = await client.storage.from(bucket).upload(path, file, {
      cacheControl:"3600", upsert:false, contentType:file.type
    });
    if (error) throw error;
    if (bucket === "post-media") {
      const { data: publicData } = client.storage.from(bucket).getPublicUrl(data.path);
      return publicData.publicUrl;
    }
    return data.path;
  }

  function previewFile(file, target) {
    const box = $("#"+target);
    box.replaceChildren();
    if (!file) return;
    const url = URL.createObjectURL(file);
    previewUrls.push(url);
    const element = document.createElement(file.type.startsWith("video/") ? "video" : "img");
    element.src = url;
    if (element.tagName === "VIDEO") { element.controls = true; element.playsInline = true; }
    box.appendChild(element);
  }

  function releasePreviews() {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    previewUrls = [];
  }

  $("#createPost").addEventListener("click", () => openDialog("postDialog"));
  $("#postMedia").addEventListener("change", event => {
    selectedPostFile = event.target.files?.[0] || null;
    previewFile(selectedPostFile, "mediaPreview");
  });
  $("#storyMedia").addEventListener("change", event => {
    selectedStoryFile = event.target.files?.[0] || null;
    previewFile(selectedStoryFile, "storyPreview");
  });

  $("#postForm").addEventListener("submit", async event => {
    event.preventDefault();
    const message = $("#postMessage");
    const content = $("#postContent").value.trim();
    if (!content && !selectedPostFile) { message.textContent = "Write something or attach a photo or video first."; return; }
    const button = event.submitter;
    button.disabled = true;
    message.textContent = "Publishing…";
    try {
      let image = null;
      let mediaType = "text";
      if (selectedPostFile) {
        mediaType = selectedPostFile.type.startsWith("video/") ? "video" : "image";
        const bucket = $("#postPrivacy").value === "public" ? "post-media" : "private-post-media";
        image = await uploadMedia(selectedPostFile, bucket, "posts");
      }
      const hashtags = [...content.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(match => match[1]);
      const { error } = await client.from("posts").insert({
        user_id:currentUser.id, content, image, media_type:mediaType,
        privacy:$("#postPrivacy").value, allow_comments:$("#allowComments").checked,
        hashtags, mentions:[]
      });
      if (error) throw error;
      $("#postContent").value = "";
      $("#postMedia").value = "";
      $("#mediaPreview").replaceChildren();
      selectedPostFile = null;
      releasePreviews();
      closeDialog("postDialog");
      await loadFeed();
    } catch (error) {
      console.error("Publish post:", error);
      message.textContent = error.message || "Could not publish your post.";
    } finally { button.disabled = false; }
  });

  $("#storyForm").addEventListener("submit", async event => {
    event.preventDefault();
    const message = $("#storyMessage");
    if (!selectedStoryFile) { message.textContent = "Choose an image or video first."; return; }
    const button = event.submitter;
    button.disabled = true;
    message.textContent = "Uploading story…";
    try {
      const privacy = $("#storyPrivacy").value;
      const image = await uploadMedia(selectedStoryFile, "story-media", "stories");
      const mediaType = selectedStoryFile.type.startsWith("video/") ? "video" : "image";
      const { error } = await client.from("stories").insert({
        user_id:currentUser.id, image, media_type:mediaType,
        story_text:$("#storyText").value.trim(), privacy,
        expires_at:new Date(Date.now()+86400000).toISOString()
      });
      if (error) throw error;
      $("#storyText").value = "";
      $("#storyMedia").value = "";
      $("#storyPreview").replaceChildren();
      selectedStoryFile = null;
      releasePreviews();
      closeDialog("storyDialog");
      await loadStories();
    } catch (error) {
      console.error("Publish story:", error);
      message.textContent = error.message || "Could not share story.";
    } finally { button.disabled = false; }
  });

  async function toggleRelation(table, postId, button, activeLabel, inactiveLabel) {
    const { data: existing, error: findError } = await client.from(table)
      .select("id").eq("post_id", postId).eq("user_id", currentUser.id).maybeSingle();
    if (findError) throw findError;
    if (existing) {
      const { error } = await client.from(table).delete().eq("id", existing.id);
      if (error) throw error;
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
      if (inactiveLabel) button.textContent = inactiveLabel;
    } else {
      const { error } = await client.from(table).insert({ post_id:postId, user_id:currentUser.id });
      if (error) throw error;
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
      if (activeLabel) button.textContent = activeLabel;
    }
  }

  $("#feed").addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const card = button.closest("[data-post-id]");
    const postId = card?.dataset.postId;
    if (!postId) return;
    const action = button.dataset.action;
    button.disabled = true;
    try {
      if (action === "like") {
        await toggleRelation("likes", postId, button, null, null);
        await loadFeed();
      } else if (action === "bookmark") {
        await toggleRelation("bookmarks", postId, button, "✓ Saved", "♧ Save");
      } else if (action === "repost") {
        await toggleRelation("reposts", postId, button, null, null);
      } else if (action === "comment") {
        activeCommentPostId = postId;
        await loadComments(postId);
        openDialog("commentsDialog");
      } else if (action === "menu") {
        await openPostOptions(postId);
      }
    } catch (error) {
      console.error("Post action:", error);
      showMessage("Action failed", error.message || "Please try again.");
    } finally { button.disabled = false; }
  });

  async function openPostOptions(postId) {
    const { data: post, error } = await client.from("posts")
      .select("id,user_id,content,privacy,allow_comments").eq("id", postId).maybeSingle();
    if (error) throw error;
    if (!post) { showMessage("Post unavailable", "This post may have been deleted or is no longer visible."); return; }
    activePost = post;
    const own = post.user_id === currentUser.id;
    const actions = own
      ? [["edit","Edit post"],["toggle-comments",post.allow_comments ? "Turn comments off" : "Turn comments on"],["delete","Delete post"]]
      : [["hide","Hide from my feed"],["report","Report account"],["block","Block account"],["copy","Copy post link"]];
    $("#postOptionsList").innerHTML = actions.map(([action,label]) =>
      '<button class="activity-item" data-post-option="'+action+'">'+label+'</button>').join("");
    $("#postOptionsMessage").textContent = "";
    openDialog("postOptionsDialog");
  }

  $("#postOptionsList").addEventListener("click", async event => {
    const button = event.target.closest("[data-post-option]");
    if (!button || !activePost) return;
    const action = button.dataset.postOption;
    const post = activePost;
    const message = $("#postOptionsMessage");
    button.disabled = true;
    message.textContent = "Please wait…";
    try {
      if (action === "edit") {
        const nextContent = prompt("Edit your post text:", post.content || "");
        if (nextContent === null) return;
        const nextPrivacy = prompt("Audience: public, followers, or private", post.privacy);
        if (nextPrivacy === null) return;
        if (!["public","followers","private"].includes(nextPrivacy)) throw new Error("Invalid audience.");
        const { error } = await client.from("posts").update({ content:nextContent.trim(), privacy:nextPrivacy })
          .eq("id", post.id).eq("user_id", currentUser.id);
        if (error) throw error;
        closeDialog("postOptionsDialog");
        await loadFeed();
      } else if (action === "toggle-comments") {
        const { error } = await client.from("posts").update({ allow_comments:!post.allow_comments })
          .eq("id", post.id).eq("user_id", currentUser.id);
        if (error) throw error;
        closeDialog("postOptionsDialog");
        await loadFeed();
      } else if (action === "delete") {
        if (!confirm("Delete this post permanently?")) return;
        const { error } = await client.from("posts").delete().eq("id", post.id).eq("user_id", currentUser.id);
        if (error) throw error;
        closeDialog("postOptionsDialog");
        await loadFeed();
      } else if (action === "hide") {
        hiddenPostIds.add(post.id);
        localStorage.setItem("ars_hidden_posts", JSON.stringify([...hiddenPostIds]));
        closeDialog("postOptionsDialog");
        await loadFeed();
      } else if (action === "report") {
        const reason = prompt("Why are you reporting this account?", "inappropriate content");
        if (reason === null) return;
        const { error } = await client.from("reports").insert({
          reporter_id:currentUser.id, reported_user_id:post.user_id, reason:reason.trim() || "other"
        });
        if (error) throw error;
        message.textContent = "Report submitted. Thank you.";
      } else if (action === "block") {
        if (!confirm("Block this account? You will no longer see each other’s content.")) return;
        const { error } = await client.from("blocks").insert({
          blocker_id:currentUser.id, blocked_id:post.user_id
        });
        if (error) throw error;
        closeDialog("postOptionsDialog");
        await loadFeed();
      } else if (action === "copy") {
        const url = new URL("home.html", location.href);
        url.hash = "post-"+post.id;
        await navigator.clipboard.writeText(url.href);
        message.textContent = "Post link copied.";
      }
    } catch (error) {
      console.error("Post option:", error);
      message.textContent = error.message || "Could not complete this action.";
    } finally { button.disabled = false; }
  });

  async function loadComments(postId) {
    const list = $("#commentsList");
    list.innerHTML = '<p class="muted">Loading comments…</p>';
    const { data, error } = await client.from("comments")
      .select("id,user_id,content,created_at").eq("post_id", postId)
      .order("created_at", { ascending:true }).limit(100);
    if (error) { list.textContent = "Could not load comments: "+error.message; return; }
    if (!data?.length) { list.innerHTML = '<p class="muted">No comments yet. Start the conversation.</p>'; return; }
    const ids = [...new Set(data.map(comment => comment.user_id).filter(Boolean))];
    const { data: users } = ids.length
      ? await client.from("users").select("id,username,display_name").in("id", ids)
      : { data:[] };
    const userMap = new Map((users || []).map(user => [user.id,user]));
    list.innerHTML = data.map(comment => {
      const user = userMap.get(comment.user_id) || {};
      return '<article class="comment-item"><strong>'+escapeHTML(user.display_name || user.username || "ARS member")+'</strong><small>'+escapeHTML(new Date(comment.created_at).toLocaleString())+'</small><p>'+escapeHTML(comment.content)+'</p></article>';
    }).join("");
  }

  $("#commentForm").addEventListener("submit", async event => {
    event.preventDefault();
    const input = $("#commentInput");
    const message = $("#commentMessage");
    const button = event.submitter;
    const content = input.value.trim();
    if (!activeCommentPostId || !content) return;
    button.disabled = true;
    message.textContent = "Sending…";
    try {
      const { data: post, error: postError } = await client.from("posts")
        .select("allow_comments").eq("id", activeCommentPostId).maybeSingle();
      if (postError) throw postError;
      if (!post || post.allow_comments === false) throw new Error("Comments are turned off for this post.");
      const { error } = await client.from("comments").insert({
        post_id:activeCommentPostId, user_id:currentUser.id, content
      });
      if (error) throw error;
      input.value = "";
      message.textContent = "";
      await loadComments(activeCommentPostId);
      await loadFeed();
    } catch (error) {
      message.textContent = error.message || "Could not send comment.";
    } finally { button.disabled = false; }
  });

  $("#storiesRow").addEventListener("click", async event => {
    if (event.target.closest("#addStory")) { openDialog("storyDialog"); return; }
    const item = event.target.closest("[data-story-index]");
    if (!item) return;
    const story = stories[Number(item.dataset.storyIndex)];
    if (!story) return;
    try {
      let mediaUrl = story.image;
      if (!/^https?:\/\//i.test(mediaUrl)) {
        const { data, error } = await client.storage.from("story-media").createSignedUrl(mediaUrl, 1800);
        if (error) throw error;
        mediaUrl = data.signedUrl;
      }
      const content = $("#storyViewerContent");
      content.replaceChildren();
      const media = document.createElement(story.media_type === "video" ? "video" : "img");
      media.src = mediaUrl;
      if (media.tagName === "VIDEO") { media.controls = true; media.autoplay = true; media.playsInline = true; }
      content.appendChild(media);
      if (story.story_text) {
        const caption = document.createElement("div");
        caption.className = "story-caption";
        caption.textContent = story.story_text;
        content.appendChild(caption);
      }
      openDialog("storyViewer");
      const { error: viewError } = await client.from("story_views").insert({
        story_id:story.id, viewer_id:currentUser.id
      });
      if (viewError && !/duplicate/i.test(viewError.message)) console.warn("Story view:", viewError.message);
    } catch (error) {
      console.error("Open story:", error);
      showMessage("Story unavailable", error.message || "This story could not be opened.");
    }
  });

  $("#spinWheel").addEventListener("click", () => openDialog("wheelDialog"));
  $("#confirmSpin").addEventListener("click", async event => {
    const button = event.currentTarget;
    const status = $("#spinStatus");
    const result = $("#wheelResult");
    button.disabled = true;
    status.textContent = "Spinning…";
    try {
      const { data, error } = await client.rpc("spin_rewards_wheel");
      if (error) throw error;
      const reward = Array.isArray(data) ? data[0] : data;
      result.textContent = reward?.title || reward?.message || reward?.reward_code || "Your spin has been recorded. Check your rewards.";
      status.textContent = "Your wheel result was returned by ARS.";
      $("#wheelHint").textContent = "Spin recorded";
    } catch (error) {
      console.error("Wheel:", error);
      status.textContent = error.message || "Wheel is temporarily unavailable.";
    } finally { button.disabled = false; }
  });

  document.addEventListener("click", event => {
    const closer = event.target.closest("[data-close]");
    if (closer) closeDialog(closer.dataset.close);
  });

  $("#refreshFeed").addEventListener("click", () => loadFeed());
  $("#profileShortcut").addEventListener("click", () => showMessage("Profile", "The profile page is not being changed in this stage."));
  $("#openSearch").addEventListener("click", () => { location.href = "search.html"; });
  $("#navSearch").addEventListener("click", () => { location.href = "search.html"; });
  $("#openNotifications").addEventListener("click", () => openActivity());
  $("#navNotifications").addEventListener("click", () => openActivity());
  $("#navStreak").addEventListener("click", () => openDialog("streakDialog"));

  $("#streakInviteForm").addEventListener("submit", async event => {
    event.preventDefault();
    const input = $("#streakUsername");
    const message = $("#streakMessage");
    const button = event.submitter;
    const username = input.value.trim().replace(/^@/, "");
    if (!username) return;
    button.disabled = true;
    message.textContent = "Sending invitation…";
    try {
      const { data, error } = await client.rpc("send_streak_invite", { p_to_username:username });
      if (error) throw error;
      message.textContent = data?.message || "Invitation sent.";
      input.value = "";
    } catch (error) {
      message.textContent = error.message || "Could not send invitation.";
    } finally { button.disabled = false; }
  });

  async function start() {
    try {
      const user = await requireSession();
      if (!user) return;
      setProfileHeader();
      const results = await Promise.allSettled([loadFeed(), loadStories(), loadNotifications()]);
      results.forEach((result, index) => {
        if (result.status === "rejected") console.error("Home section failed:", index, result.reason);
      });
    } catch (error) {
      console.error("ARS home startup:", error);
      showMessage("Could not open ARS", error.message || "Please sign in again.");
    }
  }

  start();
})();