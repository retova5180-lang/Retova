/* =========================================================
   RETOVA — HOME.JS
   CLEAN HOME ENGINE
   ========================================================= */


/* =========================================================
   APP
========================================================= */

const app = {

    stories: [],

    posts: [],

    comments: {},

    likedPosts: new Set(),

    repostedPosts: new Set()

};


/* =========================================================
   ELEMENTS
========================================================= */

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


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
    "retova_home_state";


function loadHomeState() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEY
                )
            );

        if (!saved) return;


        if (Array.isArray(saved.likedPosts)) {

            app.likedPosts =
                new Set(
                    saved.likedPosts
                );

        }


        if (Array.isArray(saved.repostedPosts)) {

            app.repostedPosts =
                new Set(
                    saved.repostedPosts
                );

        }

    } catch (error) {

        console.warn(
            "Retova storage could not be loaded.",
            error
        );

    }

}


function saveHomeState() {

    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify({

                likedPosts:
                    [...app.likedPosts],

                repostedPosts:
                    [...app.repostedPosts]

            })

        );

    } catch (error) {

        console.warn(
            "Retova storage could not be saved.",
            error
        );

    }

}


/* =========================================================
   HELPERS
========================================================= */

function create(
    tag,
    className = ""
) {

    const element =
        document.createElement(tag);

    if (className) {

        element.className =
            className;

    }

    return element;

}


function clear(element) {

    if (element) {

        element.innerHTML = "";

    }

}


function formatNumber(number) {

    if (number >= 1000000) {

        return (
            number / 1000000
        ).toFixed(1) + "M";

    }


    if (number >= 1000) {

        return (
            number / 1000
        ).toFixed(1) + "K";

    }


    return String(number);

}


function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   STORIES
========================================================= */

app.stories = [

    {
        id: 1,
        type: "mine",
        name: "You",
        letter: "R",
        seen: false,
        gradient: [
            "#8B3DFF",
            "#C54DFF"
        ]
    },

    {
        id: 2,
        type: "official",
        name: "Apple",
        avatar: "assets/avatars/apple.png",
        verified: true,
        seen: false
    },

    {
        id: 3,
        type: "official",
        name: "Ferrari",
        avatar: "assets/avatars/ferrari.png",
        verified: true,
        seen: false
    },

    {
        id: 4,
        type: "official",
        name: "BMW",
        avatar: "assets/avatars/bmw.png",
        verified: true,
        seen: true
    },

    {
        id: 5,
        type: "official",
        name: "Formula 1",
        avatar: "assets/avatars/f1.png",
        verified: true,
        seen: false
    },

    {
        id: 6,
        type: "official",
        name: "Red Bull",
        avatar: "assets/avatars/redbull.png",
        verified: true,
        seen: true
    },

    {
        id: 7,
        type: "official",
        name: "NASA",
        avatar: "assets/avatars/nasa.png",
        verified: true,
        seen: false
    },

    {
        id: 8,
        type: "official",
        name: "Spotify",
        avatar: "assets/avatars/spotify.png",
        verified: true,
        seen: true
    },

    {
        id: 9,
        type: "official",
        name: "Netflix",
        avatar: "assets/avatars/netflix.png",
        verified: true,
        seen: false
    },

    {
        id: 10,
        type: "official",
        name: "PlayStation",
        avatar: "assets/avatars/playstation.png",
        verified: true,
        seen: false
    }

];


/* =========================================================
   POSTS
========================================================= */

