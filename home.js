const SUPABASE_URL =
  "https://bfqsqgfyyewnfxekirfv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const ARS_WHEEL_FREE_SPINS = 2;
const ARS_WHEEL_STORAGE_KEY = "ars_wheel_spins";

const $ = (id) =>
  document.getElementById(id);

const state = {
  initialized:false,
  user:null,
  posts:[],
  stories:[],
  comments:new Map(),
  currentPostId:null,
  currentStoryGroup:[],
  currentStoryIndex:0,
  storyFile:null,
  storyMediaData:null,
  storyMediaType:"image",
  storyZoom:1,
  storyFilter:"none",
  storySticker:null,
  wheelSpins:0,
  wheelRotation:0,
  searchQuery:""
};

const WHEEL_CHALLENGES = [
  {
    title:"Post something today",
    category:"POST",
    reward:20
  },
  {
    title:"Share a story",
    category:"STORY",
    reward:25
  },
  {
    title:"Like three posts",
    category:"LIKE",
    reward:15
  },
  {
    title:"Use a hashtag",
    category:"TAG",
    reward:10
  },
  {
    title:"Leave a comment",
    category:"COMMENT",
    reward:15
  },
  {
    title:"Keep your streak alive",
    category:"STREAK",
    reward:30
  }
];

function safeError(
  context,
  error
){
  try{
    if(
      window.ARSErrors &&
      typeof window.ARSErrors.capture === "function"
    ){
      window.ARSErrors.capture(
        context,
        error
      );
      return;
    }
  }catch(_){}

  console.error(
    `[ARS:${context}]`,
    error
  );
}

function escapeHtml(
  value
){
  return String(
    value ?? ""
  )
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function formatCount(
  value
){
  const number =
    Number(value || 0);

  if(number >= 1000000){
    return `${(number/1000000).toFixed(1)}M`;
  }

  if(number >= 1000){
    return `${(number/1000).toFixed(1)}K`;
  }

  return String(number);
}

function timeAgo(
  date
){
  const time =
    new Date(date).getTime();

  if(!time){
    return "";
  }

  const seconds =
    Math.floor(
      (Date.now()-time)/1000
    );

  if(seconds < 60){
    return "now";
  }

  const minutes =
    Math.floor(seconds/60);

  if(minutes < 60){
    return `${minutes}m`;
  }

  const hours =
    Math.floor(minutes/60);

  if(hours < 24){
    return `${hours}h`;
  }

  const days =
    Math.floor(hours/24);

  if(days < 7){
    return `${days}d`;
  }

  return new Date(date)
    .toLocaleDateString();
}

function refreshIcons(){
  try{
    if(window.lucide){
      window.lucide.createIcons();
    }
  }catch(error){
    safeError(
      "icons",
      error
    );
  }
}

function showToast(
  message
){
  const toast =
    $("toast");

  if(!toast){
    return;
  }

  toast.textContent =
    String(message);

  toast.classList.add("show");

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () =>
        toast.classList.remove("show"),
      2800
    );
}

function normalizeUser(
  user
){
  const value =
    user || {};

  return {
    id:value.id || "",
    username:value.username || "user",
    display_name:
      value.display_name ||
      value.username ||
      "User",
    email:value.email || "",
    bio:value.bio || "",
    avatar:value.avatar || "",
    verified:Boolean(value.verified),
    plan:value.plan || "free",
    streak:Number(value.streak || 0),
    xp:Number(value.xp || 0)
  };
}

function avatarMarkup(
  user,
  className="avatar"
){
  const normalized =
    normalizeUser(user);

  if(normalized.avatar){
    return `
      <span class="${escapeHtml(className)}">
        <img
          src="${escapeHtml(normalized.avatar)}"
          alt=""
        >
      </span>
    `;
  }

  const letter =
    (
      normalized.display_name ||
      normalized.username ||
      "A"
    )
      .trim()
      .charAt(0)
      .toUpperCase() ||
      "A";

  return `
    <span class="${escapeHtml(className)}">
      ${escapeHtml(letter)}
    </span>
  `;
}

function normalizePost(
  row
){
  const user =
    normalizeUser(
      row?.users ||
      row?.user ||
      {}
    );

  return {
    id:row.id,
    created_at:row.created_at,
    user_id:row.user_id,
    user,
    content:row.content || "",
    image:row.image || "",
    likes_count:Number(row.likes_count || 0),
    comments_count:Number(row.comments_count || 0),
    reposts_count:Number(row.reposts_count || 0),
    views_count:Number(row.views_count || 0),
    liked:Boolean(row.liked),
    reposted:Boolean(row.reposted),
    bookmarked:Boolean(row.bookmarked)
  };
}

