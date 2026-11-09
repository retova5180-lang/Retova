/**
 * ARS — User Profile Logic
 * Handles Profile loading, Avatar/Cover updates, Stats, Tabs, Post Grid,
 * Strict RLS & Privacy enforcement for Visitor, Non-Follower, Accepted Follower, and Owner.
 */

(function () {
  "use strict";

  const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

  let client = null;
  let currentAuthUser = null;
  let activeProfile = null;
  let isOwnProfile = false;
  let followRecord = null;
  let isAcceptedFollower = false;
  let isPendingFollower = false;
  let targetPreferences = null;
  let currentTab = "posts";

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

  function formatCount(num) {
    if (!num || isNaN(num) || num < 0) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  }

  
  async function checkActivePremium(userId, plan) {
    if (!userId) return false;
    try {
      if (client) {
        const { data: sub } = await client
          .from("subscriptions")
          .select("status, expires_at, current_period_end")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sub) {
          const now = new Date();
          const expiry = sub.expires_at ? new Date(sub.expires_at) : (sub.current_period_end ? new Date(sub.current_period_end) : null);
          const isActive = sub.status === "active" || sub.status === "trialing" || sub.status === "paid";
          return Boolean(isActive && (!expiry || expiry > now));
        }
      }
    } catch (e) {
      console.warn("Fail-closed subscription check notice:", e);
    }
    return false;
  }

  
  let selectedLetter = "R";
  let selectedLetterColor = "#ffffff";
  let selectedBgGradient = "linear-gradient(135deg, #8b3dff, #c54dff)";

  function initAvatarCustomizer(p) {
    const preview = $("#largeAvatarPreview");
    const letterGrid = $("#letterGrid");
    const colorGrid = $("#letterColors");
    const gradGrid = $("#backgroundColors");

    selectedLetter = (p?.display_name?.[0] || p?.username?.[0] || "R").toUpperCase();
    selectedLetterColor = "#ffffff";
    selectedBgGradient = "linear-gradient(135deg, #8b3dff, #c54dff)";

    if (preview) {
      preview.textContent = selectedLetter;
      preview.style.color = selectedLetterColor;
      preview.style.background = selectedBgGradient;
    }

    if (letterGrid) {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
      letterGrid.innerHTML = letters.map(l => '<button type="button" class="letter-option ' + (l === selectedLetter ? 'selected' : '') + '" data-letter="' + l + '">' + l + '</button>').join("");

      letterGrid.querySelectorAll(".letter-option").forEach(btn => {
        btn.addEventListener("click", () => {
          letterGrid.querySelectorAll(".letter-option").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          selectedLetter = btn.dataset.letter;
          if (preview) preview.textContent = selectedLetter;
        });
      });
    }

    if (colorGrid) {
      const colors = ["#ffffff", "#c084fc", "#a855f7", "#ec4899", "#38bdf8", "#4ade80", "#facc15", "#f97316"];
      colorGrid.innerHTML = colors.map(c => '<button type="button" class="color-option ' + (c === selectedLetterColor ? 'selected' : '') + '" data-color="' + c + '" style="background:' + c + ';" aria-label="Color ' + c + '"></button>').join("");

      colorGrid.querySelectorAll(".color-option").forEach(btn => {
        btn.addEventListener("click", () => {
          colorGrid.querySelectorAll(".color-option").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          selectedLetterColor = btn.dataset.color;
          if (preview) preview.style.color = selectedLetterColor;
        });
      });
    }

    if (gradGrid) {
      const gradients = [
        "linear-gradient(135deg, #8b3dff, #c54dff)",
        "linear-gradient(135deg, #4c1d95, #7c3aed)",
        "linear-gradient(135deg, #581c87, #c026d3)",
        "linear-gradient(135deg, #1e1b4b, #4338ca)",
        "linear-gradient(135deg, #831843, #db2777)",
        "linear-gradient(135deg, #0f172a, #334155)"
      ];
      gradGrid.innerHTML = gradients.map((g, idx) => '<button type="button" class="gradient-option ' + (idx === 0 ? 'selected' : '') + '" data-gradient="' + g + '" style="background:' + g + ';" aria-label="Gradient ' + (idx+1) + '"></button>').join("");

      gradGrid.querySelectorAll(".gradient-option").forEach(btn => {
        btn.addEventListener("click", () => {
          gradGrid.querySelectorAll(".gradient-option").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          selectedBgGradient = btn.dataset.gradient;
          if (preview) preview.style.background = selectedBgGradient;
        });
      });
    }
  }

  function getSvgAvatar(letter, color, bg) {
    letter = (letter || "R").toUpperCase();
    color = color || "#ffffff";
    bg = bg || "linear-gradient(135deg, #8b3dff, #c54dff)";
    let fill = bg;
    let defs = "";
    if (bg.indexOf("linear-gradient") !== -1) {
      const matches = bg.match(/#(?:[0-9a-fA-F]{3,8})/g);
      if (matches && matches.length >= 2) {
        defs = '<defs><linearGradient id="pAvGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + matches[0] + '"/><stop offset="100%" stop-color="' + matches[1] + '"/></linearGradient></defs>';
        fill = "url(#pAvGrad)";
      } else {
        fill = "#8b3dff";
      }
    }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' + defs + '<circle cx="50" cy="50" r="50" fill="' + fill + '"/><text x="50" y="50" dy=".36em" text-anchor="middle" fill="' + color + '" font-size="44" font-weight="900" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">' + letter + '</text></svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
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

    if (client) {
      try {
        const { data: { session } } = await client.auth.getSession();
        currentAuthUser = session?.user || null;
      } catch (err) {
        console.warn("Auth session check error:", err);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get("id");
    const targetUsername = params.get("user");

    await loadProfileData(targetUserId, targetUsername);
    setupEventListeners();
  }

  async function loadProfileData(targetUserId, targetUsername) {
    if (!client) {
      showToast("Could not connect to ARS service.", "error");
      return;
    }

    try {
      let query = client.from("users");

      if (targetUserId) {
        // Viewing specific user by ID
        query = query.select("id, username, display_name, bio, avatar, cover, verified, plan, is_private, account_type, profile_accent_color, account_status, online_status_visible").eq("id", targetUserId);
      } else if (targetUsername) {
        // Viewing specific user by username
        query = query.select("id, username, display_name, bio, avatar, cover, verified, plan, is_private, account_type, profile_accent_color, account_status, online_status_visible").eq("username", targetUsername);
      } else if (currentAuthUser) {
        // Viewing own profile
        query = query.select("*").eq("id", currentAuthUser.id);
      } else {
        // Visitor with no target specified -> redirect to login
        window.location.href = "index.html";
        return;
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        $("#displayName").textContent = "User Not Found";
        $("#usernameHandle").textContent = "@unknown";
        $("#bioText").textContent = "This profile does not exist or has been removed.";
        $("#postsGrid").innerHTML = "";
        $("#emptyProfileState").classList.remove("hidden");
        $("#emptyStateTitle").textContent = "User Not Found";
        $("#emptyStateDesc").textContent = "The account you are looking for does not exist.";
        return;
      }

      activeProfile = data;
      isOwnProfile = currentAuthUser && currentAuthUser.id === activeProfile.id;

      // Check follow relationship if viewing someone else
      if (!isOwnProfile && currentAuthUser) {
        const { data: rec } = await client.from("followers")
          .select("id, status")
          .eq("follower_id", currentAuthUser.id)
          .eq("following_id", activeProfile.id)
          .maybeSingle();

        followRecord = rec;
        isAcceptedFollower = rec?.status === "Accepted";
        isPendingFollower = rec?.status === "Pending";
      } else {
        followRecord = null;
        isAcceptedFollower = false;
        isPendingFollower = false;
      }

      // Check privacy preferences of target user
      if (!isOwnProfile) {
        const { data: pref } = await client.from("user_preferences")
          .select("show_likes, show_followers, show_following")
          .eq("user_id", activeProfile.id)
          .maybeSingle();
        targetPreferences = pref;
      }

      renderProfileHeader();
      await loadProfileStats();
      await loadTabContent(currentTab);

      // Check pending follow requests if own private profile
      if (isOwnProfile && activeProfile.is_private) {
        loadPendingFollowRequests();
      }

    } catch (e) {
      console.error("Error loading profile:", e);
      showToast("Failed to load profile data.", "error");
    }
  }

  async function renderProfileHeader() {
    const p = activeProfile;
    if (!p) return;

    // Display Name
    $("#displayName").textContent = p.display_name || p.username || "User";

    // Verified badge
    const isVerified = Boolean(p.verified);
    $("#verifiedBadge").classList.toggle("hidden", !isVerified);

    // Premium status verification from subscriptions / plan
    const isPremium = await checkActivePremium(p.id, p.plan);
    $("#premiumCrownBadge").classList.toggle("hidden", !isPremium);

    // Username Handle
    $("#usernameHandle").textContent = "@" + (p.username || "user");

    // Account type tag
    if (p.account_type && p.account_type !== "Personal") {
      $("#accountTypeTag").textContent = p.account_type;
      $("#accountTypeTag").classList.remove("hidden");
    } else {
      $("#accountTypeTag").classList.add("hidden");
    }

    // Avatar
    const avatarEl = $("#profileAvatarImg");
    if (p.avatar && isPremium) {
      avatarEl.src = p.avatar;
    } else {
      const l = localStorage.getItem("ars_letter") || p.letter || (p.display_name || p.username || "R")[0];
      const c = localStorage.getItem("ars_letter_color") || p.letterColor || p.profile_accent_color || "#ffffff";
      const bg = localStorage.getItem("ars_background") || p.background || "linear-gradient(135deg, #8b3dff, #c54dff)";
      avatarEl.src = getSvgAvatar(l, c, bg);
    }

    // Cover: blank black space if none
    const coverEl = $("#profileCoverImg");
    const coverContainer = $("#coverContainer");
    if (p.cover && typeof p.cover === "string" && p.cover.trim() !== "") {
      coverEl.src = p.cover;
      coverEl.style.display = "block";
      coverContainer?.classList.remove("cover-empty");
    } else {
      coverEl.src = "";
      coverEl.style.display = "none";
      coverContainer?.classList.add("cover-empty");
    }

    // Bio
    const bioEl = $("#bioText");
    if (p.bio) {
      bioEl.textContent = p.bio;
      bioEl.style.display = "block";
      if (p.bio.length > 120) {
        $("#bioSeeMore").classList.remove("hidden");
      }
    } else {
      bioEl.textContent = "";
      bioEl.style.display = "none";
      $("#bioSeeMore").classList.add("hidden");
    }

    // Actions Row Configuration
    const ownerActions = $("#ownerActions");
    const visitorActions = $("#visitorActions");
    const changeCoverBtn = $("#changeCoverBtn");
    const avatarCameraBtn = $("#avatarCameraBtn");

    if (isOwnProfile) {
      ownerActions.classList.remove("hidden");
      visitorActions.classList.add("hidden");
      changeCoverBtn?.classList.remove("hidden");
      avatarCameraBtn?.classList.remove("hidden");

      // Premium button label
      const premiumLabel = $("#premiumBtnLabel");
      if (premiumLabel) {
        premiumLabel.textContent = isPremium ? "Manage Subscription" : "Upgrade to Premium";
      const premBadge = $("#premiumCrownBadge");
      if (premBadge) {
        premBadge.classList.toggle("hidden", !isPremium);
      }
      }
    } else {
      ownerActions.classList.add("hidden");
      visitorActions.classList.remove("hidden");
      changeCoverBtn?.classList.add("hidden");
      avatarCameraBtn?.classList.add("hidden");

      updateFollowButtonUI();
    }
  }

  function updateFollowButtonUI() {
    const followBtn = $("#followBtn");
    if (!followBtn) return;

    followBtn.classList.remove("btn-following", "btn-pending");

    if (!currentAuthUser) {
      followBtn.textContent = "Sign In to Follow";
    } else if (isPendingFollower) {
      followBtn.textContent = "Requested";
      followBtn.classList.add("btn-pending");
    } else if (isAcceptedFollower) {
      followBtn.textContent = "Following";
      followBtn.classList.add("btn-following");
    } else {
      followBtn.textContent = "+ Follow";
    }
  }

  async function loadProfileStats() {
    if (!client || !activeProfile?.id) return;

    let postsCount = 0;
    let followersCount = 0;
    let followingCount = 0;
    let likesCount = 0;

    try {
      const [postsRes, followersRes, followingRes, likesRes] = await Promise.all([
        client.from("posts").select("id", { count: "exact", head: true }).eq("user_id", activeProfile.id),
        client.from("followers").select("id", { count: "exact", head: true }).eq("following_id", activeProfile.id).eq("status", "Accepted"),
        client.from("followers").select("id", { count: "exact", head: true }).eq("follower_id", activeProfile.id).eq("status", "Accepted"),
        client.from("likes").select("id", { count: "exact", head: true }).eq("post_user_id", activeProfile.id)
      ]);

      postsCount = postsRes.count || 0;
      followersCount = followersRes.count || 0;
      followingCount = followingRes.count || 0;
      likesCount = likesRes.count || 0;
    } catch (e) {
      console.warn("Error counting stats:", e);
    }

    $("#statPostsCount").textContent = formatCount(postsCount);

    // Apply privacy visibility settings
    if (!isOwnProfile && targetPreferences?.show_followers === false) {
      $("#statFollowersCount").textContent = "—";
    } else {
      $("#statFollowersCount").textContent = formatCount(followersCount);
    }

    if (!isOwnProfile && targetPreferences?.show_following === false) {
      $("#statFollowingCount").textContent = "—";
    } else {
      $("#statFollowingCount").textContent = formatCount(followingCount);
    }

    if (!isOwnProfile && targetPreferences?.show_likes === false) {
      $("#statLikesCount").textContent = "—";
    } else {
      $("#statLikesCount").textContent = formatCount(likesCount);
    }
  }

  async function loadTabContent(tab) {
    currentTab = tab;

    $$(".profile-tab").forEach(btn => {
      const isSel = btn.dataset.tab === tab;
      btn.classList.toggle("active", isSel);
      btn.setAttribute("aria-selected", String(isSel));
    });

    const grid = $("#postsGrid");
    const emptyState = $("#emptyProfileState");
    const lockNotice = $("#privateLockNotice");

    grid.innerHTML = "";
    emptyState.classList.add("hidden");

    // Strict Privacy enforcement
    const isPrivate = Boolean(activeProfile?.is_private);
    if (!isOwnProfile && isPrivate && !isAcceptedFollower) {
      lockNotice.classList.remove("hidden");
      grid.style.display = "none";
      emptyState.classList.add("hidden");
      return;
    }

    lockNotice.classList.add("hidden");
    grid.style.display = "grid";

    // Bookmarks tab is strictly private to the profile owner
    const tabBookmarks = $("#tabBookmarks");
    if (tabBookmarks) {
      tabBookmarks.style.display = isOwnProfile ? "inline-flex" : "none";
    }
    if (tab === "bookmarks" && !isOwnProfile) {
      loadTabContent("posts");
      return;
    }

    // Likes tab respect target preference
    const tabLikes = $("#tabLikes");
    if (tabLikes) {
      const hideLikes = !isOwnProfile && targetPreferences?.show_likes === false;
      tabLikes.style.display = hideLikes ? "none" : "inline-flex";
      if (tab === "likes" && hideLikes) {
        loadTabContent("posts");
        return;
      }
    }

    let posts = [];

    if (client && activeProfile?.id) {
      try {
        if (tab === "posts") {
          const { data } = await client.from("posts")
            .select("id, user_id, content, media_urls, is_pinned, likes_count, comments_count, created_at, privacy")
            .eq("user_id", activeProfile.id)
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });
          posts = data || [];
        } else if (tab === "media") {
          const { data } = await client.from("posts")
            .select("id, user_id, content, media_urls, is_pinned, likes_count, comments_count, created_at, privacy")
            .eq("user_id", activeProfile.id)
            .not("media_urls", "is", null)
            .order("created_at", { ascending: false });
          posts = (data || []).filter(p => Array.isArray(p.media_urls) && p.media_urls.length > 0);
        } else if (tab === "bookmarks" && isOwnProfile) {
          const { data } = await client.from("bookmarks")
            .select("post_id, posts(id, user_id, content, media_urls, likes_count, comments_count, created_at)")
            .eq("user_id", activeProfile.id)
            .order("created_at", { ascending: false });
          posts = (data || []).map(b => b.posts).filter(Boolean);
        } else if (tab === "reposts") {
          const { data } = await client.from("reposts")
            .select("post_id, posts(id, user_id, content, media_urls, likes_count, comments_count, created_at)")
            .eq("user_id", activeProfile.id)
            .order("created_at", { ascending: false });
          posts = (data || []).map(r => r.posts).filter(Boolean);
        } else if (tab === "likes") {
          const { data } = await client.from("likes")
            .select("post_id, posts(id, user_id, content, media_urls, likes_count, comments_count, created_at)")
            .eq("user_id", activeProfile.id)
            .order("created_at", { ascending: false });
          posts = (data || []).map(l => l.posts).filter(Boolean);
        }
      } catch (e) {
        console.warn("Failed fetching tab data:", e);
      }
    }

    if (!posts || posts.length === 0) {
      emptyState.classList.remove("hidden");
      if (tab === "media") {
        $("#emptyStateTitle").textContent = "No Media Yet";
        $("#emptyStateDesc").textContent = isOwnProfile ? "Photos and videos you post will show here." : "This user hasn't posted any media yet.";
      } else if (tab === "bookmarks") {
        $("#emptyStateTitle").textContent = "No Bookmarks Yet";
        $("#emptyStateDesc").textContent = "Saved posts will appear here privately.";
      } else if (tab === "likes") {
        $("#emptyStateTitle").textContent = "No Likes Yet";
        $("#emptyStateDesc").textContent = "Posts you like will be collected here.";
      } else if (tab === "reposts") {
        $("#emptyStateTitle").textContent = "No Reposts";
        $("#emptyStateDesc").textContent = "Reposted content will show here.";
      } else {
        $("#emptyStateTitle").textContent = "No Posts Yet";
        $("#emptyStateDesc").textContent = isOwnProfile ? "Share your first photo or video with ARS." : "This user hasn't posted anything yet.";
      }
      return;
    }

    // Render Posts Grid matching reference image
    grid.innerHTML = posts.map(post => {
      const media = (post.media_urls && post.media_urls.length > 0) ? post.media_urls[0] : null;
      const isVideo = media && (media.includes(".mp4") || media.includes(".webm") || media.includes("video"));

      return `
        <article class="post-grid-tile" data-post-id="${post.id}">
          ${post.is_pinned ? `<span class="pinned-badge" title="Pinned post"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="vertical-align:middle;margin-right:2px;"><circle cx="12" cy="12" r="6"/></svg> Pinned</span>` : ""}
          ${media ? (
            isVideo
              ? `<video src="${escapeHTML(media)}" class="tile-media" preload="metadata"></video><span class="video-indicator">▶</span>`
              : `<img src="${escapeHTML(media)}" alt="Post image" class="tile-media" loading="lazy">`
          ) : `
            <div class="tile-text-fallback">
              <p>${escapeHTML(post.content || "")}</p>
            </div>
          `}
          <div class="tile-overlay">
            <span class="tile-stat"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> ${formatCount(post.likes_count || 0)}</span>
            <span class="tile-stat"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${formatCount(post.comments_count || 0)}</span>
          </div>
        </article>
      `;
    }).join("");

    // Click to view post
    $$(".post-grid-tile").forEach(tile => {
      tile.addEventListener("click", () => {
        const id = tile.dataset.postId;
        if (id) window.location.href = `home.html#post-${id}`;
      });
    });
  }

  async function handleFollowToggle() {
    if (!currentAuthUser) {
      window.location.href = "index.html";
      return;
    }

    if (!activeProfile?.id) return;

    const followBtn = $("#followBtn");
    followBtn.disabled = true;

    try {
      if (isAcceptedFollower) {
        if (!confirm(`Unfollow @${activeProfile.username || "user"}?`)) {
          followBtn.disabled = false;
          return;
        }

        const { error } = await client.from("followers")
          .delete()
          .eq("follower_id", currentAuthUser.id)
          .eq("following_id", activeProfile.id);

        if (error) throw error;

        isAcceptedFollower = false;
        followRecord = null;
        showToast(`Unfollowed @${activeProfile.username}`);
        await loadProfileStats();
        updateFollowButtonUI();

        // If private, relock
        if (activeProfile.is_private) {
          loadTabContent(currentTab);
        }

      } else if (isPendingFollower) {
        if (!confirm("Cancel follow request?")) {
          followBtn.disabled = false;
          return;
        }

        const { error } = await client.from("followers")
          .delete()
          .eq("follower_id", currentAuthUser.id)
          .eq("following_id", activeProfile.id);

        if (error) throw error;

        isPendingFollower = false;
        followRecord = null;
        showToast("Follow request cancelled.");
        updateFollowButtonUI();

      } else {
        // Create new follow request
        const status = activeProfile.is_private ? "Pending" : "Accepted";

        const { data, error } = await client.from("followers").insert({
          follower_id: currentAuthUser.id,
          following_id: activeProfile.id,
          status: status
        }).select().single();

        if (error) throw error;

        followRecord = data;

        if (status === "Pending") {
          isPendingFollower = true;
          showToast("Follow request sent.");
        } else {
          isAcceptedFollower = true;
          showToast(`Following @${activeProfile.username}`);
          await loadProfileStats();
          await loadTabContent(currentTab);
        }

        updateFollowButtonUI();
      }
    } catch (e) {
      console.error("Follow error:", e);
      showToast("Could not update follow status.", "error");
    } finally {
      followBtn.disabled = false;
    }
  }

  async function loadPendingFollowRequests() {
    if (!client || !isOwnProfile) return;

    try {
      const { data, error } = await client.from("followers")
        .select("id, follower_id, created_at, users!follower_id(id, username, display_name, avatar)")
        .eq("following_id", activeProfile.id)
        .eq("status", "Pending");

      const banner = $("#pendingRequestsBanner");
      if (!banner) return;

      if (data && data.length > 0) {
        banner.classList.remove("hidden");
        $("#pendingRequestsCount").textContent = String(data.length);
        renderPendingRequestsList(data);
      } else {
        banner.classList.add("hidden");
      }
    } catch (e) {
      console.warn("Could not check pending follow requests:", e);
    }
  }

  function renderPendingRequestsList(requests) {
    const list = $("#requestsListContainer");
    if (!list) return;

    if (!requests || requests.length === 0) {
      list.innerHTML = `<p class="empty-requests-msg">No pending follow requests.</p>`;
      return;
    }

    list.innerHTML = requests.map(req => {
      const u = req.users || {};
      const av = u.avatar || `"User")}&background=790ce2&color=fff`;

      return `
        <div class="request-item-card" data-req-id="${req.id}">
          <img src="${escapeHTML(av)}" class="request-avatar" alt="User avatar">
          <div class="request-meta">
            <strong>${escapeHTML(u.display_name || u.username || "User")}</strong>
            <span>@${escapeHTML(u.username || "user")}</span>
          </div>
          <div class="request-actions">
            <button type="button" class="accept-req-btn" data-action="accept" data-id="${req.id}">Accept</button>
            <button type="button" class="decline-req-btn" data-action="decline" data-id="${req.id}">Decline</button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        btn.disabled = true;

        try {
          if (action === "accept") {
            await client.from("followers").update({
              status: "Accepted",
              responded_at: new Date().toISOString()
            }).eq("id", id);
            showToast("Follow request accepted.");
          } else {
            await client.from("followers").update({
              status: "Declined",
              responded_at: new Date().toISOString()
            }).eq("id", id);
            showToast("Follow request declined.");
          }

          await loadPendingFollowRequests();
          await loadProfileStats();
        } catch (err) {
          showToast("Failed to process request.", "error");
        }
      });
    });
  }

  function setupEventListeners() {
    // Tabs navigation
    $$(".profile-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        loadTabContent(btn.dataset.tab);
      });
    });

    // Follow button
    $("#followBtn")?.addEventListener("click", handleFollowToggle);

    // Copy username
    $("#usernameCopyBtn")?.addEventListener("click", () => {
      const handle = activeProfile?.username ? `@${activeProfile.username}` : "";
      if (!handle) return;

      navigator.clipboard.writeText(handle).then(() => {
        const hint = $("#copyHint");
        hint.classList.add("visible");
        showToast(`Copied ${handle} to clipboard!`);
        setTimeout(() => hint.classList.remove("visible"), 2000);
      });
    });

    // Open Pending Requests modal
    $("#openRequestsModalBtn")?.addEventListener("click", () => {
      $("#followRequestsModal")?.showModal();
    });

    // Share profile
    $("#shareBtn")?.addEventListener("click", () => {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: `ARS — @${activeProfile?.username}`, url: url });
      } else {
        navigator.clipboard.writeText(url);
        showToast("Profile link copied to clipboard!");
      }
    });

    // Close modals
    $$("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.close;
        const dialog = document.getElementById(id);
        dialog?.close();
      });
    });

    // Direct clicks on avatar camera button and change cover button open edit modal
    $("#avatarCameraBtn")?.addEventListener("click", () => {
      $("#editProfileBtn")?.click();
    });
    $("#changeCoverBtn")?.addEventListener("click", () => {
      $("#editProfileBtn")?.click();
    });

    // Handle avatar preview and file upload
    let pendingAvatarFile = null;
    let pendingCoverFile = null;

    $("#avatarFileInput")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) {
        pendingAvatarFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const previewImg = $("#editAvatarPreview");
          if (previewImg) previewImg.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    $("#coverFileInput")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) {
        pendingCoverFile = file;
      }
    });

    // Edit Profile Modal
    $("#editProfileBtn")?.addEventListener("click", () => {
      if (!activeProfile) return;
      $("#editDisplayName").value = activeProfile.display_name || "";
      $("#editUsername").value = activeProfile.username || "";
      $("#editBio").value = activeProfile.bio || "";
      initAvatarCustomizer(activeProfile);
      $("#editProfileDialog")?.showModal();
    });

    // Edit Profile form submission
    $("#editProfileForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!client || !isOwnProfile) return;

      const dName = $("#editDisplayName").value.trim();
      const uName = $("#editUsername").value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
      const bio = $("#editBio").value.trim();

      const submitBtn = $("#saveProfileBtn");
      submitBtn.disabled = true;

      try {
        const updates = {
          display_name: dName,
          bio: bio,
          updated_at: new Date().toISOString()
        };

        // Handle avatar: enforce Premium verification and strict error handling
        const userHasPremium = await checkActivePremium(currentAuthUser.id, activeProfile.plan);

        if (pendingAvatarFile) {
          if (!userHasPremium) {
            showToast("Custom photo avatars are exclusively for active ARS Premium subscribers. Free accounts use customizable letter avatars.", "error");
            submitBtn.disabled = false;
            return;
          }
          if (client.storage) {
            try {
              const ext = pendingAvatarFile.name.split(".").pop() || "jpg";
              const path = `${currentAuthUser.id}/avatar-${Date.now()}.${ext}`;
              const { data: upData, error: upErr } = await client.storage.from("avatars").upload(path, pendingAvatarFile, { upsert: true });
              if (upErr) {
                showToast("Avatar photo upload failed: " + upErr.message, "error");
                submitBtn.disabled = false;
                return;
              }
              if (upData?.path) {
                const { data: pubData } = client.storage.from("avatars").getPublicUrl(upData.path);
                if (pubData?.publicUrl) updates.avatar = pubData.publicUrl;
              }
            } catch (stErr) {
              console.error("Avatar upload storage exception:", stErr);
              showToast("Avatar photo upload failed. Changes were not saved.", "error");
              submitBtn.disabled = false;
              return;
            }
          }
        } else if (!userHasPremium) {
          updates.avatar = getSvgAvatar(selectedLetter, selectedLetterColor, selectedBgGradient);
        }

        // Handle cover upload with strict error handling
        if (pendingCoverFile && client.storage) {
          try {
            const ext = pendingCoverFile.name.split(".").pop() || "jpg";
            const path = `${currentAuthUser.id}/cover-${Date.now()}.${ext}`;
            const { data: upData, error: upErr } = await client.storage.from("covers").upload(path, pendingCoverFile, { upsert: true });
            if (upErr) {
              showToast("Cover banner upload failed: " + upErr.message, "error");
              submitBtn.disabled = false;
              return;
            }
            if (upData?.path) {
              const { data: pubData } = client.storage.from("covers").getPublicUrl(upData.path);
              if (pubData?.publicUrl) updates.cover = pubData.publicUrl;
            }
          } catch (stErr) {
            console.error("Cover upload storage exception:", stErr);
            showToast("Cover banner upload failed. Changes were not saved.", "error");
            submitBtn.disabled = false;
            return;
          }
        }

        if (uName && uName !== activeProfile.username) {
          // Check 14-day restriction
          if (activeProfile.username_changed_at) {
            const last = new Date(activeProfile.username_changed_at).getTime();
            const daysDiff = (Date.now() - last) / (1000 * 60 * 60 * 24);
            if (daysDiff < 14) {
              const rem = Math.ceil(14 - daysDiff);
              showToast(`You can only change username every 14 days (${rem} days left).`, "warning");
              submitBtn.disabled = false;
              return;
            }
          }
          updates.username = uName;
          updates.username_changed_at = new Date().toISOString();
        }

        const { error } = await client.from("users").update(updates).eq("id", currentAuthUser.id);
        if (error) throw error;

        activeProfile = { ...activeProfile, ...updates };
        renderProfileHeader();
        $("#editProfileDialog")?.close();
        showToast("Profile updated successfully!");
      } catch (err) {
        console.error("Save error:", err);
        showToast(err.message || "Failed to update profile.", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });

    // Lightbox Cover Image view
    $("#coverContainer")?.addEventListener("click", (e) => {
      if (e.target.closest("#changeCoverBtn")) return;
      const src = $("#profileCoverImg").src;
      if (src) {
        $("#lightboxCoverImg").src = src;
        $("#coverLightboxDialog")?.showModal();
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();