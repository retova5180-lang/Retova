(() => {
  "use strict";

  const CONFIG = {
    storageKey: "ars_daily_wheel_state",
    rewardsKey: "ars_user_rewards",
    challengeKey: "ars_active_challenge",
    maxSpinsPerDay: 2,
    animationDuration: 4200
  };

  const rewards = [
    {
      id: "avatar",
      title: "Free Avatar",
      description: "Image avatar for 24 hours."
    },
    {
      id: "vip",
      title: "VIP Badge",
      description: "VIP Badge for 24 hours."
    },
    {
      id: "theme",
      title: "Favorite Theme",
      description: "Favorite theme for 1 hour."
    },
    {
      id: "avatar-2",
      title: "Free Avatar",
      description: "Image avatar for 24 hours."
    },
    {
      id: "vip-2",
      title: "VIP Badge",
      description: "VIP Badge for 24 hours."
    },
    {
      id: "theme-2",
      title: "Favorite Theme",
      description: "Favorite theme for 1 hour."
    }
  ];

  const challenges = [
    {
      id: "post",
      title: "Post Challenge",
      description: "Create a post today."
    },
    {
      id: "like",
      title: "Like Challenge",
      description: "Like 5 posts today."
    },
    {
      id: "comment",
      title: "Comment Challenge",
      description: "Leave 3 comments today."
    },
    {
      id: "repost",
      title: "Repost Challenge",
      description: "Repost 2 posts today."
    },
    {
      id: "story",
      title: "Story Challenge",
      description: "Share a story today."
    },
    {
      id: "save",
      title: "Save Challenge",
      description: "Save 3 posts today."
    },
    {
      id: "profile",
      title: "Profile Challenge",
      description: "Update your profile today."
    },
    {
      id: "explore",
      title: "Explore Challenge",
      description: "Explore new posts today."
    }
  ];

  let state = {
    date: getTodayKey(),
    spins: 0,
    spinning: false,
    lastResult: null
  };

  function getTodayKey() {
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

      if (!value) {
        return fallback;
      }

      return JSON.parse(value);
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
    } catch {
      // Ignore restricted storage.
    }
  }

  function loadState() {
    const saved =
      read(
        CONFIG.storageKey,
        null
      );

    if (
      !saved ||
      saved.date !== getTodayKey()
    ) {
      state = {
        date: getTodayKey(),
        spins: 0,
        spinning: false,
        lastResult: null
      };

      saveState();
      return;
    }

    state.spins =
      Number(saved.spins) || 0;

    state.lastResult =
      saved.lastResult || null;

    state.spinning = false;
  }

  function saveState() {
    write(
      CONFIG.storageKey,
      {
        date: state.date,
        spins: state.spins,
        lastResult: state.lastResult
      }
    );
  }

  function cleanExpiredRewards() {
    const data =
      read(
        CONFIG.rewardsKey,
        {}
      );

    const now = Date.now();

    Object.keys(data).forEach(
      key => {
        if (
          key.endsWith("Until") &&
          Number(data[key]) <= now
        ) {
          delete data[key];
        }
      }
    );

    write(
      CONFIG.rewardsKey,
      data
    );
  }

  function applyReward(reward) {
    const data =
      read(
        CONFIG.rewardsKey,
        {}
      );

    const now = Date.now();

    if (
      reward.id === "avatar" ||
      reward.id === "avatar-2"
    ) {
      data.freeAvatarUntil =
        now + 86400000;
    }

    if (
      reward.id === "vip" ||
      reward.id === "vip-2"
    ) {
      data.vipUntil =
        now + 86400000;
    }

    if (
      reward.id === "theme" ||
      reward.id === "theme-2"
    ) {
      data.favoriteThemeUntil =
        now + 3600000;
    }

    data.lastReward = {
      id: reward.id,
      title: reward.title,
      description: reward.description,
      receivedAt: now
    };

    write(
      CONFIG.rewardsKey,
      data
    );

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
  }

  function pickResult() {
    const combined = [
      ...rewards.map(item => ({
        ...item,
        type: "reward"
      })),
      ...challenges.map(item => ({
        ...item,
        type: "challenge"
      }))
    ];

    return combined[
      Math.floor(
        Math.random() *
        combined.length
      )
    ];
  }

  function wheelHTML() {
    return `
      <div class="ars-wheel-overlay">

        <div
          class="ars-wheel-backdrop"
          data-wheel-close
        ></div>

        <div
          class="ars-wheel-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Daily Wheel"
        >

          <button
            class="ars-wheel-close"
            type="button"
            data-wheel-close
            aria-label="Close"
          >
            ×
          </button>

          <div class="ars-wheel-header">
            <div class="ars-wheel-brand">
              ΛRS
            </div>

            <h2>
              Daily Wheel
            </h2>

            <p>
              Spin twice a day for a reward or challenge.
            </p>
          </div>

          <div class="ars-wheel-stage">

            <div class="ars-wheel-pointer">
              ▼
            </div>

            <div
              id="arsWheelCircle"
              class="ars-wheel-circle"
            >
              <span>ΛRS</span>
            </div>

          </div>

          <div class="ars-wheel-info">

            <div class="ars-wheel-badge">
              Spins left:
              <strong id="arsWheelSpins">
                2
              </strong>
            </div>

          </div>

          <button
            id="arsWheelSpin"
            class="ars-wheel-spin"
            type="button"
          >
            Spin the Wheel
          </button>

          <div
            id="arsWheelResult"
            class="ars-wheel-result hidden"
          >

            <div
              id="arsWheelResultType"
              class="ars-wheel-result-type"
            ></div>

            <h3
              id="arsWheelResultTitle"
            ></h3>

            <p
              id="arsWheelResultDescription"
            ></p>

            <button
              id="arsWheelResultButton"
              type="button"
            >
              Close
            </button>

          </div>

          <div
            id="arsWheelChallenge"
            class="ars-wheel-challenge hidden"
          ></div>

        </div>

      </div>
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
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .ars-wheel-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.82);
        backdrop-filter: blur(18px);
      }

      .ars-wheel-panel {
        position: relative;
        z-index: 2;
        width: min(520px,100%);
        max-height: 94vh;
        overflow: auto;
        padding: 28px 22px 24px;
        border-radius: 32px;
        border: 1px solid rgba(255,255,255,.08);
        background:
          radial-gradient(
            circle at 50% 20%,
            rgba(139,61,255,.12),
            transparent 38%
          ),
          #101014;
        box-shadow:
          0 35px 100px rgba(0,0,0,.7);
      }

      .ars-wheel-close {
        position: absolute;
        right: 15px;
        top: 15px;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: rgba(255,255,255,.07);
        color: #fff;
        font-size: 26px;
      }

      .ars-wheel-header {
        text-align: center;
      }

      .ars-wheel-brand {
        color: #bd8bff;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 2px;
      }

      .ars-wheel-header h2 {
        margin-top: 7px;
        font-size: 25px;
      }

      .ars-wheel-header p {
        margin-top: 7px;
        color: #8f8f9b;
        font-size: 12px;
      }

      .ars-wheel-stage {
        position: relative;
        width: min(330px, 82vw);
        aspect-ratio: 1;
        margin: 28px auto;
      }

      .ars-wheel-pointer {
        position: absolute;
        z-index: 5;
        top: -13px;
        left: 50%;
        transform: translateX(-50%);
        color: #fff;
        font-size: 27px;
        filter:
          drop-shadow(
            0 0 8px rgba(197,77,255,.8)
          );
      }

      .ars-wheel-circle {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 8px solid #241735;
        background:
          conic-gradient(
            #8b3dff 0deg 45deg,
            #18151d 45deg 90deg,
            #c54dff 90deg 135deg,
            #18151d 135deg 180deg,
            #8b3dff 180deg 225deg,
            #18151d 225deg 270deg,
            #c54dff 270deg 315deg,
            #18151d 315deg 360deg
          );
        box-shadow:
          0 0 45px rgba(139,61,255,.28),
          inset 0 0 35px rgba(0,0,0,.5);
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
          transform 4.2s cubic-bezier(.12,.8,.12,1);
      }

      .ars-wheel-circle span {
        width: 78px;
        height: 78px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0b0b0e;
        border: 3px solid #bd8bff;
        color: #fff;
        font-weight: 800;
        box-shadow:
          0 0 25px rgba(139,61,255,.55);
      }

      .ars-wheel-info {
        display: flex;
        justify-content: center;
      }

      .ars-wheel-badge {
        padding: 9px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,.055);
        border: 1px solid rgba(255,255,255,.07);
        color: #a7a7b3;
        font-size: 12px;
      }

      .ars-wheel-badge strong {
        color: #fff;
        margin-left: 4px;
      }

      .ars-wheel-spin {
        width: 100%;
        margin-top: 17px;
        padding: 14px;
        border-radius: 17px;
        background:
          linear-gradient(
            135deg,
            #8b3dff,
            #c54dff
          );
        color: #fff;
        font-weight: 800;
        box-shadow:
          0 10px 30px rgba(139,61,255,.3);
      }

      .ars-wheel-spin:disabled {
        opacity: .45;
      }

      .ars-wheel-result {
        margin-top: 17px;
        padding: 20px;
        text-align: center;
        border-radius: 22px;
        background: rgba(255,255,255,.045);
        border: 1px solid rgba(255,255,255,.07);
      }

      .ars-wheel-result.hidden,
      .ars-wheel-challenge.hidden {
        display: none;
      }

      .ars-wheel-result-type {
        color: #bd8bff;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .ars-wheel-result h3 {
        margin-top: 7px;
        font-size: 19px;
      }

      .ars-wheel-result p {
        margin-top: 7px;
        color: #a3a3ad;
        font-size: 13px;
        line-height: 1.6;
      }

      .ars-wheel-result button {
        margin-top: 15px;
        padding: 11px 18px;
        border-radius: 14px;
        background: #26232d;
        font-weight: 700;
      }

      .ars-wheel-challenge {
        margin-top: 12px;
        padding: 14px;
        border-radius: 18px;
        background: rgba(139,61,255,.08);
        border: 1px solid rgba(139,61,255,.2);
        color: #cdb6ff;
        font-size: 12px;
        text-align: center;
      }

      @media (max-width: 520px) {
        .ars-wheel-panel {
          padding: 24px 15px 18px;
        }

        .ars-wheel-stage {
          width: min(290px, 82vw);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function showResult(result) {
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

    if (!resultBox || !title || !description) {
      return;
    }

    if (type) {
      type.textContent =
        result.type === "reward"
          ? "Reward"
          : "Challenge";
    }

    title.textContent =
      result.title;

    description.textContent =
      result.description;

    resultBox.classList.remove(
      "hidden"
    );
  }

  function spin() {
    if (state.spinning) {
      return;
    }

    const remaining =
      CONFIG.maxSpinsPerDay -
      state.spins;

    if (remaining <= 0) {
      return;
    }

    state.spinning = true;
    state.spins += 1;

    const result =
      Math.random() < 0.5
        ? rewards[
            Math.floor(
              Math.random() *
              rewards.length
            )
          ]
        : challenges[
            Math.floor(
              Math.random() *
              challenges.length
            )
          ];

    state.lastResult = result;

    saveState();

    const wheel =
      document.getElementById(
        "arsWheelCircle"
      );

    const spinButton =
      document.getElementById(
        "arsWheelSpin"
      );

    if (spinButton) {
      spinButton.disabled = true;
    }

    if (wheel) {
      const randomTurns =
        5 + Math.floor(
          Math.random() * 4
        );

      const randomDegrees =
        Math.floor(
          Math.random() * 360
        );

      wheel.style.transform =
        `rotate(${randomTurns * 360 + randomDegrees}deg)`;
    }

    window.setTimeout(
      () => {
        if (
          result.type === "reward"
        ) {
          applyReward(result);
        } else {
          write(
            CONFIG.challengeKey,
            {
              ...result,
              expiresAt:
                Date.now() +
                3600000
            }
          );
        }

        showResult(result);
        updateUI();

        state.spinning = false;

        if (spinButton) {
          spinButton.disabled =
            state.spins >=
            CONFIG.maxSpinsPerDay;
        }
      },
      CONFIG.animationDuration
    );
  }

  function updateUI() {
    cleanExpiredRewards();

    const spins =
      document.getElementById(
        "arsWheelSpins"
      );

    const button =
      document.getElementById(
        "arsWheelSpin"
      );

    const remaining =
      Math.max(
        0,
        CONFIG.maxSpinsPerDay -
        state.spins
      );

    if (spins) {
      spins.textContent =
        remaining;
    }

    if (button) {
      button.disabled =
        remaining <= 0 ||
        state.spinning;
    }
  }

  function cleanExpiredRewards() {
    cleanExpiredRewardStorage();

    const challenge =
      read(
        CONFIG.challengeKey,
        null
      );

    if (
      challenge &&
      challenge.expiresAt <= Date.now()
    ) {
      localStorage.removeItem(
        CONFIG.challengeKey
      );
    }
  }

  function cleanExpiredRewardStorage() {
    const data =
      read(
        CONFIG.rewardsKey,
        {}
      );

    const now =
      Date.now();

    Object.keys(data).forEach(
      key => {
        if (
          key.endsWith("Until") &&
          Number(data[key]) <= now
        ) {
          delete data[key];
        }
      }
    );

    write(
      CONFIG.rewardsKey,
      data
    );
  }

  function openWheel() {
    injectStyles();

    const existing =
      document.querySelector(
        ".ars-wheel-overlay"
      );

    if (existing) {
      return;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      wheelHTML()
    );

    loadState();
    updateUI();

    const overlay =
      document.querySelector(
        ".ars-wheel-overlay"
      );

    overlay
      ?.querySelectorAll(
        "[data-wheel-close]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          closeWheel
        );
      });

    document
      .getElementById(
        "arsWheelSpin"
      )
      ?.addEventListener(
        "click",
        spin
      );

    document
      .getElementById(
        "arsWheelResultButton"
      )
      ?.addEventListener(
        "click",
        () => {
          document
            .getElementById(
              "arsWheelResult"
            )
            ?.classList.add(
              "hidden"
            );
        }
      );
  }

  function closeWheel() {
    document
      .querySelector(
        ".ars-wheel-overlay"
      )
      ?.remove();
  }

  function read(key, fallback) {
    try {
      const value =
        localStorage.getItem(key);

      if (!value) {
        return fallback;
      }

      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  window.openWheel =
    openWheel;

  window.closeWheel =
    closeWheel;

  window.ARSWheel = {
    open: openWheel,
    close: closeWheel,
    cleanExpiredRewards
  };
})();
