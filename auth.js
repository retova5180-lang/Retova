// ======================================
// ΛRS AUTH
// Clean Authentication System
// ======================================

"use strict";

// ======================================
// Elements
// ======================================

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const bottomText = document.getElementById("bottomText");
const switchForm = document.getElementById("switchForm");

const avatarUpload = document.getElementById("avatarUpload");
const avatarPreview = document.getElementById("avatarPreview");

const googleLogin = document.getElementById("googleLogin");

// ======================================
// Safety Check
// ======================================

if (!loginForm || !signupForm) {
    console.error("Auth Error: Login or Signup form was not found.");
}

// ======================================
// Show Login
// ======================================

function showLogin() {

    if (!loginForm || !signupForm) return;

    loginForm.style.display = "block";
    signupForm.style.display = "none";

    if (loginTab) {
        loginTab.classList.add("active");
    }

    if (signupTab) {
        signupTab.classList.remove("active");
    }

    if (bottomText) {
        bottomText.textContent = "Don't have an account?";
    }

    const link = document.getElementById("switchForm");

    if (link) {
        link.textContent = "Create Account";
        link.onclick = switchForms;
    }
}

// ======================================
// Show Signup
// ======================================

function showSignup() {

    if (!loginForm || !signupForm) return;

    loginForm.style.display = "none";
    signupForm.style.display = "block";

    if (signupTab) {
        signupTab.classList.add("active");
    }

    if (loginTab) {
        loginTab.classList.remove("active");
    }

    if (bottomText) {
        bottomText.textContent = "Already have an account?";
    }

    const link = document.getElementById("switchForm");

    if (link) {
        link.textContent = "Login";
        link.onclick = switchForms;
    }
}

// ======================================
// Switch Login / Signup
// ======================================

function switchForms(event) {

    if (event) {
        event.preventDefault();
    }

    if (!signupForm) return;

    const signupVisible =
        signupForm.style.display !== "none";

    if (signupVisible) {
        showLogin();
    } else {
        showSignup();
    }
}

// ======================================
// Tabs
// ======================================

if (loginTab) {
    loginTab.addEventListener("click", function () {
        showLogin();
    });
}

if (signupTab) {
    signupTab.addEventListener("click", function () {
        showSignup();
    });
}

if (switchForm) {
    switchForm.addEventListener("click", switchForms);
}

// ======================================
// Avatar Preview
// ======================================

if (avatarUpload && avatarPreview) {

    avatarUpload.addEventListener("change", function () {

        const file = this.files && this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image.");
            this.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            if (event.target && event.target.result) {
                avatarPreview.src = event.target.result;
            }

        };

        reader.readAsDataURL(file);
    });
}

// ======================================
// Calculate Age
// ======================================

function calculateAge(birthDate) {

    if (!birthDate) {
        return null;
    }

    const today = new Date();
    const birth = new Date(birthDate);

    let age =
        today.getFullYear() -
        birth.getFullYear();

    const monthDifference =
        today.getMonth() -
        birth.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() < birth.getDate()
        )
    ) {
        age--;
    }

    return age;
}

// ======================================
// Create Account
// ======================================

