(() => {
    "use strict";

    let createPostScreen = null;
    let mediaInput = null;

    const createPostState = {
        mode: "post",
        mediaFile: null,
        mediaUrl: null,
        mediaType: null
    };

    function getUser() {
        try {
            const user = JSON.parse(localStorage.getItem("ars_user"));
            if (user) return user;
        } catch (error) {}

        return {
            displayName: "You",
            username: "you",
            email: "",
            letter: localStorage.getItem("ars_letter") || "R"
        };
    }

    function escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getLetter() {
        return localStorage.getItem("ars_letter") ||
            getUser().letter ||
            getUser().displayName?.charAt(0) ||
            "R";
    }

    function getAvatarColor() {
        return localStorage.getItem("ars_letter_color") ||
            "linear-gradient(135deg, #8B3DFF, #C54DFF)";
    }

    function getBackgroundColor() {
        return localStorage.getItem("ars_background") ||
            "linear-gradient(135deg, #18181D, #292936)";
    }

    function createScreen() {
        if (createPostScreen) return;

        createPostScreen = document.createElement("div");
        createPostScreen.id = "createPostScreen";
        createPostScreen.className = "create-post-screen";
        createPostScreen.innerHTML = `
            <div class="create-post-backdrop"></div>

            <div class="create-post-container">

                <header class="create-post-header">
                    <button
                        type="button"
                        class="create-post-close"
                        id="createPostClose"
                        aria-label="Close"
                    >
                        ×
                    </button>

                    <div class="create-post-title">
                        <h2 id="createPostTitle">Create Post</h2>
                        <span id="createPostSubtitle">Share something with your followers</span>
                    </div>

                    <button
                        type="button"
                        class="create-post-publish"
                        id="createPostPublish"
                    >
                        Post
                    </button>
                </header>

                <div class="create-post-tabs">
                    <button
                        type="button"
                        class="create-post-tab active"
                        data-create-mode="post"
                    >
                        Post
                    </button>

                    <button
                        type="button"
                        class="create-post-tab"
                        data-create-mode="story"
                    >
                        Story
                    </button>
                </div>

                <main class="create-post-body">

                    <div class="create-post-user">
                        <div
                            class="create-post-avatar"
                            id="createPostAvatar"
                        >
                            R
                        </div>

                        <div class="create-post-user-info">
                            <strong id="createPostUserName">You</strong>
                            <span id="createPostUserHandle">@you</span>
                        </div>
                    </div>

                    <textarea
                        id="createPostText"
                        class="create-post-textarea"
                        maxlength="1000"
                        placeholder="What's happening?"
                    ></textarea>

                    <div
                        id="createPostMediaPreview"
                        class="create-post-media-preview"
                    ></div>

                    <div class="create-post-actions">

                        <button
                            type="button"
                            class="create-post-tool"
                            id="createPostMediaButton"
                        >
                            <i data-lucide="image"></i>
                            <span>Media</span>
                        </button>

                        <button
                            type="button"
                            class="create-post-tool"
                            id="createPostCameraButton"
                        >
                            <i data-lucide="camera"></i>
                            <span>Camera</span>
                        </button>

                        <button
                            type="button"
                            class="create-post-tool"
                            id="createPostEmojiButton"
                        >
                            <i data-lucide="smile"></i>
                            <span>Emoji</span>
                        </button>

                    </div>

                    <div class="create-post-settings">

                        <div class="create-post-setting-row">
                            <div class="create-post-setting-icon">
                                <i data-lucide="globe-2"></i>
                            </div>

                            <div class="create-post-setting-info">
                                <strong>Visibility</strong>
                                <span>Everyone can see this</span>
                            </div>

                            <select id="createPostVisibility">
                                <option value="public">Everyone</option>
                                <option value="followers">Followers</option>
                                <option value="private">Only me</option>
                            </select>
                        </div>

                        <div class="create-post-setting-row">
                            <div class="create-post-setting-icon">
                                <i data-lucide="sparkles"></i>
                            </div>

                            <div class="create-post-setting-info">
                                <strong>Feelings</strong>
                                <span>Add a feeling to your post</span>
                            </div>

                            <select id="createPostFeeling">
                                <option value="">None</option>
                                <option value="happy">Happy</option>
                                <option value="excited">Excited</option>
                                <option value="love">In love</option>
                                <option value="proud">Proud</option>
                                <option value="grateful">Grateful</option>
                                <option value="chill">Chill</option>
                            </select>
                        </div>

                    </div>

                    <div
                        id="createPostCharacterCount"
                        class="create-post-character-count"
                    >
                        0 / 1000
                    </div>

                </main>
            </div>
        `;

        document.body.appendChild(createPostScreen);

        mediaInput = document.createElement("input");
        mediaInput.type = "file";
        mediaInput.id = "createPostMediaInput";
        mediaInput.accept = "image/*,video/*";
        mediaInput.hidden = true;

        document.body.appendChild(mediaInput);

        bindEvents();
        updateUserPreview();
        updateCharacterCount();
        refreshIcons();
    }

    function refreshIcons() {
        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {
            window.lucide.createIcons();
        }
    }

    function bindEvents() {
        const closeButton = document.getElementById("createPostClose");
        const backdrop = createPostScreen.querySelector(
            ".create-post-backdrop"
        );

        closeButton?.addEventListener("click", closeCreatePost);
        backdrop?.addEventListener("click", closeCreatePost);

        document
            .getElementById("createPostPublish")
            ?.addEventListener("click", publishContent);

        document
            .getElementById("createPostMediaButton")
            ?.addEventListener("click", openMediaPicker);

        document
            .getElementById("createPostCameraButton")
            ?.addEventListener("click", openMediaPicker);

        document
            .getElementById("createPostEmojiButton")
            ?.addEventListener("click", insertEmoji);

        document
            .getElementById("createPostText")
            ?.addEventListener("input", updateCharacterCount);

        createPostScreen
            .querySelectorAll("[data-create-mode]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    switchMode(button.dataset.createMode);
                });
            });

        mediaInput?.addEventListener("change", handleMediaSelection);

        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                createPostScreen?.classList.contains("open")
            ) {
                closeCreatePost();
            }
        });
    }

    function updateUserPreview() {
        const user = getUser();

        const avatar = document.getElementById("createPostAvatar");
        const name = document.getElementById("createPostUserName");
        const handle = document.getElementById("createPostUserHandle");

        if (!avatar) return;

        const letter = escapeHTML(
            String(getLetter()).charAt(0).toUpperCase()
        );

        avatar.textContent = letter;
        avatar.style.background = getBackgroundColor();
        avatar.style.setProperty("--avatar-gradient", getAvatarColor());

        if (user.displayName) {
            name.textContent = user.displayName;
        }

        if (user.username) {
            handle.textContent = `@${user.username}`;
        }
    }

    function switchMode(mode) {
        createPostState.mode = mode;

        const title = document.getElementById("createPostTitle");
        const subtitle = document.getElementById("createPostSubtitle");
        const publish = document.getElementById("createPostPublish");
        const textarea = document.getElementById("createPostText");

        createPostScreen
            .querySelectorAll("[data-create-mode]")
            .forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.createMode === mode
                );
            });

        if (mode === "story") {
            title.textContent = "Create Story";
            subtitle.textContent = "Share something for 24 hours";
            publish.textContent = "Share";
            textarea.placeholder = "Write something for your story...";
        } else {
            title.textContent = "Create Post";
            subtitle.textContent = "Share something with your followers";
            publish.textContent = "Post";
            textarea.placeholder = "What's happening?";
        }
    }

    function openCreatePost(mode = "post") {
        createScreen();

        resetCreatePost();

        switchMode(mode);

        updateUserPreview();

        requestAnimationFrame(() => {
            createPostScreen.classList.add("open");
            document.body.classList.add("create-post-open");

            const textarea = document.getElementById("createPostText");
            setTimeout(() => textarea?.focus(), 100);
        });
    }

    function closeCreatePost() {
        if (!createPostScreen) return;

        createPostScreen.classList.remove("open");
        document.body.classList.remove("create-post-open");

        setTimeout(() => {
            if (!createPostScreen) return;
            resetCreatePost();
        }, 250);
    }

    function resetCreatePost() {
        createPostState.mode = "post";
        createPostState.mediaFile = null;
        createPostState.mediaType = null;

        if (createPostState.mediaUrl) {
            try {
                URL.revokeObjectURL(createPostState.mediaUrl);
            } catch (error) {}
        }

        createPostState.mediaUrl = null;

        const textarea = document.getElementById("createPostText");
        const visibility = document.getElementById("createPostVisibility");
        const feeling = document.getElementById("createPostFeeling");
        const preview = document.getElementById("createPostMediaPreview");

        if (textarea) textarea.value = "";
        if (visibility) visibility.value = "public";
        if (feeling) feeling.value = "";
        if (preview) preview.innerHTML = "";

        updateCharacterCount();

        if (mediaInput) {
            mediaInput.value = "";
        }
    }

    function openMediaPicker() {
        if (!mediaInput) {
            createScreen();
        }

        mediaInput?.click();
    }

    function handleMediaSelection(event) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/") &&
            !file.type.startsWith("video/")) {
            showCreateToast("Please select an image or video.");
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            showCreateToast("The file is too large. Maximum is 50MB.");
            return;
        }

        if (createPostState.mediaUrl) {
            try {
                URL.revokeObjectURL(createPostState.mediaUrl);
            } catch (error) {}
        }

        createPostState.mediaFile = file;
        createPostState.mediaType = file.type.startsWith("video/")
            ? "video"
            : "image";

        createPostState.mediaUrl = URL.createObjectURL(file);

        renderMediaPreview();
    }

    function renderMediaPreview() {
        const preview = document.getElementById(
            "createPostMediaPreview"
        );

        if (!preview) return;

        preview.innerHTML = "";

        if (!createPostState.mediaUrl) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "create-post-media-wrapper";

        let mediaElement;

        if (createPostState.mediaType === "video") {
            mediaElement = document.createElement("video");
            mediaElement.src = createPostState.mediaUrl;
            mediaElement.controls = true;
            mediaElement.playsInline = true;
        } else {
            mediaElement = document.createElement("img");
            mediaElement.src = createPostState.mediaUrl;
            mediaElement.alt = "Selected media";
        }

        mediaElement.className = "create-post-selected-media";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "create-post-remove-media";
        removeButton.innerHTML = "×";
        removeButton.setAttribute("aria-label", "Remove media");

        removeButton.addEventListener("click", removeMedia);

        wrapper.appendChild(mediaElement);
        wrapper.appendChild(removeButton);
        preview.appendChild(wrapper);
    }

    function removeMedia() {
        if (createPostState.mediaUrl) {
            try {
                URL.revokeObjectURL(createPostState.mediaUrl);
            } catch (error) {}
        }

        createPostState.mediaFile = null;
        createPostState.mediaUrl = null;
        createPostState.mediaType = null;

        const preview = document.getElementById(
            "createPostMediaPreview"
        );

        if (preview) {
            preview.innerHTML = "";
        }

        if (mediaInput) {
            mediaInput.value = "";
        }
    }

    function insertEmoji() {
        const textarea = document.getElementById("createPostText");

        if (!textarea) return;

        const emojis = [
            "✨",
            "💜",
            "🔥",
            "😍",
            "😂",
            "🥹",
            "💫",
            "🫶",
            "🎀",
            "🌙"
        ];

        const emoji =
            emojis[Math.floor(Math.random() * emojis.length)];

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        textarea.value =
            textarea.value.substring(0, start) +
            emoji +
            textarea.value.substring(end);

        textarea.selectionStart = start + emoji.length;
        textarea.selectionEnd = start + emoji.length;

        updateCharacterCount();
        textarea.focus();
    }

    function updateCharacterCount() {
        const textarea = document.getElementById("createPostText");
        const counter = document.getElementById(
            "createPostCharacterCount"
        );

        if (!textarea || !counter) return;

        counter.textContent =
            `${textarea.value.length} / 1000`;
    }

    async function publishContent() {
        const textarea = document.getElementById("createPostText");
        const visibility =
            document.getElementById("createPostVisibility")?.value ||
            "public";

        const feeling =
            document.getElementById("createPostFeeling")?.value ||
            "";

        const text = textarea?.value.trim() || "";

        if (!text && !createPostState.mediaFile) {
            showCreateToast(
                createPostState.mode === "story"
                    ? "Add text or media to your story."
                    : "Add text or media to your post."
            );
            return;
        }

        const publishButton =
            document.getElementById("createPostPublish");

        if (publishButton) {
            publishButton.disabled = true;
            publishButton.textContent =
                createPostState.mode === "story"
                    ? "Sharing..."
                    : "Posting...";
        }

        try {
            if (createPostState.mode === "story") {
                await createStory(text, visibility, feeling);
            } else {
                await createPost(text, visibility, feeling);
            }

            closeCreatePost();
        } catch (error) {
            console.error("Create content error:", error);

            showCreateToast(
                "Something went wrong. Please try again."
            );
        } finally {
            if (publishButton) {
                publishButton.disabled = false;

                publishButton.textContent =
                    createPostState.mode === "story"
                        ? "Share"
                        : "Post";
            }
        }
    }

    async function createPost(text, visibility, feeling) {
        const user = getUser();

        let media = null;

        if (
            createPostState.mediaFile &&
            createPostState.mediaType === "image"
        ) {
            media = await fileToDataURL(
                createPostState.mediaFile
            );
        }

        const post = {
            id: `local-post-${Date.now()}`,
            author: {
                name: user.displayName || "You",
                username: user.username || "you",
                letter: getLetter()
            },
            text,
            image: media,
            video: null,
            visibility,
            feeling,
            time: "Just now",
            likes: 0,
            comments: [],
            reposts: 0,
           
