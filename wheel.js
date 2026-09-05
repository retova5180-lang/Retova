(() => {
    "use strict";

    const STORAGE = {
        date: "ars_wheel_date",
        spins: "ars_wheel_spins",
        streak: "ars_streak",
        streakDate: "ars_streak_date",
        challenge: "ars_active_challenge",
        tempRewards: "ars_temp_rewards",
        freeAvatarUntil: "ars_free_avatar_until",
        vipUntil: "ars_temp_vip_until",
        themeUntil: "ars_favorite_theme_until"
    };

    const MAX_SPINS = 2;
    const CHALLENGE_DURATION = 60 * 60 * 1000;

    const rewards = [
        {
            id: "streak1",
            type: "reward",
            title: "+1 Streak",
            description: "Your streak increased by 1.",
            icon: "🔥"
        },
        {
            id: "streak2",
            type: "reward",
            title: "+2 Streak",
            description: "Your streak increased by 2.",
            icon: "🔥"
        },
        {
            id: "freeAvatar",
            type: "reward",
            title: "Free Avatar",
            description: "Use an image avatar for 1 day.",
            icon: "🖼️"
        },
        {
            id: "vipBadge",
            type: "reward",
            title: "VIP Badge",
            description: "VIP Badge activated for 1 day.",
            icon: "👑"
        },
        {
            id: "favoriteTheme",
            type: "reward",
            title: "Favorite Theme",
            description: "Favorite Theme activated for 1 hour.",
            icon: "✨"
        }
    ];

    const challenges = [
        {
            id: "post",
            type: "challenge",
            action: "post",
            title: "Create a Post",
            description: "Create one post.",
            icon: "📝"
        },
        {
            id: "like",
            type: "challenge",
            action: "like",
            title: "Like a Post",
            description: "Like one post.",
            icon: "❤️"
        },
        {
            id: "comment",
            type: "challenge",
            action: "comment",
            title: "Leave a Comment",
            description: "Comment on one post.",
            icon: "💬"
        },
        {
            id: "follow",
            type: "challenge",
            action: "follow",
            title: "Follow Someone",
            description: "Follow one user.",
            icon: "➕"
        },
        {
            id: "explore",
            type: "challenge",
            action: "explore",
            title: "Explore",
            description: "Explore something new.",
            icon: "🔥"
        },
        {
            id: "repost",
            type: "challenge",
            action: "repost",
            title: "Repost",
            description: "Repost one post.",
            icon: "🔁"
        },
        {
            id: "story",
            type: "challenge",
            action: "story",
            title: "Share a Story",
            description: "Share one story.",
            icon: "⭕"
        },
        {
            id: "message",
            type: "challenge",
            action: "message",
            title: "Send a Message",
            description: "Send one message.",
            icon: "✉️"
        },
        {
            id: "profile",
            type: "challenge",
            action: "profile",
            title: "Open a Profile",
            description: "Open one profile.",
            icon: "👤"
        },
        {
            id: "save",
            type: "challenge",
            action: "save",
            title: "Save a Post",
            description: "Save one post.",
            icon: "🔖"
        }
    ];

    const wheelItems = [
        rewards[0],
        challenges[0],
        rewards[1],
        challenges[1],
        rewards[2],
        challenges[2],
        rewards[3],
        challenges[3],
        rewards[4],
        challenges[4]
    ];

    let wheelModal = null;
    let wheelDisc = null;
    let wheelResult = null;
    let wheelResultTitle = null;
    let wheelResultDescription = null;
    let wheelResultIcon = null;
    let wheelSpinButton = null;
    let wheelSpinsText = null;
    let wheelStreakText = null;
    let wheelStage = null;

    let currentRotation = 0;
    let spinning = false;

    function todayKey() {
        const now = new Date();

        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("-");
    }

    function getSpins() {
        resetDailySpins();

        const value = Number(
            localStorage.getItem(STORAGE.spins)
        );

        if (!Number.isFinite(value)) {
            localStorage.setItem(
                STORAGE.spins,
                String(MAX_SPINS)
            );

            return MAX_SPINS;
        }

        return Math.max(0, Math.min(MAX_SPINS, value));
    }

    function resetDailySpins() {
        const today = todayKey();
        const savedDate = localStorage.getItem(STORAGE.date);

        if (savedDate !== today) {
            localStorage.setItem(
                STORAGE.date,
                today
            );

            localStorage.setItem(
                STORAGE.spins,
                String(MAX_SPINS)
            );
        }
    }

    function useSpin() {
        const spins = getSpins();

        if (spins <= 0) {
            return false;
        }

        localStorage.setItem(
            STORAGE.spins,
            String(spins - 1)
        );

        return true;
    }

    function getStreak() {
        const value = Number(
            localStorage.getItem(STORAGE.streak)
        );

        return Number.isFinite(value)
            ? Math.max(0, value)
            : 0;
    }

    function setStreak(value) {
        localStorage.setItem(
            STORAGE.streak,
            String(Math.max(0, value))
        );

        updateStreakUI();
    }

    function addStreak(amount) {
        setStreak(
            getStreak() + Number(amount || 0)
        );

        localStorage.setItem(
            STORAGE.streakDate,
            todayKey()
        );

        window.dispatchEvent(
            new CustomEvent("ars:streak-updated", {
                detail: {
                    streak: getStreak()
                }
            })
        );
    }

    function maintainDailyStreak() {
        const today = todayKey();
        const lastDate = localStorage.getItem(
            STORAGE.streakDate
        );

        if (!lastDate) {
            setStreak(1);

            localStorage.setItem(
                STORAGE.streakDate,
                today
            );

            return;
        }

        if (lastDate === today) {
            return;
        }

        const previous = new Date(
            `${lastDate}T00:00:00`
        );

        const current = new Date(
            `${today}T00:00:00`
        );

        const difference =
            Math.round(
                (current - previous) /
                86400000
            );

        if (difference === 1) {
            addStreak(1);
        } else if (difference > 1) {
            setStreak(1);

            localStorage.setItem(
                STORAGE.streakDate,
                today
            );
        }
    }

    function saveTemporaryReward(id, until) {
        let rewardsList = [];

        try {
            rewardsList = JSON.parse(
                localStorage.getItem(
                    STORAGE.tempRewards
                ) || "[]"
            );
        } catch (error) {
            rewardsList = [];
        }

        rewardsList = rewardsList.filter(
            reward =>
                reward &&
                reward.until &&
                reward.until > Date.now()
        );

        rewardsList.push({
            id,
            until
        });

        localStorage.setItem(
            STORAGE.tempRewards,
            JSON.stringify(rewardsList)
        );
    }

    function cleanExpiredRewards() {
        const now = Date.now();

        let rewardsList = [];

        try {
            rewardsList = JSON.parse(
                localStorage.getItem(
                    STORAGE.tempRewards
                ) || "[]"
            );
        } catch (error) {
            rewardsList = [];
        }

        rewardsList = rewardsList.filter(
            reward =>
                reward &&
                Number(reward.until) > now
        );

        localStorage.setItem(
            STORAGE.tempRewards,
            JSON.stringify(rewardsList)
        );

        const freeAvatarUntil = Number(
            localStorage.getItem(
                STORAGE.freeAvatarUntil
            ) || 0
        );

        if (
            freeAvatarUntil &&
            freeAvatarUntil <= now
        ) {
            localStorage.removeItem(
                STORAGE.freeAvatarUntil
            );

            localStorage.removeItem(
                "ars_temp_avatar_image"
            );
        }

        const vipUntil = Number(
            localStorage.getItem(
                STORAGE.vipUntil
            ) || 0
        );

        if (
            vipUntil &&
            vipUntil <= now
        ) {
            localStorage.removeItem(
                STORAGE.vipUntil
            );
        }

        const themeUntil = Number(
            localStorage.getItem(
                STORAGE.themeUntil
            ) || 0
        );

        if (
            themeUntil &&
            themeUntil <= now
        ) {
            localStorage.removeItem(
                STORAGE.themeUntil
            );

            document.body.classList.remove(
                "ars-favorite-theme"
            );
        }

        applyTemporaryRewardsToPage();
    }

    function applyReward(reward) {
        const now = Date.now();

        if (reward.id === "streak1") {
            addStreak(1);
        }

        if (reward.id === "streak2") {
            addStreak(2);
        }

        if (reward.id === "freeAvatar") {
            const until =
                now +
                24 * 60 * 60 * 1000;

            localStorage.setItem(
                STORAGE.freeAvatarUntil,
                String(until)
            );

            saveTemporaryReward(
                "freeAvatar",
                until
            );

            /*
             * Demo image.
             * It is only active for the reward duration.
             */
            localStorage.setItem(
                "ars_temp_avatar_image",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
            );
        }

        if (reward.id === "vipBadge") {
            const until =
                now +
                24 * 60 * 60 * 1000;

            localStorage.setItem(
                STORAGE.vipUntil,
                String(until)
            );

            saveTemporaryReward(
                "vipBadge",
                until
            );
        }

        if (reward.id === "favoriteTheme") {
            const until =
                now +
                60 * 60 * 1000;

            localStorage.setItem(
                STORAGE.themeUntil,
                String(until)
            );

            saveTemporaryReward(
                "favoriteTheme",
                until
            );
        }

        applyTemporaryRewardsToPage();

        window.dispatchEvent(
            new CustomEvent(
                "ars:wheel-reward",
                {
                    detail: reward
                }
            )
        );
    }

    function applyChallenge(challenge) {
        const activeChallenge = {
            id: challenge.id,
            action: challenge.action,
            title: challenge.title,
            description: challenge.description,
            icon: challenge.icon,
            createdAt: Date.now(),
            expiresAt:
                Date.now() +
                CHALLENGE_DURATION
        };

        localStorage.setItem(
            STORAGE.challenge,
            JSON.stringify(
                activeChallenge
            )
        );

        window.dispatchEvent(
            new CustomEvent(
                "ars:challenge-created",
                {
                    detail: activeChallenge
                }
            )
        );
    }

    function getActiveChallenge() {
        try {
            const challenge =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE.challenge
                    ) || "null"
                );

            if (!challenge) {
                return null;
            }

            if (
                Number(challenge.expiresAt) <=
                Date.now()
            ) {
                localStorage.removeItem(
                    STORAGE.challenge
                );

                return null;
            }

            return challenge;
        } catch (error) {
            localStorage.removeItem(
                STORAGE.challenge
            );

            return null;
        }
    }

    function completeChallenge(action) {
        const challenge =
            getActiveChallenge();

        if (!challenge) {
            return false;
        }

        if (challenge.action !== action) {
            return false;
        }

        localStorage.removeItem(
            STORAGE.challenge
        );

        addStreak(1);

        window.dispatchEvent(
            new CustomEvent(
                "ars:challenge-completed",
                {
                    detail: challenge
                }
            )
        );

        showToast(
            `Challenge completed! +1 Streak 🔥`
        );

        return true;
    }

    function createWheelUI() {
        if (
            document.getElementById(
                "arsWheelModal"
            )
        ) {
            connectWheelElements();
            return;
        }

        wheelModal =
            document.createElement("div");

        wheelModal.id =
            "arsWheelModal";

        wheelModal.className =
            "ars-wheel-modal";

        wheelModal.setAttribute(
            "aria-hidden",
            "true"
        );

        wheelModal.innerHTML = `
            <div class="ars-wheel-backdrop"></div>

            <div class="ars-wheel-panel">

                <div class="ars-wheel-header">
                    <div>
                        <span class="ars-wheel-kicker">
                            DAILY WHEEL
                        </span>

                        <h2>Spin the Wheel</h2>

                        <p>
                            Rewards or challenges.
                            Your luck decides.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="ars-wheel-close"
                        id="arsWheelClose"
                        aria-label="Close wheel"
                    >
                        ×
                    </button>
                </div>

                <div
                    class="ars-wheel-stage"
                    id="arsWheelStage"
                >
                    <div class="ars-wheel-pointer">
                        ▼
                    </div>

                    <div
                        class="ars-wheel-disc"
                        id="arsWheelDisc"
                    >
                        ${createWheelLabels()}

                        <button
                            type="button"
                            class="ars-wheel-center"
                            id="arsWheelSpin"
                        >
                            <span>SPIN</span>
                            <small>LUCK</small>
                        </button>
                    </div>
                </div>

                <div class="ars-wheel-stats">
                    <div class="ars-wheel-stat">
                        <strong
                            id="arsWheelSpins"
                        >
                            2
                        </strong>

                        <span>
                            Spins left
                        </span>
                    </div>

                    <div class="ars-wheel-stat">
                        <strong
                            id="arsWheelStreak"
                        >
                            0
                        </strong>

                        <span>
                            Streak
                        </span>
                    </div>
                </div>

                <div
                    class="ars-wheel-result"
                    id="arsWheelResult"
                    hidden
                >
                    <div
                        class="ars-wheel-result-icon"
                        id="arsWheelResultIcon"
                    >
                        🎁
                    </div>

                    <div>
                        <span>
                            YOU GOT
                        </span>

                        <h3
                            id="arsWheelResultTitle"
                        >
                            Reward
                        </h3>

                        <p
                            id="arsWheelResultDescription"
                        >
                            Nice!
                        </p>
                    </div>

                    <button
                        type="button"
                        class="ars-wheel-exit"
                        id="arsWheelExit"
                    >
                        Exit
                    </button>
                </div>

                <div
                    class="ars-wheel-challenge"
                    id="arsWheelChallenge"
                    hidden
                >
                    <span>ACTIVE CHALLENGE</span>

                    <strong
                        id="arsWheelChallengeTitle"
                    ></strong>

                    <p
                        id="arsWheelChallengeDescription"
                    ></p>
                </div>

            </div>
        `;

        document.body.appendChild(
            wheelModal
        );

        connectWheelElements();
    }

    function createWheelLabels() {
        return wheelItems
            .map((item, index) => {
                const angle =
                    index * 36 + 18;

                return `
                    <span
                        class="ars-wheel-label"
                        style="
                            transform:
                                rotate(${angle}deg)
                                translateY(-112px)
                                rotate(-${angle}deg);
                        "
                    >
                        ${item.icon}
                    </span>
                `;
            })
            .join("");
    }

    function connectWheelElements() {
        wheelModal =
            document.getElementById(
                "arsWheelModal"
            );

        if (!wheelModal) {
            return;
        }

        wheelDisc =
            document.getElementById(
                "arsWheelDisc"
            );

        wheelResult =
            document.getElementById(
                "arsWheelResult"
            );

        wheelResultTitle =
            document.getElementById(
                "arsWheelResultTitle"
            );

        wheelResultDescription =
            document.getElementById(
                "arsWheelResultDescription"
            );

        wheelResultIcon =
            document.getElementById(
                "arsWheelResultIcon"
            );

        wheelSpinButton =
            document.getElementById(
                "arsWheelSpin"
            );

        wheelSpinsText =
            document.getElementById(
                "a
