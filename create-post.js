/* =========================================================
   ΛRS — CREATE POST
   CLEAN FINAL VERSION
========================================================= */

const createPostState = {

    media: [],

    maxMedia: 10,

    maxCharacters: 280,

    allowComments: true,

    allowReposts: true,

    hideLikes: false,

    visibility: "Public",

    replyPermission: "Everyone",

    language: "Auto",

    hashtags: 0,

    contentWarning: "None"

};


/* =========================================================
   OPEN / CLOSE
========================================================= */

function openCreatePost() {

    const existing =
        document.getElementById("createPostScreen");

    if (existing) {

        existing.classList.add("active");

        document.body.classList.add(
            "create-post-open"
        );

        return;

    }

    createPostScreen();

    document.body.classList.add(
        "create-post-open"
    );

}


function closeCreatePost() {

    const screen =
        document.getElementById("createPostScreen");

    if (!screen) return;

    screen.classList.remove("active");

    setTimeout(() => {

        if (screen) {
            screen.remove();
        }

    }, 250);

    document.body.classList.remove(
        "create-post-open"
    );

}


/* =========================================================
   CREATE SCREEN
========================================================= */

function createPostScreen() {

    const screen =
        document.createElement("div");

    screen.id =
        "createPostScreen";

    screen.className =
        "create-post-screen active";

    screen.innerHTML = `

        <div class="create-post-container">

            <!-- HEADER -->

            <header class="create-post-header">

                <button
                    class="create-close"
                    id="createPostClose"
                    type="button"
                    aria-label="Close"
                >
                    ×
                </button>

                <h1>
                    Create Post
                </h1>

                <button
                    class="publish-button"
                    id="publishPost"
                    type="button"
                >
                    Publish
                </button>

            </header>


            <!-- USER -->

            <section class="create-user">

                <div class="create-avatar">
                    Λ
                </div>

                <div class="create-user-info">

                    <div class="create-user-name">

                        ΛRS

                        <span class="verified-badge">
                            ✓
                        </span>

                    </div>


                    <button
                        class="visibility-button"
                        id="visibilityButton"
                        type="button"
                    >

                        <span>
                            ◉
                        </span>

                        <span id="visibilityText">
                            Public
                        </span>

                        <span>
                            ⌄
                        </span>

                    </button>

                </div>

            </section>


            <!-- TEXT -->

            <section class="create-text-section">

                <textarea
                    id="createPostText"
                    maxlength="280"
                    placeholder="What's on your mind?"
                ></textarea>

                <div class="character-counter">

                    <span id="characterCount">
                        0
                    </span>

                    /280

                </div>

            </section>


            <!-- MEDIA -->

            <section class="media-section">

                <div
                    class="media-preview"
                    id="mediaPreview"
                ></div>

                <div
                    class="media-count"
                    id="mediaCount"
                >
                    0/10 media
                </div>

            </section>


            <!-- MEDIA ACTIONS -->

            <section class="media-actions">

                <button
                    class="media-action"
                    data-media="photo"
                    type="button"
                >

                    <span class="media-icon">
                        ▧
                    </span>

                    <span>
                        Photo
                    </span>

                </button>


                <button
                    class="media-action"
                    data-media="video"
                    type="button"
                >

                    <span class="media-icon">
                        ▶
                    </span>

                    <span>
                        Video
                    </span>

                </button>


                <button
                    class="media-action"
                    data-media="gif"
                    type="button"
                >

                    <span class="media-icon">
                        GIF
                    </span>

                    <span>
                        GIF
                    </span>

                </button>


                <button
                    class="media-action"
                    id="pollButton"
                    type="button"
                >

                    <span class="media-icon">
                        ▥
                    </span>

                    <span>
                        Poll
                    </span>

                </button>


                <button
                    class="media-action"
                    id="locationButton"
                    type="button"
                >

                    <span class="media-icon">
                        ⌖
                    </span>

                    <span>
                        Location
                    </span>

                </button>

            </section>


            <!-- SETTINGS -->

            <section class="post-settings">


                <!-- REPLIES -->

                <button
                    class="setting-row"
                    id="replySetting"
                    type="button"
                >

                    <div class="setting-left">

                        <span class="setting-icon">
                            ♙
                        </span>

                        <span>
                            Who can reply?
                        </span>

                    </div>


                    <div class="setting-right">

                        <span id="replyValue">
                            Everyone
                        </span>

                        <span>
                            ›
                        </span>

                    </div>

                </button>


                <!-- COMMENTS -->

                <div class="setting-row">

                    <div class="setting-left">

                        <span class="setting-icon">
                            ◯
                        </span>

                        <span>
                            Allow comments
                        </span>

                    </div>


                    <button
                        class="toggle active"
                        id="commentsToggle"
                        type="button"
                        aria-label="Allow comments"
                    >

                        <span></span>

                    </button>

                </div>


                <!-- REPOSTS -->

                <div class="setting-row">

                    <div class="setting-left">

                        <span class="setting-icon">
                            ↗
                        </span>

                        <span>
                            Allow reposts
                        </span>

                    </div>


                    <button
                        class="toggle active"
                        id="repostsToggle"
                        type="button"
                        aria-label="Allow reposts"
                    >

                        <span></span>

                    </button>

                </div>


                <!-- HIDE LIKES -->

                <div class="setting-row">

                    <div class="setting-left">

                        <span class="setting-icon">
                            ♡
                        </span>

                        <span>
                            Hide like count
                        </span>

                    </div>


                    <button
                        class="toggle"
                        id="likesToggle"
                        type="button"
                        aria-label="Hide like count"
                    >

                        <span></span>

                    </button>

                </div>


                <!-- HASHTAGS -->

                <button
                    class="setting-row"
                    id="hashtagsSetting"
                    type="button"
                >

                    <div class="setting-left">

                        <span class="setting-icon">
                            #
                        </span>

                        <span>
                            Add hashtags
                        </span>

                    </div>


                    <div class="setting-right">

                        <span id="hashtagsValue">
                            0
                        </span>

                        <span>
                            ›
                        </span>

                    </div>

                </button>


                <!-- LANGUAGE -->

                <button
                    class="setting-row"
                    id="languageSetting"
                    type="button"
                >

                    <div class="setting-left">

                        <span class="setting-icon">
                            文
                        </span>

                        <span>
                            Language
                        </span>

                    </div>


                    <div class="setting-right">

                        <span id="languageValue">
                            Auto
                        </span>

                        <span>
                            ›
                        </span>

                    </div>

                </button>


                <!-- CONTENT WARNING -->

                <button
                    class="setting-row"
                    id="warningSetting"
                    type="button"
                >

                    <div class="setting-left">

                        <span class="setting-icon">
                            ◉
                        </span>

                        <span>

                            Content warning

                            <small>
                                (optional)
                            </small>

                        </span>

                    </div>


                    <div class="setting-right">

                        <span id="warningValue">
                            None
                        </span>

                        <span>
                            ›
                        </span>

                    </div>

                </button>

            </section>


            <!-- BOTTOM TOOLS -->

            <section class="create-bottom-tools">

                <button
                    class="bottom-tool active"
                    type="button"
                >
                    ✦
                </button>


                <button
                    class="bottom-tool"
                    type="button"
                >
                    ☷
                </button>


                <button
                    class="bottom-tool"
                    type="button"
                >
                    ✎
                </button>


                <button
                    class="bottom-tool"
                    type="button"
                >
                    ⚙
                </button>

            </section>


            <!-- HIDDEN MEDIA INPUT -->

            <input
                type="file"
                id="createMediaInput"
                accept="image/*,video/*"
                multiple
                hidden
            >

        </div>

    `;


    document.body.appendChild(screen);

    setupCreatePostEvents();

}


