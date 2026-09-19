(() => {
  "use strict";

  /* =========================
     SUPABASE
  ========================== */

  const SUPABASE_URL =
    "https://bfqsqgfyyewnfxekirfv.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

  const supabaseClient =
    window.supabase?.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );


  /* =========================
     STORAGE
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
     HELPERS
  ========================== */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];


  function readStorage(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);

      return value === null
        ? fallback
        : value;
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


  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  }


  function validateUsername(username) {
    return /^[a-zA-Z0-9_.]{3,20}$/
      .test(username);
  }


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

  const profileModal =
    $("#profileModal");

  const largeAvatarPreview =
    $("#largeAvatarPreview");

  const letterGrid =
    $("#letterGrid");

  const letterColors =
    $("#letterColors");

  const backgroundColors =
    $("#backgroundColors");


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


  let selectedLetter =
    DEFAULT_PROFILE.letter;

  let selectedLetterColor =
    DEFAULT_PROFILE.letterColor;

  let selectedBackground =
    DEFAULT_PROFILE.background;


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
     TABS
  ========================== */

  function setupTabs() {
    $$(".auth-tab")
      .forEach(tab => {

        tab.addEventListener(
          "click",
          () => {

            const target =
              tab.dataset.authTab;

            $$(".auth-tab")
              .forEach(item => {

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

  async function handleRegister(event) {

    event.preventDefault();

    if (!registerForm) {
      return;
    }

    if (!supabaseClient) {

      setMessage(
        registerMessage,
        "Authentication service is not available.",
        "error"
      );

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


    /* VALIDATION */

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


    setMessage(
      registerMessage,
      "Creating your account...",
      "success"
    );


    try {

      const {
        data,
        error
      } =
        await supabaseClient.auth.signUp({

          email,
          password,

          options: {
            data: {
              username,
              display_name:
                displayName
            }
          }

        });


      if (error) {

        console.error(
          "ΛRS Supabase registration error:",
          error
        );

        setMessage(
          registerMessage,
          error.message ||
            "Could not create your account.",
          "error"
        );

        return;
      }


      if (!data?.user) {

        setMessage(
          registerMessage,
          "Could not create your account.",
          "error"
        );

        return;
      }


      const oldUser =
        getUser();

      const profile =
        getProfile();


      const user = {

        id:
          data.user.id,

        displayName,

        username,

        email,

        letter:
          profile.letter,

        letterColor:
          profile.letterColor,

        background:
          profile.background,

        avatar:
          oldUser.avatar || "",

        createdAt:
          oldUser.createdAt ||
          Date.now()

      };


      /*
        DO NOT STORE PASSWORD
      */

      saveUser(user);

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


      /*
        SESSION EXISTS
      */

      if (data.session) {

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

        return;
      }


      /*
        EMAIL CONFIRMATION
      */

      writeStorage(
        STORAGE.loggedIn,
        "false"
      );

      setMessage(
        registerMessage,
        "Account created. Please check your email to confirm your account.",
        "success"
      );

    } catch (error) {

      console.error(
        "ΛRS registration exception:",
        error
      );

      setMessage(
        registerMessage,
        error?.message ||
          "Something went wrong while creating your account.",
        "error"
      );

    }

  }


  /* =========================
     LOGIN
  ========================== */

  async function handleLogin(event) {

    event.preventDefault();

    if (!loginForm) {
      return;
    }

    if (!supabaseClient) {

      setMessage(
        loginMessage,
        "Authentication service is not available.",
        "error"
      );

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


    setMessage(
      loginMessage,
      "Logging in...",
      "success"
    );


    try {

      const {
        data,
        error
      } =
        await supabaseClient.auth.signInWithPassword({

          email,
          password

        });


      if (error) {

        console.error(
          "ΛRS Supabase login error:",
          error
        );

        setMessage(
          loginMessage,
          error.message ||
            "Email or password is incorrect.",
          "error"
        );

        return;
      }


      if (!data?.user) {

        setMessage(
          loginMessage,
          "Login could not be completed.",
          "error"
        );

        return;
      }


      let localUser =
        getUser();


      /*
        LOAD PROFILE
      */

      try {

        const {
          data: profile,
          error: profileError
        } =
          await supabaseClient
            .from("users")
            .select(
              "id, username, display_name, email, bio, avatar, cover, verified, plan, streak, xp"
            )
            .eq(
              "id",
              data.user.id
            )
            .maybeSingle();


        if (
          !profileError &&
          profile
        ) {

          localUser = {

            ...localUser,

            id:
              profile.id,

            username:
              profile.username ||
              localUser.username ||
              "",

            displayName:
              profile.display_name ||
              localUser.displayName ||
              "",

            email:
              profile.email ||
              data.user.email ||
              email,

            bio:
              profile.bio ||
              localUser.bio ||
              "",

            avatar:
              profile.avatar ||
              localUser.avatar ||
              "",

            cover:
              profile.cover ||
              localUser.cover ||
              "",

            verified:
              profile.verified ??
              localUser.verified ??
              false,

            plan:
              profile.plan ||
              localUser.plan ||
              "free",

            streak:
              profile.streak ??
              localUser.streak ??
              0,

            xp:
              profile.xp ??
              localUser.xp ??
              0

          };

        }

      } catch (profileError) {

        console.warn(
          "ΛRS profile fetch warning:",
          profileError
        );

      }


      localUser.id =
        data.user.id;

      localUser.email =
        data.user.email ||
        email;


      if (!localUser.createdAt) {

        localUser.createdAt =
          Date.now();

      }


      saveUser(localUser);


      const profile =
        getProfile();


      writeStorage(
        STORAGE.letter,
        profile.letter
      );

      writeStorage(
        STORAGE.letterColor,
        profile.letterColor
      );

      writeStorage(
        STORAGE.background,
        profile.background
      );

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

    } catch (error) {

      console.error(
        "ΛRS login exception:",
        error
      );

      setMessage(
        loginMessage,
        error?.message ||
          "Something went wrong while logging in.",
        "error"
      );

    }

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


    $$(".auth-tab")
      .forEach(tab => {

        tab.classList.remove(
          "active"
        );

      });


    updateInitialProfileIcon();

  }


  /* =========================
     OPEN MODAL
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
     CLOSE MODAL
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
     LETTERS
  ========================== */

  function renderLetterGrid() {

    if (!letterGrid) {
      return;
    }


    letterGrid.innerHTML =
      letters
        .map(letter => {

          const selected =
            letter ===
            selectedLetter;

          return `
            <button
              type="button"
              class="letter-option ${
                selected
                  ? "selected"
                  : ""
              }"
              data-letter="${escapeHTML(
                letter
              )}"
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
              data-color="${escapeHTML(
                color
              )}"
              style="background:${escapeHTML(
                color
              )}"
              aria-label="Letter color ${escapeHTML(
                color
              )}"
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
     BACKGROUNDS
  ========================== */

  function renderBackgroundColors() {

    if (!backgroundColors) {
      return;
    }


    backgroundColors.innerHTML =
      backgroundOptions
        .map(pair => {

          const gradient =
            "linear-gradient(135deg, " +
            pair[0] +
            ", " +
            pair[1] +
            ")";


          const selected =
            gradient ===
            selectedBackground;


          return `
            <button
              type="button"
     
