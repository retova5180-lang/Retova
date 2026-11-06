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
    const t = $("#messageTitle");
    const b = $("#messageBody");
    if (t) t.textContent = title;
    if (b) b.textContent = body;
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

  function formatCount(value) {
    const num = Number(value || 0);
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return "";
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m";
    if (diff < 86400) return Math.floor(diff / 3600) + "h";
    if (diff < 604800) return Math.floor(diff / 86400) + "d";
    return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric" });
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
    const myNameEl = $("#myName");
    const myHandleEl = $("#myHandle");
    if (myNameEl) myNameEl.textContent = name;
    if (myHandleEl) myHandleEl.textContent = currentUser.username ? "@"+currentUser.username : "@you";
    const avatar = $("#myAvatar");
    if (avatar) {
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
    if (!feed) return;
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
      feed.innerHTML = '<div class="empty-state">Your feed is quiet for now.<br>Be the first to share something on ARS.</div>';
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
    const timeAgo = formatTimeAgo(post.created_at);
    let media = "";
    if (post.displayImage) {
      if (post.media_type === "video") {
        media = '<div class="post-media-wrap"><video class="post-media" src="'+escapeHTML(post.displayImage)+'" controls playsinline preload="metadata"></video></div>';
      } else {
        media = '<div class="post-media-wrap"><img class="post-media" src="'+escapeHTML(post.displayImage)+'" alt="Post media" loading="lazy"></div>';
      }
    }
    const commentsDisabled = post.allow_comments === false;
    const verifiedBadge = user.verified
      ? '<span class="verified-badge" title="Verified"><svg viewBox="0 0 24 24" class="badge-svg"><path fill="#a855f7" d="M12 2l2.4 2.9 3.7-.4 1.4 3.4 3.4 1.4-.4 3.7 2.9 2.4-2.9 2.4.4 3.7-3.4 1.4-1.4 3.4-3.7-.4L12 22l-2.4-2.9-3.7.4-1.4-3.4-3.4-1.4.4-3.7L-1 12l2.9-2.4-.4-3.7 3.4-1.4 1.4-3.4 3.7.4L12 2z"/><path fill="#fff" d="M9.5 12.5l2 2 4.5-4.5"/></svg></span>'
      : '';

    return '<article class="post-card" data-post-id="'+escapeHTML(post.id)+'">'+
      '<div class="post-head">'+
        '<div class="post-author-row">'+
          avatarMarkup(user, "post-avatar")+
          '<div class="post-meta">'+
            '<div class="post-name-line">'+
              '<strong class="post-display-name">'+escapeHTML(name)+'</strong>'+
              verifiedBadge+
            '</div>'+
            '<small class="post-handle-line">'+escapeHTML(handle)+' · '+escapeHTML(timeAgo)+'</small>'+
          '</div>'+
        '</div>'+
        '<button class="post-menu-btn" data-action="menu" aria-label="Post options">⋯</button>'+
      '</div>'+
      (post.content ? '<p class="post-content">'+escapeHTML(post.content)+'</p>' : '')+media+
      '<div class="post-actions">'+
        '<button class="post-action '+(isLiked?'active liked':'')+'" data-action="like" aria-pressed="'+isLiked+'" aria-label="Like">'+
          '<svg viewBox="0 0 24 24" class="action-svg"><path fill="'+(isLiked?'#e11d48':'none')+'" stroke="'+(isLiked?'#e11d48':'currentColor')+'" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'+
          '<span class="count">'+formatCount(post.likes_count)+'</span>'+
        '</button>'+
        '<button class="post-action" data-action="comment" '+(commentsDisabled?'disabled aria-disabled="true" title="Comments disabled"':'')+' aria-label="Comment">'+
          '<svg viewBox="0 0 24 24" class="action-svg"><path fill="none" stroke="currentColor" stroke-width="2" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+
          '<span class="count">'+formatCount(post.comments_count)+'</span>'+
        '</button>'+
        '<button class="post-action '+(isReposted?'active reposted':'')+'" data-action="repost" aria-pressed="'+isReposted+'" aria-label="Repost">'+
          '<svg viewBox="0 0 24 24" class="action-svg"><path fill="none" stroke="'+(isReposted?'#10b981':'currentColor')+'" stroke-width="2" d="M17 1l4 4-4 4"/><path fill="none" stroke="'+(isReposted?'#10b981':'currentColor')+'" stroke-width="2" d="M3 11V9a4 4 0 0 1 4-4h14"/><path fill="none" stroke="'+(isReposted?'#10b981':'currentColor')+'" stroke-width="2" d="M7 23l-4-4 4-4"/><path fill="none" stroke="'+(isReposted?'#10b981':'currentColor')+'" stroke-width="2" d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>'+
          '<span class="count">'+formatCount(post.reposts_count)+'</span>'+
        '</button>'+
        '<div class="post-action views-action" aria-label="Views">'+
          '<svg viewBox="0 0 24 24" class="action-svg"><path fill="none" stroke="currentColor" stroke-width="2" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>'+
          '<span class="count">'+formatCount(post.views_count)+'</span>'+
        '</div>'+
        '<button class="post-action bookmark-action '+(isSaved?'active saved':'')+'" data-action="bookmark" aria-pressed="'+isSaved+'" aria-label="Save">'+
          '<svg viewBox="0 0 24 24" class="action-svg"><path fill="'+(isSaved?'#a855f7':'none')+'" stroke="'+(isSaved?'#a855f7':'currentColor')+'" stroke-width="2" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'+
        '</button>'+
      '</div>'+
    '</article>';
  }

  async function loadStories() {
    const row = $("#storiesRow");
    if (!row) return;
    const { data, error } = await client.from("stories")
      .select("id,user_id,image,media_type,story_text,created_at,expires_at,privacy")
      .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }).limit(50);
    if (error) {
      console.warn("Stories load failed:", error.message);
      stories = [];
      row.innerHTML = '<button class="story-item add-story" id="addStory" aria-label="Add story"><div class="story-avatar-wrap"><span class="story-avatar-self">＋</span></div><small>Your story</small></button>';
      return;
    }
    stories = data || [];
    const ids = [...new Set(stories.map(story => story.user_id).filter(Boolean))];
    const { data: users, error: usersError } = ids.length
      ? await client.from("users").select("id,username,display_name,avatar").in("id", ids)
      : { data: [], error: null };
    if (usersError) console.warn("Story profiles:", usersError.message);
    const userMap = new Map((users || []).map(user => [user.id, user]));

    const selfAvatarUrl = currentUser?.avatar && /^https:\/\//i.test(currentUser.avatar) ? currentUser.avatar : '';
    const selfThumb = selfAvatarUrl
      ? '<img class="story-img" src="'+escapeHTML(selfAvatarUrl)+'" alt="">'
      : '<span class="story-letter">'+escapeHTML(currentUser?.letter || "R")+'</span>';

    row.innerHTML = '<button class="story-item add-story" id="addStory" aria-label="Add story">'+
      '<div class="story-ring self-story-ring">'+selfThumb+'<span class="story-add-badge">＋</span></div>'+
      '<small>You</small></button>'+
      stories.map((story, index) => {
        const user = userMap.get(story.user_id) || {};
        const label = user.username || user.display_name || "Story";
        const thumb = user.avatar && /^https:\/\//i.test(user.avatar)
          ? '<img class="story-img" src="'+escapeHTML(user.avatar)+'" alt="">'
          : '<span class="story-letter">'+escapeHTML(label[0]?.toUpperCase() || "A")+'</span>';
        return '<button class="story-item" data-story-index="'+index+'" aria-label="View '+escapeHTML(label)+' story">'+
          '<div class="story-ring active-ring">'+thumb+'</div>'+
          '<small>'+escapeHTML(label)+'</small></button>';
      }).join("");
  }

  async function loadNotifications() {
    if (!currentUser) return;
    const { count, error } = await client.from("notifications")
      .select("id", { count:"exact", head:true }).eq("user_id", currentUser.id).eq("is_read", false);
    if (error) {
      console.warn("Notifications count:", error.message);
      return;
    }
    const dot = $("#notificationDot");
    if (dot) dot.classList.toggle("hidden", !(count > 0));
  }

  async function openActivity() {
    const list = $("#activityList");
    if (!list) return;
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
      if (!markError) {
        const dot = $("#notificationDot");
        if (dot) dot.classList.add("hidden");
      }
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
    if (!box) return;
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

  $("#createPost")?.addEventListener("click", () => { location.href = "create-post.html"; });
  $("#postMedia")?.addEventListener("change", event => {
    selectedPostFile = event.target.files?.[0] || null;
    previewFile(selectedPostFile, "mediaPreview");
  });
  $("#storyMedia")?.addEventListener("change", event => {
    selectedStoryFile = event.target.files?.[0] || null;
    previewFile(selectedStoryFile, "storyPreview");
  });

  $("#postForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const message = $("#postMessage");
    const content = $("#postContent")?.value.trim() || "";
    if (!content && !selectedPostFile) {
      if (message) message.textContent = "Write something or attach a photo or video first.";
      return;
    }
    const button = event.submitter;
    if (button) button.disabled = true;
    if (message) message.textContent = "Publishing…";
    try {
      let image = null;
      let mediaType = "text";
      if (selectedPostFile) {
        mediaType = selectedPostFile.type.startsWith("video/") ? "video" : "image";
        const bucket = $("#postPrivacy")?.value === "public" ? "post-media" : "private-post-media";
        image = await uploadMedia(selectedPostFile, bucket, "posts");
      }
      const hashtags = [...content.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(match => match[1]);
      const { error } = await client.from("posts").insert({
        user_id:currentUser.id, content, image, media_type:mediaType,
        privacy:$("#postPrivacy")?.value || "public",
        allow_comments:$("#allowComments")?.checked ?? true,
        hashtags, mentions:[]
      });
      if (error) throw error;
      if ($("#postContent")) $("#postContent").value = "";
      if ($("#postMedia")) $("#postMedia").value = "";
      $("#mediaPreview")?.replaceChildren();
      selectedPostFile = null;
      releasePreviews();
      closeDialog("postDialog");
      await loadFeed();
    } catch (error) {
      console.error("Publish post:", error);
      if (message) message.textContent = error.message || "Could not publish your post.";
    } finally { if (button) button.disabled = false; }
  });

  $("#storyForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const message = $("#storyMessage");
    if (!selectedStoryFile) {
      if (message) message.textContent = "Choose an image or video first.";
      return;
    }
    const button = event.submitter;
    if (button) button.disabled = true;
    if (message) message.textContent = "Uploading story…";
    try {
      const privacy = $("#storyPrivacy")?.value || "public";
      const image = await uploadMedia(selectedStoryFile, "story-media", "stories");
      const mediaType = selectedStoryFile.type.startsWith("video/") ? "video" : "image";
      const { error } = await client.from("stories").insert({
        user_id:currentUser.id, image, media_type:mediaType,
        story_text:$("#storyText")?.value.trim() || "", privacy,
        expires_at:new Date(Date.now()+86400000).toISOString()
      });
      if (error) throw error;
      if ($("#storyText")) $("#storyText").value = "";
      if ($("#storyMedia")) $("#storyMedia").value = "";
      $("#storyPreview")?.replaceChildren();
      selectedStoryFile = null;
      releasePreviews();
      closeDialog("storyDialog");
      await loadStories();
    } catch (error) {
      console.error("Publish story:", error);
      if (message) message.textContent = error.message || "Could not share story.";
    } finally { if (button) button.disabled = false; }
  });

  async function toggleRelation(table, postId, button) {
    const { data: existing, error: findError } = await client.from(table)
      .select("id").eq("post_id", postId).eq("user_id", currentUser.id).maybeSingle();
    if (findError) throw findError;
    if (existing) {
      const { error } = await client.from(table).delete().eq("id", existing.id);
      if (error) throw error;
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
    } else {
      const { error } = await client.from(table).insert({ post_id:postId, user_id:currentUser.id });
      if (error) throw error;
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
    }
  }

  $("#feed")?.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const card = button.closest("[data-post-id]");
    const postId = card?.dataset.postId;
    if (!postId) return;
    const action = button.dataset.action;
    button.disabled = true;
    try {
      if (action === "like") {
        await toggleRelation("likes", postId, button);
        await loadFeed();
      } else if (action === "bookmark") {
        await toggleRelation("bookmarks", postId, button);
      } else if (action === "repost") {
        await toggleRelation("reposts", postId, button);
        await loadFeed();
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
    const list = $("#postOptionsList");
    if (list) {
      list.innerHTML = actions.map(([action,label]) =>
        '<button class="activity-item" data-post-option="'+action+'">'+label+'</button>').join("");
    }
    const msg = $("#postOptionsMessage");
    if (msg) msg.textContent = "";
    openDialog("postOptionsDialog");
  }

  $("#postOptionsList")?.addEventListener("click", async event => {
    const button = event.target.closest("[data-post-option]");
    if (!button || !activePost) return;
    const action = button.dataset.postOption;
    const post = activePost;
    const message = $("#postOptionsMessage");
    button.disabled = true;
    if (message) message.textContent = "Please wait…";
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
        if (message) message.textContent = "Report submitted. Thank you.";
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
        if (message) message.textContent = "Post link copied.";
      }
    } catch (error) {
      console.error("Post option:", error);
      if (message) message.textContent = error.message || "Could not complete this action.";
    } finally { button.disabled = false; }
  });

  async function loadComments(postId) {
    const list = $("#commentsList");
    if (!list) return;
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

  $("#commentForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const input = $("#commentInput");
    const message = $("#commentMessage");
    const button = event.submitter;
    const content = input?.value.trim() || "";
    if (!activeCommentPostId || !content) return;
    if (button) button.disabled = true;
    if (message) message.textContent = "Sending…";
    try {
      const { data: post, error: postError } = await client.from("posts")
        .select("allow_comments").eq("id", activeCommentPostId).maybeSingle();
      if (postError) throw postError;
      if (!post || post.allow_comments === false) throw new Error("Comments are turned off for this post.");
      const { error } = await client.from("comments").insert({
        post_id:activeCommentPostId, user_id:currentUser.id, content
      });
      if (error) throw error;
      if (input) input.value = "";
      if (message) message.textContent = "";
      await loadComments(activeCommentPostId);
      await loadFeed();
    } catch (error) {
      if (message) message.textContent = error.message || "Could not send comment.";
    } finally { if (button) button.disabled = false; }
  });

  $("#storiesRow")?.addEventListener("click", async event => {
    if (event.target.closest("#addStory")) { location.href = "story-editor.html"; return; }
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
      if (content) {
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

  $("#spinWheel")?.addEventListener("click", () => openDialog("wheelDialog"));
  $("#confirmSpin")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    const status = $("#spinStatus");
    const result = $("#wheelResult");
    const wheelVisual = $("#wheelDiscVisual");
    button.disabled = true;
    if (status) status.textContent = "Spinning…";
    if (wheelVisual) wheelVisual.classList.add("spinning");
    try {
      const { data, error } = await client.rpc("spin_rewards_wheel");
      if (error) throw error;
      const reward = Array.isArray(data) ? data[0] : data;
      await new Promise(r => setTimeout(r, 1600));
      if (result) result.textContent = reward?.title || reward?.message || reward?.reward_code || "Your spin has been recorded! Check your rewards.";
      if (status) status.textContent = "Reward unlocked!";
      const hint = $("#wheelHint");
      if (hint) hint.textContent = "Spin recorded";
    } catch (error) {
      console.error("Wheel:", error);
      if (status) status.textContent = error.message || "Wheel is temporarily unavailable.";
    } finally {
      if (wheelVisual) wheelVisual.classList.remove("spinning");
      button.disabled = false;
    }
  });

  document.addEventListener("click", event => {
    const closer = event.target.closest("[data-close]");
    if (closer) closeDialog(closer.dataset.close);
  });

  $("#refreshFeed")?.addEventListener("click", () => loadFeed());
  $("#profileShortcut")?.addEventListener("click", () => showMessage("Profile", "The profile page is not being changed in this stage."));
  const openSearch = () => { location.href = "search.html"; };
  $("#openSearch")?.addEventListener("click", openSearch);
  $("#navSearch")?.addEventListener("click", openSearch);
  $("#navTrending")?.addEventListener("click", () => { location.href = "search.html#trending"; });
  $("#openNotifications")?.addEventListener("click", () => openActivity());
  $("#navNotifications")?.addEventListener("click", () => openActivity());
  $("#navStreak")?.addEventListener("click", () => openDialog("streakDialog"));

  $("#streakInviteForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const input = $("#streakUsername");
    const message = $("#streakMessage");
    const button = event.submitter;
    const username = input?.value.trim().replace(/^@/, "") || "";
    if (!username) return;
    if (button) button.disabled = true;
    if (message) message.textContent = "Sending invitation…";
    try {
      const { data, error } = await client.rpc("send_streak_invite", { p_to_username:username });
      if (error) throw error;
      if (message) message.textContent = data?.message || "Invitation sent.";
      if (input) input.value = "";
    } catch (error) {
      if (message) message.textContent = error.message || "Could not send invitation.";
    } finally { if (button) button.disabled = false; }
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
