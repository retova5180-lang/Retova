(() => {

    "use strict";


    /* =========================
       SUPABASE
    ========================= */

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
       HELPERS
    ========================= */

    const $ = (id) =>
        document.getElementById(id);


    const USER_KEY =
        "ars_user";


    const LOGGED_IN_KEY =
        "ars_logged_in";


    const PLAN_KEY =
        "ars_plan";


    const WHEEL_KEY =
        "ars_wheel_week";


    const STREAK_KEY =
        "ars_streak_state";


    const POSTS_KEY =
        "ars_home_posts_v5";


    let currentUser =
        JSON.parse(
            localStorage.getItem(USER_KEY) || "null"
        );


    let plan =
        localStorage.getItem(PLAN_KEY) || "free";


    let wheelRotation = 0;


    /* =========================
       IMAGE DATA
    ========================= */

    const img = {

        sunset:
            "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1200&q=85",

        apple:
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85",

        noah:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=85",

        lina:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=85",

        sara:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=85"

    };


    /* =========================
       STORIES
    ========================= */

    const stories = [

        {
            id: "you",
            name: "You",
            letter: true
        },

        {
            id: "lina",
            name: "Lina",
            src: img.lina
        },

        {
            id: "noah",
            name: "Noah",
            src: img.noah
        },

        {
            id: "sara",
            name: "Sara",
            src: img.sara
        },

        {
            id: "wheel",
            name: "Wheel",
            wheel: true
        },

        {
            id: "apple",
            name: "Apple",
            letter: "",
            verified: true
        },

        {
            id: "ferrari",
            name: "Ferrari",
            letter: "🐎",
            verified: true
        },

        {
            id: "bmw",
            name: "BMW",
            letter: "M",
            verified: true
        }

    ];


    /* =========================
       DEMO POSTS
    ========================= */

    const defaultPosts = [

        {
            id: 1,

            name: "Lina",

            handle: "@lina.ae",

            time: "12m",

            letter: "L",

            verified: true,

            text:
                "Sunset always hits different 💜",

            image:
                img.sunset,

            likes: 2400,

            comments: 186,

            reposts: 312,

            views: 48000

        },


        {
            id: 2,

            name: "Apple",

            handle: "@apple",

            time: "28m",

            letter: "",

            verified: true,

            text:
                "Apple Intelligence expands to more languages later this year.",

            image:
                img.apple,

            likes: 28400,

            comments: 1800,

            reposts: 3900,

            views: 2400000

        },


        {
            id: 3,

            name: "Noah",

            handle: "@noah.vibes",

            time: "45m",

            letter: "N",

            verified: true,

            text:
                "Focused on the journey. #focus #life",

            image:
                img.noah,

            likes: 8200,

            comments: 421,

            reposts: 780,

            views: 120000

        }

    ];


    let posts =
        JSON.parse(
            localStorage.getItem(POSTS_KEY) || "null"
        ) || defaultPosts;


    /* =========================
       UTILS
    ========================= */

    function esc(value) {

        return String(
            value ?? ""
        ).replace(
            /[&<>"']/g,
            (char) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char])
        );

    }


    function count(number) {

        if (number >= 1000000) {

            return (
                number / 1000000
            ).toFixed(
                number % 1000000
                    ? 1
                    : 0
            ) + "M";

        }


        if (number >= 1000) {

            return (
                number / 1000
            ).toFixed(
                number % 1000
                    ? 1
                    : 0
            ) + "K";

        }


        return String(number);

    }


    function showToast(message) {

        const element =
            $("toast");


        if (!element) return;


        element.textContent =
            message;


        element.classList.add(
            "show"
        );


        clearTimeout(
            window.__arsToast
        );


        window.__arsToast =
            setTimeout(() => {

                element.classList.remove(
                    "show"
                );

            }, 2200);

    }


    function savePosts() {

        localStorage.setItem(
            POSTS_KEY,
            JSON.stringify(posts)
        );

    }


    /* =========================
       STORIES
    ========================= */

    function renderStories() {

        const container =
            $("stories");


        if (!container) return;


        container.innerHTML =
            stories.map(
                (story) => {

                    let content;


                    if (story.src) {

                        content =
                            `<img
                                src="${story.src}"
                                alt=""
                            >`;

                    }

                    else if (story.wheel) {

                        content =
                            `<span class="story-letter">
                                ✦
                            </span>`;

                    }

                    else if (story.letter) {

                        content =
                            `<span class="story-letter">
                                ${esc(story.letter)}
                            </span>`;

                    }

                    else {

                        content =
                            `<span class="story-letter">
                                A
                            </span>`;

                    }


                    return `
                        <div
                            class="story ${
                                story.id === "you"
                                    ? "you"
                                    : ""
                            }"
                            data-story="${story.id}"
                        >

                            <div class="story-ring">

                                ${content}

                            </div>

                            <span class="story-name">
                                ${esc(story.name)}
                            </span>

                        </div>
                    `;

                }
            ).join("");

    }


    /* =========================
       AVATAR
    ========================= */

    function avatar(post) {

        if (
            post.name === "Lina"
        ) {

            return `
                <img
                    class="post-avatar"
                    src="${img.lina}"
                    alt=""
                >
            `;

        }


        return `
            <div
                class="post-avatar post-letter"
            >
                ${esc(
                    post.letter ||
                    post.name[0]
                )}
            </div>
        `;

    }


    /* =========================
       POSTS
    ========================= */

    function renderPosts() {

        const feed =
            $("feed");


        if (!feed) return;


        feed.innerHTML =
            posts.map(
                (post) => `

                <article
                    class="post-card"
                    data-post-id="${post.id}"
                >

                    <div class="post-head">

                        ${avatar(post)}

                        <div class="post-info">

                            <div class="post-name">

                                ${esc(post.name)}

                                ${
                                    post.verified
                                        ? `<span class="verified">✓</span>`
                                        : ""
                                }

                            </div>

                            <div class="post-meta">

                                ${esc(post.handle)}
                                ·
                                ${esc(post.time)}

                            </div>

                        </div>


                        <button
                            class="more"
                            data-more="${post.id}"
                            aria-label="More"
                        >
                            •••
                        </button>

                    </div>


                    <div class="post-text">

                        ${esc(post.text).replace(
                            /(#\w+)/g,
                            '<span class="tag">$1</span>'
                        )}

                    </div>


                    ${
                        post.image
                            ? `
                                <img
                                    class="post-image"
                                    src="${post.image}"
                                    alt=""
                                    loading="lazy"
                                >
                            `
                            : ""
                    }


                    <div class="post-actions">

                        <button
                            class="post-action like ${
                                post.liked
                                    ? "active"
                                    : ""
                            }"
                            data-action="like"
                            data-id="${post.id}"
                        >

                            <span class="ico">
                                ♥
                            </span>

                            <span>
                                ${count(post.likes)}
                            </span>

                        </button>


                        <button
                            class="post-action"
                            data-action="comment"
                            data-id="${post.id}"
                        >

                            <span class="ico">
                                ♡
                            </span>

                            <span>
                                ${count(post.comments)}
                            </span>

                        </button>


                        <button
                            class="post-action ${
                                post.reposted
                                    ? "reposted"
                                    : ""
                            }"
                            data-action="repost"
                            data-id="${post.id}"
                        >

                            <span class="ico">
                                ⇄
                            </span>

                            <span>
                                ${count(post.reposts)}
                            </span>

                        </button>


                        <span
                            class="post-action views"
                        >

                            <span class="ico">
                                ◉
                            </span>

                            <span>
                                ${count(post.views)}
                            </span>

                        </span>

                    </div>

                </article>

            `
            ).join("");

    }


    /* =========================
       PAGE NAVIGATION
    ========================= */

    function openPage(pageId) {

        document
            .querySelectorAll(".page")
            .forEach(
                (page) => {

                    page.classList.remove(
                        "active"
                    );

                }
            );


        const page =
            $(pageId);


        if (!page) return;


        page.classList.add(
            "active"
        );


        document
            .querySelectorAll(".nav-item")
            .forEach(
                (item) => {

                    item.classList.toggle(
                        "active",
                        item.dataset.page === pageId
                    );

                }
            );


        const plus =
            $("createPost");


        if (plus) {

            plus.style.display =
                pageId === "homePage"
                    ? "block"
                    : "none";

        }


        if (
            pageId === "searchPage"
        ) {

            renderSearchHome();

        }

    }


    /* =========================
       SEARCH
    ========================= */

    function renderSearchHome() {

        const home =
            $("searchHome");


        if (!home) return;


        home.innerHTML = `

            <div class="search-title">
                Trending hashtags
            </div>


            <div class="chips">

                ${
                    [
                        "#ARS",
                        "#SaudiArabia",
                        "#Tech",
                        "#AI",
                        "#Lifestyle",
                        "#Football"
                    ]
                    .map(
                        (tag) => `
                            <button
                                class="chip"
                                data-query="${tag}"
                            >
                                ${tag}
                            </button>
                        `
                    )
                    .join("")
                }

            </div>


            <div class="search-title">
                Suggested people
            </div>


            <div class="search-person">

                <img
                    src="${img.lina}"
                    alt=""
                >

                <div>

                    <b>
                        Lina
                    </b>

                    <div class="post-meta">
                        @lina.ae · 1.2M followers
                    </div>

                </div>

            </div>


            <div class="search-person">

                <div class="avatar">
                    A
                </div>

                <div>

                    <b>
                        Apple ✓
                    </b>

                    <div class="post-meta">
                        @apple · 98M followers
                    </div>

                </div>

            </div>


            <div class="search-person">

                <div class="avatar">
                    N
                </div>

                <div>

                    <b>
                        Noah
                    </b>

                    <div class="post-meta">
                        @noah.vibes · 84K followers
                    </div>

                </div>

            </div>


            <div class="search-title">
                Trending topics
            </div>


            <div class="topic">

                <b>
                    ARS
                </b>

                <span>
                    128K posts
                </span>

            </div>


            <div class="topic">

                <b>
                    AI & Future
                </b>

                <span>
                    86K posts
                </span>

            </div>


            <div class="topic">

                <b>
                    Weekend
                </b>

                <span>
                    54K posts
                </span>

            </div>

        `;

    }


    function runSearch(query) {

        query =
            query
                .trim()
                .toLowerCase();


        const results =
            $("searchResults");


        const home =
            $("searchHome");


        if (!results || !home) return;


        if (!query) {

            home.style.display =
                "block";

            results.innerHTML =
                "";

            return;

        }


        home.style.display =
            "none";


        const people = [

            [
                "Lina",
                "@lina.ae",
                img.lina
            ],

            [
                "Noah",
                "@noah.vibes",
                ""
            ],

            [
                "Apple",
                "@apple",
                ""
            ]

        ];


        const foundPeople =
            people.filter(
                (person) =>

                    (
                        person[0] +
                        " " +
                        person[1]
                    )
                    .toLowerCase()
                    .includes(query)
            );


        const foundPosts =
            posts.filter(
                (post) =>

                    (
                        post.text +
                        " " +
                        post.name +
                        " " +
                        post.handle
                    )
                    .toLowerCase()
                    .includes(query)
            );


        let html = `

            <div class="search-title">
                Results
            </div>

        `;


        if (foundPeople.length) {

            html +=
                foundPeople
                    .map(
                        (person) => `

                            <div class="search-person">

                                ${
                                    person[2]
                                        ? `
                                            <img
                                                src="${person[2]}"
                                                alt=""
                                            >
                                        `
                                        : `
                                            <div class="avatar">
                                                ${person[0][0]}
                                            </div>
                                        `
                                }

                                <div>

                                    <b>
                                        ${esc(person[0])}
                                    </b>

                                    <div class="post-meta">
                                        ${esc(person[1])}
                             
