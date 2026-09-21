(() => {
  "use strict";


  /* =========================
     SUPABASE
  ========================== */

  const SUPABASE_URL =
    "https://bfqsqgfyyewnfxekirfv.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";


  const supabaseClient =
    window.supabase?.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    ) || null;


  /* =========================
     STORAGE
  ========================== */

  const USER_KEY =
    "ars_user";

  const LOGGED_IN_KEY =
    "ars_logged_in";

  const LETTER_KEY =
    "ars_letter";

  const PLAN_KEY =
    "ars_plan";

  const WHEEL_KEY =
    "ars_wheel_week";

  const STREAK_DAYS_KEY =
    "ars_streak_interaction_days";

  const POSTS_KEY =
    "ars_home_posts_v3";


  let currentUser = null;

  let currentPlan =
    "free";

  let menuOpen = null;

  let wheelRotation = 0;


  /* =========================
     HELPERS
  ========================== */

  const $ = id =>
    document.getElementById(id);


  function escapeHTML(value){

    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");

  }


  function toast(message){

    const el = $("toast");

    if(!el) return;

    el.textContent =
      message;

    el.classList.add("show");

    clearTimeout(
      window.__arsToastTimer
    );

    window.__arsToastTimer =
      setTimeout(
        () =>
          el.classList.remove("show"),
        2200
      );

  }


  function readJSON(
    key,
    fallback
  ){

    try{

      return JSON.parse(
        localStorage.getItem(key) ||
        JSON.stringify(fallback)
      );

    }catch{

      return fallback;

    }

  }


  function writeJSON(
    key,
    value
  ){

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  }


  /* =========================
     STORIES
  ========================== */

  const stories = [

    {
      name:"You",
      letter:"A",
      own:true
    },

    {
      name:"Lina",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80"
    },

    {
      name:"Noah",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
    },

    {
      name:"Sara",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
    },

    {
      name:"Wheel",
      wheel:true
    },

    {
      name:"Apple",
      brand:"",
      verified:true
    },

    {
      name:"Ferrari",
      brand:"🐎",
      verified:true
    },

    {
      name:"BMW",
      brand:"M",
      verified:true
    }

  ];


  /* =========================
     POSTS
  ========================== */

  const seedPosts = [

    {
      id:1,

      name:"Lina",

      username:"lina.ae",

      verified:true,

      letter:"L",

      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",

      time:"12m",

      text:
        "Sunset always hits different 💜",

      image:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=88",

      likes:2400,

      comments:186,

      reposts:312,

      views:48000,

      liked:false,

      reposted:false,

      bookmarked:false

    },


    {
      id:2,

      name:"Apple",

      username:"apple",

      verified:true,

      letter:"",

      brand:true,

      time:"28m",

      text:
        "Apple Intelligence expands to more languages later this year.",

      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=88",

      likes:28400,

      comments:1800,

      reposts:3900,

      views:2400000,

      liked:false,

      reposted:false,

      bookmarked:false

    },


    {
      id:3,

      name:"Noah",

      username:"noah.vibes",

      verified:true,

      letter:"N",

      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",

      time:"45m",

      text:
        "Focused on the journey. #focus #life",

      image:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=88",

      likes:1290,

      comments:88,

      reposts:117,

      views:18400,

      liked:false,

      reposted:false,

      bookmarked:false

    }

  ];


  let posts =
    getPosts();


  function getPosts(){

    const saved =
      readJSON(
        POSTS_KEY,
        null
      );

    if(
      Array.isArray(saved) &&
      saved.length
    ){

      return saved;

    }

    return structuredClone(
      seedPosts
    );

  }


  function savePosts(){

    writeJSON(
      POSTS_KEY,
      posts
    );

  }


  /* =========================
     WHEEL CONTENT
  ========================== */

  const wheelItems = [

    {
      type:"CHALLENGE",

      title:"Post a Story",

      description:
        "Share one thing you enjoyed today.",

      reward:"+50 XP"
    },


    {
      type:"REWARD",

      title:"Lucky XP",

      description:
        "A bonus reward has been unlocked.",

      reward:"+100 XP"
    },


    {
      type:"QUESTION",

      title:"Question of the Day",

      description:
        "What is one thing you want to achieve this week?",

      reward:"+25 XP"
    },


    {
      type:"BONUS",

      title:"Support Someone",

      description:
        "Like and comment on three posts you genuinely enjoy.",

      reward:"+75 XP"
    },


    {
      type:"REWARD",

      title:"Purple Bonus",

      description:
        "You found a rare wheel reward.",

      reward:"+150 XP"
    },


    {
      type:"CHALLENGE",

      title:"Create Something",

      description:
        "Make a post and share an idea with ARS.",

      reward:"+80 XP"
    }

  ];


  /* =========================
     SEARCH DATA
  ========================== */

  const hashtags = [

    [
      "#ARS",
      "12.4K posts"
    ],

    [
      "#Weekend",
      "8.7K posts"
    ],

    [
      "#Create",
      "6.2K posts"
    ],

    [
      "#Photography",
      "5.9K posts"
    ],

    [
      "#DailyChallenge",
      "4.8K posts"
    ]

  ];


  const people = [

    [
      "Alex Carter",
      "@alex",
      "A"
    ],

    [
      "Mia",
      "@mia",
      "M"
    ],

    [
      "Ryan",
      "@ryan",
      "R"
    ],

    [
      "Luna",
      "@luna",
      "L"
    ]

  ];


  const topics = [

    [
      "Trending",
      "Weekend plans",
      "24.5K posts"
    ],

    [
      "Trending",
      "Daily challenges",
      "18.2K posts"
    ],

    [
      "Trending",
      "Photography",
      "15.7K posts"
    ],

    [
      "Trending",
      "Creative ideas",
      "11.3K posts"
    ]

  ];


  /* =========================
     USER
  ========================== */

  function getInitial(){

    return (

      localStorage.getItem(
        LETTER_KEY
      ) ||

      currentUser?.display_name?.[0] ||

      currentUser?.username?.[0] ||

      "A"

    ).toUpperCase();

  }


  /* =========================
     AUTH
  ========================== */

  async function checkAuth(){

    const local =
      readJSON(
        USER_KEY,
        null
      );


    const sessionResult =
      await supabaseClient
        ?.auth
        .getSession()
        .catch(
          () => null
        );


    const session =
      sessionResult
        ?.data
        ?.session;


    if(session){

      currentUser = {

        id:
          session.user.id,

        email:
          session.user.email || "",

        username:
          session.user.user_metadata?.username ||
          local?.username ||
          "",

        display_name:
          session.user.user_metadata?.display_name ||
          local?.display_name ||
          ""

      };


      try{

        const {
          data
        } =
          await supabaseClient
            .from("users")
            .select("*")
            .eq(
              "id",
              session.user.id
            )
            .maybeSingle();


        if(data){

          currentUser = {

            ...currentUser,

            ...data

          };

        }

      }catch{}


      currentPlan =
        currentUser.plan ||
        local?.plan ||
        localStorage.getItem(
          PLAN_KEY
        ) ||
        "free";


      writeJSON(
        USER_KEY,
        currentUser
      );


      localStorage.setItem(
        LOGGED_IN_KEY,
        "true"
      );


      return true;

    }


    if(local){

      currentUser =
        local;

      currentPlan =
        local.plan ||
        localStorage.getItem(
          PLAN_KEY
        ) ||
        "free";

      return true;

    }


    window.location.href =
      "index.html";

    return false;

  }


  /* =========================
     AVATAR
  ========================== */

  function avatarHTML(post){

    if(post.avatar){

      return `
        <img
          src="${escapeHTML(post.avatar)}"
          alt=""
        >
      `;

    }

    return escapeHTML(
      post.letter || "A"
    );

  }


  /* =========================
     STORIES RENDER
  ========================== */

  function renderStories(){

    const el =
      $("stories");

    if(!el) return;


    el.innerHTML =
      stories.map(
        (s,i) => {

          let inner = "";


          if(s.image){

            inner = `
              <img
                src="${escapeHTML(s.image)}"
                alt=""
              >
            `;

          }

          else if(s.wheel){

            inner = `
              <span class="wheel-mini-icon">
                ✣
              </span>
            `;

          }

          else if(s.brand){

            inner = `
              <span class="story-letter">
                ${escapeHTML(s.brand)}
              </span>
            `;

          }

          else{

            inner = `
              <span class="story-letter">
                ${escapeHTML(s.letter)}
              </span>
            `;

          }


          return `
            <button
              class="story"
              data-story="${i}"
            >

              <div
                class="story-ring ${
                  s.wheel
                    ? "no-ring"
                    : ""
                }"
              >

                <div class="story-inner">

                  ${inner}

                  ${
                    s.own
                      ? `
                        <span class="story-plus">
                          +
                        </span>
                      `
                      : ""
                  }

                </div>

              </div>


              <div class="story-name">
                ${escapeHTML(s.name)}
              </div>

            </button>
          `;

        }
      ).join("");

  }


  /* =========================
     FORMAT COUNTS
  ========================== */

  function formatCount(n){

    if(n >= 1000000){

      return (
        n / 1000000
      ).toFixed(
        n % 1000000
          ? 1
          : 0
      ) + "M";

    }


    if(n >= 1000){

      return (
        n / 1000
      ).toFixed(
        n % 1000
          ? 1
          : 0
      ) + "K";

    }


    return String(n);

  }


  /* =========================
     RENDER POSTS
  ========================== */

  function renderPosts(){

    const feed =
      $("feed");

    if(!feed) return;


    feed.innerHTML =
      posts.map(
        post => {

          const liked =
            post.liked
              ? "liked"
              : "";

          const reposted =
            post.reposted
              ? "reposted"
              : "";

          const bookmarked =
            post.bookmarked
              ? "bookmarked"
              : "";


          const name =
            escapeHTML(
              post.name
            );


          return `

            <article
              class="post-card"
              data-post-id="${post.id}"
            >

              <div class="post-head">

                <div class="post-avatar">

                  <div class="post-avatar-inner">

                    ${avatarHTML(post)}

                  </div>

                </div>


                <div class="post-user">

                  <div class="post-user-line">

                    <strong>
                      ${name}
                    </strong>

                    ${
                      post.verified
                        ? `
                          <span class="verified">
                            ✓
                          </span>
                        `
                        : ""
                    }

                  </div>


                  <span class="post-meta">

                    @${escapeHTML(post.username)}
                    ·
                    ${escapeHTML(post.time)}

                  </span>

                </div>


                <button
                  class="more-button"
                  data-more="${post.id}"
                  aria-label="More options"
                >
                  •••
                </button>

              </div>


              <div class="post-text">

                ${
                  escapeHTML(post.text)
                    .replace(
                      /(#[A-Za-z0-9_]+)/g,
                      '<span class="tag">$1</span>'
                    )
                }

              </div>


              ${
                post.image
                  ? `
                    <img
                      class="post-image"
                      src="${escapeHTML(post.image)}"
                      alt="Post image"
                      loading="lazy"
                    >
                  `
                  : ""
              }


              <div class="post-actions">

                <button
                  class="post-action ${liked}"
                  data-action="like"
                  data-id="${post.id}"
                >

                  <span class="ico">
                    ${
                      post.liked
                        ? "♥"
                        : "♡"
                    }
                  </span>

                  <span>
                    ${formatCount(post.likes)}
                  </span>

                </button>


                <button
                  class="post-action"
                  data-action="comment"
                  data-id="${post.id}"
                >

                  <span class="ico">
                    ◯
                  </span>

                  <span>
                    ${formatCount(post.comments)}
                  </span>

                </button>


                <button
                  class="post-action ${reposted}"
                  data-action="repost"
                  data-id="${post.id}"
                >

                  <span class="ico">
                    ↗
                  </span>

                  <span>
                    ${formatCount(post.reposts)}
                  </span>

                </button>


                <button
                  class="post-action ${bookmarked}"
                  data-action="bookmark"
                  data-id="${post.id}"
                >

                  <span class="ico">

                    ${
                      post.bookmarked
                        ? "▣"
                        : "♧"
                    }

                  </span>

                </button>


                <span class="post-action views">

                  <span class="ico">
                    ◉
                  </span>

                  <span>
                    ${formatCount(post.views)}
                  </span>

                </span>

              </div>

            </article>

          `;

        }
      ).join("");

  }


  /* =========================
     POST MENU
  ========================== */

  function closePostMenu(){

    document
      .querySelectorAll(
        ".post-menu"
      )
      .forEach(
        x => x.remove()
      );


    $("postMenuBackdrop")
      ?.classList.remove(
        "show"
      );


    menuOpen = null;

  }


  function openPostMenu(
    postId
  ){

    closePostMenu();


    const card =
      document.querySelector(
        `.post-card[data-post-id="${postId}"]`
      );


    const post =
      posts.find(
        p => p.id === postId
      );


    if(!card || !post)
      return;


    const menu =
      document.createElement(
        "div"
      );


    menu.className =
      "post-menu";


    menu.innerHTML = `

      <button data-menu="repost">

        <span>
          ↗
        </span>

        Repost

      </button>


      <button data-menu="bookmark">

        <span>
          ♧
        </span>

        Bookmark

      </button>


      <button data-menu="share">

        <span>
          ↗
        </span>

        Share

      </button>


      <button data-menu="copy">

        <span>
          ▣
        </span>

        Copy link

      </button>


      <button
        data-menu="report"
        class="danger"
      >

        <span>
          ⚑
        </span>

        Report post

      </button>


      <button data-menu="hide">

        <span>
          ◌
        </span>

        Hide post

      </button>

    `;


    menu.addEventListener(
      "click",
      e => {

        const b =
          e.target.closest(
            "[data-menu]"
          );


        if(!b)
          return;


        handlePostAction(
          b.dataset.menu,
          post
        );


        closePostMenu();

      }
    );


    card.appendChild(
      menu
    );


    $("postMenuBackdrop")
      ?.classList.add(
        "show"
      );


    menuOpen =
      postId;

  }


  /* =========================
     POST MENU ACTIONS
  ========================== */

  async function handlePostAction(
    action,
    post
  ){

    if(
      action === "repost"
    ){

      post.reposted =
        !post.reposted;

      post.reposts =
        Math.max(
          0,
          post.reposts +
          (
            post.reposted
              ? 1
              : -1
          )
        );


      savePosts();

      renderPosts();

      toast(
        post.reposted
          ? "Reposted"
          : "Repost removed"
      );

      return;

    }


    if(
      action === "bookmark"
    ){

      post.bookmarked =
        !post.bookmarked;

      savePosts();

      renderPosts();

      toast(
        post.bookmarked
          ? "Saved"
          : "Removed from saved"
      );

      return;

    }


    if(
      action === "share"
    ){

      if(
        navigator.share
      ){

        try{

          await navigator.share({

            title:"ARS",

            text:post.text,

            url:
              location.href +
              "?post=" +
              post.id

          });

        }catch{}

      }

      else{

        toast(
          "Share is ready on this device"
        );

      }

      return;

    }


    if(
      action === "copy"
    ){

      const url =
        location.origin +
        location.pathname +
        "?post=" +
        post.id;


      try{

        await navigator.clipboard
          .writeText(url);

        toast(
          "Link copied"
        );

      }

      catch{

        toast(
          "Copy is unavailable in this browser"
        );

      }

      return;

    }


    if(
      action === "report"
    ){

      toast(
        "Report option selected"
      );

      return;

    }


    if(
      action === "hide"
    ){

      posts =
        posts.filter(
          p =>
            p.id !== post.id
        );

      
