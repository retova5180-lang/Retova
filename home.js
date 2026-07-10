// ===========================
// Retova Home
// ===========================

// بيانات مؤقتة
// لاحقًا نستبدلها بقاعدة البيانات

const stories = [
{
name:"You",
image:"default-avatar.png"
}
];

const posts = [
{
name:"Retova",
username:"@retova",
avatar:"default-avatar.png",
image:"post.jpg",
likes:"0",
comments:"0",
views:"0"
}
];

const storiesContainer =
document.getElementById("storiesContainer");

stories.forEach(story=>{

storiesContainer.innerHTML+=`

<div class="story">

<div class="circle">

<img src="${story.image}">

</div>

<p>${story.name}</p>

</div>

`;

});

const feed =
document.getElementById("feed");

posts.forEach(post=>{

feed.innerHTML+=`

<div class="postCard">

<div class="postTop">

<img
class="postAvatar"
src="${post.avatar}">

<div>

<div class="postName">

${post.name}

</div>

<div class="postUser">

${post.username}

</div>

</div>

</div>

<img
class="postImage"
src="${post.image}">

<div class="actions">

<div>

<i class="fa-regular fa-heart"></i>

<span>${post.likes}</span>

</div>

<div>

<i class="fa-regular fa-comment"></i>

<span>${post.comments}</span>

</div>

<div>

<i class="fa-solid fa-share"></i>

</div>

<div>

<i class="fa-regular fa-eye"></i>

<span>${post.views}</span>

</div>

</div>

</div>

`;

});

// إنشاء منشور

document.querySelector(".post")
.addEventListener("click",()=>{

alert("Create Post");

});

// الإعدادات

document.querySelector(".fa-gear")
.addEventListener("click",()=>{

alert("Settings");

});
