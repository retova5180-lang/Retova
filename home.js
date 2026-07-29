// =========================
// RETOVA STORIES
// =========================

const storiesContainer = document.querySelector(".stories");

const stories = [

{
name:"You",
avatar:"https://i.pravatar.cc/150?img=15",
you:true
},

{
name:"Sophia",
avatar:"https://i.pravatar.cc/150?img=32"
},

{
name:"Noah",
avatar:"https://i.pravatar.cc/150?img=12"
},

{
name:"Emma",
avatar:"https://i.pravatar.cc/150?img=48"
},

{
name:"Liam",
avatar:"https://i.pravatar.cc/150?img=60"
},

{
name:"Mia",
avatar:"https://i.pravatar.cc/150?img=24"
}

];

stories.forEach(story=>{

storiesContainer.innerHTML += `

<div class="story ${story.you ? "you" : ""}">

<div class="story-avatar">

<img src="${story.avatar}" alt="${story.name}">

${story.you ? '<div class="add-story">+</div>' : ''}

</div>

<div class="story-name">

${story.name}

</div>

</div>

`;

});
// =========================
// FIRST POST
// =========================

feed.innerHTML = `

<div class="post">

<div class="post-header">

<div class="post-user">

<img src="https://i.pravatar.cc/150?img=60">

<div>

<div class="post-name">

SALAH 💜

</div>

<div class="post-username">

@s4u_2 · 2m

</div>

</div>

</div>

<i class="fa-solid fa-ellipsis"></i>

</div>

<div class="post-text">

Which destination would you choose for your next vacation? 🌍✈️

</div>

<div class="post-images">

<img src="https://picsum.photos/600/600?11">

<img src="https://picsum.photos/600/600?12">

<img src="https://picsum.photos/600/600?13">

<img src="https://picsum.photos/600/600?14">

</div>

<div class="post-actions">

<div class="action">

<i class="fa-regular fa-heart"></i>

<span>7.8K</span>

</div>

<div class="action">

<i class="fa-regular fa-comment"></i>

<span>104</span>

</div>

<div class="action">

<i class="fa-solid fa-repeat"></i>

<span>19</span>

</div>

<div class="action">

<i class="fa-regular fa-eye"></i>

<span>48K</span>

</div>

<div class="action">

<i class="fa-solid fa-arrow-up-from-bracket"></i>

</div>

</div>

</div>

`;
