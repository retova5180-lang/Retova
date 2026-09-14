(() => {
  "use strict";

  const POST_KEY = "ars_local_posts";
  const STORY_KEY = "ars_local_stories";

  let mediaFile = null;
  let mode = "post";


  const $ =
    selector =>
      document.querySelector(
        selector
      );


  const read =
    (key, fallback) => {

      try {

        return (
          JSON.parse(
            localStorage.getItem(
              key
            )
          ) ?? fallback
        );

      }

      catch {

        return fallback;

      }

    };


  const write =
    (key, value) => {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

    };


  function user() {

    try {

      return (
        JSON.parse(
          localStorage.getItem(
            "ars_user"
          )
        ) || {}
      );

    }

    catch {

      return {};

    }

  }


  /* -----------------------------
     BUILD
  ----------------------------- */

  function build() {

    if (
      $("#createPostOverlay")
    ) {

      return;

    }


    const overlay =
      document.createElement(
        "div"
      );


    overlay.id =
      "createPostOverlay";


    overlay.className =
      "create-post-overlay";


    overlay.innerHTML = `

      <div class="create-post-modal">

        <div class="create-post-head">

          <h2 id="createTitle">
            Create Post
          </h2>

          <button
            id="createClose"
            class="create-post-close"
            type="button"
          >
            ×
          </button>

        </div>


        <div class="create-post-tabs">

          <button
            class="create-post-tab active"
            data-mode="post"
            type="button"
          >
            Post
          </button>

          <button
            class="create-post-tab"
            data-mode="story"
            type="button"
          >
            Story
          </button>

        </div>


        <textarea
          id="createText"
          maxlength="1000"
          placeholder="What's happening?"
        ></textarea>


        <div
          id="createPreview"
          class="create-media-preview"
        ></div>


        <div class="create-post-options">

          <label class="create-option">

            <input
              id="commentsAllowed"
              type="checkbox"
              checked
            >

            Comments

          </label>


          <label class="create-option">

            <input
              id="repostsAllowed"
              type="checkbox"
              checked
            >

            Reposts

          </label>

        </div>


        <div class="create-post-bottom">

          <label
            class="create-media-label"
          >

            Add photo/video

            <input
              id="createMedia"
              type="file"
              accept="image/*,video/*"
            >

          </label>


          <button
            id="createSubmit"
            class="create-post-submit"
            type="button"
          >
            Publish
          </button>

        </div>

      </div>

    `;


    document.body.appendChild(
      overlay
    );


    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          overlay ||
          event.target.id ===
          "createClose"
        ) {

          closeCreate();

        }

      }
    );


    overlay
      .querySelectorAll(
        "[data-mode]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              setMode(
                button.dataset.mode
              )
          );

        }
      );


    $("#createMedia", overlay)
      .addEventListener(
        "change",
        preview
      );


    $("#createSubmit", overlay)
      .addEventListener(
        "click",
        publish
      );

  }


  /* -----------------------------
     MODE
  ----------------------------- */

  function setMode(
    newMode
  ) {

    mode =
      newMode;


    $("#createTitle")
      .textContent =
      mode === "story"
        ? "Create Story"
        : "Create Post";


    document
      .querySelectorAll(
        ".create-post-tab"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "active",
            button.dataset.mode ===
              mode
          );

        }
      );


    $("#createText")
      .placeholder =
      mode === "story"
        ? "Add something to your story..."
        : "What's happening?";

  }


  /* -----------------------------
     OPEN
  ----------------------------- */

  function openCreate(
    newMode = "post"
  ) {

    build();


    mediaFile =
      null;


    $("#createText")
      .value = "";


    $("#createMedia")
      .value = "";


    $("#createPreview")
      .innerHTML = "";


    $("#createPreview")
      .classList.remove(
        "show"
      );


    setMode(
      newMode
    );


    $("#createPostOverlay")
      .classList.add(
        "open"
      );


    $("#createText")
      .focus();

  }


  function closeCreate() {

    $("#createPostOverlay")
      ?.classList.remove(
        "open"
      );

  }


  /* -----------------------------
     PREVIEW
  ----------------------------- */

  function preview(
    event
  ) {

    mediaFile =
      event.target.files?.[0] ||
      null;


    const box =
      $("#createPreview");


    box.innerHTML =
      "";


    if (!mediaFile) {

      box.classList.remove(
        "show"
      );

      return;

    }


    const url =
      URL.createObjectURL(
        mediaFile
      );


    if (
      mediaFile.type
        .startsWith(
          "video/"
        )
    ) {

      box.innerHTML = `

        <video
          controls
          playsinline
          src="${url}"
        ></video>

      `;

    }

    else {

      box.innerHTML = `

        <img
          src="${url}"
          alt="Preview"
        >

      `;

    }


    box.classList.add(
      "show"
    );

  }


  /* -----------------------------
     FILE TO DATA URL
  ----------------------------- */

  function toDataURL(
    file
  ) {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        if (!file) {

          resolve("");

          return;

        }


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


  /* -----------------------------
     PUBLISH
  ----------------------------- */

  async function publish() {

    const text =
      $("#createText")
        .value
        .trim();


    if (
      !text &&
      !mediaFile
    ) {

      return;

    }


    const u =
      user();


    const media =
      await toDataURL(
        mediaFile
      );


    const base = {

      name:
        u.displayName ||
        "You",

      username:
        u.username ||
        "you",

      letter:
        u.letter ||
        "R",

      gradient:
        [
          u.letterColor ||
            "#8b3dff",

          u.background ||
            "#c54dff"
        ],

      avatar:
        u.avatar ||
        "",

      text,

      time:
        "now",

      likes: 0,

      comments: 0,

      reposts: 0,

      views: 0,

      replies: []

    };


    /* STORY */

    if (
      mode ===
      "story"
    ) {

      const stories =
        read(
          STORY_KEY,
          []
        );


      stories.unshift({

        id:
          "local-story-" +
          Date.now(),

        ...base,

        image:
          mediaFile?.type
            .startsWith(
              "image/"
            )
            ? media
            : "",

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

    }


    /* POST */

    else {

      const posts =
        read(
          POST_KEY,
          []
        );


      posts.unshift({

        id:
          "local-post-" +
          Date.now(),

        ...base,

        image:
          mediaFile?.type
            .startsWith(
              "image/"
            )
            ? media
            : "",

        video:
          mediaFile?.type
            .startsWith(
              "video/"
            )
            ? media
            : ""

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


    closeCreate();

  }


  window.openCreatePost =
    openCreate;


  window.closeCreatePost =
    closeCreate;

})();
