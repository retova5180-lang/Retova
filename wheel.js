(() => {
  "use strict";

  const CONFIG = {
    storageKey:
      "ars_daily_wheel_state",

    rewardsKey:
      "ars_user_rewards",

    maxSpinsPerDay: 2,

    animationDuration: 4200
  };

  const rewards = [
    {
      id: "avatar",
      title: "Free Avatar",
      description:
        "Use an image avatar for 24 hours."
    },
    {
      id: "vip",
      title: "VIP Badge",
      description:
        "Display a VIP badge for 24 hours."
    },
    {
      id: "theme",
      title: "Favorite Theme",
      description:
        "Unlock your favorite theme for 1 hour."
    },
    {
      id: "lucky",
      title: "Lucky Bonus",
      description:
        "A little ΛRS bonus has been added to your rewards."
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
        "Leave 3 comments today."
    },
    {
      id: "repost",
      title: "Repost Challenge",
      description:
        "Repost 2 posts today."
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
        "Save 3 posts today."
    }
  ];

  let state = {
    date: getTodayKey(),
    spins: 0,
    spinning: false,
    lastResult: null
  };

  function getTodayKey() {
    const date =
      new Date();

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
        localStorage.getItem(
          key
        );

      if (!value) {
        return fallback;
      }

      return JSON.parse(
        value
      );
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
      return;
    }
  }

  function loadState() {
    const saved =
      read(
        CONFIG.storageKey,
        null
      );

    const today =
      getTodayKey();

    if (
      !saved ||
      saved.date !== today
    ) {
      state = {
        date: today,
        spins: 0,
        spinning: false,
        lastResult: null
      };

      saveState();

      return;
    }

    state.date =
      today;

    state.spins =
      Math.max(
        0,
        Math.min(
          CONFIG.maxSpinsPerDay,
          Number(saved.spins) || 0
        )
      );

    state.spinning =
      false;

    state.lastResult =
      saved.lastResult ||
      null;
  }

  function saveState() {
    write(
      CONFIG.storageKey,
      {
        date: state.date,
        spins: state.spins,
        lastResult:
          state.lastResult
      }
    );
  }

  function cleanRewards() {
    const data =
      read(
        CONFIG.rewardsKey,
        {}
      );

    const now =
      Date.now();

    Object.keys(
      data
    ).forEach(
      (key) => {
        if (
          key.endsWith(
            "Until"
          ) &&
          Number(data[key]) <=
            now
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

  function applyReward(
    reward
  ) {
    const data =
      read(
        CONFIG.rewardsKey,
        {}
      );

    const now =
      Date.now();

    if (
      reward.id ===
      "avatar"
    ) {
      data.freeAvatarUntil =
        now + 86400000;
    }

    if (
      reward.id ===
      "vip"
    ) {
      data.vipUntil =
        now + 86400000;
    }

    if (
      reward.id ===
      "theme"
    ) {
      data.favoriteThemeUntil =
        now + 3600000;
    }

    if (
      reward.id ===
      "lucky"
    ) {
      data.luckyBonus =
        Number(
          data.luckyBonus
        ) + 1;
    }

    data.lastReward = {
      id: reward.id,
      title: reward.title,
      description:
        reward.description,
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
      ...rewards.map(
        (item) => ({
          ...item,
          type: "reward"
        })
      ),
      ...challenges.map(
        (item) => ({
          ...item,
          type: "challenge"
        })
      )
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

        <section
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

              <div class="wheel-segment segment-one">
                Reward
              </div>

              <div class="wheel-segment segment-two">
                Challenge
              </div>

              <div class="wheel-segment segment-three">
                Reward
              </div>

              <div class="wheel-segment segment-four">
                Challenge
              </div>

              <div class="wheel-segment segment-five">
                Reward
              </div>

              <div class="wheel-segment segment-six">
                Challenge
              </div>

              <div class="wheel-segment segment-seven">
                Reward
              </div>

              <div class="wheel-segment segment-eight">
                Challenge
              </div>

              <div class="ars-wheel-center">
                ΛRS
              </div>

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

        </section>

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

        background: rgba(0, 0, 0, 0.84);
        backdrop-filter: blur(18px);
      }

      .ars-wheel-panel {
        position: relative;
        z-index: 2;

        width: min(520px, 100%);
        max-height: 94vh;

        overflow-y: auto;

        padding: 28px 22px 24px;

        border-radius: 32px;

        border: 1px solid rgba(255, 255, 255, 0.08);

        background:
          radial-gradient(
            circle at 50% 20%,
            rgba(139, 61, 255, 0.13),
            transparent 38%
          ),
          #101014;

        box-shadow:
          0 35px 100px rgba(0, 0, 0, 0.7);
      }

      .ars-wheel-close {
        position: absolute;

        right: 15px;
        top: 15px;

        width: 42px;
        height: 42px;

        border-radius: 50%;

        background: rgba(255, 255, 255, 0.07);

        color: #ffffff;

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

        color: #ffffff;

        font-size: 27px;

        filter:
          drop-shadow(
            0 0 8px rgba(197, 77, 255, 0.8)
          );
      }

      .ars-wheel-circle {
        position: relative;

        width: 100%;
        height: 100%;

        overflow: hidden;

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
          0 0 45px rgba(139, 61, 255, 0.28),
          inset 0 0 35px rgba(0, 0, 0, 0.5);

        transition:
          transform 4.2s cubic-bezier(
            0.15,
            0.8,
            0.12,
            1
          );
      }

      .wheel-segment {
        position: absolute;

        left: 50%;
        top: 50%;

        width: 110px;

        transform-origin: 0 50%;

        color: rgba(255, 255, 255, 0.88);

        font-size: 11px;
        font-weight: 800;

        text-align: center;

        pointer-events: none;
      }

      .segment-one {
        transform:
          rotate(22deg)
          translateX(75px);
      }

      .segment-two {
        transform:
          rotate(67deg)
          translateX(75px);
      }

      .segment-three {
        transform:
          rotate(112deg)
          translateX(75px);
      }

      .segment-four {
        transform:
          rotate(157deg)
          translateX(75px);
      }

      .segment-five {
        transform:
          rotate(202deg)
          translateX(75px);
      }

      .segment-six {
        transform:
          rotate(247deg)
          translateX(75px);
      }

      .segment-seven {
        transform:
          rotate(292deg)
          translateX(75px);
      }

      .segment-eight {
        transform:
          rotate(337deg)
          translateX(75px);
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

        display: flex;
        align-items: center;
        justify-content: center;

        background:
          radial-gradient(
            circle,
            #c54dff,
            #8b3dff 58%,
            #4b197d
          );

        border:
          4px solid rgba(
            255,
            255,
            255,
            0.86
          );

        box-shadow:
          0 0 30px rgba(
            197,
            77,
            255,
            0.5
          );

        color: #ffffff;

        font-size: 18px;
        font-weight: 900;
      }

      .ars-wheel-info {
        display: flex;
        justify-content: center;
      }

      .ars-wheel-badge {
        padding: 9px 14px;

        border-radius: 999px;

        background:
          rgba(255, 255, 255, 0.06);

        color: #8f8f9b;

        font-size: 12px;
      }

      .ars-wheel-badge strong {
        color: #ffffff;
      }

      .ars-wheel-spin {
        display: block;

        width: 100%;

        margin-top: 18px;

        padding: 15px;

        border-radius: 17px;

        background:
          linear-gradient(
            135deg,
            #8b3dff,
            #c54dff
          );

        color: #ffffff;

        font-size: 13px;
        font-weight: 800;

        box-shadow:
          0 12px 30px rgba(
            139,
            61,
            255,
            0.3
          );
      }

      .ars-wheel-spin:disabled {
        opacity: 0.45;
      }

      .ars-wheel-result {
        margin-top: 18px;

        padding: 18px;

        border-radius: 20px;

        background:
          rgba(255, 255, 255, 0.055);

        border:
          1px solid rgba(
            255,
            255,
            255,
            0.07
          );

        text-align: center;
      }

      .ars-wheel-result-type {
        color: #bd8bff;

        font-size: 10px;
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

        color: #9a9aa5;

        font-size: 12px;
        line-height: 1.5;
      }

      .ars-wheel-result button {
        margin-top: 15px;

        padding: 10px 18px;

        border-radius: 999px;

        background:
          rgba(255, 255, 255, 0.08);

        color: #ffffff;

        font-size: 11px;
        font-weight: 700;
      }

      @media (max-width: 600px) {
        .ars-wheel-panel {
          border-radius: 27px;
          padding: 25px 17px 20px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function updateUI() {
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
        String(remaining);
    }

    if (button) {
      button.disabled =
        state.spinning ||
        remaining <= 0;

      button.textContent =
        remaining <= 0
          ? "No Spins Left Today"
          : state.spinning
          ? "Spinning..."
          : "Spin the Wheel";
    }
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

    if (
      !resultBox ||
      !type ||
      !title ||
      !description
    ) {
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

    resultBox.classList.remove(
      "hidden"
    );
  }

  function spin() {
    if (
      state.spinning ||
      state.spins >=
        CONFIG.maxSpinsPerDay
    ) {
      return;
    }

    const circle =
      document.getElementById(
        "arsWheelCircle"
      );

    if (!circle) {
      return;
    }

    state.spinning = true;

    state.spins += 1;

    const result =
      pickResult();

    state.lastResult = {
      ...result,
      time: Date.now()
    };

    saveState();

    updateUI();

    const rotations =
      1440 +
      Math.floor(
        Math.random() * 1080
      );

    const offset =
      Math.floor(
        Math.random() * 360
      );

    circle.style.transform =
      `rotate(${rotations + offset}deg)`;

    window.setTimeout(
      () => {
        state.spinning = false;

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

        updateUI();
      },
      CONFIG.animationDuration
    );
  }

  function closeWheel() {
    const overlay =
      document.querySelector(
        ".ars-wheel-overlay"
      );

    if (overlay) {
      overlay.remove();
    }

    document.body.style.overflow =
      "";
  }

  function openWheel() {
    cleanRewards();
    loadState();
    injectStyles();

    const old =
      document.querySelector(
        ".ars-wheel-overlay"
      );

    if (old) {
      old.remove();
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      wheelHTML()
    );

    document.body.style.overflow =
      "hidden";

    document
      .querySelectorAll(
        "[data-wheel-close]"
      )
      .forEach(
        (element) => {
          element.addEventListener(
            "click",
            closeWheel
          );
        }
      );

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

    updateUI();
  }

  window.openWheel =
    openWheel;

  window.ARSWheel = {
    open: openWheel,
    close: closeWheel,
    getState: () => ({
      ...state
    })
  };
})();
