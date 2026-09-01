// ========================================
// ΛRS - Frontend Authentication
// UI DEVELOPMENT VERSION
// No Supabase / No Email Confirmation
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ----------------------------------------
    // Elements
    // ----------------------------------------

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const displayNameInput = document.getElementById("displayName");
    const usernameInput = document.getElementById("username");
    const signupEmailInput = document.getElementById("signupEmail");
    const signupPasswordInput = document.getElementById("signupPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const birthDateInput = document.getElementById("birthDate");

    const avatarUpload = document.getElementById("avatarUpload");
    const avatarPreview = document.getElementById("avatarPreview");

    const switchFormButton = document.getElementById("switchForm");
    const googleLoginButton = document.getElementById("googleLogin");

    // ----------------------------------------
    // Show Login
    // ----------------------------------------

    function showLogin() {

        if (loginForm) {
            loginForm.style.display = "block";
        }

        if (signupForm) {
            signupForm.style.display = "none";
        }

        if (switchFormButton) {
            switchFormButton.textContent = "Create Account";
        }
    }

    // ----------------------------------------
    // Show Signup
    // ----------------------------------------

    function showSignup() {

        if (loginForm) {
            loginForm.style.display = "none";
        }

        if (signupForm) {
            signupForm.style.display = "block";
        }

        if (switchFormButton) {
            switchFormButton.textContent = "Login";
        }
    }

    // ----------------------------------------
    // Switch Login / Signup
    // ----------------------------------------

    if (switchFormButton) {

        switchFormButton.addEventListener("click", (event) => {

            event.preventDefault();

            const signupVisible =
                signupForm &&
                signupForm.style.display !== "none";

            if (signupVisible) {
                showLogin();
            } else {
                showSignup();
            }

        });

    }

    // ----------------------------------------
    // Avatar Preview
    // ----------------------------------------

    if (avatarUpload) {

        avatarUpload.addEventListener("change", () => {

            const file = avatarUpload.files?.[0];

            if (!file) {
                return;
            }

            if (!file.type.startsWith("image/")) {

                alert("Please select an image.");

                avatarUpload.value = "";

                return;
            }

            const reader = new FileReader();

            reader.onload = (event) => {

                if (avatarPreview) {
                    avatarPreview.src = event.target.result;
                    avatarPreview.style.display = "block";
                }

                // Save temporary avatar preview
                localStorage.setItem(
                    "ars_avatar_preview",
                    event.target.result
                );
            };

            reader.readAsDataURL(file);

        });

    }

    // ----------------------------------------
    // Calculate Age
    // ----------------------------------------

    function calculateAge(dateString) {

        if (!dateString) {
            return null;
        }

        const birthDate = new Date(dateString);

        if (Number.isNaN(birthDate.getTime())) {
            return null;
        }

        const today = new Date();

        let age =
            today.getFullYear() -
            birthDate.getFullYear();

        const monthDifference =
            today.getMonth() -
            birthDate.getMonth();

        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() < birthDate.getDate()
            )
        ) {
            age--;
        }

        return age;
    }

    // ----------------------------------------
    // CREATE ACCOUNT
    // ----------------------------------------

    if (signupForm) {

        signupForm.addEventListener("submit", (event) => {

            event.preventDefault();

            // ----------------------------------------
            // Get values
            // ----------------------------------------

            const displayName =
                displayNameInput?.value.trim() || "";

            const username =
                usernameInput?.value.trim() || "";

            const email =
                signupEmailInput?.value.trim() || "";

            const password =
                signupPasswordInput?.value || "";

            const confirmPassword =
                confirmPasswordInput?.value || "";

            const birthDate =
                birthDateInput?.value || "";

            // ----------------------------------------
            // Validation
            // ----------------------------------------

            if (!displayName) {

                alert("Please enter your display name.");

                displayNameInput?.focus();

                return;
            }

            if (!username) {

                alert("Please enter your username.");

                usernameInput?.focus();

                return;
            }

            if (!email) {

                alert("Please enter your email.");

                signupEmailInput?.focus();

                return;
            }

            if (!password) {

                alert("Please enter a password.");

                signupPasswordInput?.focus();

                return;
            }

            if (password.length < 6) {

                alert("Password must be at least 6 characters.");

                signupPasswordInput?.focus();

                return;
            }

            if (password !== confirmPassword) {

                alert("Passwords do not match.");

                confirmPasswordInput?.focus();

                return;
            }

            if (!birthDate) {

                alert("Please enter your date of birth.");

                birthDateInput?.focus();

                return;
            }

            // ----------------------------------------
            // Age
            // ----------------------------------------

            const age = calculateAge(birthDate);

            if (age === null) {

                alert("Please enter a valid date of birth.");

                return;
            }

            // ----------------------------------------
            // Create frontend user
            // ----------------------------------------

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

                birthDate:
                    birthDate,

                age:
                    age,

                avatar:
                    localStorage.getItem(
                        "ars_avatar_preview"
                    ) || "",

                avatarType:
                    localStorage.getItem(
                        "ars_avatar_preview"
                    )
                        ? "image"
                        : "letter",

                letter:
                    displayName
                        ? displayName.charAt(0).toUpperCase()
                        : "A",

                createdAt:
                    new Date().toISOString()
            };

            // ----------------------------------------
            // Save user
            // ----------------------------------------

            localStorage.setItem(
                "ars_user",
                JSON.stringify(user)
            );

            // ----------------------------------------
            // Mark logged in
            // ----------------------------------------

            localStorage.setItem(
                "ars_logged_in",
                "true"
            );

            // ----------------------------------------
            // Go Home
            // ----------------------------------------

            window.location.replace("home.html");

        });

    }

    // ----------------------------------------
    // LOGIN
    // ----------------------------------------

    if (loginForm) {

        loginForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const emailInput =
                loginForm.querySelector(
                    'input[type="email"]'
                );

            const passwordInput =
                loginForm.querySelector(
                    'input[type="password"]'
                );

            const email =
                emailInput?.value.trim() || "";

            const password =
                passwordInput?.value || "";

            if (!email) {

                alert("Please enter your email.");

                emailInput?.focus();

                return;
            }

            if (!password) {

                alert("Please enter your password.");

                passwordInput?.focus();

                return;
            }

            // ----------------------------------------
            // Get saved frontend account
            // ----------------------------------------

            const savedUser =
                localStorage.getItem("ars_user");

            if (!savedUser) {

                alert(
                    "No account found. Please create an account first."
                );

                showSignup();

                return;
            }

            let user;

            try {

                user = JSON.parse(savedUser);

            } catch (error) {

                localStorage.removeItem("ars_user");

                alert(
                    "Your account data is invalid. Please create a new account."
                );

                showSignup();

                return;
            }

            // ----------------------------------------
            // Check credentials
            // ----------------------------------------

            if (
                user.email !== email ||
                user.password !== password
            ) {

                alert(
                    "Incorrect email or password."
                );

                return;
            }

            // ----------------------------------------
            // Login successful
            // ----------------------------------------

            localStorage.setItem(
                "ars_logged_in",
                "true"
            );

            window.location.replace("home.html");

        });

    }

    // ----------------------------------------
    // Google Login
    // ----------------------------------------
    // Frontend-only placeholder for now.
    // Real Google OAuth will be connected later.
    // ----------------------------------------

    if (googleLoginButton) {

        googleLoginButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                alert(
                    "Google Login will be connected later."
                );

            }
        );

    }

    // ----------------------------------------
    // Existing Login State
    // ----------------------------------------

    const loggedIn =
        localStorage.getItem(
            "ars_logged_in"
        ) === "true";

    const currentUser =
        localStorage.getItem(
            "ars_user"
        );

    // If already logged in and on index page,
    // go directly to Home.

    if (loggedIn && currentUser) {

        // Don't redirect if we're not actually on index/login.
        const currentPage =
            window.location.pathname
                .split("/")
                .pop();

        if (
            currentPage === "" ||
            currentPage === "index.html"
        ) {

            window.location.replace(
                "home.html"
            );

            return;
        }

    }

    // ----------------------------------------
    // Default
    // ----------------------------------------

    showLogin();

});
