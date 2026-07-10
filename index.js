const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");

if (avatarInput) {
    avatarInput.addEventListener("change", function () {

        const file = this.files[0];

        if (file) {
            avatarPreview.src = URL.createObjectURL(file);
        }

    });
}

const password = document.getElementById("password");
const showPassword = document.getElementById("showPassword");

showPassword.addEventListener("click", function () {

    if (password.type === "password") {

        password.type = "text";
        showPassword.textContent = "🙈";

    } else {

        password.type = "password";
        showPassword.textContent = "👁";

    }

});

const form = document.getElementById("signupForm");

form.addEventListener("submit", function (e) {

    e.preventDefault();

    alert("Welcome to Retova 💜");

    // لاحقًا هنا بنربط التسجيل الحقيقي

});
