"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const tabs = document.querySelectorAll(".tab");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const profileModal = document.getElementById("profileModal");

    const openProfileSetup =
        document.getElementById("openProfileSetup");

    const closeProfileSetup =
        document.getElementById("closeProfileSetup");

    const saveProfileSetup =
        document.getElementById("saveProfileSetup");

    const openSubscription =
        document.getElementById("openSubscription");

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

    const googleLogin =
        document.getElementById("googleLogin");

    const appleLogin =
        document.getElementById("appleLogin");


    /* =========================================
       PROFILE STATE
    ========================================= */

    const profile = {
        letter: "A",
        letterColor: "#FFFFFF",
        backgroundColor: "#8B3DFF"
    };


    /* =========================================
       LETTERS
    ========================================= */

    const letters = [
        ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        ..."0123456789",
        "@",
        "#",
        "$",
        "&",
        "*",
        "+"
    ];


    /* =========================================
       COLORS
    ========================================= */

    const textColors = [
        "#FFFFFF",
        "#000000",
        "#F8FAFC",
        "#FDE68A",
        "#FCA5A5",
        "#FDBA74",
        "#86EFAC",
        "#67E8F9",
        "#93C5FD",
        "#C4B5FD",
        "#F0ABFC",
        "#FDA4AF"
    ];


    const bgColors = [
        "#8B3DFF",
        "#C54DFF",
        "#6D28D9",
        "#4C1D95",
        "#111827",
        "#18181B",
        "#27272A",
        "#3F3F46",
        "#0F172A",
        "#1E293B",
        "#164E63",
        "#14532D",
        "#713F12",
        "#7F1D1D"
    ];


    /* =========================================
       TAB SYSTEM
    ========================================= */

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const selected =
                tab.dataset.tab;

            tabs.forEach(item => {
                item.classList.remove("active");
            });

            tab.classList.add("active");

            if (selected === "login") {

                loginForm.classList.add("active");
                registerForm.classList.remove("active");

            } else {

                registerForm.classList.add("active");
                loginForm.classList.remove("active");

            }

        });

    });


    /* =========================================
       PROFILE PREVIEW
    ========================================= */

    function updatePreview() {

        profilePreview.textContent =
            profile.letter;

        largeAvatarPreview.textContent =
            profile.letter;

        profilePreview.style.color =
            profile.letterColor;

        largeAvatarPreview.style.color =
            profile.letterColor;

        profilePreview.style.background =
            profile.backgroundColor;

        largeAvatarPreview.style.background =
            profile.backgroundColor;

    }


    /* =========================================
       LETTER GRID
    ========================================= */

    function buildLetters() {

        letterGrid.innerHTML = "";

        letters.forEach(letter => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "letter-option";

            button.textContent =
                letter;

            if (
                letter === profile.letter
            ) {
                button.classList.add("selected");
            }

            button.addEventListener(
                "click",
                () => {

                    profile.letter =
                        letter;

                    document
                        .querySelectorAll(
                            ".letter-option"
                        )
                        .forEach(item => {
                            item.classList.remove(
                                "selected"
                            );
                        });

                    button.classList.add(
                        "selected"
                    );

                    updatePreview();

                }
            );

            letterGrid.appendChild(button);

        });

    }


    /* =========================================
       LETTER COLORS
    ========================================= */

    function buildLetterColors() {

        letterColors.innerHTML = "";

        textColors.forEach(color => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "color-option";

            button.style.background =
                color;

            if (
                color === profile.letterColor
            ) {
                button.classList.add(
                    "selected"
                );
            }

            button.addEventListener(
                "click",
                () => {

                    profile.letterColor =
                        color;

                    document
                        .querySelectorAll(
                            "#letterColors .color-option"
                        )
                        .forEach(item => {
                            item.classList.remove(
                                "selected"
                            );
                        });

                    button.classList.add(
                        "selected"
                    );

                    updatePreview();

                }
            );

            letterColors.appendChild(
                button
            );

        });

    }


    /* =========================================
       BACKGROUND COLORS
    ========================================= */

    function buildBackgroundColors() {

        backgroundColors.innerHTML = "";

        bgColors.forEach(color => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "color-option";

            button.style.background =
                color;

            if (
                color ===
                profile.backgroundColor
            ) {
                button.classList.add(
                    "selected"
                );
            }

            button.addEventListener(
                "click",
                () => {

                    profile.backgroundColor =
                        color;

                    document
                        .querySelectorAll(
                            "#backgroundColors .color-option"
                        )
                        .forEach(item => {
                            item.classList.remove(
                                "selected"
                            );
                        });

                    button.classList.add(
                        "selected"
                    );

                    updatePreview();

                }
            );

            backgroundColors.appendChild(
                button
            );

        });

    }


    /* =========================================
       OPEN PROFILE SETUP
    ========================================= */

    openProfileSetup.addEventListener(
        "click",
        () => {

            buildLetters();
            buildLetterColors();
            buildBackgroundColors();

            updatePreview();

            profileModal.classList.add(
                "open"
            );

            profileModal.setAttribute(
                "aria-hidden",
                "false"
            );

        }
    );


    /* =========================================
       CLOSE PROFILE SETUP
    ========================================= */

    function closeModal() {

        profileModal.classList.remove(
            "open"
        );

        profileModal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    closeProfileSetup.addEventListener(
        "click",
        closeModal
    );


    profileModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                profileModal
            ) {
                closeModal();
            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                profileModal.classList.contains(
                    "open"
                )
            ) {
                closeModal();
            }

        }
    );


    /* =========================================
       SAVE PROFILE
    ========================================= */

    saveProfileSetup.addEventListener(
        "click",
        () => {

            const profileData = {

                letter:
                    profile.letter,

                letterColor:
                    profile.letterColor,

                backgroundColor:
                    profile.backgroundColor,

                letterChangedAt:
                    Date.now()

            };


            try {

                localStorage.setItem(
                    "ars_profile_setup",
                    JSON.stringify(
                        profileData
                    )
                );

            } catch (error) {

                console.warn(
                    "ΛRS: profile could not be saved.",
                    error
                );

            }


            closeModal();

        }
    );


    /* =========================================
       RESTORE PROFILE
    ========================================= */

    function restoreProfile() {

        try {

            const saved =
                localStorage.getItem(
                    "ars_profile_setup"
                );

            if (!saved) {
                updatePreview();
                return;
            }

            const data =
                JSON.parse(saved);

            if (!data) {
                updatePreview();
                return;
            }

            if (
                typeof data.letter ===
                "string" &&
                data.letter.length > 0
            ) {
                profile.letter =
                    data.letter;
            }

            if (
                typeof data.letterColor ===
                "string"
            ) {
                profile.letterColor =
                    data.letterColor;
            }

            if (
                typeof data.backgroundColor ===
                "string"
            ) {
                profile.backgroundColor =
                    data.backgroundColor;
            }

        } catch (error) {

            console.warn(
                "ΛRS: saved profile could not be restored.",
                error
            );

        }

        updatePreview();

    }


    /* =========================================
       VIP BUTTON
    ========================================= */

    openSubscription.addEventListener(
        "click",
        () => {

            /*
             * Payment will be connected later
             * through Supabase + payment provider.
             */

            alert(
                "VIP subscription will be available here."
            );

        }
    );


    /* =========================================
       SOCIAL LOGIN
    ========================================= */

    googleLogin.addEventListener(
        "click",
        () => {

            /*
             * Supabase Google OAuth
             * will be connected in supabase.js.
             */

            window.dispatchEvent(
                new CustomEvent(
                    "ars:google-login"
                )
            );

        }
    );


    appleLogin.addEventListener(
        "click",
        () => {

            /*
             * Supabase Apple OAuth
             * will be connected in supabase.js.
             */

            window.dispatchEvent(
                new CustomEvent(
                    "ars:apple-login"
                )
            );

        }
    );


    /* =========================================
       LOGIN
    ========================================= */

    loginForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;


            if (!email || !password) {
                return;
            }


            /*
             * Actual authentication will
             * be connected through supabase.js.
             */

            window.dispatchEvent(
                new CustomEvent(
                    "ars:login",
                    {
                        detail: {
                            email,
                            password
                        }
                    }
                )
            );

        }
    );


    /* =========================================
       REGISTER
    ========================================= */

    registerForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const username =
                document
                    .getElementById(
                        "registerUsername"
                    )
                    .value
                    .trim();

            const email =
                document
                    .getElementById(
                        "registerEmail"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "registerPassword"
                    )
                    .value;


            if (
                !username ||
                !email ||
                !password
            ) {
                return;
            }


            /*
             * Actual account creation will
             * be connected through supabase.js.
             */

            window.dispatchEvent(
                new CustomEvent(
                    "ars:register",
                    {
                        detail: {

                            username,
                            email,
                            password,

                            profile: {
                                letter:
                                    profile.letter,

                                letterColor:
                                    profile.letterColor,

                                backgroundColor:
                                    profile.backgroundColor
                            }

                        }
                    }
                )
            );

        }
    );


    /* =========================================
       GLOBAL EVENTS
    ========================================= */

    window.addEventListener(
        "ars:login-success",
        () => {

            window.location.href =
                "home.html";

        }
    );


    window.addEventListener(
        "ars:register-success",
        () => {

            window.location.href =
                "home.html";

        }
    );


    /* =========================================
       INITIALIZE
    ========================================= */

    restoreProfile();

});
