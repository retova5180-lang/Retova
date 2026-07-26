// ======================================
// Fake Posts
// ======================================

const posts = [
// ======================================
// Render Posts
// ======================================

posts.forEach(post => {

feed.innerHTML += `

<article class="post">

<div class="post-header">

<div class="user">

<img src="${post.avatar}" class="avatar">

<div class="user-info">

<div class="name-row">

<span class="name">${post.name}</span>

${post.verified ? `<i data-lucide="badge-check" class="verified"></i>` : ""}

</div>

<span class="username">

@${post.username} · ${post.time}

</span>

</div>

</div>

<button class="more-btn">

<i data-lucide="ellipsis"></i>

</button>

</div>

<div class="post-body">

<p>

${post.text}

</p>

${post.image ? `

<img
src="${post.image}"
class="post-image">

` : ""}

</div>

<div class="post-footer">

<button class="action-btn">

<i data-lucide="heart"></i>

<span>${post.likes}</span>

</button>

<button class="action-btn">

<i data-lucide="message-circle"></i>

<span>${post.comments}</span>

</button>

<button class="action-btn">

<i data-lucide="repeat-2"></i>

<span>${post.reposts}</span>

</button>

<button class="action-btn">

<i data-lucide="bar-chart-3"></i>

<span>${post.views}</span>

</button>

<button class="action-btn">

<i data-lucide="share-2"></i>

</button>

</div>

</article>

`;

});

lucide.createIcons();
{
id:1,

name:"سعود",

username:"saud",

avatar:"assets/avatars/10.jpg",

verified:false,

time:"5m",

text:"وش رايكم في Retova؟ أحس البداية مبشرة 🔥",

image:"assets/posts/1.jpg",

likes:421,

comments:86,

reposts:17,

views:"9.8K"

},

{
id:2,

name:"Emily",

username:"emily",

avatar:"assets/avatars/11.jpg",

verified:true,

time:"8m",

text:"This app looks really clean. Love the design 💜",

image:"",

likes:1204,

comments:143,

reposts:53,

views:"31K"

},

{
id:3,

name:"محمد",

username:"m7md",

avatar:"assets/avatars/12.jpg",

verified:false,

time:"14m",

text:"أتمنى المجتمع هنا يكون محترم أكثر من باقي التطبيقات.",

image:"assets/posts/2.jpg",

likes:298,

comments:34,

reposts:8,

views:"6.2K"

},

{
id:4,

name:"Aiko",

username:"aiko",

avatar:"assets/avatars/13.jpg",

verified:false,

time:"20m",

text:"Good morning everyone 🌸",

image:"assets/posts/3.jpg",

likes:843,

comments:61,

reposts:15,

views:"14K"

},

{
id:5,

name:"ناصر",

username:"nasser",

avatar:"assets/avatars/14.jpg",

verified:false,

time:"26m",

text:"ياخي واجهة Retova فخمة بشكل مو طبيعي 😮‍💨",

image:"",

likes:511,

comments:92,

reposts:21,

views:"11K"

}

];
