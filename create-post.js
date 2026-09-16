(() => {
  "use strict";

  const POST_KEY =
    "ars_local_posts";

  const STORY_KEY =
    "ars_local_stories";

  let selectedType = "post";
  let selectedFiles = [];

  function read(key, fallback) {
    try {
      const value =
        localStorage.getItem(key);

      return value
        ? JSON.parse(value)
        : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch {
      // Ignore storage errors.
    }
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function getUser() {
    try {
      return (
        JSON.parse(
          localStorage.getItem(
            "ars_user"
          )
        ) || {}
      );
    } catch {
      return {};
    }
  }

  function buildScreen() {
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

    screen.className =
      "create-post-screen";

    screen.innerHTML = `
      <div
        class="create-post-backdrop"
        data-create-close
      ></div>

      <section
        class="create-post-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Create"
      >

        <header class="create-post-header">

          <button
            type="button"
            class="create-post-close"
            data-create-close
            aria-label="Close"
          >
            ×
          </button>

          <div class="create-post-tabs">

            <button
              type="button"
              class="create-tab active"
              data-create-type="post"
            >
              Post
            </button>

            <button
              type="button"
              class="create-tab"
              data-create-type="story"
            >
              Story
            </button>

          </div>

          <button
            type="button"
            class="create-publish"
            id="createPublish"
          >
            Publish
          </button>

        </header>

        <div class="create-post-body">

          <div class="create-user-row">

            <div
              class="create-user-avatar"
              id="createUserAvatar"
            >
              R
            </div>

            <div>
              <strong id="createUserName">
                You
              </strong>

              <span>
                Share with ΛRS
              </span>
            </div>

          </div>

          <textarea
            id="createText"
            class="create-textarea"
            maxlength="1000"
            placeholder="What's happening?"
          ></textarea>

          <div
            id="createMediaPreview"
            class="create-media-preview"
          ></div>

          <div class="create-post-tools">

            <label
              class="create-tool"
              for="createMediaInput"
            >
              <i data-lucide="image"></i>
              <span>Media</span>
            </label>

            <input
              id="createMediaInput"
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
            >

            <button
              type="button"
              class="create-tool"
              id="createEmojiButton"
            >
              <i data-lucide="smile"></i>
              <span>Emoji</span>
            </button>

            <button
              type="button"
              class="create-tool"
              id="createHashtagButton"
            >
              <i data-lucide="hash"></i>
              <span>Hashtag</span>
            </button>

          </div>

          <div
            id="createNotice"
            class="create-notice"
          ></div>

        </div>

      </section>
    `;

    document.body.appendChild(screen);

    bindEvents();
    updateUserPreview();
    refreshIcons();
  }

  function bindEvents() {
    const screen =
      document.getElementById(
        "createPostScreen"
      );

    screen
      ?.querySelectorAll(
        "[data-create-close]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          closeCreatePost
        );
      });

    screen
      ?.querySelectorAll(
        "[data-create-type]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectedType =
              button.dataset.createType ||
              "post";

            screen
              .querySelectorAll(
                "[data-create-type]"
              )
              .forEach(item =>
                item.classList.remove(
                  "active"
                )
              );

            button.classList.add(
              "active"
            );

            updatePlaceholder();
            updateNotice();
          }
        );
      });

    document
      .getElementById(
        "createMediaInput"
      )
      ?.addEventListener(
        "change",
        event => {
          const files =
            [...(
              event.target.files || []
            )];

          selectedFiles =
            files.slice(0, 6);

          renderMediaPreview();
        }
      );

    document
      .getElementById(
        "createPublish"
      )
      ?.addEventListener(
        "click",
        publish
      );

    document
      .getElementById(
        "createEmojiButton"
      )
      ?.addEventListener(
        "click",
        () => {
          insertText("✨ ");
        }
      );

    document
      .getElementById(
        "createHashtagButton"
      )
      ?.addEventListener(
        "click",
        () => {
          insertText("#");
        }
      );
  }

  function updatePlaceholder() {
    const input =
      document.getElementById(
        "createText"
      );

    if (!input) {
      return;
    }

    input.placeholder =
      selectedType === "story"
        ? "Add something to your story..."
        : "What's happening?";
  }

  function updateNotice() {
    const notice =
      document.getElementById(
        "createNotice"
      );

    if (!notice) {
      return;
    }

    notice.textContent =
      selectedType === "story"
        ? "Stories disappear after 24 hours."
        : "You can add photos or videos to your post.";
  }

  function updateUserPreview() {
    const user =
      getUser();

    const avatar =
      document.getElementById(
        "createUserAvatar"
      );

    const name =
      document.getElementById(
        "createUserName"
      );

    if (name) {
      name.textContent =
        user.displayName ||
        "You";
    }

    if (!avatar) {
      return;
    }

    if (user.avatar) {
      avatar.innerHTML = `
        <img
          src="${escapeHTML(user.avatar)}"
          alt=""
        >
      `;

      avatar.style.background =
        "#18181d";

      return;
    }

    avatar.textContent =
      user.letter || "R";

    avatar.style.background =
      `linear-gradient(
        135deg,
        ${escapeHTML(
          user.letterColor ||
          "#8b3dff"
        )},
        ${escapeHTML(
          user.background ||
          "#c54dff"
        )}
      )`;
  }

  function insertText(text) {
    const textarea =
      document.getElementById(
        "createText"
      );

    if (!textarea) {
      return;
    }

    const start =
      textarea.selectionStart ??
      textarea.value.length;

    const end =
      textarea.selectionEnd ??
      textarea.value.length;

    textarea.value =
      textarea.value.slice(
        0,
        start
      ) +
      text +
      textarea.value.slice(
        end
      );

    textarea.focus();

    textarea.selectionStart =
      textarea.selectionEnd =
        start + text.length;
  }

  function renderMediaPreview() {
    const preview =
      document.getElementById(
        "createMediaPreview"
      );

    if (!preview) {
      return;
    }

    preview.innerHTML = "";

    selectedFiles.forEach(
      (file, index) => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "create-media-item";

        const remove =
          document.createElement(
            "button"
          );

        remove.type = "button";
        remove.className =
          "create-media-remove";
        remove.textContent = "×";

        remove.addEventListener(
          "click",
          () => {
            selectedFiles.splice(
              index,
              1
            );

            renderMediaPreview();
          }
        );

        const url =
          URL.createObjectURL(file);

        if (
          file.type.startsWith(
            "video/"
          )
        ) {
          item.innerHTML = `
            <video
              src="${url}"
              muted
              playsinline
            ></video>
          `;
        } else {
          item.innerHTML = `
            <img
              src="${url}"
              alt=""
            >
          `;
        }

        item.appendChild(
          remove
        );

        preview.appendChild(
          item
        );
      }
    );
  }

  function fileToDataURL(file) {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload =
          () => resolve(
            String(reader.result)
          );

        reader.onerror =
          reject;

        reader.readAsDataURL(file);
      }
    );
  }

  async function publish() {
    const textarea =
      document.getElementById(
        "createText"
      );

    const text =
      textarea?.value.trim() || "";

    if (
      !text &&
      selectedFiles.length === 0
    ) {
      showNotice(
        "Add text or media first."
      );

      return;
    }

    try {
      const media =
        [];

      for (
        const file of selectedFiles
      ) {
        media.push({
          type:
            file.type.startsWith(
              "video/"
            )
              ? "video"
              : "image",
          data:
            await fileToDataURL(file),
          name: file.name
        });
      }

      const user =
        getUser();

      const avatar =
        user.avatar || "";

      const gradient = [
        user.letterColor ||
          "#8b3dff",
        user.background ||
          "#c54dff"
      ];

      const base = {
        id: createId(
          selectedType
        ),
        name:
          user.displayName ||
          "You",
        username:
          user.username ||
          "you",
        letter:
          user.letter ||
          "R",
        avatar,
        gradient,
        verified: false,
        vip: false,
        time: "now",
        text,
        likes: 0,
        comments: 0,
        reposts: 0,
        views: 0,
        replies: []
      };

      if (
        selectedType === "story"
      ) {
        const firstImage =
          media.find(
            item =>
              item.type ===
              "image"
          );

        const firstVideo =
          media.find(
            item =>
              item.type ===
              "video"
          );

        const stories =
          read(
            STORY_KEY,
            []
          );

        stories.unshift({
          ...base,
          image:
            firstImage?.data || "",
          video:
            firstVideo?.data || "",
          expiresAt:
            Date.now() +
            86400000
        });

        write(
          STORY_KEY,
          stories
        );

        document.dispatchEvent(
          new CustomEvent(
            "ars:story-created"
          )
        );
      } else {
        const firstImage =
          media.find(
            item =>
              item.type ===
              "image"
          );

        const firstVideo =
          media.find(
            item =>
              item.type ===
              "video"
          );

        const posts =
          read(
            POST_KEY,
            []
          );

        posts.unshift({
          ...base,
          images:
            media
              .filter(
                item =>
                  item.type ===
                  "image"
              )
              .map(
                item =>
                  item.data
              ),
          videos:
            media
              .filter(
                item =>
                  item.type ===
                  "video"
              )
              .map(
                item =>
                  item.data
              ),
          image:
            firstImage?.data || "",
          video:
            firstVideo?.data || ""
        });

        write(
          POST_KEY,
          posts
        );

        document.dispatchEvent(
          new CustomEvent(
            "ars:post-created"
          )
        );
      }

      closeCreatePost();
    } catch (error) {
      console.error(
        "ΛRS create error:",
        error
      );

      showNotice(
        "Could not create this content."
      );
    }
  }

  function showNotice(message) {
    const notice =
      document.getElementById(
        "createNotice"
      );

    if (notice) {
      notice.textContent =
        message;
    }
  }

  function openCreatePost(
    type = "post"
  ) {
    buildScreen();

    selectedType =
      type === "story"
        ? "story"
        : "post";

    selectedFiles = [];

    const screen =
      document.getElementById(
        "createPostScreen"
      );

    screen?.classList.add(
      "show"
    );

    screen
      ?.querySelectorAll(
        "[data-create-type]"
      )
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.createType ===
            selectedType
        );
      });

    const textarea =
      document.getElementById(
        "createText"
      );

    if (textarea) {
      textarea.value = "";
    }

    const input =
      document.getElementById(
        "createMediaInput"
      );

    if (input) {
      input.value = "";
    }

    renderMediaPreview();
    updatePlaceholder();
    updateNotice();
    updateUserPreview();
  }

  function closeCreatePost() {
    document
      .getElementById(
        "createPostScreen"
      )
      ?.classList.remove(
        "show"
      );
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.openCreatePost =
    openCreatePost;

  window.closeCreatePost =
    closeCreatePost;

  window.ARSCreatePost = {
    open: openCreatePost,
    close: closeCreatePost
  };

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      refreshIcons,
      { once: true }
    );
  } else {
    refreshIcons();
  }
})();