/* =========================================================
   EVENTS
========================================================= */

function setupCreatePostEvents() {

    const closeButton =
        document.getElementById(
            "createPostClose"
        );

    const text =
        document.getElementById(
            "createPostText"
        );

    const counter =
        document.getElementById(
            "characterCount"
        );

    const publish =
        document.getElementById(
            "publishPost"
        );

    const mediaInput =
        document.getElementById(
            "createMediaInput"
        );


    if (
        !closeButton ||
        !text ||
        !counter ||
        !publish ||
        !mediaInput
    ) {

        console.error(
            "ΛRS: Create Post elements are missing."
        );

        return;

    }


    /* CLOSE */

    closeButton.addEventListener(
        "click",
        closeCreatePost
    );


    /* CHARACTER COUNTER */

    text.addEventListener(
        "input",
        () => {

            counter.textContent =
                text.value.length;

            updatePublishButton();

        }
    );


    /* MEDIA */

    document
        .querySelectorAll(
            ".media-action"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        mediaInput.click();

                    }
                );

            }
        );


    mediaInput.addEventListener(
        "change",
        handleMedia
    );


    /* TOGGLES */

    setupToggle(
        "commentsToggle",
        "allowComments"
    );

    setupToggle(
        "repostsToggle",
        "allowReposts"
    );

    setupToggle(
        "likesToggle",
        "hideLikes"
    );


    /* VISIBILITY */

    const visibilityButton =
        document.getElementById(
            "visibilityButton"
        );

    if (visibilityButton) {

        visibilityButton.addEventListener(
            "click",
            changeVisibility
        );

    }


    /* REPLIES */

    const replySetting =
        document.getElementById(
            "replySetting"
        );

    if (replySetting) {

        replySetting.addEventListener(
            "click",
            changeReplyPermission
        );

    }


    /* LANGUAGE */

    const languageSetting =
        document.getElementById(
            "languageSetting"
        );

    if (languageSetting) {

        languageSetting.addEventListener(
            "click",
            changeLanguage
        );

    }


    /* CONTENT WARNING */

    const warningSetting =
        document.getElementById(
            "warningSetting"
        );

    if (warningSetting) {

        warningSetting.addEventListener(
            "click",
            changeContentWarning
        );

    }


    /* PUBLISH */

    publish.addEventListener(
        "click",
        publishPost
    );


    updatePublishButton();

}


