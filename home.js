// ================================
// RETOVA DATA
// ================================

const myAvatar =
"https://i.pravatar.cc/150?img=15";

document.getElementById("myAvatar").src = myAvatar;

const stories = [

{
name:"You",
avatar:myAvatar,
me:true
},

{
name:"Sophia",
avatar:"https://i.pravatar.cc/150?img=32"
},

{
name:"Emma",
avatar:"https://i.pravatar.cc/150?img=47"
},

{
name:"Liam",
avatar:"https://i.pravatar.cc/150?img=18"
},

{
name:"Noah",
avatar:"https://i.pravatar.cc/150?img=12"
},

{
name:"Olivia",
avatar:"https://i.pravatar.cc/150?img=28"
}

];

const storiesBox=document.getElementById("stories");

stories.forEach(story=>{

storiesBox.innerHTML+=`

<div class="story ${story.me ? "you":""}">

<div class="story-avatar">

<img src="${story.avatar}">

${story.me ? '<div class="add-story">+</div>' : ''}

</div>

<div class="story-name">

${story.name}

</div>

</div>

`;

});
// ================================
// POSTS
// ================================

const posts = [

{
name:"Sophia",
username:"@sophia",
avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
text:"☀️ Morning walks + coffee = perfect start.",
images:[
"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900"
],
likes:"2.4K",
comments:"187",
reposts:"42",
views:"31K"
},

{
name:"Tech World",
username:"@techworld",
avatar:"https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300",
text:"📱 Which smartphone design do you prefer this year?",
images:[
"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900",
"https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=900"
],
likes:"9.8K",
comments:"824",
reposts:"311",
views:"118K"
},

{
name:"Travel Hub",
username:"@travelhub",
avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
text:"✈️ Pick your next destination 👇",
images:[
"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900",
"https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900",
"https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900",
"https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=900"
],
likes:"14.2K",
comments:"1.4K",
reposts:"607",
views:"204K"
}

];

const feed=document.getElementById("feed");
posts.forEach(post=>{

feed.innerHTML += `

<div class="post">

<div class="post-header">

<div class="post-user">

<img src="${post.avatar}" alt="">

<div class="post-info">

<div class="post-name">

${post.name}

<i class="fa-solid fa-circle-check"></i>

</div>

<div class="post-username">

${post.username}

</div>

</div>

</div>

<i class="fa-solid fa-ellipsis"></i>

</div>

<div class="post-text">

${post.text}

</div>

<div class="post-images">

${post.images.map(image=>`

<img src="${image}" alt="">

`).join("")}

</div>

<div class="post-actions">

<div class="action">

<i class="fa-regular fa-heart"></i>

<span>${post.likes}</span>

</div>

<div class="action">

<i class="fa-regular fa-comment"></i>

<span>${post.comments}</span>

</div>

<div class="action">

<i class="fa-solid fa-repeat"></i>

<span>${post.reposts}</span>

</div>

<div class="action">

<i class="fa-regular fa-eye"></i>

<span>${post.views}</span>

</div>

</div>

</div>

`;

});
