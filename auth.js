// ======================================
// Retova Auth v2
// Part 1
// ======================================

// Forms
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

// Tabs
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

// Bottom
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

    bottomText.innerHTML =
    `Don't have an account?
    <a href="#" id="switchForm">Create Account</a>`;

    document
      .getElementById("switchForm")
      .addEventListener("click", switchForms);

}

function showSignup() {

    loginForm.style.display = "none";
    signupForm.style.display = "block";

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    bottomText.innerHTML =
    `Already have an account?
    <a href="#" id="switchForm">Login</a>`;

    document
      .getElementById("switchForm")
      .addEventListener("click", switchForms);

}

function switchForms(e){

    e.preventDefault();

    if(signupForm.style.display==="none"){
        showSignup();
    }else{
        showLogin();
    }

}

loginTab.onclick = showLogin;
signupTab.onclick = showSignup;
document
.getElementById("switchForm")
.addEventListener("click",switchForms);

// ======================================
// Avatar Preview
// ======================================

avatarUpload.addEventListener("change",()=>{

    const file=avatarUpload.files[0];

    if(!file)return;

    avatarPreview.src=URL.createObjectURL(file);

});

// ======================================
// Age
// ======================================

function calculateAge(date){

    const today=new Date();

    const birth=new Date(date);

    let age=today.getFullYear()-birth.getFullYear();

    const month=today.getMonth()-birth.getMonth();

    if(
        month<0||
        (
            month===0&&
            today.getDate()<birth.getDate()
        )
    ){
        age--;
    }

    return age;

}
// ======================================
// Create Account
// ======================================

signupForm.addEventListener("submit", async (e) => {

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

    // إنشاء الحساب
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

    // رفع الصورة
    if(avatarUpload.files.length > 0){

        const file = avatarUpload.files[0];

        const fileName = `${user.id}-${Date.now()}`;

        const { error: uploadError } =
        await supabase.storage
        .from("avatars")
        .upload(fileName, file);

        if(!uploadError){

            const { data: publicData } =
            supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);

            avatarUrl = publicData.publicUrl;

        }

    }

    // حفظ البيانات
    const { error: profileError } =
    await supabase
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

loginForm.addEventListener("submit", async (e) => {

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
