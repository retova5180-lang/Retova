(() => {
  "use strict";
  const URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const db = window.supabase?.createClient(URL, KEY);
  const page = document.body.dataset.page;
  const $ = selector => document.querySelector(selector);
  let user = null;

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }
  function notify(message) {
    let node = document.querySelector(".toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "toast";
      document.body.append(node);
    }
    node.textContent = message;
    window.setTimeout(() => node.remove(), 3200);
  }
  function empty(message) {
    return '<p class="empty">' + escapeHTML(message) + '</p>';
  }
  function relativeTime(value) {
    const date = new Date(value || Date.now());
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  }
  async function getUser() {
    if (!db) throw new Error("Supabase client failed to load.");
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    user = data.session?.user || null;
    if (!user) {
      try {
        const cached = JSON.parse(localStorage.getItem("ars_user") || "null");
        if (cached?.id) user = { id: cached.id, email: cached.email };
      } catch {}
    }
    if (!user?.id) throw new Error("Please sign in to access this page.");
    return user.id;
  }
  async function loadProfile() {
    const { data: profile, error } = await db.from("users")
      .select("id,username,display_name,email,bio,avatar,verified,plan,streak,xp,vip_badge_enabled")
      .eq("id", user.id).maybeSingle();
    if (error) throw error;
    if (!profile) throw new Error("Your ARS profile could not be found.");
    $("#profileName").textContent = profile.display_name || profile.username || "Your profile";
    $("#profileUsername").textContent = profile.username ? "@" + profile.username : (profile.email || "");
    $("#profilePlan").textContent = (profile.plan || "Free") + (profile.vip_badge_enabled ? " · VIP" : "");
    $("#displayName").value = profile.display_name || "";
    $("#bio").value = profile.bio || "";
    $("#avatarUrl").value = profile.avatar || "";
    const avatar = $("#profileAvatar");
    if (profile.avatar) {
      avatar.innerHTML = "";
      avatar.style.backgroundImage = 'url("' + String(profile.avatar).replace(/"/g, "%22") + '")';
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
    } else avatar.textContent = (profile.display_name || profile.username || "A").charAt(0).toUpperCase();
    const [posts, followers, following] = await Promise.all([
      db.from("posts").select("id,content,created_at,privacy").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      db.from("followers").select("id", { count: "exact", head: true }).eq("following_id", user.id),
      db.from("followers").select("id", { count: "exact", head: true }).eq("follower_id", user.id)
    ]);
    if (posts.error) throw posts.error;
    $("#postCount").textContent = String(posts.data?.length || 0);
    $("#followerCount").textContent = String(followers.count || 0);
    $("#followingCount").textContent = String(following.count || 0);
    $("#profilePosts").innerHTML = posts.data?.length ? posts.data.map(post =>
      '<article class="item"><div class="item-main"><strong>' + escapeHTML(post.privacy === "private" ? "Private post" : "Your post") + '</strong><p>' + escapeHTML(post.content || "Media post") + '</p></div><time>' + escapeHTML(relativeTime(post.created_at)) + '</time></article>'
    ).join("") : empty("You haven't published any posts yet.");
  }
  async function saveProfile(event) {
    event.preventDefault();
    const display_name = $("#displayName").value.trim();
    const bio = $("#bio").value.trim();
    const avatar = $("#avatarUrl").value.trim();
    if (!display_name) {
      $("#profileMessage").textContent = "Display name is required.";
      return;
    }
    const { error } = await db.from("users").update({ display_name, bio, avatar: avatar || null }).eq("id", user.id);
    if (error) {
      $("#profileMessage").textContent = "Could not save profile: " + error.message;
      return;
    }
    try {
      const cached = JSON.parse(localStorage.getItem("ars_user") || "{}");
      localStorage.setItem("ars_user", JSON.stringify({ ...cached, id: user.id, display_name, displayName: display_name, bio, avatar }));
    } catch {}
    $("#profileName").textContent = display_name;
    const image = $("#profileAvatar");
    if (avatar) {
      image.style.backgroundImage = 'url("' + avatar.replace(/"/g, "%22") + '")';
      image.style.backgroundSize = "cover";
      image.style.backgroundPosition = "center";
      image.textContent = "";
    } else {
      image.style.backgroundImage = "";
      image.textContent = display_name.charAt(0).toUpperCase();
    }
    $("#profileMessage").textContent = "Profile saved.";
  }
  async function loadStreaks() {
    const list = $("#streakList");
    list.innerHTML = empty("Loading streaks…");
    const { data, error } = await db.from("streaks")
      .select("id,user_a_id,user_b_id,streak_count,last_activity_at,created_at,updated_at")
      .or("user_a_id.eq." + user.id + ",user_b_id.eq." + user.id)
      .order("updated_at", { ascending: false }).limit(50);
    if (error) {
      list.innerHTML = empty("Could not load streaks: " + error.message);
      return;
    }
    if (!data?.length) {
      list.innerHTML = empty("No streak connections yet. Start connecting with people to build a streak.");
      return;
    }
    const otherIds = [...new Set(data.map(row => row.user_a_id === user.id ? row.user_b_id : row.user_a_id))];
    const { data: profiles } = await db.from("users").select("id,username,display_name,avatar").in("id", otherIds);
    const profileMap = Object.fromEntries((profiles || []).map(profile => [profile.id, profile]));
    list.innerHTML = data.map(row => {
      const otherId = row.user_a_id === user.id ? row.user_b_id : row.user_a_id;
      const profile = profileMap[otherId] || {};
      const name = profile.display_name || profile.username || "ARS member";
      return '<article class="item"><div class="avatar" style="width:46px;height:46px;flex-basis:46px;font-size:16px">' + escapeHTML(name.charAt(0).toUpperCase()) + '</div><div class="item-main"><strong>' + escapeHTML(name) + '</strong><p>🔥 ' + Number(row.streak_count || 0) + ' day streak</p><small>Last activity: ' + escapeHTML(relativeTime(row.last_activity_at)) + '</small></div></article>';
    }).join("");
  }
  async function loadNotifications() {
    const list = $("#notificationList");
    const { data, error } = await db.from("notifications")
      .select("id,user_id,sender_id,type,post_id,is_read,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (error) {
      list.innerHTML = empty("Could not load notifications: " + error.message);
      return;
    }
    if (!data?.length) {
      list.innerHTML = empty("You're all caught up. New activity will appear here.");
      return;
    }
    const senderIds = [...new Set(data.map(item => item.sender_id).filter(Boolean))];
    let profiles = {};
    if (senderIds.length) {
      const { data: senders } = await db.from("users").select("id,username,display_name").in("id", senderIds);
      profiles = Object.fromEntries((senders || []).map(profile => [profile.id, profile]));
    }
    const labels = { like: "liked your post", comment: "commented on your post", follow: "started following you", mention: "mentioned you", streak: "streak update", story_reaction: "reacted to your story" };
    list.innerHTML = data.map(item => {
      const sender = profiles[item.sender_id];
      const name = sender?.display_name || sender?.username || "ARS";
      const type = String(item.type || "activity");
      return '<article class="item" style="' + (!item.is_read ? 'border-color:rgba(192,138,255,.42)' : '') + '"><span class="avatar" style="width:42px;height:42px;flex-basis:42px;font-size:15px">' + escapeHTML(name.charAt(0).toUpperCase()) + '</span><div class="item-main"><strong>' + escapeHTML(name) + '</strong><p>' + escapeHTML(labels[type] || type.replace(/_/g, " ")) + '</p></div><time>' + escapeHTML(relativeTime(item.created_at)) + '</time></article>';
    }).join("");
  }
  async function markNotificationsRead() {
    const { error } = await db.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    $("#notificationMessage").textContent = error ? "Could not mark notifications as read: " + error.message : "All notifications marked as read.";
    if (!error) await loadNotifications();
  }
  async function start() {
    try {
      await getUser();
      if (page === "profile") {
        await loadProfile();
        $("#profileForm").addEventListener("submit", event => saveProfile(event).catch(error => $("#profileMessage").textContent = error.message));
      }
      if (page === "streak") {
        await loadStreaks();
        $("#refreshStreaks").addEventListener("click", () => loadStreaks().catch(error => notify(error.message)));
      }
      if (page === "notifications") {
        await loadNotifications();
        $("#markAllRead").addEventListener("click", () => markNotificationsRead().catch(error => $("#notificationMessage").textContent = error.message));
      }
    } catch (error) {
      const target = page === "profile" ? $("#profilePosts") : page === "streak" ? $("#streakList") : $("#notificationList");
      if (target) target.innerHTML = empty(error.message || "Could not load ARS data.");
      notify(error.message || "Could not load ARS data.");
    }
  }
  document.addEventListener("DOMContentLoaded", start);
})();