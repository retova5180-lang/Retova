// Avatar Preview
const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");

if (avatarInput && avatarPreview) {

    avatarInput.addEventListener("change", function () {

        const file = this.files[0];

        if (file) {

            avatarPreview.src = URL.createObjectURL(file);

        }

    });

}

// Show / Hide Password
const password = document.getElementById("password");
const showPassword = document.getElementById("showPassword");

if (showPassword && password) {

    showPassword.addEventListener("click", function () {

        if (password.type === "password") {

            password.type = "text";
            showPassword.innerHTML = "🙈";

        } else {

            password.type = "password";
            showPassword.innerHTML = "👁";

        }

    });

}

// Form Validation
const form = document.getElementById("signupForm");

if (form) {

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        const name = form.querySelector('input[placeholder="Name"]').value.trim();
        const username = form.querySelector('input[placeholder="Username"]').value.trim();
        const age = form.querySelector('input[placeholder="Age"]').value.trim();
        const email = form.querySelector('input[type="email"]').value.trim();
        const pass = password.value.trim();

        if (!name || !username || !age || !email || !pass) {

            alert("Please complete all fields.");
            return;

        }

        if (Number(age) < 9) {

            alert("Minimum age is 9.");
            return;

        }

        alert("Account Created Successfully 💜");

        // هنا لاحقًا بنربط قاعدة البيانات

    });

}
