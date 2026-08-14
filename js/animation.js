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
    const openButton = document.querySelector(".open-button");
    const invitationContent = document.querySelector("#invitation-content");

    if (!opening || !openButton || !invitationContent) {
      console.error("[Wedding Animation] Required opening elements not found");
      return;
    }

    const reducedMotionEnabled = userPrefersReducedMotion();
    const timers = [];

    console.info(`[Wedding Animation] Reduced motion: ${reducedMotionEnabled}`);

    const showScene = (sceneName, className) => {
      opening.classList.remove(...SCENE_CLASSES);
      opening.classList.add(className);
      console.info(`[Wedding Animation] Scene: ${sceneName}`);
    };

    const schedule = (callback, delay) => {
      timers.push(window.setTimeout(callback, delay));
    };

    opening.classList.remove("is-reduced", "is-invitation-ready");

    if (reducedMotionEnabled) {
      opening.classList.add("is-reduced");
      schedule(() => {
        showScene("wedding", "is-wedding");
        opening.classList.add("is-invitation-ready");
        console.info("[Wedding Animation] Scene: invitation-ready");
      }, SCENE_TIMING.REDUCED_MOTION_REVEAL);
    } else {
      showScene("intro", "is-intro");
      schedule(() => showScene("flights", "is-flight"), SCENE_TIMING.FLIGHTS_START);
      schedule(() => showScene("meeting", "is-meeting"), SCENE_TIMING.MEETING_START);
      schedule(() => showScene("wedding", "is-wedding"), SCENE_TIMING.WEDDING_START);
      schedule(() => {
        opening.classList.add("is-invitation-ready");
        console.info("[Wedding Animation] Scene: invitation-ready");
      }, SCENE_TIMING.INVITATION_REVEAL);
    }

    openButton.addEventListener("click", () => {
      invitationContent.scrollIntoView({
        behavior: reducedMotionEnabled ? "auto" : "smooth",
        block: "start"
      });
      invitationContent.focus({ preventScroll: true });
    });

    window.addEventListener("pagehide", () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    }, { once: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseAnimation, { once: true });
  } else {
    initialiseAnimation();
  }
})();