function normalizeStory(
  row
){
  return {
    id:row.id,
    created_at:row.created_at,
    user_id:row.user_id,
    user:normalizeUser(
      row.users ||
      row.user ||
      {}
    ),
    image:row.image || "",
    viewers_count:Number(
      row.viewers_count || 0
    ),
    expires_at:row.expires_at,
    media_type:
      row.media_type ||
      (
        String(row.image || "")
          .startsWith("data:video/")
          ? "video"
          : "image"
      ),
    story_text:row.story_text || "",
    text_position:
      row.text_position || "center",
    text_color:
      row.text_color || "#ffffff",
    filter:
      row.filter || "none",
    sticker:
      row.sticker || null,
    zoom:Number(row.zoom || 1)
  };
}

function hashtagsFromText(
  text
){
  const matches =
    String(text || "")
      .match(
        /#[\p{L}\p{N}_]+/gu
      ) || [];

  return [
    ...new Set(
      matches.map(
        (tag) =>
          tag.slice(1).toLowerCase()
      )
    )
  ];
}

function renderRichText(
  text
){
  const escaped =
    escapeHtml(text);

  return escaped.replace(
    /(^|\s)#([\p{L}\p{N}_]+)/gu,
    '$1<span class="hashtag" data-hashtag="$2">#$2</span>'
  );
}

