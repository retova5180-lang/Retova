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
      // 1. Load public profile data via user_profiles view
      const { data: userProfile, error: uErr } = await client
        .from("user_profiles")
        .select("id, username, display_name, bio, avatar, cover, verified, plan, is_private, account_type, profile_accent_color")
        .eq("id", currentAuthUser.id)
        .maybeSingle();

      if (uErr) throw uErr;

      // 2. Safely retrieve the current account email via get_my_account_email RPC
      let accountEmail = currentAuthUser.email || "";
      try {
        const { data: emailData, error: emailErr } = await client.rpc("get_my_account_email");
        if (!emailErr && emailData) {
          accountEmail = emailData;
        }
      } catch (e) {
        console.warn("Could not retrieve account email via RPC:", e);
      }

      let accountSettings = {};
      try {
        const { data: settingsData, error: settingsError } = await client.rpc("get_my_account_settings");
        if (settingsError) throw settingsError;
        accountSettings = settingsData || {};
      } catch (settingsError) {
        console.warn("Could not load private account settings:", settingsError);
      }

      activeProfile = {
        ...(userProfile || {}),
        ...accountSettings,
        id: currentAuthUser.id,
        email: accountEmail,
        display_name: userProfile?.display_name || currentAuthUser.user_metadata?.display_name || "User",
        username: userProfile?.username || currentAuthUser.user_metadata?.username || "user",
        plan: userProfile?.plan || "free",
        verified: userProfile?.verified || false,
        account_type: userProfile?.account_type || "personal",
        is_private: userProfile?.is_private || false,
        avatar: userProfile?.avatar || null,
        cover: userProfile?.cover || null,
        bio: userProfile?.bio || "",
        profile_accent_color: userProfile?.profile_accent_color || "#8b3dff",
        account_status: accountSettings.account_status || "active",
        username_changed_at: accountSettings.username_changed_at || null,
        online_status_visible: accountSettings.online_status_visible !== false,
        deletion_requested_at: accountSettings.deletion_requested_at || null,
        deactivated_at: accountSettings.deactivated_at || null
      };

      // 2. Load preferences
      const { data: prefData } = await client
        .from("user_preferences")
        .select("*")
        .eq("user_id", currentAuthUser.id)
        .maybeSingle();

      activePreferences = prefData || {};

      // Render UI
      await renderProfileCard();
      populateFormFields();
      checkScheduledDeletionStatus();

    } catch (err) {
      console.error("Failed loading user settings:", err);
      showToast("Failed to load settings data.", "error");
    }
  }

  async function renderProfileCard() {
    const p = activeProfile;
    if (!p) return;

    // Avatar
    const avEl = $("#settingsAvatarImg");
    if (avEl) {
      avEl.src = p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name || "User")}&background=790ce2&color=fff`;
    }

    // Name & verified
    const nameEl = $("#settingsDisplayName");
    if (nameEl) nameEl.textContent = p.display_name || p.username || "User";
    const verifiedBadge = $("#settingsVerifiedBadge");
    if (verifiedBadge) verifiedBadge.classList.toggle("hidden", !p.verified);

    // Username
    const usernameEl = $("#settingsUsername");
    if (usernameEl) usernameEl.textContent = "@" + (p.username || "user");

    // Secure fail-closed subscription check from server
    let isPremium = false;
    let activeSub = null;
    if (client && currentAuthUser?.id) {
      try {
        const { data: sub } = await client
          .from("subscriptions")
          .select("id, status, plan, expires_at, current_period_end")
          .eq("user_id", currentAuthUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sub && (sub.status === "active" || sub.status === "trialing" || sub.status === "paid")) {
          const expiry = sub.current_period_end || sub.expires_at;
          const isNotExpired = !expiry || (new Date(expiry).getTime() > Date.now());
          if (isNotExpired) {
            isPremium = true;
            activeSub = sub;
          }
        }
      } catch (subErr) {
        console.warn("Fail-closed subscription check:", subErr);
      }
    }

    const statusEl = $("#settingsPremiumStatus");
    const badgeEl = $("#premiumStatusBadge");

    if (isPremium) {
      if (statusEl) statusEl.textContent = "Premium Member";
      badgeEl?.classList.remove("hidden");
    } else {
      if (statusEl) statusEl.textContent = "Free Member";
      badgeEl?.classList.add("hidden");
    }

    // Modal card Premium text
    const premiumModalText = $("#premiumStatusText");
    if (premiumModalText) {
      premiumModalText.textContent = isPremium ? "ARS Premium Active" : "Free Plan";
    }
  }

  function populateFormFields() {
    const p = activeProfile || {};
    const pref = activePreferences || {};

    // Account Form
    const accEmail = $("#accEmail");
    if (accEmail) accEmail.value = currentAuthUser?.email || p.email || "";
    const accName = $("#accName");
    if (accName) accName.value = p.display_name || "";
    const accUsername = $("#accUsername");
    if (accUsername) accUsername.value = p.username || "";
    const accTypeEl = $("#accType") || $("#accTypeSelect");
    if (accTypeEl) accTypeEl.value = p.account_type || "Personal";
    const accStatusBadge = $("#accStatusBadge");
    if (accStatusBadge) accStatusBadge.textContent = p.account_status || "Active";

    // Privacy Form
    const togglePriv = $("#togglePrivateAccount");
    if (togglePriv) togglePriv.checked = Boolean(p.is_private);
    const toggleOnline = $("#toggleOnlineVisibility");
    if (toggleOnline) toggleOnline.checked = p.online_status_visible !== false;
    const toggleLikes = $("#toggleShowLikes");
    if (toggleLikes) toggleLikes.checked = pref.show_likes !== false;
    const toggleFollowers = $("#toggleShowFollowers");
    if (toggleFollowers) toggleFollowers.checked = pref.show_followers !== false;
    const toggleFollowing = $("#toggleShowFollowing");
    if (toggleFollowing) toggleFollowing.checked = pref.show_following !== false;
  }

  function checkScheduledDeletionStatus() {
    const banner = $("#scheduledDeletionBanner");
    if (!banner || !activeProfile) return;

    if (String(activeProfile.account_status || "").toLowerCase() === "deletion_pending") {
      banner.classList.remove("hidden");
      const dateText = activeProfile.deletion_requested_at 
        ? new Date(activeProfile.deletion_requested_at).toLocaleDateString()
        : "recently";
      const delDateEl = $("#deletionBannerDate");
      if (delDateEl) delDateEl.textContent = `Deletion requested on ${dateText}. Account is in a 30-day grace period.`;
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
    // Menu item clicks to open dialogs (supporting data-section and data-dialog)
    $$(".setting-item[data-section], .settings-item[data-dialog]").forEach(item => {
      item.addEventListener("click", () => {
        const sec = item.dataset.section || item.dataset.dialog?.replace("Dialog", "");
        const dialog = document.getElementById(sec + "Dialog") || document.getElementById(item.dataset.dialog);
        if (dialog) dialog.showModal();
      });
    });

    // Account card clicks open account dialog
    $("#settingsAccountCard")?.addEventListener("click", () => {
      $("#accountDialog")?.showModal();
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
    $("#logoutBtn")?.addEventListener("click", handleLogout);
  }

  async function handleAccountUpdate(e) {
    e.preventDefault();
    if (!client || !currentAuthUser) return;

    const dName = $("#accName").value.trim();
    const uName = $("#accUsername").value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
    const accTypeEl = $("#accType") || $("#accTypeSelect"); const accType = accTypeEl ? accTypeEl.value : (activeProfile?.account_type || "Personal");

    const saveBtn = $("#saveAccountBtn");
    saveBtn.disabled = true;

    try {
      const updates = {
        display_name: dName,
        account_type: accType
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
      }

      const { error } = await client.from("users").update(updates).eq("id", currentAuthUser.id);
      if (error) throw error;

      activeProfile = { ...activeProfile, ...updates };
      if (updates.username) activeProfile.username_changed_at = new Date().toISOString();
      await renderProfileCard();
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
        online_status_visible: onlineVisible
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
      
      const emailHint = $("#accEmailHint");
      if (emailHint) {
        emailHint.textContent = `Verification pending for: ${newEmail}`;
        emailHint.style.color = "#c084fc";
      }
      
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
      const statusBadge = $("#accStatusBadge");
      if (statusBadge) statusBadge.textContent = "Active";
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


    // Secure subscription modal handler (client cannot self-grant plan)
    $("#togglePremiumBtn")?.addEventListener("click", async () => {
      if (!client || !currentAuthUser) return;
      const btn = $("#togglePremiumBtn");
      btn.disabled = true;

      try {
        const { data: sub } = await client
          .from("subscriptions")
          .select("id, status, plan, expires_at, current_period_end")
          .eq("user_id", currentAuthUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const isActive = sub && (sub.status === "active" || sub.status === "trialing" || sub.status === "paid");
        const expiry = sub ? (sub.current_period_end || sub.expires_at) : null;
        const isNotExpired = !expiry || (new Date(expiry).getTime() > Date.now());

        if (isActive && isNotExpired) {
          const expStr = expiry ? new Date(expiry).toLocaleDateString() : "Continuous";
          showToast(`Your ARS Premium is active (Renews: ${expStr}). Contact billing support to manage recurring options.`, "success");
        } else {
          showToast("ARS Premium requires verified activation through authorized payment checkout. Self-activation is disabled for security.", "info");
        }
        $("#premiumDialog")?.close();
      } catch (err) {
        console.error("Subscription status error:", err);
        showToast("Could not verify subscription status.", "error");
      } finally {
        btn.disabled = false;
      }
    });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();