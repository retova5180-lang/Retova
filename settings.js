/**
 * ARS — Settings & Preferences Logic
 * Manages Account information, Privacy, Security, Devices, Notifications,
 * Theme, and Secure Account Lifecycle operations (Email Change, Deactivation, Deletion).
 */

(function () {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

  let client = null;
  let currentAuthUser = null;
  let activeProfile = null;
  let activePreferences = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `ars-toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 20);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function init() {
    if (window.supabase) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }

    if (!client) {
      showToast("Could not connect to ARS service.", "error");
      return;
    }

    try {
      const { data: { session } } = await client.auth.getSession();
      currentAuthUser = session?.user || null;

      if (!currentAuthUser) {
        // Must be logged in to view settings
        window.location.href = "index.html";
        return;
      }

      await loadUserData();
      setupEventListeners();
      checkDeepLinkSection();
    } catch (e) {
      console.error("Settings initialization error:", e);
    }
  }

  async function loadUserData() {
    try {
      // 1. Load users table data
      const { data: userProfile, error: uErr } = await client
        .from("users")
        .select("*")
        .eq("id", currentAuthUser.id)
        .maybeSingle();

      if (uErr) throw uErr;

      activeProfile = userProfile || {
        id: currentAuthUser.id,
        email: currentAuthUser.email,
        display_name: currentAuthUser.user_metadata?.display_name || "User",
        username: currentAuthUser.user_metadata?.username || "user",
        account_status: "active"
      };

      // 2. Load preferences
      const { data: prefData } = await client
        .from("user_preferences")
        .select("*")
        .eq("user_id", currentAuthUser.id)
        .maybeSingle();

      activePreferences = prefData || {};

      // Render UI
      renderProfileCard();
      populateFormFields();
      checkScheduledDeletionStatus();

    } catch (err) {
      console.error("Failed loading user settings:", err);
      showToast("Failed to load settings data.", "error");
    }
  }

  function renderProfileCard() {
    const p = activeProfile;
    if (!p) return;

    // Avatar
    const avEl = $("#settingsAvatarImg");
    if (avEl) {
      avEl.src = p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name || "User")}&background=790ce2&color=fff`;
    }

    // Name & verified
    $("#settingsDisplayName").textContent = p.display_name || p.username || "User";
    $("#settingsVerifiedBadge").classList.toggle("hidden", !p.verified);

    // Username
    $("#settingsUsername").textContent = "@" + (p.username || "user");

    // Premium status in card
    const isPremium = p.plan === "premium" || p.plan === "pro";
    const statusEl = $("#settingsPremiumStatus");
    const badgeEl = $("#premiumStatusBadge");

    if (isPremium) {
      statusEl.textContent = "👑 Premium Member";
      badgeEl?.classList.remove("hidden");
    } else {
      statusEl.textContent = "Free Member";
      badgeEl?.classList.add("hidden");
    }

    // Modal card Premium text
    const premiumModalText = $("#premiumStatusText");
    if (premiumModalText) {
      premiumModalText.textContent = isPremium ? "ARS Premium Active" : "Free Plan";
    }
  }

  function populateFormFields() {
    const p = activeProfile;
    const pref = activePreferences;

    // Account Form
    $("#accEmail").value = currentAuthUser?.email || p.email || "";
    $("#accName").value = p.display_name || "";
    $("#accUsername").value = p.username || "";
    $("#accTypeSelect").value = p.account_type || "Personal";
    $("#accStatusBadge").textContent = p.account_status || "Active";

    // Privacy Form
    $("#togglePrivateAccount").checked = Boolean(p.is_private);
    $("#toggleOnlineVisibility").checked = p.online_status_visible !== false;
    $("#toggleShowLikes").checked = pref.show_likes !== false;
    $("#toggleShowFollowers").checked = pref.show_followers !== false;
    $("#toggleShowFollowing").checked = pref.show_following !== false;
  }

  function checkScheduledDeletionStatus() {
    const banner = $("#scheduledDeletionBanner");
    if (!banner || !activeProfile) return;

    if (activeProfile.account_status === "Deletion Pending") {
      banner.classList.remove("hidden");
      const dateText = activeProfile.deletion_requested_at 
        ? new Date(activeProfile.deletion_requested_at).toLocaleDateString()
        : "recently";
      $("#deletionBannerDate").textContent = `Deletion requested on ${dateText}. Account is in a 30-day grace period.`;
    } else {
      banner.classList.add("hidden");
    }
  }

  function checkDeepLinkSection() {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get("section");
    if (sec) {
      const dialog = document.getElementById(sec + "Dialog");
      if (dialog) dialog.showModal();
    }
  }

  function setupEventListeners() {
    // Menu item clicks to open dialogs
    $$(".settings-item[data-dialog]").forEach(item => {
      item.addEventListener("click", () => {
        const dialogId = item.dataset.dialog;
        const dialog = document.getElementById(dialogId);
        if (dialog) dialog.showModal();
      });
    });

    // Close buttons on all modals
    $$("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => {
        const dialogId = btn.dataset.close;
        const dialog = document.getElementById(dialogId);
        if (dialog) dialog.close();
      });
    });

    // Save Account Form
    $("#accountForm")?.addEventListener("submit", handleAccountUpdate);

    // Save Privacy Form
    $("#savePrivacyBtn")?.addEventListener("click", handlePrivacyUpdate);

    // Security Form (Password update)
    $("#securityForm")?.addEventListener("submit", handlePasswordUpdate);

    // Change Email Dialog triggers
    $("#openChangeEmailBtn")?.addEventListener("click", () => {
      $("#currentEmailVal").value = currentAuthUser.email;
      $("#newEmailInput").value = "";
      $("#confirmPassForEmail").value = "";
      const msg = $("#changeEmailStatusMsg");
      msg.className = "modal-status-msg hidden";
      msg.textContent = "";
      $("#changeEmailDialog")?.showModal();
    });

    $("#changeEmailForm")?.addEventListener("submit", handleEmailChange);

    // Deactivate Dialog triggers
    $("#deactivateBtn")?.addEventListener("click", () => {
      $("#deactivatePasswordInput").value = "";
      $("#deactivateAgreeCheck").checked = false;
      const msg = $("#deactivateStatusMsg");
      msg.className = "modal-status-msg hidden";
      msg.textContent = "";
      $("#deactivateDialog")?.showModal();
    });

    $("#deactivateForm")?.addEventListener("submit", handleDeactivateAccount);

    // Delete Account Dialog triggers
    $("#deleteAccountBtn")?.addEventListener("click", () => {
      $("#deletePasswordInput").value = "";
      $("#deleteConfirmWordInput").value = "";
      const msg = $("#deleteAccountStatusMsg");
      msg.className = "modal-status-msg hidden";
      msg.textContent = "";
      $("#deleteAccountDialog")?.showModal();
    });

    $("#deleteAccountForm")?.addEventListener("submit", handleDeleteAccount);

    // Cancel Scheduled Deletion button
    $("#cancelDeletionBtn")?.addEventListener("click", handleCancelDeletion);

    // Logout Item
    $("#logoutItem")?.addEventListener("click", handleLogout);
  }

  async function handleAccountUpdate(e) {
    e.preventDefault();
    if (!client || !currentAuthUser) return;

    const dName = $("#accName").value.trim();
    const uName = $("#accUsername").value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
    const accType = $("#accTypeSelect").value;

    const saveBtn = $("#saveAccountBtn");
    saveBtn.disabled = true;

    try {
      const updates = {
        display_name: dName,
        account_type: accType,
        updated_at: new Date().toISOString()
      };

      if (uName && uName !== activeProfile.username) {
        if (activeProfile.username_changed_at) {
          const last = new Date(activeProfile.username_changed_at).getTime();
          const daysDiff = (Date.now() - last) / (1000 * 60 * 60 * 24);
          if (daysDiff < 14) {
            const rem = Math.ceil(14 - daysDiff);
            showToast(`Username can only be changed every 14 days (${rem} days left).`, "warning");
            saveBtn.disabled = false;
            return;
          }
        }
        updates.username = uName;
        updates.username_changed_at = new Date().toISOString();
      }

      const { error } = await client.from("users").update(updates).eq("id", currentAuthUser.id);
      if (error) throw error;

      activeProfile = { ...activeProfile, ...updates };
      renderProfileCard();
      $("#accountDialog")?.close();
      showToast("Account details updated successfully!");
    } catch (err) {
      console.error("Account update error:", err);
      showToast(err.message || "Failed to update account.", "error");
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function handlePrivacyUpdate() {
    if (!client || !currentAuthUser) return;

    const isPrivate = $("#togglePrivateAccount").checked;
    const onlineVisible = $("#toggleOnlineVisibility").checked;
    const showLikes = $("#toggleShowLikes").checked;
    const showFollowers = $("#toggleShowFollowers").checked;
    const showFollowing = $("#toggleShowFollowing").checked;

    const saveBtn = $("#savePrivacyBtn");
    saveBtn.disabled = true;

    try {
      // 1. Update users table
      const { error: userErr } = await client.from("users").update({
        is_private: isPrivate,
        online_status_visible: onlineVisible,
        updated_at: new Date().toISOString()
      }).eq("id", currentAuthUser.id);

      if (userErr) throw userErr;

      // 2. Upsert user_preferences
      const { error: prefErr } = await client.from("user_preferences").upsert({
        user_id: currentAuthUser.id,
        show_likes: showLikes,
        show_followers: showFollowers,
        show_following: showFollowing,
        online_visibility: onlineVisible ? "everyone" : "nobody",
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

      if (prefErr) throw prefErr;

      activeProfile.is_private = isPrivate;
      activeProfile.online_status_visible = onlineVisible;
      activePreferences = { ...activePreferences, show_likes: showLikes, show_followers: showFollowers, show_following: showFollowing };

      $("#privacyDialog")?.close();
      showToast("Privacy settings saved!");
    } catch (err) {
      console.error("Privacy update error:", err);
      showToast("Failed to save privacy settings.", "error");
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    const p1 = $("#newPassword").value;
    const p2 = $("#confirmPassword").value;
    const msg = $("#securityMsg");

    if (p1 !== p2) {
      msg.className = "form-msg error";
      msg.textContent = "Passwords do not match.";
      msg.classList.remove("hidden");
      return;
    }

    if (p1.length < 8) {
      msg.className = "form-msg error";
      msg.textContent = "Password must be at least 8 characters.";
      msg.classList.remove("hidden");
      return;
    }

    try {
      const { error } = await client.auth.updateUser({ password: p1 });
      if (error) throw error;

      msg.className = "form-msg success";
      msg.textContent = "Password updated successfully.";
      msg.classList.remove("hidden");
      $("#newPassword").value = "";
      $("#confirmPassword").value = "";
      showToast("Password updated!");
      setTimeout(() => $("#securityDialog")?.close(), 1200);
    } catch (err) {
      msg.className = "form-msg error";
      msg.textContent = err.message || "Failed to update password.";
      msg.classList.remove("hidden");
    }
  }

  async function handleEmailChange(e) {
    e.preventDefault();
    const newEmail = $("#newEmailInput").value.trim();
    const password = $("#confirmPassForEmail").value;
    const msg = $("#changeEmailStatusMsg");
    const submitBtn = $("#submitChangeEmailBtn");

    if (!newEmail || !password) return;

    if (newEmail === currentAuthUser.email) {
      msg.className = "modal-status-msg error";
      msg.textContent = "New email must be different from current email.";
      msg.classList.remove("hidden");
      return;
    }

    submitBtn.disabled = true;
    msg.className = "modal-status-msg info";
    msg.textContent = "Verifying identity…";
    msg.classList.remove("hidden");

    try {
      // 1. Verify identity by re-authenticating with password
      const { error: signInErr } = await client.auth.signInWithPassword({
        email: currentAuthUser.email,
        password: password
      });

      if (signInErr) {
        msg.className = "modal-status-msg error";
        msg.textContent = "Identity verification failed: Incorrect current password.";
        submitBtn.disabled = false;
        return;
      }

      // 2. Call Supabase Auth to request email update
      const { data, error: updateErr } = await client.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: window.location.origin + "/settings.html" }
      );

      if (updateErr) throw updateErr;

      msg.className = "modal-status-msg success";
      msg.textContent = `A verification link has been sent to ${newEmail}. Please click the link in your inbox to complete the change.`;
      
      $("#accEmailHint").textContent = `Verification pending for: ${newEmail}`;
      $("#accEmailHint").style.color = "#c084fc";
      
      showToast("Verification link sent! Check your email.");
      setTimeout(() => $("#changeEmailDialog")?.close(), 3000);

    } catch (err) {
      msg.className = "modal-status-msg error";
      msg.textContent = err.message || "Failed to initiate email change.";
    } finally {
      submitBtn.disabled = false;
    }
  }

  async function handleDeactivateAccount(e) {
    e.preventDefault();
    const password = $("#deactivatePasswordInput").value;
    const agree = $("#deactivateAgreeCheck").checked;
    const msg = $("#deactivateStatusMsg");
    const submitBtn = $("#confirmDeactivateBtn");

    if (!password || !agree) return;

    submitBtn.disabled = true;
    msg.className = "modal-status-msg info";
    msg.textContent = "Verifying credentials…";
    msg.classList.remove("hidden");

    try {
      // Verify password
      const { error: authErr } = await client.auth.signInWithPassword({
        email: currentAuthUser.email,
        password: password
      });

      if (authErr) {
        msg.className = "modal-status-msg error";
        msg.textContent = "Identity verification failed: Incorrect password.";
        submitBtn.disabled = false;
        return;
      }

      // Update Supabase users table
      const now = new Date().toISOString();
      const { error: dbErr } = await client.from("users").update({
        account_status: "Deactivated",
        deactivated_at: now
      }).eq("id", currentAuthUser.id);

      if (dbErr) throw dbErr;

      // Sign out
      await client.auth.signOut();
      localStorage.clear();

      alert("Your ARS account has been deactivated. You can reactivate anytime simply by logging back in.");
      window.location.href = "index.html";

    } catch (err) {
      msg.className = "modal-status-msg error";
      msg.textContent = err.message || "Failed to deactivate account.";
      submitBtn.disabled = false;
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    const password = $("#deletePasswordInput").value;
    const confirmWord = $("#deleteConfirmWordInput").value.trim().toUpperCase();
    const msg = $("#deleteAccountStatusMsg");
    const submitBtn = $("#confirmDeleteAccountBtn");

    if (confirmWord !== "DELETE") {
      msg.className = "modal-status-msg error";
      msg.textContent = "Please type DELETE to confirm.";
      msg.classList.remove("hidden");
      return;
    }

    submitBtn.disabled = true;
    msg.className = "modal-status-msg info";
    msg.textContent = "Verifying identity…";
    msg.classList.remove("hidden");

    try {
      // Verify password
      const { error: authErr } = await client.auth.signInWithPassword({
        email: currentAuthUser.email,
        password: password
      });

      if (authErr) {
        msg.className = "modal-status-msg error";
        msg.textContent = "Identity verification failed: Incorrect password.";
        submitBtn.disabled = false;
        return;
      }

      // Update Supabase users table to initiate 30-day grace period
      const now = new Date().toISOString();
      const { error: dbErr } = await client.from("users").update({
        account_status: "Deletion Pending",
        deletion_requested_at: now
      }).eq("id", currentAuthUser.id);

      if (dbErr) throw dbErr;

      // Sign out
      await client.auth.signOut();
      localStorage.clear();

      alert("Your account deletion request has been submitted. Your account is now in a 30-day grace period. You can cancel deletion anytime during this period by logging in.");
      window.location.href = "index.html";

    } catch (err) {
      msg.className = "modal-status-msg error";
      msg.textContent = err.message || "Failed to process deletion request.";
      submitBtn.disabled = false;
    }
  }

  async function handleCancelDeletion() {
    if (!client || !currentAuthUser) return;

    if (!confirm("Cancel account deletion request and restore account to active?")) return;

    try {
      const { error } = await client.from("users").update({
        account_status: "active",
        deletion_requested_at: null
      }).eq("id", currentAuthUser.id);

      if (error) throw error;

      activeProfile.account_status = "active";
      activeProfile.deletion_requested_at = null;
      $("#scheduledDeletionBanner")?.classList.add("hidden");
      $("#accStatusBadge").textContent = "Active";
      showToast("Deletion request cancelled. Account is now active!");
    } catch (err) {
      showToast("Failed to cancel deletion request.", "error");
    }
  }

  async function handleLogout() {
    if (!confirm("Are you sure you want to log out of ARS?")) return;
    if (client) {
      await client.auth.signOut();
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();