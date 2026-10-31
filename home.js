(() => {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const STORAGE = { user: "ars_user", loggedIn: "ars_logged_in", letter: "ars_letter", letterColor: "ars_letter_color", background: "ars_background" };
  const $ = (s, root = document) => root.querySelector(s);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  let currentUser = null;
  let selectedPostFile = null;
  let selectedStoryFile = null;
  let stories = [];
  let activeCommentPostId = null;

  function readUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE.user) || "{}"); }
    catch { return {}; }
  }
  function showMessage(title, body) {
    $("#messageTitle").textContent = title;
    $("#messageBody").textContent = body;
    $("#messageDialog").showModal();
  }
  function openDialog(id) { const d = document.getElementById(id); if (d && !d.open) d.showModal(); }
  function closeDialog(id) { const d = document.getElementById(id); if (d?.open) d.close(); }
  function avatarMarkup(user, extra = "") {
    const photo = user?.avatar;
    const letter = user?.letter || user?.username?.[0]?.toUpperCase() || "R";
    const color = user?.letterColor || "#fff";
    const bg = user?.background || "linear-gradient(135deg,#8b3dff,#c54dff)";
    return photo
      ? '<span class="avatar '+extra+'" style="background-image:url(&quot;'+escapeHTML(photo)+'&quot;)"></span>'
      : '<span class="avatar '+extra+'" style="color:'+escapeHTML(color)+';background:'+escapeHTML(bg)+'">'+escapeHTML(letter)+'</span>';
  }
  function setProfileHeader() {
    const name = currentUser.displayName || currentUser.display_name || currentUser.username || "Welcome";
    $("#myName").textContent = name;
    $("#myHandle").textContent = currentUser.username ? "@"+currentUser.username : "@you";
    const avatar = $("#myAvatar");
    if (currentUser.avatar) {
      avatar.textContent = "";
      avatar.style.backgroundImage = 'url("'+currentUser.avatar.replace(/"/g,"%22")+'")';
      avatar.style.backgroundSize = "cover";
    } else {
      avatar.textContent = currentUser.letter || currentUser.username?.[0]?.toUpperCase() || "R";
      avatar.style.color = currentUser.letterColor || "#fff";
      avatar.style.background = currentUser.background || "linear-gradient(135deg,#8b3dff,#c54dff)";
    }
  }
  async function requireSession() {
    if (!client) throw new Error("ARS connection could not start. Please reload the page.");
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    if (!session?.user) {
      localStorage.setItem(STORAGE.loggedIn, "false");
      location.replace("index.html");
      return null;
    }
    const authUser = session.user;
    const local = readUser();
    let profile = null;
    const result = await client.from("users").select("id,username,display_name,email,bio,avatar,cover,verified,plan,streak,xp,vip_badge_enabled").eq("id", authUser.id).maybeSingle();
    if (result.error) console.warn("Profile load:", result.error.message);
    profile = result.data;
    currentUser = {
      ...local, ...(profile || {}),
      id: authUser.id,
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
  async function loadFeed() {
    const feed = $("#feed");
    feed.innerHTML = '<div class="empty-state">Loading your feed…</div>';
    const { data: posts, error } = await client.from("posts")
      .select("id,created_at,user_id,content,image,media_type,privacy,likes_count,comments_count,reposts_count,views_count,allow_comments")
      .in("privacy", ["public","followers"]).order("created_at", {ascending:false}).limit(30);
    if (error) {
      console.error("Feed error:", error);
      feed.innerHTML = '<div class="empty-state">Could not load posts. Please refresh and try again.</div>';
      return;
    }
    if (!posts?.length) {
      feed.innerHTML = '<div class="empty-state">Your feed is quiet for now.<br>Be the first to share something with ARS.</div>';
      return;
    }
    const ids = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
    const [{data: users}, {data: myLikes}] = await Promise.all([
      client.from("users").select("id,username,display_name,avatar,verified").in("id", ids),
      client.from("likes").select("post_id").eq("user_id", currentUser.id).in("post_id", posts.map(p => p.id))
    ]);
    const userMap = new Map((users || []).map(u => [u.id,u]));
    const liked = new Set((myLikes || []).map(x => x.post_id));

    // Resolve media paths at display time so private media URLs can expire safely.
    const displayPosts = await Promise.all(posts.map(async post => {
      if (!post.image) return post;
      if (post.privacy === "public") {
        if (/^https?:\\/\\//i.test(post.image)) return { ...post, displayImage: post.image };
        const { data } = client.storage.from("post-media").getPublicUrl(post.image);
        return { ...post, displayImage: data.publicUrl };
      }
      const { data, error: mediaError } = await client.storage
        .from("private-post-media").createSignedUrl(post.image, 1800);
      if (mediaError) {
        console.warn("Private post media unavailable:", mediaError.message);
        return { ...post, displayImage: "" };
      }
      return { ...post, displayImage: data.signedUrl };
    }));
    feed.innerHTML = displayPosts.map(post => renderPost(post, userMap.get(post.user_id) || {}, liked.has(post.id))).join("");
  }
  function renderPost(post, user, isLiked) {
    const name = user.display_name || user.username || "ARS member";
    const handle = user.username ? "@"+user.username : "member";
    const media = post.image ? (post.media_type === "video"
      ? '<video class="post-media" src="'+escapeHTML(post.displayImage || post.image)+'" controls playsinline preload="metadata"></video>'
      : post.media_type === "audio"
        ? '<audio class="post-media" src="'+escapeHTML(post.displayImage || post.image)+'" controls></audio>'
        : '<img class="post-media" src="'+escapeHTML(post.displayImage || post.image)+'" alt="Post media" loading="lazy">') : "";
    const date = post.created_at ? new Date(post.created_at).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : "";
    return '<article class="post-card" data-post-id="'+escapeHTML(post.id)+'">'+
      '<div class="post-head">'+avatarMarkup(user)+'<div class="post-author"><strong>'+escapeHTML(name)+(user.verified?' <span style="color:#c17bff">◆</span>':'')+'</strong><small>'+escapeHTML(handle)+' · '+escapeHTML(date)+'</small></div><button class="post-menu" data-action="menu" aria-label="Post options">⋯</button></div>'+
      (post.content?'<p class="post-content">'+escapeHTML(post.content)+'</p>':'')+media+
      '<div class="post-actions"><button class="post-action '+(isLiked?'active':'')+'" data-action="like">♡ '+Number(post.likes_count||0)+'</button><button class="post-action" data-action="comment">▢ '+Number(post.comments_count||0)+'</button><button class="post-action" data-action="repost">⟳ '+Number(post.reposts_count||0)+'</button><button class="post-action" data-action="bookmark">♧ Save</button></div></article>';
  }
  async function loadStories() {
    const row = $("#storiesRow");
    const {data,error} = await client.from("stories").select("id,user_id,image,media_type,story_text,created_at,expires_at").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:true}).limit(50);
    if (error) { console.warn("Stories:",error.message); row.innerHTML = '<button class="story-item add-story" id="addStory"><span class="story-ring"><b>＋</b></span><small>Add story</small></button>'; return; }
    const items = data || [];
    stories = items;
    const ids = [...new Set(items.map(s=>s.user_id))];
    let users = [];
    if(ids.length) {
      const res = await client.from("users").select("id,username,display_name,avatar").in("id",ids);
      users = res.data || [];
    }
    const map = new Map(users.map(u=>[u.id,u]));
    row.innerHTML = '<button class="story-item add-story" id="addStory"><span class="story-ring"><b>＋</b></span><small>Add story</small></button>' +
      items.map((story,index)=>{
        const user=map.get(story.user_id)||{};
        const name=user.username||user.display_name||"Story";
        const thumb=user.avatar?'<img src="'+escapeHTML(user.avatar)+'" alt="">':'<span>'+escapeHTML(name[0]?.toUpperCase()||"A")+'</span>';
        return '<button class="story-item" data-story-index="'+index+'"><span class="story-ring">'+thumb+'</span><small>'+escapeHTML(name)+'</small></button>';
      }).join("");
    $("#addStory").addEventListener("click",()=>openDialog("storyDialog"));
  }
  async function loadNotifications() {
    const {count,error}=await client.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",currentUser.id).eq("is_read",false);
    if(!error) $("#notificationDot").classList.toggle("hidden",!(count>0));
  }
  async function openActivity() {
    const list=$("#activityList");
    list.innerHTML='<p class="muted">Loading activity…</p>';
    openDialog("activityDialog");
    const {data,error}=await client.from("notifications")
      .select("id,sender_id,type,post_id,is_read,metadata,created_at")
      .eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(50);
    if(error){list.textContent=error.message;return;}
    if(!data?.length){list.innerHTML='<p class="muted">You’re all caught up.</p>';return;}
    const senderIds=[...new Set(data.map(n=>n.sender_id).filter(Boolean))];
    const {data:senders}=senderIds.length?await client.from("users").select("id,username,display_name").in("id",senderIds):{data:[]};
    const map=new Map((senders||[]).map(u=>[u.id,u]));
    list.innerHTML=data.map(n=>{
      const sender=map.get(n.sender_id)||{};
      const label=sender.display_name||sender.username||"Someone";
      const type=String(n.type||"activity").replace(/[_-]/g," ");
      return '<button class="activity-item '+(n.is_read?'':'unread')+'" data-notification-id="'+escapeHTML(n.id)+'"><strong>'+escapeHTML(label)+'</strong> '+escapeHTML(type)+'<small>'+escapeHTML(new Date(n.created_at).toLocaleString())+'</small></button>';
    }).join("");
    const unread=data.filter(n=>!n.is_read).map(n=>n.id);
    if(unread.length){
      const {error:markError}=await client.from("notifications").update({is_read:true}).in("id",unread);
      if(!markError) $("#notificationDot").classList.add("hidden");
    }
  }
  async function uploadMedia(file,bucket,folder) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path = currentUser.id+"/"+folder+"/"+crypto.randomUUID()+"-"+safeName;
    const {data,error}=await client.storage.from(bucket).upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
    if(error) throw error;
    if(bucket==="post-media" || bucket==="avatars") {
      const {data:publicData}=client.storage.from(bucket).getPublicUrl(data.path);
      return publicData.publicUrl;
    }
    return data.path;
  }
  $("#createPost").addEventListener("click",()=>openDialog("postDialog"));
  $("#postMedia").addEventListener("change",e=>{
    selectedPostFile=e.target.files?.[0]||null;
    previewFile(selectedPostFile,"mediaPreview");
  });
  $("#storyMedia").addEventListener("change",e=>{
    selectedStoryFile=e.target.files?.[0]||null;
    previewFile(selectedStoryFile,"storyPreview");
  });
  function previewFile(file,target) {
    const box=$("#"+target); box.innerHTML="";
    if(!file) return;
    const url=URL.createObjectURL(file);
    const el=document.createElement(file.type.startsWith("video/")?"video":file.type.startsWith("audio/")?"audio":"img");
    el.src=url;
    if(el.tagName==="VIDEO"||el.tagName==="AUDIO") el.controls=true;
    box.appendChild(el);
  }
  $("#postForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const message=$("#postMessage"), content=$("#postContent").value.trim();
    if(!content&&!selectedPostFile){message.textContent="Write something or attach media first.";return;}
    const submit=e.submitter; submit.disabled=true; message.textContent="Publishing…";
    try{
      let image=null,mediaType="text";
      if(selectedPostFile){
        mediaType=selectedPostFile.type.startsWith("video/")?"video":selectedPostFile.type.startsWith("audio/")?"audio":"image";
        const bucket=$("#postPrivacy").value==="public"?"post-media":"private-post-media";
        image=await uploadMedia(selectedPostFile,bucket,"posts");
      }
      const hashtags=[...content.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(m=>m[1]);
      const {error}=await client.from("posts").insert({user_id:currentUser.id,content,image,media_type:mediaType,privacy:$("#postPrivacy").value,allow_comments:$("#allowComments").checked,hashtags,mentions:[]});
      if(error) throw error;
      $("#postContent").value="";$("#postMedia").value="";$("#mediaPreview").innerHTML="";selectedPostFile=null;
      closeDialog("postDialog");await loadFeed();
    }catch(err){console.error(err);message.textContent=err.message||"Could not publish your post.";}
    finally{submit.disabled=false;}
  });
  $("#storyForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const message=$("#storyMessage");
    if(!selectedStoryFile){message.textContent="Choose an image or video first.";return;}
    const submit=e.submitter;submit.disabled=true;message.textContent="Uploading story…";
    try{
      const privacy=$("#storyPrivacy").value;
      const image=await uploadMedia(selectedStoryFile,"story-media","stories");
      const type=selectedStoryFile.type.startsWith("video/")?"video":"image";
      const {error}=await client.from("stories").insert({user_id:currentUser.id,image,media_type:type,story_text:$("#storyText").value.trim(),privacy,expires_at:new Date(Date.now()+86400000).toISOString()});
      if(error)throw error;
      $("#storyText").value="";$("#storyMedia").value="";$("#storyPreview").innerHTML="";selectedStoryFile=null;
      closeDialog("storyDialog");await loadStories();
    }catch(err){console.error(err);message.textContent=err.message||"Could not share story.";}
    finally{submit.disabled=false;}
  });
  $("#feed").addEventListener("click",async e=>{
    const button=e.target.closest("[data-action]");if(!button)return;
    const card=button.closest("[data-post-id]");const id=card?.dataset.postId;if(!id)return;
    const action=button.dataset.action;
    try{
      if(action==="like"){
        const {data:existing,error:findError}=await client.from("likes").select("id").eq("post_id",id).eq("user_id",currentUser.id).maybeSingle();
        if(findError)throw findError;
        if(existing){const {error}=await client.from("likes").delete().eq("id",existing.id);if(error)throw error;}
        else {const {error}=await client.from("likes").insert({post_id:id,user_id:currentUser.id});if(error)throw error;}
        await loadFeed();
      }else if(action==="bookmark"){
        const {data:existing,error:findError}=await client.from("bookmarks").select("id").eq("post_id",id).eq("user_id",currentUser.id).maybeSingle();
        if(findError)throw findError;
        if(existing){const {error}=await client.from("bookmarks").delete().eq("id",existing.id);if(error)throw error;button.classList.remove("active");button.textContent="♧ Save";}
        else {const {error}=await client.from("bookmarks").insert({post_id:id,user_id:currentUser.id});if(error)throw error;button.classList.add("active");button.textContent="✓ Saved";}
      }else if(action==="repost"){
        const {data:existing,error:findError}=await client.from("reposts").select("id").eq("post_id",id).eq("user_id",currentUser.id).maybeSingle();
        if(findError)throw findError;
        if(existing){const {error}=await client.from("reposts").delete().eq("id",existing.id);if(error)throw error;button.classList.remove("active");}
        else {const {error}=await client.from("reposts").insert({post_id:id,user_id:currentUser.id});if(error)throw error;button.classList.add("active");}
      }else if(action==="comment"){
        activeCommentPostId=id; await loadComments(id); openDialog("commentsDialog");
      }else if(action==="menu"){
        showMessage("Post options","Post privacy and reporting controls will be available from the post details page.");
      }
    }catch(err){console.error(err);showMessage("Action failed",err.message||"Please try again.");}
  });

  async function loadComments(postId) {
    const list=$("#commentsList"); list.innerHTML='<p class="muted">Loading comments…</p>';
    const {data,error}=await client.from("comments").select("id,user_id,content,created_at").eq("post_id",postId).order("created_at",{ascending:true}).limit(100);
    if(error){list.textContent=error.message;return;} if(!data?.length){list.innerHTML='<p class="muted">No comments yet. Start the conversation.</p>';return;}
    const ids=[...new Set(data.map(c=>c.user_id).filter(Boolean))]; const {data:users}=ids.length?await client.from("users").select("id,username,display_name").in("id",ids):{data:[]}; const map=new Map((users||[]).map(u=>[u.id,u]));
    list.innerHTML=data.map(c=>{const u=map.get(c.user_id)||{};return '<article class="comment-item"><strong>'+escapeHTML(u.display_name||u.username||"ARS member")+'</strong><small>'+escapeHTML(new Date(c.created_at).toLocaleString())+'</small><p>'+escapeHTML(c.content)+'</p></article>';}).join("");
  }
  $("#commentForm").addEventListener("submit",async e=>{e.preventDefault();const input=$("#commentInput"),message=$("#commentMessage"),button=e.submitter,content=input.value.trim();if(!activeCommentPostId||!content)return;button.disabled=true;message.textContent="Sending…";try{const {error}=await client.from("comments").insert({post_id:activeCommentPostId,user_id:currentUser.id,content});if(error)throw error;input.value="";message.textContent="";await loadComments(activeCommentPostId);await loadFeed();}catch(err){message.textContent=err.message||"Could not send comment.";}finally{button.disabled=false;}});

  $("#storiesRow").addEventListener("click",async e=>{
    const item=e.target.closest("[data-story-index]");if(!item)return;
    const story=stories[Number(item.dataset.storyIndex)];if(!story)return;
    const content=$("#storyViewerContent");
    const media=story.media_type==="video"?document.createElement("video"):document.createElement("img");
    const {data:signed,error:signedError}=await client.storage.from("story-media").createSignedUrl(story.image,1800);
    if(signedError){showMessage("Story unavailable","This story media could not be opened.");return;}
    media.src=signed.signedUrl;
    if(media.tagName==="VIDEO"){media.controls=true;media.autoplay=true;media.playsInline=true;}
    content.innerHTML="";content.appendChild(media);
    if(story.story_text){const caption=document.createElement("div");caption.className="story-caption";caption.textContent=story.story_text;content.appendChild(caption);}
    openDialog("storyViewer");
    client.from("story_views").insert({story_id:story.id,viewer_id:currentUser.id}).then(({error})=>{if(error)console.warn("Story view:",error.message);});
  });
  $("#spinWheel").addEventListener("click",()=>openDialog("wheelDialog"));
  $("#confirmSpin").addEventListener("click",async e=>{
    const button=e.currentTarget,status=$("#spinStatus"),result=$("#wheelResult");
    button.disabled=true;status.textContent="Spinning…";
    try{
      const {data,error}=await client.rpc("spin_rewards_wheel");
      if(error)throw error;
      const reward=Array.isArray(data)?data[0]:data;
      result.textContent=reward?.title||reward?.message||reward?.reward_code||"Your spin has been recorded. Check your rewards.";
      status.textContent="Your wheel result was returned by ARS.";
      $("#wheelHint").textContent="Spin recorded";
    }catch(err){console.error(err);status.textContent=err.message||"Wheel is temporarily unavailable.";}
    finally{button.disabled=false;}
  });
  document.addEventListener("click",e=>{
    const closer=e.target.closest("[data-close]");
    if(closer)closeDialog(closer.dataset.close);
  });
  $("#refreshFeed").addEventListener("click",loadFeed);
  $("#profileShortcut").addEventListener("click",()=>showMessage("Profile","Your profile page will open here when its page is added."));
  $("#openSearch").addEventListener("click",()=>location.href="search.html");
  $("#navSearch").addEventListener("click",()=>location.href="search.html");
  $("#openNotifications").addEventListener("click",openActivity);
  $("#navNotifications").addEventListener("click",openActivity);
  $("#navStreak").addEventListener("click",()=>openDialog("streakDialog"));
  $("#streakInviteForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const input=$("#streakUsername"),message=$("#streakMessage"),button=e.submitter;
    const username=input.value.trim().replace(/^@/,"");
    if(!username)return;
    button.disabled=true;message.textContent="Sending invitation…";
    try{
      const {data,error}=await client.rpc("send_streak_invite",{p_to_username:username});
      if(error)throw error;
      message.textContent=data?.message||"Invitation sent.";
      input.value="";
    }catch(err){message.textContent=err.message||"Could not send invitation.";}
    finally{button.disabled=false;}
  });
  async function start(){
    try{
      const user=await requireSession();if(!user)return;
      setProfileHeader();
      await Promise.all([loadFeed(),loadStories(),loadNotifications()]);
    }catch(err){
      console.error("ARS home startup:",err);
      showMessage("Could not open ARS",err.message||"Please sign in again.");
    }
  }
  start();
})();