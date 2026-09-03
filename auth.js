// ========================================
// ΛRS - Frontend Authentication
// UI DEVELOPMENT VERSION
// No Supabase
// No Email Confirmation
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // FORMS
    // ========================================

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // ========================================
    // TABS
    // ========================================

    const tabs = document.querySelectorAll(".tab");

    // ========================================
    // LOGIN INPUTS
    // ========================================

    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");

    // ========================================
    // REGISTER INPUTS
    // ========================================

    const registerDisplayName =
        document.getElementById("registerDisplayName");

    const registerUsername =
        document.getElementById("registerUsername");

    const registerEmail =
        document.getElementById("registerEmail");

    const registerPassword =
        document.getElementById("registerPassword");

    // ========================================
    // PROFILE SETUP
    // ========================================

    const openProfileSetup =
        document.getElementById("openProfileSetup");

    const closeProfileSetup =
        document.getElementById("closeProfileSetup");

    const saveProfileSetup =
        document.getElementById("saveProfileSetup");

    const profileModal =
        document.getElementById("profileModal");

    const profilePreview =
        document.getElementById("profilePreview");

    const largeAvatarPreview =
        document.getElementById("largeAvatarPreview");

    const letterGrid =
        document.getElementById("letterGrid");

    const letterColors =
        document.getElementById("letterColors");

    const backgroundColors =
        document.getElementById("backgroundColors");

    const openSubscription =
        document.getElementById("openSubscription");

    // ========================================
    // PROFILE STATE
    // ========================================

    let selectedLetter = "A";

    let selectedLetterColor = "#ffffff";

    let selectedBackground =
        "linear-gradient(135deg, #7c3aed, #ec4899)";

    // ========================================
    // SHOW LOGIN
    // ========================================

    function showLogin() {

        if (loginForm) {
            loginForm.classList.add("active");
            loginForm.style.display = "";
        }

        if (registerForm) {
            registerForm.classList.remove("active");
            registerForm.style.display = "none";
        }

        tabs.forEach(tab => {

            if (tab.dataset.tab === "login") {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }

        });
    }

    // ========================================
    // SHOW REGISTER
    // ========================================

    function showRegister() {

        if (loginForm) {
            loginForm.classList.remove("active");
            loginForm.style.display = "none";
        }

        if (registerForm) {
            registerForm.classList.add("active");
            registerForm.style.display = "";
        }

        tabs.forEach(tab => {

            if (tab.dataset.tab === "register") {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }

        });
    }

    // ========================================
    // TAB CLICK
    // ========================================

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const target = tab.dataset.tab;

            if (target === "login") {
                showLogin();
            }

            if (target === "register") {
                showRegister();
            }

        });

    });

    // ========================================
    // PROFILE PREVIEW
    // ========================================

    function updateProfilePreview() {

        if (profilePreview) {

            profilePreview.textContent =
                selectedLetter;

            profilePreview.style.color =
                selectedLetterColor;

            profilePreview.style.background =
                selectedBackground;
        }

        if (largeAvatarPreview) {

            largeAvatarPreview.textContent =
                selectedLetter;

            largeAvatarPreview.style.color =
                selectedLetterColor;

            largeAvatarPreview.style.background =
                selectedBackground;
        }

    }

    // ========================================
    // CREATE LETTERS
    // ========================================

    function createLetterGrid() {

        if (!letterGrid) {
            return;
        }

        letterGrid.innerHTML = "";

        const letters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        [...letters].forEach(letter => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "letter-option";

            button.textContent =
                letter;

            if (letter === selectedLetter) {
                button.classList.add("selected");
            }

            button.addEventListener("click", () => {

                selectedLetter = letter;

                document
                    .querySelectorAll(".letter-option")
                    .forEach(item => {
                        item.classList.remove("selected");
                    });

                button.classList.add("selected");

                updateProfilePreview();

            });

            letterGrid.appendChild(button);

        });

    }

    // ========================================
    // CREATE LETTER COLORS
    // ========================================

    function createLetterColors() {

        if (!letterColors) {
            return;
        }

        letterColors.innerHTML = "";

        const colors = [
            "#ffffff",
            "#f8fafc",
            "#f9a8d4",
            "#c084fc",
            "#a78bfa",
            "#93c5fd",
            "#67e8f9",
            "#86efac",
            "#fde68a",
            "#fdba74"
        ];

        colors.forEach(color => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "color-option";

            button.style.background =
                color;

            if (color === selectedLetterColor) {
                button.classList.add("selected");
            }

            button.addEventListener("click", () => {

                selectedLetterColor =
                    color;

                document
                    .querySelectorAll(
                        "#letterColors .color-option"
                    )
                    .forEach(item => {
                        item.classList.remove("selected");
                    });

                button.classList.add("selected");

                updateProfilePreview();

            });

            letterColors.appendChild(button);

        });

    }

    // ========================================
    // CREATE BACKGROUNDS
    // ========================================

    function createBackgroundColors() {

        if (!backgroundColors) {
            return;
        }

        backgroundColors.innerHTML = "";

        const backgrounds = [

            "linear-gradient(135deg, #7c3aed, #ec4899)",

            "linear-gradient(135deg, #2563eb, #7c3aed)",

            "linear-gradient(135deg, #06b6d4, #3b82f6)",

            "linear-gradient(135deg, #10b981, #06b6d4)",

            "linear-gradient(135deg, #f59e0b, #ef4444)",

            "linear-gradient(135deg, #ec4899, #f43f5e)",

            "linear-gradient(135deg, #6366f1, #a855f7)",

            "linear-gradient(135deg, #111827, #374151)"

        ];

        backgrounds.forEach(background => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "color-option";

            button.style.background =
                background;

            if (background === selectedBackground) {
                button.classList.add("selected");
            }

            button.addEventListener("click", () => {

                selectedBackground =
                    background;

                document
                    .querySelectorAll(
                        "#backgroundColors .color-option"
                    )
                    .forEach(item => {
                        item.classList.remove("selected");
                    });

                button.classList.add("selected");

                updateProfilePreview();

            });

            backgroundColors.appendChild(button);

        });

    }

    // ========================================
    // OPEN PROFILE MODAL
    // ========================================

    if (openProfileSetup) {

        openProfileSetup.addEventListener("click", () => {

            createLetterGrid();
            createLetterColors();
            createBackgroundColors();

            updateProfilePreview();

            if (profileModal) {

                profileModal.classList.add("active");

                profileModal.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }

        });

    }

    // ========================================
    // CLOSE PROFILE MODAL
    // ========================================

    function closeProfile() {

        if (!profileModal) {
            return;
        }

        profileModal.classList.remove("active");

        profileModal.setAttribute(
            "aria-hidden",
            "true"
        );

    }

    if (closeProfileSetup) {

        closeProfileSetup.addEventListener(
            "click",
            closeProfile
        );

    }

    // ========================================
    // CLICK OUTSIDE MODAL
    // ========================================

    if (profileModal) {

        profileModal.addEventListener("click", event => {

            if (event.target === profileModal) {
                closeProfile();
            }

        });

    }

    // ========================================
    // SAVE PROFILE
    // ========================================

    if (saveProfileSetup) {

        saveProfileSetup.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    "ars_letter",
                    selectedLetter
                );

                localStorage.setItem(
                    "ars_letter_color",
                    selectedLetterColor
                );

                localStorage.setItem(
                    "ars_background",
                    selectedBackground
                );

                updateProfilePreview();

                closeProfile();

            }
        );

    }

    // ========================================
    // VIP PLACEHOLDER
    // ========================================

    if (openSubscription) {

        openSubscription.addEventListener(
            "click",
            () => {

                alert(
                    "VIP subscription will be connected later."
                );

            }
        );

    }

    // ========================================
    // REGISTER
    // ========================================

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                // --------------------------------
                // GET VALUES
                // --------------------------------

                const displayName =
                    registerDisplayName?.value.trim() || "";

                const username =
                    registerUsername?.value.trim() || "";

                const email =
                    registerEmail?.value.trim() || "";

                const password =
                    registerPassword?.value || "";

                // --------------------------------
                // VALIDATION
                // --------------------------------

                if (!displayName) {

                    alert(
                        "Please enter your display name."
                    );

                    registerDisplayName?.focus();

                    return;
                }

                if (!username) {

                    alert(
                        "Please choose a username."
                    );

                    registerUsername?.focus();

                    return;
                }

                if (!/^[A-Za-z0-9._-]+$/.test(username)) {

                    alert(
                        "Username can only contain letters, numbers, dots, underscores and hyphens."
                    );

                    registerUsername?.focus();

                    return;
                }

                if (!email) {

                    alert(
                        "Please enter your email."
                    );

                    registerEmail?.focus();

                    return;
                }

                if (!password) {

                    alert(
                        "Please create a password."
                    );

                    registerPassword?.focus();

                    return;
                }

                if (password.length < 8) {

                    alert(
                        "Password must be at least 8 characters."
                    );

                    registerPassword?.focus();

                    return;
                }

                // --------------------------------
                // USER DATA
                // --------------------------------

                const savedLetter =
                    localStorage.getItem(
                        "ars_letter"
                    ) || displayName
                        .charAt(0)
                        .toUpperCase();

                const savedLetterColor =
                    localStorage.getItem(
                        "ars_letter_color"
                    ) || "#ffffff";

                const savedBackground =
                    localStorage.getItem(
                        "ars_background"
                    ) ||
                    "linear-gradient(135deg, #7c3aed, #ec4899)";

                const user = {

                    id:
                        "user_" +
                        Date.now(),

                    displayName:
                        displayName,

                    username:
                        username,

                    email:
                        email,

                    password:
                        password,

                    avatarType:
                        "letter",

                    letter:
                        savedLetter,

                    letterColor:
                        savedLetterColor,

                    background:
                        savedBackground,

                    vip:
                        false,

                    createdAt:
                        new Date().toISOString()

                };

                // --------------------------------
                // SAVE USER
                // --------------------------------

                localStorage.setItem(
                    "ars_user",
                    JSON.stringify(user)
                );

                localStorage.setItem(
                    "ars_logged_in",
                    "true"
                );

                // --------------------------------
                // GO HOME
                // --------------------------------

                window.location.href =
                    "home.html";

            }
        );

    }

    // ========================================
    // LOGIN
    // ========================================

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const email =
                    loginEmail?.value.trim() || "";

                const password =
                    loginPassword?.value || "";

                if (!email) {

                    alert(
                        "Please enter your email."
                    );

                    loginEmail?.focus();

                    return;
                }

                if (!password) {

                    alert(
                        "Please enter your password."
                    );

                    loginPassword?.focus();

                    return;
                }

                const savedUser =
                    localStorage.getItem(
                        "ars_user"
                    );

                if (!savedUser) {

                    alert(
                        "No account found. Please create an account first."
                    );

                    showRegister();

                    return;
                }

                let user;

                try {

                    user =
                        JSON.parse(savedUser);

                } catch {

                    localStorage.removeItem(
                        "ars_user"
                    );

                    localStorage.removeItem(
                        "ars_logged_in"
                    );

                    alert(
                        "Account data is invalid. Please create a new account."
                    );

                    showRegister();

                    return;
                }

                if (
                    user.email !== email ||
                    user.password !== password
                ) {

                    alert(
                        "Incorrect email or password."
                    );

                    return;
                }

                localStorage.setItem(
                    "ars_logged_in",
                    "true"
                );

                window.location.href =
                    "home.html";

            }
        );

    }

    // ========================================
    // GOOGLE
    // ========================================

    const googleLogin =
        document.getElementById("googleLogin");

    if (googleLogin) {

        googleLogin.addEventListener(
            "click",
            event => {

                event.preventDefault();

                alert(
                    "Google Login will be connected later."
                );

            }
        );

    }

    // ========================================
    // APPLE
    // ========================================

    const appleLogin =
        document.getElementById("appleLogin");

    if (appleLogin) {

        appleLogin.addEventListener(
            "click",
            event => {

                event.preventDefault();

                alert(
                    "Apple Login will be connected later."
                );

            }
        );

    }

    // ========================================
    // START
    // ========================================

    showLogin();

});
