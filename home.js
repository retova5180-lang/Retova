const app = document.getElementById("app");

app.innerHTML = `

<header class="header">

<img
class="avatar"
src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&fit=crop&crop=faces"
alt="">

<div class="logo">

Retova

</div>

<button class="icon-btn">

<i class="fa-solid fa-dharmachakra"></i>

</button>

</header>

<section id="stories"></section>

<section id="feed"></section>

`;
const stories=[

{
name:"You",
img:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&fit=crop&crop=faces"
},

{
name:"Sophia",
img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&fit=crop&crop=faces"
},

{
name:"Noah",
img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop&crop=faces"
},

{
name:"Emma",
img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&fit=crop&crop=faces"
},

{
name:"Liam",
img:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&fit=crop&crop=faces"
}

];

const storiesContainer=document.getElementById("stories");

stories.forEach(story=>{

storiesContainer.innerHTML+=`

<div class="story">

<div class="story-ring">

<img src="${story.img}">

</div>

<div class="story-name">

${story.name}

</div>

</div>

`;

});
