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
  let storyUserMap = new Map();
  let currentStoryIndex = -1;
  let storyTimer = null;
  let storyProgressRaf = null;
  let storyStartTime = 0;
  let storyDuration = 5000;
  let storyPaused = false;
  let storyElapsed = 0;
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

  
  function formatCount(num) {
    const n = Number(num || 0);
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toLocaleString();
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
    const menuAvatar = $("#menuAvatar");
    if (menuAvatar) {
      menuAvatar.textContent = currentUser.avatar && /^https:\/\//i.test(currentUser.avatar) ? "" : (currentUser.letter || currentUser.username?.[0]?.toUpperCase() || "R");
      if (currentUser.avatar && /^https:\/\//i.test(currentUser.avatar)) {
        menuAvatar.style.backgroundImage = 'url("'+currentUser.avatar.replace(/["\\]/g, "")+'")';
        menuAvatar.style.backgroundSize = "cover";
        menuAvatar.style.backgroundPosition = "center";
      }
    }
    const menuName = $("#menuName");
    if (menuName) menuName.textContent = name;
    const menuHandle = $("#menuHandle");
    if (menuHandle) menuHandle.textContent = currentUser.username ? "@"+currentUser.username : "";
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

  async function resolveSingleMediaUrl(url, privacy) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
    if (privacy === "public") {
      const { data } = client.storage.from("post-media").getPublicUrl(url);
      return data?.publicUrl || "";
    }
    const { data, error } = await client.storage.from("private-post-media").createSignedUrl(url, 1800);
    if (error) {
      console.warn("Private post media unavailable:", error.message);
      return "";
    }
    return data?.signedUrl || "";
  }

  async function resolvePostMediaItems(post) {
    if (!post.image) return [];
    const raw = String(post.image).trim();
    let items = [];
    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          items = parsed.map(item => typeof item === "string"
            ? { url: item, type: /^(data:video\/)|\.(mp4|webm|mov|ogg)(?:$|[?#])/i.test(item) ? "video" : (post.media_type === "video" ? "video" : "image") }
            : { url: item?.url || item?.image || "", type: item?.type || item?.media_type || "image" }
          ).filter(item => item.url);
        }
      } catch (error) {
        console.warn("Could not parse post media list:", error);
      }
    }
    if (!items.length) items = [{ url: raw, type: post.media_type || "image" }];
    return Promise.all(items.map(async item => ({
      url: await resolveSingleMediaUrl(item.url, post.privacy),
      type: item.type
    })));
  }

  async function loadFeed() {
    const feed = $("#feed");
    feed.innerHTML = '<div class="empty-state">Loading your feed…</div>';

    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get("post");
    let targetPost = null;

    if (targetPostId) {
      try {
        const { data: sp, error: spErr } = await client.from("posts")
          .select("id,created_at,user_id,content,image,media_type,privacy,likes_count,comments_count,reposts_count,views_count,allow_comments,is_pinned,pinned_at,edited_at,media_urls")
          .eq("id", targetPostId)
          .maybeSingle();

        if (spErr || !sp) {
          showMessage("Post Notice", "The requested post could not be found or may have been deleted.");
        } else {
          targetPost = sp;
        }
      } catch (tpErr) {
        console.warn("Target post lookup notice:", tpErr);
      }
    }

    const { data: posts, error } = await client.from("posts")
      .select("id,created_at,user_id,content,image,media_type,privacy,likes_count,comments_count,reposts_count,views_count,allow_comments,is_pinned,pinned_at,edited_at,media_urls")
      .or("privacy.eq.public,privacy.eq.followers,and(privacy.eq.private,user_id.eq."+currentUser.id+")")
      .order("is_pinned", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }).limit(30);

    if (error && !targetPost) {
      console.error("Feed load failed:", error);
      feed.innerHTML = '<div class="empty-state">We couldn’t load the feed. Please try again.</div>';
      return;
    }

    let visible = (posts || []).filter(post => !hiddenPostIds.has(post.id));
    if (targetPost) {
      visible = [targetPost, ...visible.filter(p => p.id !== targetPost.id)];
    }
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
      ...post, displayMedia: await resolvePostMediaItems(post)
    })));
    const rendered = [];
    displayPosts.forEach((post, idx) => {
      rendered.push(renderPost(
        post, userMap.get(post.user_id) || {}, liked.has(post.id), saved.has(post.id), reposted.has(post.id)
      ));
    });
    feed.innerHTML = rendered.join("");

    if (targetPostId) {
      setTimeout(() => {
        const postCard = document.querySelector(`[data-post-id="${targetPostId}"]`);
        if (postCard) {
          postCard.scrollIntoView({ behavior: "smooth", block: "center" });
          postCard.style.outline = "2px solid #a855f7";
          postCard.style.borderRadius = "16px";
          postCard.style.boxShadow = "0 0 24px rgba(168, 85, 247, 0.4)";
        }
      }, 350);
    }
  }


  function renderPost(post, user, isLiked, isSaved, isReposted) {
    const name = user.display_name || user.username || "ARS member";
    const handle = user.username ? "@"+user.username : "member";
    const date = post.created_at ? new Date(post.created_at).toLocaleString([], {
      month:"short", day:"numeric", hour:"numeric", minute:"2-digit"
    }) : "";
    let media = "";
    const mediaItems = (post.displayMedia || []).filter(item => item.url);
    if (mediaItems.length) {
      const gridClass = "grid-" + Math.min(4, mediaItems.length);
      const itemsHtml = mediaItems.slice(0, 4).map(item => item.type === "video"
        ? '<div class="grid-item"><video class="post-media" src="'+escapeHTML(item.url)+'" controls playsinline preload="metadata"></video></div>'
        : '<div class="grid-item"><img class="post-media" src="'+escapeHTML(item.url)+'" alt="Post media" loading="lazy"></div>'
      ).join("");
      media = '<div class="post-media-grid '+gridClass+'">'+itemsHtml+'</div>';
    }
    const commentsDisabled = post.allow_comments === false;
    const verifiedBadge = user.verified
      ? '<span class="verified-badge" aria-label="Verified" title="Verified"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 2.5 14.6 4l3-.2 1 2.8 2.4 1.8-.8 2.9.8 2.9-2.4 1.8-1 2.8-3-.2L12 20l-2.6-1.5-3 .2-1-2.8L3 14.1l.8-2.9L3 8.3l2.4-1.8 1-2.8 3 .2L12 2.5Zm-1.1 12.9 5.6-5.6-1.4-1.4-4.2 4.2-2-2-1.4 1.4 3.4 3.4Z"/></svg></span>'
      : '';

    const likesCount = formatCount(post.likes_count || 0);
    const commentsCount = formatCount(post.comments_count || 0);
    const repostsCount = formatCount(post.reposts_count || 0);

    const pinnedBadge = post.is_pinned ? '<span class="pinned-badge" title="Pinned post"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-6.5V4h-11v6.5z"/></svg> Pinned</span>' : '';
    const editedNotice = post.edited_at ? ' <small style="color:#7c8292;">(edited)</small>' : '';
    return '<article class="post-card" data-post-id="'+escapeHTML(post.id)+'">'+
      '<div class="post-head">'+
        avatarMarkup(user)+
        '<div class="post-author">'+
          '<div class="author-title"><strong>'+escapeHTML(name)+'</strong>'+verifiedBadge+pinnedBadge+'</div>'+
          '<small class="author-meta">'+escapeHTML(handle)+' · '+escapeHTML(date)+editedNotice+'</small>'+
        '</div>'+
        '<button class="post-menu" data-action="menu" aria-label="Post options"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/></svg></button>'+
      '</div>'+
      (post.content ? '<p class="post-content">'+escapeHTML(post.content)+'</p>' : '')+media+
      '<div class="post-actions">'+
        '<button class="post-action like-btn '+(isLiked?'active':'')+'" data-action="like" aria-pressed="'+isLiked+'" title="Like">'+
          '<svg class="act-icon heart-icon" viewBox="0 0 24 24" width="18" height="18" fill="'+(isLiked?'currentColor':'none')+'" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'+
          '<span class="act-count">'+likesCount+'</span>'+
        '</button>'+
        '<button class="post-action comment-btn" data-action="comment" '+(commentsDisabled?'disabled aria-disabled="true" title="Comments turned off"':'title="Comment"')+'>'+
          '<svg class="act-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+
          '<span class="act-count">'+commentsCount+'</span>'+
        '</button>'+
        '<button class="post-action repost-btn '+(isReposted?'active':'')+'" data-action="repost" aria-pressed="'+isReposted+'" title="Repost">'+
          '<svg class="act-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>'+
          '<span class="act-count">'+repostsCount+'</span>'+
        '</button>'+
        '<button class="post-action bookmark-btn '+(isSaved?'active':'')+'" data-action="bookmark" aria-pressed="'+isSaved+'" title="Save">'+
          '<svg class="act-icon" viewBox="0 0 24 24" width="18" height="18" fill="'+(isSaved?'currentColor':'none')+'" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'+
        '</button>'+
      '</div>'+
    '</article>';
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
    storyUserMap = userMap;
    stories = stories.map(s => ({ ...s, user: userMap.get(s.user_id) || {} }));
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

  function activityDescription(item) {
    const type = String(item.type || "activity").toLowerCase().replace(/[_-]/g, " ");
    const metadata = item.metadata && typeof item.metadata === "object" ? item.metadata : {};
    if (metadata.message || metadata.text) return String(metadata.message || metadata.text);
    const phrases = { like:"liked your post", comment:"commented on your post", repost:"reposted your post", follow:"started following you", streak_invite:"invited you to start a Streak", streak_recovery:"requested a Streak recovery", streak_recovery_request:"requested a Streak recovery" };
    return phrases[type] || (type + " on your account");
  }

  async function openActivity() {
    const list = $("#activityList");
    list.innerHTML = '<p class="muted">Loading notifications…</p>';
    openDialog("activityDialog");
    const { data, error } = await client.from("notifications")
      .select("id,sender_id,type,post_id,is_read,metadata,created_at")
      .eq("user_id", currentUser.id).order("created_at", { ascending:false }).limit(50);
    if (error) { list.textContent = "Could not load activity: "+error.message; return; }
    if (!data?.length) { list.innerHTML = '<p class="muted">You’re all caught up.</p>'; return; }
    const ids = [...new Set(data.map(item => item.sender_id).filter(Boolean))];
    const { data: senders } = ids.length ? await client.from("users").select("id,username,display_name,avatar").in("id", ids) : { data:[] };
    const userMap = new Map((senders || []).map(user => [user.id, user]));
    list.innerHTML = data.map(item => {
      const user = userMap.get(item.sender_id) || {};
      const name = user.display_name || user.username || "ARS member";
      const avatar = user.avatar && /^https?:\/\//i.test(user.avatar) ? '<span class="activity-avatar"><img src="'+escapeHTML(user.avatar)+'" alt=""></span>' : '<span class="activity-avatar">'+escapeHTML(name[0] || "A")+'</span>';
      return '<article class="activity-item '+(item.is_read ? "" : "unread")+'"><div class="activity-header-line">'+avatar+'<div class="activity-info"><p><strong>'+escapeHTML(name)+'</strong> '+escapeHTML(activityDescription(item))+'</p><small class="activity-time">'+escapeHTML(new Date(item.created_at).toLocaleString())+'</small></div></div></article>';
    }).join("");
    const unread = data.filter(item => !item.is_read).map(item => item.id);
    if (unread.length) {
      const { error: markError } = await client.from("notifications").update({ is_read:true }).eq("user_id", currentUser.id).in("id", unread);
      if (!markError) { $("#notificationDot").classList.add("hidden"); list.querySelectorAll(".unread").forEach(row => row.classList.remove("unread")); }
      else console.warn("Could not mark notifications read:", markError.message);
    }
  }

  function selectStreakTab(tab) {
    ["list", "restores", "invite"].forEach(name => {
      const button = document.querySelector('[data-streak-tab="'+name+'"]');
      const view = $("#streakView"+name[0].toUpperCase()+name.slice(1));
      button?.classList.toggle("active", name === tab);
      view?.classList.toggle("hidden", name !== tab);
    });
  }

  async function loadStreaks() {
    const list = $("#streaksListContainer");
    list.innerHTML = '<p class="muted">Loading Streaks…</p>';
    const { data, error } = await client.from("streaks").select("id,user_a_id,user_b_id,count,streak_count,status,last_activity_at,last_activity_user_a,last_activity_user_b,broken_at,created_at,updated_at").or("user_a_id.eq."+currentUser.id+",user_b_id.eq."+currentUser.id).order("updated_at", { ascending:false }).limit(100);
    if (error) { list.textContent = "Could not load Streaks: "+error.message; return; }
    if (!data?.length) { list.innerHTML = '<p class="muted">No Streaks yet. Invite someone to start one together.</p>'; return; }
    const peerIds = [...new Set(data.map(row => row.user_a_id === currentUser.id ? row.user_b_id : row.user_a_id).filter(Boolean))];
    const { data: peers } = peerIds.length ? await client.from("users").select("id,username,display_name,avatar").in("id", peerIds) : { data:[] };
    const users = new Map((peers || []).map(user => [user.id, user]));
    list.innerHTML = data.map(row => {
      const peerId = row.user_a_id === currentUser.id ? row.user_b_id : row.user_a_id;
      const peer = users.get(peerId) || {};
      const name = peer.display_name || peer.username || "ARS member";
      const count = Number(row.streak_count ?? row.count ?? 0);
      const last = row.last_activity_at ? new Date(row.last_activity_at).getTime() : 0;
      const expired = !!row.broken_at || /broken|expired|inactive|ended/i.test(row.status || "") || (last && Date.now()-last >= 86400000);
      const action = expired ? '<div class="streak-status-bar"><span class="streak-status broken">Recovery may be available</span><button class="streak-recover-btn" type="button" data-request-recovery="'+escapeHTML(row.id)+'">Request recovery</button></div>' : '<div class="streak-status-bar"><span class="streak-status active">● Active</span><span class="muted">Last activity '+escapeHTML(row.last_activity_at ? new Date(row.last_activity_at).toLocaleString() : "not recorded")+'</span></div>';
      const avatar = peer.avatar && /^https?:\/\//i.test(peer.avatar) ? '<span class="activity-avatar"><img src="'+escapeHTML(peer.avatar)+'" alt=""></span>' : '<span class="activity-avatar">'+escapeHTML(name[0] || "A")+'</span>';
      return '<article class="streak-card"><div class="streak-card-main">'+avatar+'<div class="streak-user-info"><strong>'+escapeHTML(name)+'</strong><small>@'+escapeHTML(peer.username || "member")+'</small></div><span class="streak-count-badge"> '+count+' days</span></div>'+action+'</article>';
    }).join("");
  }

  async function loadRecoveries() {
    const list = $("#restoresListContainer");
    list.innerHTML = '<p class="muted">Loading recovery requests…</p>';
    const { data, error } = await client.from("streak_restores").select("id,streak_id,status,approved_by,requested_at,expires_at,count,created_at").order("created_at", { ascending:false }).limit(50);
    if (error) { list.textContent = "Could not load recovery requests: "+error.message; return; }
    if (!data?.length) { list.innerHTML = '<p class="muted">No recovery requests right now.</p>'; $("#restoresBadge").classList.add("hidden"); return; }
    const pending=data.filter(row=>String(row.status||"pending").toLowerCase()==="pending");
    $("#restoresBadge").textContent=String(pending.length); $("#restoresBadge").classList.toggle("hidden",!pending.length);
    const ids=[...new Set(data.map(row=>row.streak_id).filter(Boolean))];
    const { data: streaks }=ids.length?await client.from("streaks").select("id,user_a_id,user_b_id").in("id",ids):{data:[]};
    const partners=[...new Set((streaks||[]).flatMap(row=>[row.user_a_id,row.user_b_id]).filter(Boolean))];
    const { data: people }=partners.length?await client.from("users").select("id,username,display_name").in("id",partners):{data:[]};
    const userMap=new Map((people||[]).map(user=>[user.id,user]));
    const streakMap=new Map((streaks||[]).map(row=>[row.id,row]));
    list.innerHTML=data.map(row=>{
      const pair=streakMap.get(row.streak_id)||{}; const partnerId=pair.user_a_id===currentUser.id?pair.user_b_id:pair.user_a_id;
      const person=userMap.get(partnerId)||{}; const name=person.display_name||person.username||"your Streak partner";
      const pendingRow=String(row.status||"pending").toLowerCase()==="pending"; const expired=row.expires_at&&new Date(row.expires_at).getTime()<=Date.now();
      const actions=pendingRow&&!expired?'<div class="activity-action-row"><button type="button" class="btn-approve-recovery" data-recovery-id="'+escapeHTML(row.id)+'" data-approve="true">Approve</button><button type="button" class="btn-decline-recovery" data-recovery-id="'+escapeHTML(row.id)+'" data-approve="false">Decline</button></div>':'';
      return '<article class="streak-card"><div class="streak-user-info"><strong>Recovery request from '+escapeHTML(name)+'</strong><small>'+escapeHTML(expired?'Request expired':(row.status||"Pending"))+'</small></div>'+actions+'<small class="activity-time">Requested '+escapeHTML(new Date(row.requested_at||row.created_at).toLocaleString())+'</small></article>';
    }).join("");
  }

  async function openStreakCenter(tab="list") {
    closeDialog("profileMenuDialog"); closeDialog("activityDialog"); openDialog("streakDialog"); selectStreakTab(tab);
    await Promise.allSettled([loadStreaks(),loadRecoveries()]);
  }

  $("#streaksListContainer").addEventListener("click", async event => {
    const button=event.target.closest("[data-request-recovery]"); if(!button)return;
    button.disabled=true; button.textContent="Requesting…";
    try { const {data,error}=await client.rpc("recover_streak",{p_streak_id:button.dataset.requestRecovery}); if(error)throw error; showMessage("Recovery requested",data?.message||"Your request was sent to your Streak partner."); await Promise.allSettled([loadStreaks(),loadRecoveries()]); }
    catch(error){showMessage("Could not request recovery",error.message||"Please try again.");button.disabled=false;button.textContent="Request recovery";}
  });
  $("#restoresListContainer").addEventListener("click",async event=>{
    const button=event.target.closest("[data-recovery-id]");if(!button)return;
    const card=button.closest(".streak-card");card?.querySelectorAll("button").forEach(item=>item.disabled=true);
    const approve=button.dataset.approve==="true";
    try{const {data,error}=await client.rpc("respond_streak_recovery",{p_restore_id:button.dataset.recoveryId,p_approve:approve});if(error)throw error;showMessage(approve?"Recovery approved":"Request declined",data?.message||(approve?"The Streak recovery was approved.":"The request was declined."));await Promise.allSettled([loadStreaks(),loadRecoveries()]);}
    catch(error){showMessage("Could not update recovery",error.message||"Please try again.");card?.querySelectorAll("button").forEach(item=>item.disabled=false);}
  });
  $(".streak-tabs").addEventListener("click",event=>{const button=event.target.closest("[data-streak-tab]");if(button)selectStreakTab(button.dataset.streakTab);});

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

  $("#createPost").addEventListener("click", () => { location.href = "create-post.html"; });
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

    try {
      if (action === "like") {
        const wasLiked = button.classList.contains("active");
        const countSpan = button.querySelector(".act-count");
        const iconSvg = button.querySelector(".heart-icon");
        const currentCount = parseInt(countSpan?.textContent.replace(/[^0-9]/g, "") || "0", 10);

        // Optimistic toggle
        button.classList.toggle("active", !wasLiked);
        button.setAttribute("aria-pressed", String(!wasLiked));
        if (iconSvg) iconSvg.setAttribute("fill", !wasLiked ? "currentColor" : "none");
        if (countSpan) countSpan.textContent = formatCount(Math.max(0, currentCount + (!wasLiked ? 1 : -1)));

        try {
          await toggleRelation("likes", postId, button, null, null);
        } catch (err) {
          // Revert on failure
          button.classList.toggle("active", wasLiked);
          button.setAttribute("aria-pressed", String(wasLiked));
          if (iconSvg) iconSvg.setAttribute("fill", wasLiked ? "currentColor" : "none");
          if (countSpan) countSpan.textContent = formatCount(currentCount);
          console.warn("Like sync failed:", err.message);
        }
      } else if (action === "bookmark") {
        const wasSaved = button.classList.contains("active");
        const iconSvg = button.querySelector(".act-icon");

        button.classList.toggle("active", !wasSaved);
        button.setAttribute("aria-pressed", String(!wasSaved));
        if (iconSvg) iconSvg.setAttribute("fill", !wasSaved ? "currentColor" : "none");

        try {
          await toggleRelation("bookmarks", postId, button, null, null);
        } catch (err) {
          button.classList.toggle("active", wasSaved);
          button.setAttribute("aria-pressed", String(wasSaved));
          if (iconSvg) iconSvg.setAttribute("fill", wasSaved ? "currentColor" : "none");
          console.warn("Bookmark sync failed:", err.message);
        }
      } else if (action === "repost") {
        const wasReposted = button.classList.contains("active");
        const countSpan = button.querySelector(".act-count");
        const currentCount = parseInt(countSpan?.textContent.replace(/[^0-9]/g, "") || "0", 10);

        button.classList.toggle("active", !wasReposted);
        button.setAttribute("aria-pressed", String(!wasReposted));
        if (countSpan) countSpan.textContent = formatCount(Math.max(0, currentCount + (!wasReposted ? 1 : -1)));

        try {
          await toggleRelation("reposts", postId, button, null, null);
        } catch (err) {
          button.classList.toggle("active", wasReposted);
          button.setAttribute("aria-pressed", String(wasReposted));
          if (countSpan) countSpan.textContent = formatCount(currentCount);
          console.warn("Repost sync failed:", err.message);
        }
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
    }
  });

  async function openPostOptions(postId) {
    const message = $("#postOptionsMessage");
    if (message) message.textContent = "";
    const list = $("#postOptionsList");
    if (list) list.innerHTML = '<p class="muted">Loading options…</p>';
    openDialog("postOptionsDialog");

    try {
      const { data: post, error } = await client.from("posts")
        .select("id,user_id,content,privacy,allow_comments,is_pinned,likes_count,comments_count,reposts_count,views_count,created_at")
        .eq("id", postId).maybeSingle();
      if (error) throw error;
      if (!post) {
        closeDialog("postOptionsDialog");
        showMessage("Post unavailable", "This post may have been deleted or is no longer visible.");
        return;
      }
      activePost = post;
      const own = post.user_id === currentUser.id;

      let isSaved = false;
      if (!own) {
        const { data: bm } = await client.from("bookmarks")
          .select("post_id").eq("user_id", currentUser.id).eq("post_id", post.id).maybeSingle();
        isSaved = !!bm;
      }

      const actions = own
        ? [
            { id: "edit", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>', title: "Edit post", desc: "Update text, audience and comment settings" },
            { id: "pin", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-6.5V4h-11v6.5z"/></svg>', title: post.is_pinned ? "Unpin from profile" : "Pin to profile", desc: post.is_pinned ? "Remove pinned status" : "Keep this post highlighted at the top" },
            { id: "comments", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', title: post.allow_comments === false ? "Turn comments on" : "Turn comments off", desc: post.allow_comments === false ? "Allow members to reply" : "Disable replies on this post" },
            { id: "insights", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', title: "Post insights", desc: "See view counts, likes, comments and reposts" },
            { id: "delete", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', title: "Delete post", desc: "Permanently remove this post from ARS", danger: true }
          ]
        : [
            { id: "save", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>', title: isSaved ? "Remove from saved" : "Save post", desc: isSaved ? "Remove from your bookmarks" : "Save this post to your bookmarks" },
            { id: "hide", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>', title: "Hide from feed", desc: "Hide this post from your feed view" },
            { id: "not-interested", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>', title: "Not interested", desc: "See fewer posts like this on ARS" },
            { id: "report", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>', title: "Report post", desc: "Flag spam, harassment or inappropriate content" },
            { id: "block", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>', title: "Block account", desc: "Block this account from interacting with you", danger: true },
            { id: "copy", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', title: "Copy post link", desc: "Copy direct link to this post" }
          ];

      list.innerHTML = actions.map(act =>
        '<button type="button" class="post-option-btn ' + (act.danger ? 'danger' : '') + '" data-post-option="' + act.id + '">' +
          '<span class="opt-icon">' + act.icon + '</span>' +
          '<div class="opt-info">' +
            '<span class="opt-title">' + escapeHTML(act.title) + '</span>' +
            '<span class="opt-desc">' + escapeHTML(act.desc) + '</span>' +
          '</div>' +
        '</button>'
      ).join("");
    } catch (err) {
      console.error("Open post options:", err);
      if (message) message.textContent = err.message || "Could not load options.";
    }
  }

  $("#postOptionsList").addEventListener("click", async event => {
    const button = event.target.closest("[data-post-option]");
    if (!button || !activePost) return;
    const action = button.dataset.postOption;
    const post = activePost;
    const message = $("#postOptionsMessage");
    button.disabled = true;
    if (message) message.textContent = "Please wait…";

    try {
      if (action === "edit") {
        closeDialog("postOptionsDialog");
        $("#editPostContent").value = post.content || "";
        $("#editPostPrivacy").value = post.privacy || "public";
        $("#editPostComments").checked = post.allow_comments !== false;
        $("#editPostMessage").textContent = "";
        openDialog("editPostDialog");
      } else if (action === "pin") {
        const nextPinned = !post.is_pinned;
        const { error } = await client.from("posts")
          .update({ is_pinned: nextPinned, pinned_at: nextPinned ? new Date().toISOString() : null })
          .eq("id", post.id).eq("user_id", currentUser.id);
        if (error) throw error;
        closeDialog("postOptionsDialog");
        showMessage("Post updated", nextPinned ? "This post is now pinned to your profile." : "Post unpinned.");
        await loadFeed();
      } else if (action === "comments") {
        const nextAllow = post.allow_comments === false ? true : false;
        const { error } = await client.from("posts")
          .update({ allow_comments: nextAllow })
          .eq("id", post.id).eq("user_id", currentUser.id);
        if (error) throw error;
        closeDialog("postOptionsDialog");
        showMessage("Comments updated", nextAllow ? "Comments are now allowed on this post." : "Comments have been turned off.");
        await loadFeed();
      } else if (action === "insights") {
        closeDialog("postOptionsDialog");
        $("#statViews").textContent = post.views_count == null ? "—" : formatCount(post.views_count);
        $("#statLikes").textContent = post.likes_count == null ? "—" : formatCount(post.likes_count);
        $("#statComments").textContent = post.comments_count == null ? "—" : formatCount(post.comments_count);
        $("#statReposts").textContent = post.reposts_count == null ? "—" : formatCount(post.reposts_count);
        const postDate = post.created_at ? new Date(post.created_at).toLocaleDateString([], {
          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        }) : "Recently";
        $("#insightMeta").textContent = "Audience: " + (post.privacy || "public").toUpperCase() + " · Posted: " + postDate;
        openDialog("postInsightsDialog");
      } else if (action === "delete") {
        if (!confirm("Delete this post permanently? This action cannot be undone.")) return;
        const { error } = await client.from("posts").delete().eq("id", post.id).eq("user_id", currentUser.id);
        if (error) throw error;
        closeDialog("postOptionsDialog");
        showMessage("Post deleted", "Your post has been removed from ARS.");
        await loadFeed();
      } else if (action === "save") {
        const { data: existing } = await client.from("bookmarks")
          .select("id").eq("user_id", currentUser.id).eq("post_id", post.id).maybeSingle();
        if (existing) {
          await client.from("bookmarks").delete().eq("user_id", currentUser.id).eq("post_id", post.id);
          showMessage("Bookmark removed", "Post removed from your saved list.");
        } else {
          await client.from("bookmarks").insert({ user_id: currentUser.id, post_id: post.id });
          showMessage("Post saved", "Post saved to your bookmarks.");
        }
        closeDialog("postOptionsDialog");
        await loadFeed();
      } else if (action === "hide") {
        hiddenPostIds.add(post.id);
        localStorage.setItem("ars_hidden_posts", JSON.stringify([...hiddenPostIds]));
        closeDialog("postOptionsDialog");
        showMessage("Post hidden", "This post has been hidden from your feed.");
        await loadFeed();
      } else if (action === "not-interested") {
        hiddenPostIds.add(post.id);
        localStorage.setItem("ars_hidden_posts", JSON.stringify([...hiddenPostIds]));
        closeDialog("postOptionsDialog");
        showMessage("Preference updated", "We will show fewer posts like this in your feed.");
        await loadFeed();
      } else if (action === "report") {
        closeDialog("postOptionsDialog");
        $("#reportDetails").value = "";
        $("#reportPostMessage").textContent = "";
        openDialog("reportPostDialog");
      } else if (action === "block") {
        if (!confirm("Block this account? You will no longer see each other’s content on ARS.")) return;
        const { error } = await client.from("blocks").insert({
          blocker_id: currentUser.id, blocked_id: post.user_id
        });
        if (error) throw error;
        closeDialog("postOptionsDialog");
        showMessage("Account blocked", "You have blocked this account.");
        await loadFeed();
      } else if (action === "copy") {
        const url = new URL("home.html", location.href);
        url.hash = "post-" + post.id;
        await navigator.clipboard.writeText(url.href);
        if (message) message.textContent = "Post link copied to clipboard!";
        setTimeout(() => closeDialog("postOptionsDialog"), 900);
      }
    } catch (error) {
      console.error("Post option error:", error);
      if (message) message.textContent = error.message || "Could not complete this action.";
    } finally {
      button.disabled = false;
    }
  });

  // Edit Post Form Listener
  $("#editPostForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!activePost) return;
    const submitBtn = event.submitter;
    const message = $("#editPostMessage");
    const content = $("#editPostContent").value.trim();
    const privacy = $("#editPostPrivacy").value;
    const allowComments = $("#editPostComments").checked;
    if (submitBtn) submitBtn.disabled = true;
    message.textContent = "Saving changes…";

    try {
      const { error } = await client.from("posts").update({
        content,
        privacy,
        allow_comments: allowComments,
        edited_at: new Date().toISOString()
      }).eq("id", activePost.id).eq("user_id", currentUser.id);

      if (error) throw error;
      closeDialog("editPostDialog");
      showMessage("Post updated", "Your changes have been saved.");
      await loadFeed();
    } catch (err) {
      console.error("Edit post error:", err);
      message.textContent = err.message || "Could not save post changes.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Report Post Form Listener
  $("#reportPostForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!activePost) return;
    const submitBtn = event.submitter;
    const message = $("#reportPostMessage");
    const reasonRadio = $('input[name="reportReason"]:checked')?.value || "other";
    const details = $("#reportDetails").value.trim();
    const reason = details ? (reasonRadio + ": " + details) : reasonRadio;
    if (submitBtn) submitBtn.disabled = true;
    message.textContent = "Submitting report…";

    try {
      const { error } = await client.from("reports").insert({
        reporter_id: currentUser.id,
        reported_user_id: activePost.user_id,
        reason
      });
      if (error) throw error;
      closeDialog("reportPostDialog");
      showMessage("Report submitted", "Thank you for keeping ARS safe. Our moderation team has received your report.");
    } catch (err) {
      console.error("Report post error:", err);
      message.textContent = err.message || "Could not submit report.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
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

  function stopStoryProgress() {
    if (storyProgressRaf) { cancelAnimationFrame(storyProgressRaf); storyProgressRaf = null; }
    if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }
  }

  function closeStoryViewer() {
    stopStoryProgress();
    currentStoryIndex = -1;
    storyPaused = false;
    const content = $("#storyViewerContent");
    if (content) {
      const vid = content.querySelector("video");
      if (vid) { vid.pause(); vid.src = ""; }
      content.replaceChildren();
    }
    closeDialog("storyViewerDialog");
  }

  function startStoryProgress(durationMs) {
    stopStoryProgress();
    storyDuration = Math.max(3000, durationMs || 5000);
    storyStartTime = performance.now();
    storyElapsed = 0;
    storyPaused = false;
    const pauseBtn = $("#storyPauseBtn");
    if (pauseBtn) pauseBtn.textContent = "⏸";

    function step(now) {
      if (storyPaused) {
        storyProgressRaf = requestAnimationFrame(step);
        return;
      }
      const elapsed = (now - storyStartTime) + storyElapsed;
      const progress = Math.min(100, (elapsed / storyDuration) * 100);
      const fill = $("#storyProgressFill");
      if (fill) fill.style.width = progress + "%";

      if (progress >= 100) {
        stopStoryProgress();
        if (currentStoryIndex < stories.length - 1) {
          showStoryAtIndex(currentStoryIndex + 1);
        } else {
          closeStoryViewer();
        }
        return;
      }
      storyProgressRaf = requestAnimationFrame(step);
    }
    storyProgressRaf = requestAnimationFrame(step);
  }

  function toggleStoryPause() {
    storyPaused = !storyPaused;
    const pauseBtn = $("#storyPauseBtn");
    if (pauseBtn) pauseBtn.textContent = storyPaused ? "▶" : "⏸";
    const vid = $("#storyViewerContent")?.querySelector("video");
    if (vid) {
      if (storyPaused) vid.pause();
      else vid.play().catch(() => {});
    }
    if (storyPaused) {
      storyElapsed += (performance.now() - storyStartTime);
    } else {
      storyStartTime = performance.now();
    }
  }

  async function showStoryAtIndex(index) {
    if (!stories.length || index < 0 || index >= stories.length) {
      closeStoryViewer();
      return;
    }
    currentStoryIndex = index;
    stopStoryProgress();
    const fill = $("#storyProgressFill");
    if (fill) fill.style.width = "0%";

    const story = stories[index];
    const user = story.user || storyUserMap.get(story.user_id) || {};
    const name = user.display_name || user.username || "ARS member";
    const handle = user.username ? "@" + user.username : "";
    const avatarEl = $("#storyViewerAvatar");
    if (avatarEl) {
      if (user.avatar && /^https:\/\//i.test(user.avatar)) {
        avatarEl.textContent = "";
        avatarEl.style.backgroundImage = 'url("' + user.avatar.replace(/["\\]/g, "") + '")';
        avatarEl.style.backgroundSize = "cover";
        avatarEl.style.backgroundPosition = "center";
      } else {
        avatarEl.style.backgroundImage = "";
        avatarEl.textContent = (name[0] || "A").toUpperCase();
      }
    }
    $("#storyViewerName").textContent = handle ? handle : name;
    const timeStr = story.created_at ? new Date(story.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now";
    $("#storyViewerTime").textContent = timeStr;

    let mediaUrl = story.image;
    if (mediaUrl && !/^https?:\/\//i.test(mediaUrl)) {
      try {
        const { data, error } = await client.storage.from("story-media").createSignedUrl(mediaUrl, 1800);
        if (!error && data?.signedUrl) mediaUrl = data.signedUrl;
      } catch (e) {
        console.warn("Story signed URL:", e);
      }
    }

    const content = $("#storyViewerContent");
    content.replaceChildren();

    const isVideo = story.media_type === "video" || /\.(mp4|webm|mov)$/i.test(mediaUrl || "");
    const media = document.createElement(isVideo ? "video" : "img");
    media.src = mediaUrl;

    if (isVideo) {
      media.autoplay = true;
      media.playsInline = true;
      media.controls = false;
      media.muted = false;
      media.addEventListener("loadedmetadata", () => {
        const duration = Math.min(30000, Math.max(4000, (media.duration || 5) * 1000));
        startStoryProgress(duration);
      });
      media.addEventListener("error", () => startStoryProgress(4000));
    } else {
      media.addEventListener("load", () => startStoryProgress(5000));
      media.addEventListener("error", () => startStoryProgress(4000));
    }
    content.appendChild(media);

    const captionBar = $("#storyCaptionBar");
    if (captionBar) captionBar.textContent = story.story_text || "";

    openDialog("storyViewerDialog");

    if (currentUser?.id && story.id) {
      client.from("story_views").insert({ story_id: story.id, viewer_id: currentUser.id }).catch(() => {});
    }

    setTimeout(() => {
      if (!storyProgressRaf && !storyPaused) startStoryProgress(5000);
    }, 400);
  }

  $("#storiesRow").addEventListener("click", async event => {
    if (event.target.closest("#addStory")) { location.href = "story-editor.html"; return; }
    const item = event.target.closest("[data-story-index]");
    if (!item) return;
    const idx = Number(item.dataset.storyIndex);
    if (!isNaN(idx) && stories[idx]) {
      await showStoryAtIndex(idx);
    }
  });

  $("#storyPrevBtn").addEventListener("click", () => {
    if (currentStoryIndex > 0) showStoryAtIndex(currentStoryIndex - 1);
  });

  $("#storyNextBtn").addEventListener("click", () => {
    if (currentStoryIndex < stories.length - 1) showStoryAtIndex(currentStoryIndex + 1);
    else closeStoryViewer();
  });

  $("#storyPauseBtn").addEventListener("click", () => toggleStoryPause());

  $("#storyHeartBtn").addEventListener("click", () => {
    const btn = $("#storyHeartBtn");
    btn.style.transform = "scale(1.4)";
    setTimeout(() => { btn.style.transform = ""; }, 250);
    showMessage("Reaction sent", "Your reaction was sent to this story.");
  });

  $("#storyQuickReply").addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      const input = $("#storyQuickReply");
      const val = input.value.trim();
      if (!val) return;
      input.value = "";
      showMessage("Reply sent", "Your reply was sent to this story.");
    }
  });

  $("#storyViewerDialog").addEventListener("close", () => {
    stopStoryProgress();
  });

  // ARS Optional Challenge Wheel Controller
  // 6 Approved Challenge Types corresponding to wheelDisk spokes (30deg, 90deg, 150deg, 210deg, 270deg, 330deg)
  const ARS_CHALLENGES = [
    {
      id: "like_posts",
      title: "Like 3 Posts",
      desc: "Like 3 posts from creators in your ARS feed.",
      spokeAngle: 30, // 30° spoke -> wheel rotation: 360 - 30 = 330°
      targetRotation: 330,
      verify: async (userId) => {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count, error } = await client.from("likes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since);
        if (error) throw error;
        return { completed: (count || 0) >= 3, progress: `${count || 0}/3 likes in 24h` };
      }
    },
    {
      id: "watch_stories",
      title: "Watch 5 Stories",
      desc: "Watch 5 stories from ARS members.",
      spokeAngle: 90, // 90° spoke -> wheel rotation: 360 - 90 = 270°
      targetRotation: 270,
      verify: async (userId) => {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count, error } = await client.from("story_views")
          .select("id", { count: "exact", head: true })
          .eq("viewer_id", userId)
          .gte("viewed_at", since);
        if (error) throw error;
        return { completed: (count || 0) >= 5, progress: `${count || 0}/5 stories viewed in 24h` };
      }
    },
    {
      id: "write_comment",
      title: "Write a Comment",
      desc: "Leave a meaningful comment on any post.",
      spokeAngle: 150, // 150° spoke -> wheel rotation: 360 - 150 = 210°
      targetRotation: 210,
      verify: async (userId) => {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count, error } = await client.from("comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since);
        if (error) throw error;
        return { completed: (count || 0) >= 1, progress: `${count || 0}/1 comment posted in 24h` };
      }
    },
    {
      id: "post_story",
      title: "Share a Story",
      desc: "Post a new story with photos or drawings.",
      spokeAngle: 210, // 210° spoke -> wheel rotation: 360 - 210 = 150°
      targetRotation: 150,
      verify: async (userId) => {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count, error } = await client.from("stories")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since);
        if (error) throw error;
        return { completed: (count || 0) >= 1, progress: `${count || 0}/1 story shared in 24h` };
      }
    },
    {
      id: "save_post",
      title: "Save a Post",
      desc: "Bookmark an interesting post to your saved collection.",
      spokeAngle: 270, // 270° spoke -> wheel rotation: 360 - 270 = 90°
      targetRotation: 90,
      verify: async (userId) => {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count, error } = await client.from("bookmarks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since);
        if (error) throw error;
        return { completed: (count || 0) >= 1, progress: `${count || 0}/1 post saved in 24h` };
      }
    },
    {
      id: "streak_interact",
      title: "Maintain Streak",
      desc: "Interact with a friend to maintain your ARS streak.",
      spokeAngle: 330, // 330° spoke -> wheel rotation: 360 - 330 = 30°
      targetRotation: 30,
      verify: async (userId) => {
        const { data, error } = await client.from("streaks")
          .select("id, current_streak, updated_at")
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .limit(1);
        if (error) throw error;
        return { completed: Boolean(data?.length), progress: data?.length ? "Streak active" : "No streak yet" };
      }
    }
  ];

  let totalWheelRotation = 0;
  let activeChallenge = null;

  function restoreActiveChallenge() {
    try {
      const stored = localStorage.getItem("ars_active_challenge");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          activeChallenge = parsed;
          showChallengeBanner(parsed);
        }
      }
    } catch (e) {
      console.warn("Challenge restore error:", e);
    }
  }

  function showChallengeBanner(challenge) {
    const banner = $("#activeChallengeBanner");
    const titleEl = $("#bannerChallengeTitle");
    const descEl = $("#bannerChallengeDesc");
    if (!banner || !challenge) return;

    if (titleEl) titleEl.textContent = challenge.title;
    if (descEl) descEl.textContent = challenge.desc;
    banner.classList.remove("hidden");
  }

  function dismissChallenge() {
    activeChallenge = null;
    localStorage.removeItem("ars_active_challenge");
    const banner = $("#activeChallengeBanner");
    if (banner) banner.classList.add("hidden");
    const dismissBtn = $("#dismissChallengeBtn");
    if (dismissBtn) dismissBtn.classList.add("hidden");
  }

  function openWheelModal() {
    const resEl = $("#wheelResult");
    const titleEl = $("#challengeTitle");
    const statusEl = $("#spinStatus");
    const dismissBtn = $("#dismissChallengeBtn");

    if (activeChallenge) {
      if (titleEl) titleEl.textContent = activeChallenge.title;
      if (resEl) resEl.textContent = activeChallenge.desc + " (Optional — can be ignored anytime)";
      if (dismissBtn) dismissBtn.classList.remove("hidden");
    } else {
      if (titleEl) titleEl.textContent = "Optional Social Challenge";
      if (resEl) resEl.textContent = "Spin the wheel to get an optional social challenge. Challenges are 100% voluntary and can be ignored anytime.";
      if (dismissBtn) dismissBtn.classList.add("hidden");
    }
    if (statusEl) statusEl.textContent = "";
    openDialog("wheelDialog");
  }

  $("#spinWheel")?.addEventListener("click", openWheelModal);
  $("#storyWheelBtn")?.addEventListener("click", openWheelModal);

  $("#dismissChallengeBtn")?.addEventListener("click", () => {
    dismissChallenge();
    closeDialog("wheelDialog");
    showMessage("Challenge Dismissed", "The optional challenge was dismissed. No penalties or lost points.");
  });

  $("#dismissBannerChallengeBtn")?.addEventListener("click", dismissChallenge);

  $("#checkChallengeCompletionBtn")?.addEventListener("click", async () => {
    if (!activeChallenge || !currentUser?.id) return;
    const btn = $("#checkChallengeCompletionBtn");
    btn.disabled = true;
    btn.textContent = "Checking…";

    try {
      const match = ARS_CHALLENGES.find(c => c.id === activeChallenge.id);
      if (match && match.verify) {
        const result = await match.verify(currentUser.id);
        if (result.completed) {
          btn.textContent = "Completed!";
          btn.style.background = "#22c55e";
          showMessage("Challenge Completed!", `Great job! You completed "${activeChallenge.title}". Thank you for engaging with the ARS community.`);
          setTimeout(() => {
            dismissChallenge();
            btn.disabled = false;
            btn.textContent = "Check";
            btn.style.background = "";
          }, 2000);
        } else {
          btn.disabled = false;
          btn.textContent = "Check";
          showMessage("In Progress", `Status: ${result.progress}. Continue interacting on ARS when you wish!`);
        }
      }
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Check";
      console.warn("Challenge check error:", e);
      showMessage("Notice", "Unable to verify activity right now. Please try again later.");
    }
  });

  $("#confirmSpin")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    const status = $("#spinStatus");
    const result = $("#wheelResult");
    const titleEl = $("#challengeTitle");
    const disk = $("#wheelDisk");
    const dismissBtn = $("#dismissChallengeBtn");

    button.disabled = true;
    if (status) status.textContent = "Selecting challenge…";

    // Select challenge, avoiding immediate repetition
    const lastId = localStorage.getItem("ars_last_challenge");
    const candidates = ARS_CHALLENGES.filter(c => c.id !== lastId);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || ARS_CHALLENGES[0];
    localStorage.setItem("ars_last_challenge", chosen.id);

    // Calculate rotation to land chosen spoke exactly under top pointer (0°)
    const fullRotations = 6 * 360;
    const currentMod = totalWheelRotation % 360;
    const delta = (chosen.targetRotation - currentMod + 360) % 360;
    totalWheelRotation += fullRotations + delta;

    if (disk) {
      disk.style.transition = "transform 3.8s cubic-bezier(0.15, 0.9, 0.25, 1)";
      disk.style.transform = `rotate(${totalWheelRotation}deg)`;
    }

    // Optional background log to wheel_spins if accessible
    if (currentUser?.id && client) {
      client.from("wheel_spins").insert({ user_id: currentUser.id, reward_code: chosen.id }).then(() => {}).catch(() => {});
    }

    setTimeout(() => {
      activeChallenge = chosen;
      localStorage.setItem("ars_active_challenge", JSON.stringify(chosen));
      showChallengeBanner(chosen);

      if (titleEl) titleEl.textContent = chosen.title;
      if (result) result.textContent = chosen.desc + " (100% voluntary social challenge. You can complete it or ignore it.)";
      if (status) status.textContent = "Challenge active! You can check completion from your feed.";
      if (dismissBtn) dismissBtn.classList.remove("hidden");

      button.disabled = false;
      button.textContent = "Spin again";
    }, 3800);
  });

  document.addEventListener("click", event => {
    const closer = event.target.closest("[data-close]");
    if (closer) closeDialog(closer.dataset.close);
  });

  $("#refreshFeed").addEventListener("click", () => loadFeed());
  $("#profileShortcut")?.addEventListener("click", (e) => { e.preventDefault(); location.href = "profile.html"; });
  $("#menuOpenStreaks")?.addEventListener("click", () => openStreakCenter("list"));
  $("#openStreaksFromActivity")?.addEventListener("click", () => openStreakCenter("list"));
  $("#menuSignOut")?.addEventListener("click", async () => { try { await client.auth.signOut(); } finally { localStorage.setItem(STORAGE.loggedIn,"false"); localStorage.removeItem(STORAGE.user); location.replace("index.html"); } });
  const openSearchUnavailable = () => { location.href = "search.html"; };
  $("#openSearch")?.addEventListener("click", openSearchUnavailable);
  $("#navSearch")?.addEventListener("click", openSearchUnavailable);
  $("#menuOpenNotifications")?.addEventListener("click", () => {
    window.location.href = "notifications.html";
  });
  $("#openNotifications")?.addEventListener("click", event => {
    event.preventDefault();
    window.location.href = "notifications.html";
  });
  $("#navStreak")?.addEventListener("click", () => openStreakCenter("list"));

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
      await loadStreaks();
    } catch (error) {
      message.textContent = error.message || "Could not send invitation.";
    } finally { button.disabled = false; }
  });

  
  // Full-screen media viewer for posts
  feed.addEventListener("click", event => {
    const mediaEl = event.target.closest(".post-media");
    if (mediaEl && (mediaEl.tagName === "IMG" || mediaEl.tagName === "VIDEO")) {
      const src = mediaEl.src;
      if (src) {
        const body = $("#mediaViewerBody");
        if (body) {
          if (mediaEl.tagName === "VIDEO") {
            body.innerHTML = "<video src=\"" + escapeHTML(src) + "\" controls autoplay playsinline></video>";
          } else {
            body.innerHTML = "<img src=\"" + escapeHTML(src) + "\" alt=\"Full size media\">";
          }
          openDialog("mediaViewerDialog");
        }
      }
    }
  });

  const closeMediaBtn = $("#closeMediaViewer");
  if (closeMediaBtn) {
    closeMediaBtn.addEventListener("click", () => {
      const body = $("#mediaViewerBody");
      if (body) {
        const vid = body.querySelector("video");
        if (vid) { vid.pause(); vid.src = ""; }
        body.replaceChildren();
      }
      closeDialog("mediaViewerDialog");
    });
  }

  const mediaViewerDialog = $("#mediaViewerDialog");
  if (mediaViewerDialog) {
    mediaViewerDialog.addEventListener("close", () => {
      const body = $("#mediaViewerBody");
      if (body) {
        const vid = body.querySelector("video");
        if (vid) { vid.pause(); vid.src = ""; }
        body.replaceChildren();
      }
    });
  }

  async function start() {
    try {
      const user = await requireSession();
      if (!user) return;
      setProfileHeader();
      restoreActiveChallenge();
      const results = await Promise.allSettled([loadFeed(), loadStories(), loadNotifications()]);
      client.channel("ars-notifications-"+currentUser.id).on("postgres_changes", { event:"*", schema:"public", table:"notifications", filter:"user_id=eq."+currentUser.id }, () => { loadNotifications(); if ($("#activityDialog")?.open) openActivity(); }).subscribe();
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