app.posts = [

    {
        id: 1,
        accountType: "official",
        name: "Apple",
        username: "apple",
        avatar: "assets/avatars/apple.png",
        verified: true,
        vip: false,
        time: "12m",
        text:
            "Apple Intelligence expands to more languages later this year.",
        images:
            ["assets/posts/apple1.jpg"],
        likes: 28400,
        comments: 1843,
        reposts: 3902,
        views: 2400000
    },

    {
        id: 2,
        accountType: "official",
        name: "Ferrari",
        username: "ferrari",
        avatar: "assets/avatars/ferrari.png",
        verified: true,
        vip: false,
        time: "28m",
        text:
            "Ready for another race weekend. Forza Ferrari.",
        images:
            ["assets/posts/ferrari1.jpg"],
        likes: 94100,
        comments: 6320,
        reposts: 11200,
        views: 7800000
    },

    {
        id: 3,
        accountType: "official",
        name: "BMW",
        username: "bmw",
        avatar: "assets/avatars/bmw.png",
        verified: true,
        vip: false,
        time: "43m",
        text:
            "The new BMW M4 Competition in Frozen Black.",
        images:
            ["assets/posts/bmw1.jpg"],
        likes: 55300,
        comments: 2981,
        reposts: 3011,
        views: 3100000
    },

    {
        id: 4,
        accountType: "official",
        name: "Formula 1",
        username: "f1",
        avatar: "assets/avatars/f1.png",
        verified: true,
        vip: false,
        time: "1h",
        text:
            "Lights out tomorrow. Who is taking pole position?",
        images:
            ["assets/posts/f1_1.jpg"],
        likes: 132000,
        comments: 8511,
        reposts: 19200,
        views: 9600000
    },

    {
        id: 5,
        accountType: "official",
        name: "Red Bull Racing",
        username: "redbullracing",
        avatar: "assets/avatars/redbull.png",
        verified: true,
        vip: false,
        time: "2h",
        text:
            "Every millisecond matters.",
        images:
            ["assets/posts/redbull1.jpg"],
        likes: 87300,
        comments: 4711,
        reposts: 9610,
        views: 5200000
    },

    {
        id: 6,
        accountType: "vip",
        name: "Lina",
        username: "lina",
        letter: "L",
        gradient:
            ["#8B3DFF", "#C54DFF"],
        verified: false,
        vip: true,
        time: "3h",
        text:
            "Finally finished my new workspace setup.",
        images: [],
        likes: 4211,
        comments: 291,
        reposts: 88,
        views: 119000
    },

    {
        id: 7,
        accountType: "free",
        name: "Noah",
        username: "noah",
        letter: "N",
        gradient:
            ["#2563EB", "#06B6D4"],
        verified: false,
        vip: false,
        time: "4h",
        text:
            "Morning coffee before work.",
        images: [],
        likes: 831,
        comments: 41,
        reposts: 12,
        views: 15200
    },

    {
        id: 8,
        accountType: "official",
        name: "NASA",
        username: "nasa",
        avatar: "assets/avatars/nasa.png",
        verified: true,
        vip: false,
        time: "5h",
        text:
            "Another breathtaking view of Earth from orbit.",
        images:
            ["assets/posts/nasa1.jpg"],
        likes: 61000,
        comments: 3410,
        reposts: 8200,
        views: 4700000
    },

    {
        id: 9,
        accountType: "official",
        name: "Spotify",
        username: "spotify",
        avatar: "assets/avatars/spotify.png",
        verified: true,
        vip: false,
        time: "6h",
        text:
            "Your next favorite playlist just dropped.",
        images: [],
        likes: 22800,
        comments: 981,
        reposts: 1102,
        views: 1900000
    },

    {
        id: 10,
        accountType: "official",
        name: "Netflix",
        username: "netflix",
        avatar: "assets/avatars/netflix.png",
        verified: true,
        vip: false,
        time: "7h",
        text:
            "A new series arrives this Friday.",
        images: [],
        likes: 35700,
        comments: 2100,
        reposts: 3400,
        views: 2900000
    }

];


/* =========================================================
   DEMO COMMENTS
========================================================= */

const demoComments = [

    {
        name: "Lina",
        letter: "L",
        text: "This looks amazing.",
        likes: 24
    },

    {
        name: "Noah",
        letter: "N",
        text: "Can't wait for this.",
        likes: 8
    },

    {
        name: "Emma",
        letter: "E",
        text: "Beautiful update.",
        likes: 13
    },

    {
        name: "Sarah",
        letter: "S",
        text: "Love the design.",
        likes: 16
    },

    {
        name: "Omar",
        letter: "O",
        text: "Retova keeps getting better.",
        likes: 11
    },

    {
        name: "Maya",
        letter: "M",
        text: "My favorite app already.",
        likes: 31
    }

];


/* =========================================================
   RENDER STORIES
========================================================= */

