// ======================================
// RETOVA HOME
// ======================================

// Containers

const storiesContainer = document.getElementById("stories");
const feedContainer = document.getElementById("feed");

// ======================================
// Stories Data
// ======================================

const stories = [

{
name:"You",
image:"https://i.pravatar.cc/150?img=1",
add:true
},

{
name:"Sarah",
image:"https://i.pravatar.cc/150?img=5"
},

{
name:"Liam",
image:"https://i.pravatar.cc/150?img=8"
},

{
name:"Emily",
image:"https://i.pravatar.cc/150?img=12"
},

{
name:"Carlos",
image:"https://i.pravatar.cc/150?img=18"
},

{
name:"Aiko",
image:"https://i.pravatar.cc/150?img=20"
},

{
name:"Noah",
image:"https://i.pravatar.cc/150?img=25"
},

{
name:"Olivia",
image:"https://i.pravatar.cc/150?img=32"
}

];

// ======================================
// Render Stories
// ======================================

stories.forEach(story=>{

storiesContainer.innerHTML+=`

<div class="story">

<div class="story-image">

<img src="${story.image}">

${
story.add
?
`<span class="story-add">+</span>`
:
""
}

</div>

<p>${story.name}</p>

</div>

`;

});

// ======================================
// Posts
// ======================================

const posts=[];
// ======================================
// Demo Posts
// ======================================

posts.push(
// ======================================
// Render Posts
// ======================================

posts.forEach(post=>{

let imagesHTML="";

if(post.images.length>0){

imagesHTML='<div class="post-images">';

post.images.forEach(image=>{

imagesHTML+=`

<img src="${image}" alt="Post Image">

`;

});

imagesHTML+='</div>';

}

feedContainer.innerHTML+=`

<div class="post">

<div class="post-header">

<div class="post-user">

<img class="post-avatar" src="${post.avatar}">

<div>

<div class="post-name">${post.name}</div>

<div class="post-username">${post.username}</div>

</div>

</div>

<button class="post-more">

<i class="fa-solid fa-ellipsis"></i>

</button>

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

"https://picsum.photos/500/500?1"

]

},

{

name:"Emily",

username:"@emily",

avatar:"https://i.pravatar.cc/150?img=12",

text:"Coffee first ☕",

images:[

"https://picsum.photos/500/500?2",

"https://picsum.photos/500/500?3"

]

},

{

name:"Carlos",

username:"@carlos",

avatar:"https://i.pravatar.cc/150?img=18",

text:"Beautiful sunset today.",

images:[

"https://picsum.photos/500/500?4",

"https://picsum.photos/500/500?5",

"https://picsum.photos/500/500?6"

]

},

{

name:"Olivia",

username:"@olivia",

avatar:"https://i.pravatar.cc/150?img=32",

text:"Travel memories ✈️",

images:[

"https://picsum.photos/500/500?7",

"https://picsum.photos/500/500?8",

"https://picsum.photos/500/500?9",

"https://picsum.photos/500/500?10"

]

}

);
