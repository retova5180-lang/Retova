(() => {
  "use strict";


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
    background:
      "linear-gradient(135deg, #8b3dff, #c54dff)"
  };


  /* =========================
     SELECTORS
  ========================== */

  const $ = (
    selector,
    root = document
  ) => {
    return root.querySelector(selector);
  };


  const $$ = (
    selector,
    root = document
  ) => {
    return [
      ...root.querySelectorAll(selector)
    ];
  };


  /* =========================
     ELEMENTS
  ========================== */

  const loginForm =
    $("#loginForm");

  const registerForm =
    $("#registerForm");

  const loginMessage =
    $("#loginMessage");

  const registerMessage =
    $("#registerMessage");

  const profileSetup =
    $("#profileSetup");

  const openProfileSetup =
    $("#openProfileSetup");

  const profileModal =
    $("#profileModal");

  const profileModalClose =
    $("#profileModalClose");

  const closeProfileSetup =
    $("#closeProfileSetup");

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

  const profileNextButton =
    $("#profileNextButton");


  /* =========================
     PROFILE LETTERS
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


  /* =========================
     LETTER COLORS
  ========================== */

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
    "#f5f5f5",

    "#d9d9df",
    "#9ca3af",
    "#111111",
    "#000000",
    "#ff3b30",
    "#ff5f75",
    "#ff7a59",
    "#ff9f0a",
    "#ffe66d",
    "#22c55e",
    "#00c896",
    "#38bdf8",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#c54dff",
    "#d946ef",
    "#ec4899",
    "#f43f5e"
  ];


  /* =========================
     BACKGROUND OPTIONS
  ========================== */

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
    ["#312e81", "#7c3aed"],

    ["#000000", "#222222"],
    ["#1d4ed8", "#38bdf8"],
    ["#0f766e", "#22c55e"],
    ["#15803d", "#84cc16"],
    ["#ca8a04", "#f59e0b"],
    ["#ea580c", "#f43f5e"],
    ["#be123c", "#fb7185"],
    ["#9d174d", "#f472b6"],
    ["#7e22ce", "#e879f9"],
    ["#4338ca", "#818cf8"],
    ["#0369a1", "#67e8f9"],
    ["#0f172a", "#334155"]
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
     STORAGE HELPERS
  ========================== */

  function readStorage(
    key,
    fallback = null
  ) {
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


  function readJSON(
    key,
    fallback = null
  ) {
    try {
      const value =
        localStorage.getItem(key);

      if (!value) {
        return fallback;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error(
        "ΛRS JSON storage read error:",
        error
      );

      return fallback;
    }
  }


  function writeStorage(
    key,
    value
  ) {
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
     USER
  ========================== */

  function getUser() {
    return (
      readJSON(
        STORAGE.user,
        {}
      ) || {}
    );
  }


  function saveUser(user) {
    return writeStorage(
      STORAGE.user,
      JSON.stringify(user)
    );
  }


  /* =========================
     PROFILE
  ========================== */

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
     AUTH TABS
  ========================== */

  function setupTabs() {
    const tabs =
      $$(".auth-tab");

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

          if (loginForm) {
            loginForm.classList.toggle(
              "active",
              target === "login"
            );
          }

          if (registerForm) {
            registerForm.classList.toggle(
              "active",
              target === "register"
            );
          }

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
        .trim()
        .toLowerCase() || "";

    const email =
      $("#registerEmail")
        ?.value
        .trim()
        .toLowerCase() || "";

    const password =
      $("#registerPassword")
        ?.value || "";


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


    const existingUser =
      getUser();

    const existingProfile =
      getProfile();


    const user = {
      id:
        existingUser.id ||
        `local-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      displayName,

      username,

      email,

      password,

      letter:
        existingProfile.letter,

      letterColor:
        existingProfile.letterColor,

      background:
        existingProfile.background,

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
      "Account created. Customize your profile.",
      "success"
    );


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


    $$(".auth-tab").forEach(
      tab => {
        tab.classList.remove(
          "active"
        );
      }
    );


    updateInitialProfileIcon();
  }


  /* =========================
     OPEN PROFILE MODAL
  ========================== */

  function openProfileModal() {
    if (!profileModal) {
      return;
    }


    const profile =
      getProfile();


    selectedLetter =
      profile.letter;

    selectedLetterColor =
      profile.letterColor;

    selectedBackground =
      profile.background;


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
              aria-label="Letter color ${escapeHTML(color)}"
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
              DEFAULT_PROFILE.background;


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
    if (!largeAvatarPreview) {
      return;
    }


    largeAvatarPreview.textContent =
      selectedLetter;


    largeAvatarPreview.style.color =
      selectedLetterColor;


    largeAvatarPreview.style.background =
      selectedBackground;
  }


  /* =========================
     SAVE PROFILE
  ========================== */

  function saveProfile() {
    const user =
      getUser();


    if (!user.email) {
      setMessage(
        registerMessage,
        "Your account could not be found.",
        "error"
      );

      return;
    }


    user.letter =
      selectedLetter;

    user.letterColor =
      selectedLetterColor;

    user.background =
      selectedBackground;


    if (!saveUser(user)) {
      setMessage(
        registerMessage,
        "Could not save your profile.",
        "error"
      );

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

    writeStorage(
      STORAGE.loggedIn,
      "true"
    );


    closeProfileModal();

    updateInitialProfileIcon();
  }


  /* =========================
     INITIAL PROFILE ICON
  ========================== */

  function updateInitialProfileIcon() {
    if (!profileSetupIcon) {
      return;
    }


    const profile =
      getProfile();


    profileSetupIcon.textContent =
      profile.letter;


    profileSetupIcon.style.color =
      profile.letterColor;


    profileSetupIcon.style.background =
      profile.background;
  }


  /* =========================
     NEXT
  ========================== */

  function handleProfileNext() {
    window.location.href =
      "home.html";
  }


  /* =========================
     KEYBOARD
  ========================== */

  function setupKeyboard() {
    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape" &&
          profileModal &&
          !profileModal.classList.contains(
            "hidden"
          )
        ) {
          closeProfileModal();
        }
      }
    );
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
      closeProfileModal
    );


    closeProfileSetup?.addEventListener(
      "click",
      closeProfileModal
    );


    saveProfileSetup?.addEventListener(
      "click",
      saveProfile
    );


    profileNextButton?.addEventListener(
      "click",
      handleProfileNext
    );
  }


  /* =========================
     INIT
  ========================== */

  function init() {
    setupTabs();
    setupEvents();
    setupKeyboard();
    updateInitialProfileIcon();
    }
 
  init();

})();
const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
