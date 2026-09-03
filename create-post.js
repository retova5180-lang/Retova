/* =========================================================
   ΛRS — CREATE POST
========================================================= */

(() => {

    "use strict";


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


    /* =====================================================
       OPEN
    ===================================================== */

    function openCreatePost() {

        const existing =
            document.getElementById(
                "createPostScreen"
            );

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


    /* =====================================================
       CLOSE
    ===================================================== */

    function closeCreatePost() {

        const screen =
            document.getElementById(
                "createPostScreen"
            );

        if (!screen) return;

        screen.classList.remove("active");

        setTimeout(
            () => {

                if (screen.parentNode) {
                    screen.remove();
                }

            },
            250
        );

        document.body.classList.remove(
            "create-post-open"
        );
    }


    /* =====================================================
       CREATE SCREEN
    ===================================================== */

    function createPostScreen() {

        const screen =
            document.createElement("div");

        screen.id =
            "createPostScreen";

        screen.className =
            "create-post-screen active";


        screen.innerHTML = `

            <div class="create-post-container">

                <header class="create-post-header">

                    <button
                        class="create-close"
                        id="createPostClose"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>

                    <h1>Create Post</h1>

                    <button
                        class="publish-button"
                        id="publishPost"
                        type="button"
                        disabled
                    >
                        Publish
                    </button>

                </header>


                <section class="create-user">

                    <div class="create-avatar">
                        R
                    </div>

                    <div class="create-user-info">

                        <div class="create-user-name">
                            Retova
                        </div>

                        <button
                            class="visibility-button"
                            id="visibilityButton"
                            type="button"
                        >
                            <span>◉</span>

                            <span id="visibilityText">
                                Public
                            </span>

                            <span>⌄</span>
                        </button>

                    </div>

                </section>


                <section class="create-text-section">

                    <textarea
                        id="createPostText"
                        maxlength="280"
                        placeholder="What's on your mind?"
                    ></textarea>

                    <div class="character-counter">
                        <span id="characterCount">
                            0
                        </span>/280
                    </div>

                </section>


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


                <section class="media-actions">

                    <button
                        class="media-action"
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
                        type="button"
                    >
                        <span class="media-icon">
                            GIF
                        </span>

                        <span>
                            GIF
                        </span>
                    </button>

                </section>


                <section class="post-settings">

                    <div class="setting-row">

                        <div class="setting-left">

                            <span class="setting-icon">
                                ♡
                            </span>

                            <span>
                                Allow comments
                            </span>

                        </div>

                        <button
                            class="toggle active"
                            id="commentsToggle"
                            type="button"
                        >
                            <span></span>
                        </button>

                    </div>


                    <div class="setting-row">

                        <div class="setting-left">

                            <span class="setting-icon">
                                ↻
                            </span>

                            <span>
                                Allow reposts
                            </span>

                        </div>

                        <button
                            class="toggle active"
                            id="repostsToggle"
                            type="button"
                        >
                            <span></span>
                        </button>

                    </div>


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
                        >
                            <span></span>
                        </button>

                    </div>


                    <button
                        class="setting-row"
                        id="replySetting"
                        type="button"
                    >

                        <div class="setting-left">

                            <span class="setting-icon">
                                ↪
                            </span>

                            <span>
                                Who can reply
                            </span>

                        </div>

                        <div class="setting-right">

                            <span id="replyValue">
                                Everyone
                            </span>

                            <span>›</span>

                        </div>

                    </button>


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

                            <span>›</span>

                        </div>

                    </button>


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

                            <span>›</span>

                        </div>

                    </button>


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
                            </span>

                        </div>

                        <div class="setting-right">

                            <span id="warningValue">
                                None
                            </span>

                            <span>›</span>

                        </div>

                    </button>

                </section>


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


    /* =====================================================
       EVENTS
    ===================================================== */

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


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeCreatePost
            );

        }


        if (text) {

            text.addEventListener(
                "input",
                () => {

                    const length =
                        text.value.length;

                    counter.textContent =
                        length;

                    updatePublishButton();

                }
            );

        }


        document
            .querySelectorAll(".media-action")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (mediaInput) {
                            mediaInput.click();
                        }

                    }
                );

            });


        if (mediaInput) {

            mediaInput.addEventListener(
                "change",
                handleMedia
            );

        }


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


        const visibility =
            document.getElementById(
                "visibilityButton"
            );

        if (visibility) {

            visibility.addEventListener(
                "click",
                changeVisibility
            );

        }


        const replies =
            document.getElementById(
                "replySetting"
            );

        if (replies) {

            replies.addEventListener(
                "click",
                changeReplyPermission
            );

        }


        const hashtags =
            document.getElementById(
                "hashtagsSetting"
            );

        if (hashtags) {

            hashtags.addEventListener(
                "click",
                changeHashtags
            );

        }


        const language =
            document.getElementById(
                "languageSetting"
            );

        if (language) {

            language.addEventListener(
                "click",
                changeLanguage
            );

        }


        const warning =
            document.getElementById(
                "warningSetting"
            );

        if (warning) {

            warning.addEventListener(
                "click",
                changeContentWarning
            );

        }


        if (publish) {

            publish.addEventListener(
                "click",
                publishPost
            );

        }

    }


    /* =====================================================
       TOGGLE
    ===================================================== */

    function setupToggle(
        id,
        stateKey
    ) {

        const button =
            document.getElementById(id);

        if (!button) return;

        button.addEventListener(
            "click",
            () => {

                createPostState[stateKey] =
                    !createPostState[stateKey];

                button.classList.toggle(
                    "active",
                    createPostState[stateKey]
                );

            }
        );

    }


    /* =====================================================
       MEDIA
    ===================================================== */

    function handleMedia(event) {

        const selected =
            [
                ...event.target.files
            ].slice(
                0,
                createPostState.maxMedia
                -
                createPostState.media.length
            );


        selected.forEach(file => {

            if (
                !file.type.startsWith("image/")
                &&
                !file.type.startsWith("video/")
            ) {
                return;
            }


            const url =
                URL.createObjectURL(file);


            createPostState.media.push({

                file,

                url,

                type:
                    file.type.startsWith("video/")
                        ? "video"
                        : "image"

            });

        });


        renderMedia();

        updatePublishButton();

        event.target.value = "";
    }


    function renderMedia() {

        const preview =
            document.getElementById(
                "mediaPreview"
            );

        const count =
            document.getElementById(
                "mediaCount"
            );

        if (!preview) return;


        preview.innerHTML =
            createPostState.media
                .map(
                    (media, index) => {

                        return `
                            <div
                                class="media-item"
                            >

                                ${
                                    media.type === "video"
                                        ? `
                                            <video
                                                src="${media.url}"
                                                controls
                                            ></video>
                                        `
                                        : `
                                            <img
                                                src="${media.url}"
                                                alt="Selected media"
                                            >
                                        `
                                }

                                <button
                                    class="media-remove"
                                    type="button"
                                    data-media-index="${index}"
                                >
                                    ×
                                </button>

                            </div>
                        `;

                    }
                )
                .join("");


        if (count) {

            count.textContent =
                `${createPostState.media.length}/10 media`;

        }


        preview
            .querySelectorAll(".media-remove")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.mediaIndex
                            );

                        const media =
                            createPostState.media[
                                index
                            ];

                        if (media) {

                            URL.revokeObjectURL(
                                media.url
           
