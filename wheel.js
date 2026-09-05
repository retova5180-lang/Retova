/* =========================================================
   ΛRS — DAILY WHEEL
   Complete working version
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const STORAGE_KEY =
        "ars_daily_wheel_state";

    const REWARD_KEY =
        "ars_user_rewards";

    const MAX_SPINS_PER_DAY = 2;


    /* =====================================================
       REWARDS
    ===================================================== */

    const rewards = [

        {
            id: "streak1",
            title: "Streak Bonus",
            description: "+1 Streak",
            icon: "🔥"
        },

        {
            id: "streak2",
            title: "Streak Bonus",
            description: "+2 Streak",
            icon: "🔥"
        },

        {
            id: "avatar",
            title: "Free Avatar",
            description: "Free avatar for 1 day",
            icon: "🖼️"
        },

        {
            id: "vip",
            title: "VIP Badge",
            description: "VIP Badge for 1 day",
            icon: "👑"
        },

        {
            id: "theme",
            title: "Favorite Theme",
            description: "Favorite theme for 1 hour",
            icon: "✨"
        }

    ];


    /* =====================================================
       CHALLENGES
    ===================================================== */

    const challenges = [

        {
            id: "post",
            title: "Post Challenge",
            description:
                "Create a post today.",
            target: 1
        },

        {
            id: "like",
            title: "Like Challenge",
            description:
                "Like 5 posts today.",
            target: 5
        },

        {
            id: "comment",
            title: "Comment Challenge",
            description:
                "Leave 3 comments today.",
            target: 3
        },

        {
            id: "follow",
            title: "Follow Challenge",
            description:
                "Follow 2 new accounts today.",
            target: 2
        },

        {
            id: "explore",
            title: "Explore Challenge",
            description:
                "Explore 10 posts today.",
            target: 10
        },

        {
            id: "repost",
            title: "Repost Challenge",
            description:
                "Repost 2 posts today.",
            target: 2
        },

        {
            id: "story",
            title: "Story Challenge",
            description:
                "Share a story today.",
            target: 1
        },

        {
            id: "message",
            title: "Message Challenge",
            description:
                "Send a message to a friend.",
            target: 1
        },

        {
            id: "profile",
            title: "Profile Challenge",
            description:
                "Update your profile today.",
            target: 1
        },

        {
            id: "save",
            title: "Save Challenge",
            description:
                "Save 3 posts today.",
            target: 3
        }

    ];


    /* =====================================================
       STATE
    ===================================================== */

    let wheelState = {

        date:
            getTodayKey(),

        spins: 0,

        spinning: false,

        result: null,

        challenge: null

    };


    /* =====================================================
       DATE
    ===================================================== */

    function getTodayKey() {

        const now =
            new Date();

        return [

            now.getFullYear(),

            String(
                now.getMonth() + 1
            ).padStart(2, "0"),

            String(
                now.getDate()
            ).padStart(2, "0")

        ].join("-");
    }


    /* =====================================================
       STORAGE
    ===================================================== */

    function loadState() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!saved) {
                return;
            }


            const parsed =
                JSON.parse(saved);


            if (
                !parsed ||
                typeof parsed !== "object"
            ) {
                return;
            }


            if (
                parsed.date !==
                getTodayKey()
            ) {

                wheelState = {

                    date:
                        getTodayKey(),

                    spins: 0,

                    spinning: false,

                    result: null,

                    challenge: null

                };

                saveState();

                return;
            }


            wheelState.spins =
                Number(
                    parsed.spins
                ) || 0;


            wheelState.result =
                parsed.result ||
                null;


            wheelState.challenge =
                parsed.challenge ||
                null;


        } catch {

            console.warn(
                "ΛRS Wheel: could not load state."
            );
        }
    }


    function saveState() {

        try {

            localStorage.setItem(

                STORAGE_KEY,

                JSON.stringify({

                    date:
                        wheelState.date,

                    spins:
                        wheelState.spins,

                    result:
                        wheelState.result,

                    challenge:
                        wheelState.challenge

                })

            );

        } catch {

            console.warn(
                "ΛRS Wheel: could not save state."
            );
        }
    }


    /* =====================================================
       REWARD STORAGE
    ===================================================== */

    function getRewards() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    REWARD_KEY
                ) || "{}"
            );

        } catch {

            return {};
        }
    }


    function saveRewards(data) {

        localStorage.setItem(

            REWARD_KEY,

            JSON.stringify(data)

        );
    }


    /* =====================================================
       APPLY REWARD
    ===================================================== */

    function applyReward(reward) {

        const data =
            getRewards();

        const now =
            Date.now();


        if (
            reward.id ===
            "streak1"
        ) {

            data.streakBonus =
                Number(
                    data.streakBonus
                ) || 0;

            data.streakBonus += 1;
        }


        if (
            reward.id ===
            "streak2"
        ) {

            data.streakBonus =
                Number(
                    data.streakBonus
                ) || 0;

            data.streakBonus += 2;
        }


        if (
            reward.id ===
            "avatar"
        ) {

            data.freeAvatarUntil =
                now +
                (
                    24 *
                    60 *
                    60 *
                    1000
                );
        }


        if (
            reward.id ===
            "vip"
        ) {

            data.vipUntil =
                now +
                (
                    24 *
                    60 *
                    60 *
                    1000
                );
        }


        if (
            reward.id ===
            "theme"
        ) {

            data.favoriteThemeUntil =
                now +
                (
                    60 *
                    60 *
                    1000
                );
        }


        data.lastReward = {

            id:
                reward.id,

            title:
                reward.title,

            description:
                reward.description,

            receivedAt:
                now

        };


        saveRewards(
            data
        );


        /* FREE AVATAR */

        if (
            reward.id ===
            "avatar"
        ) {

            const demoAvatar =
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85";


            localStorage.setItem(
                "ars_avatar",
                demoAvatar
            );


            localStorage.setItem(

                "ars_avatar_expires",

                String(
                    data.freeAvatarUntil
                )
            );


            window.dispatchEvent(
                new CustomEvent(
                    "ars:avatar-updated"
                )
            );
        }


        /* NOTIFY */

        window.dispatchEvent(

            new CustomEvent(
                "ars:reward",
                {
                    detail: reward
                }
            )
        );
    }


    /* =====================================================
       CHALLENGE
    ===================================================== */

    function startChallenge(challenge) {

        wheelState.challenge = {

            id:
                challenge.id,

            title:
                challenge.title,

            description:
                challenge.description,

            target:
                challenge.target,

            progress: 0,

            completed: false,

            startedAt:
                Date.now()

        };


        saveState();


        window.dispatchEvent(

            new CustomEvent(

                "ars:challenge-start",

                {
                    detail:
                        wheelState.challenge
                }

            )

        );
    }


    function updateChallenge(action) {

        const challenge =
            wheelState.challenge;


        if (
            !challenge ||
            challenge.completed
        ) {
            return;
        }


        if (
            challenge.id !==
            action
        ) {
            return;
        }


        challenge.progress += 1;


        if (
            challenge.progress >=
            challenge.target
        ) {

            challenge.progress =
                challenge.target;

            challenge.completed =
                true;


            completeChallenge();
        }


        saveState();


        window.dispatchEvent(

            new CustomEvent(
                "ars:challenge-progress",
                {
                    detail:
                        challenge
                }
            )
        );
    }


    function completeChallenge() {

        const data =
            getRewards();


        data.streakBonus =
            Number(
                data.streakBonus
            ) || 0;


        data.streakBonus += 1;


        data.lastChallengeCompleted =
            Date.now();


        saveRewards(
            data
        );


        window.dispatchEvent(

            new CustomEvent(

                "ars:challenge-completed",

                {
                    detail:
                        wheelState.challenge
                }

            )
        );


        showToast(
            "Challenge completed! +1 Streak 🔥"
        );
    }


    /* =====================================================
       ACTIVITY LISTENER
    ===================================================== */

    window.addEventListener(

        "ars:activity",

        event => {

            const action =
                event.detail?.action;


            if (!action) {
                return;
            }


            updateChallenge(
                action
            );

        }

    );


    /* =====================================================
       UTILITIES
    ===================================================== */

    function randomItem(array) {

        return array[
            Math.floor(
                Math.random() *
                array.length
            )
        ];
    }


    function getRemainingSpins() {

        return Math.max(

            0,

            MAX_SPINS_PER_DAY -
            wheelState.spins

        );
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       STYLES
    ===================================================== */

    function injectStyles() {

        if (
            document.getElementById(
                "arsWheelStyles"
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "arsWheelStyles";


        style.textContent = `

            /* =========================
               WHEEL BUTTON
            ========================= */

            .ars-wheel-launcher {

                position: fixed;

                left: 18px;

                bottom: 88px;

                width: 54px;

                height: 54px;

                border: 0;

                border-radius: 50%;

                display: flex;

                align-items: center;

                justify-content: center;

                background:
                    linear-gradient(
                        135deg,
                        #8B3DFF,
                        #EC4899
                    );

                color: white;

                font-size: 23px;

                cursor: pointer;

                z-index: 9990;

                box-shadow:
                    0 12px 35px
                    rgba(139,61,255,.4);

                transition:
                    transform .2s ease;

            }


            .ars-wheel-launcher:hover {

                transform:
                    scale(1.08);

            }


            /* =========================
               OVERLAY
            ========================= */

            .ars-wheel-overlay {

                position: fixed;

                inset: 0;

                display: flex;

                align-items: center;

                justify-content: center;

                padding: 18px;

                background:
                    rgba(0,0,0,.78);

                backdrop-filter:
                    blur(18px);

                -webkit-backdrop-filter:
                    blur(18px);

                opacity: 0;

                pointer-events: none;

                visibility: hidden;

                transition:
                    opacity .25s ease;

                z-index: 99999;

            }


            .ars-wheel-overlay.active {

                opacity: 1;

                pointer-events: auto;

                visibility: visible;

            }


            /* =========================
               PANEL
            ========================= */

            .ars-wheel-panel {

                width: min(
                    100%,
                    450px
                );

                max-height:
                    calc(100vh - 36px);

                overflow-y: auto;

                padding: 22px;

                border-radius: 30px;

                background:
                    linear-gradient(
                        180deg,
                        #16161D,
                        #0C0C10
                    );

                border:
                    1px solid
                    rgba(255,255,255,.08);

                box-shadow:
                    0 30px 100px
                    rgba(0,0,0,.7);

                color: white;

                transform:
                    translateY(20px)
                    scale(.96);

                transition:
                    transform .25s ease;

            }


            .ars-wheel-overlay.active
            .ars-wheel-panel {

                transform:
                    translateY(0)
                    scale(1);

            }


            /* =========================
               HEADER
            ========================= */

            .ars-wheel-header {

                display: flex;

                align-items: center;

                justify-content:
                    space-between;

                margin-bottom: 5px;

            }


            .ars-wheel-title {

                font-size: 24px;

                font-weight: 800;

            }


            .ars-wheel-close {

                width: 40px;

                height: 40px;

                border: 0;

                border-radius: 50%;

                color: white;

                background:
                    rgba(255,255,255,.07);

                font-size: 23px;

                cursor: pointer;

            }


            .ars-wheel-subtitle {

                margin:
                    0 0 20px;

                color:
                    #92929D;

                font-size:
                    13px;

            }


            /* =========================
               WHEEL
            ========================= */

            .ars-wheel-stage {

                position: relative;

                width:
                    min(
                        315px,
                        78vw
                    );

                aspect-ratio: 1;

                margin:
                    0 auto 20px;

            }


            .ars-wheel-pointer {

                position: absolute;

                top: -3px;

                left: 50%;

                transform:
                    translateX(-50%);

                width: 0;

                height: 0;

                border-left:
                    13px solid transparent;

                border-right:
                    13px solid transparent;

                border-top:
                    28px solid white;

                z-index: 5;

                filter:
                    drop-shadow(
                        0 4px 10px
                        rgba(0,0,0,.6)
                    );

            }


            .ars-wheel {

                position: relative;

                width: 100%;

                height: 100%;

                border-radius: 50%;

                border:
                    8px solid #292932;

                background:
                    conic-gradient(

                        #8B3DFF 0deg 45deg,

                        #25252D 45deg 90deg,

                        #C54DFF 90deg 135deg,

                        #25252D 135deg 180deg,

                        #8B3DFF 180deg 225deg,

                        #25252D 225deg 270deg,

                        #C54DFF 270deg 315deg,

                        #25252D 315deg 360deg

                    );

                box-shadow:
                    0 0 50px
                    rgba(139,61,255,.3);

                transition:
                    transform
                    4s
                    cubic-bezier(
                        .12,
                        .82,
                        .18,
                        1
                    );

            }


            .ars-wheel-center {

                position: absolute;

                left: 50%;

                top: 50%;

                transform:
                    translate(-50%,-50%);

               
