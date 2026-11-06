(() => {
  "use strict";

  const URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
  const KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
  const client = window.supabase?.createClient(URL, KEY);
  const $ = s => document.querySelector(s);

  let user = null;
  let files = [];
  let urls = [];
  const storyMode = new URLSearchParams(location.search).get("mode") === "story";
  let storyDraft = null;

  function say(v, isError = false) {
    const el = $("#message");
    if (!el) return;
    el.textContent = v;
    el.style.color = isError ? "#f87171" : "#c084fc";
  }

  async function init() {
    if (!client) {
      throw new Error("ARS connection unavailable.");
    }

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session?.user) {
      location.replace("index.html");
      return;
    }
    user = data.session.user;

    const { data: profile } = await client
      .from("users")
      .select("username,display_name,avatar")
      .eq("id", user.id)
      .maybeSingle();

    const dName = profile?.display_name || profile?.username || "Your ARS account";
    const uName = profile?.username || "you";
    const initial = (dName || "A")[0].toUpperCase();

    if ($("#displayName")) $("#displayName").textContent = dName;
    if ($("#handle")) $("#handle").textContent = "@" + uName;
    if ($("#avatar")) {
      $("#avatar").textContent = initial;
      if (profile?.avatar && /^https?:/.test(profile.avatar)) {
        $("#avatar").style.backgroundImage = 'url("' + profile.avatar.replace(/["\\]/g, "") + '")';
        $("#avatar").textContent = "";
      }
    }

    // Sync privacy select with quick badge
    const privacySelect = $("#privacy");
    const badgeText = $("#badgePrivacyText");
    if (privacySelect && badgeText) {
      privacySelect.addEventListener("change", () => {
        const val = privacySelect.value;
        badgeText.textContent = val === "public" ? "Public" : val === "followers" ? "Followers" : "Only me";
      });
    }

    if (storyMode) {
      storyDraft = JSON.parse(sessionStorage.getItem("ars_story_composer") || "null");
      if (!storyDraft?.path) {
        throw new Error("Story edit is missing. Return to the story editor and try again.");
      }
      if ($("#pageTitle")) $("#pageTitle").textContent = "Share Story";
      const content = $("#content");
      if (content) {
        content.placeholder = "Add a caption to your story…";
        content.maxLength = 180;
      }
      if ($("#charCount")) $("#charCount").textContent = "0";
      if ($("#privacy")) $("#privacy").value = "public";
      const toStorySetting = $("#toStory")?.closest(".setting-card");
      if (toStorySetting) toStorySetting.classList.add("hidden");

      if ($("#mediaGrid")) {
        $("#mediaGrid").innerHTML = `
          <div class="preview-box">
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#c084fc;font-weight:700;font-size:13px;text-align:center;padding:12px;">
              Story Media Ready ✓
            </div>
          </div>
        `;
      }
    }
  }

  function release() {
    urls.forEach(u => URL.revokeObjectURL(u));
    urls = [];
  }

  function renderMediaPreviews() {
    release();
    const grid = $("#mediaGrid");
    if (!grid) return;

    // Remove old previews, keep add button
    grid.querySelectorAll(".preview-box").forEach(x => x.remove());

    files.forEach((f, i) => {
      const blobUrl = URL.createObjectURL(f);
      urls.push(blobUrl);

      const box = document.createElement("div");
      box.className = "preview-box";

      const isVideo = f.type.startsWith("video/");
      const mediaEl = document.createElement(isVideo ? "video" : "img");
      mediaEl.src = blobUrl;
      if (isVideo) {
        mediaEl.controls = true;
        mediaEl.playsInline = true;
      }

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-media-btn";
      removeBtn.innerHTML = "×";
      removeBtn.title = "Remove media";
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        files.splice(i, 1);
        renderMediaPreviews();
      };

      box.append(mediaEl, removeBtn);
      grid.prepend(box);
    });
  }

  const mediaInput = $("#media");
  if (mediaInput) {
    mediaInput.addEventListener("change", (e) => {
      const incoming = [...e.target.files];
      if (files.length + incoming.length > 4) {
        say("You can attach up to 4 media files.", true);
        return;
      }
      for (const f of incoming) {
        if (!/^(image|video)\//.test(f.type)) {
          say("Only photos and videos are supported.", true);
          return;
        }
        if (f.size > 100 * 1024 * 1024) {
          say("Each file must be smaller than 100 MB.", true);
          return;
        }
      }
      files.push(...incoming);
      renderMediaPreviews();
      e.target.value = "";
    });
  }

  const contentArea = $("#content");
  if (contentArea) {
    contentArea.addEventListener("input", () => {
      const len = contentArea.value.length;
      if ($("#charCount")) $("#charCount").textContent = len;
    });
  }

  // Insert helpers (Bold, Italic, Hashtag, Mention, Location)
  document.querySelectorAll("[data-insert]").forEach(b => {
    b.addEventListener("click", () => {
      const field = $("#content");
      if (!field) return;
      const kind = b.dataset.insert;
      let insert = "";
      if (kind === "bold") insert = "**bold**";
      if (kind === "italic") insert = "_italic_";
      if (kind === "hashtag") insert = "#";
      if (kind === "mention") insert = "@";
      if (kind === "location") {
        $("#location")?.focus();
        return;
      }

      const a = field.selectionStart ?? field.value.length;
      const z = field.selectionEnd ?? field.value.length;
      field.setRangeText(insert, a, z, "end");
      field.focus();
      if ($("#charCount")) $("#charCount").textContent = field.value.length;
    });
  });

  const editMediaBtn = $("#editMedia");
  if (editMediaBtn) {
    editMediaBtn.addEventListener("click", () => {
      say("Tip: Open Story Editor to apply filters, stickers, text overlays, and drawing to media.");
      setTimeout(() => {
        if (confirm("Would you like to open Story Editor to edit photos/videos?")) {
          location.href = "story-editor.html";
        }
      }, 100);
    });
  }

  // File to base64 data URL fallback
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handlePublish() {
    const pubButtons = [$("#publish"), $("#bottomPublish")].filter(Boolean);
    const content = $("#content")?.value?.trim() || "";

    pubButtons.forEach(b => { b.disabled = true; });
    say(storyMode ? "Sharing story…" : "Publishing post…");

    try {
      if (!user) throw new Error("Please sign in to publish.");

      // Story mode publish
      if (storyMode) {
        const { error } = await client.from("stories").insert({
          user_id: user.id,
          image: storyDraft.path,
          media_type: storyDraft.mediaType || "image",
          story_text: content,
          privacy: $("#privacy")?.value || "public",
          filter: storyDraft.filter || "none",
          zoom: storyDraft.zoom || 1,
          rotation_degrees: storyDraft.rotation || 0,
          drawing_data: storyDraft.paths || [],
          text_overlays: storyDraft.overlays || [],
          edit_metadata: {
            filter: storyDraft.filter,
            zoom: storyDraft.zoom,
            rotation: storyDraft.rotation
          },
          expires_at: new Date(Date.now() + 86400000).toISOString()
        });
        if (error) throw error;
        sessionStorage.removeItem("ars_story_composer");
        location.href = "home.html";
        return;
      }

      // Regular post publish
      if (!content && !files.length) {
        throw new Error("Write something or attach a photo/video first.");
      }

      const mediaUrls = [];
      const privacy = $("#privacy")?.value || "public";
      const bucket = privacy === "public" ? "post-media" : "private-post-media";

      for (const f of files) {
        let uploadedUrl = null;
        try {
          const path = user.id + "/posts/" + crypto.randomUUID() + "-" + f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const { data, error } = await client.storage
            .from(bucket)
            .upload(path, f, { upsert: false, contentType: f.type, cacheControl: "3600" });

          if (!error && data?.path) {
            if (bucket === "post-media") {
              const { data: pub } = client.storage.from(bucket).getPublicUrl(data.path);
              uploadedUrl = pub.publicUrl;
            } else {
              uploadedUrl = data.path;
            }
          }
        } catch (uploadErr) {
          console.warn("Storage bucket upload notice:", uploadErr);
        }

        // If storage failed or bucket not accessible, fallback to Data URL for smaller images
        if (!uploadedUrl) {
          if (f.size <= 4 * 1024 * 1024) {
            uploadedUrl = await fileToDataUrl(f);
          } else {
            throw new Error("Could not upload file to storage. Please ensure media is under 4MB or bucket is public.");
          }
        }

        if (uploadedUrl) {
          mediaUrls.push(uploadedUrl);
        }
      }

      const hashtags = [...content.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(x => x[1]);
      const mentions = ($("#mentions")?.value || "")
        .split(",")
        .map(x => x.trim().replace(/^@/, ""))
        .filter(Boolean);

      const postRecord = {
        user_id: user.id,
        content: content,
        image: mediaUrls[0] || null,
        media_type: files[0]?.type?.startsWith("video/") ? "video" : "image",
        privacy: privacy,
        allow_comments: $("#comments") ? $("#comments").checked : true,
        location: $("#location")?.value?.trim() || null,
        hashtags: hashtags,
        mentions: mentions
      };

      const { error: postError } = await client.from("posts").insert(postRecord);
      if (postError) throw postError;

      // Optional: share also to story
      if ($("#toStory")?.checked && mediaUrls[0]) {
        try {
          await client.from("stories").insert({
            user_id: user.id,
            image: mediaUrls[0],
            media_type: files[0]?.type?.startsWith("video/") ? "video" : "image",
            story_text: content.slice(0, 180),
            privacy: privacy,
            expires_at: new Date(Date.now() + 86400000).toISOString()
          });
        } catch (storyErr) {
          console.warn("Story share error:", storyErr);
        }
      }

      say("Published successfully! Redirecting…");
      setTimeout(() => {
        location.href = "home.html";
      }, 500);

    } catch (e) {
      console.error(e);
      say(e.message || "Could not publish post.", true);
      pubButtons.forEach(b => { b.disabled = false; });
    }
  }

  $("#publish")?.addEventListener("click", handlePublish);
  $("#bottomPublish")?.addEventListener("click", handlePublish);

  init().catch(e => {
    console.error(e);
    say(e.message || "Could not load the composer.", true);
  });
})();
