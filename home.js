/* =========================================================
   ΛRS — HOME.JS
   Home interactions
   Works with mobile / iPad / laptop / desktop
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const safeClick = (element, callback) => {
        if (!element) return;

        element.addEventListener("click", (event) => {
            event.preventDefault();
            callback(event);
        });
    };

    /* =====================================================
       USER PROFILE BUTTON
    ===================================================== */

    const userButton = $(".ars-user-button");

    safeClick(userButton, () => {
        /*
         * profile.html will be connected here later.
         * For now this keeps the button functional
         * without breaking the Home page.
         */

        if (typeof window.openProfile === "function") {
            window.openProfile();
            return;
        }

        window.location.href = "profile.html";
    });

    /* =====================================================
       LOGO
    ===================================================== */

    const logo = $(".ars-logo");

    safeClick(logo, () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    /* =====================================================
       WHEEL BUTTON
    ===================================================== */

    const wheelButton = $(".ars-wheel-button");

    safeClick(wheelButton, () => {
        openWheel();
    });

    /* =====================================================
       MINI WHEEL STORY
    ===================================================== */

    const wheelStory = $(".wheel-story");

    safeClick(wheelStory, () => {
        openWheel();
    });

    /* =====================================================
       CREATE POST BUTTON
    ===================================================== */

    const createPostButton = $(".ars-create-post");

    safeClick(createPostButton, () => {
        window.location.href = "create-post.html";
    });

    /* =====================================================
       STORIES
    ===================================================== */

    $$(".ars-story").forEach((story) => {
        story.addEventListener("click", () => {

            if (story.classList.contains("ars-story-you")) {
                if (typeof window.openProfile === "function") {
                    window.openProfile();
                } else {
                    window.location.href = "profile.html";
                }

                return;
            }

            const username =
                story.dataset.username ||
                story.querySelector(".ars-story-name")?.textContent?.trim();

            if (!username) return;

            if (typeof window.openStory === "function") {
                window.openStory(username);
            }
        });
    });

    /* =====================================================
       POST MENUS
    ===================================================== */

    $$(".ars-post-menu").forEach((menu) => {

        menu.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const post = menu.closest(".ars-post");

            if (!post) return;

            openPostMenu(post, menu);
        });

    });

    /* =====================================================
       POST PROFILE
    ===================================================== */

    $$(".ars-post-profile").forEach((profile) => {

        profile.addEventListener("click", () => {

            const post = profile.closest(".ars-post");

            const username =
                post?.dataset.username ||
                profile.querySelector(".ars-post-username")?.textContent?.trim();

            if (!username) {
                window.location.href = "profile.html";
                return;
            }

            if (typeof window.openProfileByUsername === "function") {
                window.openProfileByUsername(username);
                return;
            }

            window.location.href =
                `profile.html?user=${encodeURIComponent(username.replace("@", ""))}`;
        });

    });

    /* =====================================================
       POST LIKES
    ===================================================== */

    $$(".like-button").forEach((button) => {

        button.addEventListener("click", () => {

            const countElement =
                $(".action-count", button);

            const icon =
                $(".action-icon", button);

            let count = parseNumber(
                countElement?.textContent || "0"
            );

            const alreadyLiked =
                button.classList.contains("liked");

            if (alreadyLiked) {
                count = Math.max(0, count - 1);

                button.classList.remove("liked");

                if (icon) {
                    icon.textContent = "♡";
                }

            } else {
                count += 1;

                button.classList.add("liked");

                if (icon) {
                    icon.textContent = "♥";
                }
            }

            if (countElement) {
                countElement.textContent =
                    formatNumber(count);
            }

        });

    });

    /* =====================================================
       POST COMMENTS
    ===================================================== */

    $$(".comment-button").forEach((button) => {

        button.addEventListener("click", () => {

            const post =
                button.closest(".ars-post");

            if (!post) return;

            if (typeof window.openComments === "function") {
                window.openComments(post);
                return;
            }

            /*
             * Comments page can be connected later.
             */

            const postId =
                post.dataset.postId || "";

            window.location.href =
                `post.html${postId ? `?id=${encodeURIComponent(postId)}` : ""}`;
        });

    });

    /* =====================================================
       REPOST
    ===================================================== */

    $$(".repost-button").forEach((button) => {

        button.addEventListener("click", () => {

            const post =
                button.closest(".ars-post");

            if (!post) return;

            const active =
                button.classList.contains("reposted");

            const countElement =
                $(".action-count", button);

            let count =
                parseNumber(countElement?.textContent || "0");

            if (active) {
                count = Math.max(0, count - 1);
                button.classList.remove("reposted");
            } else {
                count += 1;
                button.classList.add("reposted");
            }

            if (countElement) {
                countElement.textContent =
                    formatNumber(count);
            }

        });

    });

    /* =====================================================
       SAVE
    ===================================================== */

    $$(".save-button").forEach((button) => {

        button.addEventListener("click", () => {

            button.classList.toggle("saved");

            const icon =
                $(".action-icon", button);

            if (!icon) return;

            icon.textContent =
                button.classList.contains("saved")
                    ? "★"
                    : "☆";

        });

    });

    /* =====================================================
       BOTTOM NAVIGATION
    ===================================================== */

    $$(".ars-nav-item").forEach((item) => {

        item.addEventListener("click", () => {

            const page =
                item.dataset.page;

            if (!page) return;

            if (
                page === "home" ||
                item.classList.contains("active")
            ) {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                return;
            }

            navigateToPage(page);
        });

    });

    /* =====================================================
       SEARCH
    ===================================================== */

    const searchButton =
        $(
            '.ars-nav-item[data-page="search"], [data-action="search"]'
        );

    safeClick(searchButton, () => {
        window.location.href = "search.html";
    });

    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    const notificationButton =
        $(
            '.ars-nav-item[data-page="notifications"], [data-action="notifications"]'
        );

    safeClick(notificationButton, () => {
        window.location.href = "notifications.html";
    });

    /* =====================================================
       MESSAGES
    ===================================================== */

    const messagesButton =
        $(
            '.ars-nav-item[data-page="messages"], [data-action="messages"]'
        );

    safeClick(messagesButton, () => {
        window.location.href = "messages.html";
    });

    /* =====================================================
       STORY HORIZONTAL SCROLL
    ===================================================== */

    const stories =
        $(".ars-stories");

    if (stories) {

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        stories.addEventListener("pointerdown", (event) => {

            isDown = true;
            startX = event.clientX;
            scrollLeft = stories.scrollLeft;

            stories.setPointerCapture?.(event.pointerId);
        });

        stories.addEventListener("pointermove", (event) => {

            if (!isDown) return;

            const distance =
                event.clientX - startX;

            stories.scrollLeft =
                scrollLeft - distance;
        });

        const stopDragging = () => {
            isDown = false;
        };

        stories.addEventListener(
            "pointerup",
            stopDragging
        );

        stories.addEventListener(
            "pointercancel",
            stopDragging
        );

        stories.addEventListener(
            "pointerleave",
            stopDragging
        );
    }

    /* =====================================================
       WHEEL
    ===================================================== */

    function openWheel() {

        /*
         * If wheel.js exists, use it directly.
         */

        if (
            typeof window.openARSWheel === "function"
        ) {
            window.openARSWheel();
            return;
        }

        if (
            typeof window.openWheel === "function" &&
            window.openWheel !== openWheel
        ) {
            window.openWheel();
            return;
        }

        /*
         * Fallback:
         * Load wheel.html if it exists.
         */

        const existing =
            document.querySelector("#arsWheelModal");

        if (existing) {
            existing.classList.add("active");
            document.body.classList.add("wheel-open");
            return;
        }

        window.location.href = "wheel.html";
    }

    /* =====================================================
       POST MENU
    ===================================================== */

    function openPostMenu(post, menuButton) {

        closeAllPostMenus();

        const menu =
            document.createElement("div");

        menu.className =
            "ars-post-popup-menu";

        menu.innerHTML = `
            <button type="button" data-menu-action="save">
                Save
            </button>

            <button type="button" data-menu-action="share">
                Share
            </button>

            <button type="button" data-menu-action="copy">
                Copy link
            </button>

            <button type="button" data-menu-action="report">
                Report
            </button>
        `;

        post.style.position = "relative";

        post.appendChild(menu);

        menu.querySelectorAll("button").forEach((button) => {

            button.addEventListener("click", () => {

                const action =
                    button.dataset.menuAction;

                handlePostMenuAction(
                    action,
                    post
                );

                menu.remove();
            });

        });

        setTimeout(() => {

            document.addEventListener(
                "click",
                function outsideClick(event) {

                    if (
                        !menu.contains(event.target) &&
                        event.target !== menuButton
                    ) {
                        menu.remove();

                        document.removeEventListener(
                            "click",
                            outsideClick
                        );
                    }

                }
            );

        }, 0);
    }

    function closeAllPostMenus() {

        $$(".ars-post-popup-menu")
            .forEach((menu) => menu.remove());
    }

    function handlePostMenuAction(action, post) {

        if (action === "save") {

            const saveButton =
                $(".save-button", post);

            saveButton?.click();

            return;
        }

        if (action === "share") {

            sharePost(post);

            return;
        }

        if (action === "copy") {

            copyPostLink(post);

            return;
        }

        if (action === "report") {

            showMessage(
                "Thanks. This post has been reported."
            );

        }
    }

    /* =====================================================
       SHARE
    ===================================================== */

    async function sharePost(post) {

        const postId =
            post.dataset.postId || "";

        const url =
            `${window.location.origin}${window.location.pathname}` +
            `${postId ? `?post=${encodeURIComponent(postId)}` : ""}`;

        if (
            navigator.share
        ) {

            try {

                await navigator.share({
                    title: "ΛRS",
                    text: "Check this post on ΛRS.",
                    url
                });

            } catch {
                // User cancelled share.
            }

            return;
        }

        await copyText(url);

        showMessage(
            "Post link copied."
        );
    }

    /* =====================================================
       COPY POST LINK
    ===================================================== */

    async function copyPostLink(post) {

        const postId =
            post.dataset.postId || "";

        const url =
            `${window.location.origin}${window.location.pathname}` +
            `${postId ? `?post=${encodeURIComponent(postId)}` : ""}`;

        const copied =
            await copyText(url);

        if (copied) {
            showMessage("Link copied.");
        }
    }

    /* =====================================================
       COPY TEXT
    ===================================================== */

    async function copyText(text) {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            try {

                await navigator.clipboard.writeText(text);

                return true;

            } catch {
                return false;
            }
        }

        try {

            const textarea =
                document.createElement("textarea");

            textarea.value = text;

            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);

            textarea.select();

            const success =
                document.execCommand("copy");

            textarea.remove();

            return success;

        } catch {
            return false;
        }
    }

    /* =====================================================
       NAVIGATION
    ===================================================== */

    function navigateToPage(page) {

        const routes = {

            home: "home.html",
            search: "search.html",
            notifications: "notifications.html",
            messages: "messages.html",
            profile: "profile.html",
            settings: "settings.html",
            create: "create-post.html",
            wheel: "wheel.html"

        };

        const destination =
            routes[page] || page;

        if (!destination) return;

        window.location.href =
            destination;
    }

    /* =====================================================
       NUMBER PARSER
    ===================================================== */

    function parseNumber(value) {

        if (!value) return 0;

        const clean =
            String(value)
                .replace(/,/g, "")
                .replace(/K/gi, "000")
                .replace(/M/gi, "000000");

        const number =
            Number(clean);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    /* =====================================================
       NUMBER FORMATTER
    ===================================================== */

    function formatNumber(number) {

        if (number >= 1000000) {
            return `${(number / 1000000).toFixed(1)}M`;
        }

        if (number >= 1000) {
            return `${(number / 1000).toFixed(1)}K`;
        }

        return String(number);
    }

    /* =====================================================
       MESSAGE
    ===================================================== */

    function showMessage(text) {

        let message =
            $("#arsToast");

        if (!message) {

            message =
                document.createElement("div");

            message.id =
                "arsToast";

            message.style.position =
                "fixed";

            message.style.left =
                "50%";

            message.style.bottom =
                "105px";

            message.style.transform =
                "translateX(-50%) translateY(15px)";

            message.style.zIndex =
                "9999";

            message.style.padding =
                "12px 18px";

            message.style.borderRadius =
                "14px";

            message.style.background =
                "rgba(25,25,30,.96)";

            message.style.border =
                "1px solid rgba(139,53,255,.35)";

            message.style.color =
                "#fff";

            message.style.fontSize =
                "14px";

            message.style.fontWeight =
                "650";

            message.style.opacity =
                "0";

            message.style.pointerEvents =
                "none";

            message.style.transition =
                "opacity .2s ease, transform .2s ease";

            document.body.appendChild(message);
        }

        
