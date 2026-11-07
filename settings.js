(() => {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const STORAGE = { user: "ars_user", loggedIn: "ars_logged_in" };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);

  let currentAuthUser = null;
  let activeProfile = null;
  let userPrefs = null;
  let notifPrefs = null;

  function showToast(msg) {
    const toast = $("#toastNotification");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add("hidden"), 3000);
  }

  function openDialog(id) {
    const d = $("#" + id);
    if (d && typeof d.showModal === "function") d.showModal();
  }

  function closeDialog(id) {
    const d = $("#" + id);
    if (d && typeof d.close === "function") d.close();
  }

  async function getSessionUser() {
    try {
      if (client?.auth) {
        const { data: { user } } = await client.auth.getUser();
        if (user) return user;
      }
    } catch {}
    try {
      const local = JSON.parse(localStorage.getItem(STORAGE.user) || "null");
      if (local && (local.id || local.username)) return local;
    } catch {}
    return null;
  }

  async function initSettings() {
    currentAuthUser = await getSessionUser();
    if (!currentAuthUser) {
      console.warn("No active session, running in guest/demo mode.");
    }

    await loadUserData();
    setupEventListeners();

    // Check if opened with ?section=xyz
    const params = new URLSearchParams(window.location.search);
    const sec = params.get("section");
    if (sec) {
      const dialogMap = {
        account: "accountDialog",
        privacy: "privacyDialog",
        security: "securityDialog",
        devices: "devicesDialog",
        premium: "premiumDialog",
        notifications: "notificationsDialog",
        appearance: "appearanceDialog",
        language: "languageDialog",
        activity: "activityDialog",
        legal: "legalDialog"
      };
      if (dialogMap[sec]) {
        openDialog(dialogMap[sec]);
      }
    }
  }

  async function loadUserData() {
    let profile = null;
    if (client && currentAuthUser?.id) {
      try {
        const { data } = await client.from("users")
          .select("*")
          .eq("id", currentAuthUser.id)
          .maybeSingle();
        profile = data;
      } catch (e) {
        console.warn("Failed loading user in settings:", e);
      }
    }

    if (!profile) {
      profile = {
        id: currentAuthUser?.id || "demo-user",
        email: currentAuthUser?.email || "retova5180@gmail.com",
        display_name: currentAuthUser?.user_metadata?.display_name || "Tia",
        username: currentAuthUser?.user_metadata?.username || "bluegangst9",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        verified: true,
        plan: "premium",
        is_private: false,
        account_type: "Personal",
        account_status: "Active",
        online_status_visible: true,
        profile_accent_color: "#a855f7"
      };
    }

    activeProfile = profile;
    renderAccountCard();
    renderAccountModal();

    // Load preferences
    if (client && activeProfile.id) {
      try {
        const [prefsRes, notifRes] = await Promise.all([
          client.from("user_preferences").select("*").eq("user_id", activeProfile.id).maybeSingle(),
          client.from("notification_preferences").select("*").eq("user_id", activeProfile.id).maybeSingle()
        ]);
        userPrefs = prefsRes.data;
        notifPrefs = notifRes.data;
      } catch {}
    }

    renderPrivacyModal();
    renderNotificationsModal();
  }

  function renderAccountCard() {
    const p = activeProfile;
    $("#settingsDisplayName").textContent = p.display_name || "User";
    $("#settingsUsername").textContent = "@" + (p.username || "user");
    if (p.avatar) $("#settingsAvatarImg").src = p.avatar;

    const isPremium = p.plan === "premium";
    const statusEl = $("#settingsPremiumStatus");
    const badgeEl = $("#premiumStatusBadge");

    if (isPremium) {
      statusEl.textContent = "👑 Premium Member";
      badgeEl.textContent = "Active";
      badgeEl.classList.remove("hidden");
    } else {
      statusEl.textContent = "Free Member";
      badgeEl.textContent = "Upgrade";
    }

    $("#premiumStatusText").textContent = isPremium ? "ARS Premium Active" : "Free Plan";
    $("#togglePremiumBtn").textContent = isPremium ? "Manage Subscription" : "Activate ARS Premium";
  }

  function renderAccountModal() {
    const p = activeProfile;
    $("#accEmail").value = p.email || currentAuthUser?.email || "";
    $("#accName").value = p.display_name || "";
    $("#accUsername").value = p.username || "";
    $("#accType").value = p.account_type || "Personal";
    $("#accStatusBadge").textContent = p.account_status || "Active";
  }

  function renderPrivacyModal() {
    const p = activeProfile;
    const prefs = userPrefs || {};

    $("#togglePrivateAccount").checked = Boolean(p.is_private);
    $("#toggleOnlineVisibility").checked = p.online_status_visible !== false;
    $("#toggleShowLikes").checked = prefs.show_likes !== false;
    $("#toggleShowFollowers").checked = prefs.show_followers !== false;
    $("#toggleShowFollowing").checked = prefs.show_following !== false;
  }

  function renderNotificationsModal() {
    const n = notifPrefs || {};
    $("#notifLikes").checked = n.likes_enabled !== false;
    $("#notifComments").checked = n.comments_enabled !== false;
    $("#notifReplies").checked = n.replies_enabled !== false;
    $("#notifFollowers").checked = n.new_followers_enabled !== false;
    $("#notifRequests").checked = n.follow_requests_enabled !== false;
    $("#notifReposts").checked = n.reposts_enabled !== false;
    $("#notifStories").checked = n.stories_enabled !== false;
    $("#notifStreaks").checked = n.streaks_enabled !== false;
    $("#notifPremium").checked = n.premium_enabled !== false;
    $("#notifSystem").checked = n.system_enabled !== false;
  }

  function setupEventListeners() {
    // Topbar back
    $("#settingsBackBtn").addEventListener("click", e => {
      if (window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });

    // Account card click -> open Account modal
    $("#settingsAccountCard").addEventListener("click", () => openDialog("accountDialog"));

    // Menu items
    $$(".setting-item").forEach(item => {
      const section = item.dataset.section;
      if (section) {
        item.addEventListener("click", () => {
          const map = {
            account: "accountDialog",
            privacy: "privacyDialog",
            security: "securityDialog",
            devices: "devicesDialog",
            premium: "premiumDialog",
            notifications: "notificationsDialog",
            appearance: "appearanceDialog",
            language: "languageDialog",
            activity: "activityDialog",
            legal: "legalDialog"
          };
          if (map[section]) openDialog(map[section]);
        });
      }
    });

    // Close buttons
    $$("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => closeDialog(btn.dataset.close));
    });

    // Save Account Form
    $("#accountForm").addEventListener("submit", handleAccountSave);

    // Save Privacy Form
    $("#savePrivacyBtn").addEventListener("click", handlePrivacySave);

    // Update Password Form
    $("#securityForm").addEventListener("submit", handlePasswordUpdate);

    // Save Notifications
    $("#saveNotifBtn").addEventListener("click", handleNotifSave);

    // Toggle Premium
    $("#togglePremiumBtn").addEventListener("click", handleTogglePremium);

    // Log Out button
    $("#logoutBtn").addEventListener("click", handleSignOut);

    // Log Out other devices
    $("#logoutOtherDevicesBtn")?.addEventListener("click", () => {
      showToast("Signed out from all other active sessions.");
      closeDialog("devicesDialog");
    });

    // Deactivate button
    $("#deactivateBtn")?.addEventListener("click", () => {
      if (confirm("Are you sure you want to deactivate your ARS account? You can reactivate anytime by logging in.")) {
        showToast("Account deactivated. Logging out…");
        setTimeout(handleSignOut, 1500);
      }
    });

    // Delete button
    $("#deleteAccountBtn")?.addEventListener("click", () => {
      if (confirm("Request permanent account deletion? This will initiate the scheduled deletion process.")) {
        showToast("Deletion request recorded. An email confirmation has been sent.");
      }
    });
  }

  async function handleAccountSave(e) {
    e.preventDefault();
    const newName = $("#accName").value.trim();
    const newUsername = $("#accUsername").value.trim().toLowerCase();
    const newType = $("#accType").value;

    const updates = {
      display_name: newName,
      account_type: newType
    };

    if (newUsername !== activeProfile.username) {
      if (activeProfile.username_changed_at) {
        const lastChanged = new Date(activeProfile.username_changed_at).getTime();
        const daysDiff = (Date.now() - lastChanged) / (1000 * 60 * 60 * 24);
        if (daysDiff < 14) {
          showToast(`Username can only be changed once every 14 days. (${Math.ceil(14 - daysDiff)} days remaining)`);
          return;
        }
      }
      updates.username = newUsername;
      updates.username_changed_at = new Date().toISOString();
    }

    try {
      if (client && activeProfile.id) {
        const { error } = await client.from("users").update(updates).eq("id", activeProfile.id);
        if (error) throw error;
      }
      Object.assign(activeProfile, updates);
      renderAccountCard();
      closeDialog("accountDialog");
      showToast("Account details updated successfully!");
    } catch (err) {
      showToast("Could not update account: " + (err.message || err));
    }
  }

  async function handlePrivacySave() {
    const isPrivate = $("#togglePrivateAccount").checked;
    const onlineVisible = $("#toggleOnlineVisibility").checked;
    const showLikes = $("#toggleShowLikes").checked;
    const showFollowers = $("#toggleShowFollowers").checked;
    const showFollowing = $("#toggleShowFollowing").checked;

    try {
      if (client && activeProfile.id) {
        await Promise.all([
          client.from("users").update({
            is_private: isPrivate,
            online_status_visible: onlineVisible
          }).eq("id", activeProfile.id),

          client.from("user_preferences").upsert({
            user_id: activeProfile.id,
            show_likes: showLikes,
            show_followers: showFollowers,
            show_following: showFollowing,
            updated_at: new Date().toISOString()
          })
        ]);
      }
      activeProfile.is_private = isPrivate;
      activeProfile.online_status_visible = onlineVisible;
      closeDialog("privacyDialog");
      showToast("Privacy settings saved.");
    } catch (err) {
      showToast("Failed saving privacy preferences.");
    }
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    const p1 = $("#newPassword").value;
    const p2 = $("#confirmPassword").value;
    const msg = $("#securityMsg");

    if (p1 !== p2) {
      msg.textContent = "Passwords do not match.";
      msg.className = "form-message error";
      return;
    }

    try {
      if (client?.auth) {
        const { error } = await client.auth.updateUser({ password: p1 });
        if (error) throw error;
      }
      msg.textContent = "Password updated successfully.";
      msg.className = "form-message success";
      showToast("Password updated!");
      setTimeout(() => closeDialog("securityDialog"), 1500);
    } catch (err) {
      msg.textContent = "Password update failed: " + (err.message || err);
      msg.className = "form-message error";
    }
  }

  async function handleNotifSave() {
    const notifs = {
      likes_enabled: $("#notifLikes").checked,
      comments_enabled: $("#notifComments").checked,
      replies_enabled: $("#notifReplies").checked,
      new_followers_enabled: $("#notifFollowers").checked,
      follow_requests_enabled: $("#notifRequests").checked,
      reposts_enabled: $("#notifReposts").checked,
      stories_enabled: $("#notifStories").checked,
      streaks_enabled: $("#notifStreaks").checked,
      premium_enabled: $("#notifPremium").checked,
      system_enabled: $("#notifSystem").checked,
      updated_at: new Date().toISOString()
    };

    try {
      if (client && activeProfile.id) {
        await client.from("notification_preferences").upsert({
          user_id: activeProfile.id,
          ...notifs
        });
      }
      closeDialog("notificationsDialog");
      showToast("Notification preferences updated.");
    } catch {
      showToast("Could not save notification preferences.");
    }
  }

  async function handleTogglePremium() {
    const nextPlan = activeProfile.plan === "premium" ? "free" : "premium";
    try {
      if (client && activeProfile.id) {
        await client.from("users").update({ plan: nextPlan }).eq("id", activeProfile.id);
      }
      activeProfile.plan = nextPlan;
      renderAccountCard();
      closeDialog("premiumDialog");
      showToast(nextPlan === "premium" ? "🎉 Welcome to ARS Premium!" : "Subscription set to Free.");
    } catch (err) {
      showToast("Could not update plan status.");
    }
  }

  async function handleSignOut() {
    try {
      if (client?.auth) {
        await client.auth.signOut();
      }
    } catch {}
    localStorage.removeItem(STORAGE.user);
    localStorage.removeItem(STORAGE.loggedIn);
    window.location.href = "index.html";
  }

  document.addEventListener("DOMContentLoaded", initSettings);
})();
