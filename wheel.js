/* =========================================================
   ΛRS — DAILY WHEEL
   Independent Wheel Engine
========================================================= */

(function(){

    "use strict";

    const WHEEL_STORAGE =
        "lrs_daily_wheel_state";

    const MAX_DAILY_SPINS = 2;

    const rewards = [

        {
            id:"streak",
            type:"reward",
            icon:"🔥",
            title:{
                en:"Streak +1",
                ar:"زيادة ستريك +1"
            },
            description:{
                en:"Your streak has been increased by 1.",
                ar:"تمت زيادة الستريك الخاص بك بمقدار 1."
            }
        },

        {
            id:"avatar",
            type:"reward",
            icon:"🖼️",
            title:{
                en:"Free Avatar",
                ar:"افتار مجاني"
            },
            description:{
                en:"You unlocked a free avatar for 24 hours.",
                ar:"حصلت على افتار مجاني لمدة 24 ساعة."
            }
        },

        {
            id:"vip",
            type:"reward",
            icon:"💜",
            title:{
                en:"VIP Badge",
                ar:"علامة VIP"
            },
            description:{
                en:"Your VIP badge is active for 24 hours.",
                ar:"علامة VIP الخاصة بك مفعلة لمدة 24 ساعة."
            }
        },

        {
            id:"theme",
            type:"reward",
            icon:"✨",
            title:{
                en:"Favorite Theme",
                ar:"الثيم المفضل"
            },
            description:{
                en:"Use your favorite theme for 1 hour.",
                ar:"استخدم ثيمك المفضل لمدة ساعة."
            }
        }

    ];


    const challenges = [

        {
            id:"profile",
            icon:"👤",
            en:"Change your profile avatar.",
            ar:"غيّر صورة بروفايلك."
        },

        {
            id:"post",
            icon:"📝",
            en:"Create a new post today.",
            ar:"أنشئ منشورًا جديدًا اليوم."
        },

        {
            id:"like",
            icon:"❤️",
            en:"Like 5 posts.",
            ar:"سجّل إعجابك بـ 5 منشورات."
        },

        {
            id:"comment",
            icon:"💬",
            en:"Leave 3 comments.",
            ar:"اكتب 3 تعليقات."
        },

        {
            id:"follow",
            icon:"➕",
            en:"Follow one new account.",
            ar:"تابع حسابًا جديدًا."
        },

        {
            id:"explore",
            icon:"🔥",
            en:"Explore 5 different posts.",
            ar:"استكشف 5 منشورات مختلفة."
        },

        {
            id:"story",
            icon:"⭕",
            en:"View 5 stories.",
            ar:"شاهد 5 قصص."
        },

        {
            id:"share",
            icon:"↗️",
            en:"Share one post.",
            ar:"شارك منشورًا واحدًا."
        },

        {
            id:"repost",
            icon:"🔁",
            en:"Repost one post.",
            ar:"أعد نشر منشور واحد."
        },

        {
            id:"message",
            icon:"✉️",
            en:"Send one message.",
            ar:"أرسل رسالة واحدة."
        },

        {
            id:"discover",
            icon:"🔎",
            en:"Search for a new account.",
            ar:"ابحث عن حساب جديد."
        },

        {
            id:"save",
            icon:"🔖",
            en:"Save one post.",
            ar:"احفظ منشورًا واحدًا."
        },

        {
            id:"return",
            icon:"↩️",
            en:"Come back to ΛRS tomorrow.",
            ar:"ارجع إلى ΛRS غدًا."
        },

        {
            id:"reaction",
            icon:"😍",
            en:"React to 3 posts.",
            ar:"تفاعل مع 3 منشورات."
        },

        {
            id:"official",
            icon:"⭐",
            en:"Visit one official account.",
            ar:"زر حسابًا رسميًا واحدًا."
        },

        {
            id:"notifications",
            icon:"🔔",
            en:"Check your notifications.",
            ar:"تحقق من إشعاراتك."
        }

    ];


    function getLanguage(){

        const saved =
            localStorage.getItem(
                "lrs_language"
            );

        if(saved === "ar"){
            return "ar";
        }

        return "en";
    }


    function getToday(){

        const date =
            new Date();

        return [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2,"0"),
            String(
                date.getDate()
            ).padStart(2,"0")
        ].join("-");

    }


    function getState(){

        try{

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        WHEEL_STORAGE
                    )
                );

            if(!saved){

                return {
                    date:getToday(),
                    spins:0,
                    rewards:[],
                    challenges:[]
                };

            }


            if(
                saved.date !==
                getToday()
            ){

                return {
                    date:getToday(),
                    spins:0,
                    rewards:[],
                    challenges:[]
                };

            }

            return saved;

        }catch(error){

            return {
                date:getToday(),
                spins:0,
                rewards:[],
                challenges:[]
            };

        }

    }


    function saveState(state){

        localStorage.setItem(
            WHEEL_STORAGE,
            JSON.stringify(state)
        );

    }


    function randomResult(){

        const all = [

            ...rewards,

            ...challenges.map(
                challenge => ({
                    id:challenge.id,
                    type:"challenge",
                    icon:challenge.icon,
                    title:{
                        en:"Challenge",
                        ar:"تحدي"
                    },
                    description:{
                        en:challenge.en,
                        ar:challenge.ar
                    }
                })
            )

        ];

        return all[
            Math.floor(
                Math.random() *
                all.length
            )
        ];

    }


    function applyReward(reward){

        const state =
            getState();

        const now =
            Date.now();


        if(
            reward.id ===
            "streak"
        ){

            const current =
                Number(
                    localStorage.getItem(
                        "lrs_streak"
                    )
                ) || 0;

            localStorage.setItem(
                "lrs_streak",
                String(
                    current + 1
                )
            );

        }


        if(
            reward.id ===
            "avatar"
        ){

            localStorage.setItem(

                "lrs_free_avatar",

                JSON.stringify({

                    active:true,

                    expires:
                        now +
                        24 *
                        60 *
                        60 *
                        1000

                })

            );

        }


        if(
            reward.id ===
            "vip"
        ){

            localStorage.setItem(

                "lrs_vip_badge",

                JSON.stringify({

                    active:true,

                    expires:
                        now +
                        24 *
                        60 *
                        60 *
                        1000

                })

            );

        }


        if(
            reward.id ===
            "theme"
        ){

            localStorage.setItem(

                "lrs_favorite_theme",

                JSON.stringify({

                    active:true,

                    expires:
                        now +
                        60 *
                        60 *
                        1000

                })

            );

        }


        state.rewards.push({

            id:reward.id,

            receivedAt:now

        });


        saveState(state);

    }


    function createWheelScreen(){

        if(
            document.getElementById(
                "wheelScreen"
            )
        ){

            return;

        }


        const screen =
            document.createElement(
                "div"
            );

        screen.id =
            "wheelScreen";

        screen.className =
            "wheel-screen";


        screen.innerHTML = `

            <div class="wheel-container">

                <div class="wheel-header">

                    <div class="wheel-title">
                        Daily Wheel
                    </div>

                    <button
                        class="wheel-close"
                        id="wheelClose"
                        type="button"
                    >
                        ×
                    </button>

                </div>


                <div class="wheel-subtitle">
                    Spin the wheel and discover your reward or challenge.
                </div>


                <div class="wheel-pointer"></div>


                <div
                    class="wheel"
                    id="dailyWheel"
                >

                    <div
                        class="wheel-segment"
                        style="
                            transform:rotate(0deg);
                            background:conic-gradient(
                                #8B3DFF 0deg 22.5deg,
                                #17171C 22.5deg 45deg,
                                #A143FF 45deg 67.5deg,
                                #17171C 67.5deg 90deg,
                                #8B3DFF 90deg 112.5deg,
                                #17171C 112.5deg 135deg,
                                #A143FF 135deg 157.5deg,
                                #17171C 157.5deg 180deg,
                                #8B3DFF 180deg 202.5deg,
                                #17171C 202.5deg 225deg,
                                #A143FF 225deg 247.5deg,
                                #17171C 247.5deg 270deg,
                                #8B3DFF 270deg 292.5deg,
                                #17171C 292.5deg 315deg,
                                #A143FF 315deg 337.5deg,
                                #17171C 337.5deg 360deg
                            );
                        "
                    >
                    </div>

                </div>


                <div
                    class="wheel-spins"
                    id="wheelSpins"
                >
                    2 spins left today
                </div>


                <button
                    class="wheel-spin-button"
                    id="wheelSpinButton"
                    type="button"
                >
                    Spin
                </button>

            </div>


            <div
                class="wheel-result"
                id="wheelResult"
            >

                <div class="wheel-result-card">

                    <div
                        class="wheel-result-icon"
                        id="wheelResultIcon"
                    >
                        🎁
                    </div>


                    <div
                        class="wheel-result-type"
                        id="wheelResultType"
                    >
                        Reward
                    </div>


                    <div
                        class="wheel-result-title"
                        id="wheelResultTitle"
                    >
                        Reward
                    </div>


                    <div
                        class="wheel-result-description"
                        id="wheelResultDescription"
                    >
                    </div>


                    <div
                        class="reward-applied"
                        id="rewardApplied"
                    >
                    </div>


                    <button
                        class="wheel-result-exit"
                        id="wheelResultExit"
                        type="button"
                    >
                        Exit
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            screen
        );


        setupWheelEvents();

    }


    function updateSpinCounter(){

        const state =
            getState();

        const remaining =
            Math.max(
                0,
                MAX_DAILY_SPINS -
                state.spins
            );

        const counter =
            document.getElementById(
                "wheelSpins"
            );

        const button =
            document.getElementById(
                "wheelSpinButton"
            );

        if(!counter || !button){
            return;
        }


        const lang =
            getLanguage();


        counter.textContent =
            lang === "ar"

            ? `${remaining} لفات متبقية اليوم`

            : `${remaining} ${
                remaining === 1
                ? "spin"
                : "spins"
            } left today`;


        button.disabled =
            remaining <= 0;


        button.textContent =
            lang === "ar"
            ? "لف"
            : "Spin";

    }


    function showResult(result){

        const lang =
            getLanguage();

        const resultScreen =
            document.getElementById(
                "wheelResult"
            );

        const icon =
            document.getElementById(
                "wheelResultIcon"
            );

        const type =
            document.getElementById(
                "wheelResultType"
            );

        const title =
            document.getElementById(
                "wheelResultTitle"
            );

        const description =
            document.getElementById(
                "wheelResultDescription"
            );

        const applied =
            document.getElementById(
                "rewardApplied"
            );

        const exit =
            document.getElementById(
                "wheelResultExit"
            );


        if(
            !resultScreen ||
            !icon ||
            !type ||
            !title ||
            !description ||
            !applied ||
            !exit
        ){

            return;

        }


        icon.textContent =
            result.icon;


        type.textContent =
            result.type === "reward"

            ? (
                lang === "ar"
                ? "جائزة"
                : "Reward"
            )

            : (
                lang === "ar"
                ? "تحدي"
                : "Challenge"
            );


        title.textContent =
            result.type === "reward"

            ? result.title[lang]

            : (
                lang === "ar"
                ? "تحدي"
                : "Challenge"
            );


        description.textContent =
            result.description[lang];


        if(
            result.type === "reward"
        ){

            applyReward(result);

            applied.textContent =
                lang === "ar"
                ? "تمت إضافة الجائزة تلقائيًا ✓"
                : "Reward added automatically ✓";

        }else{

            applied.textContent =
                "";

        }


        exit.textContent =
            lang === "ar"
            ? "خروج"
            : "Exit";


        resultScreen.classList.add(
            "active"
        );

    }


    function spinWheel(){

        const state =
            getState();

        if(
            state.spins >=
            MAX_DAILY_SPINS
        ){

            return;

        }


        const wheel =
            document.getElementById(
                "dailyWheel"
            );

        const button =
            document.getElementById(
                "wheelSpinButton"
            );


        if(!wheel || !button){
            return;
        }


        button.disabled =
            true;


        const result =
            randomResult();


        state.spins++;

        saveState(state);


        const randomRotation =
            1440 +
            Math.floor(
                Math.random() *
                1440
            );


        wheel.style.transform =
            `rotate(${randomRotation}deg)`;


        setTimeout(

            () => {

                showResult(
                    result
                );

                updateSpinCounter();

            },

            4100

        );

    }


    function setupWheelEvents(){

        const close =
            document.getElementById(
                "wheelClose"
            );

        const spin =
            document.getElementById(
                "wheelSpinButton"
            );

        const exit =
            document.getElementById(
                "wheelResultExit"
            );


        if(close){

            close.addEventListener(
                "click",
                closeWheel
            );

        }


        if(spin){

            spin.addEventListener(
                "click",
                spinWheel
            );

        }


        if(exit){

            exit.addEventListener(
                "click",
                () => {

                    const result =
                        document.getElementById(
                            "wheelResult"
                        );

                    if(result){

                        result.classList.remove(
                            "active"
                        );

                    }

                    updateSpinCounter();

                }
            );

        }


        updateSpinCounter();

    }


    function openWheel(){

        createWheelScreen();


        const screen =
            document.getElementById(
                "wheelScreen"
            );


        if(screen){

            screen.classList.add(
                "active"
            );

        }

    }


    function closeWheel(){

        const screen =
            document.getElementById(
                "wheelScreen"
            );

        if(!screen){
            return;
        }


        screen.classList.remove(
            "active"
        );


        const result =
            document.getElementById(
                "wheelResult"
            );

        if(result){

            result.classList.remove(
                "active"
            );

        }

    }


    function initializeWheel(){

        const buttons =
            document.querySelectorAll(
                "nav button"
            );


        if(
            buttons.length < 3
        ){

            return;

        }


        const wheelButton =
            buttons[2];


        if(
            wheelButton.dataset
                .wheelBound === "true"
        ){

            return;

        }


        wheelButton.dataset
            .wheelBound = "true";


        wheelButton.addEventListener(
            "click",
            function(event){

                event.preventDefault();

                openWheel();

            }
        );

    }


    if(
        document.readyState ===
        "loading"
    ){

        document.addEventListener(
            "DOMContentLoaded",
            initializeWheel
        );

    }else{

        initializeWheel();

    }

})();
