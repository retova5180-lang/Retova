/* =========================================================
   RETOVA — CREATE POST
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

    const existing = document.getElementById("createPostScreen");

    if (existing) {
        existing.classList.add("active");
        document.body.classList.add("create-post-open");
        return;
    }

    createPostScreen();

    document.body.classList.add("create-post-open");
}


function closeCreatePost() {

    const screen = document.getElementById("createPostScreen");

    if (!screen) return;

    screen.classList.remove("active");

    setTimeout(() => {
        screen.remove();
    }, 250);

    document.body.classList.remove("create-post-open");
}


/* =========================================================
   CREATE SCREEN
   ========================================================= */

function createPostScreen() {

    const screen = document.createElement("div");

    screen.id = "createPostScreen";
    screen.className = "create-post-screen active";

    screen.innerHTML = `

        <div class="create-post-container">

            <!-- HEADER -->
            <header class="create-post-header">

                <button
                    class="create-close"
                    id="createPostClose"
                    aria-label="Close">
                    ×
                </button>

                <h1>Create Post</h1>

                <button
                    class="publish-button"
                    id="publishPost">
                    Publish
                </button>

            </header>


            <!-- USER -->
            <section class="create-user">

                <div class="create-avatar">
                    R
                </div>

                <div class="create-user-info">

                    <div class="create-user-name">
                        Retova
                        <span class="verified-badge">✓</span>
                    </div>

                    <button
                        class="visibility-button"
                        id="visibilityButton">

                        <span>◉</span>
                        <span id="visibilityText">
                            Public
                        </span>

                        <span>⌄</span>

                    </button>

                </div>

            </section>


            <!-- TEXT -->
            <section class="create-text-section">

                <textarea
                    id="createPostText"
                    maxlength="280"
                    placeholder="What's on your mind?"></textarea>

                <div class="character-counter">
                    <span id="characterCount">0</span>/280
                </div>

            </section>


            <!-- MEDIA -->
            <section class="media-section">

                <div
                    class="media-preview"
                    id="mediaPreview">
                </div>

                <div
                    class="media-count"
                    id="mediaCount">
                    0/10 media
                </div>

            </section>


            <!-- MEDIA ACTIONS -->
            <section class="media-actions">

                <button
                    class="media-action"
                    data-media="photo">

                    <span class="media-icon">▧</span>
                    <span>Photo</span>

                </button>


                <button
                    class="media-action"
                    data-media="video">

                    <span class="media-icon">▶</span>
                    <span>Video</span>

                </button>


                <button
                    class="media-action"
                    data-media="gif">

                    <span class="media-icon">GIF</span>
                    <span>GIF</span>

                </button>


                <button
                    class="media-action"
                    id="pollButton">

                    <span class="media-icon">▥</span>
                    <span>Poll</span>

                </button>


                <button
                    class="media-action"
                    id="locationButton">

                    <span class="media-icon">⌖</span>
                    <span>Location</span>

                </button>

            </section>


            <!-- SETTINGS -->
            <section class="post-settings">


                <!-- REPLIES -->
                <button
                    class="setting-row"
                    id="replySetting">

                    <div class="setting-left">

                        <span class="setting-icon">♙</span>

                        <span>
                            Who can reply?
                        </span>

                    </div>

                    <div class="setting-right">

                        <span id="replyValue">
                            Everyone
                        </span>

                        <span>›</span>

                    </div>

                </button>


                <!-- COMMENTS -->
                <div class="setting-row">

                    <div class="setting-left">

                        <span class="setting-icon">◯</span>

                        <span>
                            Allow comments
                        </span>

                    </div>

                    <button
                        class="toggle active"
                        id="commentsToggle">

                        <span></span>

                    </button>

                </div>


                <!-- REPOSTS -->
                <div class="setting-row">

                    <div class="setting-left">

                        <span class="setting-icon">↗</span>

                        <span>
                            Allow reposts
                        </span>

                    </div>

                    <button
                        class="toggle active"
                        id="repostsToggle">

                        <span></span>

                    </button>

                </div>


                <!-- HIDE LIKES -->
                <div class="setting-row">

                    <div class="setting-left">

                        <span class="setting-icon">♡</span>

                        <span>
                            Hide like count
                        </span>

                    </div>

                    <button
                        class="toggle"
                        id="likesToggle">

                        <span></span>

                    </button>

                </div>


                <!-- HASHTAGS -->
                <button
                    class="setting-row"
                    id="hashtagsSetting">

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


                <!-- LANGUAGE -->
                <button
                    class="setting-row"
                    id="languageSetting">

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


                <!-- CONTENT WARNING -->
                <button
                    class="setting-row"
                    id="warningSetting">

                    <div class="setting-left">

                        <span class="setting-icon">
                            ◉
                        </span>

                        <span>
                            Content warning
                            <small>(optional)</small>
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


            <!-- BOTTOM TOOLS -->
            <section class="create-bottom-tools">

                <button class="bottom-tool active">
                    ✦
                </button>

                <button class="bottom-tool">
                    ☷
                </button>

                <button class="bottom-tool">
                    ✎
                </button>

                <button class="bottom-tool">
                    ⚙
                </button>

            </section>


            <!-- HIDDEN MEDIA INPUT -->
            <input
                type="file"
                id="createMediaInput"
                accept="image/*,video/*"
                multiple
                hidden>

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
        document.getElementById("createPostClose");

    const text =
        document.getElementById("createPostText");

    const counter =
        document.getElementById("characterCount");

    const publish =
        document.getElementById("publishPost");

    const mediaInput =
        document.getElementById("createMediaInput");


    /* CLOSE */

    closeButton.addEventListener(
        "click",
        closeCreatePost
    );


    /* CHARACTER COUNTER */

    text.addEventListener(
        "input",
        () => {

            const length =
                text.value.length;

            counter.textContent =
                length;

            publish.disabled =
                length === 0 &&
                createPostState.media.length === 0;

        }
    );


    /* MEDIA */

    document
        .querySelectorAll(".media-action")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    mediaInput.click();

                }
            );

        });


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

    document
        .getElementById("visibilityButton")
        .addEventListener(
            "click",
            changeVisibility
        );


    /* REPLIES */

    document
        .getElementById("replySetting")
        .addEventListener(
            "click",
            changeReplyPermission
        );


    /* LANGUAGE */

    document
        .getElementById("languageSetting")
        .addEventListener(
            "click",
            changeLanguage
        );


    /* CONTENT WARNING */

    document
        .getElementById("warningSetting")
        .addEventListener(
            "click",
            changeContentWarning
        );


    /* PUBLISH */

    publish.addEventListener(
        "click",
        publishPost
    );

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
        files.slice(0, available);


    selected.forEach(file => {

        if (
            !file.type.startsWith("image/") &&
            !file.type.startsWith("video/")
        ) {
            return;
        }


        const url =
            URL.createObjectURL(file);


        createPostState.media.push({

            file,
            url,
            type: file.type.startsWith("video/")
                ? "video"
                : "image"

        });

    });


    renderMediaPreview();

    updatePublishButton();

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


    preview.innerHTML = "";


    createPostState.media
        .forEach((media, index) => {

            const item =
                document.createElement("div");

            item.className =
                "media-preview-item";


            if (media.type === "video") {

                item.innerHTML = `

                    <video
                        src="${media.url}"
                        muted
                        playsinline>
                    </video>

                    <span class="video-play">
                        ▶
                    </span>

                    <button
                        class="remove-media"
                        data-index="${index}">
                        ×
                    </button>

                `;

            } else {

                item.innerHTML = `

                    <img
                        src="${media.url}"
                        alt="Selected media">

                    <button
                        class="remove-media"
                        data-index="${index}">
                        ×
                    </button>

                `;

            }


            preview.appendChild(item);

        });


    if (
        createPostState.media.length <
        createPostState.maxMedia
    ) {

        const add =
            document.createElement("button");

        add.className =
            "add-media";

        add.innerHTML = `
            <span>+</span>
            <small>Add more</small>
        `;

        add.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "createMediaInput"
                    )
                    .click();

            }
        );

        preview.appendChild(add);

    }


    count.textContent =
        `${createPostState.media.length}/10 media`;


    preview
        .querySelectorAll(".remove-media")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const index =
                        Number(
                            button.dataset.index
                        );

                    const media =
                        createPostState.media[index];

                    if (media) {
                        URL.revokeObjectURL(
                            media.url
                        );
                    }

                    createPostState.media
                        .splice(index, 1);

                    renderMediaPreview();

                    updatePublishButton();

                }
            );

        });

}


/* =========================================================
   TOGGLES
   ========================================================= */

function setupToggle(
    id,
    stateName
) {

    const button =
        document.getElementById(id);

    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            createPostState[stateName] =
                !createPostState[stateName];

            button.classList.toggle(
                "active",
                createPostState[stateName]
            );

        }
    );

}


/* =========================================================
   VISIBILITY
   ========================================================= */

function changeVisibility() {

    const options = [
        "Public",
        "Followers",
        "Only me"
    ];

    const current =
        options.indexOf(
            createPostState.visibility
        );

    const next =
        options[
            (current + 1) %
            options.length
        ];


    createPostState.visibility =
        next;


    document.getElementById(
        "visibilityText"
    ).textContent = next;

}


/* =========================================================
   REPLY PERMISSION
   ========================================================= */

function changeReplyPermission() {

    const options = [
        "Everyone",
        "Followers",
        "Mentioned users"
    ];

    const current =
        options.indexOf(
            createPostState.replyPermission
        );

    const next =
        options[
            (current + 1) %
            options.length
        ];


    createPostState.replyPermission =
        next;


    document.getElementById(
        "replyValue"
    ).textContent = next;

}


/* =========================================================
   LANGUAGE
   ========================================================= */

function changeLanguage() {

    const options = [
        "Auto",
        "English",
        "Arabic"
    ];

    const current =
        options.indexOf(
            createPostState.language
        );

    const next =
        options[
            (current + 1) %
            options.length
        ];


    createPostState.language =
        next;


    document.getElementById(
        "languageValue"
    ).textContent = next;

}


/* =========================================================
   CONTENT WARNING
   ========================================================= */

function changeContentWarning() {

    const options = [
        "None",
        "Sensitive",
        "Violence",
        "Adult"
    ];

    const current =
        options.indexOf(
            createPostState.contentWarning
        );

    const next =
        options[
            (current + 1) %
            options.length
        ];


    createPostState.contentWarning =
        next;


    document.getElementById(
        "warningValue"
    ).textContent = next;

}


/* =========================================================
   PUBLISH STATE
   ========================================================= */

function updatePublishButton() {

    const text =
        document.getElementById(
            "createPostText"
        );

    const button =
        document.getElementById(
            "publishPost"
        );

    if (!text || !button) return;


    button.disabled =
        text.value.trim().length === 0 &&
        createPostState.media.length === 0;

}


/* ==================================
