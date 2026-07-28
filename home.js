// =============================
// Retova Home
// =============================

const stories = document.getElementById("stories");
const feed = document.getElementById("feed");

const storiesData = [
{
name:"You",
avatar:"https://i.pravatar.cc/150?img=1"
},
{
name:"Sarah",
avatar:"https://i.pravatar.cc/150?img=5"
},
{
name:"Liam",
avatar:"https://i.pravatar.cc/150?img=8"
},
{
name:"Emily",
avatar:"https://i.pravatar.cc/150?img=12"
},
{
name:"Olivia",
avatar:"https://i.pravatar.cc/150?img=32"
},
{
name:"Carlos",
avatar:"https://i.pravatar.cc/150?img=18"
}
];

storiesData.forEach(item=>{

stories.innerHTML+=`

<div class="story">

<div class="story-avatar">

<img src="${item.avatar}" alt="">

</div>

<div class="story-name">

${item.name}

</div>

</div>

`;

});
const posts = [

{
name:"Sarah",
username:"@sarah",
avatar:"https://i.pravatar.cc/150?img=5",
text:"Good morning everyone ☀️",
likes:"5.2K",
comments:"24",
reposts:"66",
views:"50K",
images:[]
},

{
name:"SALAH",
username:"@s4u_2",
avatar:"https://i.pravatar.cc/150?img=18",
text:"Which destination do you like the most?",
likes:"7.8K",
comments:"104",
reposts:"9",
views:"48K",
images:[
"https://picsum.photos/500/500?11",
"https://picsum.photos/500/500?12",
"https://picsum.photos/500/500?13",
"https://picsum.photos/500/500?14"
]
}

];

posts.forEach(post=>{

let images="";

if(post.images.length){

images=`<div class="post-images">`;

post.images.forEach(img=>{

images+=`<img src="${img}">`;

});

images+=`</div>`;

}

feed.innerHTML+=`

<div class="post">

<div class="post-header">

<div class="post-user">

<img src="${post.avatar}">

<div>

<div class="post-name">${post.name}</div>

<div class="post-username">${post.username}</div>

</div>

</div>

<i class="fa-solid fa-ellipsis"></i>

</div>

<div class="post-text">

${post.text}

</div>

${images}

<div class="post-actions">

<div class="action">
<i class="fa-regular fa-comment"></i>
<span>${post.comments}</span>
</div>

<div class="action">
<i class="fa-solid fa-repeat"></i>
<span>${post.reposts}</span>
</div>

<div class="action">
<i class="fa-regular fa-heart"></i>
<span>${post.likes}</span>
</div>

<div class="action">
<i class="fa-regular fa-eye"></i>
<span>${post.views}</span>
</div>

<div class="action">
<i class="fa-solid fa-arrow-up-from-bracket"></i>
</div>

</div>

</div>

`;

});
