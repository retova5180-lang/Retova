(() => {
  "use strict";

  const STATE_KEY = "ars_daily_wheel_state";
  const REWARD_KEY = "ars_user_rewards";
  const CHALLENGE_KEY = "ars_active_challenge";

  const MAX_SPINS = 2;
  const SPIN_DURATION = 4100;

  const rewards = [
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
    },
    {
      id: "avatar-2",
      title: "Free Avatar",
      description:
        "Use an image avatar for 24 hours.",
      kind: "reward"
    },
    {
      id: "vip-2",
      title: "VIP Badge",
      description:
        "Show a VIP badge for 24 hours.",
      kind: "reward"
    },
    {
      id: "theme-2",
      title: "Favorite Theme",
      description:
        "Unlock your favorite theme for 1 hour.",
      kind: "reward"
    },
    {
      id: "bonus",
      title: "Lucky Bonus",
      description:
        "You found a Lucky Bonus from the wheel.",
      kind: "reward"
    }
  ];

  const challenges = [
    {
      id: "post",
      title: "Post Challenge",
      description:
        "Create a post today.",
      kind: "challenge"
    },
    {
      id: "like",
      title: "Like Challenge",
      description:
        "Like 5 posts today.",
      kind: "challenge"
    },
    {
      id: "comment",
      title: "Comment Challenge",
      description:
        "Leave 3 replies today.",
      kind: "challenge"
    },
    {
      id: "repost",
      title: "Repost Challenge",
      description:
        "Repost 2 posts today.",
      kind: "challenge"
    },
    {
      id: "story",
      title: "Story Challenge",
      description:
        "Share a story today.",
      kind: "challenge"
    },
    {
      id: "save",
      title: "Save Challenge",
      description:
        "Save 3 posts today.",
      kind: "challenge"
    }
  ];

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;"
      }[character])
    );

  function todayKey() {
    const date = new Date();

    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getDate()
      ).padStart(2, "0")
    ].join("-");
  }

  function read(key, fallback) {
    try {
      const value =
        localStorage.getItem(key);

      return value
        ? JSON.parse(value)
        : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error(
        "ΛRS wheel storage error:",
        error
      );
    }
  }

  let state = {
    date: todayKey(),
    spins: 0,
    rotation: 0,
    result: null
  };

  function load() {
    const saved =
      read(STATE_KEY, null);

    const today =
      todayKey();

    if (
      !saved ||
      saved.date !== today
    ) {
      state = {
        date: today,
        spins: 0,
        rotation: 0,
        result: null
      };

      save();

      return;
    }

    state = {
      date: today,
      spins:
        Number(saved.spins) || 0,
      rotation:
        Number(saved.rotation) || 0,
      result:
        saved.result || null
    };
  }

  function save() {
    write(
      STATE_KEY,
      state
    );
  }

  function cleanExpiredRewards() {
    const rewardsState =
      read(REWARD_KEY, {});

    const now = Date.now();

    let changed = false;

    [
      "freeAvatarUntil",
      "vipUntil",
      "favoriteThemeUntil"
    ].forEach((key) => {
      if (
        Number(rewardsState[key]) &&
        Number(rewardsState[key]) <= now
      ) {
        delete rewardsState[key];
        changed = true;
      }
    });

    if (changed) {
      write(
        REWARD_KEY,
        rewardsState
      );
    }
  }

  function applyReward(reward) {
    const rewardsState =
      read(REWARD_KEY, {});

    const now = Date.now();

    if (
      reward.id.startsWith(
        "avatar"
      )
    ) {
      rewardsState.freeAvatarUntil =
        now + 86400000;
    }

    if (
      reward.id.startsWith(
        "vip"
      )
    ) {
      rewardsState.vipUntil =
        now + 86400000;
    }

    if (
      reward.id.startsWith(
        "theme"
      )
    ) {
      rewardsState.favoriteThemeUntil =
        now + 3600000;
    }

    rewardsState.lastReward = {
      id: reward.id,
      title: reward.title,
      description:
        reward.description,
      receivedAt: now
    };

    write(
      REWARD_KEY,
      rewardsState
    );

    window.dispatchEvent(
      new CustomEvent(
        "ars:reward-applied",
        {
          detail: {
            reward,
            rewards:
              rewardsState
          }
        }
      )
    );
  }

  function setChallenge(challenge) {
    write(
      CHALLENGE_KEY,
      {
        ...challenge,
        expiresAt:
          Date.now() +
          86400000,
        progress: 0
      }
    );

    updateChallenge();
  }

  function requiredForChallenge(id) {
    if (id === "like") {
      return 5;
    }

    if (id === "comment") {
      return 3;
    }

    if (id === "repost") {
      return 2;
    }

    if (id === "save") {
      return 3;
    }

    return 1;
  }

  function completeChallenge(id) {
    const challenge =
      read(
        CHALLENGE_KEY,
        null
      );

    if (
      !challenge ||
      challenge.id !== id ||
      Number(
        challenge.expiresAt
      ) <= Date.now()
    ) {
      return false;
    }

    const required =
      requiredForChallenge(
        id
      );

    const progress =
      Math.min(
        required,
        (Number(
          challenge.progress
        ) || 0) + 1
      );

    challenge.progress =
      progress;

    challenge.required =
      required;

    if (
      progress >= required
    ) {
      challenge.completed =
        true;

      challenge.completedAt =
        Date.now();
    }

    write(
      CHALLENGE_KEY,
      challenge
    );

    updateChallenge();

    return (
      progress >= required
    );
  }

  function updateChallenge() {
    const box =
      document.getElementById(
        "wheelChallenge"
      );

    if (!box) return;

    const challenge =
      read(
        CHALLENGE_KEY,
        null
      );

    if (
      !challenge ||
      Number(
        challenge.expiresAt
      ) <= Date.now()
    ) {
      box.hidden = true;

      localStorage.removeItem(
        CHALLENGE_KEY
      );

      return;
    }

    const required =
      Number(
        challenge.required
      ) ||
      requiredForChallenge(
        challenge.id
      );

    const progress =
      Math.min(
        required,
        Number(
          challenge.progress
        ) || 0
      );

    box.hidden = false;

    box.innerHTML = `
      <b>
        ${esc(challenge.title)}
      </b>

      <span>
        ${esc(
          challenge.description
        )}
      </span>

      <small>
        ${progress}/${required}
        completed
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
      .ars-wheel-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(18px);
      }

      .ars-wheel-overlay.open {
        display: flex;
      }

      .ars-wheel-panel {
        width: min(470px, 100%);
        max-height: 92vh;
        overflow: auto;
        background:
          linear-gradient(
            180deg,
            #15151A,
            #0D0D10
          );
        border:
          1px solid rgba(255, 255, 255, 0.08);
        border-radius: 30px;
        padding: 20px;
        box-shadow:
          0 30px 90px rgba(0, 0, 0, 0.65);
      }

      .ars-wheel-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .ars-wheel-head h2 {
        font-size: 24px;
      }

      .ars-wheel-close {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background:
          rgba(255, 255, 255, 0.07);
        font-size: 24px;
      }

      .ars-wheel-sub {
        color: #8F8F99;
        font-size: 13px;
        line-height: 1.6;
        margin: 4px 0 18px;
      }

      .ars-wheel-stage {
        position: relative;
        width: min(320px, 78vw);
        aspect-ratio: 1;
        margin: 0 auto 18px;
      }

      .ars-wheel-pointer {
        position: absolute;
        z-index: 4;
        top: -5px;
        left: 50%;
        transform: translateX(-50%);
        border-left:
          14px solid transparent;
        border-right:
          14px solid transparent;
        border-top:
          28px solid #FFFFFF;
        filter:
          drop-shadow(
            0 4px 8px rgba(0, 0, 0, 0.5)
          );
      }

      .ars-wheel {
        width: 100%;
        height: 100%;
        border: 8px solid #26262E;
        border-radius: 50%;
        background:
          conic-gradient(
            #8B3DFF 0deg 45deg,
            #24242B 45deg 90deg,
            #C54DFF 90deg 135deg,
            #24242B 135deg 180deg,
            #8B3DFF 180deg 225deg,
            #24242B 225deg 270deg,
            #C54DFF 270deg 315deg,
            #24242B 315deg 360deg
          );
        transition:
          transform 4s
          cubic-bezier(
            0.12,
            0.82,
            0.18,
            1
          );
        box-shadow:
          0 0 45px
          rgba(139, 61, 255, 0.25);
      }

      .ars-wheel-center {
        position: absolute;
        left: 50%;
        top: 50%;
        transform:
          translate(-50%, -50%);
        width: 82px;
        height: 82px;
        border-radius: 50%;
        background:
          linear-gradient(
            135deg,
            #8B3DFF,
            #C54DFF
          );
        border:
          5px solid #09090B;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        z-index: 3;
      }

      .ars-wheel-info {
        display: flex;
        justify-content: center;
        margin-bottom: 14px;
      }

      .ars-wheel-badge {
        padding: 8px 12px;
        border-radius: 999px;
        background:
          rgba(139, 61, 255, 0.13);
        color: #CDA8FF;
        font-size: 12px;
        font-weight: 800;
      }

      .ars-wheel-spin {
        width: 100%;
        height: 54px;
        border-radius: 17px;
        background:
          linear-gradient(
            135deg,
            #8B3DFF,
            #C54DFF
          );
        font-weight: 800;
        font-size: 16px;
      }

      .ars-wheel-spin:disabled {
        opacity: 0.4;
      }

      .ars-wheel-result {
        display: none;
        margin-top: 14px;
        padding: 18px;
        border-radius: 20px;
        background:
          rgba(255, 255, 255, 0.045);
        border:
          1px solid rgba(255, 255, 255, 0.07);
        text-align: center;
      }

      .ars-wheel-result.show {
        display: block;
      }

      .ars-wheel-result h3 {
        font-size: 20px;
      }

      .ars-wheel-result p {
        color: #AAAAAF;
        line-height: 1.6;
        margin-top: 6px;
      }

      .ars-wheel-exit {
        margin-top: 14px;
        width: 100%;
        height: 46px;
        border-radius: 14px;
        background:
          rgba(255, 255, 255, 0.08);
        font-weight: 700;
      }

      .wheel-challenge {
        margin-top: 14px;
        padding: 15px;
        border-radius: 18px;
        background:
          rgba(139, 61, 255, 0.1);
        border:
          1px solid rgba(139, 61, 255, 0.2);
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .wheel-challenge[hidden] {
        display: none;
      }

      .wheel-challenge b {
        font-size: 14px;
      }

      .wheel-challenge span {
        font-size: 13px;
        color: #D3D3DA;
      }

      .wheel-challenge small {
        font-size: 11px;
        color: #9B9BA5;
      }

      @media (max-width: 520px) {
        .ars-wheel-panel {
          padding: 17px;
          border-radius: 25px;
        }

        .ars-wheel-stage {
          width: min(300px, 82vw);
        }
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
      <div
        class="ars-wheel-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Daily Wheel"
      >
        <div class="ars-wheel-head">
          <h2>
            Daily Wheel
          </h2>

          <button
            class="ars-wheel-close"
            id="wheelClose"
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p class="ars-wheel-sub">
          Two spins every day.
          Land on a reward or a challenge.
        </p>

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

        <div class="ars-wheel-info">
          <div class="ars-wheel-badge">
            Spins left:
            <span id="wheelSpins">
              2
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
            Close
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
      ?.addEventListener(
        "click",
        closeWheel
      );

    overlay
      .querySelector(
        "#wheelSpin"
      )
      ?.addEventListener(
        "click",
        spin
      );
  }

  function updateUI() {
    cleanExpiredRewards();

    const spinsLeft =
      Math.max(
        0,
        MAX_SPINS -
          state.spins
      );

    const spinsElement =
      document.getElementById(
        "wheelSpins"
      );

    const spinButton =
      document.getElementById(
        "wheelSpin"
      );

    if (spinsElement) {
      spinsElement.textContent =
        String(spinsLeft);
    }

    if (spinButton) {
      spinButton.disabled =
        spinsLeft <= 0 ||
        state.spinning;
    }

    updateChallenge();
  }

  function openWheel() {
    load();
    injectStyles();
    build();

    const overlay =
      document.getElementById(
        "arsWheelOverlay"
      );

    if (!overlay) return;

    overlay.classList.add(
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

  function pickResult() {
    const pool =
      Math.random() < 0.5
        ? rewards
        : challenges;

    return pool[
      Math.floor(
        Math.random() *
          pool.length
      )
    ];
  }

  function spin() {
    if (
      state.spinning ||
      state.spins >=
        MAX_SPINS
    ) {
      return;
    }

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

    if (
      !wheel ||
      !result ||
      !title ||
      !description
    ) {
      return;
    }

    state.spinning =
      true;

    state.spins += 1;

    state.result =
      pickResult();

    state.rotation +=
      1440 +
      Math.floor(
        Math.random() *
          360
      );

    save();

    result.classList.remove(
      "show"
    );

    wheel.style.transform =
      `rotate(${state.rotation}deg)`;

    updateUI();

    window.setTimeout(
      () => {
        state.spinning =
          false;

        if (
          state.result.kind ===
          "reward"
        ) {
          applyReward(
            state.result
          );
        } else {
          setChallenge(
            state.result
          );
        }

        title.textContent =
          state.result.title;

        description.textContent =
          state.result.description;

        result.classList.add(
          "show"
        );

        save();

        updateUI();
      },
      SPIN_DURATION
    );
  }

  load();
  injectStyles();

  document.addEventListener(
    "ars:post-created",
    () => {
      completeChallenge(
        "post"
      );
    }
  );

  document.addEventListener(
    "ars:story-created",
    () => {
      completeChallenge(
        "story"
      );
    }
  );

  window.openWheel =
    openWheel;

  window.closeWheel =
    closeWheel;

  window.ARSWheel = {
    open: openWheel,
    close: closeWheel,
    completeChallenge,

    cleanExpiredRewards:
      () => {
        cleanExpiredRewards();
        updateUI();
      }
  };
})();
