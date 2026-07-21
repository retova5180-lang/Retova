// Profile Preview

const avatarInput = document.getElementById("avatar");
const avatarImage = document.querySelector(".profile-preview img");

if (avatarInput && avatarImage) {

    avatarInput.addEventListener("change", function () {

        const file = this.files[0];

        if (file) {

            avatarImage.src = URL.createObjectURL(file);

        }

    });

}

// Banner Preview

const bannerInput = document.getElementById("banner");
const bannerImage = document.querySelector(".banner-preview img");

if (bannerInput && bannerImage) {

    bannerInput.addEventListener("change", function () {

        const file = this.files[0];

        if (file) {

            bannerImage.src = URL.createObjectURL(file);

            bannerImage.style.display = "block";

        }

    });

}
