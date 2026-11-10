(() => {
"use strict";

const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
const SUPABASE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";
const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let user = null;
let file = null;
let objectUrl = "";
let filter = "none";
let zoom = 1;
let rotation = 0;
let drawMode = "filters";
let drawColor = "#b45cff";
let drawing = false;
let paths = [];
let activePath = null;
let overlays = [];
let soundFile = null;
let soundObjectUrl = "";
let soundPreview = null;

const filters = {
  none: "none",
  vivid: "saturate(1.45) contrast(1.08)",
  moody: "brightness(.72) saturate(1.2) contrast(1.2)",
  dreamy: "brightness(1.15) saturate(1.25) blur(.2px)",
  bw: "grayscale(1)",
  neon: "saturate(2) contrast(1.25) hue-rotate(8deg)"
};

function msg(text, isError = false) {
  const message = $("#editorMessage");
  message.textContent = text;
  message.classList.toggle("error", isError);
}

async function auth() {
  if (!client) throw new Error("ARS connection unavailable. Reload and try again.");
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) {
    location.replace("index.html");
    return null;
  }
  return data.session.user;
}

function showFile(nextFile) {
  if (!nextFile) return;
  if (!/^(image|video)\//.test(nextFile.type)) {
    msg("Choose a valid photo or video file.", true);
    return;
  }
  if (nextFile.size > 100 * 1024 * 1024) {
    msg("This file is larger than 100 MB. Choose a smaller file.", true);
    return;
  }

  file = nextFile;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  $("#emptyPreview").classList.add("hidden");
  $("#changeMediaBtn").classList.remove("hidden");
  $("#undoBtn").classList.remove("hidden");

  const image = $("#storyImage");
  const video = $("#storyVideo");
  const isVideo = file.type.startsWith("video/");
  image.classList.toggle("hidden", isVideo);
  video.classList.toggle("hidden", !isVideo);

  if (isVideo) {
    video.src = objectUrl;
    video.load();
  } else {
    image.src = objectUrl;
  }

  paths = [];
  overlays = [];
  renderText();
  redraw();
  applyFilter();
  resizeCanvas();
  updateTools();
  msg("Media ready. Choose a tool to edit your story.");
}

function applyFilter() {
  const element = file?.type.startsWith("video/") ? $("#storyVideo") : $("#storyImage");
  if (element) {
    element.style.filter = filters[filter] || "none";
    element.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
  }
  $("#zoomLabel").textContent = `${zoom.toFixed(1)}x`;
}

function resizeCanvas() {
  const canvas = $("#drawCanvas");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const context = canvas.getContext("2d");
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  redraw();
}


  // Interactive overlay handler: supports pointer dragging and eraser deletion
  let draggingOverlay = null;

  function initOverlayInteraction() {
    const layer = $("#textLayer") || $(".overlay-layer");
    if (!layer) return;

    layer.addEventListener("pointerdown", event => {
      if (drawMode === "draw") return;
      const target = event.target.closest(".overlay-text");
      if (!target) return;

      if (drawMode === "erase") {
        event.stopPropagation();
        const idx = parseInt(target.dataset.overlay || target.dataset.index, 10);
        if (!isNaN(idx) && idx >= 0 && idx < overlays.length) {
          overlays.splice(idx, 1);
          renderText();
          msg("Item deleted by eraser.");
        }
        return;
      }

      const idx = parseInt(target.dataset.overlay || target.dataset.index, 10);
      if (isNaN(idx) || !overlays[idx]) return;

      draggingOverlay = {
        el: target,
        idx,
        startX: event.clientX,
        startY: event.clientY,
        initX: overlays[idx].x,
        initY: overlays[idx].y
      };
      try { target.setPointerCapture(event.pointerId); } catch (e) {}
    });

    layer.addEventListener("pointermove", event => {
      if (!draggingOverlay) return;
      const wrap = $("#previewWrap");
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const deltaX = ((event.clientX - draggingOverlay.startX) / rect.width) * 100;
      const deltaY = ((event.clientY - draggingOverlay.startY) / rect.height) * 100;

      const newX = Math.max(5, Math.min(95, Math.round((draggingOverlay.initX + deltaX) * 10) / 10));
      const newY = Math.max(5, Math.min(95, Math.round((draggingOverlay.initY + deltaY) * 10) / 10));

      overlays[draggingOverlay.idx].x = newX;
      overlays[draggingOverlay.idx].y = newY;
      draggingOverlay.el.style.left = `${newX}%`;
      draggingOverlay.el.style.top = `${newY}%`;
    });

    const stopDrag = () => { draggingOverlay = null; };
    layer.addEventListener("pointerup", stopDrag);
    layer.addEventListener("pointercancel", stopDrag);
  }

  initOverlayInteraction();

  $("#clearDrawingsBtn")?.addEventListener("click", () => {
    paths = [];
    activePath = null;
    redraw();
    msg("All drawings cleared.");
  });

function redraw() {
  const canvas = $("#drawCanvas");
  const context = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  for (const path of paths) {
    if (!path.points.length) continue;
    context.save();
    context.globalCompositeOperation = path.erase ? "destination-out" : "source-over";
    context.strokeStyle = path.color;
    context.lineWidth = path.width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    path.points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    if (path.points.length === 1) context.lineTo(path.points[0].x + 0.1, path.points[0].y + 0.1);
    context.stroke();
    context.restore();
  }
}

function canvasPoint(event) {
  const rect = $("#drawCanvas").getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function renderText() {
  const layer = $("#textLayer") || $(".overlay-layer");
  if (!layer) return;
  layer.replaceChildren();
  overlays.forEach((overlay, index) => {
    const node = document.createElement("div");
    node.className = "overlay-text";
    node.dataset.overlay = String(index);
    node.dataset.index = String(index);
    node.textContent = overlay.text;
    node.style.left = `${overlay.x}%`;
    node.style.top = `${overlay.y}%`;
    node.style.color = overlay.color || "#fff";
    layer.appendChild(node);
  });
}

function addText(value = null) {
  const text = value ?? prompt("Write your story text:");
  if (text === null || !text.trim()) return;
  overlays.push({ text: text.trim(), x: 50, y: 50, color: "#ffffff" });
  renderText();
  msg("Text added to your story preview.");
}

function updateTools() {
  const hasFile = !!file;
  $$("[data-tool]").forEach(button => {
    button.disabled = !hasFile && !["filters", "sound"].includes(button.dataset.tool);
  });
  $("#nextStory").disabled = !hasFile;
  $("#saveDraft").disabled = !hasFile;
}

function activateTool(tool) {
  drawMode = tool;
  const canvas = $("#drawCanvas");
  canvas.classList.toggle("drawing", tool === "draw" || tool === "erase");
  canvas.classList.toggle("draw-active", tool === "draw");
  document.body.classList.toggle("mode-erase", tool === "erase");

  const panels = [
    ["filters", "#filterList"],
    ["stickers", "#stickerList"],
    ["emoji", "#emojiList"],
    ["draw", "#drawOptions"],
    ["crop", "#cropOptions"]
  ];
  for (const [name, selector] of panels) {
    const show = name === "draw" ? ["draw", "erase"].includes(tool) : name === tool;
    $(selector).classList.toggle("hidden", !show);
  }

  if (tool === "draw") msg("Draw with your finger or mouse on the story. Tap Undo to remove the latest stroke.");
  if (tool === "erase") msg("Erase mode is on. Draw over marks to erase them.");
  if (tool === "stickers") msg("Tap a sticker to add it to your story.");
  if (tool === "emoji") msg("Tap an emoji to add it to your story.");
  if (tool === "filters") msg(file ? "Choose a filter for your story." : "Choose a photo or video first.");
  if (tool === "crop") msg("Rotate or zoom the preview with the controls below.");
}

async function bakeMediaBlob() {
  if (!file) return null;
  if (file.type && file.type.startsWith("video/")) {
    if (overlays.length || paths.length) {
      msg("Notice: Overlays bake into photos. Video published in original stream.");
    }
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const bakeCanvas = document.createElement("canvas");
        const ctx = bakeCanvas.getContext("2d");
        const w = img.naturalWidth || 1080;
        const h = img.naturalHeight || 1920;
        bakeCanvas.width = w;
        bakeCanvas.height = h;

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        // Unified filters with exact CSS preview
        if (filter && filter !== "none" && filters[filter]) {
          ctx.filter = filters[filter];
        }

        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();

        // Draw drawing paths onto baked image
        const dc = document.getElementById("drawCanvas");
        if (dc && paths.length) {
          ctx.drawImage(dc, 0, 0, w, h);
        }

        // Draw text and stickers onto baked image
        if (overlays && overlays.length) {
          ctx.font = "bold " + Math.max(26, Math.round(w * 0.055)) + "px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          overlays.forEach(ov => {
            const px = (ov.x / 100) * w;
            const py = (ov.y / 100) * h;
            ctx.fillStyle = ov.color || "#ffffff";
            ctx.shadowColor = "rgba(0,0,0,0.85)";
            ctx.shadowBlur = Math.round(w * 0.015);
            ctx.fillText(ov.text, px, py);
          });
        }

        bakeCanvas.toBlob((blob) => {
          if (blob) {
            const cleanName = (file.name || "story").replace(/\.[^.]+$/, "") + "-baked.jpg";
            const bakedFile = new File([blob], cleanName, { type: "image/jpeg" });
            resolve(bakedFile);
          } else {
            resolve(file);
          }
        }, "image/jpeg", 0.94);
      } catch (err) {
        console.warn("Could not bake canvas, falling back to original file:", err);
        resolve(file);
      }
    };
    img.onerror = () => resolve(file);
    img.src = objectUrl;
  });
}