function renderStories() {

    if (!storiesContainer) return;

    clear(
        storiesContainer
    );


    app.stories.forEach(
        story => {

            const card =
                create(
                    "div",
                    "story"
                );


            if (story.seen) {

                card.classList.add(
                    "seen"
                );

            }


            if (
                story.type ===
                "mine"
            ) {

                card.classList.add(
                    "mine"
                );

            }


            const ring =
                create(
                    "div",
                    "story-ring"
                );


            const avatar =
                create(
                    "div",
                    "story-avatar"
                );


            if (
                story.type ===
                "official"
            ) {

                avatar.style.backgroundImage =
                    `url("${story.avatar}")`;

            } else {

                avatar.style.background =
                    `linear-gradient(
                        135deg,
                        ${story.gradient[0]},
                        ${story.gradient[1]}
                    )`;

                avatar.textContent =
                    story.letter;

            }


            ring.appendChild(
                avatar
            );


            card.appendChild(
                ring
            );


            if (
                story.type ===
                "mine"
            ) {

                const plus =
                    create(
                        "div",
                        "story-plus"
                    );

                plus.textContent =
                    "+";

                card.appendChild(
                    plus
                );

            }


            const name =
                create(
                    "div",
                    "story-name"
                );

            name.textContent =
                story.name;

            card.appendChild(
                name
            );


            storiesContainer.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   POST AVATAR
========================================================= */

function getPostAvatar(post) {

    if (
        post.accountType ===
        "official"
    ) {

        return `

            <div class="post-avatar">

                <img
                    src="${post.avatar}"
                    alt="${escapeHTML(post.name)}">

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


/* =========================================================
   POST BADGES
========================================================= */

function getPostBadges(post) {

    let badges = "";


    if (post.verified) {

        badges += `

            <span class="verify">

                <i
                    data-lucide="badge-check"
                ></i>

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


/* =========================================================
   POST MEDIA
========================================================= */

function getPostMedia(post) {

    if (
        !Array.isArray(
            post.images
        )
    ) {

        return "";

    }


    if (
        post.images.length === 0
    ) {

        return "";

    }


    return `

        <div class="post-image">

            <img
                src="${post.images[0]}"
                alt="Post image"
                loading="lazy">

        </div>

    `;

}


/* =========================================================
   POST ACTION ICONS
========================================================= */

function getActionIcon(
    icon,
    label
) {

    return `

        <i
            data-lucide="${icon}"
            aria-hidden="true"
        ></i>

        <span class="sr-only">
            ${label}
        </span>

    `;

}


/* =========================================================
   RENDER POSTS
========================================================= */

function renderPosts() {

    if (!feedContainer) return;

    clear(
        feedContainer
    );


    app.posts.forEach(
        post => {

            if (!post) return;


            const article =
                create(
                    "article",
                    "post"
                );


            article.dataset.id =
                post.id;


            const liked =
                app.likedPosts.has(
                    post.id
                );


            const reposted =
                app.repostedPosts.has(
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
                                    post.time
                                )}

                            </div>

                        </div>

                    </div>


                    <button
                        class="post-more"
                        type="button"
                        aria-label="More options"
                    >

                        ${getActionIcon(
                            "more-horizontal",
                            "More options"
                        )}

                    </button>

                </div>


                <div class="post-content">

                    ${escapeHTML(
                        post.text || ""
                    )}

                </div>


                ${getPostMedia(post)}


                <div class="post-actions">


                    <div class="post-left-actions">


                        <button
                            class="
                                action
                                action-like
                                ${liked ? "liked" : ""}
                            "
                            type="button"
                            aria-label="Like"
                            aria-pressed="${liked}"
                        >

                            ${getActionIcon(
                                "heart",
                                "Like"
                            )}

                            <span class="count">

                                ${formatNumber(
                                    post.likes
                                )}

                            </span>

                        </button>


                        <button
                            class="
                                action
                                action-comment
                            "
                            type="button"
                            aria-label="Comments"
                        >

                            ${getActionIcon(
                                "message-circle",
                                "Comments"
                            )}

                            <span class="count">

                                ${formatNumber(
                                    post.comments
                                )}

                            </span>

                        </button>


                        <button
                            class="
                                action
                                action-repost
                                ${reposted ? "active" : ""}
                            "
                            type="button"
                            aria-label="Repost"
                            aria-pressed="${reposted}"
                        >

                            ${getActionIcon(
                                "repeat-2",
                                "Repost"
                            )}

                            <span class="count">

${formatNumber(
    post.reposts
)}

                            </span>

                        </button>

                    </div>


                    <div
                        class="action action-views"
                        aria-label="Views"
                    >

                        ${getActionIcon(
                            "eye",
                            "Views"
                        )}

                        <span class="count">

                            ${formatNumber(
                                post.views
                            )}

                        </span>

                    </div>

                </div>

            `;

            feedContainer.appendChild(
                article
            );

        }
    );

    refreshIcons();

}


/* =========================================================
   LUCIDE
========================================================= */

function refreshIcons() {

    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }

}


/* =========================================================
   LIKE
========================================================= */

function toggleLike(postId) {

    const post =
        app.posts.find(
            item => item.id === postId
        );

    if (!post) return;


    if (
        app.likedPosts.has(postId)
    ) {

        app.likedPosts.delete(postId);

        post.likes =
            Math.max(
                0,
                post.likes - 1
            );

    } else {

        app.likedPosts.add(postId);

        post.likes++;

    }


    saveHomeState();

    renderPosts();

}


/* =========================================================
   REPOST
========================================================= */

function toggleRepost(postId) {

    const post =
        app.posts.find(
            item => item.id === postId
        );

    if (!post) return;


    if (
        app.repostedPosts.has(postId)
    ) {

        app.repostedPosts.delete(
            postId
        );

        post.reposts =
            Math.max(
                0,
                post.reposts - 1
            );

    } else {

        app.repostedPosts.add(
            postId
        );

        post.reposts++;

    }


    saveHomeState();

    renderPosts();

}


/* =========================================================
   COMMENTS
========================================================= */

function getComments(postId) {

    if (!app.comments[postId]) {

        app.comments[postId] =
            demoComments.map(
                comment => ({
                    ...comment
                })
            );

    }

    return app.comments[postId];

}


function buildComments(postId) {

    if (!commentsList) return;

    clear(commentsList);


    const comments =
        getComments(postId);


    comments.forEach(
        comment => {

            const item =
                create(
                    "div",
                    "comment"
                );


            item.innerHTML = `

                <div class="comment-avatar">

                    ${escapeHTML(
                        comment.letter
                    )}

                </div>


                <div class="comment-content">

                    <div class="comment-name">

                        ${escapeHTML(
                            comment.name
                        )}

                    </div>


                    <div class="comment-text">

                        ${escapeHTML(
                            comment.text
                        )}

                    </div>


                    <div class="comment-like">

                        <i
                            data-lucide="heart"
                        ></i>

                        ${comment.likes}

                    </div>

                </div>

            `;


            commentsList.appendChild(
                item
            );

        }
    );


    refreshIcons();

}


/* =========================================================
   OPEN COMMENTS
========================================================= */

function openComments(postId) {

    buildComments(postId);

    commentsSheet?.classList.add(
        "show"
    );

}


/* =========================================================
   CLOSE COMMENTS
========================================================= */

function closeComments() {

    commentsSheet?.classList.remove(
        "show"
    );

}


/* =========================================================
   ACTION EVENTS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const like =
            event.target.closest(
                ".action-like"
            );


        if (like) {

            const post =
                like.closest(".post");


            if (post) {

                toggleLike(
                    Number(
                        post.dataset.id
                    )
                );

            }

            return;

        }


        const comment =
            event.target.closest(
                ".action-comment"
            );


        if (comment) {

            const post =
                comment.closest(".post");


            if (post) {

                openComments(
                    Number(
                        post.dataset.id
                    )
                );

            }

            return;

        }


        const repost =
            event.target.closest(
                ".action-repost"
            );


        if (repost) {

            const post =
                repost.closest(".post");


            if (post) {

                toggleRepost(
                    Number(
                        post.dataset.id
                    )
                );

            }

            return;

        }

    }
);


/* =========================================================
   COMMENTS CLOSE
========================================================= */

commentsSheet?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            commentsSheet
        ) {

            closeComments();

        }

    }
);


/* =========================================================
   ESC
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeComments();

        }

    }
);


/* =========================================================
   CREATE POST
========================================================= */

newPostButton?.addEventListener(
    "click",
    () => {

        if (
            typeof openCreatePost ===
            "function"
        ) {

            openCreatePost();

        } else {

            console.warn(
                "create-post.js is not loaded."
            );

        }

    }
);


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll("nav button")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            "nav button"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );

                }
            );

        }
    );


/* =========================================================
   INITIALIZE
========================================================= */

loadHomeState();

renderStories();

renderPosts();

refreshIcons();


/* =========================================================
   PUBLIC API
========================================================= */

window.retovaApp = app;

window.renderPosts =
    renderPosts;

window.renderStories =
    renderStories;

window.openComments =
    openComments;

window.closeComments =
    closeComments;
