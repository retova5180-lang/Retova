/* ==========================================
   RETOVA
   HOME.JS
   PART 1
========================================== */

/* ---------- APP ---------- */

const app = {

    stories: [],

    posts: [],

    user: null

};

/* ---------- ELEMENTS ---------- */

const storiesContainer =
document.getElementById("stories");

const feedContainer =
document.getElementById("feed");

const newPostButton =
document.getElementById("newPost");

/* ---------- HELPERS ---------- */

function create(tag, className = ""){

    const element =
    document.createElement(tag);

    if(className){

        element.className = className;

    }

    return element;

}

function clear(element){

    element.innerHTML = "";

}

function formatNumber(number){

    if(number >= 1000000){

        return (number / 1000000).toFixed(1) + "M";

    }

    if(number >= 1000){

        return (number / 1000).toFixed(1) + "K";

    }

    return number.toString();

}

/* ---------- INIT ---------- */

function initializeHome(){

    clear(storiesContainer);

    clear(feedContainer);

}

initializeHome();
/* ==========================================
   STORIES DATA
========================================== */

app.stories = [

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
    name:"Formula 1",
    avatar:"assets/avatars/f1.png",
    verified:true,
    seen:true
},

{
    id:4,
    type:"official",
    name:"NASA",
    avatar:"assets/avatars/nasa.png",
    verified:true,
    seen:false
},

{
    id:5,
    type:"official",
    name:"Spotify",
    avatar:"assets/avatars/spotify.png",
    verified:true,
    seen:true
},

{
    id:6,
    type:"official",
    name:"Netflix",
    avatar:"assets/avatars/netflix.png",
    verified:true,
    seen:false
}

];

/* ==========================================
   RENDER STORIES
========================================== */

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

            avatar.style.backgroundImage=`url(${story.avatar})`;

            avatar.style.backgroundSize="cover";

            avatar.style.backgroundPosition="center";

        }else{

            avatar.style.background=
            `linear-gradient(135deg,${story.gradient[0]},${story.gradient[1]})`;

            avatar.textContent=story.letter;

        }

        ring.appendChild(avatar);

        card.appendChild(ring);

        if(story.type==="mine"){

            const plus=create("div","story-plus");

            plus.textContent="+";

            card.appendChild(plus);

        }

        const name=create("div","story-name");

        name.textContent=story.name;

        card.appendChild(name);

        storiesContainer.appendChild(card);

    });

}

renderStories();
/* ==========================================
   POSTS DATA
========================================== */

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

images:[
"assets/posts/apple_1.jpg"
],

likes:28400,

comments:1843,

reposts:3902,

views:2400000

},

{
id:2,

accountType:"official",

name:"Formula 1",

username:"f1",

avatar:"assets/avatars/f1.png",

verified:true,

vip:false,

time:"31m",

text:"Race weekend starts tomorrow. Which team are you supporting?",

images:[
"assets/posts/f1_1.jpg"
],

likes:91300,

comments:6200,

reposts:12000,

views:7400000

},

{
id:3,

accountType:"vip",

name:"Lina",

username:"lina",

letter:"L",

gradient:["#8B3DFF","#C54DFF"],

verified:false,

vip:true,

time:"5m",

text:"Finally finished my new workspace setup.",

images:[],

likes:4200,

comments:286,

reposts:81,

views:118000

},

{
id:4,

accountType:"free",

name:"Noah",

username:"noah",

letter:"N",

gradient:["#2563EB","#06B6D4"],

verified:false,

vip:false,

time:"1h",

text:"Late night coding session completed.",

images:[],

likes:863,

comments:54,

reposts:11,

views:18400

}

];
/* ==========================================
   RENDER POSTS
========================================== */

