/* ===================================================
   RETOVA
   HOME.JS
   VERSION 3.0
=================================================== */

/* ===========================
   APP
=========================== */

const app = {
    stories: [],
    posts: [],
    comments: {}
};

/* ===========================
   ELEMENTS
=========================== */

const storiesContainer =
document.getElementById("stories");

const feedContainer =
document.getElementById("feed");

const commentsSheet =
document.getElementById("commentsSheet");

const commentsList =
document.getElementById("commentsList");

const newPostButton =
document.getElementById("newPost");

/* ===========================
   HELPERS
=========================== */

function create(tag, className=""){

    const el=document.createElement(tag);

    if(className){

        el.className=className;

    }

    return el;

}

function clear(el){

    if(el){

        el.innerHTML="";

    }

}

function formatNumber(number){

    if(number>=1000000){

        return (number/1000000).toFixed(1)+"M";

    }

    if(number>=1000){

        return (number/1000).toFixed(1)+"K";

    }

    return number.toString();

}

/* ===========================
   STORIES
=========================== */

app.stories=[

{
id:1,
type:"mine",
name:"You",
letter:"R",
seen:false,
gradient:["#8B3DFF","#C54DFF"]
},

{
id:2,
type:"official",
name:"Apple",
avatar:"assets/avatars/apple.png",
verified:true,
seen:false
},

{
id:3,
type:"official",
name:"Ferrari",
avatar:"assets/avatars/ferrari.png",
verified:true,
seen:false
},

{
id:4,
type:"official",
name:"BMW",
avatar:"assets/avatars/bmw.png",
verified:true,
seen:true
},

{
id:5,
type:"official",
name:"Formula 1",
avatar:"assets/avatars/f1.png",
verified:true,
seen:false
},

{
id:6,
type:"official",
name:"Red Bull",
avatar:"assets/avatars/redbull.png",
verified:true,
seen:true
},

{
id:7,
type:"official",
name:"NASA",
avatar:"assets/avatars/nasa.png",
verified:true,
seen:false
},

{
id:8,
type:"official",
name:"Spotify",
avatar:"assets/avatars/spotify.png",
verified:true,
seen:true
},

{
id:9,
type:"official",
name:"Netflix",
avatar:"assets/avatars/netflix.png",
verified:true,
seen:false
},

{
id:10,
type:"official",
name:"PlayStation",
avatar:"assets/avatars/playstation.png",
verified:true,
seen:false
}

];
/* ===========================
   POSTS
=========================== */

app.posts = [

{
id:1,
accountType:"official",
name:"Apple",
username:"apple",
avatar:"assets/avatars/apple.png",
verified:true,
vip:false,
time:"12m",
text:"Apple Intelligence expands to more languages later this year.",
images:["assets/posts/apple1.jpg"],
likes:28400,
comments:1843,
reposts:3902,
views:2400000
},

{
id:2,
accountType:"official",
name:"Ferrari",
username:"ferrari",
avatar:"assets/avatars/ferrari.png",
verified:true,
vip:false,
time:"28m",
text:"Ready for another race weekend. Forza Ferrari.",
images:["assets/posts/ferrari1.jpg"],
likes:94100,
comments:6320,
reposts:11200,
views:7800000
},

{
id:3,
accountType:"official",
name:"BMW",
username:"bmw",
avatar:"assets/avatars/bmw.png",
verified:true,
vip:false,
time:"43m",
text:"The new BMW M4 Competition in Frozen Black.",
images:["assets/posts/bmw1.jpg"],
likes:55300,
comments:2981,
reposts:3011,
views:3100000
},

{
id:4,
accountType:"official",
name:"Formula 1",
username:"f1",
avatar:"assets/avatars/f1.png",
verified:true,
vip:false,
time:"1h",
text:"Lights out tomorrow. Who is taking pole position?",
images:["assets/posts/f1_1.jpg"],
likes:132000,
comments:8511,
reposts:19200,
views:9600000
},

{
id:5,
accountType:"official",
name:"Red Bull Racing",
username:"redbullracing",
avatar:"assets/avatars/redbull.png",
verified:true,
vip:false,
time:"2h",
text:"Every millisecond matters.",
images:["assets/posts/redbull1.jpg"],
likes:87300,
comments:4711,
reposts:9610,
views:5200000
},

{
id:6,
accountType:"vip",
name:"Lina",
username:"lina",
letter:"L",
gradient:["#8B3DFF","#C54DFF"],
verified:false,
vip:true,
time:"3h",
text:"Finally finished my new workspace setup.",
images:[],
likes:4211,
comments:291,
reposts:88,
views:119000
},

{
id:7,
accountType:"free",
name:"Noah",
username:"noah",
letter:"N",
gradient:["#2563EB","#06B6D4"],
verified:false,
vip:false,
time:"4h",
text:"Morning coffee before work.",
images:[],
likes:831,
comments:41,
reposts:12,
views:15200
},

{
id:8,
accountType:"official",
name:"NASA",
username:"nasa",
avatar:"assets/avatars/nasa.png",
verified:true,
vip:false,
time:"5h",
text:"Another breathtaking view of Earth from orbit.",
images:["assets/posts/nasa1.jpg"],
likes:61000,
comments:3410,
reposts:8200,
views:4700000
},

{
id:9,
accountType:"official",
name:"Spotify",
username:"spotify",
avatar:"assets/avatars/spotify.png",
verified:true,
vip:false,
time:"6h",
text:"Your next favorite playlist just dropped.",
images:[],
likes:22800,
comments:981,
reposts:1102,
views:1900000
},

{
id:10,
accountType:"official",
name:"Netflix",
username:"netflix",
avatar:"assets/avatars/netflix.png",
verified:true,
vip:false,
time:"7h",
text:"A new series arrives this Friday.",
images:[],
likes:35700,
comments:2100,
reposts:3400,
views:2900000
}

];
/* ===================================================
   PART 2
   RENDER STORIES
=================================================== */

