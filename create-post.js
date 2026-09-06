(() => {
    "use strict";

    const state = {
        mode: "post",
        media: null,
        mediaType: null
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

        return (
            user?.letter ||
            localStorage.getItem("ars_letter") ||
            "R"
        )
        .slice(0, 1)
        .toUpperCase();
    }


    function ensureUI() {

        if (
            document.getElementById(
                "createPostScreen"
            )
        ) {
            return;
        }

        const screen =
            document.createElement("div");

        screen.id =
            "createPostScreen";

        screen.innerHTML = `
            <div class="create-post-panel">

                <div class="create-post-header">

                    <div class="create-post-title">
                        <strong id="createPostTitle">
                            Create post
                        </strong>

                        <span id="createPostSubtitle">
                            Share something with ΛRS
                        </span>
                    </div>

                    <button
                        class="create-post-close"
                        id="closeCreatePost"
                        type="button"
                    >
                        ×
                    </button>

                </div>

                <div class="create-post-tabs">

                    <button
                        class="create-post-tab active"
                        data-create-mode="post"
                        type="button"
                    >
                        Post
                    </button>

                    <button
                        class="create-post-tab"
                        data-create-mode="story"
                        type="button"
                    >
                        Story
                    </button>

                </div>

                <div class="create-post-body">

                    <div class="create-post-user">

                        <div
                            class="create-post-user-avatar"
                            id="createPostAvatar"
                        >
                            R
                        </div>

                        <div>
                            <div
                                class="create-post-user-name"
                                id="createPostUserName"
                            >
                                You
                            </div>

                            <div class="create-post-user-sub">
                                Everyone
                            </div>
                        </div>

                    </div>

                    <textarea
                        id="createPostText"
                        maxlength="1000"
                        placeholder="What's happening?"
                    ></textarea>

                    <div
                        class="create-post-preview"
                        id="createPostPreview"
                    >
                        <button
                            class="create-post-remove-media"
                            id="removeCreateMedia"
                            type="button"
                        >
                            ×
                        </button>

                        <div id="createPostMedia"></div>
                    </div>

                    <div class="create-post-tools">

                        <button
                            class="create-post-tool"
                            id="createImage"
                            type="button"
                            title="Image"
                        >
                            <i data-lucide="image"></i>
                        </button>

                        <button
                            class="create-post-tool"
                            id="createVideo"
                            type="button"
                            title="Video"
                        >
                            <i data-lucide="video"></i>
                        </button>

                        <button
                            class="create-post-tool"
                            id="createEmoji"
                            type="button"
                            title="Emoji"
                        >
                            😊
                        </button>

                    </div>

                    <div class="create-post-options">

                        <button
                            class="create-post-option active"
                            type="button"
                        >
                            Everyone
                        </button>

                        <button
                            class="create-post-option"
                            type="button"
                        >
                            Friends
                        </button>

                        <button
                            class="create-post-option"
                            type="button"
                        >
                            Subscribers
                        </button>

                    </div>

                    <div class="create-post-bottom">

                        <div
                            class="create-post-meta"
                            id="createPostCount"
                        >
                            0 / 1000
                        </div>

                        <button
                            class="create-post-publish"
                            id="publishCreatePost"
                            type="button"
                            disabled
                        >
                            Post
                        </button>

                    </div>

                </div>

            </div>
        `;

        document.body.appendChild(screen);

        const imageInput =
            document.createElement("input");

        imageInput.type = "file";
        imageInput.accept = "image/*";
        imageInput.hidden = true;
        imageInput.id = "arsImageInput";

        document.body.appendChild(imageInput);


        const videoInput =
            document.createElement("input");

        videoInput.type = "file";
        videoInput.accept = "video/*";
        videoInput.hidden = true;
        videoInput.id = "arsVideoInput";

        document.body.appendChild(videoInput);

        bindUI();
    }


    function bindUI() {

        document
            .getElementById("closeCreatePost")
            ?.addEventListener(
                "click",
                closeCreatePost
            );

        document
            .getElementById("createPostScreen")
            ?.addEventListener(
                "click",
                event => {

                    if (
                        event.target.id ===
                        "createPostScreen"
                    ) {
                        closeCreatePost();
                    }
                }
            );

        document
            .querySelectorAll(
                "[data-create-mode]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        setMode(
                            button.dataset.createMode
                        );
                    }
                );
            });


        document
            .getElementById("createImage")
            ?.addEventListener(
                "click",
                () => {
                    document
                        .getElementById(
                            "arsImageInput"
                        )
                        ?.click();
                }
            );


        document
            .getElementById("createVideo")
            ?.addEventListener(
                "click",
                () => {
                    document
                        .getElementById(
                            "arsVideoInput"
                        )
                        ?.click();
                }
            );


        document
            .getElementById("arsImageInput")
            ?.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files?.[0];

                    if (file) {
                        loadMedia(
                            file,
                            "image"
                        );
                    }
                }
            );


        document
            .getElementById("arsVideoInput")
            ?.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files?.[0];

                    if (file) {
                        loadMedia(
                            file,
                            "video"
                        );
                    }
                }
            );


        document
            .getElementById(
                "removeCreateMedia"
            )
            ?.addEventListener(
                "click",
                removeMedia
            );


        document
            .getElementById("createEmoji")
            ?.addEventListener(
                "click",
                addEmoji
            );


        document
            .getElementById("createPostText")
            ?.addEventListener(
                "input",
                updateCounter
            );


        document
            .getElementById(
                "publishCreatePost"
            )
            ?.addEventListener(
                "click",
                publish
            );


        document
            .querySelectorAll(
                ".create-post-option"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".create-post-option"
                            )
                            .forEach(item =>
                                item.classList.remove(
                                    "active"
                                )
                            );

                        button.classList.add(
                            "active"
                        );
                    }
                );
            });
    }


    function setMode(mode) {

        state.mode =
            mode === "story"
                ? "story"
                : "post";

        document
            .querySelectorAll(
                "[data-create-mode]"
            )
            .forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.createMode ===
                    state.mode
                );
            });

        const title =
            document.getElementById(
                "createPostTitle"
            );

        const subtitle =
            document.getElementById(
                "createPostSubtitle"
            );

        const publishButton =
            document.getElementById(
                "publishCreatePost"
            );

        const textarea =
            document.getElementById(
                "createPostText"
            );

        if (state.mode === "story") {

            title.textContent =
                "Create story";

            subtitle.textContent =
                "Share a moment for 24 hours";

            publishButton.textContent =
                "Add Story";

            textarea.placeholder =
                "Add something to your story...";

        } else {

            title.textContent =
                "Create post";

            subtitle.textContent =
                "Share something with ΛRS";

            publishButton.textContent =
                "Post";

            textarea.placeholder =
                "What's happening?";
        }

        updateCounter();
    }


    function openCreatePost(mode = "post") {

        ensureUI();

        reset();

        setMode(mode);

        updateUserPreview();

        document
            .getElementById(
                "createPostScreen"
            )
            ?.classList.add("open");

        document.body.style.overflow =
            "hidden";

        document
            .getElementById(
                "createPostText"
            )
            ?.focus();

        if (window.lucide) {
            lucide.createIcons();
        }
    }


    function closeCreatePost() {

        document
            .getElementById(
                "createPostScreen"
            )
            ?.classList.remove("open");

        document.body.style.overflow =
            "";
    }


    function reset() {

        state.media = null;
        state.mediaType = null;

        const textarea =
            document.getElementById(
                "createPostText"
            );

        if (textarea) {
            textarea.value = "";
        }

        const preview =
            document.getElementById(
                "createPostPreview"
            );

        if (preview) {
            preview.classList.remove(
                "show"
            );
        }

        const media =
            document.getElementById(
                "createPostMedia"
            );

        if (media) {
            media.innerHTML = "";
        }

        updateCounter();
    }


    function updateUserPreview() {

        const user = getUser();

        const avatar =
            document.getElementById(
                "createPostAvatar"
            );

        const name =
            document.getElementById(
                "createPostUserName"
            );

        if (!avatar) return;

        avatar.textContent =
            (
                user?.letter ||
                localStorage.getItem(
                    "ars_letter"
                ) ||
                "R"
            )
            .slice(0, 1)
            .toUpperCase();

        avatar.style.background =
            user?.background ||
            localStorage.getItem(
                "ars_background"
            ) ||
            "linear-gradient(135deg,#8b3dff,#ff4fb3)";

        avatar.style.color =
            user?.letterColor ||
            localStorage.getItem(
                "ars_letter_color"
            ) ||
            "#fff";

        if (user?.avatar) {

            avatar.innerHTML = `
                <img
                    src="${escapeAttr(user.avatar)}"
                    alt=""
                >
            `;
        }

        if (name) {
            name.textContent =
                user?.displayName ||
                user?.username ||
                "You";
        }
    }


    function loadMedia(file, type) {

        if (file.size > 30 * 1024 * 1024) {
            alert(
                "Please choose a file smaller than 30MB."
            );
            return;
        }

        const reader =
            new FileReader();

        reader.onload = () => {

            state.media =
                reader.result;

            state.mediaType =
                type;

            const preview =
                document.getElementById(
                    "createPostPreview"
                );

            const media =
                document.getElementById(
                    "createPostMedia"
                );

            if (!preview || !media) {
                return;
            }

            if (type === "image") {

                media.innerHTML = `
                    <img
                        src="${escapeAttr(
                            state.media
                        )}"
                        alt=""
                    >
                `;

            } else {

                media.innerHTML = `
                    <video
                        src="${escapeAttr(
                            state.media
                        )}"
                        controls
                        playsinline
                    ></video>
                `;
            }

            preview.classList.add(
                "show"
            );
        };

        reader.readAsDataURL(file);
    }


    function removeMedia() {

        state.media = null;
        state.mediaType = null;

        const preview =
            document.getElementById(
                "createPostPreview"
            );

        const media =
            document.getElementById(
                "createPostMedia"
            );

        if (preview) {
            preview.classList.remove(
                "show"
            );
        }

        if (media) {
            media.innerHTML = "";
        }

        const image =
            document.getElementById(
                "arsImageInput"
            );

        const video =
            document.getElementById(
                "arsVideoInput"
            );

        if (image) image.value = "";
        if (video) video.value = "";
    }


    function addEmoji() {

        const input =
            document.getElementById(
                "createPostText"
            );

        if (!input) return;

        const emoji =
            [
                "✨",
                "💜",
                "🔥",
                "😭",
                "😂",
                "😍",
                "🎀",
                "🫶",
                "😎"
            ][
                Math.floor(
                    Math.random() * 9
                )
            ];

        input.value += emoji;

        updateCounter();

        input.focus();
    }


    function updateCounter() {

        const input =
            document.getElementById(
                "createPostText"
            );

        const count =
            document.getElementById(
                "createPostCount"
            );

        const publish =
            document.getElementById(
                "publishCreatePost"
            );

        if (!input) return;

        const length =
            input.value.length;

        if (count) {
            count.textContent =
                `${length} / 1000`;
        }

        if (publish) {
            publish.disabled =
                length === 0 &&
                !state.media;
        }
    }


    function publish() {

        const input =
            document.getElementById(
                "createPostText"
            );

        if (!input) return;

        const text =
            input.value.trim();

        if (!text && !state.media) {
            return;
        }

        const user =
            getUser();

        const now =
            new Date();

        const id =
            `${state.mode}-${Date.now()}`;

        const base = {
            id,

            name:
                user?.displayName ||
                user?.username ||
                "You",

            username:
                user?.username
                    ? `@${user.username}`
                    : "@you",

            letter:
                (
                    user?.letter ||
                    getLetter()
                )
                .slice(0,1)
                .toUpperCase(),

            color:
                user?.letterColor ||
                localStorage.getItem(
                    "ars_letter_color"
                ) ||
                "#fff",

            gradient:
                user?.background ||
                localStorage.getItem(
                    "ars_backgro
