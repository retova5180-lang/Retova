// =======================================
// RETOVA
// HOME
// =======================================

// ---------- Stories ----------

const stories = [

{
    name:"You",
    letter:"R",
    mine:true,
    seen:false,
    gradient:["#8B3DFF","#C34CFF"]
},

{
    name:"Apple",
    letter:"A",
    seen:false,
    gradient:["#6366F1","#8B5CF6"]
},

{
    name:"Formula 1",
    letter:"F",
    seen:true,
    gradient:["#EF4444","#F97316"]
},

{
    name:"NASA",
    letter:"N",
    seen:false,
    gradient:["#2563EB","#06B6D4"]
},

{
    name:"Spotify",
    letter:"S",
    seen:true,
    gradient:["#16A34A","#22C55E"]
},

{
    name:"Real Madrid",
    letter:"R",
    seen:false,
    gradient:["#FACC15","#F59E0B"]
}

];

// ---------- Render Stories ----------

const storiesTrack =
document.querySelector(".stories-track");

stories.forEach(story=>{

const item=document.createElement("div");

item.className=`story ${story.mine?"mine":""} ${story.seen?"seen":""}`;

item.innerHTML=`

<div class="story-ring">

<div
class="story-avatar"
style="background:linear-gradient(135deg,${story.gradient[0]},${story.gradient[1]});">

${story.letter}

</div>

</div>

${story.mine?'<div class="add-story">+</div>':""}

<div class="story-name">

${story.name}

</div>

`;

storiesTrack.appendChild(item);

});

// =======================================
// POSTS
// =======================================

const posts = [

{

letter:"L",

gradient:["#8B3DFF","#C24BFF"],

name:"Lina",

username:"@lina",

badge:"VIP",

time:"2m",

text:"Finally finished redesigning my workspace. Loving the clean setup.",

likes:"4.2K",

comments:"341",

reposts:"102",

views:"89K"

},

{

letter:"S",

gradient:["#2563EB","#06B6D4"],

name:"SALAH",

username:"@salah",

badge:"Verified",

time:"12m",

text:"Weekend trip was absolutely worth it. New memories unlocked.",

likes:"18K",

comments:"1.2K",

reposts:"640",

views:"401K"

}

];
// =======================================
// RENDER POSTS
// =======================================

const feed = document.getElementById("feed");

posts.forEach(post=>{

const card=document.createElement("article");

card.className="post";

card.innerHTML=`

<div class="post-header">

<div class="post-user">

<div
class="post-avatar"
style="background:linear-gradient(135deg,${post.gradient[0]},${post.gradient[1]});">

${post.letter}

</div>

<div class="post-info">

<div class="post-name">

${post.name}

<span class="badge">

${post.badge}

</span>

</div>

<div class="post-username">

${post.username}

</div>

<div class="post-time">

${post.time}

</div>

</div>

</div>

<div class="post-menu">

<i data-lucide="more-horizontal"></i>

</div>

</div>

<div class="post-text">

${post.text}

</div>

<div class="post-actions">

<div class="action-group">

<div class="action">

<i data-lucide="heart"></i>

<span>${post.likes}</span>

</div>

<div class="action">

<i data-lucide="message-circle"></i>

<span>${post.comments}</span>

</div>

<div class="action">

<i data-lucide="repeat-2"></i>

<span>${post.reposts}</span>

</div>

</div>

<div class="action">

<i data-lucide="bar-chart-3"></i>

<span>${post.views}</span>

</div>

</div>

`;

feed.appendChild(card);

});

lucide.createIcons();