function renderStories(){

    clear(storiesContainer);

    app.stories.forEach(story=>{

        const card=create("div","story");

        if(story.seen){

            card.classList.add("seen");

        }

        if(story.type==="mine"){

            card.classList.add("mine");

        }

        const ring=create("div","story-ring");

        const avatar=create("div","story-avatar");

        if(story.type==="official"){

            avatar.style.backgroundImage=
            `url(${story.avatar})`;

        }else{

            avatar.style.background=

            `linear-gradient(
            135deg,
            ${story.gradient[0]},
            ${story.gradient[1]}
            )`;

            avatar.textContent=
            story.letter;

        }

        ring.appendChild(avatar);

        card.appendChild(ring);

        if(story.type==="mine"){

            const plus=create("div","story-plus");

            plus.textContent="+";

            card.appendChild(plus);

        }

        const name=create("div","story-name");

        name.textContent=
        story.name;

        card.appendChild(name);

        storiesContainer.appendChild(card);

    });

}

/* ===================================================
   RENDER POSTS
=================================================== */

function renderPosts(){

    clear(feedContainer);

    app.posts.forEach(post=>{

        const article=create("article","post");

        article.dataset.id=post.id;

        let avatar="";

        if(post.accountType==="official"){

            avatar=`

            <div class="post-avatar">

            <img
            src="${post.avatar}"
            alt="${post.name}">

            </div>

            `;

        }else{

            avatar=`

            <div
            class="post-avatar"

            style="background:
            linear-gradient(
            135deg,
            ${post.gradient[0]},
            ${post.gradient[1]}
            );">

            ${post.letter}

            </div>

            `;

        }

        let badges="";

        if(post.verified){

            badges+=`
            <span class="verify">
            ✓
            </span>
            `;

        }

        if(post.vip){

            badges+=`

            <span class="vip">

            VIP

            </span>

            `;

        }

        let image="";

        if(post.images.length){

            image=`

            <div class="post-image">

            <img
            src="${post.images[0]}">

            </div>

            `;

        }

        article.innerHTML=`

        <div class="post-header">

            <div class="post-user">

                ${avatar}

                <div class="post-info">

                    <div class="post-name">

                    ${post.name}

                    ${badges}

                    </div>

                    <div class="post-username">

                    @${post.username}

                    </div>

                    <div class="post-time">

                    ${post.time}

                    </div>

                </div>

            </div>

        </div>

        <div class="post-content">

        ${post.text}

        </div>

        ${image}

        <div class="post-actions">

            <div class="post-left-actions">

                <div class="action action-like">

                ❤️ ${formatNumber(post.likes)}

                </div>

                <div class="action action-comment">

                💬 ${formatNumber(post.comments)}

                </div>

                <div class="action action-repost">

                🔁 ${formatNumber(post.reposts)}

                </div>

            </div>

            <div class="action">

            👁 ${formatNumber(post.views)}

            </div>

        </div>

        `;

        feedContainer.appendChild(article);

    });

}

/* ===================================================
   START
=================================================== */

renderStories();

renderPosts();
/* ===================================================
   PART 3
   RETOVA ENGINE
=================================================== */

/* ---------- COMMENT DATA ---------- */

