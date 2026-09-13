(() => {
  "use strict";

  const STATE_KEY =
    "ars_wheel_state";

  const STREAK_KEY =
    "ars_streak_state";

  const REWARD_KEY =
    "ars_temp_rewards";

  const CHALLENGE_KEY =
    "ars_active_challenge";

  const MAX_SPINS = 2;

  const CHALLENGE_DURATION =
    60 * 60 * 1000;


  const rewards = [

    {
      id: "streak1",
      title: "+1 Streak",
      description:
        "Your Streak increased by 1.",
      kind: "reward"
    },

    {
      id: "streak2",
      title: "+2 Streak",
      description:
        "Your Streak increased by 2.",
      kind: "reward"
    },

    {
      id: "avatar",
      title: "Free Avatar",
      description:
        "Use an image avatar for 24 hours.",
      kind: "reward"
    },

    {
      id: "vip",
      title: "VIP Badge",
      description:
        "Show a VIP badge for 24 hours.",
      kind: "reward"
    },

    {
      id: "theme",
      title: "Favorite Theme",
      description:
        "Unlock your favorite theme for 1 hour.",
      kind: "reward"
    }

  ];


  const challenges = [

    {
      id: "post",
      title: "Post Challenge",
      description:
        "Create a post today."
    },

    {
      id: "like",
      title: "Like Challenge",
      description:
        "Like 5 posts today."
    },

    {
      id: "comment",
      title: "Comment Challenge",
      description:
        "Leave a reply today."
    },

    {
      id: "repost",
      title: "Repost Challenge",
      description:
        "Repost a post today."
    },

    {
      id: "story",
      title: "Story Challenge",
      description:
        "Share a story today."
    },

    {
      id: "save",
      title: "Save Challenge",
      description:
        "Save a post today."
    },

    {
      id: "profile",
      title: "Profile Challenge",
      description:
        "Update your profile today."
    },

    {
      id: "explore",
      title: "Explore Challenge",
      description:
        "Explore posts today."
    }

  ];


  const esc =
    (value) =>
      String(value ?? "").replace(
        /[&<>'"]/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#039;",
            '"': "&quot;"
          })[char]
      );


  const read =
    (
      key,
      fallback
    ) => {
      try {

        return (
          JSON.parse(
            localStorage.getItem(
              key
            ) || "null"
          ) ?? fallback
        );

      } catch {

        return fallback;

      }
    };


  const write =
    (
      key,
      value
    ) =>
      localStorage.setItem(
        key,
        JSON.stringify(
          value
        )
      );


  const localDateKey =
    () => {

      const d =
        new Date();

      return `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(
        2,
        "0"
      )}-${String(
        d.getDate()
      ).padStart(
        2,
        "0"
      )}`;
    };


  let state = {
    date:
      localDateKey(),

    spins:
      0,

    rotation:
      0,

    spinning:
      false
  };


  function load() {

    const saved =
      read(
        STATE_KEY,
        {}
      );

    if (
      saved.date !==
      localDateKey()
    ) {

      state = {
        date:
          localDateKey(),

        spins:
          0,

        rotation:
          0,

        spinning:
          false
      };

    } else {

      state = {
        ...state,
        ...saved,

        date:
          localDateKey(),

        spinning:
          false
      };

    }

    write(
      STATE_KEY,
      state
    );
  }


  function save() {

    write(
      STATE_KEY,
      state
    );

  }


  function streakState() {

    return read(
      STREAK_KEY,
      {
        count: 0,
        lastDate: null
      }
    );

  }


  function setStreakDelta(
    delta
  ) {

    const current =
      streakState();

    current.count =
      Math.max(
        0,
        (Number(
          current.count
        ) || 0) +
          delta
      );

    current.lastDate =
      localDateKey();

    write(
      STREAK_KEY,
      current
    );

    document.dispatchEvent(
      new CustomEvent(
        "ars:streak-updated"
      )
    );
  }


  function cleanRewards() {

    const rewardsState =
      read(
        REWARD_KEY,
        {}
      );

    const now =
      Date.now();

    let changed =
      false;


    [
      "freeAvatarUntil",
      "vipUntil",
      "favoriteThemeUntil"
    ].forEach(
      (key) => {

        if (
          rewardsState[key] &&
          rewardsState[key] <=
            now
        ) {

          delete rewardsState[
            key
          ];

          changed =
            true;
        }

      }
    );


    if (changed) {

      write(
        REWARD_KEY,
        rewardsState
      );

    }

  }


  function applyReward(
    reward
  ) {

    const temporary =
      read(
        REWARD_KEY,
        {}
      );

    const now =
      Date.now();


    if (
      reward.id ===
      "streak1"
    ) {
      setStreakDelta(
        1
      );
    }


    if (
      reward.id ===
      "streak2"
    ) {
      setStreakDelta(
        2
      );
    }


    if (
      reward.id ===
      "avatar"
    ) {
      temporary.freeAvatarUntil =
        now +
        86400000;
    }


    if (
      reward.id ===
      "vip"
    ) {
      temporary.vipUntil =
        now +
        86400000;
    }


    if (
      reward.id ===
      "theme"
    ) {
      temporary.favoriteThemeUntil =
        now +
        3600000;
    }


    temporary.lastReward =
      {
        title:
          reward.title,

        description:
          reward.description,

        at:
          now
      };


    write(
      REWARD_KEY,
      temporary
    );
  }


  function challengeState() {

    return read(
      CHALLENGE_KEY,
      null
    );

  }


  function setChallenge(
    challenge
  ) {

    write(
      CHALLENGE_KEY,
      {
        ...challenge,

        progress:
          0,

        target:
          challenge.id ===
          "like"
            ? 5
            : 1,

        expiresAt:
          Date.now() +
          CHALLENGE_DURATION
      }
    );

    updateChallenge();
  }


  function completeChallenge(
    id
  ) {

    const active =
      challengeState();


    if (
      !active ||
      active.id !== id
    ) {
      return false;
    }


    if (
      active.expiresAt <=
      Date.now()
    ) {

      localStorage.removeItem(
        CHALLENGE_KEY
      );

      updateChallenge();

      return false;
    }


    active.progress =
      Number(
        active.progress
      ) || 0;

    active.target =
      Number(
        active.target
      ) || 1;


    active.progress +=
      1;


    if (
      active.progress <
      active.target
    ) {

      write(
        CHALLENGE_KEY,
        active
      );

      updateChallenge();

      return false;
    }


    localStorage.removeItem(
      CHALLENGE_KEY
    );


    setStreakDelta(
      1
    );

    updateChallenge();

    return true;
  }


  function updateChallenge() {

    const box =
      document.getElementById(
        "wheelChallenge"
      );

    if (!box) {
      return;
    }


    const active =
      challengeState();


    if (
      !active ||
      active.expiresAt <=
        Date.now()
    ) {

      box.hidden =
        true;

      if (active) {

        localStorage.removeItem(
          CHALLENGE_KEY
        );

      }

      return;
    }


    box.hidden =
      false;


    const progress =
      Number(
        active.progress
      ) || 0;


    const target =
      Number(
        active.target
      ) || 1;


    box.innerHTML = `
      <b>
        ${esc(active.title)}
      </b>

      <span>
        ${esc(
          active.description
        )}
      </span>

      <small>
        Progress:
        ${progress}/${target}
        · Expires in 1 hour
      </small>
    `;
  }


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

      .ars-wheel-overlay{
        position:fixed;
        inset:0;
        z-index:99999;
        display:none;
        align-items:center;
        justify-content:center;
        padding:16px;
        background:rgba(0,0,0,.78);
        backdrop-filter:blur(18px);
      }

      .ars-wheel-overlay.open{
        display:flex;
      }

      .ars-wheel-panel{
        width:min(470px,100%);
        max-height:92vh;
        overflow:auto;
        background:
          linear-gradient(
            180deg,
            #15151a,
            #0d0d10
          );
        border:1px solid rgba(255,255,255,.08);
        border-radius:30px;
        padding:20px;
        box-shadow:
          0 30px 90px rgba(0,0,0,.65);
      }

      .ars-wheel-head{
        display:flex;
        justify-content:space-between;
        align-items:center;
      }

      .ars-wheel-head h2{
        font-size:24px;
      }

      .ars-wheel-close{
        width:42px;
        height:42px;
        border-radius:50%;
        background:rgba(255,255,255,.07);
        font-size:24px;
      }

      .ars-wheel-sub{
        color:#8f8f99;
        font-size:13px;
        margin:4px 0 18px;
      }

      .ars-wheel-stage{
        position:relative;
        width:min(320px,78vw);
        aspect-ratio:1;
        margin:0 auto 18px;
      }

      .ars-wheel-pointer{
        position:absolute;
        z-index:4;
        top:-5px;
        left:50%;
        transform:translateX(-50%);
        border-left:14px solid transparent;
        border-right:14px solid transparent;
        border-top:28px solid white;
        filter:
          drop-shadow(
            0 4px 8px rgba(0,0,0,.5)
          );
      }

      .ars-wheel{
        width:100%;
        height:100%;
        border:8px solid #26262e;
        border-radius:50%;
        background:
          conic-gradient(
            #8B3DFF 0 45deg,
            #24242b 45deg 90deg,
            #C54DFF 90deg 135deg,
            #24242b 135deg 180deg,
            #8B3DFF 180deg 225deg,
            #24242b 225deg 270deg,
            #C54DFF 270deg 315deg,
            #24242b 315deg 360deg
          );
        transition:
          transform
          4s
          cubic-bezier(
            .12,
            .82,
            .18,
            1
          );
        box-shadow:
          0 0 45px rgba(
            139,
            61,
            255,
            .25
          );
      }

      .ars-wheel-center{
        position:absolute;
        inset:50% auto auto 50%;
        transform:
          translate(
            -50%,
            -50%
          );
        width:82px;
        height:82px;
        border-radius:50%;
        background:
          linear-gradient(
            135deg,
            #8B3DFF,
            #C54DFF
          );
        border:5px solid #09090b;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:900;
        z-index:3;
      }

      .ars-wheel-info{
        display:flex;
        justify-content:center;
        gap:8px;
        margin-bottom:14px;
      }

      .ars-wheel-badge{
        padding:8px 12px;
        border-radius:999px;
        background:
          rgba(
            139,
            61,
            255,
            .13
          );
        color:#cda8ff;
        font-size:12px;
        font-weight:800;
      }

      .ars-wheel-spin{
        width:100%;
        height:54px;
        border:0;
        border-radius:17px;
        background:
          linear-gradient(
            135deg,
            #8B3DFF,
            #C54DFF
          );
        font-weight:800;
        font-size:16px;
      }

      .ars-wheel-spin:disabled{
        opacity:.4;
      }

      .ars-wheel-result{
        display:none;
        margin-top:14px;
        padding:18px;
        border-radius:20px;
        background:
          rgba(
            255,
            255,
            255,
            .045
          );
        border:1px solid rgba(
          255,
          255,
          255,
          .07
        );
        text-align:center;
      }

      .ars-wheel-result.show{
        display:block;
      }

      .ars-wheel-result h3{
        font-size:20px;
      }

      .ars-wheel-result p{
        color:#aaa;
        line-height:1.6;
        margin-top:6px;
      }

      .ars-wheel-exit{
        margin-top:14px;
        width:100%;
        height:46px;
        border-radius:14px;
        background:
          rgba(
            255,
            255,
            255,
            .08
          );
        font-weight:700;
      }

      .wheel-challenge{
        margin-top:14px;
        padding:15px;
        border-radius:18px;
        background:
          rgba(
            139,
            61,
            255,
            .1
          );
        border:1px solid rgba(
          139,
          61,
          255,
          .2
        );
        display:flex;
        flex-direction:column;
        gap:5px;
      }

      .wheel-challenge[hidden]{
        display:none;
      }

      .wheel-challenge b{
        font-size:14px;
      }

      .wheel-challenge span{
        font-size:13px;
        color:#d3d3da;
      }

      .wheel-challenge small{
        font-size:11px;
        color:#9b9ba5;
      }

    `;

    document.head.appendChild(
      style
    );
  }


  function build() {

    if (
      document.getElementById(
        "arsWheelOverlay"
      )
    ) {
      return;
    }


    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "arsWheelOverlay";

    overlay.className =
      "ars-wheel-overlay";


    overlay.innerHTML = `

      <div class="ars-wheel-panel">

        <div class="ars-wheel-head">

          <h2>
            Wheel
          </h2>

          <button
            class="ars-wheel-close"
            id="wheelClose"
            type="button"
          >
            ×
          </button>

        </div>


        <div class="ars-wheel-sub">
          Two spins every day.
          Rewards and challenges
          both count toward your Streak.
        </div>


        <div class="ars-wheel-stage">

          <div class="ars-wheel-pointer"></div>

          <div
            class="ars-wheel"
            id="arsWheel"
          ></div>

          <div class="ars-wheel-center">
            ΛRS
          </div>

        </div>


        <div class="ars-wheel-info">

          <div class="ars-wheel-badge">
            Spins left:
            <span id="wheelSpins">
              2
            </span>
          </div>

          <div class="ars-wheel-badge">
            Streak:
            <span id="wheelStreak">
              0
            </span>
          </div>

        </div>


        <button
          id="wheelSpin"
          class="ars-wheel-spin"
          type="button"
        >
          Spin
        </button>


        <div
          id="wheelResult"
          class="ars-wheel-result"
        >

          <h3
            id="wheelResultTitle"
          ></h3>

          <p
            id="wheelResultDescription"
          ></p>

          <button
            id="wheelExit"
            class="ars-wheel-exit"
            type="button"
          >
            Exit
          </button>

        </div>


        <div
          id="wheelChallenge"
          class="wheel-challenge"
          hidden
        ></div>

      </div>

    `;


    document.body.appendChild(
      overlay
    );


    overlay.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          overlay ||
          event.target.id ===
          "wheelClose"
        ) {
          closeWheel();
        }

      }
    );


    overlay
      .querySelector(
        "#wheelExit"
      )
      .addEventListener(
        "click",
        closeWheel
      );


    overlay
      .querySelector(
        "#wheelSpin"
      )
      .addEventListener(
        "click",
        spin
      );


    updateUI();
  }


  function updateUI() {

    cleanRewards();

    const left =
      Math.max(
        0,
        MAX_SPINS -
          state.spins
      );

    const spins =
      document.getElementById(
        "wheelSpins"
      );

    const streak =
      document.getElementById(
        "wheelStreak"
      );

    const button =
      document.getElementById(
        "wheelSpin"
      );


    if (spins) {
      spins.textContent =
        String(left);
    }


    if (streak) {
      streak.textContent =
        String(
          streakState()
            .count || 0
        );
    }


    if (button) {
      button.disabled =
        left <= 0 ||
        state.spinning;
    }


    updateChallenge();
  }


  function openWheel() {

    load();

    injectStyles();

    build();

    document
      .getElementById(
        "arsWheelOverlay"
      )
      ?.classList.add(
        "open"
      );

    updateUI();
  }


  function closeWheel() {

    document
      .getElementById(
        "arsWheelOverlay"
      )
      ?.classList.remove(
        "open"
      );

  }


  function spin() {

    if (
      state.spinning ||
      state.spins >=
        MAX_SPINS
    ) {
      return;
    }


    state.spinning =
      true;

    state.spins +=
      1;


    const pool =
      Math.random() < 0.5
        ? rewards
        : challenges;


    const item =
      pool[
        Math.floor(
          Math.random() *
            pool.length
        )
      ];


    state.rotation +=
      1440 +
      Math.floor(
        Math.random() *
          360
      );


    save();


    const wheel =
      document.getElementById(
        "arsWheel"
      );

    const result =
      document.getElementById(
        "wheelResult"
      );

    const title =
      document.getElementById(
        "wheelResultTitle"
      );

    const description =
      document.getElementById(
        "wheelResultDescription"
      );


    result?.classList.remove(
      "show"
    );


    if (wheel) {

      wheel.style.transform =
        `rotate(
          ${state.rotation}deg
        )`;

    }


    setTimeout(
      () => {

        state.spinning =
          false;


        if (
          item.kind ===
          "reward"
        ) {
          applyReward(
            item
          );
        } else {
          setChallenge(
            item
          );
        }


        if (title) {
          title.textContent =
            item.title;
        }


        if (description) {
          description.textContent =
            item.description;
        }


        result?.classList.add(
          "show"
        );


        updateUI();

      },
      4100
    );
  }


  /* INITIALIZE */

  load();

  injectStyles();


  /* CHALLENGES */

  document.addEventListener(
    "ars:post-created",
    () =>
      completeChallenge(
        "post"
      )
  );


  document.addEventListener(
    "ars:story-created",
    () =>
      completeChallenge(
        "story"
      )
  );


  document.addEventListener(
    "ars:streak-updated",
    updateUI
  );


  window.openWheel =
    openWheel;

  window.closeWheel =
    closeWheel;


  window.ARSWheel = {

    open:
      openWheel,

    close:
      closeWheel,

    completeChallenge,

    cleanExpiredRewards:
      () => {
        cleanRewards();
        updateUI();
      }

  };

})();
