/**
 * ARS — Notifications Controller
 * Loads real notifications from Supabase, formats activity, handles read status,
 * supports category filtering, and ensures reliable navigation.
 */

(function () {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

  let client = null;
  let currentUser = null;
  let allNotifications = [];
  let currentFilter = "all";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return "just now";
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
    return new Date(isoString).toLocaleDateString();
  }

  function getSvgAvatarDataUri(letter, color, bg) {
    letter = letter || "R";
    color = color || "#ffffff";
    bg = bg || "linear-gradient(135deg,#8b3dff,#c54dff)";
    var fill = bg;
    var defs = "";
    if (bg.indexOf("linear-gradient") !== -1) {
      var matches = bg.match(/#(?:[0-9a-fA-F]{3,8})/g);
      if (matches && matches.length >= 2) {
        defs = '<defs><linearGradient id="notifGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + matches[0] + '"/><stop offset="100%" stop-color="' + matches[1] + '"/></linearGradient></defs>';
        fill = "url(#notifGrad)";
      } else {
        fill = "#8b3dff";
      }
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' + defs + '<circle cx="50" cy="50" r="50" fill="' + fill + '"/><text x="50" y="50" dy=".36em" text-anchor="middle" fill="' + color + '" font-size="44" font-weight="900" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">' + letter + '</text></svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function getBadgeIcon(type) {
    switch (type) {
      case "like":
        return '<svg viewBox="0 0 24 24" width="12" height="12" fill="#ec4899"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
      case "comment":
      case "reply":
        return '<svg viewBox="0 0 24 24" width="12" height="12" fill="#a855f7"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>';
      case "repost":
        return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
      case "follow":
      case "follow_request":
        return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#38bdf8" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';
      case "streak":
      case "streak_invite":
        return '<svg viewBox="0 0 24 24" width="12" height="12" fill="#f59e0b"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
      case "premium":
        return '<svg viewBox="0 0 24 24" width="12" height="12" fill="#c084fc"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      default:
        return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#c084fc" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    }
  }

  function getNotificationDescription(item) {
    switch (item.type) {
      case "like": return "liked your post.";
      case "comment": return "commented on your post.";
      case "reply": return "replied to your comment.";
      case "repost": return "reposted your post to their feed.";
      case "follow": return "started following you.";
      case "follow_request": return "requested to follow your account.";
      case "streak": return "continued your streak!";
      case "streak_invite": return "invited you to start an ARS Streak!";
      case "story": return "shared a new story.";
      case "premium": return "Your ARS Premium status has been updated.";
      case "system": return (item.metadata && item.metadata.message) ? item.metadata.message : "System notification from ARS.";
      default: return "interacted with your profile.";
    }
  }

  async function init() {
    if (window.supabase) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }

    if (!client) {
      renderEmpty("Could not initialize connection.");
      return;
    }

    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session || !session.user) {
        const local = localStorage.getItem("ars_user");
        if (!local) {
          window.location.href = "index.html";
          return;
        }
        currentUser = JSON.parse(local);
      } else {
        currentUser = session.user;
      }

      await loadNotifications();
      setupTabs();
      setupMarkAllRead();
    } catch (e) {
      console.error("Notifications init error:", e);
      renderEmpty("Failed to load notifications.");
    }
  }

  async function loadNotifications() {
    const list = $("#notificationsList");
    const empty = $("#emptyState");

    if (!currentUser || !currentUser.id) {
      renderEmpty("Please sign in to view notifications.");
      return;
    }

    try {
      const { data, error } = await client
        .from("notifications")
        .select("id, user_id, sender_id, type, post_id, is_read, metadata, created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(60);

      if (error) throw error;

      allNotifications = data || [];

      if (!allNotifications.length) {
        list.innerHTML = "";
        empty.classList.remove("hidden");
        return;
      }

      empty.classList.add("hidden");

      const senderIds = Array.from(new Set(allNotifications.map(n => n.sender_id).filter(Boolean)));
      let userMap = new Map();
      if (senderIds.length) {
        const { data: senders } = await client
          .from("users")
          .select("id, username, display_name, avatar, plan")
          .in("id", senderIds);
        if (senders) {
          senders.forEach(u => userMap.set(u.id, u));
        }
      }

      renderList(userMap);
    } catch (err) {
      console.error("Load notifications error:", err);
      list.innerHTML = "";
      empty.classList.remove("hidden");
    }
  }

  function renderList(userMap) {
    const list = $("#notificationsList");
    const empty = $("#emptyState");

    let filtered = allNotifications;
    if (currentFilter === "interactions") {
      filtered = allNotifications.filter(n => ["like", "comment", "reply", "repost"].includes(n.type));
    } else if (currentFilter === "follows") {
      filtered = allNotifications.filter(n => ["follow", "follow_request"].includes(n.type));
    } else if (currentFilter === "system") {
      filtered = allNotifications.filter(n => ["system", "premium", "streak", "streak_invite"].includes(n.type));
    }

    if (!filtered.length) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    list.innerHTML = filtered.map(item => {
      const actor = userMap.get(item.sender_id) || {};
      const name = actor.display_name || actor.username || "ARS Member";
      const timeStr = formatTimeAgo(item.created_at);
      const desc = getNotificationDescription(item);
      const isUnread = !item.is_read;

      var avatarSrc = "";
      if (actor.avatar && /^https?:\/\//i.test(actor.avatar) && (actor.plan === "premium" || actor.plan === "pro")) {
        avatarSrc = actor.avatar;
      } else {
        var letter = (name[0] || "A").toUpperCase();
        avatarSrc = getSvgAvatarDataUri(letter, "#ffffff", "linear-gradient(135deg,#8b3dff,#c54dff)");
      }

      var badgeSvg = getBadgeIcon(item.type);

      var targetHref = "#";
      if (item.post_id) {
        targetHref = "home.html?post=" + encodeURIComponent(item.post_id);
      } else if (actor.username) {
        targetHref = "profile.html?user=" + encodeURIComponent(actor.username);
      }

      return '' +
        '<article class="notification-card ' + (isUnread ? "unread" : "") + '" data-id="' + item.id + '" data-href="' + targetHref + '">' +
          '<div class="notif-avatar-wrap">' +
            '<img class="notif-avatar" src="' + escapeHTML(avatarSrc) + '" alt="' + escapeHTML(name) + '" loading="lazy">' +
            '<span class="notif-badge-icon">' + badgeSvg + '</span>' +
          '</div>' +
          '<div class="notif-content">' +
            '<p class="notif-text">' +
              '<strong class="notif-actor">' + escapeHTML(name) + '</strong> ' +
              escapeHTML(desc) +
            '</p>' +
            '<p class="notif-time">' + timeStr + '</p>' +
          '</div>' +
        '</article>';
    }).join("");

    list.querySelectorAll(".notification-card").forEach(card => {
      card.addEventListener("click", async () => {
        const id = card.dataset.id;
        const href = card.dataset.href;

        card.classList.remove("unread");

        if (client && id) {
          try {
            await client.from("notifications").update({ is_read: true }).eq("id", id);
          } catch (e) {
            console.warn("Mark read error:", e);
          }
        }

        if (href && href !== "#") {
          window.location.href = href;
        }
      });
    });
  }

  function setupTabs() {
    $$(".tab-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        $$(".tab-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter || "all";
        loadNotifications();
      });
    });
  }

  function setupMarkAllRead() {
    $("#markAllReadBtn")?.addEventListener("click", async () => {
      if (!currentUser || !currentUser.id || !client) return;
      try {
        const { error } = await client
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", currentUser.id)
          .eq("is_read", false);

        if (!error) {
          allNotifications.forEach(n => n.is_read = true);
          $$(".notification-card.unread").forEach(c => c.classList.remove("unread"));
        }
      } catch (e) {
        console.warn("Mark all read error:", e);
      }
    });
  }

  function renderEmpty(msg) {
    msg = msg || "No notifications yet.";
    const list = $("#notificationsList");
    const empty = $("#emptyState");
    if (list) list.innerHTML = "";
    if (empty) {
      empty.querySelector("p").textContent = msg;
      empty.classList.remove("hidden");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
