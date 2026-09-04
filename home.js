(() => {
    "use strict";

    /* =========================================================
       DEMO STORIES
    ========================================================= */

    const demoStories = [
        {
            id: "story-1",
            name: "Lina",
            username: "lina",
            letter: "L",
            gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)",
            text: "Just enjoying the day ✨",
            image:
                "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80"
        },

        {
            id: "story-2",
            name: "Noah",
            username: "noah",
            letter: "N",
            gradient: "linear-gradient(135deg,#06b6d4,#6366f1)",
            text: "Weekend vibes.",
            image:
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"
        },

        {
            id: "story-3",
            name: "Sara",
            username: "sara",
            letter: "S",
            gradient: "linear-gradient(135deg,#f97316,#ec4899)",
            text: "New look today 💗",
            image:
                "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"
        }
    ];


    /* =========================================================
       DEMO POSTS
    ========================================================= */

    const posts = [
        {
            id: "post-1",

            name: "Lina",
            username: "lina",

            letter: "L",

            verified: true,

            time: "12 min",

            text:
                "A little moment from today. Everything feels better when you slow down ✨",

            image:
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",

            likes: 248,
            comments: 31,
            reposts: 14,
            saves: 52,

            liked: false,
            reposted: false,
            saved: false
        },

        {
            id: "post-2",

            name: "Apple",
            username: "apple",

            letter: "A",

            verified: true,

            time: "35 min",

            text:
                "Design is not just what it looks like. It is how it feels.",

            image:
                "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=85",

            likes: 641,
            comments: 84,
            reposts: 39,
            saves: 118,

            liked: false,
            reposted: false,
            saved: false
        },

        {
            id: "post-3",

            name: "Noah",
            username: "noah",

            letter: "N",

            verified: false,

            time: "1 h",

            text:
                "Sometimes you just need a quiet place and a good view.",

            image:
                "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85",

            likes: 183,
            comments: 19,
            reposts: 7,
            saves: 41,

            liked: false,
            reposted: false,
            saved: false
        }
    ];


    /* =========================================================
       STATE
    ========================================================= */

    let currentCommentPostId = null;
    let currentStoryIndex = 0;

    const commentsData = {
        "post-1": [
            {
                name: "Sara",
                letter: "S",
                text: "This is so pretty!"
            },
            {
                name: "Noah",
                letter: "N",
                text: "Love this ✨"
            }
        ],

        "post-2": [
            {
                name: "Lina",
                letter: "L",
                text: "Exactly!"
            },
            {
                name: "Maya",
                letter: "M",
                text: "So true."
            }
        ],

        "post-3": [
            {
                name: "Apple",
                letter: "A",
                text: "Beautiful view."
            }
        ]
    };


    /* =========================================================
       HELPERS
    ========================================================= */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getSavedUser() {
        try {
            return JSON.parse(
                localStorage.getItem("ars_user") || "null"
            );
        } catch {
            return null;
        }
    }


    function getUserLetter() {
        const letter =
            localStorage.getItem("ars_letter") ||
            getSavedUser()?.displayName?.charAt(0) ||
            "R";

        return String(letter).charAt(0).toUpperCase() || "R";
    }


    function getUserLetterColor() {
        return (
            localStorage.getItem("ars_letter_color") ||
            "#ffffff"
        );
    }


    function getUserBackground() {
        return (
            localStorage.getItem("ars_background") ||
            "linear-gradient(135deg,#8b5cf6,#ec4899)"
        );
    }


    function isImageAvatarActive() {
        const image =
            localStorage.getItem("ars_avatar");

        const expires =
            Number(
                localStorage.getItem("ars_avatar_expires") || 0
            );

        if (!image) {
            return false;
        }

        if (expires && Date.now() > expires) {
            localStorage.removeItem("ars_avatar");
            localStorage.removeItem("ars_avatar_expires");

            return false;
        }

        return true;
    }


    function getUserAvatarImage() {
        if (!isImageAvatarActive()) {
            return null;
        }

        return localStorage.getItem("ars_avatar");
    }


    function formatCount(number) {
        const value = Number(number) || 0;

        if (value >= 1000000) {
            return (
                (value / 1000000)
                    .toFixed(value >= 10000000 ? 0 : 1)
                    .replace(".0", "") +
                "M"
            );
        }

        if (value >= 1000) {
            return (
                (value / 1000)
                    .toFixed(value >= 10000 ? 0 : 1)
                    .replace(".0", "") +
                "K"
            );
        }

        return String(value);
    }


    function icon(name) {
        return `<i data-lucide="${name}"></i>`;
    }


    function refreshIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }


    /* =========================================================
       MY AVATAR
    ========================================================= */

    function renderMyAvatar() {
        const avatar = document.getElementById("myAvatar");
        const commentAvatar =
            document.getElementById("myCommentAvatar");

        if (!avatar) {
            return;
        }

        const image = getUserAvatarImage();

        if (image) {
            avatar.classList.add("has-image");

            avatar.style.backgroundImage =
                `url("${image}")`;

            avatar.textContent = "";
        } else {
            avatar.classList.remove("has-image");

            avatar.style.backgroundImage = "";

            avatar.style.background =
                getUserBackground();

            avatar.style.color =
                getUserLetterColor();

            avatar.textContent =
                getUserLetter();
        }

        if (commentAvatar) {
            commentAvatar.textContent =
                getUserLetter();

            commentAvatar.style.background =
                getUserBackground();

            commentAvatar.style.color =
                getUserLetterColor();
        }
    }


    /* =========================================================
       STORIES
    ========================================================= */

    function renderStories() {
        const container =
            document.getElementById("stories");

        if (!container) {
            return;
        }

        container.innerHTML =
            demoStories
                .map((story, index) => {

                    const image =
                        story.image
                            ? `
                                <img
                                    src="${escapeHTML(story.image)}"
                                    alt="${escapeHTML(story.name)}"
                                    loading="lazy"
                                    onerror="this.style.display='none';"
                                >
                              `
                            : "";

                    return `
                        <div class="story">

                            <button
                                class="story-button"
                                type="button"
                                data-story-index="${index}"
                                aria-label="Open ${escapeHTML(story.name)} story"
                            >

                                <div
                                    class="story-avatar"
                                    style="background:${escapeHTML(story.gradient)}"
                                >

                                    <div class="story-avatar-inner">

                                        ${
                                            image ||
                                            escapeHTML(story.letter)
                                        }

                                    </div>

                                </div>

                            </button>

                            <div class="story-name">
                                ${escapeHTML(story.name)}
                            </div>

                        </div>
                    `;
                })
                .join("");

        container
            .querySelectorAll("[data-story-index]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.storyIndex
                            );

                        openStory(index);
                    }
                );
            });

        refreshIcons();
    }


    /* =========================================================
       STORY VIEWER
    ========================================================= */

    function openStory(index) {
        const story =
            demoStories[index];

        if (!story) {
            return;
        }

        currentStoryIndex = index;

        const viewer =
            document.getElementById("storyViewer");

        const avatar =
            document.getElementById("storyViewerAvatar");

        const name =
            document.getElementById("storyViewerName");

        const image =
            document.getElementById("storyViewerImage");

        const text =
            document.getElementById("storyViewerText");

        if (!viewer) {
            return;
        }

        avatar.textContent =
            story.letter;

        avatar.style.background =
            story.gradient;

        name.textContent =
            story.name;

        text.textContent =
            story.text || "";

        if (story.image) {
            image.innerHTML = `
                <img
                    src="${escapeHTML(story.image)}"
                    alt="${escapeHTML(story.name)}"
                >
            `;
        } else {
            image.innerHTML = "";
        }

        viewer.classList.add("open");

        document.body.style.overflow = "hidden";
    }


    function closeStory() {
        const viewer =
            document.getElementById("storyViewer");

        if (!viewer) {
            return;
        }

        viewer.classList.remove("open");

        document.body.style.overflow = "";
    }


    function nextStory() {
        if (!demoStories.length) {
            return;
        }

        currentStoryIndex =
            (currentStoryIndex + 1) %
            demoStories.length;

        openStory(currentStoryIndex);
    }


    /* =========================================================
       POSTS
    ========================================================= */

    function renderPosts() {
        const feed =
            document.getElementById("feed");

        if (!feed) {
            return;
        }

        if (!posts.length) {
            feed.innerHTML = `
                <div class="empty-feed">

                    <div class="empty-feed-title">
                        Nothing here yet
                    </div>

                    <div class="empty-feed-text">
                        Create your first post.
                    </div>

                </div>
            `;

            return;
        }

        feed.innerHTML =
            posts
                .map(post => {

                    const media =
                        post.image
                            ? `
                                <div class="post-media">

                                    <img
                                        src="${escapeHTML(post.image)}"
                                        alt="${escapeHTML(post.name)} post"
                                        loading="lazy"
                                        onerror="this.closest('.post-media').innerHTML='<div class=&quot;post-media-placeholder&quot;>Image unavailable</div>';"
                                    >

                                </div>
                            `
                            : "";

                    return `
                        <article
                            class="post"
                            data-post-id="${escapeHTML(post.id)}"
                        >

                            <div class="post-header">

                                <div
                                    class="post-avatar"
                                    style="background:${post.gradient || "linear-gradient(135deg,#8b5cf6,#ec4899)"}"
                                >
                                    ${escapeHTML(post.letter)}
                                </div>

                                <div class="post-user">

                                    <div class="post-name-row">

                                        <span class="post-name">
                                            ${escapeHTML(post.name)}
                                        </span>

                                        ${
                                            post.verified
                                                ? `<span class="verified">✓</span>`
                                                : ""
                                        }

                                    </div>

                                    <div class="post-time">
                                        ${escapeHTML(post.time)}
                                    </div>

                                </div>

                                <button
                                    class="post-menu"
                                    type="button"
                                    aria-label="More options"
                                >
                                    ⋯
                                </button>

                            </div>


                            <div class="post-text">
                                ${escapeHTML(post.text)}
                            </div>


                            ${media}


                            <div class="post-stats">

                                <span>
                                    ${formatCount(post.likes)}
                                    ${post.likes === 1 ? "Like" : "Likes"}
                                </span>

                                <span>
                                    ${formatCount(post.comments)}
                                    ${post.comments === 1 ? "Comment" : "Comments"}
                                </span>

                            </div>


                            <div class="post-actions">

                                <button
                                    class="post-action ${post.liked ? "liked active" : ""}"
                                    type="button"
                                    data-action="like"
                                    data-post-id="${escapeHTML(post.id)}"
                                >
                                    ${icon("heart")}
                                    <span>Like</span>
                                </button>


                                <button
                                    class="post-action"
                                    type="button"
                                    data-action="comment"
                                    data-post-id="${escapeHTML(post.id)}"
                                >
                                    ${icon("message-circle")}
                                    <span>Comment</span>
                                </button>


                                <button
                                    class="post-action ${post.reposted ? "active" : ""}"
                                    type="button"
                                    data-action="repost"
                                    data-post-id="${escapeHTML(post.id)}"
                                >
                                    ${icon("repeat-2")}
                                    <span>Repost</span>
                                </button>


                                <button
                                    class="post-action ${post.saved ? "active" : ""}"
                                    type="button"
                                    data-action="save"
                                    data-post-id="${escapeHTML(post.id)}"
                                >
                                    ${icon("bookmark")}
                                    <span>Save</span>
                                </button>

                            </div>

                        </article>
                    `;
                })
                .join("");

        bindPostActions();

        refreshIcons();
    }


    /* =========================================================
       POST ACTIONS
    ========================================================= */

    function bindPostActions() {
        document
            .querySelectorAll("[data-action]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.action;

                        const postId =
                            button.dataset.postId;

                        handlePostAction(
                            action,
                            postId
                        );
                    }
                );
            });
    }


    function getPost(postId) {
        return posts.find(
            post => post.id === postId
        );
    }


    function handlePostAction(
        action,
        postId
    ) {
        const post =
            getPost(postId);

        if (!post) {
            return;
        }

        if (action === "like") {

            post.liked =
    
