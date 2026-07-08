const stories = [
{
name:"Emma",
image:"https://i.pravatar.cc/150?img=1"
},
{
name:"Sophia",
image:"https://i.pravatar.cc/150?img=5"
},
{
name:"Olivia",
image:"https://i.pravatar.cc/150?img=9"
},
{
name:"Luna",
image:"https://i.pravatar.cc/150?img=11"
},
{
name:"Mia",
image:"https://i.pravatar.cc/150?img=15"
}
];

const posts = [
{
name:"Emma",
username:"@emma",
avatar:"https://i.pravatar.cc/150?img=1",
text:"Welcome to Retova 💜",
images:[
"https://picsum.photos/500/500?1",
"https://picsum.photos/500/500?2",
"https://picsum.photos/500/500?3",
"https://picsum.photos/500/500?4"
]
}
];

const storiesContainer=document.getElementById("storiesContainer");
const feed=document.getElementById("feed");

stories.forEach(story=>{

storiesContainer.innerHTML+=`
<div class="story">
<div class="storyImage">
<img src="${story.image}">
</div>
<span>${story.name}</span>
</div>
`;

});

posts.forEach(post=>{

feed.innerHTML+=`

<div class="post">

<div class="postHeader">

<div class="userInfo">

<div class="avatar">

<img src="${post.avatar}">

</div>

<div class="userText">

<div class="username">

${post.name}

</div>

<div class="handle">

${post.username}

</div>

</div>

</div>

<button class="moreBtn">

⋮

</button>

</div>

<div class="postContent">

${post.text}

</div>

<div class="postImages">

${post.images.map(img=>`
<img src="${img}">
`).join("")}

</div>

<div class="postActions">

<div class="actionGroup">

<div class="action">♡</div>

<div class="action">💬</div>

<div class="action">🔁</div>

<div class="action">🔖</div>

</div>

</div>

</div>

`;

});
