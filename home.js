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