async function upload() {
  if (!file) throw new Error("Choose a photo or video first.");
  if (!user) throw new Error("Sign in to upload a story.");

  const mediaToUpload = (await bakeMediaBlob()) || file;
  const safeName = (mediaToUpload.name || file.name || "story").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const path = `${user.id}/stories/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await client.storage.from("story-media").upload(path, mediaToUpload, {
    upsert: false,
    contentType: mediaToUpload.type || file.type || "image/jpeg",
    cacheControl: "3600"
  });

  if (error) {
    const reason = error.message || "Supabase rejected the upload.";
    if (/bucket|not.?found/i.test(reason)) {
      throw new Error("Image upload is unavailable: Supabase Storage bucket ‘story-media’ does not exist. Create that bucket and its authenticated upload/read policies, then retry.");
    }
    if (/policy|permission|row.level.security|unauthorized/i.test(reason)) {
      throw new Error(`Image upload was blocked by the story-media Storage permissions: ${reason}`);
    }
    throw new Error(`Image/video upload failed: ${reason}`);
  }
  if (!data?.path) throw new Error("Upload finished, but Supabase did not return a storage path.");
  return data.path;
}

function draftData(path, audioPath = null) {
  return {
    filter,
    zoom,
    rotation,
    paths,
    overlays,
    mediaPath: path || null,
    audioPath: audioPath || null,
    mediaType: file?.type.startsWith("video/") ? "video" : "image",
    soundName: soundFile?.name || null
  };
}

async function uploadSound() {
  if (!soundFile) return null;
  if (!user) throw new Error("Sign in to upload story audio.");
  const safeName = (soundFile.name || "story-audio").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const path = `${user.id}/stories/audio/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await client.storage.from("story-media").upload(path, soundFile, {
    upsert: false,
    contentType: soundFile.type || "audio/mpeg",
    cacheControl: "3600"
  });
  if (error) throw new Error("Story audio upload failed: " + error.message);
  if (!data?.path) throw new Error("Audio upload finished without a storage path.");
  return data.path;
}

