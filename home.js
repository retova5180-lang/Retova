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
