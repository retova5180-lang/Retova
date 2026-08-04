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
