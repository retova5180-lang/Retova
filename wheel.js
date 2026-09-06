(() => {
    "use strict";

    const MAX_SPINS = 2;

    const KEYS = {
        date: "ars_wheel_date",
        spins: "ars_wheel_spins",
        streak: "ars_streak",
        streakDate: "ars_streak_date",
        challenge: "ars_active_challenge",
        rewards: "ars_temp_rewards",
        freeAvatar: "ars_free_avatar_until",
        vip: "ars_temp_vip_until",
        theme: "ars_favorite_theme_until"
    };


    const REWARDS = [
        {
            type: "streak",
            amount: 1,
            title: "+1 Streak",
            icon: "🔥"
        },

        {
            type: "streak",
            amount: 2,
            title: "+2 Streak",
            icon: "🔥"
        },

        {
            type: "avatar",
            title: "Free Avatar",
            icon: "🖼️",
            duration: 24 * 60 * 60 * 1000
        },

        {
            type: "vip",
            title: "VIP Badge",
            icon: "💎",
            duration: 24 * 60 * 60 * 1000
        },

        {
            type: "theme",
            title: "Favorite Theme",
            icon: "🎀",
            duration: 60 * 60 * 1000
        }
    ];


    const CHALLENGES = [
        {
            type: "post",
            title: "Create a post",
            icon: "📝"
        },

        {
            type: "like",
            title: "Like a post",
            icon: "❤️"
        },

        {
            type: "comment",
            title: "Reply to a post",
            icon: "💬"
        },

        {
            type: "follow",
            title: "Follow someone",
            icon: "👤"
        },

        {
            type: "explore",
            title: "Explore ΛRS",
            icon: "🔥"
        },

        {
            type: "repost",
            title: "Repost a post",
            icon: "🔁"
        },

        {
            type: "story",
            title: "Create a story",
            icon: "📸"
        },

        {
            type: "message",
            title: "Send a message",
            icon: "✉️"
        },

        {
            type: "profile",
            title: "Open your profile",
            icon: "👤"
        },

        {
            type: "save",
            title: "Save a post",
            icon: "🔖"
        }
    ];


    const WHEEL_ITEMS = [
        REWARDS[0],
        CHALLENGES[0],
        REWARDS[1],
        CHALLENGES[1],
        REWARDS[2],
        CHALLENGES[2],
        REWARDS[3],
        CHALLENGES[3],
        REWARDS[4],
        CHALLENGES[4]
    ];


    const state = {
        modal: null,
        wheel: null,
        spinning: false,
        rotation: 0,
        selectedItem: null
    };


    function todayKey() {

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


    function getSpins() {

        resetWheelIfNeeded();

        return Number(
            localStorage.getItem(
                KEYS.spins
            ) || 0
        );
    }


    function resetWheelIfNeeded() {

        const today =
            todayKey();

        const saved =
            localStorage.getItem(
                KEYS.date
            );

        if (saved !== today) {

            localStorage.setItem(
                KEYS.date,
                today
            );

            localStorage.setItem(
                KEYS.spins,
                "0"
            );
        }
    }


    function getStreak() {

        const value =
            Number(
                localStorage.getItem(
                    KEYS.streak
                ) || 1
            );

        return Number.isFinite(value) &&
            value > 0
            ? value
            : 1;
    }


    function setStreak(value) {

        const safe =
            Math.max(
                1,
                Number(value) || 1
            );

        localStorage.setItem(
            KEYS.streak,
            String(safe)
        );

        updateStreakUI();
    }


    function maintainDailyStreak() {

        const today =
            todayKey();

        const last =
            localStorage.getItem(
                KEYS.streakDate
            );

        if (!last) {

            localStorage.setItem(
                KEYS.streakDate,
                today
            );

            if (
                !localStorage.getItem(
                    KEYS.streak
                )
            ) {
                setStreak(1);
            }

            return;
        }

        if (last === today) {
            updateStreakUI();
            return;
        }

        const previous =
            new Date(
                `${last}T00:00:00`
            );

        const current =
            new Date(
                `${today}T00:00:00`
            );

        const difference =
            Math.round(
                (
                    current -
                    previous
                ) /
                86400000
            );

        if (difference === 1) {

            setStreak(
                getStreak() + 1
            );

        } else if (difference > 1) {

            setStreak(1);
        }

        localStorage.setItem(
            KEYS.streakDate,
            today
        );

        updateStreakUI();
    }


    function updateStreakUI() {

        const element =
            document.getElementById(
                "streakCount"
            );

        if (!element) return;

        const count =
            getStreak();

        element.textContent =
            `${count} ${
                count === 1
                    ? "day"
                    : "days"
            }`;
    }


    function cleanExpiredRewards() {

        const now =
            Date.now();

        let changed = false;

        [
            KEYS.freeAvatar,
            KEYS.vip,
            KEYS.theme
        ].forEach(key => {

            const value =
                Number(
                    localStorage.getItem(
                        key
                    ) || 0
                );

            if (
                value &&
                value <= now
            ) {
                localStorage.removeItem(
                    key
                );

                changed = true;
            }
        });


        let rewards = [];

        try {
            rewards =
                JSON.parse(
                    localStorage.getItem(
                        KEYS.rewards
                    ) || "[]"
                );
        } catch {
            rewards = [];
        }

        if (!Array.isArray(rewards)) {
            rewards = [];
        }

        const filtered =
            rewards.filter(
                reward =>
                    Number(
                        reward.expiresAt || 0
                    ) > now
            );

        if (
            filtered.length !==
            rewards.length
        ) {
            localStorage.setItem(
                KEYS.rewards,
                JSON.stringify(
                    filtered
                )
            );

            changed = true;
        }

        applyTemporaryRewardsToPage();

        return changed;
    }


    function applyTemporaryRewardsToPage() {

        const now =
            Date.now();

        const body =
            document.body;

        if (!body) return;


        const avatar =
            document.getElementById(
                "myAvatar"
            );


        const freeAvatarUntil =
            Number(
                localStorage.getItem(
                    KEYS.freeAvatar
                ) || 0
            );


        const vipUntil =
            Number(
                localStorage.getItem(
                    KEYS.vip
                ) || 0
            );


        const themeUntil =
            Number(
                localStorage.getItem(
                    KEYS.theme
                ) || 0
            );


        body.classList.toggle(
            "ars-favorite-theme",
            themeUntil > now
        );


        if (avatar) {

            avatar.classList.toggle(
                "ars-vip-avatar",
                vipUntil > now
            );


            avatar.dataset.freeAvatar =
                freeAvatarUntil > now
                    ? "true"
                    : "false";
        }
    }


    function getActiveChallenge() {

        try {

            const challenge =
                JSON.parse(
                    localStorage.getItem(
                        KEYS.challenge
                    ) || "null"
                );

            if (!challenge) {
                return null;
            }

            if (
                Number(
                    challenge.expiresAt
                ) <= Date.now()
            ) {
                localStorage.removeItem(
                    KEYS.challenge
                );

                return null;
            }

            return challenge;

        } catch {
            return null;
        }
    }


    function setActiveChallenge(
        challenge
    ) {

        localStorage.setItem(
            KEYS.challenge,
            JSON.stringify(
                challenge
            )
        );
    }


    function completeChallenge(
        type
    ) {

        const challenge =
            getActiveChallenge();

        if (
            !challenge ||
            challenge.type !== type
        ) {
            return false;
        }

        localStorage.removeItem(
            KEYS.challenge
        );

        setStreak(
            getStreak() + 1
        );

        updateWheelUI();

        showToast(
            "Challenge completed! +1 Streak 🔥"
        );

        return true;
    }


    function grantReward(
        reward
    ) {

        const now =
            Date.now();


        if (
            reward.type ===
            "streak"
        ) {

            setStreak(
                getStreak() +
                Number(
                    reward.amount || 1
                )
            );

            return;
        }


        if (
            reward.type ===
            "avatar"
        ) {

            const until =
                now +
                reward.duration;

            localStorage.setItem(
                KEYS.freeAvatar,
                String(until)
            );

            addTemporaryReward(
                reward.title,
                until
            );

            return;
        }


        if (
            reward.type ===
            "vip"
        ) {

            const until =
                now +
                reward.duration;

            localStorage.setItem(
                KEYS.vip,
                String(until)
            );

            addTemporaryReward(
                reward.title,
                until
            );

            return;
        }


        if (
            reward.type ===
            "theme"
        ) {

            const until =
                now +
                reward.duration;

            localStorage.setItem(
                KEYS.theme,
                String(until)
            );

            addTemporaryReward(
                reward.title,
                until
            );
        }
    }


    function addTemporaryReward(
        title,
        expiresAt
    ) {

        let rewards = [];

        try {
            rewards =
                JSON.parse(
                    localStorage.getItem(
                        KEYS.rewards
                    ) || "[]"
                );
        } catch {
            rewards = [];
        }

        if (!Array.isArray(rewards)) {
            rewards = [];
        }

        rewards.push({
            title,
            expiresAt
        });

        localStorage.setItem(
            KEYS.rewards,
            JSON.stringify(
                rewards
            )
        );

        applyTemporaryRewardsToPage();
    }


    function createWheelUI() {

        if (
            document.getElementById(
                "arsWheelModal"
            )
        ) {
            connectWheelElements();
            updateWheelUI();
            return;
        }


        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "arsWheelModal";

        modal.className =
            "ars-wheel-modal";


        modal.innerHTML = `
            <div class="ars-wheel-backdrop"></div>

            <div class="ars-wheel-panel">

                <button
                    class="ars-wheel-close"
                    id="arsWheelClose"
                    type="button"
                >
                    ×
                </button>

                <div class="ars-wheel-title">
                    <span>ΛRS</span>
                    Wheel
                </div>

                <div class="ars-wheel-subtitle">
                    Spin. Win. Complete. Repeat.
                </div>


                <div class="ars-wheel-stats">

                    <div>
                        <strong id="arsWheelSpins">
                            2
                        </strong>
                        <span>Spins left</span>
                    </div>

                    <div>
                        <strong id="arsWheelStreak">
                            1
                        </strong>
                        <span>Streak</span>
                    </div>

                </div>


                <div class="ars-wheel-stage">

                    <div class="ars-wheel-pointer">
                        ▼
                    </div>

                    <div
                        class="ars-wheel"
                        id="arsWheel"
                    ></div>

                    <div class="ars-wheel-center">
                        ΛRS
                    </div>

                </div>


                <div
                    class="ars-wheel-result"
                    id="arsWheelResult"
                >

                    <div
                        class="ars-wheel-result-icon"
                        id="arsWheelResultIcon"
                    >
                        ✨
                    </div>

                    <strong
                        id="arsWheelResultTitle"
                    >
                        Ready?
                    </strong>

                    <span
                        id="arsWheelResultText"
                    >
                        Spin the wheel.
                    </span>

                </div>


                <div
                    class="ars-wheel-challenge"
                    id="arsWheelChallenge"
                >

                    <div
                        class="ars-wheel-challenge-icon"
                        id="arsChallengeIcon"
                    >
                        🎯
                    </div>

                    <div>
                        <strong>
                            Challenge
                        </strong>

                        <span
                            id="arsChallengeText"
                        >
                            Complete the challenge
                        </span>
                    </div>

                </div>


                <button
                    class="ars-wheel-spin"
                    id="arsWheelSpin"
                    type="button"
                >
                    SPIN
                </button>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        buildWheel();

        connectWheelElements();

        updateWheelUI();
    }


    function buildWheel() {

        const wheel =
            document.getElementById(
                "arsWheel"
            );

        if (!wheel) return;

        const colors = [
            "#8b3dff",
            "#c84dff",
            "#ff4fb3",
            "#713cff",
            "#9c54ff",
            "#ff5d9d",
            "#6331d8",
            "#ad46e9",
            "#ff3e9f",
            "#7c3aed"
        ];


        const count =
            WHEEL_ITEMS.length;

        const angle =
            360 / count;


        wheel.innerHTML =
            WHEEL_ITEMS
                .map(
                    (item, index) => {

                        const rotate =
                            index *
                            angle;

                        const color =
                            colors[index];

                        return `
                            <div
                                class="ars-wheel-segment"
                                style="
                                    --i:${index};
                                    --segment-angle:${angle}deg;
                                    --segment-color:${color};
                                    transform:
                                        rotate(${rotate}deg);
                                "
                            >
                                <span>
                                    ${
                                        item.icon
                                    }
                                    <small>
                                        ${
                                            item.title
                                        }
                                    </small>
                                </span>
                            </div>
                        `;
                    }
                )
                .join("");
    }


    function connectWheelElements() {

        state.modal =
            document.getElementById(
                "arsWheelModal"
            );

        state.wheel =
            document.getElementById(
                "arsWheel"
            );

        document
            .getElementById(
                "arsWheelClose"
            )
            ?.addEventListener(
                "click",
                closeWheel
            );


        state.modal
            ?.querySelector(
                ".ars-wheel-backdrop"
            )
            ?.addEventListener(
                "click",
                closeWheel
            );


        document
            .getElementById(
                "arsWheelSpin"
            )
            ?.addEventListener(
                "click",
                spin
            );
    }


    function updateWheelUI() {

        cleanExpiredRewards();

        const spins =
            getSpins();

        const active =
            getActiveChallenge();

        const spinElement =
            document.getElementById(
                "arsWheelSpins"
            );

        const streakElement =
            document.getElementById(
                "arsWheelStreak"
            );

        const spinButton =
            document.getElementById(
                "arsWheelSpin"
            );

        const challengeBox =
            document.getElementById(
                "arsWheelChallenge"
            );

        const challengeText =
            document.getElementById(
                "arsChallengeText"
            );

        const challengeIcon =
            document.getElementById(
                "arsChallengeIcon"
            );


        if (spinElement) {
            spinElement.textContent =
                Math.max(
                    0,
                    MAX_SPINS - spins
                );
        }


        if (streakElement) {
            streakElement.textContent =
                getStreak();
        }


        if (spinButton) {

            spinButton.disabled =
                state.spinning ||
                spins >= MAX_SPINS ||
                Boolean(active);

            spinButton.textContent =
                state.spinning
                    ?
