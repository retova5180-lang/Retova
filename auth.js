(() => {
  "use strict";

  /*
   * ==================================================
   * ΛRS AUTH
   * ==================================================
   *
   * CURRENT MODE:
   * Local development authentication.
   *
   * FUTURE SUPABASE CONNECTION:
   *
   * Put the Supabase Project URL and Publishable/Anon
   * Key in the constants below when we start the
   * backend connection.
   *
   * Do NOT put a service_role key in frontend code.
   * ==================================================
   */

  const SUPABASE_CONFIG = {
    url: "",
    publishableKey: ""
  };


  /* =========================
     STORAGE KEYS
  ========================== */

  const STORAGE = {
    user: "ars_user",
    loggedIn: "ars_logged_in",
    letter: "ars_letter",
    letterColor: "ars_letter_color",
    background: "ars_background"
  };


  /* =========================
     DEFAULT PROFILE
  ========================== */

  const DEFAULT_PROFILE = {
    letter: "R",
    letterColor: "#ffffff",
    background: "#8b3dff"
  };


  /* =========================
     SELECTORS
  ========================== */

  const $ = (selector, root = document) => {
    return root.querySelector(selector);
  };

  const $$ = (selector, root = document) => {
    return [...root.querySelectorAll(selector)];
  };


  /* =========================
     ELEMENTS
  ========================== */

  const loginForm = $("#loginForm");
  const registerForm = $("#registerForm");

  const loginMessage = $("#loginMessage");
  const registerMessage = $("#registerMessage");

  const profileSetup = $("#profileSetup");
  const openProfileSetup = $("#openProfileSetup");

  const profileModal = $("#profileModal");
  const profileModalClose = $("#profileModalClose");
  const closeProfileSetup = $("#closeProfileSetup");

  const largeAvatarPreview =
    $("#largeAvatarPreview");

  const letterGrid =
    $("#letterGrid");

  const letterColors =
    $("#letterColors");

  const backgroundColors =
    $("#backgroundColors");

  const saveProfileSetup =
    $("#saveProfileSetup");

  const profileSetupIcon =
    $(".profile-setup-icon");


  /* =========================
     PROFILE OPTIONS
  ========================== */

  const letters = [
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."0123456789",
    "★",
    "✦",
    "♥",
    "◆",
    "●",
    "Λ"
  ];

  const letterColorOptions = [
    "#ffffff",
    "#f4c2ff",
    "#d8a6ff",
    "#bd75ff",
    "#9f55ff",
    "#8b3dff",
    "#ff7ac8",
    "#ff5f86",
    "#7de2ff",
    "#53d79a",
    "#ffd166",
    "#f5f5f5"
  ];

  const backgroundOptions = [
    ["#8b3dff", "#c54dff"],
    ["#6d28d9", "#a855f7"],
    ["#4c1d95", "#8b5cf6"],
    ["#7c3aed", "#ec4899"],
    ["#9333ea", "#f43f5e"],
    ["#c026d3", "#7c3aed"],
    ["#581c87", "#be185d"],
    ["#111111", "#44444c"],
    ["#18181d", "#5d5d68"],
    ["#312e81", "#7c3aed"]
  ];


  /* =========================
     CURRENT SELECTION
  ========================== */

  let selectedLetter =
    DEFAULT_PROFILE.letter;

  let selectedLetterColor =
    DEFAULT_PROFILE.letterColor;

  let selectedBackground =
    DEFAULT_PROFILE.background;


  /* =========================
     SAFE STORAGE
  ========================== */

  function readStorage(key, fallback = null) {
    try {
      const value =
        localStorage.getItem(key);

      if (value === null) {
        return fallback;
      }

      return value;
    } catch (error) {
      console.error(
        "ΛRS storage read error:",
        error
      );

      return fallback;
    }
  }

  function readJSON(key, fallback = null) {
    try {
      const value =
        localStorage.getItem(key);

      if (!value) {
        return fallback;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error(
        "ΛRS JSON storage error:",
        error
      );

      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(
        key,
        value
      );

      return true;
    } catch (error) {
      console.error(
        "ΛRS storage write error:",
        error
      );

      return false;
    }
  }


  /* =========================
     ESCAPE HTML
  ========================== */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(
        /[&<>"']/g,
        character => {
          const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
          };

          return entities[character];
        }
      );
  }


  /* =========================
     VALIDATION
  ========================== */

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  }

  function validateUsername(username) {
    return /^[a-zA-Z0-9_.]{3,20}$/
      .test(username);
  }


  /* =========================
     MESSAGES
  ========================== */

  function setMessage(
    element,
    message,
    type = ""
  ) {
    if (!element) {
      return;
    }

    element.textContent =
      message;

    element.className =
      "form-message";

    if (type) {
      element.classList.add(type);
    }
  }


  /* =========================
     AUTH TABS
  ========================== */

  function setupTabs() {
    const tabs =
      $$(".auth-tab");

    const forms = [
      loginForm,
      registerForm
    ];

    tabs.forEach(tab => {
      tab.addEventListener(
        "click",
        () => {
          const target =
            tab.dataset.authTab;

          tabs.forEach(item => {
            item.classList.toggle(
              "active",
              item === tab
            );
          });

          forms.forEach(form => {
            if (!form) {
              return;
            }

            const isLogin =
              form === loginForm;

            form.classList.toggle(
              "active",
              (
                target === "login" &&
                isLogin
              ) ||
              (
                target === "register" &&
                !isLogin
              )
            );
          });

          setMessage(
            loginMessage,
            ""
          );

          setMessage(
            registerMessage,
            ""
          );
        }
      );
    });
  }


  /* =========================
     PROFILE DATA
  ========================== */

  function getUser() {
    return readJSON(
      STORAGE.user,
      {}
    ) || {};
  }

  function getProfile() {
    const user =
      getUser();

    return {
      letter:
        user.letter ||
        readStorage(
          STORAGE.letter,
          DEFAULT_PROFILE.letter
        ),

      letterColor:
        user.letterColor ||
        readStorage(
          STORAGE.letterColor,
          DEFAULT_PROFILE.letterColor
        ),

      background:
        user.background ||
        readStorage(
          STORAGE.background,
          DEFAULT_PROFILE.background
        )
    };
  }


  /* =========================
     SAVE USER
  ========================== */

  function saveUser(user) {
    return writeStorage(
      STORAGE.user,
      JSON.stringify(user)
    );
  }


  /* =========================
     CREATE ACCOUNT
  ========================== */

  function handleRegister(event) {
    event.preventDefault();

    if (!registerForm) {
      return;
    }

    const displayName =
      $("#registerDisplayName")
        ?.value
        .trim() || "";

    const username =
      $("#registerUsername")
        ?.value
        .trim() || "";

    const email =
      $("#registerEmail")
        ?.value
        .trim()
        .toLowerCase() || "";

    const password =
      $("#registerPassword")
        ?.value || "";


    /* -------------------------
       VALIDATION
    ------------------------- */

    if (displayName.length < 2) {
      setMessage(
        registerMessage,
        "Please enter a valid display name.",
        "error"
      );

      return;
    }

    if (!validateUsername(username)) {
      setMessage(
        registerMessage,
        "Username must be 3–20 characters and use only letters, numbers, _ or .",
        "error"
      );

      return;
    }

    if (!validateEmail(email)) {
      setMessage(
        registerMessage,
        "Please enter a valid email.",
        "error"
      );

      return;
    }

    if (password.length < 8) {
      setMessage(
        registerMessage,
        "Password must contain at least 8 characters.",
        "error"
      );

      return;
    }


    /* -------------------------
       CREATE LOCAL USER
    ------------------------- */

    const existingUser =
      getUser();

    const profile = {
      ...getProfile(),
      name:
        existingUser.name ||
        displayName
    };

    const user = {
      id:
        existingUser.id ||
        `local-${Date.now()}`,

      displayName,

      username,

      email,

      password,

      letter:
        profile.letter,

      letterColor:
        profile.letterColor,

      background:
        profile.background,

      avatar:
        existingUser.avatar ||
        "",

      createdAt:
        existingUser.createdAt ||
        Date.now()
    };


    if (!saveUser(user)) {
      setMessage(
        registerMessage,
        "Could not save your account on this device.",
        "error"
      );

      return;
    }

    writeStorage(
      STORAGE.letter,
      user.letter
    );

    writeStorage(
      STORAGE.letterColor,
      user.letterColor
    );

    writeStorage(
      STORAGE.background,
      user.background
    );

    writeStorage(
      STORAGE.loggedIn,
      "true"
    );


    setMessage(
      registerMessage,
      "Account created.",
      "success"
    );


    /*
     * Show profile setup before entering Home.
     */

    showProfileSetup();
  }


  /* =========================
     LOGIN
  ========================== */

  function handleLogin(event) {
    event.preventDefault();

    if (!loginForm) {
      return;
    }

    const email =
      $("#loginEmail")
        ?.value
        .trim()
        .toLowerCase() || "";

    const password =
      $("#loginPassword")
        ?.value || "";

    if (!validateEmail(email)) {
      setMessage(
        loginMessage,
        "Please enter a valid email.",
        "error"
      );

      return;
    }

    if (!password) {
      setMessage(
        loginMessage,
        "Please enter your password.",
        "error"
      );

      return;
    }


    const user =
      getUser();

    if (
      !user.email ||
      !user.password
    ) {
      setMessage(
        loginMessage,
        "No local account was found on this device.",
        "error"
      );

      return;
    }

    if (
      user.email !== email ||
      user.password !== password
    ) {
      setMessage(
        loginMessage,
        "Email or password is incorrect.",
        "error"
      );

      return;
    }


    writeStorage(
      STORAGE.loggedIn,
      "true"
    );

    setMessage(
      loginMessage,
      "Login successful.",
      "success"
    );


    window.location.href =
      "home.html";
  }


  /* =========================
     PROFILE SETUP
  ========================== */

  function showProfileSetup() {
    if (!profileSetup) {
      return;
    }

    profileSetup.classList.remove(
      "hidden"
    );

    if (loginForm) {
      loginForm.classList.remove(
        "active"
      );
    }

    if (registerForm) {
      registerForm.classList.remove(
        "active"
      );
    }

    $$(".auth-tab").forEach(tab => {
      tab.classList.remove(
        "active"
      );
    });
  }


  /* =========================
     OPEN PROFILE MODAL
  ========================== */

  function openProfileModal() {
    if (!profileModal) {
      return;
    }

    selectedLetter =
      getProfile().letter;

    selectedLetterColor =
      getProfile().letterColor;

    selectedBackground =
      getProfile().background;

    renderLetterGrid();
    renderLetterColors();
    renderBackgroundColors();
    updateAvatarPreview();

    profileModal.classList.remove(
      "hidden"
    );

    profileModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }


  /* =========================
     CLOSE PROFILE MODAL
  ========================== */

  function closeProfileModal() {
    if (!profileModal) {
      return;
    }

    profileModal.classList.add(
      "hidden"
    );

    profileModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  /* =========================
     LETTER GRID
  ========================== */

  function renderLetterGrid() {
    if (!letterGrid) {
      return;
    }

    letterGrid.innerHTML =
      letters
        .map(letter => {
          const selected =
            letter === selectedLetter;

          return `
            <button
              type="button"
              class="letter-option ${
                selected
                  ? "selected"
                  : ""
              }"
              data-letter="${escapeHTML(letter)}"
            >
              ${escapeHTML(letter)}
            </button>
          `;
        })
        .join("");

    $$(".letter-option", letterGrid)
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectedLetter =
              button.dataset.letter ||
              DEFAULT_PROFILE.letter;

            $$(".letter-option", letterGrid)
              .forEach(item => {
                item.classList.toggle(
                  "selected",
                  item === button
                );
              });

            updateAvatarPreview();
          }
        );
      });
  }


  /* =========================
     LETTER COLORS
  ========================== */

  function renderLetterColors() {
    if (!letterColors) {
      return;
    }

    letterColors.innerHTML =
      letterColorOptions
        .map(color => {
          const selected =
            color.toLowerCase() ===
            selectedLetterColor.toLowerCase();

          return `
            <button
              type="button"
              class="color-option ${
                selected
                  ? "selected"
                  : ""
              }"
              data-color="${escapeHTML(color)}"
              style="background:${escapeHTML(color)}"
              aria-label="Letter color"
            ></button>
          `;
        })
        .join("");

    $$(".color-option", letterColors)
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectedLetterColor =
              button.dataset.color ||
              DEFAULT_PROFILE.letterColor;

            $$(".color-option", letterColors)
              .forEach(item => {
                item.classList.toggle(
                  "selected",
                  item === button
                );
              });

            updateAvatarPreview();
          }
        );
      });
  }


  /* =========================
     BACKGROUND COLORS
  ========================== */

  function renderBackgroundColors() {
    if (!backgroundColors) {
      return;
    }

    backgroundColors.innerHTML =
      backgroundOptions
        .map((gradient, index) => {
          const background =
            `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;

          const selected =
            background ===
            selectedBackground;

          return `
            <button
              type="button"
              class="gradient-option ${
                selected
                  ? "selected"
                  : ""
              }"
              data-background="${escapeHTML(background)}"
              style="background:${background}"
              aria-label="Background option ${index + 1}"
            ></button>
          `;
        })
        .join("");

    $$(".gradient-option", backgroundColors)
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectedBackground =
              button.dataset.background ||
              "linear-gradient(135deg, #8b3dff, #c54dff)";

            $$(".gradient-option", backgroundColors)
              .forEach(item => {
                item.classList.toggle(
                  "selected",
                  item === button
                );
              });

            updateAvatarPreview();
          }
        );
      });
  }


  /* =========================
     AVATAR PREVIEW
  ========================== */

  function updateAvatarPreview() {
    const avatar =
      largeAvatarPreview;

    if (!avatar) {
      return;
    }

    avatar.textContent =
      selectedLetter;

    avatar.style.color =
      selectedLetterColor;

    avatar.style.background =
      selectedBackground;
  }


  /* =========================
     SAVE PROFILE
  ========================== */

  function saveProfile() {
    const user =
      getUser();

    if (!user.email) {
      return;
    }

    user.letter =
      selectedLetter;

    user.letterColor =
      selectedLetterColor;

    user.background =
      selectedBackground;

    user.avatar =
      user.avatar || "";

    if (!saveUser(user)) {
      return;
    }

    writeStorage(
      STORAGE.letter,
      selectedLetter
    );

    writeStorage(
      STORAGE.letterColor,
      selectedLetterColor
    );

    writeStorage(
      STORAGE.background,
      selectedBackground
    );

    closeProfileModal();

    /*
     * Account is ready.
     */

    window.location.href =
      "home.html";
  }


  /* =========================
     INITIAL PROFILE PREVIEW
  ========================== */

  function updateInitialProfileIcon() {
    const profile =
      getProfile();

    if (!profileSetupIcon) {
      return;
    }

    profileSetupIcon.textContent =
      profile.letter;

    profileSetupIcon.style.color =
      profile.letterColor;

    profileSetupIcon.style.background =
      profile.background;
  }


  /* =========================
     SUPABASE PLACEHOLDER CHECK
  ========================== */

  function getBackendConfig() {
    return {
      url:
        SUPABASE_CONFIG.url
          .trim(),

      publishableKey:
        SUPABASE_CONFIG.publishableKey
          .trim()
    };
  }

  function isBackendConfigured() {
    const config =
      getBackendConfig();

    return Boolean(
      config.url &&
      config.publishableKey
    );
  }


  /*
   * This function intentionally does not connect yet.
   *
   * When we begin Supabase integration, this is the
   * exact place where the real client initialization
   * will be added.
   */

  function prepareBackendConnection() {
    if (!isBackendConfigured()) {
      return;
    }

    /*
     * Supabase connection will be added here.
     *
     * No new library is loaded automatically.
     */
  }


  /* =========================
     LOGGED-IN REDIRECT
  ========================== */

  function checkExistingSession() {
    const loggedIn =
      readStorage(
        STORAGE.loggedIn,
        "false"
      );

    if (
      loggedIn !== "true"
    ) {
      return;
    }

    const user =
      getUser();

    if (
      user.email &&
      user.password
    ) {
      /*
       * Keep the user on the login page only
       * if the page was intentionally opened.
       *
       * We do not redirect automatically here,
       * so the user can still see the login screen.
       */
    }
  }


  /* =========================
     EVENTS
  ========================== */

  function setupEvents() {
    loginForm?.addEventListener(
      "submit",
      handleLogin
    );

    registerForm?.addEventListener(
      "submit",
      handleRegister
    );

    openProfileSetup?.addEventListener(
      "click",
      openProfileModal
    );

    profileModalClose?.addEventListener(
      "click",
      close
