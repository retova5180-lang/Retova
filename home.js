(() => {
"use strict";

const SUPABASE_URL =
"https://bfqsqgfyyewnfxekirfv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
"sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

const supabaseClient =
window.supabase?.createClient(
 SUPABASE_URL,
 SUPABASE_PUBLISHABLE_KEY
) || null;


const $ = id =>
document.getElementById(id);


const USER_KEY =
"ars_user";

const PLAN_KEY =
"ars_plan";

const WHEEL_KEY =
"ars_wheel_week";

const STREAK_KEY =
"ars_streak_state";

const POSTS_KEY =
"ars_home_posts_v5";

const STORIES_KEY =
"ars_stories";


let currentUser =
JSON.parse(
 localStorage.getItem(USER_KEY) || "null"
);


let plan =
localStorage.getItem(PLAN_KEY) || "free";


let wheelRotation = 0;

let currentCommentPost = null;


const img = {

 sunset:
 "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1200&q=85",

 apple:
 "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85",

 noah:
 "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=85",

 lina:
 "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=85",

 sara:
 "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=85"

};


const stories = [

 {
  id:"you",
  name:"You",
  letter:true
 },

 {
  id:"lina",
  name:"Lina",
  src:img.lina
 },

 {
  id:"noah",
  name:"Noah",
  src:img.noah
 },

 {
  id:"sara",
  name:"Sara",
  src:img.sara
 },

 {
  id:"wheel",
  name:"Wheel",
  wheel:true
 },

 {
  id:"apple",
  name:"Apple",
  logo:"https://cdn.simpleicons.org/apple/FFFFFF",
  verified:true
 },

 {
  id:"ferrari",
  name:"Ferrari",
  logo:"https://cdn.simpleicons.org/ferrari/FFFFFF",
  verified:true
 },

 {
  id:"bmw",
  name:"BMW",
  logo:"https://cdn.simpleicons.org/bmw/FFFFFF",
  verified:true
 }

];


const defaultPosts = [

 {
  id:1,
  name:"Lina",
  handle:"@lina.ae",
  time:"12m",
  letter:"L",
  verified:true,
  text:"Sunset always hits different 💜",
  image:img.sunset,
  likes:2400,
  comments:186,
  reposts:312,
  views:48000,
  liked:false,
  reposted:false
 },

 {
  id:2,
  name:"Apple",
  handle:"@apple",
  time:"28m",
  letter:"",
  verified:true,
  text:"Apple Intelligence expands to more languages later this year.",
  image:img.apple,
  likes:28400,
  comments:1800,
  reposts:3900,
  views:2400000,
  liked:false,
  reposted:false
 },

 {
  id:3,
  name:"Noah",
  handle:"@noah.vibes",
  time:"45m",
  letter:"N",
  verified:true,
  text:"Focused on the journey. #focus #life",
  image:img.noah,
  likes:8200,
  comments:421,
  reposts:780,
  views:120000,
  liked:false,
  reposted:false
 }

];


let posts =
JSON.parse(
 localStorage.getItem(POSTS_KEY) || "null"
) || defaultPosts;


function esc(v){

 return String(v ?? "")
 .replace(
  /[&<>"']/g,
  c => ({
   "&":"&amp;",
   "<":"&lt;",
   ">":"&gt;",
   '"':"&quot;",
   "'":"&#039;"
  }[c])
 );

}


function count(n){

 n = Number(n) || 0;

 if(n >= 1e6){

  return (
   n % 1e6
   ? (n / 1e6).toFixed(1)
   : (n / 1e6).toFixed(0)
  ) + "M";

 }

 if(n >= 1e3){

  return (
   n % 1e3
   ? (n / 1e3).toFixed(1)
   : (n / 1e3).toFixed(0)
  ) + "K";

 }

 return String(n);

}


function toast(message){

 const e = $("toast");

 if(!e) return;

 e.textContent = message;

 e.classList.add("show");

 clearTimeout(window.__arsToastTimer);

 window.__arsToastTimer =
 setTimeout(
  () => e.classList.remove("show"),
  2200
 );

}


function savePosts(){

 localStorage.setItem(
  POSTS_KEY,
  JSON.stringify(posts)
 );

}


function renderStories(){

 const c = $("stories");

 if(!c) return;

 c.innerHTML =
 stories.map(s => {

  let content;

  if(s.src){

   content =
   `<img src="${s.src}" alt="">`;

  }

  else if(s.logo){

   content =
   `
   <span class="story-letter brand-story">
     <img
       src="${s.logo}"
       alt="${esc(s.name)}"
     >
   </span>
   `;

  }

  else if(s.wheel){

   content =
   `
   <span class="story-letter">
     ✦
   </span>
   `;

  }

  else{

   content =
   `
   <span class="story-letter">
     ${esc(s.letter || "A")}
   </span>
   `;

  }

  return `
  <button
    class="story ${s.id === "you" ? "you" : ""}"
    data-story="${esc(s.id)}"
    type="button"
  >

    <span class="story-ring">
      ${content}
    </span>

    <span class="story-name">
      ${esc(s.name)}
    </span>

  </button>
  `;

 }).join("");

}


function avatar(p){

 if(p.name === "Lina"){

  return `
  <img
    class="post-avatar"
    src="${img.lina}"
    alt=""
  >
  `;

 }


 if(p.name === "Apple"){

  return `
  <div
    class="post-avatar post-letter apple-avatar"
  >
    
  </div>
  `;

 }


 return `
 <div class="post-avatar post-letter">
   ${esc(p.letter || p.name?.[0] || "A")}
 </div>
 `;

}


function renderPosts(){

 const feed = $("feed");

 if(!feed) return;

 if(!posts.length){

  feed.innerHTML = `
   <div class="result-card">
     No posts yet.
   </div>
  `;

  return;

 }

 feed.innerHTML =
 posts.map(p => `

 <article
   class="post-card"
   data-post-id="${esc(p.id)}"
 >

   <div class="post-head">

     ${avatar(p)}

     <div class="post-info">

       <div class="post-name">

         ${esc(p.name)}

         ${
          p.verified
          ? '<span class="verified">✓</span>'
          : ""
         }

       </div>

       <div class="post-meta">
         ${esc(p.handle || "@user")} · ${esc(p.time || "now")}
       </div>

     </div>

     <button
       class="more"
       data-more="${esc(p.id)}"
       aria-label="More"
       type="button"
     >
       •••
     </button>

   </div>


   <div class="post-text">

     ${
      esc(p.text)
      .replace(
       /(#\w+)/g,
       '<span class="tag">$1</span>'
      )
     }

   </div>


   ${
    p.image
    ? `
    <img
      class="post-image"
      src="${esc(p.image)}"
      alt=""
      loading="lazy"
    >
    `
    : ""
   }


   <div class="post-actions">

     <button
       class="post-action like ${p.liked ? "active" : ""}"
       data-action="like"
       data-id="${esc(p.id)}"
       type="button"
     >

       <span class="ico">♥</span>

       <span>
         ${count(p.likes)}
       </span>

     </button>


     <button
       class="post-action"
       data-action="comment"
       data-id="${esc(p.id)}"
       type="button"
     >

       <span class="ico">♡</span>

       <span>
         ${count(p.comments)}
       </span>

     </button>


     <button
       class="post-action ${p.reposted ? "reposted" : ""}"
       data-action="repost"
       data-id="${esc(p.id)}"
       type="button"
     >

       <span class="ico">⇄</span>

       <span>
         ${count(p.reposts)}
       </span>

     </button>


     <span class="post-action views">

       <span class="ico">◉</span>

       <span>
         ${count(p.views)}
       </span>

     </span>

   </div>

 </article>

 `).join("");

}


function openPage(id){

 document
 .querySelectorAll(".page")
 .forEach(
  p => p.classList.remove("active")
 );


 const p = $(id);

 if(!p) return;


 p.classList.add("active");


 document
 .querySelectorAll(".nav-item")
 .forEach(
  n =>
   n.classList.toggle(
    "active",
    n.dataset.page === id
   )
 );


 const plus = $("createPost");

 if(plus){

  plus.style.display =
   id === "homePage"
   ? "block"
   : "none";

 }


 if(id === "searchPage"){

  renderSearchHome();

 }


 if(id === "streakPage"){

  updateStreak();

 }


 if(id === "trendingPage"){

  renderTrendingPage();

 }

}


function renderSearchHome(){

 const h = $("searchHome");

 if(!h) return;


 h.innerHTML = `

 <div class="search-title">
   Trending hashtags
 </div>

 <div class="chips">

 ${
  [
   "#ARS",
   "#SaudiArabia",
   "#Tech",
   "#AI",
   "#Lifestyle",
   "#Football"
  ]
  .map(
   t =>
   `
   <button
     class="chip"
     data-query="${t}"
     type="button"
   >
     ${t}
   </button>
   `
  )
  .join("")
 }

 </div>

 <div class="search-title">
   Suggested people
 </div>

 <div class="search-person">

   <img src="${img.lina}" alt="">

   <div>

     <b>Lina</b>

     <div class="post-meta">
       @lina.ae · 1.2M followers
     </div>

   </div>

 </div>

 <div class="search-person">

   <div class="avatar">
     A
   </div>

   <div>

     <b>Apple ✓</b>

     <div class="post-meta">
       @apple · 98M followers
     </div>

   </div>

 </div>

 <div class="search-person">

   <div class="avatar">
     N
   </div>

   <div>

     <b>Noah</b>

     <div class="post-meta">
       @noah.vibes · 84K followers
     </div>

   </div>

 </div>

 <div class="search-title">
   Trending topics
 </div>

 <div class="topic">
   <b>ARS</b>
   <span>128K posts</span>
 </div>

 <div class="topic">
   <b>Technology</b>
   <span>94K posts</span>
 </div>

 `;

}


function renderTrendingPage(){

 const page = $("trendingPage");

 if(!page) return;

 page.innerHTML = `
   <div class="panel-head">
     <h2>Trending</h2>
     <button
       class="close-btn"
       data-close-page
       aria-label="Close"
     >×</button>
   </div>

   <div class="search-content">

     <div class="search-title">
       What's trending on ARS
     </div>

     <div class="topic">
       <b>#ARS</b>
       <span>128K posts</span>
     </div>

     <div class="topic">
       <b>#Technology</b>
       <span>94K posts</span>
     </div>

     <div class="topic">
       <b>#AI</b>
       <span>81K posts</span>
     </div>

     <div class="topic">
       <b>#Lifestyle</b>
       <span>65K posts</span>
     </div>

   </div>
 `;

}


function search(q){

 const r = $("searchResults");

 if(!r) return;


 const x =
 q.trim().toLowerCase();


 if(!x){

  r.innerHTML = "";

  return;

 }


 const found =
 posts.filter(
  p =>
   (
    p.name +
    " " +
    p.handle +
    " " +
    p.text
   )
   .toLowerCase()
   .includes(x)
 );


 r.innerHTML =
 found.map(
  p =>
  `
  <div class="search-person">

    <div class="avatar">
      ${esc(p.letter || p.name?.[0] || "A")}
    </div>

    <div>

      <b>
        ${esc(p.name)}
      </b>

      <div class="post-meta">
        ${esc(p.handle || "")}
      </div>

      <p>
        ${esc(p.text)}
      </p>

    </div>

  </div>
  `
 ).join("")
 ||
 `
 <div class="empty-search">

   <h3>No results</h3>

   <p>Try another search.</p>

 </div>
 `;

}


/* =========================
   WHEEL
========================= */

const wheelItems = [

 [
  "CHALLENGE",
  "Post something that makes you smile today.",
  "+50 XP"
 ],

 [
  "REWARD",
  "You earned a surprise ARS reward.",
  "+100 XP"
 ],

 [
  "QUESTION",
  "What is one goal you want to achieve this week?",
  "+25 XP"
 ],

 [
  "BONUS",
  "Bonus spin reward unlocked.",
  "+1 Bonus"
 ],

 [
  "REWARD",
  "You discovered a hidden reward.",
  "+75 XP"
 ],

 [
  "CHALLENGE",
  "Like and comment on a post you genuinely enjoy.",
  "+40 XP"
 ],

 [
  "QUESTION",
  "What is something new you learned recently?",
  "+30 XP"
 ],

 [
  "BONUS",
  "Lucky bonus! Extra XP added.",
  "+150 XP"
 ]

];


function weekKey(){

 const d = new Date();

 const s =
 new Date(
  d.getFullYear(),
  0,
  1
 );

 const n =
 Math.floor(
  (d - s) / 86400000
 );

 return (
  d.getFullYear() +
  "-" +
  Math.ceil(
   (n + s.getDay() + 1) / 7
  )
 );

}


function wheelState(){

 const s =
 JSON.parse(
  localStorage.getItem(WHEEL_KEY) || "null"
 );


 return !s || s.week !== weekKey()
  ? {
     week:weekKey(),
     used:0
    }
  : s;

}


function updateWheel(){

 const d = wheelState();

 const c = $("spinCounter");

 const b = $("spinButton");

 const l = $("planLabel");


 if(!c) return;


 if(plan === "premium"){

  c.textContent = "∞";

  l.textContent = "Premium";

  b.disabled = false;

 }

 else{

  const n =
  Math.max(
   0,
   2 - d.used
  );

  c.textContent = n;

  l.textContent = "Free";

  b.disabled = n === 0;

 }

}


function spin(){

 const w = $("wheel");

 const r = $("challengeResult");

 if(!w || !r) return;


 const d = wheelState();


 if(
  plan !== "premium" &&
  d.used >= 2
 ){

  r.innerHTML = `
   <strong>No free spins left</strong>
   <span>Free members get 2 wheel tries every week.</span>
  `;

  return;

 }


 if(plan !== "premium"){

  d.used++;

  localStorage.setItem(
   WHEEL_KEY,
   JSON.stringify(d)
  );

 }


 const i =
 Math.floor(
  Math.random() *
  wheelItems.length
 );


 const v =
 wheelItems[i];


 wheelRotation +=
 1440 +
 Math.floor(
  Math.random() * 360
 ) +
 i * 45;


 w.style.transform =
 `rotate(${wheelRotation}deg)`;


 r.innerHTML = `

 <div class="result-type">
   ${esc(v[0])}
 </div>

 <strong>
   ${esc(v[1])}
 </strong>

 <span>
   ${esc(v[2])}
 </span>

 `;


 updateWheel();

}


/* =========================
   STREAK
========================= */

function dayKey(d = new Date()){

 return [

  d.getFullYear(),

  String(
   d.getMonth() + 1
  ).padStart(2,"0"),

  String(
   d.getDate()
  ).padStart(2,"0")

 ].join("-");

}


function streakState(){

 return (
  JSON.parse(
   localStorage.getItem(STREAK_KEY) || "null"
  )
 ) || {
  count:0,
  lastDay:"",
  doneToday:false
 };

}


function updateStreak(){

 const s = streakState();

 const today = dayKey();

 const active =
 s.lastDay === today &&
 s.doneToday;


 const f = $("streakFire");

 const n = $("streakNumber");

 const t = $("streakText");

 const b = $("streakDone");


 if(!f || !n || !t || !b){

  return;

 }


 f.classList.toggle(
  "active",
  active
 );

 f.classList.toggle(
  "inactive",
  !active
 );


 n.textContent =
 s.count || 0;


 t.textContent =
 active
 ? "Your streak is active today 🔥 Keep going tomorrow."
 : "Complete today's interaction to keep your streak active.";


 b.textContent =
 active
 ? "Completed today ✓"
 : "Complete today";


 b.disabled =
 active;


 renderWeekDots();

}


function renderWeekDots(){

 const c = $("weekDots");

 if(!c) return;


 const s = streakState();

 const today = new Date();


 c.innerHTML =
 Array
 .from(
  {length:7},
  (_,j) => {

   const d =
   new Date(today);

   d.setDate(
    today.getDate() -
    (6 - j)
   );


   return `

   <span
     class="week-dot ${
       dayKey(d) === s.lastDay &&
       s.doneToday
       ? "active"
       : ""
     }"
   ></span>

   `;

  }
 )
 .join("");

}


function completeStreak(){

 const s =
 streakState();

 const today =
 dayKey();


 if(
  s.lastDay === today &&
  s.doneToday
 ){

  return;

 }


 const y =
 new Date();

 y.setDate(
  y.getDate() - 1
 );


 s.count =
 s.lastDay === dayKey(y)
 ? (s.count || 0) + 1
 : 1;


 s.lastDay =
 today;


 s.doneToday =
 true;


 localStorage.setItem(
  STREAK_KEY,
  JSON.stringify(s)
 );


 updateStreak();

 toast(
  "🔥 Streak updated!"
 );

}


/* =========================
   POSTS
========================= */

function findPost(id){

 return posts.find(
  p =>
   String(p.id) === String(id)
 );

}


function postAction(a,id){

 const p =
 findPost(id);


 if(!p) return;


 if(a === "like"){

  p.liked =
   !p.liked;

  p.likes =
   Math.max(
    0,
    Number(p.likes || 0) +
    (p.liked ? 1 : -1)
   );

  toast(
   p.liked
   ? "Liked ❤️"
   : "Like removed"
  );

 }

 else if(a === "repost"){

  p.reposted =
   !p.reposted;

  p.reposts =
   Math.max(
    0,
    Number(p.reposts || 0) +
    (p.reposted ? 1 : -1)
   );

  toast(
   p.reposted
   ? "Reposted 🔄"
   : "Repost removed"
  );

 }

 else if(a === "comment"){

  openComments(id);

  return;

 }


 savePosts();

 renderPosts();

}


function closeMenu(){

 document
 .querySelectorAll(".post-menu")
 .forEach(
  x => x.remove()
 );


 $("postMenuBackdrop")
 ?.classList.remove("show");

}


function menu(btn,id){

 closeMenu();


 const m =
 document.createElement("div");


 m.className =
 "post-menu";


 m.innerHTML = `

 <button data-a="repost" type="button">
   ↻ Repost
 </button>

 <button data-a="bookmark" type="button">
   🔖 Bookmark
 </button>

 <button data-a="share" type="button">
   ↗ Share
 </button>

 <button data-a="copy" type="button">
   ⧉ Copy Link
 </button>

 <button data-a="report" type="button">
   ⚑ Report
 </button>

 <button
   data-a="hide"
   class="danger"
   type="button"
 >
   ⌫ Hide Post
 </button>

 `;


 document.body.appendChild(m);


 const q =
 btn.getBoundingClientRect();


 m.style.top =
 q.bottom + 8 + "px";


 m.style.right =
 Math.max(
  12,
  innerWidth - q.right
 ) + "px";


 $("postMenuBackdrop")
 ?.classList.add("show");


 m.onclick =
 async e => {

  const item =
  e.target.closest("[data-a]");


  if(!item) return;


  const a =
  item.dataset.a;


  closeMenu();


  if(a === "repost"){

   postAction(
    "repost",
    id
   );

  }


  else if(a === "bookmark"){

   const k =
   "ars_bookmark_" + id;


   const s =
   localStorage.getItem(k)
   === "true";


   localStorage.setItem(
    k,
    String(!s)
   );


   toast(
    !s
    ? "Saved 🔖"
    : "Removed from bookmarks"
   );

  }


  else if(a === "copy"){

   try{

    await navigator.clipboard.writeText(
     location.href
    );

    toast(
     "Link copied"
    );

   }

   catch{

    toast(
     "Copy is not available"
    );

   }

  }


  else if(a === "share"){

   if(navigator.share){

    try{

     await navigator.share({

      title:"ARS",

      text:
       findPost(id)?.text || "",

      url:
       location.href

     });

    }

    catch{}

   }

   else{

    try{

     await navigator.clipboard.writeText(
      location.href
     );

     toast("Share link copied");

    }

    catch{

     toast("Share is not available");

    }

   }

  }


  else if(a === "report"){

   toast(
    "Post reported"
   );

  }


  else if(a === "hide"){

   posts =
   posts.filter(
    p =>
     String(p.id) !==
     String(id)
   );


   savePosts();

   renderPosts();

   toast(
    "Post hidden"
   );

  }

 };

}


/* =========================
   COMMENTS
========================= */

function commentsKey(id){

 return "ars_comments_" + id;

}


function getComments(id){

 return (
  JSON.parse(
   localStorage.getItem(
    commentsKey(id)
   ) || "null"
  )
 ) || [];

}


function saveComments(id,data){

 localStorage.setItem(
  commentsKey(id),
  JSON.stringify(data)
 );

}


function renderComments(id){

 const list =
 $("commentsList");

 if(!list) return;


 const comments =
 getComments(id);


 if(!comments.length){

  list.innerHTML = `
   <div class="result-card">
     No comments yet. Be the first.
   </div>
  `;

  return;

 }


 list.innerHTML =
 comments.map(
  c =>
  `
  <div class="comment-item">

    <div class="comment-author">
      ${esc(c.name || "ARS User")}
    </div>

    <div class="comment-text">
      ${esc(c.text)}
    </div>

  </div>
  `
 ).join("");

}


function openComments(id){

 currentCommentPost =
 String(id);


 renderComments(
  currentCommentPost
 );


 const modal =
 $("commentsModal");


 if(modal){

  modal.classList.add("show");

  modal.setAttribute(
   "aria-hidden",
   "false"
  );

 }


}


function closeComments(){

 const modal =
 $("commentsModal");


 if(modal){

  modal.classList.remove("show");

  modal.setAttribute(
   "aria-hidden",
   "true"
  );

 }

 currentCommentPost =
 null;

}


function addComment(){

 if(!currentCommentPost) return;


 const input =
 $("commentInput");


 if(!input) return;


 const text =
 input.value.trim();


 if(!text) return;


 const list =
 getComments(
  currentCommentPost
 );


 list.push({

  id:
   Date.now(),

  name:
   currentUser?.display_name ||
   currentUser?.username ||
   "ARS User",

  text,

  created_at:
   new Date().toISOString()

 });


 saveComments(
  currentCommentPost,
  list
 );


 const p =
 findPost(
  currentCommentPost
 );


 if(p){

  p.comments =
   Number(p.comments || 0) + 1;

  savePosts();

  renderPosts();

 }


 input.value = "";

 renderComments(
  currentCommentPost
 );

}


/* =========================
   CREATE POST
========================= */

function openCreatePost(){

 const modal =
 $("createPostModal");


 if(!modal) return;


 modal.
