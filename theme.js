(() => {
  "use strict";
  const KEY = "ars_theme_accent";
  const DEFAULT = "#a855f7";
  const ALLOWED = new Set(["#a855f7", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"]);

  function apply(color) {
    const accent = ALLOWED.has(String(color).toLowerCase()) ? String(color).toLowerCase() : DEFAULT;
    const channels = accent.match(/[a-f0-9]{2}/gi).map(value => parseInt(value, 16));
    const rgb = channels.join(", ");
    const root = document.documentElement;

    root.style.setProperty("--purple", accent);
    root.style.setProperty("--purple-light", accent);
    root.style.setProperty("--purple-dark", accent);
    root.style.setProperty("--purple-primary", accent);
    root.style.setProperty("--purple-bright", accent);
    root.style.setProperty("--purple-main", accent);
    root.style.setProperty("--purple-accent", accent);
    root.style.setProperty("--border-focus", accent);
    root.style.setProperty("--ars-accent", accent);
    root.style.setProperty("--ars-accent-rgb", rgb);
    root.style.setProperty("--purple-glow", "rgba(" + rgb + ", 0.45)");
    root.style.setProperty("--purple-border", "rgba(" + rgb + ", 0.16)");
    root.style.setProperty("--purple-border-subtle", "rgba(" + rgb + ", 0.1)");
    return accent;
  }

  let saved = DEFAULT;
  try { saved = localStorage.getItem(KEY) || DEFAULT; } catch (_) {}
  apply(saved);
  window.ARSTheme = {
    key: KEY,
    apply,
    get: () => {
      try { return localStorage.getItem(KEY) || DEFAULT; } catch (_) { return DEFAULT; }
    }
  };
})();