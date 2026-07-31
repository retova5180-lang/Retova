// ==============================
// RETOVA PART 1
// ==============================

const stories = [
{
name:"You",
avatar:"https://i.pravatar.cc/150?img=15",
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

const storiesContainer = document.getElementById("stories");

stories.forEach(story=>{

storiesContainer.innerHTML += `

<div class="story ${story.me ? "you" : ""}">

<div class="story-avatar">

<img src="${story.avatar}" alt="">

${story.me ? `<div class="add-story">+</div>` : ""}

</div>

<div class="story-name">

${story.name}

</div>

</div>

`;

});
