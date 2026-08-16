/* =========================================================
   ΛRS — DAILY WHEEL
   Complete standalone wheel system
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const STORAGE_KEY =
        "ars_daily_wheel_state";

    const MAX_SPINS_PER_DAY = 2;


    /* =====================================================
       REWARDS
    ===================================================== */

    const rewards = [

        {
            id: "streak",
            title: "Streak Bonus",
            description: "+1 Streak",
            type: "reward"
        },

        {
            id: "avatar",
            title: "Free Avatar",
            description: "Free avatar for 1 day",
            type: "reward"
        },

        {
            id: "vip",
            title: "VIP Badge",
            description: "VIP Badge for 1 day",
            type: "reward"
        },

        {
            id: "theme",
            title: "Favorite Theme",
            description: "Use your favorite theme for 1 hour",
            type: "reward"
        },

        {
            id: "streak2",
            title: "Streak Bonus",
            description: "+2 Streak",
            type: "reward"
        },

        {
            id: "avatar2",
            title: "Free Avatar",
            description: "Free avatar for 1 day",
            type: "reward"
        },

        {
            id: "vip2",
            title: "VIP Badge",
            description: "VIP Badge for 1 day",
            type: "reward"
        },

        {
            id: "theme2",
            title: "Favorite Theme",
            description: "Use your favorite theme for 1 hour",
            type: "reward"
        }

    ];


    /* =====================================================
       CHALLENGES
    ===================================================== */

    const challenges = [

        {
            id: "post",
            title: "Post Challenge",
            description: "Create a post today.",
            type: "challenge"
        },

        {
            id: "like",
            title: "Like Challenge",
            description: "Like 5 posts today.",
            type: "challenge"
        },

        {
            id: "comment",
            title: "Comment Challenge",
            description: "Leave 3 comments today.",
            type: "challenge"
        },

        {
            id: "follow",
            title: "Follow Challenge",
            description: "Follow 2 new accounts today.",
            type: "challenge"
        },

        {
            id: "explore",
            title: "Explore Challenge",
            description: "Explore 10 posts today.",
            type: "challenge"
        },

        {
            id: "repost",
            title: "Repost Challenge",
            description: "Repost 2 posts today.",
            type: "challenge"
        },

        {
            id: "story",
            title: "Story Challenge",
            description: "Share a story today.",
            type: "challenge"
        },

        {
            id: "message",
            title: "Message Challenge",
            description: "Send a message to a friend.",
            type: "challenge"
        },

        {
            id: "profile",
            title: "Profile Challenge",
            description: "Update your profile today.",
            type: "challenge"
        },

        {
            id: "streak",
            title: "Streak Challenge",
            description: "Keep your streak alive today.",
            type: "challenge"
        },

        {
            id: "discover",
            title: "Discovery Challenge",
            description: "Visit 3 new profiles.",
            type: "challenge"
        },

        {
            id: "save",
            title: "Save Challenge",
            description: "Save 3 posts today.",
            type: "challenge"
        }

    ];


    /* =====================================================
       STATE
    ===================================================== */

    let wheelState = {

        date: getTodayKey(),

        spins: 0,

        spinning: false,

        lastResult: null

    };


    /* =====================================================
       HELPERS
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


    function loadState() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!saved) return;

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

                    date: getTodayKey(),

                    spins: 0,

                    spinning: false,

                    lastResult: null

                };

                saveState();

                return;

            }


            wheelState.spins =
                Number(
                    parsed.spins
                ) || 0;

            wheelState.lastResult =
                parsed.lastResult ||
                null;

        } catch (error) {

            console.warn(
                "ΛRS Wheel: storage could not be loaded.",
                error
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

                    lastResult:
                        wheelState.lastResult

                })

            );

        } catch (error) {

            console.warn(
                "ΛRS Wheel: storage could not be saved.",
                error
            );

        }

    }


    function getRemainingSpins() {

        return Math.max(

            0,

            MAX_SPINS_PER_DAY -
            wheelState.spins

        );

    }


    function randomItem(array) {

        return array[
            Math.floor(
                Math.random() *
                array.length
            )
        ];

    }


    function escapeHTML(value) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* =====================================================
       REWARD STORAGE
    ===================================================== */

    function getUserRewards() {

        try {

            return JSON.parse(

                localStorage.getItem(
                    "ars_user_rewards"
                )

            ) || {};

        } catch {

            return {};

        }

    }


    function saveUserRewards(data) {

        try {

            localStorage.setItem(

                "ars_user_rewards",

                JSON.stringify(data)

            );

        } catch (error) {

            console.warn(
                "ΛRS Wheel: rewards could not be saved.",
                error
            );

        }

    }


    function applyReward(reward) {

        const data =
            getUserRewards();


        const now =
            Date.now();


        if (
            reward.id === "streak" ||
            reward.id === "streak2"
        ) {

            const amount =
                reward.id === "streak2"
                    ? 2
                    : 1;

            data.streakBonus =
                Number(
                    data.streakBonus
                ) || 0;

            data.streakBonus +=
                amount;

        }


        if (
            reward.id === "avatar" ||
            reward.id === "avatar2"
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
            reward.id === "vip" ||
            reward.id === "vip2"
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
            reward.id === "theme" ||
            reward.id === "theme2"
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


        saveUserRewards(
            data
        );


        /*
         * Optional integration:
         * If the profile system exposes a refresh
         * function, update it automatically.
         */

        if (
            typeof window.refreshProfileRewards ===
            "function"
        ) {

            window.refreshProfileRewards();

        }

    }


    /* =====================================================
       CSS
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

            .ars-wheel-overlay {

                position:fixed;

                inset:0;

                background:
                    rgba(0,0,0,.72);

                backdrop-filter:
                    blur(18px);

                -webkit-backdrop-filter:
                    blur(18px);

                display:flex;

                align-items:center;

                justify-content:center;

                padding:20px;

                opacity:0;

                pointer-events:none;

                transition:.25s ease;

                z-index:99999;

            }


            .ars-wheel-overlay.active {

                opacity:1;

                pointer-events:auto;

            }


            .ars-wheel-panel {

                width:100%;

                max-width:460px;

                max-height:
                    calc(100vh - 40px);

                overflow-y:auto;

                background:
                    linear-gradient(
                        180deg,
                        #15151A,
                        #0D0D10
                    );

                border:
                    1px solid
                    rgba(255,255,255,.08);

                border-radius:32px;

                padding:22px;

                box-shadow:
                    0 30px 90px
                    rgba(0,0,0,.65);

                color:white;

                transform:
                    translateY(20px)
                    scale(.96);

                transition:.25s ease;

            }


            .ars-wheel-overlay.active
            .ars-wheel-panel {

                transform:
                    translateY(0)
                    scale(1);

            }


            .ars-wheel-header {

                display:flex;

                align-items:center;

                justify-content:space-between;

                margin-bottom:18px;

            }


            .ars-wheel-title {

                font-size:24px;

                font-weight:800;

            }


            .ars-wheel-close {

                width:42px;

                height:42px;

                border:0;

                border-radius:50%;

                background:
                    rgba(255,255,255,.07);

                color:white;

                font-size:25px;

                cursor:pointer;

            }


            .ars-wheel-subtitle {

                color:#92929D;

                font-size:14px;

                margin-top:-8px;

                margin-bottom:20px;

            }


            .ars-wheel-stage {

                width:min(
                    320px,
                    78vw
                );

                aspect-ratio:1;

                margin:0 auto 22px;

                position:relative;

            }


            .ars-wheel-pointer {

                position:absolute;

                top:-5px;

                left:50%;

                transform:
                    translateX(-50%);

                width:0;

                height:0;

                border-left:
                    14px solid transparent;

                border-right:
                    14px solid transparent;

                border-top:
                    28px solid
                    #FFFFFF;

                z-index:5;

                filter:
                    drop-shadow(
                        0 4px 10px
                        rgba(0,0,0,.5)
                    );

            }


            .ars-wheel {

                width:100%;

                height:100%;

                border-radius:50%;

                border:
                    8px solid
                    #26262E;

                position:relative;

                overflow:hidden;

                background:
                    conic-gradient(
                        #8B3DFF 0deg 30deg,
                        #24242B 30deg 60deg,
                        #C54DFF 60deg 90deg,
                        #24242B 90deg 120deg,
                        #8B3DFF 120deg 150deg,
                        #24242B 150deg 180deg,
                        #C54DFF 180deg 210deg,
                        #24242B 210deg 240deg,
                        #8B3DFF 240deg 270deg,
                        #24242B 270deg 300deg,
                        #C54DFF 300deg 330deg,
                        #24242B 330deg 360deg
                    );

                box-shadow:
                    0 0 45px
                    rgba(139,61,255,.25);

                transition:
                    transform
                    4s cubic-bezier(
                        .12,
                        .82,
                        .18,
                        1
                    );

            }


            .ars-wheel-center {

                position:absolute;

                inset:50% auto auto 50%;

                transform:
                    translate(-50%,-50%);

                width:82px;

                height:82px;

                border-radius:50%;

                border:
                    5px solid
                    #09090B;

                background:
                    linear-gradient(
                        135deg,
                        #8B3DFF,
                        #C54DFF
                    );

                display:flex;

                align-items:center;

                justify-content:center;

                font-size:16px;

                font-weight:900;

                box-shadow:
                    0 0 25px
                    rgba(139,61,255,.5);

                z-index:3;

            }


            .ars-wheel-info {

                display:flex;

                justify-content:center;

                gap:8px;

                margin-bottom:18px;

            }


            .ars-wheel-spins {

                padding:8px 14px;

                border-radius:999px;

                background:
                    rgba(
                        139,
                        61,
                        255,
                        .13
                    );

                color:#CDA8FF;

                font-size:13px;

                font-weight:700;

            }


            .ars-wheel-spin-button {

                width:100%;

                min-height:54px;

                border:0;

                border-radius:18px;

                background:
                    linear-gradient(
                        135deg,
                        #8B3DFF,
                        #C54DFF
                    );

                color:white;

                font-size:17px;

                font-weight:800;

                cursor:pointer;

                box-shadow:
                    0 12px 30px
                    rgba(139,61,255,.28);

                transition:.2s ease;

            }


            .ars-wheel-spin-button:active {

                transform:scale(.98);

            }


            .ars-wheel-spin-button:disabled {

                opacity:.45;

                cursor:not-allowed;

                box-shadow:none;

            }


            .ars-wheel-result {

                display:none;

                margin-top:18px;

                padding:20px;

                border-radius:22px;

                background:
                    rgba(255,255,255,.045);

                border:
                    1px solid
                    rgba(255,255,255,.07);

                text-align:center;

            }


            .ars-wheel-result.show {

                display:block;

                animation:
                    arsResultIn
                    .35s ease;

            }


            @keyframes arsResultIn {

                from {

                    opacity:0;

                    transform:
                        translateY(10px)
                        scale(.97);

                }

                to {

                    opacity:1;

                    transform:
                        translateY(0)
                        scale(1);

                }

            }


            .ars-wheel-result-type {

                font-size:12px;

                text-transform:uppercase;

                letter-spacing:1.5px;

                color:#A78BFA;

                font-weight:800;

                margin-bottom:8px;

            }


            .ars-wheel-result-title {

                font-size:22px;

                font-weight:800;

                margin-bottom:8px;

            }


            .ars-wheel-result-description {

                color:#B7B7C1;

                font-size:14px;

                line-height:1.6;

            }


            .ars-wheel-exit {

                width:100%;

                margin-top:16px;

                min-height:48px;

                border:0;

                border-radius:16px;

                background:
                    rgba(255,255,255,.08);

                color:white;

                font-size:15px;

                font-weight:700;

                cursor:pointer;

            }


            .ars-wheel-empty {

                text-align:center;

                padding:14px 0 4px;

                color:#8F8F99;

                font-size:13px;

            }

        `;


        document.head.appendChild(
            style
        );

         /* =====================================================
           WHEEL UI
        ===================================================== */

        function createWheelUI() {

            if (
                document.getElementById(
                    "arsWheelOverlay"
                )
            ) {
                return;
            }

            const overlay =
                document.createElement("div");

            overlay.id =
                "arsWheelOverlay";

            overlay.className =
                "ars-wheel-overlay";

            overlay.innerHTML = `

                <div class="ars-wheel-panel">

                    <div class="ars-wheel-header">

                        <div class="ars-wheel-title">
                            Daily Wheel
                        </div>

                        <button
                            class="ars-wheel-close"
                            id="arsWheelClose"
                            type="button"
                            aria-label="Close"
                        >
                            ×
                        </button>

                    </div>


                    <div class="ars-wheel-subtitle">
                        Spin twice every day for a random reward or challenge.
                    </div>


                    <div class="ars-wheel-stage">

                        <div class="ars-wheel-pointer"></div>

                        <div
                            class="ars-wheel"
                            id="arsWheel"
                        >

                            <div class="ars-wheel-center">
                                ΛRS
                            </div>

                        </div>

                    </div>


                    <div class="ars-wheel-info">

                        <div
                            class="ars-wheel-spins"
                            id="arsWheelSpins"
                        >
                            2 spins left
                        </div>

                    </div>


                    <button
                        class="ars-wheel-spin-button"
                        id="arsWheelSpin"
                        type="button"
                    >
                        Spin
                    </button>


                    <div
                        class="ars-wheel-result"
                        id="arsWheelResult"
                    >

                        <div
                            class="ars-wheel-result-type"
                            id="arsWheelResultType"
                        >
                        </div>

                        <div
                            class="ars-wheel-result-title"
                            id="arsWheelResultTitle"
                        >
                        </div>

                        <div
                            class="ars-wheel-result-description"
                            id="arsWheelResultDescription"
                        >
                        </div>

                        <button
                            class="ars-wheel-exit"
                            id="arsWheelExit"
                            type="button"
                        >
                            Exit
                        </button>

                    </div>

                </div>

            `;

            document.body.appendChild(
                overlay
            );


            setupWheelEvents();

        }


        /* =====================================================
           EVENTS
        ===================================================== */

        function setupWheelEvents() {

            const overlay =
                document.getElementById(
                    "arsWheelOverlay"
                );

            const close =
                document.getElementById(
                    "arsWheelClose"
                );

            const exit =
                document.getElementById(
                    "arsWheelExit"
                );

            const spin =
                document.getElementById(
                    "arsWheelSpin"
                );


            if (!overlay ||
                !close ||
                !exit ||
                !spin) {

                console.error(
                    "ΛRS Wheel: UI elements are missing."
                );

                return;

            }


            close.addEventListener(
                "click",
                closeWheel
            );


            exit.addEventListener(
                "click",
                closeWheel
            );


            spin.addEventListener(
                "click",
                spinWheel
            );


            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {
                        closeWheel();
                    }

                }
            );

        }


        /* =====================================================
           OPEN
        ===================================================== */

        function openWheel() {

            loadState();

            injectStyles();

            createWheelUI();

            const overlay =
                document.getElementById(
                    "arsWheelOverlay"
                );

            if (!overlay) return;


            overlay.classList.add(
                "active"
            );


            updateWheelUI();

        }


        /* =====================================================
           CLOSE
        ===================================================== */

        function closeWheel() {

            const overlay =
                document.getElementById(
                    "arsWheelOverlay"
                );

            if (!overlay) return;


            overlay.classList.remove(
                "active"
            );

        }


        /* =====================================================
           UI UPDATE
        ===================================================== */

        function updateWheelUI() {

            const remaining =
                getRemainingSpins();


            const spins =
                document.getElementById(
                    "arsWheelSpins"
                );

            const button =
                document.getElementById(
                    "arsWheelSpin"
                );


            if (spins) {

                spins.textContent =
                    remaining === 1
                        ? "1 spin left"
                        : `${remaining} spins left`;

            }


            if (button) {

                button.disabled =
                    remaining <= 0 ||
                    wheelState.spinning;

            }

        }


        /* =====================================================
           PICK RESULT
        ===================================================== */

        function pickResult() {

            const allItems =
                rewards.concat(
                    challenges
                );

            return randomItem(
                allItems
            );

        }


        /* =====================================================
           SPIN
        ===================================================== */

        function spinWheel() {

            if (
                wheelState.spinning
            ) {
                return;
            }


            if (
                getRemainingSpins() <= 0
            ) {
                updateWheelUI();
                return;
            }


            const wheel =
                document.getElementById(
                    "arsWheel"
                );


            if (!wheel) {
                return;
            }


            wheelState.spinning =
                true;


            updateWheelUI();


            const result =
                pickResult();


            const rotation =
                1440 +
                Math.floor(
                    Math.random() * 1440
                );


            wheel.style.transform =
                `rotate(${rotation}deg)`;


            setTimeout(
                () => {

                    wheelState.spins += 1;

                    wheelState.lastResult =
                        result;


                    wheelState.spinning =
                        false;


                    saveState();


                    if (
                        result.type ===
                        "reward"
                    ) {

                        applyReward(
                            result
                        );

                    }


                    showResult(
                        result
                    );


                    updateWheelUI();

                },
                4100
            );

        }


        /* =====================================================
           SHOW RESULT
        ===================================================== */

        function showResult(
            result
        ) {

            const resultBox =
                document.getElementById(
                    "arsWheelResult"
                );

            const type =
                document.getElementById(
                    "arsWheelResultType"
                );

            const title =
                document.getElementById(
                    "arsWheelResultTitle"
                );

            const description =
                document.getElementById(
                    "arsWheelResultDescription"
                );


            if (!resultBox ||
                !type ||
                !title ||
                !description) {

                return;

            }


            type.textContent =
                result.type === "reward"
                    ? "Reward"
                    : "Challenge";


            title.textContent =
                result.title;


            description.textContent =
                result.description;


            resultBox.classList.add(
                "show"
            );

        }


        /* =====================================================
           BUTTON CONNECTION
        ===================================================== */

        function connectWheelButton() {

            const button =
                document.getElementById(
                    "wheelButton"
                );


            if (!button) {

                console.warn(
                    "ΛRS Wheel: #wheelButton was not found."
                );

                return;

            }


            if (
                button.dataset.wheelConnected ===
                "true"
            ) {
                return;
            }


            button.dataset.wheelConnected =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    openWheel();

                }
            );

        }


        /* =====================================================
           PUBLIC API
        ===================================================== */

        window.openWheel =
            openWheel;


        window.closeWheel =
            closeWheel;


        window.connectWheelButton =
            connectWheelButton;


        /* =====================================================
           START
        ===================================================== */

        function startWheel() {

            injectStyles();

            connectWheelButton();

        }


        if (
            document.readyState ===
            "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                startWheel
            );

        } else {

            startWheel();

        }


})();
