/* =========================================================
   ΛRS — HOME
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       DEMO DATA
    ===================================================== */

    const demoStories = [
        {
            id: "story-1",
            name: "Lina",
            username: "lina.ae",
            letter: "L",
            gradient: "linear-gradient(135deg,#ff4f9d,#8b3dff)",
            text: "Sunset always hits different 💜",
            image:
                "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80"
        },

        {
            id: "story-2",
            name: "Noah",
            username: "noah.vibes",
            letter: "N",
            gradient: "linear-gradient(135deg,#4f9cff,#8b3dff)",
            text: "Focused on the journey.",
            image:
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
        },

        {
            id: "story-3",
            name: "Sara",
            username: "sara.wave",
            letter: "S",
            gradient: "linear-gradient(135deg,#ff4fa3,#ff8c4f)",
            text: "Good vibes only ✨",
            image:
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
        }
    ];


    let posts = [
        {
            id: "post-1",
            name: "Lina",
            username: "lina.ae",
            letter: "L",
            verified: false,
            time: "12m",
            text:
                "Sunset always hits different 💜",
            image:
                "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85",
            likes: 2400,
            comments: 186,
            reposts: 312,
            saves: 48000,
            liked: false,
            reposted: false
        },

        {
            id: "post-2",
            name: "Apple",
            username: "apple",
            letter: "",
            verified: true,
            time: "28m",
            text:
                "Apple Intelligence expands to more languages later this year.",
            image:
                "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85",
            likes: 28400,
            comments: 1800,
            reposts: 3900,
            saves: 2400000,
            liked: false,
            reposted: false
        },

        {
            id: "post-3",
            name: "Noah",
            username: "noah.vibes",
            letter: "N",
            verified: true,
            time: "45m",
            text:
                "Focused on the journey.",
            image:
                "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85",
            likes: 8100,
            comments: 432,
            reposts: 728,
            saves: 91000,
            liked: false,
            reposted: false
        }
    ];


    let activePostId = null;


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function formatNumber(value) {

        if (value >= 1000000) {
            return (
                (value / 1000000)
                    .toFixed(value >= 10000000 ? 0 : 1)
                    .replace(".0", "")
                + "M"
            );
        }

        if (value >= 1000) {
            return (
                (value / 1000)
                    .toFixed(value >= 10000 ? 0 : 1)
                    .replace(".0", "")
                + "K"
            );
        }

        return String(value);
    }


    function getCurrentUser() {

        try {

            const raw =
                localStorage.getItem("ars_user");

            if (!raw) {
                return {
                    name: "Retova",
                    username: "retova",
                    letter: "R"
                };
            }

            const user = JSON.parse(raw);

            return {
                name:
                    user.displayName ||
                    user.name ||
                    "Retova",

                username:
                    user.username ||
                    "retova",

                letter:
                    localStorage.getItem("ars_letter") ||
                    user.letter ||
                    "R"
            };

        } catch {

            return {
                name: "Retova",
                username: "retova",
                letter: "R"
            };
        }
    }


    /* =====================================================
       AVATAR
    ===================================================== */

    function renderMyAvatar() {

        const button =
            document.getElementById("myAvatar");

        if (!button) return;

        const user =
            getCurrentUser();

        button.textContent =
            user.letter || "R";
    }


    /* =====================================================
       STORIES
    ===================================================== */

    function renderStories() {

        const container =
            document.getElementById("stories");

        if (!container) return;

        container.innerHTML =
            demoStories.map(story => {

                return `
                    <button
                        class="story"
                        type="button"
                        data-story-id="${escapeHTML(story.id)}"
                    >

                        <div
                            class="story-avatar"
                            style="background:${story.gradient}"
                        >
                            <div class="story-avatar-inner">
                                ${escapeHTML(story.letter)}
                            </div>
                        </div>

                        <span class="story-name">
                            ${escapeHTML(story.name)}
                        </span>

                    </button>
                `;

            }).join("");

        container
            .querySelectorAll(".story")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        openStory(
                            button.dataset.storyId
                        );

                    }
                );

            });
    }


    /* =====================================================
       STORIES VIEWER
    ===================================================== */

    function openStory(id) {

        const story =
            demoStories.find(
                item => item.id === id
            );

        if (!story) return;

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

        if (!viewer) return;

        avatar.textContent =
            story.letter;

        name.textContent =
            story.name;

        image.style.backgroundImage =
            `url("${story.image}")`;

        text.textContent =
            story.text;

        viewer.classList.add("open");
    }


    function closeStory() {

        const viewer =
            document.getElementById("storyViewer");

        if (!viewer) return;

        viewer.classList.remove("open");
    }


    /* =====================================================
       POSTS
    ===================================================== */

    function renderPosts() {

        const feed =
            document.getElementById("feed");

        if (!feed) return;

        if (!posts.length) {

            feed.innerHTML = `
                <div class="empty-feed">

                    <strong>
                        Your feed is empty
                    </strong>

                    Follow people or create
                    your first post.

                </div>
            `;

            return;
        }


        feed.innerHTML =
            posts.map(post => {

                const imageHTML =
                    post.image
                        ? `
                            <div class="post-media">
                                <img
                                    src="${escapeHTML(post.image)}"
                                    alt="${escapeHTML(post.name)} post"
                                    loading="lazy"
                                    onerror="this.parentElement.style.display='none'"
                                >
                            </div>
                        `
                        : "";


                return `
                    <article
                        class="post"
                        data-post-id="${escapeHTML(post.id)}"
                    >

                        <header class="post-header">

                            <div class="post-avatar">
                                ${escapeHTML(post.letter)}
                            </div>

                            <div class="post-user">

                                <div class="post-name-row">

                                    <span class="post-name">
                                        ${escapeHTML(post.name)}
                                    </span>

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

                                <div class="post-username">
                                    @${escapeHTML(post.username)}
                                    ·
                                    ${escapeHTML(post.time)}
                                </div>

                            </div>

                            <button
                                class="post-menu"
                                type="button"
                                aria-label="More"
                            >
                                •••
                            </button>

                        </header>


                        <div class="post-text">
                            ${escapeHTML(post.text)}
                        </div>


                        ${imageHTML}


                        <div class="post-actions">

                            <button
                                class="action-button ${
                                    post.liked
                                        ? "liked"
                                        : ""
                                }"
                                type="button"
                                data-action="like"
                                data-post-id="${escapeHTML(post.id)}"
                            >
                                <i data-lucide="heart"></i>

                                <span class="action-count">
                                    ${formatNumber(post.likes)}
                                </span>
                            </button>


                            <button
                                class="action-button"
                                type="button"
                                data-action="comment"
                                data-post-id="${escapeHTML(post.id)}"
                            >
                                <i data-lucide="message-circle"></i>

                                <span class="action-count">
                                    ${formatNumber(post.comments)}
                                </span>
                            </button>


                            <button
                                class="action-button ${
                                    post.reposted
                                        ? "reposted"
                                        : ""
                                }"
                                type="button"
                                data-action="repost"
                                data-post-id="${escapeHTML(post.id)}"
                            >
                                <i data-lucide="repeat-2"></i>

                                <span class="action-count">
                                    ${formatNumber(post.reposts)}
                                </span>
                            </button>


                            <button
                                class="action-button"
                                type="button"
                                data-action="save"
                                data-post-id="${escapeHTML(post.id)}"
                            >
                                <i data-lucide="bookmark"></i>
                            </button>

                        </div>


                        <div class="post-stats">

                            ${formatNumber(post.likes)}
                            likes ·

                            ${formatNumber(post.comments)}
                            comments ·

                            ${formatNumber(post.reposts)}
                            reposts

                        </div>

                    </article>
                `;

            }).join("");


        if (window.lucide) {
            lucide.createIcons();
        }


        bindPostActions();
    }


    /* =====================================================
       POST ACTIONS
    ===================================================== */

    function bindPostActions() {

        document
            .querySelectorAll("[data-action]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.action;

                        const id =
                            button.dataset.postId;

                        handlePostAction(
                            action,
                            id
                        );

                    }
                );

            });
    }


    function handlePostAction(action, id) {

        const post =
            posts.find(
                item => item.id === id
            );

        if (!post) return;


        if (action === "like") {

            if (post.liked) {

                post.liked = false;
                post.likes = Math.max(
                    0,
                    post.likes - 1
                );

            } else {

                post.liked = true;
                post.likes += 1;

            }

            renderPosts();
            return;
        }


        if (action === "comment") {

            openComments(id);
            return;
        }


        if (action === "repost") {

            post.reposted =
                !post.reposted;

            post.reposts +=
                post.reposted ? 1 : -1;

            renderPosts();
            return;
        }


        if (action === "save") {

            buttonFeedback(
                "Saved"
            );

        }

    }


    function buttonFeedback(text) {

        const toast =
            document.createElement("div");

        toast.textContent = text;

        toast.style.position = "fixed";
        toast.style.left = "50%";
        toast.style.bottom = "95px";
        toast.style.transform =
            "translateX(-50%)";

        toast.style.padding =
            "10px 16px";

        toast.style.borderRadius =
            "20px";

        toast.style.background =
            "#8d39ff";

        toast.style.color =
            "#fff";

        toast.style.fontSize =
            "13px";

        toast.style.fontWeight =
            "700";

        toast.style.zIndex =
            "500";

        document.body.appendChild(toast);

        setTimeout(
            () => toast.remove(),
            1200
        );
    }


    /* =====================================================
       COMMENTS
    ===================================================== */

    function openComments(id) {

        activePostId = id;

        const sheet =
            document.getElementById("commentsSheet");

        if (!sheet) return;

        renderComments();

        sheet.classList.add("open");
    }


    function closeComments() {

        const sheet =
            document.getElementById("commentsSheet");

        if (!sheet) return;

        sheet.classList.remove("open");

        activePostId = null;
    }


    function renderComments() {

        const list =
            document.getElementById("commentsList");

        if (!list) return;

        list.innerHTML = `
            <div class="comment">

                <div class="comment-avatar">
                    L
                </div>

                <div class="comment-body">

                    <div class="comment-name">
                        Lina
                    </div>

                    <div class="comment-text">
                        This is beautiful 💜
                    </div>

                </div>

            </div>


            <div class="comment">

                <div class="comment-avatar">
                    N
                </div>

                <div class="comment-body">

                    <div class="comment-name">
                        Noah
                    </div>

                    <div class="comment-text">
                        Love this!
                    </div>

                </div>

            </div>
        `;
    }


    function addComment() {

        const input =
            document.getElementById(
                "commentInput"
            );

        if (!input) return;

        const text =
            input.value.trim();

        if (!text) return;

        const post =
            posts.find(
                item =>
                    item.id === activePostId
            );

        if (post) {
            post.comments += 1;
        }

        const list =
            document.getElementById(
                "commentsList"
            );

        const user =
            getCurrentUser();

        const comment =
            document.createElement("div");

        comment.className =
            "comment";

        comment.innerHTML = `
            <div class="comment-avatar">
                ${escapeHTML(user.letter)}
            </div>

            <div class="comment-body">

                <div class="comment-name">
                    ${escapeHTML(user.name)}
                </div>

                <div class="comment-text">
                    ${escapeHTML(text)}
                </div>

            </div>
        `;

        list.appendChild(comment);

        input.value = "";

        renderPosts();
    }


    /* =====================================================
       NAVIGATION
    ==============================
