(() => {
    "use strict";

    /* =========================================================
       ΛRS HOME
       Stories + Posts + Reposts + Likes + Comments + Save
       Works with create-post.js and wheel.js
    ========================================================= */

    let currentCommentPostId = null;

    const DEMO_AVATARS = {
        lina: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        noah: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        sara: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        alex: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    };

    const DEMO_STORIES = [
        {
            id: "story-lina",
            author: {
                name: "Lina",
                username: "lina",
                letter: "L",
                avatar: DEMO_AVATARS.lina
            },
            text: "Little moments ✨",
            image:
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=85",
            createdAt: Date.now() - 1000 * 60 * 10,
            expiresAt: Date.now() + 1000 * 60 * 60 * 20
        },
        {
            id: "story-noah",
            author: {
                name: "Noah",
                username: "noah",
                letter: "N",
                avatar: DEMO_AVATARS.noah
            },
            text: "Good day 🌙",
            image:
                "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=85",
            createdAt: Date.now() - 1000 * 60 * 35,
            expiresAt: Date.now() + 1000 * 60 * 60 * 18
        },
        {
            id: "story-sara",
            author: {
                name: "Sara",
                username: "sara",
                letter: "S",
                avatar: DEMO_AVATARS.sara
            },
            text: "Weekend mood 💜",
            image:
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=85",
            createdAt: Date.now() - 1000 * 60 * 55,
            expiresAt: Date.now() + 1000 * 60 * 60 * 17
        },
        {
            id: "story-alex",
            author: {
                name: "Alex",
                username: "alex",
                letter: "A",
                avatar: DEMO_AVATARS.alex
            },
            text: "Exploring ✨",
            image:
                "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=85",
            createdAt: Date.now() - 1000 * 60 * 80,
            expiresAt: Date.now() + 1000 * 60 * 60 * 16
        }
    ];

    const DEMO_POSTS = [
        {
            id: "post-lina",
            author: {
                name: "Lina",
                username: "lina",
                letter: "L",
                avatar: DEMO_AVATARS.lina,
                verified: true
            },
            text:
                "Sometimes the smallest moments make the best memories. ✨",
            image:
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85",
            time: "12 min",
            likes: 248,
            comments: [
                {
                    id: "comment-1",
                    author: {
                        name: "Noah",
                        username: "noah",
                        letter: "N"
                    },
                    text: "This is beautiful 💜",
                    createdAt: Date.now() - 1000 * 60 * 5
                },
                {
                    id: "comment-2",
                    author: {
                        name: "Sara",
                        username: "sara",
                        letter: "S"
                    },
                    text: "Love this!",
                    createdAt: Date.now() - 1000 * 60 * 8
                }
            ],
            reposts: 31,
            saves: 44,
            liked: false,
            reposted: false,
            saved: false
        },

        {
            id: "post-noah",
            author: {
                name: "Noah",
                username: "noah",
                letter: "N",
                avatar: DEMO_AVATARS.noah
            },
            text:
                "A quiet night, a good view, and absolutely no plans. 🌙",
            image:
                "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85",
            time: "38 min",
            likes: 412,
            comments: [
                {
                    id: "comment-3",
                    author: {
                        name: "Lina",
                        username: "lina",
                        letter: "L"
                    },
                    text: "Perfect mood.",
                    createdAt: Date.now() - 1000 * 60 * 15
                }
            ],
            reposts: 76,
            saves: 91,
            liked: false,
            reposted: false,
            saved: false
        },

        {
            id: "post-sara",
            author: {
                name: "Sara",
                username: "sara",
                letter: "S",
                avatar: DEMO_AVATARS.sara,
                verified: true
            },
            text:
                "New day. New energy. Same me. 💫",
            image:
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85",
            time: "1 hr",
            likes: 689,
            comments: [
                {
                    id: "comment-4",
                    author: {
                        name: "Alex",
                        username: "alex",
                        letter: "A"
                    },
                    text: "🔥🔥🔥",
                    createdAt: Date.now() - 1000 * 60 * 20
                }
            ],
            reposts: 102,
            saves: 155,
            liked: false,
            reposted: false,
            saved: false
        },

        {
            id: "post-repost",
            isRepost: true,
            repostedBy: {
                name: "Alex",
                username: "alex",
                letter: "A",
                avatar: DEMO_AVATARS.alex
            },
            author: {
                name: "Lina",
                username: "lina",
                letter: "L",
                avatar: DEMO_AVATARS.lina,
                verified: true
            },
            text:
                "Keep going. Your future self will thank you. 💜",
            image: null,
            time: "2 hr",
            likes: 934,
            comments: [],
            reposts: 143,
            saves: 220,
            liked: false,
            reposted: false,
            saved: false
        }
    ];

    /* =========================================================
       STORAGE
    ========================================================= */

    function readArray(key) {
        try {
            const value = JSON.parse(
                localStorage.getItem(key) || "[]"
            );

            return Array.isArray(value) ? value : [];
        } catch (error) {
            return [];
        }
    }

    function writeArray(key, value) {
        try {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );
        } catch (error) {
            console.error("ΛRS storage error:", error);
        }
    }

    function getLocalPosts() {
        return readArray("ars_local_posts");
    }

    function getLocalStories() {
        return readArray("ars_local_stories");
    }

    /* =========================================================
       USER
    ========================================================= */

    function getCurrentUser() {
        try {
            const user = JSON.parse(
                localStorage.getItem("ars_user")
            );

            if (user) {
                return user;
            }
        } catch (error) {}

        return {
            displayName: "You",
            username: "you",
            letter:
                localStorage.getItem("ars_letter") ||
                "R"
        };
    }

    function getMyLetter() {
        const user = getCurrentUser();

        return (
            localStorage.getItem("ars_letter") ||
            user.letter ||
            user.displayName?.charAt(0) ||
            "R"
        )
            .charAt(0)
            .toUpperCase();
    }

    function getMyBackground() {
        return (
            localStorage.getItem("ars_background") ||
            "linear-gradient(135deg,#8B3DFF,#C54DFF)"
        );
    }

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

    function formatNumber(number) {
        const value = Number(number) || 0;

        if (value >= 1000000) {
            return `${(value / 1000000)
                .toFixed(1)
                .replace(".0", "")}M`;
        }

        if (value >= 1000) {
            return `${(value / 1000)
                .toFixed(1)
                .replace(".0", "")}K`;
        }

        return String(value);
    }

    function refreshIcons() {
        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {
            window.lucide.createIcons();
        }
    }

    function dispatch(name, detail = {}) {
        window.dispatchEvent(
            new CustomEvent(name, {
                detail
            })
        );
    }

    /* =========================================================
       AVATAR
    ========================================================= */

    function avatarHTML(user, className = "") {
        const name = escapeHTML(
            user?.name ||
            user?.displayName ||
            "User"
        );

        const letter = escapeHTML(
            (
                user?.letter ||
                name.charAt(0) ||
                "U"
            )
                .charAt(0)
                .toUpperCase()
        );

        const avatar = user?.avatar;

        if (avatar) {
            return `
                <div
                    class="post-avatar ${className}"
                    title="${name}"
                >
                    <img
                        src="${escapeHTML(avatar)}"
                        alt="${name}"
                        onerror="
                            this.style.display='none';
                            this.parentElement.classList.add('avatar-fallback');
                        "
                    >
                    <span class="avatar-fallback-letter">
                        ${letter}
                    </span>
                </div>
            `;
        }

        return `
            <div
                class="post-avatar avatar-fallback ${className}"
                title="${name}"
            >
                <span class="avatar-fallback-letter">
                    ${letter}
                </span>
            </div>
        `;
    }

    function myAvatarHTML(className = "") {
        const user = getCurrentUser();

        const freeAvatarUntil = Number(
            localStorage.getItem(
                "ars_free_avatar_until"
            ) || 0
        );

        const temporaryImage =
            localStorage.getItem(
                "ars_temp_avatar_image"
            );

        if (
            freeAvatarUntil > Date.now() &&
            temporaryImage
        ) {
            return `
                <div class="post-avatar ${className}">
                    <img
                        src="${escapeHTML(temporaryImage)}"
                        alt="Your avatar"
                    >
                </div>
            `;
        }

        return `
            <div
                class="post-avatar avatar-fallback ${className}"
                style="background:${escapeHTML(
                    getMyBackground()
                )}"
            >
                <span class="avatar-fallback-letter">
                    ${escapeHTML(getMyLetter())}
                </span>
            </div>
        `;
    }

    /* =========================================================
       MY HEADER AVATAR
    ========================================================= */

    function renderMyAvatar() {
        const button =
            document.getElementById("myAvatar");

        if (!button) return;

        const freeAvatarUntil = Number(
            localStorage.getItem(
                "ars_free_avatar_until"
            ) || 0
        );

        const temporaryImage =
            localStorage.getItem(
                "ars_temp_avatar_image"
            );

        const vipUntil = Number(
            localStorage.getItem(
                "ars_temp_vip_until"
            ) || 0
        );

        button.classList.remove(
            "ars-image-avatar",
            "ars-temp-vip"
        );

        button.style.backgroundImage = "";
        button.style.background = "";

        if (
            freeAvatarUntil > Date.now() &&
            temporaryImage
        ) {
            button.classList.add(
                "ars-image-avatar"
            );

            button.style.backgroundImage =
                `url("${temporaryImage}")`;

            button.style.backgroundSize =
                "cover";

            button.style.backgroundPosition =
                "center";

            button.textContent = "";
        } else {
            button.style.background =
                getMyBackground();

            button.textContent =
                getMyLetter();
        }

        if (vipUntil > Date.now()) {
            button.classList.add(
                "ars-temp-vip"
            );
        }
    }

    /* =========================================================
       STORIES
    ========================================================= */

    function getAllStories() {
        const localStories =
            getLocalStories()
                .filter(
                    story =>
                        !story.expiresAt ||
                        Number(story.expiresAt) >
                            Date.now()
                );

        return [
            ...localStories,
            ...DEMO_STORIES
        ];
    }

    function renderStories() {
        const container =
            document.getElementById("stories");

        if (!container) return;

        const stories =
            getAllStories();

        let html = `
            <button
                type="button"
                class="story story-add"
                data-story-add
            >
                <div class="story-avatar story-add-avatar">
                    <span>+</span>
                </div>

                <span class="story-name">
                    Your story
                </span>
            </button>
        `;

        stories.forEach(story => {
            const author =
                story.author || {};

            const name =
                author.name ||
                "User";

            const letter =
                (
                    author.letter ||
                    name.charAt(0) ||
                    "U"
                )
                    .charAt(0)
                    .toUpperCase();

            const hasImage =
                Boolean(
                    story.image ||
                    author.avatar
                );

            const image =
                story.image ||
                author.avatar ||
                "";

            html += `
                <button
                    type="button"
                    class="story"
                    data-story-id="${escapeHTML(
                        story.id
                    )}"
                >
                    <div
                        class="story-avatar"
                    >
                        <div
                            class="story-avatar-inner"
                            ${
                                hasImage
                                    ? `style="background-image:url('${escapeHTML(
                                          image
                                      )}');"`
                                    : ""
                            }
                        >
                            ${
                                hasImage
                                    ? ""
                                    : escapeHTML(
                                          letter
                                      )
                            }
                        </div>
                    </div>

                    <span class="story-name">
                        ${escapeHTML(name)}
                    </span>
                </button>
            `;
        });

        container.innerHTML = html;

        container
            .querySelectorAll(
                "[data-story-id]"
            )
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

        container
            .querySelector(
                "[data-story-add]"
            )
            ?.addEventListener(
                "click",
                () => {
                    if (
                        typeof window.openCreatePost ===
                        "function"
                    ) {
                        window.openCreatePost(
                            "story"
                        );
                    }
                }
            );
    }

    function openStory(storyId) {
        const story =
            getAllStories().find(
                item =>
                    item.id === storyId
            );

        if (!story) return;

        const viewer =
            document.getElementById(
                "storyViewer"
            );

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

        const author =
            story.author || {};

        if (avatar) {
            if (author.avatar) {
                avatar.style.backgroundImage =
                    `url("${author.avatar}")`;

                avatar.style.backgroundSize =
                    "cover";

                avatar.style.backgroundPosition =
                    "center";

                avatar.textContent = "";
            } else {
                avatar.style.backgroundImage =
                    "";

                avatar.style.background =
                    getMyBackground();

                avatar.textContent =
                    (
                        author.letter ||
                        author.name?.charAt(0) ||
                        "U"
                    )
                        .charAt(0)
                        .toUpperCase();
            }
        }

        if (name)