const demoComments=[

{
name:"Lina",
letter:"L",
text:"This looks amazing 🔥",
likes:24
},

{
name:"Noah",
letter:"N",
text:"Can't wait for this.",
likes:8
},

{
name:"Emma",
letter:"E",
text:"Beautiful update.",
likes:13
},

{
name:"Sarah",
letter:"S",
text:"Love the design.",
likes:16
},

{
name:"Omar",
letter:"O",
text:"Retova keeps getting better.",
likes:11
},

{
name:"Maya",
letter:"M",
text:"My favorite app already.",
likes:31
},

{
name:"Alex",
letter:"A",
text:"Looks premium.",
likes:18
},

{
name:"Daniel",
letter:"D",
text:"Awesome work.",
likes:9
}

];

/* ---------- BUILD COMMENTS ---------- */

function buildComments(){

    if(!commentsList) return;

    commentsList.innerHTML="";

    demoComments.forEach(comment=>{

        const item=create("div","comment");

        item.innerHTML=`

        <div class="comment-avatar">

            ${comment.letter}

        </div>

        <div class="comment-content">

            <div class="comment-name">

                ${comment.name}

            </div>

            <div class="comment-text">

                ${comment.text}

            </div>

            <div class="comment-like">

                ❤️ ${comment.likes}

            </div>

        </div>

        `;

        commentsList.appendChild(item);

    });

}

/* ---------- OPEN COMMENTS ---------- */

document.addEventListener("click",(e)=>{

    const commentButton=e.target.closest(".action-comment");

    if(commentButton){

        buildComments();

        commentsSheet?.classList.add("show");

        return;

    }

    const like=e.target.closest(".action-like");

    if(like){

        like.classList.toggle("active");

        return;

    }

    const repost=e.target.closest(".action-repost");

    if(repost){

        repost.classList.toggle("active");

        return;

    }

});

/* ---------- CLOSE COMMENTS ---------- */

commentsSheet?.addEventListener("click",(e)=>{

    if(e.target===commentsSheet){

        commentsSheet.classList.remove("show");

    }

});

window.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        commentsSheet?.classList.remove("show");

    }

});

/* ---------- FLOAT BUTTON ---------- */

newPostButton?.addEventListener("click",()=>{

    console.log("Create new post");

});

/* ---------- NAVIGATION ---------- */

document.querySelectorAll("nav button").forEach(button=>{

    button.addEventListener("click",()=>{

        document
        .querySelectorAll("nav button")
        .forEach(item=>{

            item.classList.remove("active");

        });

        button.classList.add("active");

    });

});

/* ---------- PAGE ANIMATION ---------- */

window.addEventListener("load",()=>{

    document.querySelectorAll(".post").forEach((post,index)=>{

        post.style.opacity="0";

        post.style.transform="translateY(20px)";

        setTimeout(()=>{

            post.style.transition=".35s ease";

            post.style.opacity="1";

            post.style.transform="translateY(0)";

        },index*80);

    });

});

/* ==========================================
FAKE USERS DATABASE
========================================== */

const fakeUsers = [

{type:"official",name:"Ferrari",username:"ferrari",verified:true,avatar:"assets/avatars/ferrari.png"},
{type:"official",name:"BMW",username:"bmw",verified:true,avatar:"assets/avatars/bmw.png"},
{type:"official",name:"Red Bull",username:"redbull",verified:true,avatar:"assets/avatars/redbull.png"},
{type:"official",name:"Apple",username:"apple",verified:true,avatar:"assets/avatars/apple.png"},
{type:"official",name:"NASA",username:"nasa",verified:true,avatar:"assets/avatars/nasa.png"},
{type:"official",name:"Spotify",username:"spotify",verified:true,avatar:"assets/avatars/spotify.png"},
{type:"official",name:"Netflix",username:"netflix",verified:true,avatar:"assets/avatars/netflix.png"},
{type:"official",name:"Formula 1",username:"f1",verified:true,avatar:"assets/avatars/f1.png"},

{type:"user",name:"Lina",username:"lina",letter:"L",gradient:["#8B3DFF","#C54DFF"]},
{type:"user",name:"Noah",username:"noah",letter:"N",gradient:["#2563EB","#06B6D4"]},
{type:"user",name:"Emma",username:"emma",letter:"E",gradient:["#EC4899","#F97316"]},
{type:"user",name:"Sarah",username:"sarah",letter:"S",gradient:["#14B8A6","#22C55E"]},
{type:"user",name:"Adam",username:"adam",letter:"A",gradient:["#F59E0B","#EF4444"]},
{type:"user",name:"Maya",username:"maya",letter:"M",gradient:["#A855F7","#EC4899"]},
{type:"user",name:"Alex",username:"alex",letter:"A",gradient:["#06B6D4","#3B82F6"]},
{type:"user",name:"Daniel",username:"daniel",letter:"D",gradient:["#F97316","#FACC15"]}

];
/* ==========================================
AUTO GENERATE POSTS
========================================== */

