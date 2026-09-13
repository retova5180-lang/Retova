(() => {
  "use strict";

  const POST_KEY =
    "ars_local_posts";

  const STORY_KEY =
    "ars_local_stories";

  const state = {
    mode: "post",
    media: [],
    maxMedia: 6
  };

  const user = () => {
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
  };

  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#039;",
          '"': "&quot;"
        })[char]
    );

  const read = (
    key
  ) => {
    try {
      return (
        JSON.parse(
          localStorage.getItem(
            key
          )
        ) || []
      );
    } catch {
      return [];
    }
  };

  const write = (
    key,
    value
  ) => {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  };

  function reset() {
    state.mode =
      "post";

    state.media.forEach(
      (media) => {
        if (media.url) {
          URL.revokeObjectURL(
            media.url
          );
        }
      }
    );

    state.media = [];
  }

  function getUserProfile() {
    const u = user();

    return {
      name:
        u.displayName ||
        u.name ||
        "You",

      username:
        u.username ||
        "you",

      letter:
        u.letter ||
        "R",

      gradient: [
        u.letterColor ||
          "#8B3DFF",

        u.background ||
          "#C54DFF"
      ]
    };
  }

  function openCreatePost(
    mode = "post"
  ) {
    const old =
      document.getElementById(
        "createPostScreen"
      );

    if (old) {
      old.remove();
    }

    reset();

    state.mode =
      mode;

    render();

    document.body.classList.add(
      "create-post-open"
    );
  }

  function closeCreatePost() {
    const element =
      document.getElementById(
        "createPostScreen"
      );

    if (element) {
      element.remove();
    }

    state.media.forEach(
      (media) => {
        if (media.url) {
          URL.revokeObjectURL(
            media.url
          );
        }
      }
    );

    state.media = [];

    document.body.classList.remove(
      "create-post-open"
    );
  }

  function render() {
    const u =
      getUserProfile();

    const element =
      document.createElement(
        "div"
      );

    element.id =
      "createPostScreen";

    element.className =
      "create-post-screen active";

    element.innerHTML = `
      <div class="create-post-container">

        <header class="create-post-header">

          <button
            class="create-close"
            id="cpClose"
            type="button"
          >
            <i data-lucide="x"></i>
          </button>

          <h1 id="cpTitle">
            ${
              state.mode === "story"
                ? "Create Story"
                : "Create Post"
            }
          </h1>

          <button
            class="publish-button"
            id="cpPublish"
            type="button"
            disabled
          >
            Publish
          </button>

        </header>


        <div class="cp-tabs">

          <button
            data-mode="post"
            class="${
              state.mode === "post"
                ? "active"
                : ""
            }"
          >
            Post
          </button>

          <button
            data-mode="story"
            class="${
              state.mode === "story"
                ? "active"
                : ""
            }"
          >
            Story
          </button>

        </div>


        <section class="create-user">

          <div
            class="create-avatar"
            style="
              background:
                linear-gradient(
                  135deg,
                  ${escapeHTML(
                    u.gradient[0]
                  )},
                  ${escapeHTML(
                    u.gradient[1]
                  )}
                )
            "
          >
            ${escapeHTML(
              u.letter
            )}
          </div>

          <div class="create-user-info">

            <div class="create-user-name">
              ${escapeHTML(
                u.name
              )}
            </div>

            <div class="visibility-button">
              Public
            </div>

          </div>

        </section>


        <section class="create-text-section">

          <textarea
            id="cpText"
            maxlength="280"
            placeholder="${
              state.mode === "story"
                ? "Write a story..."
                : "What's on your mind?"
            }"
          ></textarea>

          <div class="character-counter">
            <span id="cpCount">
              0
            </span>
            /280
          </div>

        </section>


        <section class="media-section">

          <div
            id="cpPreview"
            class="media-preview"
          ></div>

          <div
            id="cpMediaCount"
            class="media-count"
          >
            0/${state.maxMedia} media
          </div>

        </section>


        <section class="media-actions">

          <button
            class="media-action"
            data-pick="image"
            type="button"
          >
            <i data-lucide="image"></i>
            <span>Photo</span>
          </button>

          <button
            class="media-action"
            data-pick="video"
            type="button"
          >
            <i data-lucide="video"></i>
            <span>Video</span>
          </button>

          <button
            class="media-action"
            data-emoji="😀"
            type="button"
          >
            <i data-lucide="smile"></i>
            <span>Emoji</span>
          </button>

        </section>


        <section class="post-settings">

          <div class="setting-row">

            <div class="setting-left">
              <i
                class="setting-icon"
                data-lucide="message-circle"
              ></i>

              <span>
                Allow replies
              </span>
            </div>

            <button
              class="toggle active"
              id="cpReplies"
              type="button"
            >
              <span></span>
            </button>

          </div>


          <div class="setting-row">

            <div class="setting-left">

              <i
                class="setting-icon"
                data-lucide="repeat-2"
              ></i>

              <span>
                Allow reposts
              </span>

            </div>

            <button
              class="toggle active"
              id="cpReposts"
              type="button"
            >
              <span></span>
            </button>

          </div>

        </section>


        <input
          id="cpFile"
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
        />

      </div>
    `;

    document.body.appendChild(
      element
    );

    if (window.lucide) {
      window.lucide.createIcons();
    }

    bind();
    update();
  }

  function bind() {
    const root =
      document.getElementById(
        "createPostScreen"
      );

    root.addEventListener(
      "click",
      (event) => {

        const mode =
          event.target.closest(
            "[data-mode]"
          );

        if (mode) {
          state.mode =
            mode.dataset.mode;

          openCreatePost(
            state.mode
          );

          return;
        }


        if (
          event.target.closest(
            "#cpClose"
          )
        ) {
          closeCreatePost();
          return;
        }


        const pick =
          event.target.closest(
            "[data-pick]"
          );

        if (pick) {
          document
            .getElementById(
              "cpFile"
            )
            .click();

          return;
        }


        const emoji =
          event.target.closest(
            "[data-emoji]"
          );

        if (emoji) {

          const text =
            document.getElementById(
              "cpText"
            );

          text.value +=
            emoji.dataset.emoji;

          text.dispatchEvent(
            new Event(
              "input"
            )
          );

          text.focus();

          return;
        }


        const remove =
          event.target.closest(
            "[data-remove]"
          );

        if (remove) {

          const index =
            Number(
              remove.dataset.remove
            );

          const media =
            state.media[index];

          if (media?.url) {
            URL.revokeObjectURL(
              media.url
            );
          }

          state.media.splice(
            index,
            1
          );

          renderPreview();
          update();
        }

      }
    );


    document
      .getElementById(
        "cpText"
      )
      .addEventListener(
        "input",
        update
      );


    document
      .getElementById(
        "cpFile"
      )
      .addEventListener(
        "change",
        (event) => {

          addMedia(
            [
              ...event.target.files
            ]
          );

          event.target.value =
            "";
        }
      );


    document
      .getElementById(
        "cpPublish"
      )
      .addEventListener(
        "click",
        publish
      );


    [
      "cpReplies",
      "cpReposts"
    ].forEach(
      (id) => {

        document
          .getElementById(
            id
          )
          .addEventListener(
            "click",
            (event) => {
              event.currentTarget.classList.toggle(
                "active"
              );
            }
          );

      }
    );
  }

  function addMedia(
    files
  ) {

    for (
      const file of files
    ) {

      if (
        state.media.length >=
        state.maxMedia
      ) {
        break;
      }

      if (
        !file.type.startsWith(
          "image/"
        ) &&
        !file.type.startsWith(
          "video/"
        )
      ) {
        continue;
      }

      state.media.push({
        type:
          file.type.startsWith(
            "video/"
          )
            ? "video"
            : "image",

        url:
          URL.createObjectURL(
            file
          ),

        file
      });
    }

    renderPreview();
    update();
  }

  function renderPreview() {
    const box =
      document.getElementById(
        "cpPreview"
      );

    if (!box) return;

    box.innerHTML =
      state.media
        .map(
          (media, index) => `
            <div class="media-item">

              ${
                media.type ===
                "image"
                  ? `
                    <img
                      src="${media.url}"
                      alt=""
                    >
                  `
                  : `
                    <video
                      src="${media.url}"
                      controls
                    ></video>
                  `
              }

              <button
                class="remove-media"
                type="button"
                data-remove="${index}"
              >
                ×
              </button>

            </div>
          `
        )
        .join("");

    document.getElementById(
      "cpMediaCount"
    ).textContent =
      `${state.media.length}/${state.maxMedia} media`;
  }

  function update() {
    const text =
      document.getElementById(
        "cpText"
      );

    const button =
      document.getElementById(
        "cpPublish"
      );

    if (!text || !button) {
      return;
    }

    document.getElementById(
      "cpCount"
    ).textContent =
      text.value.length;

    button.disabled =
      !text.value.trim() &&
      !state.media.length;
  }

  function fileToDataURL(
    file
  ) {
    return new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader();

        reader.onload =
          () =>
            resolve(
              reader.result
            );

        reader.onerror =
          reject;

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  async function publish() {

    const text =
      document.getElementById(
        "cpText"
      );

    const button =
      document.getElementById(
        "cpPublish"
      );

    const cleanText =
      text.value.trim();

    if (
      !cleanText &&
      !state.media.length
    ) {
      return;
    }

    button.disabled =
      true;

    try {

      const u =
        getUserProfile();

      const storedMedia =
        await Promise.all(
          state.media.map(
            async (media) => ({
              type:
                media.type,

              url:
                await fileToDataURL(
                  media.file
                )
            })
          )
        );


      const base = {
        id:
          `local-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,

        name:
          u.name,

        username:
          u.username,

        letter:
          u.letter,

        gradient:
          u.gradient,

        verified:
          false,

        vip:
          false,

        time:
          "now",

        text:
          cleanText,

        likes:
          0,

        comments:
          0,

        reposts:
          0,

        views:
          0,

        images:
          storedMedia
            .filter(
              (item) =>
                item.type ===
                "image"
            )
            .map(
              (item) =>
                item.url
            ),

        videos:
          storedMedia
            .filter(
              (item) =>
                item.type ===
                "video"
            )
            .map(
              (item) =>
                item.url
            ),

        replies:
          [],

        allowReplies:
          document
            .getElementById(
              "cpReplies"
            )
            .classList.contains(
              "active"
            ),

        allowReposts:
          document
            .getElementById(
              "cpReposts"
            )
            .classList.contains(
              "active"
            )
      };


      if (
        state.mode ===
        "story"
      ) {

        const storyList =
          read(
            STORY_KEY
          );

        storyList.unshift({
          ...base,

          id:
            `story-${base.id}`,

          expiresAt:
            Date.now() +
            86400000
        });

        write(
          STORY_KEY,
          storyList
        );

        document.dispatchEvent(
          new CustomEvent(
            "ars:story-created",
            {
              detail:
                base
            }
          )
        );

      } else {

        const posts =
          read(
            POST_KEY
          );

        posts.unshift(
          base
        );

        write(
          POST_KEY,
          posts
        );

        document.dispatchEvent(
          new CustomEvent(
            "ars:post-created",
            {
              detail:
                base
            }
          )
        );
      }

      closeCreatePost();

    } catch (error) {

      console.error(
        "ΛRS: media could not be saved.",
        error
      );

      button.disabled =
        false;

      alert(
        "Could not save this post. Please try again."
      );
    }
  }

  window.openCreatePost =
    openCreatePost;

  window.closeCreatePost =
    closeCreatePost;

})();
