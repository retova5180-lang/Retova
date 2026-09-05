/* =========================================================
   ΛRS — HOME
   Stories + Posts + Comments + Repost + Wheel
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const storiesContainer =
        document.getElementById("stories");

    const feedContainer =
        document.getElementById("feed");

    const myAvatar =
        document.getElementById("myAvatar");

    const settingsButton =
        document.getElementById("settings");

    const viewAllStories =
        document.getElementById("viewAllStories");

    const newPostButton =
        document.getElementById("newPost");

    const storyViewer =
        document.getElementById("storyViewer");

    const storyViewerAvatar =
        document.getElementById("storyViewerAvatar");

    const storyViewerName =
        document.getElementById("storyViewerName");

    const storyViewerImage =
        document.getElementById("storyViewerImage");

    const storyViewerText =
        document.getElementById("storyViewerText");

    const closeStoryButton =
        document.getElementById("closeStory");

    const commentsSheet =
        document.getElementById("commentsSheet");

    const commentsList =
        document.getElementById("commentsList");

    const commentsOverlay =
        document.querySelector(".comments-overlay");

    const closeCommentsButton =
        document.getElementById("closeComments");

    const commentInput =
        document.getElementById("commentInput");

    const sendCommentButton =
        document.getElementById("sendComment");

    const myCommentAvatar =
        document.getElementById("myCommentAvatar");


    /* =====================================================
       USER
    ===================================================== */

    function getUser() {

        try {

            return JSON.parse(
                localStorage.getItem("ars_user")
                || "null"
            );

        } catch {

            return null;
        }
    }


    function getLetter() {

        const saved =
            localStorage.getItem(
                "ars_letter"
            );

        if (saved) {
            return saved.charAt(0).toUpperCase();
        }


        const user =
            getUser();


        if (
            user &&
            user.displayName
        ) {

            return user.displayName
                .charAt(0)
                .toUpperCase();
        }


        return "R";
    }


    function getLetterColor() {

        return (
            localStorage.getItem(
                "ars_letter_color"
            )
            ||
            "#FFFFFF"
        );
    }


    function getBackground() {

        return (
            localStorage.getItem(
                "ars_background"
            )
            ||
            "linear-gradient(135deg,#8B3DFF,#C54DFF)"
        );
    }


    function getAvatarImage() {

        const image =
            localStorage.getItem(
                "ars_avatar"
            );

        const expires =
            Number(
                localStorage.getItem(
                    "ars_avatar_expires"
                ) || 0
            );


        if (!image) {
            return null;
        }


        if (
            expires &&
            Date.now() >
                expires
        ) {

            localStorage.removeItem(
                "ars_avatar"
            );

            localStorage.removeItem(
                "ars_avatar_expires"
            );

            return null;
        }


        return image;
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatNumber(number) {

        number =
            Number(number) || 0;


        if (
            number >= 1000000
        ) {

            return (
                (number / 1000000)
                    .toFixed(
                        number >= 10000000
                            ? 0
                            : 1
                    )
                    .replace(".0", "")
                + "M"
            );
        }


        if (
            number >= 1000
        ) {

            return (
                (number / 1000)
                    .toFixed(
                        number >= 10000
                            ? 0
                            : 1
                    )
                    .replace(".0", "")
                + "K"
            );
        }


        return String(number);
    }


    function icons() {

        if (
            window.lucide
        ) {

            lucide.createIcons();
        }
    }


    /* =====================================================
       STORIES
    ===================================================== */

    const stories = [

        {
            id: 1,

            name: "Lina",

            letter: "L",

            gradient:
                "linear-gradient(135deg,#8B3DFF,#C54DFF)",

            image:
                "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",

            text:
                "A little moment from today ✨"
        },


        {
            id: 2,

            name: "Noah",

            letter: "N",

            gradient:
                "linear-gradient(135deg,#2563EB,#06B6D4)",

            image:
                "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85",

            text:
                "Weekend vibes."
        },


        {
            id: 3,

            name: "Sara",

            letter: "S",

            gradient:
                "linear-gradient(135deg,#F97316,#EC4899)",

            image:
                "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",

            text:
                "New look today 💗"
        },


        {
            id: 4,

            name: "Maya",

            letter: "M",

            gradient:
                "linear-gradient(135deg,#10B981,#14B8A6)",

            image:
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",

            text:
                "Good day 🌿"
        },


        {
            id: 5,

            name: "Alex",

            letter: "A",

            gradient:
                "linear-gradient(135deg,#F43F5E,#8B5CF6)",

            image:
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85",

            text:
                "Just another day."
        }

    ];


    /* =====================================================
       POSTS
    ===================================================== */

    const posts = [

        {
            id: 1,

            name: "Apple",

            username: "apple",

            verified: true,

            vip: false,

            letter: "A",

            gradient: [
                "#777777",
                "#FFFFFF"
            ],

            avatar:
                "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=500&q=85",

            time: "12m",

            text:
                "A little look at what's happening today. ✨",

            image:
                "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=85",

            likes: 28400,

            comments: 1843,

            reposts: 3902,

            views: 2400000

        },


        {
            id: 2,

            name: "Lina",

            username: "lina",

            verified: false,

            vip: true,

            letter: "L",

            gradient: [
                "#8B3DFF",
                "#C54DFF"
            ],

            time: "28m",

            text:
                "Finally finished my new workspace setup. 💜",

            image:
                "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85",

            likes: 4211,

            comments: 291,

            reposts: 88,

            views: 119000

        },


        {
            id: 3,

            name: "Noah",

            username: "noah",

            verified: false,

            vip: false,

            letter: "N",

            gradient: [
                "#2563EB",
                "#06B6D4"
            ],

            time: "43m",

            text:
                "Sometimes you just need a quiet place and a good view.",

            image:
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",

            likes: 1831,

            comments: 94,

            reposts: 27,

            views: 45200

        },


        {
            id: 4,

            name: "NASA",

            username: "nasa",

            verified: true,

            vip: false,

            letter: "N",

            gradient: [
                "#2563EB",
                "#7C3AED"
            ],

            avatar:
                "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=500&q=85",

            time: "1h",

            text:
                "Another breathtaking view of Earth from orbit. 🌍",

            image:
                "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=85",

            likes: 61000,

            comments: 3410,

            reposts: 8200,

            views: 4700000

        },


        {
            id: 5,

            name: "Formula 1",

            username: "f1",

            verified: true,

            vip: false,

            letter: "F",

            gradient: [
                "#EF4444",
                "#111111"
            ],

            avatar:
                "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=500&q=85",

            time: "2h",

            text:
                "Lights out. Who is taking pole position? 🏁",

            image:
                "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=85",

            likes: 132000,

            comments: 8511,

            reposts: 19200,

            views: 9600000

        }

    ];


    /* =====================================================
       STATE
    ===================================================== */

    const liked =
        new Set();

    const reposted =
        new Set();

    const saved =
        new Set();

    const comments =
        {};

    let currentStory =
        0;

    let currentCommentPost =
        null;


    /* =====================================================
       MY AVATAR
    ===================================================== */

    function renderMyAvatar() {

        const image =
            getAvatarImage();


        if (!myAvatar) {
            return;
        }


        if (image) {

            myAvatar.innerHTML = `
                <img
                    src="${escapeHTML(image)}"
                    alt="Profile"
                >
            `;

            myAvatar.style.background =
                "transparent";

        } else {

            myAvatar.innerHTML =
                escapeHTML(
                    getLetter()
                );

            myAvatar.style.background =
                getBackground();

            myAvatar.style.color =
                getLetterColor();
        }


        if (myCommentAvatar) {

            myCommentAvatar.textContent =
                getLetter();

            myCommentAvatar.style.background =
                getBackground();

            myCommentAvatar.style.color =
                getLetterColor();
        }
    }


    /* =====================================================
       STORIES RENDER
    ===================================================== */

    function renderStories() {

        if (!storiesContainer) {
            return;
        }


        storiesContainer.innerHTML =
            "";


        stories.forEach(
            (story, index) => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "story";


                button.innerHTML = `

                    <div
                        class="story-avatar"
                        style="background:${story.gradient}"
                    >

                        <img
                            src="${escapeHTML(story.image)}"
                            alt="${escapeHTML(story.name)}"
                            loading="lazy"
                        >

                    </div>

                    <div class="story-name">
                        ${escapeHTML(story.name)}
                    </div>

                `;


                button.addEventListener(
                    "click",
                    () => {
                        openStory(index);
                    }
                );


                storiesContainer.appendChild(
                    button
                );

            }
        );


        icons();
    }


    /* =====================================================
       STORY VIEWER
    ===================================================== */

    function openStory(index) {

        const story =
            stories[index];


        if (!story) {
            return;
        }


        currentStory =
            index;


        storyViewerAvatar.textContent =
            story.letter;


        storyViewerAvatar.style.background =
            story.gradient;


        storyViewerName.textContent =
            story.name;


        storyViewerImage.innerHTML = `
            <img
                src="${escapeHTML(story.image)}"
                alt="${escapeHTML(story.name)}"
            >
        `;


        storyViewerText.textContent =
            story.text;


        storyViewer.classList.add(
            "open"
        );


        document.body.style.overflow =
            "hidden";
    }


    function closeStory() {

        storyViewer.classList.remove(
            "open"
        );


        document.body.style.overflow =
            "";
    }


    function nextStory() {

        currentStory =
            (
                currentStory + 1
            ) %
            stories.length;


        openStory(
            currentStory
        );
    }


    /* =====================================================
       POST AVATAR
    ===================================================== */

    function postAvatar(post) {

        if (post.avatar) {

            return `
                <div class="post-avatar">
                    <img
                        src="${escapeHTML(post.avatar)}"
                        alt="${escapeHTML(post.name)}"
                        loading="lazy"
                    >
                </div>
            `;
        }


        return `
            <div
                class="post-avatar"
                style="
                    background:
                    linear-gradient(
                        135deg,
                        ${post.gradient[0]},
                        ${post.gradient[1]}
                    );
                "
            >
                ${escapeHTML(post.letter)}
            </div>
        `;
    }


    /* =====================================================
       POST BADGES
    ===================================================== */

    function postBadges(post) {

        let html = "";


        if (post.verified) {

            html += `
                <span class="verify">
                    <i data-lucide="badge-check"></i>
                </span>
            `;
        }


        if (post.vip) {

            html += `
                <span class="vip">
                    VIP
                </span>
            `;
        }


        return html;
    }


    /* =====================================================
       RENDER POSTS
    ===================================================== */

    function renderPosts() {

        if (!feedContainer) {
            return;
        }


        feedContainer.innerHTML =
            "";


        posts.forEach(
            post => {

                const isLiked =
                    liked.has(post.id);

                const isReposted =
                    reposted.has(post.id);

                const isSaved =
                    saved.has(post.id);


                const article =
                    document.createElement(
                        "article"
                    );


                article.className =
                    "post";


                article.dataset.id =
                    post.id;


                article.innerHTML = `

                    <div class="post-header">

                        <div class="post-user">

                            ${postAvatar(post)}

                            <div class="post-info">

                                <div class="post-name">

                                    ${escapeHTML(post.name)}

                                    ${postBadges(post)}

                                </div>

                                <div class="post-username">

                                    @${escapeHTML(post.username)}

                                </div>

                                <div class="post-time">

                                    ${escapeHTML(post.time)}

                                </div>

                            </div>

                        </div>


                        <button
                            class="post-more"
                            type="button"
                        >
                            <i data-lucide="more-horizontal"></i>
                        </button>

                    </div>


                    <div class="post-content">

                        ${escapeHTML(post.text)}

                    </div>


                    <div class="post-image">

                        <img
                            src="${escapeHTML(post.image)}"
                            alt="${escapeHTML(post.name)} post"
                            loading="lazy"
                            onerror="
                                this.parentElement.innerHTML =
                                '<div class=&quot;post-media-placeholder&quot;>Image unavailable</div>';
                            "
                        >

                    </div>


                    <div class="post-actions">

                        <div class="post-left-actions">

                            <button
                                class="
                                    action
                                    action-like
                                    ${isLiked ? "liked" : ""}
                                "
                                type="button"
                                aria-pressed="${isLiked}"
                            >

                                <i data-lucide="heart"></i>

                                <span class="count">
                                    ${formatNumber(post.likes)}
                                </span>

                            </button>


          
