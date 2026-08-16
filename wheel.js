/* =========================================================
   ΛRS — DAILY WHEEL
   Complete standalone system
   Connected directly to #settings
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {

        storageKey:
            "ars_daily_wheel_state",

        rewardsKey:
            "ars_user_rewards",

        maxSpinsPerDay:
            2,

        animationDuration:
            4200

    };


    /* =====================================================
       LANGUAGE
       English is the default language.
    ===================================================== */

    const translations = {

        en: {

            title:
                "Daily Wheel",

            subtitle:
                "Spin twice a day for a reward or challenge.",

            spins:
                "Spins left",

            spin:
                "Spin the Wheel",

            noSpins:
                "No spins left today",

            reward:
                "Reward",

            challenge:
                "Challenge",

            exit:
                "Exit",

            streak:
                "Streak Bonus",

            streak1:
                "+1 Streak",

            streak2:
                "+2 Streak",

            avatar:
                "Free Avatar",

            avatarDescription:
                "Free avatar for 1 day",

            vip:
                "VIP Badge",

            vipDescription:
                "VIP Badge for 1 day",

            theme:
                "Favorite Theme",

            themeDescription:
                "Use your favorite theme for 1 hour",

            postChallenge:
                "Post Challenge",

            postChallengeDescription:
                "Create a post today.",

            likeChallenge:
                "Like Challenge",

            likeChallengeDescription:
                "Like 5 posts today.",

            commentChallenge:
                "Comment Challenge",

            commentChallengeDescription:
                "Leave 3 comments today.",

            followChallenge:
                "Follow Challenge",

            followChallengeDescription:
                "Follow 2 new accounts today.",

            exploreChallenge:
                "Explore Challenge",

            exploreChallengeDescription:
                "Explore 10 posts today.",

            repostChallenge:
                "Repost Challenge",

            repostChallengeDescription:
                "Repost 2 posts today.",

            storyChallenge:
                "Story Challenge",

            storyChallengeDescription:
                "Share a story today.",

            messageChallenge:
                "Message Challenge",

            messageChallengeDescription:
                "Send a message to a friend.",

            profileChallenge:
                "Profile Challenge",

            profileChallengeDescription:
                "Update your profile today.",

            streakChallenge:
                "Streak Challenge",

            streakChallengeDescription:
                "Keep your streak alive today.",

            discoveryChallenge:
                "Discovery Challenge",

            discoveryChallengeDescription:
                "Visit 3 new profiles.",

            saveChallenge:
                "Save Challenge",

            saveChallengeDescription:
                "Save 3 posts today.",

            rewardReceived:
                "Reward received",

            challengeReceived:
                "Challenge received",

            congratulations:
                "Congratulations!",

            goodLuck:
                "Good luck!",

            close:
                "Close"

        },


        ar: {

            title:
                "العجلة اليومية",

            subtitle:
                "لف العجلة مرتين يوميًا للحصول على جائزة أو تحدي.",

            spins:
                "اللفات المتبقية",

            spin:
                "لف العجلة",

            noSpins:
                "لا توجد لفات متبقية اليوم",

            reward:
                "جائزة",

            challenge:
                "تحدي",

            exit:
                "خروج",

            streak:
                "مكافأة الستريك",

            streak1:
                "+1 ستريك",

            streak2:
                "+2 ستريك",

            avatar:
                "افتار مجاني",

            avatarDescription:
                "افتار مجاني لمدة يوم",

            vip:
                "علامة VIP",

            vipDescription:
                "علامة VIP لمدة يوم",

            theme:
                "الثيم المفضل",

            themeDescription:
                "استخدم الثيم المفضل لمدة ساعة",

            postChallenge:
                "تحدي النشر",

            postChallengeDescription:
                "أنشئ منشورًا اليوم.",

            likeChallenge:
                "تحدي الإعجاب",

            likeChallengeDescription:
                "أعجب بـ 5 منشورات اليوم.",

            commentChallenge:
                "تحدي التعليقات",

            commentChallengeDescription:
                "اكتب 3 تعليقات اليوم.",

            followChallenge:
                "تحدي المتابعة",

            followChallengeDescription:
                "تابع حسابين جديدين اليوم.",

            exploreChallenge:
                "تحدي الاستكشاف",

            exploreChallengeDescription:
                "استكشف 10 منشورات اليوم.",

            repostChallenge:
                "تحدي إعادة النشر",

            repostChallengeDescription:
                "أعد نشر منشورين اليوم.",

            storyChallenge:
                "تحدي القصة",

            storyChallengeDescription:
                "شارك قصة اليوم.",

            messageChallenge:
                "تحدي الرسائل",

            messageChallengeDescription:
                "أرسل رسالة إلى صديق.",

            profileChallenge:
                "تحدي الملف الشخصي",

            profileChallengeDescription:
                "حدّث ملفك الشخصي اليوم.",

            streakChallenge:
                "تحدي الستريك",

            streakChallengeDescription:
                "حافظ على الستريك اليوم.",

            discoveryChallenge:
                "تحدي الاكتشاف",

            discoveryChallengeDescription:
                "زر 3 ملفات شخصية جديدة.",

            saveChallenge:
                "تحدي الحفظ",

            saveChallengeDescription:
                "احفظ 3 منشورات اليوم.",

            rewardReceived:
                "تم استلام الجائزة",

            challengeReceived:
                "تم استلام التحدي",

            congratulations:
                "مبروك!",

            goodLuck:
                "بالتوفيق!",

            close:
                "إغلاق"

        }

    };


    /* =====================================================
       GET LANGUAGE
       ===================================================== */

    function getLanguage() {

        const htmlLanguage =
            document.documentElement
                .getAttribute("lang");

        if (
            htmlLanguage &&
            translations[htmlLanguage]
        ) {

            return htmlLanguage;

        }

        return "en";

    }


    function t(key) {

        const language =
            getLanguage();

        return (
            translations[language]?.[key] ||
            translations.en[key] ||
            key
        );

    }


    /* =====================================================
       REWARDS
    ===================================================== */

    const rewards = [

        {
            id:
                "streak1",

            type:
                "reward",

            titleKey:
                "streak",

            descriptionKey:
                "streak1"

        },

        {
            id:
                "avatar",

            type:
                "reward",

            titleKey:
                "avatar",

            descriptionKey:
                "avatarDescription"

        },

        {
            id:
                "vip",

            type:
                "reward",

            titleKey:
                "vip",

            descriptionKey:
                "vipDescription"

        },

        {
            id:
                "theme",

            type:
                "reward",

            titleKey:
                "theme",

            descriptionKey:
                "themeDescription"

        },

        {
            id:
                "streak2",

            type:
                "reward",

            titleKey:
                "streak",

            descriptionKey:
                "streak2"

        },

        {
            id:
                "avatar2",

            type:
                "reward",

            titleKey:
                "avatar",

            descriptionKey:
                "avatarDescription"

        },

        {
            id:
                "vip2",

            type:
                "reward",

            titleKey:
                "vip",

            descriptionKey:
                "vipDescription"

        },

        {
            id:
                "theme2",

            type:
                "reward",

            titleKey:
                "theme",

            descriptionKey:
                "themeDescription"

        }

    ];


    /* =====================================================
       CHALLENGES
    ===================================================== */

    const challenges = [

        {
            id:
                "post",

            type:
                "challenge",

            titleKey:
                "postChallenge",

            descriptionKey:
                "postChallengeDescription"

        },

        {
            id:
                "like",

            type:
                "challenge",

            titleKey:
                "likeChallenge",

            descriptionKey:
                "likeChallengeDescription"

        },

        {
            id:
                "comment",

            type:
                "challenge",

            titleKey:
                "commentChallenge",

            descriptionKey:
                "commentChallengeDescription"

        },

        {
            id:
                "follow",

            type:
                "challenge",

            titleKey:
                "followChallenge",

            descriptionKey:
                "followChallengeDescription"

        },

        {
            id:
                "explore",

            type:
                "challenge",

            titleKey:
                "exploreChallenge",

            descriptionKey:
                "exploreChallengeDescription"

        },

        {
            id:
                "repost",

            type:
                "challenge",

            titleKey:
                "repostChallenge",

            descriptionKey:
                "repostChallengeDescription"

        },

        {
            id:
                "story",

            type:
                "challenge",

            titleKey:
                "storyChallenge",

            descriptionKey:
                "storyChallengeDescription"

        },

        {
            id:
                "message",

            type:
                "challenge",

            titleKey:
                "messageChallenge",

            descriptionKey:
                "messageChallengeDescription"

        },

        {
            id:
                "profile",

            type:
                "challenge",

            titleKey:
                "profileChallenge",

            descriptionKey:
                "profileChallengeDescription"

        },

        {
            id:
                "streak",

            type:
                "challenge",

            titleKey:
                "streakChallenge",

            descriptionKey:
                "streakChallengeDescription"

        },

        {
            id:
                "discover",

            type:
                "challenge",

            titleKey:
                "discoveryChallenge",

            descriptionKey:
                "discoveryChallengeDescription"

        },

        {
            id:
                "save",

            type:
                "challenge",

            titleKey:
                "saveChallenge",

            descriptionKey:
                "saveChallengeDescription"

        }

    ];


    /* =====================================================
       STATE
    ===================================================== */

    let state = {

        date:
            getTodayKey(),

        spins:
            0,

        spinning:
            false,

        lastResult:
            null

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
       LOAD STATE
    ===================================================== */

    function loadState() {

        try {

            const saved =
                localStorage.getItem(
                    CONFIG.storageKey
                );

            if (!saved) {

                saveState();

                return;

            }

            const parsed =
                JSON.parse(saved);

            if (
                !parsed ||
                typeof parsed !== "object"
            ) {

                saveState();

                return;

            }

            if (
                parsed.date !==
                getTodayKey()
            ) {

                state = {

                    date:
                        getTodayKey(),

                    spins:
                        0,

                    spinning:
                        false,

                    lastResult:
                        null

                };

                saveState();

                return;

            }

            state.spins =
                Number(
                    parsed.spins
                ) || 0;

            state.lastResult =
                parsed.lastResult ||
                null;

        } catch (error) {

            console.warn(
                "ΛRS Wheel: could not load state.",
                error
            );

        }

    }


    /* =====================================================
       SAVE STATE
    ===================================================== */

    function saveState() {

        try {

            localStorage.setItem(

                CONFIG.storageKey,

                JSON.stringify({

                    date:
                        state.date,

                    spins:
                        state.spins,

                    lastResult:
                        state.lastResult

                })

            );

        } catch (error) {

            console.warn(
                "ΛRS Wheel: could not save state.",
                error
            );

        }

    }


    /* =====================================================
       REMAINING SPINS
    ===================================================== */

    function remainingSpins() {

        return Math.max(

            0,

            CONFIG.maxSpinsPerDay -
            state.spins

        );

    }


    /* =====================================================
       RANDOM
    ===================================================== */

    function randomItem(array) {

        return array[
            Math.floor(
                Math.random() *
                array.length
            )
        ];

    }


    /* =====================================================
       REWARD STORAGE
    ===================================================== */

    function getRewards() {

        try {

            return JSON.parse(

                localStorage.getItem(
                    CONFIG.rewardsKey
                )

            ) || {};

        } catch {

            return {};

        }

    }


    function saveRewards(data) {

        try {

            localStorage.setItem(

                CONFIG.rewardsKey,

                JSON.stringify(data)

            );

        } catch (error) {

            console.warn(
                "ΛRS Wheel: could not save rewards.",
                error
            );

        }

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

            data.streakBonus +=
                1;

        }


        if (
            reward.id ===
            "streak2"
        ) {

            data.streakBonus =
                Number(
                    data.streakBonus
                ) || 0;

            data.streakBonus +=
                2;

        }


        if (
            reward.id === "avatar" ||
            reward.id === "avatar2"
        ) {

            data.freeAvatarUntil =
                now +
                86400000;

        }


        if (
            reward.id === "vip" ||
            reward.id === "vip2"
        ) {

            data.vipUntil =
                now +
                86400000;

        }


        if (
            reward.id === "theme" ||
            reward.id === "theme2"
        ) {

            data.favoriteThemeUntil =
                now +
                3600000;

        }


        data.lastReward = {

            id:
                reward.id,

            title:
                t(
                    reward.titleKey
                ),

            description:
                t(
                    reward.descriptionKey
                ),

            receivedAt:
                now

        };


        saveRewards(
            data
        );


        /* Notify the rest of the website */

        window.dispatchEvent(

            new CustomEvent(
                "ars:reward-applied",
                {
                    detail: {
                        reward,
                        data
                    }
                }
            )

        );


        /* Existing profile integrations */

        if (
            typeof window.refreshProfileRewards ===
            "function"
        ) {

            try {

                window.refreshProfileRewards();

            } catch (error) {

                console.warn(
                    "ΛRS Wheel: profile refresh failed.",
                    error
                );

            }

        }


        if (
            typeof window.updateProfile ===
            "function"
        ) {

            try {

                window.updateProfile();

            } catch (error) {

                console.warn(
                    "ΛRS Wheel: profile update failed.",
                    error
                );

            }

        }

    }


    /* =====================================================
       CSS
    ===================================================== */

    function injectStyles() {

        if (
            document.getElementById(
                "arsWheelStyles"
      