function renderPosts(){

    clear(feedContainer);

    app.posts.forEach(post=>{

        const article = create("article","post");

        /* ---------- Avatar ---------- */

        let avatarHTML="";

        if(post.accountType==="official"){

            avatarHTML=`
            <div class="post-avatar">
                <img src="${post.avatar}" alt="${post.name}">
            </div>
            `;

        }else{

            avatarHTML=`
            <div
                class="post-avatar"
                style="
                background:linear-gradient(
                135deg,
                ${post.gradient[0]},
                ${post.gradient[1]}
                );">

                ${post.letter}

            </div>
            `;

        }

        /* ---------- Badges ---------- */

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

        /* ---------- Images ---------- */

        let imagesHTML="";

        if(post.images.length===1){

            imagesHTML=`

            <div class="post-image">

                <img
                src="${post.images[0]}"
                alt="">

            </div>

            `;

        }

        /* ---------- Card ---------- */

        article.innerHTML=`

        <div class="post-header">

            <div class="post-user">

                ${avatarHTML}

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

        ${imagesHTML}

        <div class="post-actions">

            <div class="post-left-actions">

                <div class="action">
                    ❤️ ${formatNumber(post.likes)}
                </div>

                <div class="action">
                    💬 ${formatNumber(post.comments)}
                </div>

                <div class="action">
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

renderPosts();
/* ==========================================
   INTERACTIONS
========================================== */

document.addEventListener("click",(event)=>{

    const action=event.target.closest(".action");

    if(action){

        action.classList.toggle("active");

    }

});

/* ==========================================
   FLOAT BUTTON
========================================== */

if(newPostButton){

    newPostButton.addEventListener("click",()=>{

        console.log("Create Post");

    });

}

/* ==========================================
   NAVIGATION
========================================== */

const navButtons=document.querySelectorAll("nav button");

navButtons.forEach(button=>{

    button.addEventListener("click",()=>{

        navButtons.forEach(item=>{

            item.classList.remove("active");

        });

        button.classList.add("active");

    });

});

/* ==========================================
   SIMPLE ANIMATION
========================================== */

window.addEventListener("load",()=>{

    document.querySelectorAll(".post").forEach((post,index)=>{

        post.style.opacity="0";

        post.style.transform="translateY(20px)";

        setTimeout(()=>{

            post.style.transition=".35s ease";

            post.style.opacity="1";

            post.style.transform="translateY(0)";

        },index*120);

    });

});
/* ==========================================
   POSTS DATA
========================================== */

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
time:"27m",
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
time:"58m",
text:"Lights out tomorrow. Who's taking pole position?",
images:["assets/posts/f1_1.jpg"],
likes:132000,
comments:8511,
reposts:19200,
views:9600000
},

{
id:5,
accountType:"vip",
name:"Lina",
username:"lina",
letter:"L",
gradient:["#8B3DFF","#C54DFF"],
verified:false,
vip:true,
time:"1h",
text:"Finally finished my new workspace setup.",
images:["assets/posts/setup1.jpg"],
likes:4211,
comments:291,
reposts:88,
views:119000
},

{
id:6,
accountType:"free",
name:"Noah",
username:"noah",
letter:"N",
gradient:["#2563EB","#06B6D4"],
verified:false,
vip:false,
time:"2h",
text:"Morning coffee before work ☕",
images:["assets/posts/coffee1.jpg"],
likes:831,
comments:41,
reposts:12,
views:15200
},

{
id:7,
accountType:"official",
name:"NASA",
username:"nasa",
avatar:"assets/avatars/nasa.png",
verified:true,
vip:false,
time:"3h",
text:"Another breathtaking view of Earth from orbit.",
images:["assets/posts/nasa1.jpg"],
likes:61000,
comments:3410,
reposts:8200,
views:4700000
},

{
id:8,
accountType:"official",
name:"Spotify",
username:"spotify",
avatar:"assets/avatars/spotify.png",
verified:true,
vip:false,
time:"5h",
text:"Your next favorite playlist just dropped.",
images:["assets/posts/music1.jpg"],
likes:22800,
comments:981,
reposts:1102,
views:1900000
}

];
/* ==========================================
   COMMENTS
========================================== */

const comments = {

1:[
{name:"Noah",text:"Looks amazing 🔥"},
{name:"Emma",text:"Can't wait for this."},
{name:"Maya",text:"Finally!"},
{name:"Lina",text:"Love it ❤️"},
{name:"Omar",text:"Best update so far."},
{name:"Sarah",text:"This is beautiful."},
{name:"Alex",text:"Great work Apple."},
{name:"Daniel",text:"Instant upgrade."}
],

2:[
{name:"Noah",text:"Forza Ferrari ❤️"},
{name:"Emma",text:"Let's win this weekend."},
{name:"Maya",text:"Beautiful car."},
{name:"Omar",text:"Looks so clean."},
{name:"Sarah",text:"Dream garage."},
{name:"Adam",text:"Absolutely stunning."},
{name:"Lina",text:"🔥🔥🔥"},
{name:"Alex",text:"Can't stop looking at it."}
],

3:[
{name:"Emma",text:"M4 looks perfect."},
{name:"Sarah",text:"Favorite color."},
{name:"Omar",text:"Need this."},
{name:"Noah",text:"BMW never disappoints."},
{name:"Daniel",text:"Beautiful spec."},
{name:"Maya",text:"Love it."}
],

4:[
{name:"Adam",text:"Ferrari this weekend."},
{name:"Lina",text:"McLaren 🔥"},
{name:"Noah",text:"Can't wait."},
{name:"Emma",text:"Pole tomorrow."},
{name:"Sarah",text:"Best sport ever."},
{name:"Alex",text:"Let's go!"}
],

5:[
{name:"Emma",text:"Clean setup."},
{name:"Sarah",text:"Looks cozy."},
{name:"Omar",text:"Nice lighting."},
{name:"Noah",text:"Love the colors."},
{name:"Adam",text:"Goals."}
]

};
/* ==========================================
   PART 8
   RETOVA INTERACTIONS
========================================== */

document.addEventListener("DOMContentLoaded",()=>{

    // فتح المنشور

    document.querySelectorAll(".post").forEach(post=>{

        post.addEventListener("click",(e)=>{

            if(
                e.target.closest(".action") ||
                e.target.closest(".post-menu")
            ){
                return;
            }

            console.log("Open Post");

        });

    });

    // إعجاب

    document.querySelectorAll(".action-like").forEach(button=>{

        button.addEventListener("click",()=>{

            button.classList.toggle("liked");

        });

    });

    // حفظ

    document.querySelectorAll(".action-save").forEach(button=>{

        button.addEventListener("click",()=>{

            button.classList.toggle("saved");

        });

    });

    // إعادة نشر

    document.querySelectorAll(".action-repost").forEach(button=>{

        button.addEventListener("click",()=>{

            button.classList.toggle("reposted");

        });

    });

    // تعليقات

    document.querySelectorAll(".action-comment").forEach(button=>{

        button.addEventListener("click",()=>{

            console.log("Open Comments");

        });

    });

    // مشاركة

    document.querySelectorAll(".action-share").forEach(button=>{

        button.addEventListener("click",()=>{

            console.log("Share");

        });

    });

});
/* ==========================================
   PART 9
   COMMENTS SHEET
========================================== */

const commentsSheet = {

    opened:false,

    post:null,

    open(postId){

        this.opened=true;

        this.post=postId;

        console.log("Comments:",postId);

    },

    close(){

        this.opened=false;

        this.post=null;

    }

};

/* ==========================================
   OPEN COMMENTS
========================================== */

document.addEventListener("click",(e)=>{

    const button=e.target.closest(".action-comment");

    if(!button) return;

    const post=button.closest(".post");

    if(!post) return;

    commentsSheet.open(post.dataset.id);

});

/* ==========================================
   ESC
========================================== */

window.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        commentsSheet.close();

    }

});
