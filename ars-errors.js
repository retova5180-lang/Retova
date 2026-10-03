"use strict";

/*
 * ARS Error Guard
 * ---------------------------------------------------------
 * Central error tracking and isolation system for ARS.
 *
 * Responsibilities:
 * - Capture JavaScript errors.
 * - Capture unhandled Promise rejections.
 * - Run features safely without crashing the whole page.
 * - Keep a history of errors.
 * - Expose errors for debugging.
 * - Never report a failed action as successful.
 *
 * Important:
 * This file DOES NOT contain feature logic.
 * Stories, Posts, Wheel, Profile, etc. remain in their own files.
 */

(function () {
    const STORAGE_KEY = "ars_error_log";
    const MAX_ERRORS = 100;

    const errors = [];

    function getTimestamp() {
        return new Date().toISOString();
    }

    function normalizeError(error) {
        if (!error) {
            return {
                name: "UnknownError",
                message: "Unknown error",
                stack: ""
            };
        }

        if (error instanceof Error) {
            return {
                name: error.name || "Error",
                message: error.message || String(error),
                stack: error.stack || ""
            };
        }

        if (typeof error === "string") {
            return {
                name: "Error",
                message: error,
                stack: ""
            };
        }

        try {
            return {
                name: error.name || "Error",
                message: error.message || JSON.stringify(error),
                stack: error.stack || ""
            };
        } catch {
            return {
                name: "Error",
                message: String(error),
                stack: ""
            };
        }
    }

    function saveErrors() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(errors.slice(-MAX_ERRORS))
            );
        } catch {
            // Storage failure must never break ARS.
        }
    }

    function loadErrors() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return;
            }

            const parsed = JSON.parse(saved);

            if (!Array.isArray(parsed)) {
                return;
            }

            errors.length = 0;

            parsed
                .slice(-MAX_ERRORS)
                .forEach((item) => errors.push(item));
        } catch {
            // Corrupted error storage must never break ARS.
        }
    }

    function capture(error, feature = "unknown", action = "unknown", extra = {}) {
        const normalized = normalizeError(error);

        const entry = {
            id: `ars-error-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

            timestamp: getTimestamp(),

            feature: String(feature || "unknown"),

            action: String(action || "unknown"),

            name: normalized.name,

            message: normalized.message,

            stack: normalized.stack,

            page: window.location.pathname || "",

            extra: extra && typeof extra === "object"
                ? extra
                : {}
        };

        errors.push(entry);

        while (errors.length > MAX_ERRORS) {
            errors.shift();
        }

        saveErrors();

        console.error(
            `[ARS ERROR] ${entry.feature}.${entry.action}`,
            entry.message,
            entry
        );

        return entry;
    }

    function clear() {
        errors.length = 0;

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore storage errors.
        }
    }

    function getAll() {
        return errors.slice();
    }

    function getByFeature(feature) {
        return errors.filter(
            (item) => item.feature === String(feature)
        );
    }

    function getLast() {
        if (!errors.length) {
            return null;
        }

        return errors[errors.length - 1];
    }

    function hasErrors(feature) {
        if (!feature) {
            return errors.length > 0;
        }

        return errors.some(
            (item) => item.feature === String(feature)
        );
    }

    /*
     * Safely execute synchronous code.
     *
     * If the feature fails:
     * - Error is recorded.
     * - The page does NOT crash.
     * - null is returned.
     */
    function run(callback, feature, action, fallback = null) {
        try {
            return callback();
        } catch (error) {
            capture(error, feature, action);

            return fallback;
        }
    }

    /*
     * Safely execute asynchronous code.
     *
     * If the feature fails:
     * - Error is recorded.
     * - Other features can continue.
     * - fallback is returned.
     */
    async function runAsync(
        callback,
        feature,
        action,
        fallback = null
    ) {
        try {
            return await callback();
        } catch (error) {
            capture(error, feature, action);

            return fallback;
        }
    }

    /*
     * Safe event listener.
     *
     * Example:
     *
     * ARSErrors.safeEvent(
     *     button,
     *     "click",
     *     () => openStory(),
     *     "stories",
     *     "open"
     * );
     */
    function safeEvent(
        element,
        eventName,
        callback,
        feature,
        action
    ) {
        if (!element || typeof element.addEventListener !== "function") {
            capture(
                new Error("Invalid event target"),
                feature,
                action
            );

            return false;
        }

        element.addEventListener(eventName, function (event) {
            run(
                () => callback(event),
                feature,
                action
            );
        });

        return true;
    }

    /*
     * Safe asynchronous event listener.
     */
    function safeAsyncEvent(
        element,
        eventName,
        callback,
        feature,
        action
    ) {
        if (!element || typeof element.addEventListener !== "function") {
            capture(
                new Error("Invalid event target"),
                feature,
                action
            );

            return false;
        }

        element.addEventListener(eventName, function (event) {
            runAsync(
                () => callback(event),
                feature,
                action
            );
        });

        return true;
    }

    /*
     * Run independent features without allowing
     * one failure to stop the others.
     *
     * Example:
     *
     * ARSErrors.runFeatures([
     *     {
     *         feature: "posts",
     *         action: "load",
     *         callback: loadPosts
     *     },
     *     {
     *         feature: "stories",
     *         action: "load",
     *         callback: loadStories
     *     }
     * ]);
     */
    async function runFeatures(tasks) {
        if (!Array.isArray(tasks)) {
            capture(
                new Error("runFeatures expects an array"),
                "system",
                "runFeatures"
            );

            return [];
        }

        const results = await Promise.all(
            tasks.map(async (task) => {
                if (!task || typeof task.callback !== "function") {
                    capture(
                        new Error("Invalid feature task"),
                        "system",
                        "runFeatures"
                    );

                    return null;
                }

                return runAsync(
                    task.callback,
                    task.feature || "unknown",
                    task.action || "unknown",
                    null
                );
            })
        );

        return results;
    }

    /*
     * Small helper for UI error messages.
     *
     * It does not pretend the operation succeeded.
     */
    function userMessage(feature, action) {
        const featureName = feature
            ? String(feature)
            : "This feature";

        const actionName = action
            ? String(action)
            : "operation";

        return `${featureName} could not complete the ${actionName}. Please try again.`;
    }

    /*
     * Global JavaScript errors.
     */
    window.addEventListener("error", function (event) {
        capture(
            event.error || new Error(event.message || "Unknown error"),
            "global",
            "javascript",
            {
                filename: event.filename || "",
                line: event.lineno || 0,
                column: event.colno || 0
            }
        );
    });

    /*
     * Global Promise errors.
     */
    window.addEventListener(
        "unhandledrejection",
        function (event) {
            capture(
                event.reason || new Error("Unhandled Promise rejection"),
                "global",
                "promise"
            );
        }
    );

    /*
     * Public ARS Error Guard API.
     */
    window.ARSErrors = {
        capture,
        clear,
        getAll,
        getByFeature,
        getLast,
        hasErrors,

        run,
        runAsync,

        safeEvent,
        safeAsyncEvent,

        runFeatures,

        userMessage,

        version: "1.0.0"
    };

    /*
     * Load previous errors.
     */
    loadErrors();

    console.info(
        `[ARS Error Guard] Loaded. ${errors.length} stored error(s).`
    );
})();
