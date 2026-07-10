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

const form = document.getElementById("signupForm");

form.addEventListener("submit", function (e) {

    e.preventDefault();

    const inputs = form.querySelectorAll("input[required]");

    let valid = true;

    inputs.forEach(input => {

        if (input.value.trim() === "") {

            valid = false;

            input.style.border = "2px solid #ff4d4d";

        } else {

            input.style.border = "";

        }

    });

    if (!valid) {

        alert("Please complete all required fields.");

        return;

    }

    alert("Account created successfully!");

    // لاحقًا هنا بنربط Supabase أو Firebase

});
