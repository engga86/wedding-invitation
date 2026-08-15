(() => {
  "use strict";

  console.info("[Wedding Animation] Script loaded");

  const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

  const SCENE_TIMING = Object.freeze({
    FLIGHTS_START: 2000,
    MEETING_START: 5600,
    WEDDING_START: 7800,
    INVITATION_REVEAL: 9200,
    REDUCED_MOTION_REVEAL: 100
  });

  const SCENE_CLASSES = Object.freeze([
    "is-intro",
    "is-flight",
    "is-meeting",
    "is-wedding"
  ]);

  const userPrefersReducedMotion = () => (
    typeof window.matchMedia === "function"
    && window.matchMedia(REDUCED_MOTION_QUERY).matches === true
  );

  const initialiseAnimation = () => {
    console.info("[Wedding Animation] Initialising");

    const opening = document.querySelector("#opening");
    const welcomeOverlay = document.querySelector(".welcome-overlay");
    const beginButton = document.querySelector(".begin-button");
    const openingExperience = document.querySelector(".opening-experience");
    const openButton = document.querySelector(".open-button");
    const invitationContent = document.querySelector("#invitation-content");

    if (!opening || !welcomeOverlay || !beginButton || !openingExperience || !openButton || !invitationContent) {
      console.error("[Wedding Animation] Required opening elements not found");
      return;
    }

    const reducedMotionEnabled = userPrefersReducedMotion();
    const timers = [];
    let hasBegun = false;
    let welcomeDismissTimer;

    console.info(`[Wedding Animation] Reduced motion: ${reducedMotionEnabled}`);

    const showScene = (sceneName, className) => {
      opening.classList.remove(...SCENE_CLASSES);
      opening.classList.add(className);
      console.info(`[Wedding Animation] Scene: ${sceneName}`);
    };

    const schedule = (callback, delay) => {
      timers.push(window.setTimeout(callback, delay));
    };

    opening.classList.remove(...SCENE_CLASSES, "is-reduced", "is-invitation-ready");
    opening.classList.add("is-awaiting");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const startOpeningAnimation = () => {
      if (!hasBegun) return;

      console.info("[Wedding Animation] Starting timeline");
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.length = 0;
      openingExperience.removeAttribute("inert");
      openingExperience.removeAttribute("aria-hidden");
      opening.classList.remove(...SCENE_CLASSES, "is-awaiting", "is-reduced", "is-invitation-ready");

      if (reducedMotionEnabled) {
        opening.classList.add("is-reduced");
        schedule(() => {
          showScene("wedding", "is-wedding");
          opening.classList.add("is-invitation-ready");
          console.info("[Wedding Animation] Scene: invitation-ready");
        }, SCENE_TIMING.REDUCED_MOTION_REVEAL);
        return;
      }

      showScene("intro", "is-intro");
      schedule(() => showScene("flights", "is-flight"), SCENE_TIMING.FLIGHTS_START);
      schedule(() => showScene("meeting", "is-meeting"), SCENE_TIMING.MEETING_START);
      schedule(() => showScene("wedding", "is-wedding"), SCENE_TIMING.WEDDING_START);
      schedule(() => {
        opening.classList.add("is-invitation-ready");
        console.info("[Wedding Animation] Scene: invitation-ready");
      }, SCENE_TIMING.INVITATION_REVEAL);
    };

    const dismissWelcomeOverlay = () => {
      welcomeOverlay.classList.add("is-dismissing");
      welcomeOverlay.setAttribute("aria-hidden", "true");
      let welcomeDismissed = false;

      const finishDismissal = () => {
        if (welcomeDismissed) return;

        welcomeDismissed = true;
        window.clearTimeout(welcomeDismissTimer);
        welcomeOverlay.hidden = true;
        document.documentElement.classList.remove("is-awaiting-begin");
        console.info("[Wedding Experience] Welcome dismissed");
      };

      welcomeOverlay.addEventListener("transitionend", finishDismissal, { once: true });
      welcomeDismissTimer = window.setTimeout(finishDismissal, 650);
    };

    beginButton.addEventListener("click", () => {
      if (hasBegun) return;

      hasBegun = true;
      beginButton.disabled = true;
      console.info("[Wedding Experience] Begin activated");

      window.WeddingMusic?.playFromUserGesture();
      startOpeningAnimation();
      dismissWelcomeOverlay();
    });

    beginButton.focus({ preventScroll: true });

    openButton.addEventListener("click", () => {
      invitationContent.scrollIntoView({
        behavior: reducedMotionEnabled ? "auto" : "smooth",
        block: "start"
      });
      invitationContent.focus({ preventScroll: true });
    });

    window.addEventListener("pagehide", () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(welcomeDismissTimer);
    }, { once: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseAnimation, { once: true });
  } else {
    initialiseAnimation();
  }
})();