if (signupForm) {

    signupForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // ----------------------------------
        // Make sure Supabase exists
        // ----------------------------------

        if (!window.supabase) {
            alert("Authentication system is not loaded.");
            console.error("Supabase library is missing.");
            return;
        }

        if (typeof supabase === "undefined") {
            alert("Supabase connection is not available.");
            console.error("supabase.js was not loaded.");
            return;
        }

        // ----------------------------------
        // Get Values
        // ----------------------------------

        const displayNameElement =
            document.getElementById("displayName");

        const usernameElement =
            document.getElementById("username");

        const emailElement =
            document.getElementById("signupEmail");

        const passwordElement =
            document.getElementById("signupPassword");

        const confirmPasswordElement =
            document.getElementById("confirmPassword");

        const birthDateElement =
            document.getElementById("birthDate");

        const displayName =
            displayNameElement
                ? displayNameElement.value.trim()
                : "";

        const username =
            usernameElement
                ? usernameElement.value.trim()
                : "";

        const email =
            emailElement
                ? emailElement.value.trim()
                : "";

        const password =
            passwordElement
                ? passwordElement.value
                : "";

        const confirmPassword =
            confirmPasswordElement
                ? confirmPasswordElement.value
                : "";

        const birthDate =
            birthDateElement
                ? birthDateElement.value
                : "";

        // ----------------------------------
        // Validation
        // ----------------------------------

        if (!displayName) {
            alert("Please enter your display name.");
            return;
        }

        if (!username) {
            alert("Please enter your username.");
            return;
        }

        if (!email) {
            alert("Please enter your email.");
            return;
        }

        if (!password) {
            alert("Please enter a password.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (!birthDate) {
            alert("Please select your date of birth.");
            return;
        }

        const age = calculateAge(birthDate);

        if (age === null || age < 13) {
            alert("You must be at least 13 years old.");
            return;
        }

        // ----------------------------------
        // Disable Button
        // ----------------------------------

        const submitButton =
            signupForm.querySelector(
                'button[type="submit"]'
            );

        const originalButtonText =
            submitButton
                ? submitButton.textContent
                : "";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Creating...";
        }

        try {

            // ----------------------------------
            // Create Supabase Account
            // ----------------------------------

            const {
                data,
                error
            } = await supabase.auth.signUp({

                email: email,

                password: password

            });

            // ----------------------------------
            // Auth Error
            // ----------------------------------

            if (error) {

                console.error(
                    "Signup Error:",
                    error
                );

                alert(error.message);
                return;
            }

            // ----------------------------------
            // User Check
            // ----------------------------------

            const user = data && data.user;

            if (!user) {

                alert(
                    "Account could not be created."
                );

                return;
            }

            // ----------------------------------
            // Upload Avatar
            // ----------------------------------

            let avatarUrl = "";

            if (
                avatarUpload &&
                avatarUpload.files &&
                avatarUpload.files.length > 0
            ) {

                const file =
                    avatarUpload.files[0];

                const fileName =
                    `${user.id}-${Date.now()}-${file.name}`;

                const {
                    error: uploadError
                } = await supabase.storage
                    .from("avatars")
                    .upload(
                        fileName,
                        file,
                        {
                            upsert: false
                        }
                    );

                if (uploadError) {

                    console.warn(
                        "Avatar upload failed:",
                        uploadError
                    );

                } else {

                    const {
                        data: publicData
                    } = supabase.storage
                        .from("avatars")
                        .getPublicUrl(
                            fileName
                        );

                    if (
                        publicData &&
                        publicData.publicUrl
                    ) {

                        avatarUrl =
                            publicData.publicUrl;
                    }
                }
            }

            // ----------------------------------
            // Save User Profile
            // ----------------------------------

            const {
                error: profileError
            } = await supabase
                .from("users")
                .insert({

                    id: user.id,

                    username: username,

                    full_name: displayName,

                    avatar: avatarUrl,

                    age: age

                });

            // ----------------------------------
            // Profile Error
            // ----------------------------------

            if (profileError) {

                console.error(
                    "Profile Error:",
                    profileError
                );

                alert(
                    "Account was created, but your profile could not be saved.\n\n" +
                    profileError.message
                );

                return;
            }

            // ----------------------------------
            // Get Current Session
            // ----------------------------------

            const {
                data: sessionData
            } = await supabase.auth.getSession();

            // ----------------------------------
            // Successful Signup
            // ----------------------------------

            if (sessionData && sessionData.session) {

                window.location.replace("home.html");

                return;
            }

            // ----------------------------------
            // Email Confirmation Enabled
            // ----------------------------------

            alert(
                "Account created successfully.\n\n" +
                "Please confirm your email, then log in."
            );

            showLogin();

        } catch (error) {

            console.error(
                "Unexpected Signup Error:",
                error
            );

            alert(
                "Something went wrong while creating your account."
            );

        } finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    originalButtonText ||
                    "Create Account";
            }
        }

    });
}