async function cleanupUpload(path) {
  if (!path) return;
  const { error } = await client.storage.from("story-media").remove([path]);
  if (error) console.warn("Could not clean up failed story upload:", error.message);
}

$("#storyFile").addEventListener("change", event => {
  const selected = event.target.files?.[0];
  if (selected) showFile(selected);
  event.target.value = "";
});
$("#browseMediaBtn").addEventListener("click", () => $("#storyFile").click());
$("#changeMediaBtn").addEventListener("click", () => $("#storyFile").click());

$$("[data-tool]").forEach(button => button.addEventListener("click", () => {
  $$("[data-tool]").forEach(item => item.classList.toggle("active", item === button));
  const tool = button.dataset.tool;
  activateTool(tool);
  if (tool === "text") addText();
  if (tool === "sound") $("#soundPicker").click();
}));

$$("[data-filter]").forEach(button => button.addEventListener("click", () => {
  filter = button.dataset.filter;
  $$("[data-filter]").forEach(item => item.classList.toggle("active", item === button));
  applyFilter();
  msg(`${button.textContent.trim()} filter applied.`);
}));
$$("[data-sticker]").forEach(button => button.addEventListener("click", () => addText(button.dataset.sticker)));
$$("[data-emoji]").forEach(button => button.addEventListener("click", () => addText(button.dataset.emoji)));

