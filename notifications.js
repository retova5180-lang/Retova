(() => {
  "use strict";
  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = selector => document.querySelector(selector);
  const state = { user: null, channel: null, loading: false };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }
  function toast(message) {
    const region = $("#toastRegion");
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), 3500);
  }
  function setMessage(message, type = "") {
    $("#notificationMessage").textContent = message;
    $("#notificationMessage").className = "status-message" + (type ? " " + type : "");
  }
  function empty(message) { return '<p class="empty-state">' + escapeHTML(message) + "</p>"; }
  function relativeTime(value) {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value || Date.now()).getTime()) / 1000));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  }
  async function requireSession() {
    if (!supabase) throw new Error("The ARS data service could not load.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    state.user = data.session?.user || null;
    if (!state.user?.id) {
      window.location.replace("index.html");
      throw new Error("Please sign in to view notifications.");
    }
  }
  function notificationText(row, senderName) {
    const metadata = row.metadata || {};
    const messages = {
      like: "liked your post.",
      comment: "commented on your post.",
      follow: "started following you.",
      mention: "mentioned you.",
      story_reaction: "reacted to your story.",
      streak_invite: "sent you a streak invitation.",
      streak_invite_accepted: "accepted your streak invitation.",
      streak_invite_declined: "declined your streak invitation.",
      streak_started: "Your three-day setup is complete. Your streak is active!",
      streak_broken: "Your streak broke. Previous count: " + Number(metadata.streak_count || 0) + " days. Shared recovery attempts remaining this month: " + Number(metadata.remaining_attempts || 0) + ".",
      streak_restored: "Your streak was recovered. Shared recovery attempts remaining this month: " + Number(metadata.remaining_attempts || 0) + "."
    };
    const text = messages[row.type] || String(row.type || "activity").replace(/_/g, " ") + ".";
    if (row.type === "streak_broken" || row.type === "streak_restored" || row.type === "streak_started") return text;
    return senderName + " " + text;
  }
  function iconFor(type) {
    const icons = {
      like: "♥",
      comment: "☷",
      follow: "＋",
      mention: "@",
      story_reaction: "✦",
      streak_invite: "♨",
      streak_invite_accepted: "✓",
      streak_invite_declined: "×",
      streak_started: "🔥",
      streak_broken: "⌁",
      streak_restored: "↶"
    };
    return icons[type] || "✦";
  }
  async function loadNotifications() {
    if (state.loading) return;
    state.loading = true;
    const list = $("#notificationList");
    list.innerHTML = empty("Loading notifications…");
    try {
      const { data, error } = await supabase.from("notifications")
        .select("id,user_id,sender_id,type,post_id,is_read,metadata,created_at")
        .eq("user_id", state.user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = data || [];
      const unread = rows.filter(row => !row.is_read).length;
      $("#unreadCount").textContent = unread + " unread";
      $("#markAllRead").disabled = unread === 0;
      if (!rows.length) {
        list.innerHTML = empty("You're all caught up. New activity will appear here.");
        return;
      }
      const senderIds = [...new Set(rows.map(row => row.sender_id).filter(Boolean))];
      let profiles = new Map();
      if (senderIds.length) {
        const { data: senders, error: senderError } = await supabase.from("users")
          .select("id,username,display_name")
          .in("id", senderIds);
        if (senderError) console.warn("Notification sender names unavailable:", senderError.message);
        profiles = new Map((senders || []).map(user => [user.id, user]));
      }
      list.innerHTML = rows.map(row => {
        const sender = profiles.get(row.sender_id) || {};
        const name = sender.display_name || sender.username || "ARS";
        const text = notificationText(row, name);
        const action = row.is_read ? "" :
          '<button class="mark-read" type="button" data-mark-read="' + escapeHTML(row.id) + '">Mark read</button>';
        return '<article class="notification-item ' + (!row.is_read ? "unread" : "") + '">' +
          '<span class="notification-icon" aria-hidden="true">' + escapeHTML(iconFor(row.type)) + '</span>' +
          '<div class="notification-copy"><strong>' + escapeHTML(name) + '</strong><p>' + escapeHTML(text) + '</p>' +
          '<time>' + escapeHTML(relativeTime(row.created_at)) + '</time></div>' + action + '</article>';
      }).join("");
    } catch (error) {
      console.error("Notifications failed to load:", error);
      list.innerHTML = empty("Notifications could not be loaded. Please refresh and try again.");
      setMessage(error.message || "Could not load notifications.", "error");
    } finally {
      state.loading = false;
    }
  }
  async function markOneRead(id, button) {
    button.disabled = true;
    const { error } = await supabase.from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", state.user.id);
    if (error) {
      button.disabled = false;
      toast("Could not mark this notification as read.");
      console.error("Mark one notification read failed:", error);
      return;
    }
    await loadNotifications();
  }
  async function markAllRead() {
    const button = $("#markAllRead");
    button.disabled = true;
    const { error } = await supabase.from("notifications")
      .update({ is_read: true })
      .eq("user_id", state.user.id)
      .eq("is_read", false);
    if (error) {
      button.disabled = false;
      setMessage(error.message || "Could not mark notifications as read.", "error");
      return;
    }
    setMessage("All notifications marked as read.", "success");
    await loadNotifications();
  }
  function bindEvents() {
    $("#refreshNotifications").addEventListener("click", loadNotifications);
    $("#markAllRead").addEventListener("click", markAllRead);
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-mark-read]");
      if (button) markOneRead(button.dataset.markRead, button);
    });
    window.addEventListener("beforeunload", () => {
      if (state.channel && supabase) supabase.removeChannel(state.channel);
    });
  }
  async function init() {
    bindEvents();
    try {
      await requireSession();
      await loadNotifications();
      state.channel = supabase.channel("ars-notifications-" + state.user.id)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: "user_id=eq." + state.user.id
        }, () => loadNotifications())
        .subscribe();
    } catch (error) {
      console.error("Notifications initialization failed:", error);
      setMessage(error.message || "Could not initialize notifications.", "error");
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();