const fakeTexts = [

"Good morning everyone ☀️",
"Today's weather is amazing.",
"Working on something exciting.",
"Coffee + coding = perfect day ☕",
"Who's watching Formula 1 today?",
"New setup completed ✨",
"Late night vibes 🌙",
"Weekend plans?",
"This photo came out better than expected.",
"Can't stop listening to this playlist.",
"Travel soon ✈️",
"Beautiful sunset today.",
"Learning something new every day.",
"Rate this from 1 to 10 👀",
"Retova is looking awesome 💜"

];

for(let i=0;i<40;i++){

    const user =
    fakeUsers[
        Math.floor(Math.random()*fakeUsers.length)
    ];

    app.posts.push({

        id:100+i,

        accountType:
        user.type==="official"
        ?"official"
        :"free",

        name:user.name,

        username:user.username,

        verified:user.verified||false,

        vip:false,

        avatar:user.avatar||"",

        letter:user.letter||"R",

        gradient:user.gradient||["#8B3DFF","#C54DFF"],

        time:
        Math.floor(Math.random()*23+1)+"h",

        text:
        fakeTexts[
        Math.floor(Math.random()*fakeTexts.length)
        ],

        images:[],

        likes:
        Math.floor(Math.random()*90000)+100,

        comments:
        Math.floor(Math.random()*3000)+5,

        reposts:
        Math.floor(Math.random()*2000),

        views:
        Math.floor(Math.random()*9000000)+5000

    });

}

renderPosts();
/* ==========================================
AUTO COMMENTS
========================================== */

const commentNames = [
"Lina","Noah","Emma","Sarah","Adam",
"Maya","Alex","Daniel","Leo","Olivia",
"Sophia","Jack","Ava","Lucas","Ethan"
];

const commentTexts = [

"🔥",
"Beautiful!",
"I love this.",
"Absolutely amazing.",
"Wow 😍",
"This is awesome.",
"Can't wait.",
"So clean.",
"Perfect shot.",
"My favorite.",
"Great work!",
"Looks incredible.",
"Nice one 👏",
"Love this update.",
"Retova keeps getting better 💜"

];

app.posts.forEach(post=>{

    comments[post.id]=[];

    const total=
    Math.floor(Math.random()*12)+4;

    for(let i=0;i<total;i++){

        comments[post.id].push({

            name:
            commentNames[
            Math.floor(Math.random()*commentNames.length)
            ],

            text:
            commentTexts[
            Math.floor(Math.random()*commentTexts.length)
            ],

            likes:
            Math.floor(Math.random()*80)

        });

    }

});
/* ==========================================
LIKE SYSTEM
========================================== */

document.addEventListener("click", (e) => {

    const like = e.target.closest(".action-like");

    if (!like) return;

    const post = like.closest(".post");
    if (!post) return;

    const id = Number(post.dataset.id);

    const data = app.posts.find(p => p.id === id);

    if (!data) return;

    const number = like.querySelector(".count");

    if (like.classList.contains("liked")) {

        like.classList.remove("liked");
        data.likes--;

    } else {

        like.classList.add("liked");
        data.likes++;

    }

    if (number) {
        number.textContent = formatNumber(data.likes);
    }

});
/* ==========================================
REACTIONS SYSTEM
========================================== */

const reactions = {};

function addReaction(postId, emoji) {

    if (!reactions[postId]) {
        reactions[postId] = {};
    }

    if (!reactions[postId][emoji]) {
        reactions[postId][emoji] = 0;
    }

    reactions[postId][emoji]++;

    renderReactions(postId);

}

function renderReactions(postId) {

    const post = document.querySelector(
        `.post[data-id="${postId}"]`
    );

    if (!post) return;

    let container =
    post.querySelector(".post-reactions");

    if (!container) {

        container = document.createElement("div");

        container.className = "post-reactions";

        post.appendChild(container);

    }

    container.innerHTML = "";

    Object.entries(reactions[postId] || {})
    .forEach(([emoji, count]) => {

        const item = document.createElement("div");

        item.className = "reaction-item";

        item.textContent = `${emoji} ${count}`;

        container.appendChild(item);

    });

           }
