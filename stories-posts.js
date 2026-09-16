(() => {
  "use strict";

  function refresh() {
    if (
      window.ARSHome &&
      typeof window.ARSHome.renderStories ===
        "function"
    ) {
      window.ARSHome.renderStories();
    }

    if (
      window.ARSHome &&
      typeof window.ARSHome.renderPosts ===
        "function"
    ) {
      window.ARSHome.renderPosts();
    }

    if (
      window.lucide &&
      typeof window.lucide.createIcons ===
        "function"
    ) {
      window.lucide.createIcons();
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      refresh,
      {
        once: true
      }
    );
  } else {
    refresh();
  }

  document.addEventListener(
    "ars:post-created",
    refresh
  );

  document.addEventListener(
    "ars:story-created",
    refresh
  );

  window.addEventListener(
    "storage",
    (event) => {
      if (
        event.key ===
          "ars_local_posts" ||
        event.key ===
          "ars_local_stories"
      ) {
        refresh();
      }
    }
  );

  window.ARSStoriesPosts = {
    refresh
  };
})();