// ======================================
// Login
// ======================================

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // ----------------------------------
        // Make sure Supabase exists
        // ----------------------------------

        if (!window.supabase) {

            alert(
                "Authentication system is not loaded."
            );

            console.error(
                "Supabase library is missing."
            );

            return;
        }

        if (typeof supabase === "undefined") {

            alert(
                "Supabase connection is not available."
            );

            console.error(
                "supabase.js was not loaded."
            );

            return;
        }

        // ----------------------------------
        // Get Login Values
        // ----------------------------------

        const emailElement =
            document.getElementById("loginEmail");

        const passwordElement =
            document.getElementById("loginPassword");

        const email =
            emailElement
                ? emailElement.value.trim()
                : "";

        const password =
            passwordElement
                ? passwordElement.value
                : "";

        // ----------------------------------
        // Validation
        // ----------------------------------

        if (!email) {

            alert("Please enter your email.");
            return;
        }

        if (!password) {

            alert("Please enter your password.");
            return;
        }

        // ----------------------------------
        // Disable Button
        // ----------------------------------

        const submitButton =
            loginForm.querySelector(
                'button[type="submit"]'
            );

        const originalButtonText =
            submitButton
                ? submitButton.textContent
                : "";

        if (submitButton) {

            submitButton.disabled = true;
            submitButton.textContent = "Logging in...";
        }

        try {

            // ----------------------------------
            // Login with Supabase
            // ----------------------------------

            const {
                data,
                error
            } = await supabase.auth
                .signInWithPassword({

                    email: email,

                    password: password

                });

            // ----------------------------------
            // Login Error
            // ----------------------------------

            if (error) {

                console.error(
                    "Login Error:",
                    error
                );

                alert(error.message);
                return;
            }

            // ----------------------------------
            // Session Check
            // ----------------------------------

            if (
                !data ||
                !data.session
            ) {

                alert(
                    "Login succeeded, but no session was created."
                );

                return;
            }

            // ----------------------------------
            // GO HOME
            // ----------------------------------

            window.location.replace(
                "home.html"
            );

        } catch (error) {

            console.error(
                "Unexpected Login Error:",
                error
            );

            alert(
                "Something went wrong while logging in."
            );

        } finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    originalButtonText ||
                    "Login";
            }
        }

    });
}

// ======================================
// Google Login
// ======================================

if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        async function () {

            if (!window.supabase) {

                alert(
                    "Authentication system is not loaded."
                );

                return;
            }

            if (typeof supabase === "undefined") {

                alert(
                    "Supabase connection is not available."
                );

                return;
            }

            try {

                const {
                    error
                } = await supabase.auth
                    .signInWithOAuth({

                        provider: "google",

                        options: {

                            redirectTo:
                                window.location.origin +
                                "/home.html"

                        }

                    });

                if (error) {

                    console.error(
                        "Google Login Error:",
                        error
                    );

                    alert(error.message);
                }

            } catch (error) {

                console.error(
                    "Unexpected Google Login Error:",
                    error
                );

                alert(
                    "Google login could not be started."
                );
            }
        }
    );
}

// ======================================
// Existing Session Check
// ======================================

(async function checkExistingSession() {

    if (
        !window.supabase ||
        typeof supabase === "undefined"
    ) {
        return;
    }

    try {

        const {
            data,
            error
        } = await supabase.auth.getSession();

        if (error) {

            console.error(
                "Session Error:",
                error
            );

            return;
        }

        if (
            data &&
            data.session
        ) {

            window.location.replace(
                "home.html"
            );
        }

    } catch (error) {

        console.error(
            "Unexpected Session Error:",
            error
        );
    }

})();

// ======================================
// Default State
// ======================================

showLogin();
