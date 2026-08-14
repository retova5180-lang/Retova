/* =========================================================
   PUBLISH
   ========================================================= */

function publishPost() {

    const textElement =
        document.getElementById("createPostText");

    const button =
        document.getElementById("publishPost");

    if (!textElement || !button) return;

    const text =
        textElement.value.trim();

    if (
        text.length === 0 &&
        createPostState.media.length === 0
    ) {
        return;
    }

    if (
        typeof app === "undefined" ||
        !Array.isArray(app.posts)
    ) {
        console.error(
            "Retova: home.js/app is not available."
        );
        return;
    }

    const newId =
        app.posts.length > 0
            ? Math.max(
                ...app.posts.map(
                    post => Number(post.id) || 0
                )
            ) + 1
            : 1;

    const imageMedia =
        createPostState.media.filter(
            media => media.type === "image"
        );

    const newPost = {

        id: newId,

        accountType: "free",

        name: "Retova",

        username: "retova",

        letter: "R",

        gradient: [
            "#8B3DFF",
            "#C54DFF"
        ],

        verified: true,

        vip: false,

        time: "now",

        text: text,

        images:
            imageMedia.map(
                media => media.url
            ),

        likes: 0,

        comments: 0,

        reposts: 0,

        views: 0,

        allowComments:
            createPostState.allowComments,

        allowReposts:
            createPostState.allowReposts,

        hideLikes:
            createPostState.hideLikes,

        visibility:
            createPostState.visibility,

        replyPermission:
            createPostState.replyPermission,

        language:
            createPostState.language,

        hashtags:
            createPostState.hashtags,

        contentWarning:
            createPostState.contentWarning

    };


    app.posts.unshift(
        newPost
    );


    if (
        typeof renderPosts === "function"
    ) {

        renderPosts();

    }


    closeCreatePost();


    createPostState.media =
        [];

    createPostState.allowComments =
        true;

    createPostState.allowReposts =
        true;

    createPostState.hideLikes =
        false;

    createPostState.visibility =
        "Public";

    createPostState.replyPermission =
        "Everyone";

    createPostState.language =
        "Auto";

    createPostState.hashtags =
        0;

    createPostState.contentWarning =
        "None";

}


/* =========================================================
   INITIALIZE CREATE POST
   ========================================================= */

function initializeCreatePost() {

    const button =
        document.getElementById("newPost");

    if (!button) return;


    if (
        button.dataset.createPostBound === "true"
    ) {
        return;
    }


    button.dataset.createPostBound =
        "true";


    button.addEventListener(
        "click",
        openCreatePost
    );

}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCreatePost
    );

} else {

    initializeCreatePost();

       }
