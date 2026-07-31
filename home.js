// =====================================
// RETOVA
// Home.js
// =====================================

const app = document.getElementById("app");

// ===============================
// Render
// ===============================

app.innerHTML = `

<header class="header">

<img
class="avatar"
src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&fit=crop&crop=faces"
alt="Profile"
/>

<div class="logo">
Retova
</div>

<button class="icon-btn">

<i class="fa-solid fa-dharmachakra"></i>

</button>

</header>

<section
class="stories"
id="stories">

</section>

<section
class="feed"
id="feed">

</section>

<button class="fab">

<i class="fa-solid fa-plus"></i>

</button>

<nav class="bottom-nav">

<button class="active">

<i class="fa-solid fa-house"></i>

</button>

<button>

<i class="fa-solid fa-magnifying-glass"></i>

</button>

<button>

<i class="fa-regular fa-bell"></i>

</button>

<button>

<i class="fa-regular fa-user"></i>

</button>

</nav>

`;
// ===============================
// STORIES DATA
// ===============================

const stories = [

{
name:"You",
image:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&fit=crop&crop=faces",
me:true
},

{
name:"Apple",
image:"https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&fit=crop&crop=faces",
me:false
},

{
name:"F1 Hub",
image:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&fit=crop&crop=faces",
me:false
},

{
name:"Travel",
image:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop&crop=faces",
me:false
},

{
name:"Visual",
image:"https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&fit=crop&crop=faces",
me:false
}

];

// ===============================
// RENDER STORIES
// ===============================

const storiesContainer = document.getElementById("stories");

stories.forEach(story => {

storiesContainer.innerHTML += `

<div class="story ${story.me ? "you" : ""}">

<div class="story-ring">

<img src="${story.image}" alt="${story.name}">

</div>

<div class="story-name">

${story.name}

</div>

</div>

`;

});
