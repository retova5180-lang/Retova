(() => {
  "use strict";
  const KEY = "ars_theme_accent";
  const DEFAULT = "#a855f7";
  const ALLOWED = new Set(["#a855f7", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"]);
  const PURPLE_HEX = new Set([
    "#a855f7", "#8b3dff", "#9333ea", "#7c3aed", "#c084fc", "#c54dff",
    "#8b5cf6", "#e9d5ff", "#d8b4fe", "#e0c3fc", "#6d28d9", "#a78bfa",
    "#c4b5fd", "#7e22ce", "#581c87"
  ]);
  const PURPLE_RGB = new Set(["168, 85, 247", "139, 61, 255", "124, 58, 237"]);

  function themedValue(value) {
    let result = String(value);
    result = result.replace(/#[0-9a-f]{6}\b/gi, hex =>
      PURPLE_HEX.has(hex.toLowerCase()) ? "var(--ars-accent)" : hex
    );
    result = result.replace(/rgba?\(\s*(168,\s*85,\s*247|139,\s*61,\s*255|124,\s*58,\s*237)\s*(,\s*[^)]+)?\)/gi,
      (match, rgb, tail) => "rgba(var(--ars-accent-rgb)" + (tail || ", 1") + ")"
    );
    return result;
  }

  function patchRule(rule) {
    if (rule.style) {
      for (let i = 0; i < rule.style.length; i++) {
        const property = rule.style[i];
        const before = rule.style.getPropertyValue(property);
        const after = themedValue(before);
        if (after !== before) rule.style.setProperty(property, after, rule.style.getPropertyPriority(property));
      }
    }
    if (rule.cssRules) {
      for (const nested of Array.from(rule.cssRules)) patchRule(nested);
    }
  }

  let stylesPatched = false;
  function patchExistingStyles() {
    if (!stylesPatched) {
      for (const sheet of Array.from(document.styleSheets)) {
        try { for (const rule of Array.from(sheet.cssRules)) patchRule(rule); }
        catch (_) { /* Cross-origin stylesheets are intentionally left untouched. */ }
      }
      stylesPatched = true;
    }
    document.querySelectorAll("[style]").forEach(element => {
      const before = element.getAttribute("style");
      const after = themedValue(before);
      if (after !== before) element.setAttribute("style", after);
    });
    document.querySelectorAll("svg [fill], svg [stroke], [fill], [stroke]").forEach(element => {
      for (const attribute of ["fill", "stroke"]) {
        const value = element.getAttribute(attribute);
        if (value && PURPLE_HEX.has(value.toLowerCase())) element.setAttribute(attribute, "var(--ars-accent)");
      }
    });
  }

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
    patchExistingStyles();
    return accent;
  }

  let saved = DEFAULT;
  try { saved = localStorage.getItem(KEY) || DEFAULT; } catch (_) {}
  apply(saved);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchExistingStyles, { once: true });
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "attributes" && record.target instanceof Element) {
        if (record.attributeName === "style") {
          const before = record.target.getAttribute("style") || "";
          const after = themedValue(before);
          if (after !== before) record.target.setAttribute("style", after);
        } else if (record.attributeName === "fill" || record.attributeName === "stroke") {
          const value = record.target.getAttribute(record.attributeName);
          if (value && PURPLE_HEX.has(value.toLowerCase())) record.target.setAttribute(record.attributeName, "var(--ars-accent)");
        }
      } else if (record.type === "childList") {
        record.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches?.("[style], [fill], [stroke]")) patchExistingStyles();
            else if (node.querySelector?.("[style], [fill], [stroke]")) patchExistingStyles();
          }
        });
      }
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "fill", "stroke"] });

  window.addEventListener("storage", event => {
    if (event.key === KEY) apply(event.newValue || DEFAULT);
  });

  window.ARSTheme = {
    key: KEY,
    apply,
    get: () => {
      try { return localStorage.getItem(KEY) || DEFAULT; } catch (_) { return DEFAULT; }
    }
  };
})();