/* =========================================================
   MEDIA
========================================================= */

function handleMedia(event) {

    const files =
        [...event.target.files];

    const available =
        createPostState.maxMedia -
        createPostState.media.length;

    const selected =
        files.slice(
            0,
            available
        );


    selected.forEach(
        file => {

            if (
                !file.type.startsWith("image/") &&
                !file.type.startsWith("video/")
            ) {

                return;

            }


            const url =
                URL.createObjectURL(
                    file
                );


            createPostState.media.push({

                file,

                url,

                type:
                    file.type.startsWith("video/")
                        ? "video"
                        : "image"

            });

        }
    );


    renderMediaPreview();

    updatePublishButton();


    event.target.value = "";

}


/* =========================================================
   MEDIA PREVIEW
========================================================= */

function renderMediaPreview() {

    const preview =
        document.getElementById(
            "mediaPreview"
        );

    const count =
        document.getElementById(
            "mediaCount"
        );


    if (!preview || !count) return;


    preview.innerHTML = "";


    createPostState.media
        .forEach(
            (media, index) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "media-preview-item";


                if (
                    media.type ===
                    "video"
                ) {

                    item.innerHTML = `

                        <video
                            src="${media.url}"
                            muted
                            playsinline
                        ></video>

                        <span
                            class="video-play"
                        >
                            ▶
                        </span>

                        <button
                            class="remove-media"
                            data-index="${index}"
                            type="button"
                        >
                            ×
                        </button>

                    `;

                } else {

                    item.innerHTML = `

                        <img
                            src="${media.url}"
                            alt="Selected media"
                        >

                        <button
                            class="remove-media"
                            data-index="${index}"
                            type="button"
                        >
                            ×
                        </button>

                    `;

                }


                preview.appendChild(
                    item
                );

            }
        );


    if (
        createPostState.media.length <
        createPostState.maxMedia
    ) {

        const add =
            document.createElement(
                "button"
            );


        add.className =
            "add-media";


        add.type =
            "button";


        add.innerHTML = `

            <span>
                +
            </span>

            <small>
                Add more
            </small>

        `;


        add.addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        "createMediaInput"
                    );

                if (input) {
                    input.click();
                }

            }
        );


        preview.appendChild(
            add
        );

    }


    count.textContent =
        `${createPostState.media.