$$("[data-color]").forEach(button => button.addEventListener("click", () => {
  drawColor = button.dataset.color;
  $$("[data-color]").forEach(item => item.classList.toggle("active", item === button));
  msg("Brush color updated.");
}));

$("#rotateBtn").addEventListener("click", () => { rotation = (rotation + 90) % 360; applyFilter(); msg("Rotated 90 degrees."); });
$("#zoomInBtn").addEventListener("click", () => { zoom = Math.min(2, +(zoom + 0.1).toFixed(1)); applyFilter(); msg("Zoomed in."); });
$("#zoomOutBtn").addEventListener("click", () => { zoom = Math.max(0.5, +(zoom - 0.1).toFixed(1)); applyFilter(); msg("Zoomed out."); });
$("#resetTransformBtn").addEventListener("click", () => { zoom = 1; rotation = 0; applyFilter(); msg("Transform reset."); });

$("#undoBtn").addEventListener("click", () => {
  if (paths.length) { paths.pop(); redraw(); msg("Last drawing action removed."); return; }
  if (overlays.length) { overlays.pop(); renderText(); msg("Last sticker or text removed."); return; }
  msg("Nothing to undo.");
});

const canvas = $("#drawCanvas");
canvas.addEventListener("pointerdown", event => {
  if (!file || !["draw", "erase"].includes(drawMode)) return;
  drawing = true;
  canvas.setPointerCapture(event.pointerId);
  activePath = { color: drawColor, width: 5, erase: drawMode === "erase", points: [canvasPoint(event)] };
  paths.push(activePath);
  redraw();
});
canvas.addEventListener("pointermove", event => {
  if (!drawing || !activePath) return;
  activePath.points.push(canvasPoint(event));
  redraw();
});
["pointerup", "pointercancel", "lostpointercapture"].forEach(type => canvas.addEventListener(type, () => { drawing = false; activePath = null; }));

$("#soundPicker").addEventListener("change", event => {
  const selected = event.target.files?.[0] || null;
  if (selected && !selected.type.startsWith("audio/")) {
    msg("Choose a valid audio file.", true);
    event.target.value = "";
    return;
  }
  if (selected && selected.size > 25 * 1024 * 1024) {
    msg("Audio files must be 25 MB or smaller.", true);
    event.target.value = "";
    return;
  }
  if (soundPreview) soundPreview.pause();
  if (soundObjectUrl) URL.revokeObjectURL(soundObjectUrl);
  soundFile = selected;
  soundObjectUrl = soundFile ? URL.createObjectURL(soundFile) : "";
  soundPreview = soundObjectUrl ? new Audio(soundObjectUrl) : null;
  if (soundPreview) soundPreview.preload = "metadata";
  msg(soundFile ? `Selected soundtrack: ${soundFile.name}. It will be uploaded and attached to your published story.` : "Soundtrack removed.");
  event.target.value = "";
});

