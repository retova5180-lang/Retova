
"use strict";

/* =====================================
   ARS HOME — PART 1
   Setup and basic utilities
===================================== */

const SUPABASE_URL =
  "https://bfqsqgfyyewnfxekirfv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_OM-Lm9LZCtmzkGYmpyA8A_jnvgmH1-";

if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {
  throw new Error(
    "ARS: Supabase library is not loaded."
  );
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const ARS_WHEEL_FREE_SPINS = 2;
const ARS_WHEEL_STORAGE_KEY = "ars_wheel_spins";

const $ = (id) => document.getElementById(id);

const state = {
  initialized: false,
  user: null,
  posts: [],
  stories: [],
  comments: new Map(),
  currentPostId: null,
  currentStoryGroup: [],
  currentStoryIndex: 0,
  storyFile: null,
  storyMediaData: null,
  storyMediaType: "image",
  storyZoom: 1,
  storyFilter: "none",
  storySticker: null,
  postImageData: null,
  wheelSpins: ARS_WHEEL_FREE_SPINS,
  wheelRotation: 0,
  searchQuery: ""
};

const WHEEL_CHALLENGES = [
  { title: "Post something today", category: "POST", reward: 20 },
  { title: "Share a story", category: "STORY", reward: 25 },
  { title: "Like three posts", category: "LIKE", reward: 15 },
  { title: "Use a hashtag", category: "TAG", reward: 10 },
  { title: "Leave a comment", category: "COMMENT", reward: 15 },
  { title: "Keep your streak alive", category: "STREAK", reward: 30 }
];

function safeError(context, error) {
  try {
    if (
      window.ARSErrors &&
      typeof window.ARSErrors.capture === "function"
    ) {
      window.ARSErrors.capture(
        error,
        "home",
        String(context || "unknown")
      );
      return;
    }
  } catch (loggingError) {
    console.error("[ARS:error-logger]", loggingError);
  }

  console.error(
    `[ARS:${String(context || "unknown")}]`,
    error
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCount(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) return "0";
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;

  return String(number);
}

function timeAgo(date) {
  const timestamp = new Date(date).getTime();

  if (!Number.isFinite(timestamp)) return "";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000)
  );

  if (seconds < 60) return "now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(timestamp).toLocaleDateString();
}

function refreshIcons() {
  try {
    if (
      window.lucide &&
      typeof window.lucide.createIcons === "function"
    ) {
      window.lucide.createIcons();
    }
  } catch (error) {
    safeError("icons", error);
  }
}

function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    console.warn("ARS toast element was not found.");
    return;
  }

  toast.textContent = String(message || "");
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
    }
      