async function loadCurrentUser(){
  const {
    data:{
      user:authUser
    },
    error:authError
  } =
    await supabaseClient.auth.getUser();

  if(authError){
    throw authError;
  }

  if(!authUser){
    return null;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("users")
      .select("*")
      .eq("id",authUser.id)
      .maybeSingle();

  if(error){
    throw error;
  }

  return normalizeUser(
    data || {
      id:authUser.id,
      email:authUser.email
    }
  );
}

async function loadPosts(){
  const {
    data,
    error
  } =
    await supabaseClient
      .from("posts")
      .select(`
        id,
        created_at,
        user_id,
        content,
        image,
        likes_count,
        comments_count,
        reposts_count,
        views_count,
        users:user_id(
          id,
          username,
          display_name,
          email,
          bio,
          avatar,
          verified,
          plan,
          streak,
          xp
        )
      `)
      .order(
        "created_at",
        {ascending:false}
      );

  if(error){
    throw error;
  }

  state.posts =
    (data || []).map(
      normalizePost
    );
}

async function loadStories(){
  const {
    data,
    error
  } =
    await supabaseClient
      .from("stories")
      .select(`
        id,
        created_at,
        user_id,
        image,
        viewers_count,
        expires_at,
        media_type,
        story_text,
        text_position,
        text_color,
        filter,
        sticker,
        zoom,
        users:user_id(
          id,
          username,
          display_name,
          email,
          bio,
          avatar,
          verified,
          plan,
          streak,
          xp
        )
      `)
      .order(
        "created_at",
        {ascending:false}
      );

  if(error){
    throw error;
  }

  state.stories =
    (data || []).map(
      normalizeStory
    );
}

async function loadAll(){
  try{
    state.user =
      await loadCurrentUser();

    if(!state.user){
      showToast(
        "Please log in first."
      );
      return;
    }

    await Promise.all([
      loadPosts(),
      loadStories()
    ]);

    renderAll();
    updateUserUI();
  }catch(error){
    safeError(
      "load",
      error
    );

    showToast(
      error.message ||
      "Unable to load ARS."
    );
  }
    }
function updateUserUI(){
  const profileButton =
    $("profileButton");

  if(profileButton){
    profileButton.innerHTML =
      avatarMarkup(
        state.user,
        "avatar top-avatar"
      );
  }

  const composeAvatar =
    $("composeAvatar");

  if(composeAvatar){
    composeAvatar.innerHTML =
      avatarMarkup(
        state.user,
        "avatar"
      );
  }

  refreshIcons();
}

function renderStories(){
  const container =
    $("stories");

  if(!container){
    return;
  }

  const groups =
    new Map();

  state.stories.forEach(
    (story)=>{
      if(!story.user_id){
        return;
      }

      if(!groups.has(story.user_id)){
        groups.set(
          story.user_id,
          []
        );
      }

      groups.get(
        story.user_id
      ).push(story);
    }
  );

  if(state.user?.id &&
     !groups.has(state.user.id)){
    groups.set(
      state.user.id,
      []
    );
  }

  const entries =
    [...groups.entries()];

  entries.sort(
    ([a],[b]) =>
      String(a) ===
      String(state.user?.id)
        ? -1
        : String(b) ===
          String(state.user?.id)
          ? 1
          : 0
  );

  container.innerHTML =
    entries.map(
      ([userId,stories])=>{
        const user =
          stories[0]?.user ||
          (
            String(userId) ===
            String(state.user?.id)
              ? state.user
              : {}
          );

        const own =
          String(userId) ===
          String(state.user?.id);

        return `
          <button
            type="button"
            class="story-item"
            data-story-user="${escapeHtml(userId)}"
          >
            <span class="story-ring">
              ${avatarMarkup(
                user,
                "avatar story-avatar"
              )}
            </span>

            ${
              own
                ? `
                  <span class="story-plus">
                    <i data-lucide="plus"></i>
                  </span>
                `
                : ""
            }

            <span class="story-name">
              ${escapeHtml(
                own
                  ? "You"
                  : user.display_name ||
                    user.username ||
                    "User"
              )}
            </span>
          </button>
        `;
      }
    ).join("");

  refreshIcons();
}

function postMarkup(
  post
){
  return `
    <article
      class="post-card"
      data-post-id="${escapeHtml(post.id)}"
    >
      <div class="post-head">

        <button
          type="button"
          class="post-avatar-button"
          data-profile-user="${escapeHtml(post.user_id)}"
        >
          ${avatarMarkup(
            post.user,
            "avatar post-avatar"
          )}
        </button>

        <button
          type="button"
          class="post-user"
          data-profile-user="${escapeHtml(post.user_id)}"
        >
          <strong>
            ${escapeHtml(post.user.display_name)}
            ${
              post.user.verified
                ? `
                  <span class="verified">
                    <i data-lucide="badge-check"></i>
                  </span>
                `
                : ""
            }
          </strong>

          <span>
            @${escapeHtml(post.user.username)}
            · ${escapeHtml(timeAgo(post.created_at))}
          </span>
        </button>

        <button
          type="button"
          class="more"
        >
          <i data-lucide="more-horizontal"></i>
        </button>
      </div>

      ${
        post.content
          ? `
            <div class="post-text">
              ${renderRichText(post.content)}
            </div>
          `
          : ""
      }

      ${
        post.image
          ? `
            <img
              class="post-image"
              src="${escapeHtml(post.image)}"
              alt=""
              loading="lazy"
            >
          `
          : ""
      }

      <div class="actions">
        <button
          type="button"
          class="${post.liked ? "liked" : ""}"
          data-action="like"
          data-id="${escapeHtml(post.id)}"
        >
          <i data-lucide="heart"></i>
          <span>${formatCount(post.likes_count)}</span>
        </button>

        <button
          type="button"
          data-action="comment"
          data-id="${escapeHtml(post.id)}"
        >
          <i data-lucide="message-circle"></i>
          <span>${formatCount(post.comments_count)}</span>
        </button>

        <button
          type="button"
          class="${post.reposted ? "reposted" : ""}"
          data-action="repost"
          data-id="${escapeHtml(post.id)}"
        >
          <i data-lucide="repeat-2"></i>
          <span>${formatCount(post.reposts_count)}</span>
        </button>

        <button
          type="button"
          class="${post.bookmarked ? "bookmarked" : ""}"
          data-action="bookmark"
          data-id="${escapeHtml(post.id)}"
        >
          <i data-lucide="bookmark"></i>
        </button>

        <button
          type="button"
          class="views"
          data-action="view"
          data-id="${escapeHtml(post.id)}"
        >
          <i data-lucide="eye"></i>
          <span>${formatCount(post.views_count)}</span>
        </button>
      </div>
    </article>
  `;
}

function renderPosts(
  list=state.posts,
  target=$("feed")
){
  if(!target){
    return;
  }

  if(!list.length){
    target.innerHTML = `
      <div class="empty-feed">
        <i data-lucide="file-text"></i>
        <h2>No posts yet</h2>
        <p>Create a post and it will appear here.</p>
      </div>
    `;
  }else{
    target.innerHTML =
      list.map(
        postMarkup
      ).join("");
  }

  refreshIcons();
}

function buildHashtagCounts(){
  const counts =
    new Map();

  state.posts.forEach(
    (post)=>{
      hashtagsFromText(
        post.content
      ).forEach(
        (tag)=>{
          counts.set(
            tag,
            (counts.get(tag)||0)+1
          );
        }
      );
    }
  );

  return counts;
}

function renderTrending(){
  const target =
    $("trendingList");

  if(!target){
    return;
  }

  const counts =
    buildHashtagCounts();

  const rows =
    [...counts.entries()]
      .sort(
        (a,b)=>b[1]-a[1]
      )
      .slice(0,20);

  const suggestions = [
    ["focus","Focus"],
    ["life","Life"],
    ["technology","Technology"],
    ["travel","Travel"],
    ["fitness","Fitness"],
    ["music","Music"]
  ];

  const live =
    rows.map(
      ([tag,count])=>`
        <button
          type="button"
          class="trend"
          data-trending-tag="${escapeHtml(tag)}"
        >
          <b>#</b>
          <div>
            <strong>#${escapeHtml(tag)}</strong>
            <span>${count} posts</span>
          </div>
          <i data-lucide="chevron-right"></i>
        </button>
      `
    );

  const preview =
    suggestions.map(
      ([tag,label])=>`
        <button
          type="button"
          class="trend"
          data-trending-tag="${escapeHtml(tag)}"
        >
          <b>#</b>
          <div>
            <strong>#${escapeHtml(tag)}</strong>
            <span>${escapeHtml(label)} · Discover topic</span>
          </div>
          <i data-lucide="chevron-right"></i>
        </button>
      `
    );

  target.innerHTML =
    live.length
      ? live.join("") +
        `<div class="trend-preview"><span>Discover more</span><p>Suggested topics are discovery categories, not live trend counts.</p></div>` +
        preview.join("")
      : preview.join("");

  refreshIcons();
}

function renderStreak(){
  const value =
    Number(
      state.user?.streak || 0
    );

  if($("streakNumber")){
    $("streakNumber").textContent =
      value;
  }

  if($("streakText")){
    $("streakText").textContent =
      "day streak";
  }

  if($("weekDots")){
    $("weekDots").innerHTML =
      Array.from(
        {length:7},
        (_,index)=>`
          <span>
            ${
              index <
              Math.min(value,7)
                ? "✓"
                : ""
            }
          </span>
        `
      ).join("");
  }

  if($("streakDone")){
    $("streakDone").textContent =
      value
        ? "Keep your ARS streak going."
        : "Start your streak by staying active.";
  }

  refreshIcons();
}

function renderProfile(
  user=state.user,
  posts=state.posts.filter(
    post =>
      String(post.user_id) ===
      String(user?.id)
  )
){
  const target =
    $("profileHero");

  if(!target || !user){
    return;
  }

  target.innerHTML = `
    <div class="profile-card">
      ${avatarMarkup(
        user,
        "avatar profile-avatar"
      )}
      <div>
        <h1>${escapeHtml(user.display_name)}</h1>
        <p>@${escapeHtml(user.username)}</p>
        ${
          user.bio
            ? `<span>${escapeHtml(user.bio)}</span>`
            : ""
        }
      </div>
    </div>
  `;

  renderPosts(
    posts,
    $("profilePostsList")
  );
}

async function openProfileFromUser(
  userId
){
  if(!userId){
    return;
  }

  if(
    state.user &&
    String(userId) ===
    String(state.user.id)
  ){
    showPage("profilePage");
    return;
  }

  try{
    const {
      data:user,
      error:userError
    } =
      await supabaseClient
        .from("users")
        .select("*")
        .eq("id",userId)
        .maybeSingle();

    if(userError){
      throw userError;
    }

    if(!user){
      showToast(
        "Profile is not available."
      );
      return;
    }

    const {
      data:posts,
      error:postsError
    } =
      await supabaseClient
        .from("posts")
        .select(`
          id,
          created_at,
          user_id,
          content,
          image,
          likes_count,
          comments_count,
          reposts_count,
          views_count,
          users:user_id(
            id,
            username,
            display_name,
            avatar,
            verified,
            plan
          )
        `)
        .eq(
          "user_id",
          userId
        )
        .order(
          "created_at",
          {ascending:false}
        );

    if(postsError){
      throw postsError;
    }

    renderProfile(
      normalizeUser(user),
      (posts||[]).map(
        normalizePost
      )
    );

    showPage("profilePage");
  }catch(error){
    safeError(
      "profile",
      error
    );
    showToast(
      error.message ||
      "Unable to open profile."
    );
  }
}

function showPage(
  pageId
){
  document
    .querySelectorAll(".page")
    .forEach(
      page =>
        page.classList.toggle(
          "active",
          page.id === pageId
        )
    );

  document
    .querySelectorAll(".nav-item[data-page]")
    .forEach(
      button =>
        button.classList.toggle(
          "active",
          button.dataset.page === pageId
        )
    );

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

  if(pageId === "profilePage"){
    renderProfile();
  }

  if(pageId === "trendingPage"){
    renderTrending();
  }

  if(pageId === "streakPage"){
    renderStreak();
  }

  if(pageId === "wheelPage"){
    renderWheel();
  }

  if(pageId === "searchPage"){
    $("searchInput")?.focus();
  }
      }
function openModal(id){
  $(id)?.classList.add("open");
}

function closeModal(id){
  $(id)?.classList.remove("open");
}

function resetPostComposer(){
  state.postImageData = null;

  if($("createPostText")){
    $("createPostText").value = "";
  }

  if($("createPostImage")){
    $("createPostImage").value = "";
  }

  if($("postImagePreview")){
    $("postImagePreview").innerHTML = "";
  }
}

function openPostComposer(){
  resetPostComposer();

  if($("composeAvatar")){
    $("composeAvatar").innerHTML =
      avatarMarkup(
        state.user,
        "avatar"
      );
  }

  openModal(
    "createPostModal"
  );
}

function resetStoryEditor(){
  state.storyFile = null;
  state.storyMediaData = null;
  state.storyMediaType = "image";
  state.storyZoom = 1;
  state.storyFilter = "none";
  state.storySticker = null;

  const input =
    $("storyImage");

  if(input){
    input.value = "";
    input.accept = "image/*,video/*";
  }

  const canvas =
    $("storyCanvas");

  canvas?.querySelector(
    ".ars-story-editor-media"
  )?.remove();

  if($("storyCanvasEmpty")){
    $("storyCanvasEmpty").style.display =
      "flex";
  }

  if($("storyImagePreview")){
    $("storyImagePreview").style.display =
      "none";
    $("storyImagePreview").removeAttribute("src");
  }

  if($("storyText")){
    $("storyText").value = "";
  }

  if($("storyTextPreview")){
    $("storyTextPreview").textContent = "";
    $("storyTextPreview").style.color = "#fff";
  }

  if($("storyPosition")){
    $("storyPosition").value = "center";
  }

  if($("storyTextColor")){
    $("storyTextColor").value = "#ffffff";
  }

  updateStoryEditorPreview();
}

function openStoryEditor(){
  resetStoryEditor();
  openModal("createStoryModal");
  refreshIcons();
}

function readFileAsDataUrl(
  file
){
  return new Promise(
    (resolve,reject)=>{
      const reader =
        new FileReader();

      reader.onload =
        () => resolve(reader.result);

      reader.onerror =
        reject;

      reader.readAsDataURL(file);
    }
  );
}

async function handleStoryFile(
  file
){
  if(!file){
    return;
  }

  const isVideo =
    file.type.startsWith("video/");

  const isImage =
    file.type.startsWith("image/");

  if(!isVideo && !isImage){
    showToast(
      "Choose an image or video."
    );
    return;
  }

  try{
    state.storyFile = file;
    state.storyMediaType =
      isVideo ? "video" : "image";

    state.storyMediaData =
      await readFileAsDataUrl(file);

    updateStoryEditorPreview();
  }catch(error){
    safeError(
      "story-file",
      error
    );
    showToast(
      "Unable to read this file."
    );
  }
}

function updateStoryEditorPreview(){
  const canvas =
    $("storyCanvas");

  if(!canvas){
    return;
  }

  let media =
    canvas.querySelector(
      ".ars-story-editor-media"
    );

  if(state.storyMediaData){

    if(
      state.storyMediaType === "video"
    ){
      if(
        !media ||
        media.tagName !== "VIDEO"
      ){
        media?.remove();

        media =
          document.createElement("video");

        media.className =
          "ars-story-editor-media";

        media.muted = true;
        media.loop = true;
        media.autoplay = true;
        media.playsInline = true;

        canvas.prepend(media);
      }

      media.src =
        state.storyMediaData;

      media.style.display = "block";
    }else{
      if(
        !media ||
        media.tagName !== "IMG"
      ){
        media?.remove();

        media =
          document.createElement("img");

        media.className =
          "ars-story-editor-media";

        canvas.prepend(media);
      }

      media.src =
        state.storyMediaData;

      media.style.display = "block";
    }

    media.style.transform =
      `scale(${state.storyZoom})`;

    media.style.filter =
      state.storyFilter === "bw"
        ? "grayscale(1)"
        : state.storyFilter === "warm"
          ? "sepia(.35) saturate(1.25)"
          : "none";

    if($("storyCanvasEmpty")){
      $("storyCanvasEmpty").style.display =
        "none";
    }
  }else{
    media?.remove();

    if($("storyCanvasEmpty")){
      $("storyCanvasEmpty").style.display =
        "flex";
    }
  }

  const preview =
    $("storyTextPreview");

  if(preview){
    const text =
      $("storyText")?.value || "";

    const position =
      $("storyPosition")?.value ||
      "center";

    preview.textContent = text;

    preview.style.color =
      $("storyTextColor")?.value ||
      "#ffffff";

    preview.style.top =
      position === "top"
        ? "20%"
        : position === "bottom"
          ? "75%"
          : "45%";
  }

  refreshIcons();
}

async function publishPost(){
  const content =
    $("createPostText")
      ?.value.trim() || "";

  if(
    !content &&
    !state.postImageData
  ){
    showToast(
      "Write something or add an image."
    );
    return;
  }

  if(!state.user?.id){
    showToast(
      "Please log in first."
    );
    return;
  }

  try{
    const {
      data,
      error
    } =
      await supabaseClient
        .from("posts")
        .insert({
          user_id:state.user.id,
          content,
          image:state.postImageData || null
        })
        .select(`
          id,
          created_at,
          user_id,
          content,
          image,
          likes_count,
          comments_count,
          reposts_count,
          views_count,
          users:user_id(
            id,
            username,
            display_name,
            avatar,
            verified,
            plan
          )
        `)
        .single();

    if(error){
      throw error;
    }

    state.posts.unshift(
      normalizePost(data)
    );

    closeModal("createPostModal");
    renderPosts();
    renderTrending();

    showToast("Post published.");
  }catch(error){
    safeError(
      "publish-post",
      error
    );

    showToast(
      error.message ||
      "Unable to publish post."
    );
  }
}

async function publishStory(){
  if(!state.user?.id){
    showToast(
      "Please log in first."
    );
    return;
  }

  const text =
    $("storyText")
      ?.value.trim() || "";

  if(
    !state.storyMediaData &&
    !text
  ){
    showToast(
      "Add a photo, video, or text first."
    );
    return;
  }

  try{
    const {
      data,
      error
    } =
      await supabaseClient
        .from("stories")
        .insert({
          user_id:state.user.id,
          image:state.storyMediaData || null,
          media_type:state.storyMediaType,
          story_text:text,
          text_position:
            $("storyPosition")?.value ||
            "center",
          text_color:
            $("storyTextColor")?.value ||
            "#ffffff",
          filter:state.storyFilter,
          sticker:state.storySticker,
          zoom:state.storyZoom,
          expires_at:
            new Date(
              Date.now()+86400000
            ).toISOString()
        })
        .select(`
          id,
          created_at,
          user_id,
          image,
          viewers_count,
          expires_at,
          media_type,
          story_text,
          text_position,
          text_color,
          filter,
          sticker,
          zoom,
          users:user_id(
            id,
            username,
            display_name,
            avatar,
            verified,
            plan
          )
        `)
        .single();

    if(error){
      throw error;
    }

    state.stories.unshift(
      normalizeStory(data)
    );

    closeModal(
      "createStoryModal"
    );

    renderStories();

    showToast(
      "Story published."
    );
  }catch(error){
    safeError(
      "publish-story",
      error
    );

    showToast(
      error.message ||
      "Unable to publish story."
    );
  }
}

async function togglePostAction(
  action,
  postId
){
  const post =
    state.posts.find(
      item =>
        String(item.id) ===
        String(postId)
    );

  if(!post || !state.user?.id){
    return;
  }

  if(action === "comment"){
    await openComments(postId);
    return;
  }

  if(action === "view"){
    await incrementViews(post);
    return;
  }

  const table =
    action === "like"
      ? "likes"
      : action === "repost"
        ? "reposts"
        : "bookmarks";

  try{
    const {
      data:existing,
      error:selectError
    } =
      await supabaseClient
        .from(table)
        .select("id")
        .eq("post_id",postId)
        .eq("user_id",state.user.id)
        .maybeSingle();

    if(selectError){
      throw selectError;
    }

    if(existing){
      const {
        error
      } =
        await supabaseClient
          .from(table)
          .delete()
          .eq("id",existing.id);

      if(error){
        throw error;
      }
    }else{
      const {
        error
      } =
        await supabaseClient
          .from(table)
          .insert({
            post_id:postId,
            user_id:state.user.id
          });

      if(error){
        throw error;
      }
    }

    await loadPosts();
    renderPosts();
    renderTrending();
  }catch(error){
    safeError(
      `post-${action}`,
      error
    );

    showToast(
      error.message ||
      "Action failed."
    );
  }
}

async function incrementViews(
  post
){
  const next =
    Number(post.views_count || 0)+1;

  post.views_count = next;
  renderPosts();

  const {
    error
  } =
    await supabaseClient
      .from("posts")
      .update({
        views_count:next
      })
      .eq("id",post.id);

  if(error){
    safeError(
      "views",
      error
    );
  }
}

async function openComments(
  postId
){
  state.currentPostId = postId;

  const list =
    $("commentsList");

  if(!list){
    return;
  }

  list.innerHTML =
    `<div class="comments-empty">Loading comments...</div>`;

  openModal("commentsModal");

  const {
    data,
    error
  } =
    await supabaseClient
      .from("comments")
      .select(`
        id,
        created_at,
        post_id,
        user_id,
        content,
        users:user_id(
          id,
          username,
          display_name,
          avatar,
          verified,
          plan
        )
      `)
      .eq("post_id",postId)
      .order(
        "created_at",
        {ascending:true}
      );

  if(error){
    safeError(
      "comments-load",
      error
    );

    list.innerHTML =
      `<div class="comments-empty">Unable to load comments.</div>`;

    return;
  }

  state.comments.set(
    String(postId),
    data || []
  );

  renderComments(postId);
}

function renderComments(
  postId
){
  const list =
    $("commentsList");

  const comments =
    state.comments.get(
      String(postId)
    ) || [];

  if(!comments.length){
    list.innerHTML =
      `<div class="comments-empty">No comments yet.</div>`;
    return;
  }

  list.innerHTML =
    comments.map(
      comment=>{
        const user =
          normalizeUser(
            comment.users
          );

        return `
          <article class="comment-item">
            ${avatarMarkup(
              user,
              "avatar small"
            )}

            <div class="comment-content">
              <div class="comment-meta">
                <strong>${escapeHtml(user.display_name)}</strong>
                <span>@${escapeHtml(user.username)}</span>
                <span>${escapeHtml(timeAgo(comment.created_at))}</span>
              </div>
              <p>${escapeHtml(comment.content)}</p>
            </div>
          </article>
        `;
      }
    ).join("");
}

async function sendComment(){
  const input =
    $("commentInput");

  const content =
    input?.value.trim() || "";

  if(
    !content ||
    !state.currentPostId ||
    !state.user?.id
  ){
    return;
  }

  try{
    const {
      error
    } =
      await supabaseClient
        .from("comments")
        .insert({
          post_id:state.currentPostId,
          user_id:state.user.id,
          content
        });

    if(error){
      throw error;
    }

    input.value = "";

    await openComments(
      state.currentPostId
    );

    await loadPosts();
    renderPosts();
  }catch(error){
    safeError(
      "comment-send",
      error
    );

    showToast(
      error.message ||
      "Unable to send comment."
    );
  }
}

function openStoryGroup(
  userId
){
  const group =
    state.stories.filter(
      story =>
        String(story.user_id) ===
        String(userId)
    );

  if(!group.length){
    if(
      String(userId) ===
      String(state.user?.id)
    ){
      openStoryEditor();
    }
    return;
  }

  state.currentStoryGroup = group;
  state.currentStoryIndex = 0;

  renderStoryViewer();
  openModal("storyViewer");
  recordStoryView(group[0]);
}

function renderStoryViewer(){
  const story =
    state.currentStoryGroup[
      state.currentStoryIndex
    ];

  if(!story){
    return;
  }

  const media =
    $("storyViewerMedia");

  if(media){
    media.innerHTML = "";

    if(
      story.media_type === "video"
    ){
      const video =
        document.createElement("video");

      video.src = story.image;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.className =
        "story-viewer-video";

      media.appendChild(video);

      video.play().catch(
        ()=>{}
      );
    }else if(story.image){
      const image =
        document.createElement("img");

      image.src = story.image;
      image.alt = "";

      media.appendChild(image);
    }
  }

  const text =
    $("storyViewerText");

  if(text){
    text.textContent =
      story.story_text || "";

    text.style.color =
      story.text_color || "#ffffff";

    text.style.top =
      story.text_position === "top"
        ? "20%"
        : story.text_position === "bottom"
          ? "75%"
          : "45%";
  }

  const user =
    $("storyViewerUser");

  if(user){
    user.innerHTML = `
      ${avatarMarkup(
        story.user,
        "avatar viewer-avatar"
      )}
      <div>
        <strong>${escapeHtml(story.user.display_name)}</strong>
        <span>@${escapeHtml(story.user.username)}</span>
      </div>
    `;
  }

  refreshIcons();
}

async function recordStoryView(
  story
){
  if(
    !story?.id ||
    !state.user?.id ||
    String(story.user_id) ===
    String(state.user.id)
  ){
    return;
  }

  const {
    data:existing
  } =
    await supabaseClient
      .from("story_views")
      .select("id")
      .eq("story_id",story.id)
      .eq("viewer_id",state.user.id)
      .maybeSingle();

  if(existing){
    return;
  }

  const {
    error
  } =
    await supabaseClient
      .from("story_views")
      .insert({
        story_id:story.id,
        viewer_id:state.user.id
      });

  if(error){
    return;
  }

  story.viewers_count += 1;
}

function nextStory(){
  if(
    state.currentStoryIndex >=
    state.currentStoryGroup.length-1
  ){
    closeModal("storyViewer");
    return;
  }

  state.currentStoryIndex += 1;

  renderStoryViewer();

  recordStoryView(
    state.currentStoryGroup[
      state.currentStoryIndex
    ]
  );
}

function getWheelStorage(){
  try{
    const raw =
      localStorage.getItem(
        ARS_WHEEL_STORAGE_KEY
      );

    if(!raw){
      return {spins:0};
    }

    const value =
      JSON.parse(raw);

    return {
      spins:Number(value.spins || 0)
    };
  }catch(_){
    return {spins:0};
  }
}

function saveWheelStorage(
  spins
){
  localStorage.setItem(
    ARS_WHEEL_STORAGE_KEY,
    JSON.stringify({spins})
  );

  state.wheelSpins = spins;
}

function wheelRemainingSpins(){
  if(
    state.user?.plan ===
    "premium"
  ){
    return Infinity;
  }

  return Math.max(
    0,
    ARS_WHEEL_FREE_SPINS -
    state.wheelSpins
  );
}

function renderWheelSegments(){
  const wheel =
    $("wheel");

  if(!wheel){
    return;
  }

  const count =
    WHEEL_CHALLENGES.length;

  const angle =
    360/count;

  wheel.innerHTML = `
    <div class="ars-wheel-center">
      <i data-lucide="sparkles"></i>
    </div>
    ${WHEEL_CHALLENGES.map(
      (challenge,index)=>`
        <div
          class="ars-wheel-segment"
          style="--angle:${index*angle}deg"
        >
          <span>${escapeHtml(challenge.category)}</span>
        </div>
      `
    ).join("")}
  `;

  refreshIcons();
}

function renderWheel(){
  renderWheelSegments();

  const remaining =
    wheelRemainingSpins();

  if($("spinCounter")){
    $("spinCounter").textContent =
      remaining === Infinity
        ? "Unlimited spins"
        : `${remaining} free spin${remaining === 1 ? "" : "s"} remaining`;
  }

  if($("planLabel")){
    $("planLabel").textContent =
      state.user?.plan === "premium"
        ? "Premium"
        : "Free";
  }

  if($("spinButton")){
    $("spinButton").disabled =
      remaining === 0 &&
      state.user?.plan !== "premium";
  }

  if($("wheelSubscribeButton")){
    $("wheelSubscribeButton").style.display =
      remaining === 0 &&
      state.user?.plan !== "premium"
        ? "inline-flex"
        : "none";
  }

  refreshIcons();
}

async function spinWheel(){
  const wheel =
    $("wheel");

  if(!wheel){
    return;
  }

  const remaining =
    wheelRemainingSpins();

  if(
    remaining === 0 &&
    state.user?.plan !== "premium"
  ){
    renderWheel();

    showToast(
      "Your 2 free spins are finished."
    );

    return;
  }

  const index =
    Math.floor(
      Math.random()*
      WHEEL_CHALLENGES.length
    );

  const challenge =
    WHEEL_CHALLENGES[index];

  const segmentAngle =
    360/WHEEL_CHALLENGES.length;

  const targetAngle =
    360 -
    index*segmentAngle -
    segmentAngle/2;

  state.wheelRotation +=
    1800+targetAngle;

  wheel.style.transform =
    `rotate(${state.wheelRotation}deg)`;

  if(
    state.user?.plan !== "premium"
  ){
    saveWheelStorage(
      state.wheelSpins+1
    );
  }

  if($("spinButton")){
    $("spinButton").disabled = true;
  }

  setTimeout(
    async ()=>{
      if($("challengeResult")){
        $("challengeResult").innerHTML = `
          <strong>${escapeHtml(challenge.title)}</strong>
          <br>
          <span>+${challenge.reward} XP</span>
        `;
      }

      await saveChallengeReward(
        challenge.reward
      );

      renderWheel();

      if(
        wheelRemainingSpins() === 0
      ){
        showToast(
          "Free spins finished. Subscribe for more."
        );
      }
    },
    1350
  );
}

async function saveChallengeReward(
  reward
){
  if(
    !state.user?.id ||
    !Number.isFinite(Number(reward))
  ){
    return;
  }

  const nextXp =
    Number(state.user.xp || 0) +
    Number(reward);

  const {
    error
  } =
    await supabaseClient
      .from("users")
      .update({
        xp:nextXp
      })
      .eq(
        "id",
        state.user.id
      );

  if(error){
    safeError(
      "wheel-reward",
      error
    );
    return;
  }

  state.user.xp = nextXp;
}

function performSearch(
  query
){
  const home =
    $("searchHome");

  const results =
    $("searchResults");

  if(!home || !results){
    return;
  }

  const value =
    String(query || "")
      .trim()
      .toLowerCase();

  if(!value){
    home.style.display = "block";
    results.innerHTML = "";
    return;
  }

  home.style.display = "none";

  const users =
    new Map();

  state.posts.forEach(
    post=>{
      if(post.user?.id){
        users.set(
          String(post.user.id),
          post.user
        );
      }
    }
  );

  if(state.user?.id){
    users.set(
      String(state.user.id),
      state.user
    );
  }

  const people =
    [...users.values()]
      .filter(
        user =>
          `${user.display_name} ${user.username}`
            .toLowerCase()
            .includes(value)
      );

  const matchingPosts =
    state.posts.filter(
      post =>
        `${post.content} ${post.user.display_name} ${post.user.username}`
                    .toLowerCase()
          .includes(query)
    );

  const matchingUsers = state.users.filter(user =>
    `${user.display_name || ""} ${user.username || ""}`
      .toLowerCase()
      .includes(query)
  );

  const uniqueUsers = matchingUsers.filter(
    (user, index, array) =>
      array.findIndex(item => item.id === user.id) === index
  );

  searchResults.innerHTML = "";

  if (!matchingPosts.length && !uniqueUsers.length) {
    searchResults.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search"></i>
        <strong>No results found</strong>
        <span>Try another name, username, hashtag, or keyword.</span>
      </div>
    `;

    refreshIcons();
    return;
  }

  if (uniqueUsers.length) {
    const usersSection = document.createElement("div");
    usersSection.className = "search-section";

    usersSection.innerHTML = `
      <div class="search-section-title">
        <span>People</span>
      </div>
      <div class="search-users"></div>
    `;

    const usersContainer = usersSection.querySelector(".search-users");

    uniqueUsers.forEach(user => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "search-user-item";

      item.innerHTML = `
        <div class="avatar search-user-avatar">
          ${renderAvatar(user)}
        </div>

        <div class="search-user-info">
          <strong>${escapeHtml(user.display_name || user.username || "User")}</strong>
          <span>@${escapeHtml(user.username || "")}</span>
        </div>

        <i data-lucide="chevron-right"></i>
      `;

      item.addEventListener("click", () => {
        openProfileFromUser(user.id);
      });

      usersContainer.appendChild(item);
    });

    searchResults.appendChild(usersSection);
  }

  if (matchingPosts.length) {
    const postsSection = document.createElement("div");
    postsSection.className = "search-section";

    postsSection.innerHTML = `
      <div class="search-section-title">
        <span>Posts</span>
      </div>
      <div class="search-posts"></div>
    `;

    const postsContainer = postsSection.querySelector(".search-posts");

    matchingPosts.forEach(post => {
      postsContainer.appendChild(createPostElement(post));
    });

    searchResults.appendChild(postsSection);
  }

  refreshIcons();
}
