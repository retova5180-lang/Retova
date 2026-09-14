(() => {
  "use strict";

  const KEY = "ars_daily_wheel";

  const MAX = 2;


  const rewards = [

    {
      title: "Free Avatar",
      description:
        "Use an image avatar for 24 hours.",
      kind: "reward",
      id: "avatar"
    },

    {
      title: "VIP Badge",
      description:
        "Show the VIP badge for 24 hours.",
      kind: "reward",
      id: "vip"
    },

    {
      title: "Favorite Theme",
      description:
        "Unlock a special theme for 1 hour.",
      kind: "reward",
      id: "theme"
    },

    {
      title: "Free Avatar",
      description:
        "Use an image avatar for 24 hours.",
      kind: "reward",
      id: "avatar2"
    },

    {
      title: "Lucky Bonus",
      description:
        "A little ΛRS surprise was added to your rewards.",
      kind: "reward",
      id: "lucky"
    },

    {
      title: "VIP Badge",
      description:
        "Show the VIP badge for 24 hours.",
      kind: "reward",
      id: "vip2"
    }

  ];


  const challenges = [

    {
      title: "Post Challenge",
      description:
        "Create a post today.",
      id: "post",
      kind: "challenge"
    },

    {
      title: "Like Challenge",
      description:
        "Like 5 posts today.",
      id: "like",
      target: 5,
      kind: "challenge"
    },

    {
      title: "Comment Challenge",
      description:
        "Leave a reply on a post today.",
      id: "comment",
      kind: "challenge"
    },

    {
      title: "Repost Challenge",
      description:
        "Repost a post today.",
      id: "repost",
      kind: "challenge"
    },

    {
      title: "Story Challenge",
      description:
        "Share a story today.",
      id: "story",
      kind: "challenge"
    },

    {
      title: "Save Challenge",
      description:
        "Save a post today.",
      id: "save",
      kind: "challenge"
    }

  ];


  const $ =
    selector =>
      document.querySelector(
        selector
      );


  const read =
    (key, fallback) => {

      try {

        return (
          JSON.parse(
            localStorage.getItem(
              key
            )
          ) ?? fallback
        );

      }

      catch {

        return fallback;

      }

    };


  const write =
    (key, value) => {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

    };


  const today = () => {

    const date =
      new Date();

    return (
      date.getFullYear() +
      "-" +
      String(
        date.getMonth() + 1
      ).padStart(2, "0") +
      "-" +
      String(
        date.getDate()
      ).padStart(2, "0")
    );

  };


  let state = {

    date:
      today(),

    spins: 0,

    rotation: 0

  };


  /* -----------------------------
     LOAD
  ----------------------------- */

  function load() {

    const saved =
      read(
        KEY,
        {}
      );


    if (
      saved.date ===
      today()
    ) {

      state = {

        ...state,

        ...saved,

        date:
          today()

      };

    }

    else {

      state = {

        date:
          today(),

        spins: 0,

        rotation: 0

      };

    }


    write(
      KEY,
      state
    );

  }


  /* -----------------------------
     STYLES
  ----------------------------- */

  function styles() {

    if (
      $("#arsWheelStyles")
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

        background:
          rgba(0,0,0,.82);

        backdrop-filter:
          blur(18px);

      }


      .ars-wheel-overlay.open {

        display: flex;

      }


      .ars-wheel-panel {

        width:
          min(480px,100%);

        max-height: 94vh;

        overflow: auto;

        background:
          linear-gradient(
            180deg,
            #15151a,
            #0a0a0d
          );

        border:
          1px solid
          rgba(255,255,255,.09);

        border-radius: 30px;

        padding: 21px;

        box-shadow:
          0 30px 100px
          rgba(0,0,0,.7);

      }


      .ars-wheel-head {

        display: flex;

        align-items: center;

        justify-content:
          space-between;

      }


      .ars-wheel-head h2 {

        font-size: 24px;

      }


      .ars-wheel-close {

        width: 42px;

        height: 42px;

        border-radius: 50%;

        background:
          rgba(255,255,255,.07);

        font-size: 24px;

      }


      .ars-wheel-sub {

        margin:
          5px
          0
          18px;

        color: #92909b;

        font-size: 13px;

      }


      .ars-wheel-stage {

        position: relative;

        width:
          min(330px,78vw);

        aspect-ratio: 1;

        margin: auto;

      }


      .ars-wheel-pointer {

        position: absolute;

        z-index: 5;

        top: -5px;

        left: 50%;

        transform:
          translateX(-50%);

        border-left:
          14px solid transparent;

        border-right:
          14px solid transparent;

        border-top:
          29px solid #fff;

        filter:
          drop-shadow(
            0 4px 8px #000
          );

      }


      .ars-wheel {

        position: absolute;

        inset: 0;

        border:
          8px solid
          #26252e;

        border-radius: 50%;

        background:
          conic-gradient(
            #8b3dff 0 45deg,
            #201b28 45deg 90deg,
            #c54dff 90deg 135deg,
            #201b28 135deg 180deg,
            #8b3dff 180deg 225deg,
            #201b28 225deg 270deg,
            #c54dff 270deg 315deg,
            #201b28 315deg 360deg
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
          0 0 55px
          rgba(139,61,255,.3);

      }


      .ars-wheel-center {

        position: absolute;

        z-index: 6;

        left: 50%;

        top: 50%;

        transform:
          translate(
            -50%,
            -50%
          );

        width: 84px;

        height: 84px;

        border-radius: 50%;

        display: flex;

        align-items: center;

        justify-content: center;

        background:
          linear-gradient(
            135deg,
            #7d2cff,
            #c84eff
          );

        border:
          6px solid
          #09090b;

        font-weight: 900;

        box-shadow:
          0 0 20px
          rgba(174,74,255,.4);

      }


      .ars-wheel-info {

        display: flex;

        justify-content: center;

        gap: 8px;

        margin:
          18px
          0;

      }


      .ars-wheel-badge {

        padding:
          9px
          13px;

        border-radius:
          999px;

        background:
          rgba(139,61,255,.13);

        border:
          1px solid
          rgba(139,61,255,.2);

        color:
          #d1adff;

        font-size:
          12px;

        font-weight:
          800;

      }


      .ars-wheel-spin {

        width: 100%;

        height: 54px;

        border-radius: 17px;

        background:
          linear-gradient(
            135deg,
            #7d2cff,
            #c84eff
          );

        font-weight: 800;

        font-size: 16px;

      }


      .ars-wheel-spin:disabled {

        opacity: .4;

      }


      .ars-wheel-result {

        display: none;

        text-align: center;

        margin-top: 14px;

        padding: 18px;

        border-radius: 20px;

        background:
          rgba(255,255,255,.045);

        border:
          1px solid
          rgba(255,255,255,.07);

      }


      .ars-wheel-result.show {

        display: block;

      }


      .ars-wheel-result h3 {

        font-size: 20px;

      }


      .ars-wheel-result p {

        color: #aaa;

        line-height: 1.6;

        margin-top: 6px;

      }


      .ars-wheel-exit {

        margin-top: 14px;

        width: 100%;

        height: 46px;

        border-radius: 14px;

        background:
          rgba(255,255,255,.08);

        font-weight: 800;

      }


      .wheel-challenge {

        margin-top: 14px;

        padding: 15px;

        border-radius: 18px;

        background:
          rgba(139,61,255,.1);

        border:
          1px solid
          rgba(139,61,255,.2);

        display: flex;

        flex-direction: column;

        gap: 5px;

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* -----------------------------
     BUILD
  ----------------------------- */

  function build() {

    if (
      $("#arsWheelOverlay")
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
            id="wheelClose"
            class="ars-wheel-close"
            type="button"
          >
            ×
          </button>

        </div>


        <div class="ars-wheel-sub">
          Spin twice a day for rewards or a challenge.
        </div>


        <div class="ars-wheel-stage">

          <div
            class="ars-wheel-pointer"
          ></div>

          <div
            id="arsWheel"
            class="ars-wheel"
          ></div>

          <div
            class="ars-wheel-center"
          >
            ΛRS
          </div>

        </div>


        <div class="ars-wheel-info">

          <span class="ars-wheel-badge">

            Spins left:

            <b id="wheelSpins">
              2
            </b>

          </span>

        </div>


        <button
          id="wheelSpin"
          class="ars-wheel-spin"
          type="button"
        >
          Spin the Wheel
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

      </div>

    `;


    document.body.appendChild(
      overlay
    );


    overlay.addEventListener(
      "click",
      event => {

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


    $("#wheelExit", overlay)
      .addEventListener(
        "click",
        closeWheel
      );


    $("#wheelSpin", overlay)
      .addEventListener(
        "click",
        spin
      );


    updateUI();

  }


  /* -----------------------------
     UI
  ----------------------------- */

  function updateUI() {

    const left =
      Math.max(
        0,
        MAX - state.spins
      );


    const spins =
      $("#wheelSpins");


    if (spins) {

      spins.textContent =
        left;

    }


    const button =
      $("#wheelSpin");


    if (button) {

      button.disabled =
        left <= 0 ||
        state.spinning;

    }

  }


  /* -----------------------------
     OPEN / CLOSE
  ----------------------------- */

  function openWheel() {

    load();

    styles();

    build();


    $("#arsWheelOverlay")
      .classList.add(
        "open"
      );


    updateUI();

  }


  function closeWheel() {

    $("#arsWheelOverlay")
      ?.classList.remove(
        "open"
      );

  }


  /* -----------------------------
     SPIN
  ----------------------------- */

  function spin() {

    if (
      state.spinning ||
      state.spins >= MAX
    ) {

      return;

    }


    state.spinning =
      true;

    state.spins++;


    state.rotation +=
      1440 +
      Math.floor(
        Math.random() * 360
      );


    write(
      KEY,
      state
    );


    const pool =
      Math.random() < 0.55
        ? rewards
        : challenges;


    const item =
      pool[
        Math.floor(
          Math.random() *
          pool.length
        )
      ];


    const wheel =
      $("#arsWheel");


    const result =
      $("#wheelResult");


    result.classList.remove(
      "show"
    );


    wheel.style.transform =
      `rotate(
        ${state.rotation}deg
      )`;


    setTimeout(
      () => {

        state.spinning =
          false;


        $("#wheelResultTitle")
          .textContent =
          item.title;


        $("#wheelResultDescription")
          .textContent =
          item.description;


        result.classList.add(
          "show"
        );


        if (
          item.kind ===
          "challenge"
        ) {

          write(
            "ars_active_challenge",
            {
              ...item,
              expiresAt:
                Date.now() +
                3600000,

              progress: 0
            }
          );

        }


        else {

          const rewardsState =
            read(
              "ars_user_rewards",
              {}
            );


          const now =
            Date.now();


          if (
            item.id
              .startsWith(
                "avatar"
              )
          ) {

            rewardsState.freeAvatarUntil =
              now +
              86400000;

          }


          if (
            item.id
              .startsWith(
                "vip"
              )
          ) {

            rewardsState.vipUntil =
              now +
              86400000;

          }


          if (
            item.id
              .startsWith(
                "theme"
              )
          ) {

            rewardsState.favoriteThemeUntil =
              now +
              3600000;

          }


          rewardsState.lastReward =
            item.title;


          rewardsState.lastRewardAt =
            now;


          write(
            "ars_user_rewards",
            rewardsState
          );

        }


        updateUI();

      },
      4100
    );

  }


  /* -----------------------------
     CHALLENGE
  ----------------------------- */

  function completeChallenge(
    id
  ) {

    const challenge =
      read(
        "ars_active_challenge",
        null
      );


    if (
      !challenge ||
      challenge.id !== id ||
      challenge.expiresAt <
        Date.now()
    ) {

      return false;

    }


    if (
      challenge.target
    ) {

      challenge.progress =
        (challenge.progress || 0) +
        1;


      if (
        challenge.progress <
        challenge.target
      ) {

        write(
          "ars_active_challenge",
          challenge
        );

        return false;

      }

    }


    localStorage.removeItem(
      "ars_active_challenge"
    );


    return true;

  }


  /* -----------------------------
     START
  ----------------------------- */

  load();

  styles();


  window.openWheel =
    openWheel;


  window.closeWheel =
    closeWheel;


  window.ARSWheel = {

    open:
      openWheel,

    close:
      closeWheel,

    completeChallenge

  };

})();
