// ======================================
// RETOVA HOME V2
// ======================================

// Containers

const storiesContainer = document.getElementById("stories");
const feedContainer = document.getElementById("feed");

// ======================================
// Stories
// ======================================

const stories = [

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
name:"Carlos",
avatar:"https://i.pravatar.cc/150?img=18"
},

{
name:"Olivia",
avatar:"https://i.pravatar.cc/150?img=32"
},

{
name:"Noah",
avatar:"https://i.pravatar.cc/150?img=41"
},

{
name:"Emma",
avatar:"https://i.pravatar.cc/150?img=47"
}

];

// ======================================
// Render Stories
// ======================================

stories.forEach(story=>{

storiesContainer.innerHTML+=`

<div class="story">

<div class="story-avatar">

<img src="${story.avatar}">

</div>

<div class="story-name">

${story.name}

</div>

</div>

`;

});

// ======================================
// Posts Array
// ======================================

const posts=[];
// ======================================
// Demo Posts
// ======================================

posts.push(

{
name:"Sarah",
username:"@sarah",
avatar:"https://i.pravatar.cc/150?img=5",
text:"Good morning everyone ☀️",
images:[]
},

{
name:"Liam",
username:"@liam",
avatar:"https://i.pravatar.cc/150?img=8",
text:"Weekend vibes 🌴",
images:[
"https://picsum.photos/600/600?1"
]
},

{
name:"Emily",
username:"@emily",
avatar:"https://i.pravatar.cc/150?img=12",
text:"Coffee first. Always ☕",
images:[
"https://picsum.photos/600/600?2",
"https://picsum.photos/600/600?3"
]
},

{
name:"Carlos",
username:"@carlos",
avatar:"https://i.pravatar.cc/150?img=18",
text:"Beautiful sunset today 🌅",
images:[
"https://picsum.photos/600/600?4",
"https://picsum.photos/600/600?5",
"https://picsum.photos/600/600?6"
]
},

{
name:"Olivia",
username:"@olivia",
avatar:"https://i.pravatar.cc/150?img=32",
text:"Travel memories ✈️",
images:[
"https://picsum.photos/600/600?7",
"https://picsum.photos/600/600?8",
"https://picsum.photos/600/600?9",
"https://picsum.photos/600/600?10"
]
}

);
// ======================================
// Render Posts
// ======================================

posts.forEach(post=>{

let imagesHTML="";

if(post.images.length){

imagesHTML='<div class="post-images">';

post.images.forEach(image=>{

imagesHTML+=`<img src="${image}" alt="Post Image">`;

});

imagesHTML+='</div>';

}

feedContainer.innerHTML+=`

<div class="post">

<div class="post-header">

<div class="post-user">

<img src="${post.avatar}" alt="${post.name}">

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

${imagesHTML}

<div class="post-actions">

<div class="action">

<i class="fa-regular fa-comment"></i>

<span>24</span>

</div>

<div class="action">

<i class="fa-solid fa-repeat"></i>

<span>11</span>

</div>

<div class="action">

<i class="fa-regular fa-heart"></i>

<span>148</span>

</div>

<div class="action">

<i class="fa-regular fa-eye"></i>

<span>2.4K</span>

</div>

<div class="action">

<i class="fa-solid fa-arrow-up-from-bracket"></i>

</div>

</div>

</div>

`;

});
