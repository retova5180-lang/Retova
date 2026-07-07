
const signupTab = document.getElementById("signupTab");
const loginTab = document.getElementById("loginTab");

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

signupTab.addEventListener("click", () => {

signupTab.classList.add("active");
loginTab.classList.remove("active");

signupForm.style.display = "flex";
loginForm.style.display = "none";

});

loginTab.addEventListener("click", () => {

loginTab.classList.add("active");
signupTab.classList.remove("active");

signupForm.style.display = "none";
loginForm.style.display = "flex";

});
