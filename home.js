(() => {

  "use strict";


  /* =========================
     SUPABASE
  ========================== */

  const SUPABASE_URL =
    "https://bfqsqgfyyewnfxekirfv.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

  const supabaseClient =
    window.supabase?.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );


  /* =========================
     LOCAL USER
  ========================== */

  let user = {};

  try {

    user =
      JSON.parse(
        localStorage.getItem("ars_user") || "{}"
      );

  } catch {

    user = {};

  }


  const profile = {

    letter:
      user.letter ||
      localStorage.getItem("ars_letter") ||
      "R",

    letterColor:
      user.letterColor ||
      localStorage.getItem("ars_letter_color") ||
      "#ffffff",

    background:
      user.background ||
      localStorage.getItem("ars_background") ||
      "linear-gradient(135deg,#8b3dff,#c54dff)",

    displayName:
      user.displayName ||
      "Your Name",

    username:
      user.username ||
      "username",

    plan:
      user.plan ||
      "free",

    streak:
      Number(user.streak || 0)

  };


  /* =========================
     DATA
  ========================== */

  const stories = [

    {
      name: "You",
      letter: profile.letter,
      own: true
    },

    {
      name: "Lina",
      letter: "L"
    },

    {
      name: "Noah",
      letter: "N"
    },

    {
      name: "Sara",
      letter: "S"
    },

    {
      name: "Maya",
      letter: "M"
    },

    {
      name: "Adam",
      letter: "A"
    },

    {
      name: "Omar",
      letter: "O"
    }

  ];


  const posts = [

    {
      name: "Lina",
      username: "lina",
      letter: "L",
      time: "12m",
      verified: false,
      text:
        "Sunset always hits different 💜",
      media: "◒",
      likes: "2.4K",
      comments: "186",
      reposts: "312",
      views: "48K"
    },

    {
      name: "Noah",
      username: "noah",
      letter: "N",
      time: "28m",
      verified: false,
      text:
        "Focused on the journey. #focus #life",
      media: "◉",
      likes: "8.7K",
      comments: "420",
      reposts: "1.1K",
      views: "92K"
    },

    {
      name: "Sara",
      username: "sara",
      letter: "S",
      time: "45m",
      verified: false,
      text:
        "Small progress is still progress.",
      media: "◆",
      likes: "4.1K",
      comments: "203",
      reposts: "540",
      views: "31K"
    }

  ];


  const challenges = [

    "Drink water",

    "Read for 10 minutes",

    "Walk for 15 minutes",

    "Take a sunset photo",

    "Write one thing you are grateful for",

    "No soda today",

    "Take a short break",

    "Do something creative"

  ];


  /* =========================
     HELPERS
  ========================== */

  const $ =
    selector =>
      document.querySelector(selector);


  const $$ =
    selector =>
      [...document.querySelectorAll(selector)];


  function avatarStyle() {

    return `
      color:${profile.letterColor};
      background:${profile.background};
    `;

  }


  function showToast(message) {

    const toast =
      $("#toast");

    toast.textContent =
      message;

    toast.classList.add(
      "show"
    );

    clearTimeout(
      window.arsToast
    );

    window.arsToast =
      setTimeout(
        () => {

          toast.classList.remove(
            "show"
          );

        },
        2500
      );

  }


  function openPanel(id) {

    const panel =
      $("#" + id);

    if (panel) {

      panel.classList.remove(
        "hidden"
      );

    }

  }


  function closePanel(id) {

    const panel =
      $("#" + id);

    if (panel) {

      panel.classList.add(
        "hidden"
      );

    }

  }


  /* =========================
     STORIES
  ========================== */

  function renderStories() {

    const container =
      $("#stories");

    container.innerHTML =
      stories
        .map(
          story => `

            <button
              class="story ${
                story.own
                  ? "story-own"
                  : ""
              }"
              data-story="${story.name}"
            >

              <div class="story-ring">

                <div
                  class="story-avatar"
                  ${
                    story.own
                      ? `style="${avatarStyle()}"`
                      : ""
                  }
                >
                  ${story.letter}
                </div>

              </div>

              ${
                story.own
                  ? `<b class="story-add">+</b>`
                  : ""
              }

              <span class="story-name">
                ${story.name}
              </span>

            </button>

          `
        )
        .join("");


    $$(".story")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const name =
                button.dataset.story;

              if (name === "You") {

                showToast(
                  "Create your Story."
                );

                return;
              }

              showToast(
                `${name}'s Story will open here.`
              );

            }
          );

        }
      );

  }


  /* =========================
     POSTS
  ========================== */

  function renderPosts() {

    const feed =
      $("#feed");

    feed.innerHTML =
      posts
        .map(
          (post, index) => `

            <article
              class="post"
              data-post="${index}"
            >

              <div class="post-header">

                <div
                  class="avatar"
                >
                  ${post.letter}
                </div>

                <div class="post-user">

                  <strong>

                    ${post.name}

                    ${
                      post.verified
                        ? `<span class="verified">✓</span>`
                        : ""
                    }

                  </strong>

                  <span>
                    @${post.username}
                    ·
                    ${post.time}
                  </span>

                </div>

                <button
                  class="more-button"
                  aria-label="More"
                >
                  •••
                </button>

              </div>


              <div class="post-text">
                ${post.text}
              </div>


              <div class="post-media">

                <span class="media-symbol">
                  ${post.media}
                </span>

              </div>


              <div class="post-actions">

                <button
                  class="action like-button"
                >
                  <span>♡</span>
                  <span>${post.likes}</span>
                </button>

                <button class="action">
                  <span>♧</span>
                  <span>${post.comments}</span>
                </button>

                <button class="action">
                  <span>⇄</span>
                  <span>${post.reposts}</span>
                </button>

                <button class="action">
                  <span>◉</span>
                  <span>${post.views}</span>
                </button>

              </div>

            </article>

          `
        )
        .join("");


    $$(".like-button")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              button.classList.toggle(
                "liked"
              );

              const icon =
                button.querySelector(
                  "span"
                );

              icon.textContent =
                button.classList.contains(
                  "liked"
                )
                  ? "♥"
                  : "♡";

            }
          );

        }
      );


    $$(".more-button")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              showToast(
                "Repost · Bookmark · Share · Copy Link · Report · Block · Hide"
              );

            }
          );

        }
      );

  }


  /* =========================
     PROFILE
  ========================== */

  function loadProfile() {

    const topAvatar =
      $("#topAvatar");

    topAvatar.textContent =
      profile.letter;

    topAvatar.style.cssText =
      avatarStyle();


    const profileAvatar =
      $("#profileAvatar");

    profileAvatar.textContent =
      profile.letter;

    profileAvatar.style.cssText =
      avatarStyle();


    $("#profileName")
      .textContent =
      profile.displayName;


    $("#profileUsername")
      .textContent =
      "@" + profile.username;


    $("#profileStreak")
      .textContent =
      profile.streak;

  }


  /* =========================
     SEARCH
  ========================== */

  function search(value) {

    const results =
      $("#searchResults");

    const query =
      value
        .trim()
        .toLowerCase();


    if (!query) {

      results.innerHTML =
        `
          <p class="muted">
            Search ARS
          </p>
        `;

      return;

    }


    const people =
      [
        {
          name: "Lina",
          username: "@lina"
        },

        {
          name: "Noah",
          username: "@noah"
        },

        {
          name: "Sara",
          username: "@sara"
        }
      ]
      .filter(
        person =>
          person.name
            .toLowerCase()
            .includes(query) ||
          person.username
            .toLowerCase()
            .includes(query)
      );


    const tags =
      [
        "#focus",
        "#life",
        "#ARS",
        "#challenge"
      ]
      .filter(
        tag =>
          tag
            .toLowerCase()
            .includes(query)
      );


    results.innerHTML = "";


    people.forEach(
      person => {

        results.innerHTML += `

          <div class="search-item">

            <strong>
              ${person.name}
            </strong>

            <div class="muted">
              ${person.username}
            </div>

          </div>

        `;

      }
    );


    tags.forEach(
      tag => {

        results.innerHTML += `

          <div class="search-item">

            <strong>
              ${tag}
            </strong>

            <div class="muted">
              Hashtag
            </div>

          </div>

        `;

      }
    );


    if (!results.innerHTML) {

      results.innerHTML =
        `
          <p class="muted">
            No results found.
          </p>
        `;

    }

  }


  /* =========================
     WHEEL
  ========================== */

  function setupWheel() {

    const button =
      $("#spinButton");

    button.addEventListener(
      "click",
      () => {

        const premium =
          profile.plan ===
          "premium";


        let used =
          Number(
            localStorage.getItem(
              "ars_wheel_spins"
            ) || 0
          );


        if (!premium && used >= 2) {

          showToast(
            "Free limit reached: 2 spins today."
          );

          return;

        }


        if (!premium) {

          used++;

          localStorage.setItem(
            "ars_wheel_spins",
            String(used)
          );

          const remaining =
            Math.max(
              0,
              2 - used
            );

          $("#spinCounter")
            .textContent =
            `${remaining} spins left`;

        }


        const wheel =
          $("#wheel");


        wheel.classList.remove(
          "spinning"
        );


        void wheel.offsetWidth;


        wheel.classList.add(
          "spinning"
        );


        const challenge =
          challenges[
            Math.floor(
              Math.random() *
              challenges.length
            )
          ];


        setTimeout(
          () => {

            $("#challengeResult")
              .textContent =
              "Challenge: " +
              challenge;

          },
          600
        );

      }
    );

  }


  /* =========================
     NAVIGATION
  ========================== */

  function setupNavigation() {

    $$(".nav-button")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              $$(".nav-button")
                .forEach(
                  item =>
                    item.classList.remove(
                      "active"
                    )
                );


              button.classList.add(
                "active"
              );


              const page =
                button.dataset.page;


              if (page === "search") {

                openPanel(
                  "searchPanel"
                );

              }


              if (page === "streak") {

                openPanel(
                  "streakPanel"
                );

              }


              if (
                page ===
                "notifications"
              ) {

                openPanel(
                  "notificationsPanel"
                );

              }

            }
          );

        }
      );

  }


  /* =========================
     EVENTS
  ========================== */

  function setupEvents() {

    $("#profileButton")
      .addEventListener(
        "click",
        () =>
          openPanel(
            "profilePanel"
          )
      );


    $("#wheelButton")
      .addEventListener(
        "click",
        () =>
          openPanel(
            "wheelPanel"
          )
      );


    $("#createPost")
      .addEventListener(
        "click",
        () => {

          showToast(
            "Create Post is ready."
          );

        }
      );


    $("#premiumButton")
      .addEventListener(
        "click",
        () =>
          openPanel(
            "premiumPanel"
          )
      );


    $("#subscribeButton")
      .addEventListener(
        "click",
        () => {

          showToast(
            "Premium checkout will be connected later."
          );

        }
      );


    $$("[data-close]")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              closePanel(
                button.dataset.close
              );

            }
          );

        }
      );


    $("#searchInput")
      .addEventListener(
        "input",
        event =>
          search(
            event.target.value
          )
      );

  }


  /* =========================
     AUTH CHECK
  ========================== */

  async function checkAuth() {

    if (!supabaseClient) {
      return;
    }


    const {
      data
    } =
      await supabaseClient.auth
        .getSession();


    if (!data?.session) {

      window.location.href =
        "index.html";

    }

  }


  /* =========================
     INIT
  ========================== */

  async function init() {

    renderStories();

    renderPosts();

    loadProfile();

    setupWheel();

    setupNavigation();

    setupEvents();

    await checkAuth();

  }


  init();

})();
