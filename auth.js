alert("auth.js loaded");
// ======================================
// Retova Auth
// Part 1
// ======================================

// Forms

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

// Tabs

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

// Bottom Switch

const switchForm = document.getElementById("switchForm");
const bottomText = document.getElementById("bottomText");

// Avatar

const avatarUpload = document.getElementById("avatarUpload");
const avatarPreview = document.getElementById("avatarPreview");

// ======================================
// Switch Forms
// ======================================

function showLogin() {

loginForm.style.display = "block";
signupForm.style.display = "none";

loginTab.classList.add("active");
signupTab.classList.remove("active");

bottomText.textContent = "Don't have an account?";
switchForm.textContent = "Create Account";

}

function showSignup() {

loginForm.style.display = "none";
signupForm.style.display = "block";

signupTab.classList.add("active");
loginTab.classList.remove("active");

bottomText.textContent = "Already have an account?";
switchForm.textContent = "Login";

}

// ======================================
// Events
// ======================================

loginTab.onclick = showLogin;

signupTab.onclick = showSignup;

switchForm.onclick = function(e){

e.preventDefault();

if(signupForm.style.display === "none"){

showSignup();

}else{

showLogin();

}

};
// ======================================
// Avatar Preview
// ======================================

avatarUpload.addEventListener("change", function () {

const file = this.files[0];

if (!file) return;

const reader = new FileReader();

reader.onload = function (e) {

avatarPreview.src = e.target.result;

};

reader.readAsDataURL(file);

});

// ======================================
// Calculate Age
// ======================================

function calculateAge(birthDate){

const today = new Date();

const birth = new Date(birthDate);

let age = today.getFullYear() - birth.getFullYear();

const month = today.getMonth() - birth.getMonth();

if(month < 0 || (month === 0 && today.getDate() < birth.getDate())){

age--;

}

return age;

}
// ======================================
// Create Account
// ======================================

signupForm.addEventListener("submit", async function(e){

console.log("Signup button works");

e.preventDefault();

const displayName = document.getElementById("displayName").value.trim();

const username = document.getElementById("username").value.trim();

const email = document.getElementById("signupEmail").value.trim();

const password = document.getElementById("signupPassword").value;

const confirmPassword = document.getElementById("confirmPassword").value;

const birthDate = document.getElementById("birthDate").value;

if(password !== confirmPassword){

alert("Passwords do not match.");

return;

}

const age = calculateAge(birthDate);

// إنشاء الحساب في Supabase Auth

const { data, error } = await supabase.auth.signUp({

email,

password

});

if(error){

alert(error.message);

return;

}

const user = data.user;

let avatarUrl = "";

// رفع الصورة إذا اختار المستخدم واحدة
if(avatarUpload.files.length > 0){

const file = avatarUpload.files[0];

const fileName = `${user.id}-${Date.now()}`;

const { error: uploadError } = await supabase.storage

.from("avatars")

.upload(fileName, file);

if(!uploadError){

const { data: publicUrl } = supabase.storage

.from("avatars")

.getPublicUrl(fileName);

avatarUrl = publicUrl.publicUrl;

}

}

// حفظ البيانات في جدول users

const { error: profileError } = await supabase

.from("users")

.insert({

id: user.id,

username: username,

full_name: displayName,

avatar: avatarUrl,

age: age

});

if(profileError){

alert(profileError.message);

return;

}

alert("Account created successfully!");

});
// ======================================
// Login
// ======================================

loginForm.addEventListener("submit", async function(e){

e.preventDefault();

const email = document.getElementById("loginEmail").value.trim();

const password = document.getElementById("loginPassword").value;

const { error } = await supabase.auth.signInWithPassword({

email,

password

});

if(error){

alert(error.message);

return;

}

// الانتقال للصفحة الرئيسية

window.location.href = "home.html";

});

// ======================================
// Google Login
// ======================================

document.getElementById("googleLogin").addEventListener("click", async () => {

const { error } = await supabase.auth.signInWithOAuth({

provider: "google",

options: {

redirectTo: window.location.origin + "/home.html"

}

});

if(error){

alert(error.message);

}

});

// ======================================
// Session Check
// ======================================

(async () => {

const { data } = await supabase.auth.getSession();

if(data.session){

window.location.href = "home.html";

}

})();
