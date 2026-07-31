const stories = [

{
name:"You",
avatar:"https://i.pravatar.cc/150?img=15"
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
avatar:"https://i.pravatar.cc/150?img=47"
},

{
name:"Liam",
avatar:"https://i.pravatar.cc/150?img=18"
},

{
name:"Mia",
avatar:"https://i.pravatar.cc/150?img=25"
}

];

const storiesBox = document.getElementById("stories");

stories.forEach(user=>{

storiesBox.innerHTML += `

<div class="story">

<div class="story-avatar">

<img src="${user.avatar}">

</div>

<div class="story-name">

${user.name}

</div>

</div>

`;

});

const posts=[

{

name:"Sophia",

user:"@sophia",

avatar:"https://i.pravatar.cc/150?img=32",

text:"Good morning ☀️",

image:"https://picsum.photos/700/500?random=1"

},

{

name:"Liam",

user:"@liam",

avatar:"https://i.pravatar.cc/150?img=18",

text:"Weekend vibes 🌴",

image:"https://picsum.photos/700/500?random=2"

}

];

const feed=document.getElementById("feed");

posts.forEach(post=>{

feed.innerHTML+=`

<div class="post">

<h3>${post.name}</h3>

<p>${post.user}</p>

<p>${post.text}</p>

<img src="${post.image}">

</div>

`;

});
