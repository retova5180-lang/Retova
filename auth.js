// ======================================
// Retova Auth
// Local Version
// ======================================

// Forms
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

// Tabs
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

// Bottom Link
const switchForm = document.getElementById("switchForm");

// Avatar
const avatarUpload = document.getElementById("avatarUpload");
const avatarPreview = document.getElementById("avatarPreview");

// ======================================
// Switch Forms
// ======================================

function showLogin(){

loginForm.style.display="block";
signupForm.style.display="none";

loginTab.classList.add("active");
signupTab.classList.remove("active");

}

function showSignup(){

loginForm.style.display="none";
signupForm.style.display="block";

signupTab.classList.add("active");
loginTab.classList.remove("active");

}

loginTab.onclick=showLogin;

signupTab.onclick=showSignup;

switchForm.onclick=(e)=>{

e.preventDefault();

if(signupForm.style.display==="none"){

showSignup();

}else{

showLogin();

}

};

// ======================================
// Avatar Preview
// ======================================

avatarUpload?.addEventListener("change",()=>{

const file=avatarUpload.files[0];

if(!file) return;

avatarPreview.src=URL.createObjectURL(file);

});

// ======================================
// Start
// ======================================

showLogin();
// ======================================
// Create Account
// ======================================

signupForm?.addEventListener("submit",(e)=>{

e.preventDefault();

const displayName=document.getElementById("displayName").value.trim();

const username=document.getElementById("username").value.trim().toLowerCase();

const email=document.getElementById("signupEmail").value.trim().toLowerCase();

const password=document.getElementById("signupPassword").value;

const confirmPassword=document.getElementById("confirmPassword").value;

const birthDate=document.getElementById("birthDate").value;

if(
!displayName||
!username||
!email||
!password||
!confirmPassword||
!birthDate
){

alert("يرجى تعبئة جميع الحقول.");

return;

}

if(password!==confirmPassword){

alert("كلمتا المرور غير متطابقتين.");

return;

}

const users=JSON.parse(localStorage.getItem("retova_users"))||[];

const exists=users.find(user=>user.email===email);

if(exists){

alert("هذا البريد مستخدم بالفعل.");

return;

}

const avatar=avatarPreview.src;

users.push({

displayName,

username,

email,

password,

birthDate,

avatar

});

localStorage.setItem("retova_users",JSON.stringify(users));

localStorage.setItem("retova_current_user",email);

window.location.href="home.html";

});
// ======================================
// Login
// ======================================

loginForm?.addEventListener("submit",(e)=>{

e.preventDefault();

const email=document.getElementById("loginEmail").value.trim().toLowerCase();

const password=document.getElementById("loginPassword").value;

if(!email||!password){

alert("يرجى إدخال البريد وكلمة المرور.");

return;

}

const users=JSON.parse(localStorage.getItem("retova_users"))||[];

const user=users.find(u=>u.email===email&&u.password===password);

if(!user){

alert("البريد الإلكتروني أو كلمة المرور غير صحيحة.");

return;

}

localStorage.setItem("retova_current_user",email);

window.location.href="home.html";

});
// ======================================
// Session
// ======================================

const currentUser = localStorage.getItem("retova_current_user");

if (
currentUser &&
window.location.pathname.includes("index.html")
) {

window.location.href = "home.html";

}
