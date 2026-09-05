/* =========================================================
   ΛRS — HOME
   Posts + Stories + Actions + Wheel integration
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

    const commentsSheet =
        document.getElementById("commentsSheet");

    const commentsList =
        document.getElementById("commentsList");

    const newPostButton =
        document.getElementById("newPost");

    const myAvatar =
        document.getElementById("myAvatar");

    const settingsButton =
        document.getElementById("settings");

    const viewAllStories =
        document.getElementById("viewAllStories");

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

    const closeCommentsButton =
        document.getElementById("closeComments");

    const commentsOverlay =
        document.querySelector(".comments-overlay");

    const commentInput =
        document.getElementById("commentInput");

    const sendCommentButton =
        document.getElementById("sendComment");

    const myCommentAvatar =
        document.getElementById("myCommentAvatar");


    /* =====================================================
       DEMO DATA
    ===================================================== */

    const stories = [

        {
            id: 1,
            name: "Lina",
            username: "lina",
            letter: "L",
            gradient:
                "linear-gradient(135deg,#8B3DFF,#C54DFF)",
            image:
                "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=85",
            text:
                "A little moment from today ✨"
        },

        {
            id: 2,
            name: "Noah",
            username: "noah",
            letter: "N",
            gradient:
                "linear-gradient(135deg,#2563EB,#06B6D4)",
            image:
                "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=85",
            text:
                "Weekend vibes."
        },

        {
            id: 3,
            name: "Sara",
            username: "sara",
            letter: "S",
            gradient:
                "linear-gradient(135deg,#F97316,#EC4899)",
            image:
                "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=85",
            text:
                "New look today 💗"
        },

        {
            id: 4,
            name: "Maya",
            username: "maya",
            letter: "M",
            gradient:
                "linear-gradient(135deg,#10B981,#14B8A6)",
            image:
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=85",
            text:
                "Good day 🌿"
        },

        {
            id: 5,
            name: "Alex",
            username: "alex",
            letter: "A",
            gradient:
                "linear-gradient(135deg,#F43F5E,#8B5CF6)",
            image:
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=85",
            text:
                "Just another day."
        }

    ];


    const posts = [

        {
            id: 1,

            accountType: "official",

            name: "Apple",
            username: "apple",

            avatar:
                "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",

            verified: true,
            vip: false,

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

            accountType: "free",

            name: "Lina",
            username: "lina",

            letter: "L",

            gradient:
                ["#8B3DFF","#C54DFF"],

            verified: false,
            vip: true,

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

            accountType: "free",

            name: "Noah",
            username: "noah",

            letter: "N",

            gradient:
                ["#2563EB","#06B6D4"],

            verified: false,
            vip: false,

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

            accountType: "official",

            name: "NASA",
            username: "nasa",

            avatar:
                "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=500&q=85",

            verified: true,
            vip: false,

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

            accountType: "official",

            name: "Formula 1",
            username: "f1",

            avatar:
                "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=500&q=85",

            verified: true,
            vip: false,

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

    const state = {

        liked:
            new Set(),

        reposted:
            new Set(),

        saved:
            new Set(),

        comments: {},

        currentStory: 0,

        currentCommentPost: null

    };


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


    function formatNumber(value) {

        const number =
            Number(value) || 0;

        if (number >= 1000000) {

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


        if (number >= 1000) {

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


    function refreshIcons() {

        if (
            typeof lucide !== "undefined"
        ) {

            lucide.createIcons();
        }
    }


    function getCurrentUser() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "ars_user"
                ) || "null"
            );

        } catch {

            return null;
        }
    }


    function getLetter() {

        return (
            localStorage.getItem(
                "ars_letter"
            )
            ||
            getCurrentUser()?.displayName
                ?.charAt(0)
            ||
            "R"
        )
        .charAt(0)
        .toUpperCase();
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
            Date.now() > expires
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
       MY AVATAR
    ===================================================== */

    function renderMyAvatar() {

        if (!myAvatar) {
            return;
        }

        const image =
            getAvatarImage();


        if (image) {

            myAvatar.innerHTML = `
                <img
                    src="${escapeHTML(image)}"
                    alt="Profile"
                >
            `;

            myAvatar.style.background =
                "transparent";

            myAvatar.style.overflow =
                "hidden";

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
       STORIES
    ===================================================== */

    function renderStories() {

        if (!storiesContainer) {
            return;
        }

        storiesContainer.innerHTML = "";


        stories.forEach(
            (story, index) => {

                const card =
                    document.createElement(
                        "button"
                    );

                card.type = "button";

                card.className =
                    "story";

                card.setAttribute(
                    "aria-label",
                    `Open ${story.name} story`
                );


                const avatar =
                    document.createElement(
                        "div"
                    );

                avatar.className =
                    "story-avatar";

                avatar.style.background =
                    story.gradient;


                if (story.image) {

                    avatar.innerHTML = `
                        <img
                            src="${escapeHTML(story.image)}"
                            alt="${escapeHTML(story.name)}"
                            loading="lazy"
                        >
                    `;

                } else {

                    avatar.textContent =
                        story.letter;
                }


                const name =
                    document.createElement(
                        "div"
                    );

                name.className =
                    "story-name";

                name.textContent =
                    story.name;


                card.appendChild(
                    avatar
                );

                card.appendChild(
                    name
                );


                card.addEventListener(
                    "click",
                    () => {
                        openStory(index);
                    }
                );


                storiesContainer.appendChild(
                    card
                );
            }
        );


        refreshIcons();
    }


    /* =====================================================
       STORY VIEWER
    ===================================================== */

    function openStory(index) {

        const story =
            stories[index];

        if (!story || !storyViewer) {
            return;
        }

        state.currentStory =
            index;


        if (storyViewerAvatar) {

            storyViewerAvatar.textContent =
                story.letter;

            storyViewerAvatar.style.background =
                story.gradient;
        }


        if (storyViewerName) {

            storyViewerName.textContent =
                story.name;
        }


        if (storyViewerText) {

            storyViewerText.textContent =
                story.text || "";
        }


        if (storyViewerImage) {

            if (story.image) {

                storyViewerImage.innerHTML = `
                    <img
                        src="${escapeHTML(story.image)}"
                        alt="${escapeHTML(story.name)}"
                    >
                `;

            } else {

                storyViewerImage.innerHTML = "";
            }
        }


        storyViewer.classList.add(
            "open"
        );

        document.body.style.overflow =
            "hidden";
    }


    function closeStory() {

        if (!storyViewer) {
            return;
        }

        storyViewer.classList.remove(
            "open"
        );

        document.body.style.overflow =
            "";
    }


    function nextStory() {

        if (!stories.length) {
            return;
        }

        const next =
            (
                state.currentStory + 1
            ) %
            stories.length;

        openStory(next);
    }


    /* =====================================================
       POST AVATAR
    ===================================================== */

    function getPostAvatar(post) {

        if (
            post.accountType ===
            "official"
            &&
            post.avatar
        ) {

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
                        ${post.gradient?.[0] || "#8B3DFF"},
                        ${post.gradient?.[1] || "#C54DFF"}
                    );
                "
            >
                ${escapeHTML(
                    post.letter || "R"
                )}
            </div>
        `;
    }


    /* =====================================================
       POST BADGES
    ===================================================== */

    function getPostBadges(post) {

        let badges = "";


        if (post.verified) {

            badges += `
                <span class="verify">
                    <i data-lucide="badge-check"></i>
                </span>
            `;
        }


        if (post.vip) {

            badges += `
                <span class="vip">
                    VIP
                </span>
            `;
        }


        return badges;
    }


    /* =====================================================
       POST MEDIA
    ===================================================== */

    function getPostMedia(post) {

        if (!post.image) {
            return "";
        }


        return `
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
        `;
    }


    /* =====================================================
       RENDER POSTS
    ===================================================== */

    function renderPosts() {

        if (!feedContainer) {
            return;
        }

        feedContainer.innerHTML = "";


        posts.forEach(
            post => {

                const article =
                    document.createElement(
                        "article"
                    );

                article.className =
                    "post";

                article.dataset.id =
                    post.id;


                const liked =
                    state.liked.has(
                        post.id
                    );

                const reposted =
                    state.reposted.has(
                        post.id
                    );

                const saved =
                    state.saved.has(
                        post.id
                    );


                article.innerHTML = `

                    <div class="post-header">

                        <div class="post-user">

                            ${getPostAvatar(post)}

                            <div class="post-info">

                                <div class="post-name">

                                    ${escapeHTML(
                                        post.name
                                    )}

                                    ${getPostBadges(post)}

                                </div>


                                <div class="post-username">

                                    @${escapeHTML(
                                        post.username
                                    )}

                                </div>


                                <div class="post-time">

                                    ${escapeHTML(
                                 
