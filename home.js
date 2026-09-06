(() => {
    "use strict";

    const DEMO_STORIES = [
        {
            id: "story-lina",
            name: "Lina",
            username: "@lina",
            letter: "L",
            color: "#ffffff",
            gradient: "linear-gradient(135deg,#8b3dff,#ff4fb3)",
            text: "New day ✨",
            image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85"
        },
        {
            id: "story-noah",
            name: "Noah",
            username: "@noah",
            letter: "N",
            color: "#fff",
            gradient: "linear-gradient(135deg,#3023ae,#c86dd7)",
            text: "Weekend mood.",
            image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85"
        },
        {
            id: "story-sara",
            name: "Sara",
            username: "@sara",
            letter: "S",
            color: "#fff",
            gradient: "linear-gradient(135deg,#ff9966,#ff5e62)",
            text: "Good vibes.",
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85"
        },
        {
            id: "story-alex",
            name: "Alex",
            username: "@alex",
            letter: "A",
            color: "#fff",
            gradient: "linear-gradient(135deg,#00c6ff,#0072ff)",
            text: "Let's go!",
            image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85"
        }
    ];


    const DEMO_POSTS = [
        {
            id: "post-lina",
            name: "Lina",
            username: "@lina",
            letter: "L",
            verified: true,
            time: "12 min",
            text: "A little update from today ✨",
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",
            likes: 284,
            comments: 31,
            reposts: 18,
            saves: 44
        },

        {
            id: "post-noah",
            name: "Noah",
            username: "@noah",
            letter: "N",
            verified: false,
            time: "34 min",
            text: "Which one are you choosing?",
            image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=85",
            likes: 148,
            comments: 22,
            reposts: 9,
            saves: 17
        },

        {
            id: "post-sara",
            name: "Sara",
            username: "@sara",
            letter: "S",
            verified: true,
            time: "1 h",
            text: "Sometimes the simple days are the best days.",
            image: "",
            likes: 392,
            comments: 47,
            reposts: 26,
            saves: 81
        },

        {
            id: "post-alex-repost",
            name: "Alex",
            username: "@alex",
            letter: "A",
            verified: false,
            time: "2 h",
            text: "This is so true.",
            image: "",
            likes: 67,
            comments: 8,
            reposts: 12,
            saves: 9,
            repostOf: "Lina",
            originalText: "A little update from today ✨"
        }
    ];


    const state = {
        activePost: null,
        activeStory: null
    };


    function getUser() {
        try {
            return JSON.parse(
                localStorage.getItem("ars_user") || "null"
            );
        } catch {
            return null;
        }
    }


    function getLetter() {
        const user = getUser();

        if (
            user &&
            user.letter &&
            typeof user.letter === "string"
        ) {
            return user.letter.slice(0, 1).toUpperCase();
        }

        return (
            localStorage.getItem("ars_letter") ||
            "R"
        ).slice(0, 1).toUpperCase();
    }


    function getAvatarStyle() {
        const user = getUser();

        const color =
            user?.letterColor ||
            localStorage.getItem("ars_letter_color") ||
            "#ffffff";

        const background =
            user?.background ||
            localStorage.getItem("ars_background") ||
            "linear-gradient(135deg,#8b3dff,#ff4fb3)";

        return {
            color,
            background
        };
    }


    function safeJSON(key, fallback = []) {
        try {
            const value = JSON.parse(
                localStorage.getItem(key) || "null"
            );

            return Array.isArray(value)
                ? value
                : fallback;

        } catch {
            return fallback;
        }
    }


    function saveJSON(key, value) {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    }


    function getLocalPosts() {
        return safeJSON("ars_local_posts");
    }


    function getLocalStories() {
        return safeJSON("ars_local_stories");
    }


    function getAllPosts() {
        const local = getLocalPosts();

        const localIds = new Set(
            local.map(post => post.id)
        );

        return [
            ...local,
            ...DEMO_POSTS.filter(
                post => !localIds.has(post.id)
            )
        ];
    }


    function getAllStories() {
        const local = getLocalStories();

        const localIds = new Set(
            local.map(story => story.id)
        );

        return [
            ...local,
            ...DEMO_STORIES.filter(
                story => !localIds.has(story.id)
            )
        ];
    }


    function renderMyAvatar() {
        const letter = getLetter();
        const style = getAvatarStyle();

        const avatar =
            document.getElementById("myAvatar");

        const commentAvatar =
            document.getElementById("myCommentAvatar");

        if (avatar) {
            avatar.textContent = letter;
            avatar.style.color = style.color;
            avatar.style.background = style.background;
        }

        if (commentAvatar) {
            commentAvatar.textContent = letter;
            commentAvatar.style.color = style.color;
            commentAvatar.style.background = style.background;
        }
    }


    function renderStreak() {
        const element =
            document.getElementById("streakCount");

        if (!element) return;

        let streak =
            Number(
                localStorage.getItem("ars_streak") || 1
            );

        if (!Number.isFinite(streak) || streak < 1) {
            streak = 1;
        }

        element.textContent =
            `${streak} ${streak === 1 ? "day" : "days"}`;
    }


    function storyAvatarHTML(story) {
        const image =
            story.image ||
            story.avatar ||
            "";

        if (image) {
            return `
                <div class="story-avatar">
                    <img
                        src="${escapeAttr(image)}"
                        alt=""
                        onerror="this.style.display='none'"
                    >
                    <div
                        class="story-avatar-inner"
                        style="
                            color:${escapeAttr(story.color || "#fff")};
                            background:${escapeAttr(
                                story.gradient ||
                                "linear-gradient(135deg,#8b3dff,#ff4fb3)"
                            )};
                        "
                    >
                        ${escapeHTML(
                            story.letter || "R"
                        )}
                    </div>
                </div>
            `;
        }

        return `
            <div
                class="story-avatar"
                style="
                    color:${escapeAttr(story.color || "#fff")};
                    background:${escapeAttr(
                        story.gradient ||
                        "linear-gradient(135deg,#8b3dff,#ff4fb3)"
                    )};
                "
            >
                ${escapeHTML(story.letter || "R")}
            </div>
        `;
    }


    function renderStories() {
        const container =
            document.getElementById("stories");

        if (!container) return;

        const stories = getAllStories();

        const user = getUser();

        const yourStory = {
            id: "your-story",
            name: "Your story",
            letter: getLetter(),
            color:
                user?.letterColor ||
                "#fff",
            gradient:
                user?.background ||
                "linear-gradient(135deg,#8b3dff,#ff4fb3)"
        };

        const html = [
            `
            <button
                class="story yours"
                type="button"
                data-story-id="your-story"
            >
                <div class="story-avatar-wrap">
                    ${storyAvatarHTML(yourStory)}
                </div>

                <div class="story-name">
                    Your story
                </div>
            </button>
            `,
            ...stories.map(story => `
                <button
                    class="story"
                    type="button"
                    data-story-id="${escapeAttr(story.id)}"
                >
                    <div class="story-avatar-wrap">
                        ${storyAvatarHTML(story)}
                    </div>

                    <div class="story-name">
                        ${escapeHTML(story.name)}
                    </div>
                </button>
            `)
        ].join("");

        container.innerHTML = html;

        container
            .querySelectorAll("[data-story-id]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const id =
                            button.dataset.storyId;

                        if (id === "your-story") {
                            if (
                                typeof window.openCreatePost ===
                                "function"
                            ) {
                                window.openCreatePost(
                                    "story"
                                );
                            }

                            return;
                        }

                        const story =
                            stories.find(
                                item =>
                                    item.id === id
                            );

                        if (story) {
                            openStory(story);
                        }
                    }
                );
            });
    }


    function openStory(story) {
        state.activeStory = story;

        const viewer =
            document.getElementById("storyViewer");

        if (!viewer) return;

        const avatar =
            document.getElementById(
                "storyViewerAvatar"
            );

        const name =
            document.getElementById(
                "storyViewerName"
            );

        const image =
            document.getElementById(
                "storyViewerImage"
            );

        const text =
            document.getElementById(
                "storyViewerText"
            );

        if (avatar) {
            avatar.textContent =
                story.letter || "R";

            avatar.style.background =
                story.gradient ||
                "linear-gradient(135deg,#8b3dff,#ff4fb3)";

            avatar.style.color =
                story.color || "#fff";
        }

        if (name) {
            name.textContent =
                story.name || "Story";
        }

        if (image) {
            image.innerHTML = "";

            if (story.image) {
                const img =
                    document.createElement("img");

                img.src = story.image;
                img.alt = "";

                image.appendChild(img);

            } else {
                image.style.background =
                    story.gradient ||
                    "linear-gradient(135deg,#8b3dff,#ff4fb3)";
            }
        }

        if (text) {
            text.textContent =
                story.text || "";
        }

        viewer.classList.add("open");

        document.body.style.overflow = "hidden";
    }


    function closeStory() {
        const viewer =
            document.getElementById("storyViewer");

        if (!viewer) return;

        viewer.classList.remove("open");

        document.body.style.overflow = "";

        state.activeStory = null;
    }


    function renderPosts() {
        const feed =
            document.getElementById("feed");

        if (!feed) return;

        const posts = getAllPosts();

        feed.innerHTML =
            posts.map(postHTML).join("");

        feed
            .querySelectorAll("[data-post-id]")
            .forEach(card => {

                card.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest(
                                "button"
                            ) ||
                            event.target.closest(
                                "a"
                            )
                        ) {
                            return;
                        }

                        const id =
                            card.dataset.postId;

                        const post =
                            posts.find(
                                item =>
                                    item.id === id
                            );

                        if (post) {
                            openPostDetails(post);
                        }
                    }
                );
            });

        bindPostActions(posts);
    }


    function postHTML(post) {

        const liked =
            post.liked === true;

        const reposted =
            post.reposted === true;

        const saved =
            post.saved === true;

        const media =
            post.video
                ? `
                    <video
                        class="post-video"
                        controls
                        playsinline
                    >
                        <source
                            src="${escapeAttr(post.video)}"
                        >
                    </video>
                `
                : post.image
                    ? `
                        <img
                            class="post-media"
                            src="${escapeAttr(post.image)}"
                            alt=""
                            loading="lazy"
                            onerror="this.style.display='none'"
                        >
                    `
                    : "";

        const repost =
            post.repostOf
                ? `
                    <div class="repost-label">
                        <i data-lucide="repeat-2"></i>
                        ${escapeHTML(post.name)}
                        reposted
                        ${escapeHTML(post.repostOf)}'s post
                    </div>
                `
                : "";

        return `
            <article
                class="post-card"
                data-post-id="${escapeAttr(post.id)}"
            >

                <div class="post-head">

                    <div
                        class="post-avatar"
                        style="
                            color:${escapeAttr(
                                post.color || "#fff"
                            )};
                            background:${escapeAttr(
                                post.gradient ||
                                "linear-gradient(135deg,#8b3dff,#ff4fb3)"
                            )};
                        "
                    >
                        ${
                            post.avatar
                                ? `
                                    <img
                                        src="${escapeAttr(post.avatar)}"
                                        alt=""
                                    >
                                `
                                : escapeHTML(
                                    post.letter || "R"
                                )
                        }
                    </div>

                    <div class="post-author">

                        <div class="post-author-row">

                            <span class="post-author-name">
                                ${escapeHTML(post.name)}
                            </span>

                            ${
                                post.verified
                                    ? `
                                        <span class="verified">
                                            <i data-lucide="badge-check"></i>
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                        <div class="post-time">
                            ${escapeHTML(
                                post.username ||
                                "@user"
                            )}
                            ·
                            ${escapeHTML(
                                post.time ||
                                "now"
                            )}
                        </div>

                    </div>

                    <button
                        class="post-menu"
                        type="button"
                        aria-label="More"
                    >
                        <i data-lucide="more-horizontal"></i>
                    </button>

                </div>

                ${repost}

                <div class="post-text">
                    ${escapeHTML(post.text || "")}
                </div>

                ${media}

                <div class="post-stats">

                    <span>
                        ${formatNumber(post.likes || 0)}
                        likes
                    </span>

                    <span>
                        ${formatNumber(
                            post.comments || 0
                        )}
                        comments ·
                        ${formatNumber(
                            post.reposts || 0
                        )}
                        reposts
                    </span>

                </div>

                <div class="post-actions">

                    <button
                        class="post-action like ${
                            liked ? "active" : ""
                        }"
                        data-action="like"
                        data-post-id="${escapeAttr(post.id)}"
                        type="button"
                    >
                        <i data-lucide="heart"></i>
                        <span>Like</span>
                    </button>

                    <button
                        class="post-action"
                        data-action="comment"
                        data-post-id="${escapeAttr(post.id)}"
                        type="button"
                    >
                        <i data-lucide="message-circle"></i>
                        <span>Reply</span>
                    </button>

                    <button
                        class="post-action repost ${
                            reposted ? "active" : ""
                        }"
                        data-action="repost"
                        data-post-id="${escapeAttr(post.id)}"
  
