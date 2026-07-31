// =====================================
// RETOVA
// =====================================

const app = document.getElementById("app");

app.innerHTML = `

<header class="header">

<img class="avatar"
src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&fit=crop&crop=faces">

<div class="logo">

Retova

</div>

<button class="icon-btn">

<i class="fa-solid fa-dharmachakra"></i>

</button>

</header>

<section class="stories" id="stories">

</section>

<section class="feed" id="feed">

</section>

<nav class="bottom-nav">

</nav>

`;
// =====================================
// STORIES
// =====================================

const stories = [

{
name:"You",
image:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&fit=crop&crop=faces",
me:true
},

{
name:"Apple",
image:"https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&fit=crop&crop=faces"
},

{
name:"Travel",
image:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop&crop=faces"
},

{
name:"F1 Hub",
image:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&fit=crop&crop=faces"
},

{
name:"Visual",
image:"https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&fit=crop&crop=faces"
}

];

const storiesBox=document.getElementById("stories");

stories.forEach(story=>{

storiesBox.innerHTML+=`

<div class="story ${story.me ? "you":""}">

<div class="story-ring">

<img src="${story.image}" alt="">

</div>

<div class="story-name">

${story.name}

</div>

</div>

`;

});

// =====================================
// FIRST POST
// =====================================

const feed=document.getElementById("feed");

feed.innerHTML=`

<div class="post">

<div class="post-header">

<div class="post-user">

<img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&fit=crop&crop=faces">

<div>

<div class="post-name">

Apple Leaks

<i class="fa-solid fa-circle-check"></i>

</div>

<div class="post-username">

@appleleaks • 8m

</div>

</div>

</div>

<i class="fa-solid fa-ellipsis"></i>

</div>

<div class="post-text">

iPhone Fold is reportedly entering the final testing phase. 📱🔥
Would you actually switch to a foldable iPhone?

</div>

<div class="post-images">

<img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900">

</div>

</div>

`;