$("#playPreview").addEventListener("click", async () => {
  const video = $("#storyVideo");
  if (!file) { msg("Choose a photo or video first."); return; }
  try {
    if (file.type.startsWith("video/")) {
      if (video.paused) await video.play();
      else video.pause();
    }
    if (soundPreview) {
      if (soundPreview.paused) await soundPreview.play();
      else soundPreview.pause();
    } else if (!file.type.startsWith("video/")) {
      msg("Photo preview is ready. Select Sound to add a soundtrack.");
    }
  } catch (error) {
    msg(error.message || "Preview playback could not start.", true);
  }
});
$("#soundToggle").addEventListener("click", () => {
  const video = $("#storyVideo");
  if (soundPreview) {
    soundPreview.muted = !soundPreview.muted;
    $("#soundToggle").textContent = soundPreview.muted ? "◖×" : "◖))";
    return;
  }
  if (!file || !file.type.startsWith("video/")) {
    msg("Choose a video or add a soundtrack first.");
    return;
  }
  video.muted = !video.muted;
  $("#soundToggle").textContent = video.muted ? "◖×" : "◖))";
});

$("#saveDraft").addEventListener("click", async () => {
  const button = $("#saveDraft");
  button.disabled = true;
  let uploadedPath = null;
  let uploadedAudioPath = null;
  try {
    if (!user) throw new Error("Sign in to save a story draft.");
    if (!file) throw new Error("Choose a photo or video first.");
    button.textContent = "Uploading…";
    uploadedPath = await upload();
    uploadedAudioPath = await uploadSound();
    const draft = draftData(uploadedPath, uploadedAudioPath);
    const { error } = await client.from("story_drafts").insert({
      user_id: user.id,
      media_url: uploadedPath,
      media_type: draft.mediaType,
      draft_data: draft
    });
    if (error) throw new Error(`Upload worked, but saving the draft failed: ${error.message}`);
    msg("Draft saved to your ARS account.");
  } catch (error) {
    await cleanupUpload(uploadedPath);
    await cleanupUpload(uploadedAudioPath);
    msg(error.message || "Could not save this draft.", true);
  } finally {
    button.textContent = "⇩ Save Draft";
    button.disabled = !file;
  }
});

$("#nextStory").addEventListener("click", async () => {
  const button = $("#nextStory");
  button.disabled = true;
  let uploadedPath = null;
  let uploadedAudioPath = null;
  try {
    if (!user) throw new Error("Sign in to continue.");
    if (!file) throw new Error("Choose a photo or video first.");
    button.textContent = "Uploading…";
    uploadedPath = await upload();
    uploadedAudioPath = await uploadSound();
    const draft = draftData(uploadedPath, uploadedAudioPath);
    sessionStorage.setItem("ars_story_composer", JSON.stringify({
      path: uploadedPath,
      audioPath: uploadedAudioPath,
      mediaType: draft.mediaType,
      filter,
      zoom,
      rotation,
      paths,
      overlays,
      soundName: soundFile?.name || null
    }));
    location.href = "create-post.html?mode=story";
  } catch (error) {
    await cleanupUpload(uploadedPath);
    await cleanupUpload(uploadedAudioPath);
    msg(error.message || "Could not continue to story publishing.", true);
  } finally {
    button.textContent = "Next ›";
    button.disabled = !file;
  }
});

$("#closeEditor").addEventListener("click", () => {
  if (confirm("Discard this story edit?")) location.href = "home.html";
});
window.addEventListener("resize", resizeCanvas);
window.addEventListener("pagehide", () => {
  if (soundPreview) soundPreview.pause();
  if (soundObjectUrl) URL.revokeObjectURL(soundObjectUrl);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});

const stage = $("#previewWrap");
stage.addEventListener("dragover", event => { event.preventDefault(); stage.classList.add("dragging"); });
stage.addEventListener("dragleave", () => stage.classList.remove("dragging"));
stage.addEventListener("drop", event => {
  event.preventDefault();
  stage.classList.remove("dragging");
  const droppedFile = event.dataTransfer.files?.[0];
  if (droppedFile && /^(image|video)\//.test(droppedFile.type)) showFile(droppedFile);
  else msg("Choose a photo or video file.", true);
});

(async () => {
  try {
    user = await auth();
    updateTools();
    if (!user) return;
  } catch (error) {
    msg(error.message || "Could not connect to ARS.", true);
  }
})();
})();
