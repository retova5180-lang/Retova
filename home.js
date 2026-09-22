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
                             
                                    </div>

                                </div>

                            </div>

                        `
                    )
                    .join("");

            }

        }


        if (foundPosts.length) {

            html += `
                <div class="search-title">
                    Posts
                </div>
            `;

            html += foundPosts
                .map(
                    (post) => `

                        <div
                            class="search-post"
                            data-search-post="${post.id}"
                        >

                            <div class="search-post-top">

                                <div class="avatar">
                                    ${esc(
                                        post.letter ||
                                        post.name[0]
                                    )}
                                </div>

                                <div>

                                    <b>
                                        ${esc(post.name)}
                                    </b>

                                    <div class="post-meta">
                                        ${esc(post.handle)}
                                        ·
                                        ${esc(post.time)}
                                    </div>

                                </div>

                            </div>

                            <p>
                                ${esc(post.text)}
                            </p>

                        </div>

                    `
                )
                .join("");

        }


        if (
            !foundPeople.length &&
            !foundPosts.length
        ) {

            html += `
                <div class="empty-search">
                    <div class="empty-icon">
                        ⌕
                    </div>

                    <h3>
                        No results
                    </h3>

                    <p>
                        Try another search.
                    </p>
                </div>
            `;

        }


        results.innerHTML = html;

    }


    /* =========================
       WHEEL
    ========================= */

    const wheelItems = [

        {
            type: "CHALLENGE",
            text: "Post something that makes you smile today.",
            reward: "+50 XP"
        },

        {
            type: "REWARD",
            text: "You earned a surprise ARS reward.",
            reward: "+100 XP"
        },

        {
            type: "QUESTION",
            text: "What is one goal you want to achieve this week?",
            reward: "+25 XP"
        },

        {
            type: "BONUS",
            text: "Bonus spin reward unlocked.",
            reward: "+1 Bonus"
        },

        {
            type: "REWARD",
            text: "You discovered a hidden reward.",
            reward: "+75 XP"
        },

        {
            type: "CHALLENGE",
            text: "Like and comment on a post you genuinely enjoy.",
            reward: "+40 XP"
        },

        {
            type: "QUESTION",
            text: "What is something new you learned recently?",
            reward: "+30 XP"
        },

        {
            type: "BONUS",
            text: "Lucky bonus! Extra XP added.",
            reward: "+150 XP"
        }

    ];


    function getWeekKey() {

        const now =
            new Date();

        const start =
            new Date(
                now.getFullYear(),
                0,
                1
            );

        const diff =
            Math.floor(
                (
                    now - start
                ) /
                86400000
            );

        const week =
            Math.ceil(
                (
                    diff +
                    start.getDay() +
                    1
                ) /
                7
            );

        return (
            now.getFullYear() +
            "-" +
            week
        );

    }


    function getWheelSpins() {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    WHEEL_KEY
                ) || "null"
            );

        if (
            !saved ||
            saved.week !== getWeekKey()
        ) {

            return {
                week: getWeekKey(),
                used: 0
            };

        }

        return saved;

    }


    function saveWheelSpins(data) {

        localStorage.setItem(
            WHEEL_KEY,
            JSON.stringify(data)
        );

    }


    function updateWheelUI() {

        const counter =
            $("spinCounter");

        const planLabel =
            $("planLabel");

        const button =
            $("spinButton");

        if (!counter) return;


        const data =
            getWheelSpins();


        if (
            plan === "premium"
        ) {

            counter.textContent =
                "∞";

            if (planLabel) {
                planLabel.textContent =
                    "Premium";
            }

            if (button) {
                button.disabled =
                    false;
            }

        }

        else {

            const remaining =
                Math.max(
                    0,
                    2 - data.used
                );

            counter.textContent =
                String(remaining);

            if (planLabel) {
                planLabel.textContent =
                    "Free";
            }

            if (button) {
                button.disabled =
                    remaining <= 0;
            }

        }

    }


    function spinWheel() {

        const wheel =
            $("wheel");

        const result =
            $("challengeResult");

        if (!wheel || !result)
            return;


        const data =
            getWheelSpins();


        if (
            plan !== "premium" &&
            data.used >= 2
        ) {

            result.innerHTML = `
                <strong>
                    No free spins left
                </strong>

                <span>
                    Free members get 2 wheel tries every week.
                    Upgrade to Premium for unlimited spins.
                </span>
            `;

            return;

        }


        if (
            plan !== "premium"
        ) {

            data.used++;

            saveWheelSpins(data);

        }


        const index =
            Math.floor(
                Math.random() *
                wheelItems.length
            );


        const selected =
            wheelItems[index];


        wheelRotation +=
            1440 +
            Math.floor(
                Math.random() *
                360
            ) +
            (
                index *
                45
            );


        wheel.style.transform =
            `rotate(${wheelRotation}deg)`;


        result.innerHTML = `
            <div class="result-type">
                ${esc(selected.type)}
            </div>

            <strong>
                ${esc(selected.text)}
            </strong>

            <span>
                ${esc(selected.reward)}
            </span>
        `;


        updateWheelUI();

    }


    /* =========================
       STREAK
    ========================= */

    function getStreakState() {

        return JSON.parse(
            localStorage.getItem(
                STREAK_KEY
            ) || "null"
        ) || {
            count: 0,
            lastDay: "",
            doneToday: false
        };

    }


    function dayKey(date = new Date()) {

        return [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2, "0"),
            String(
                date.getDate()
            ).padStart(2, "0")
        ].join("-");

    }


    function updateStreakUI() {

        const fire =
            $("streakFire");

        const number =
            $("streakNumber");

        const text =
            $("streakText");

        const button =
            $("streakDone");

        if (!fire) return;


        const state =
            getStreakState();

        const today =
            dayKey();


        const active =
            state.lastDay === today &&
            state.doneToday;


        fire.classList.toggle(
            "active",
            active
        );

        fire.classList.toggle(
            "inactive",
            !active
        );


        if (number) {

            number.textContent =
                String(
                    state.count || 0
                );

        }


        if (text) {

            text.textContent =
                active
                    ? "Your streak is active today 🔥 Keep going tomorrow."
                    : "Complete today's interaction to keep your streak active.";

        }


        if (button) {

            button.textContent =
                active
                    ? "Completed today ✓"
                    : "Complete today";

            button.disabled =
                active;

        }


        renderWeekDots();

    }


    function renderWeekDots() {

        const container =
            $("weekDots");

        if (!container) return;


        const state =
            getStreakState();


        const today =
            new Date();


        const html = [];


        for (
            let i = 6;
            i >= 0;
            i--
        ) {

            const date =
                new Date(today);

            date.setDate(
                today.getDate() - i
            );


            const key =
                dayKey(date);


            const active =
                key === state.lastDay &&
                state.doneToday;


            html.push(`
                <span
                    class="week-dot ${
                        active
                            ? "active"
                            : ""
                    }"
                ></span>
            `);

        }


        container.innerHTML =
            html.join("");

    }


    function completeStreak() {

        const state =
            getStreakState();

        const today =
            dayKey();


        if (
            state.lastDay === today &&
            state.doneToday
        ) {

            return;

        }


        const yesterday =
            new Date();

        yesterday.setDate(
            yesterday.getDate() - 1
        );


        const yesterdayKey =
            dayKey(yesterday);


        if (
            state.lastDay === yesterdayKey
        ) {

            state.count =
                (state.count || 0) + 1;

        }

        else {

            state.count = 1;

        }


        state.lastDay =
            today;

        state.doneToday =
            true;


        localStorage.setItem(
            STREAK_KEY,
            JSON.stringify(state)
        );


        updateStreakUI();

        showToast(
            "🔥 Streak updated!"
        );

    }


    /* =========================
       POST ACTIONS
    ========================= */

    function findPost(id) {

        return posts.find(
            (post) =>
                String(post.id) ===
                String(id)
        );

    }


    function handlePostAction(
        action,
        id
    ) {

        const post =
            findPost(id);

        if (!post) return;


        if (action === "like") {

            post.liked =
                !post.liked;

            post.likes +=
                post.liked
                    ? 1
                    : -1;

            showToast(
                post.liked
                    ? "Liked ❤️"
                    : "Like removed"
            );

        }


        else if (
            action === "comment"
        ) {

            showToast(
                "Comments are coming soon."
            );

        }


        else if (
            action === "repost"
        ) {

            post.reposted =
                !post.reposted;

            post.reposts +=
                post.reposted
                    ? 1
                    : -1;

            showToast(
                post.reposted
                    ? "Reposted 🔄"
                    : "Repost removed"
            );

        }


        savePosts();

        renderPosts();

    }


    /* =========================
       THREE DOT MENU
    ========================= */

    function closePostMenu() {

        document
            .querySelectorAll(
                ".post-menu"
            )
            .forEach(
                (menu) => {
                    menu.remove();
                }
            );

        const backdrop =
            $("postMenuBackdrop");

        if (backdrop) {

            backdrop.classList.remove(
                "show"
            );

        }

    }


    function openPostMenu(
        button,
        postId
    ) {

        closePostMenu();


        const menu =
            document.createElement(
                "div"
            );

        menu.className =
            "post-menu";


        menu.innerHTML = `

            <button data-menu-action="repost">
                <span>↻</span>
                Repost
            </button>

            <button data-menu-action="bookmark">
                <span>🔖</span>
                Bookmark
            </button>

            <button data-menu-action="share">
                <span>↗</span>
                Share
            </button>

            <button data-menu-action="copy">
                <span>⧉</span>
                Copy Link
            </button>

            <button data-menu-action="report">
                <span>⚑</span>
                Report
            </button>

            <button
                data-menu-action="hide"
                class="danger"
            >
                <span>⌫</span>
                Hide Post
            </button>

        `;


        document.body.appendChild(
            menu
        );


        const rect =
            button.getBoundingClientRect();


        menu.style.position =
            "fixed";

        menu.style.top =
            (
                rect.bottom +
                8
            ) + "px";

        menu.style.right =
            Math.max(
                12,
                window.innerWidth -
                rect.right
            ) + "px";


        requestAnimationFrame(
            () => {
                menu.classList.add(
                    "show"
                );
            }
        );


        menu.addEventListener(
            "click",
            async (event) => {

                const item =
                    event.target.closest(
                        "[data-menu-action]"
                    );

                if (!item) return;


                const action =
                    item.dataset.menuAction;


                closePostMenu();


                if (
                    action === "repost"
                ) {

                    handlePostAction(
                        "repost",
                        postId
                    );

                }


                else if (
                    action === "bookmark"
                ) {

                    const key =
                        `ars_bookmark_${postId}`;

                    const saved =
                        localStorage.getItem(
                            key
                        ) === "true";

                    localStorage.setItem(
                        key,
                        String(!saved)
                    );

                    showToast(
                        !saved
                            ? "Saved 🔖"
                            : "Removed from bookmarks"
                    );

                }


                else if (
                    action === "share"
                ) {

                    if (
                        navigator.share
                    ) {

                        try {

                            await navigator.share({
                                title: "ARS",
                                text: post.text,
                                url: window.location.href
                            });

                        }

                        catch (error) {}

                    }

                    else {

                        showToast(
                            "Share link copied"
                        );

                    }

                }


                else if (
                    action === "copy"
                ) {

                    try {

                        await navigator.clipboard.writeText(
                            window.location.href
                        );

                        showToast(
                            "Link copied"
                        );

                    }

                    catch (error) {

                        showToast(
                            "Copy is not available"
                        );

                    }

                }


                else if (
                    action === "report"
                ) {

                    showToast(
                        "Post reported"
                    );

                }


                else if (
                    action === "hide"
                ) {

                    posts =
                        posts.filter(
                            (post) =>
                                String(post.id) !==
                                String(postId)
                        );

                    savePosts();

                    renderPosts();

                    showToast(
                        "Post hidden"
                    );

                }

            }
        );

    }


    /* =========================
       PROFILE
    ========================= */

    function renderProfile() {

        const name =
            currentUser?.display_name ||
            currentUser?.user_metadata?.display_name ||
            currentUser?.username ||
            "ARS User";


        const username =
            currentUser?.username ||
            currentUser?.user_metadata?.username ||
            "user";


        const letter =
            String(name)
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "A";


        const topLetter =
            $("topAvatarLetter");

        const profileAvatar =
            $("profileAvatar");

        const profileName =
            $("profileName");

        const profileHandle =
            $("profileHandle");


        if (topLetter)
            topLetter.textContent =
                letter;

        if (profileAvatar)
            profileAvatar.textContent =
                letter;

        if (profileName)
            profileName.textContent =
                name;

        if (profileHandle)
            profileHandle.textContent =
                "@" + username;

    }


    /* =========================
       CREATE POST
    ========================= */

    function createPost() {

        showToast(
            "Create Post is ready for the next step."
        );

    }


    /* =========================
       AUTH
    ========================= */

    async function checkAuth() {

        if (!supabaseClient) {

            renderStories();
            renderPosts();
            renderProfile();
            updateWheelUI();
            updateStreakUI();
            return;

        }


        try {

            const {
                data
            } =
                await supabaseClient.auth.getSession();


            if (
                !data?.session
            ) {

    
