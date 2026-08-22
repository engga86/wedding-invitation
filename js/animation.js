(() => {
  "use strict";

  console.info("[Wedding Experience] Script loaded");

  const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

  const SCENE_TIMING = Object.freeze({
    FLIGHTS_START: 2000,
    MEETING_START: 5600,
    WEDDING_START: 7800,
    INVITATION_REVEAL: 9200
  });

  const REDUCED_CROSSFADE_DURATION = 650;

  const SCENE_CLASSES = Object.freeze([
    "is-intro",
    "is-flight",
    "is-meeting",
    "is-wedding"
  ]);

  const animationTimers = [];
  let elements;
  let hasBegun = false;
  let isInitialised = false;
  let reducedMotionQuery;
  let welcomeTransitionHandler;
  let resetScrollFrame;

  const userPrefersReducedMotion = () => (
    typeof window.matchMedia === "function"
    && window.matchMedia(REDUCED_MOTION_QUERY).matches === true
  );

  const clearAnimationTimers = () => {
    animationTimers.forEach((timerId) => window.clearTimeout(timerId));
    animationTimers.length = 0;
  };

  const clearTrackedTimer = (timerId) => {
    window.clearTimeout(timerId);
    const timerIndex = animationTimers.indexOf(timerId);

    if (timerIndex !== -1) animationTimers.splice(timerIndex, 1);
  };

  const schedule = (callback, delay) => {
    const timerId = window.setTimeout(() => {
      const timerIndex = animationTimers.indexOf(timerId);
      if (timerIndex !== -1) animationTimers.splice(timerIndex, 1);
      callback();
    }, delay);

    animationTimers.push(timerId);
    return timerId;
  };

  const scrollOpeningToTop = () => {
    if (resetScrollFrame) window.cancelAnimationFrame(resetScrollFrame);

    window.scrollTo(0, 0);
    resetScrollFrame = window.requestAnimationFrame(() => {
      resetScrollFrame = undefined;
      if (!hasBegun) window.scrollTo(0, 0);
    });
  };

  const resetWeddingExperience = () => {
    if (!elements) return;

    const {
      opening,
      welcomeOverlay,
      beginButton,
      openingExperience
    } = elements;

    clearAnimationTimers();
    hasBegun = false;

    if (welcomeTransitionHandler) {
      welcomeOverlay.removeEventListener("transitionend", welcomeTransitionHandler);
      welcomeTransitionHandler = undefined;
    }

    opening.classList.remove(
      ...SCENE_CLASSES,
      "is-reduced",
      "is-invitation-ready"
    );
    opening.classList.add("is-awaiting");

    // Avoid replaying the dismissal transition when Safari restores the DOM.
    welcomeOverlay.style.setProperty("transition", "none");
    welcomeOverlay.hidden = false;
    welcomeOverlay.classList.remove("is-dismissing");
    welcomeOverlay.setAttribute("aria-hidden", "false");
    void welcomeOverlay.offsetWidth;
    welcomeOverlay.style.removeProperty("transition");

    beginButton.disabled = false;
    openingExperience.setAttribute("aria-hidden", "true");
    openingExperience.setAttribute("inert", "");
    document.documentElement.classList.remove("is-opening-active");
    document.documentElement.classList.add("is-awaiting-begin");

    const reducedMotionEnabled = userPrefersReducedMotion();
    console.info(`[Wedding Experience] Reduced motion: ${reducedMotionEnabled}`);

    window.WeddingMusic?.resetToAwaitingGuest();
    scrollOpeningToTop();
    beginButton.focus({ preventScroll: true });
    console.info("[Wedding Experience] Reset to awaiting-begin");
  };

  const showScene = (sceneName, className) => {
    elements.opening.classList.remove(...SCENE_CLASSES);
    elements.opening.classList.add(className);
    console.info(`[Wedding Animation] Scene: ${sceneName}`);
  };

  const showReducedScene = (sceneName, className, outgoingClasses = []) => {
    elements.opening.classList.add(className);
    console.info(`[Wedding Animation] Scene: ${sceneName}`);

    if (!outgoingClasses.length) return;

    schedule(() => {
      elements.opening.classList.remove(...outgoingClasses);
    }, REDUCED_CROSSFADE_DURATION);
  };

  const revealScrollingExperience = () => {
    elements.opening.classList.add("is-invitation-ready");
    document.documentElement.classList.remove("is-opening-active");
    console.info("[Wedding Animation] Scene: invitation-ready");
  };

  const startOpeningAnimation = () => {
    if (!hasBegun) return;

    clearAnimationTimers();
    const reducedMotionEnabled = userPrefersReducedMotion();
    const { opening, openingExperience } = elements;

    console.info(`[Wedding Experience] Reduced motion: ${reducedMotionEnabled}`);
    openingExperience.removeAttribute("inert");
    openingExperience.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-opening-active");
    opening.classList.remove(
      ...SCENE_CLASSES,
      "is-awaiting",
      "is-reduced",
      "is-invitation-ready"
    );

    if (reducedMotionEnabled) {
      console.info("[Wedding Animation] Mode: reduced-continuous");
      opening.classList.add("is-reduced");
      void opening.offsetWidth;
      showReducedScene("intro", "is-intro");
      schedule(
        () => showReducedScene("flights", "is-flight", ["is-intro"]),
        SCENE_TIMING.FLIGHTS_START
      );
      schedule(
        () => showReducedScene(
          "meeting",
          "is-meeting",
          ["is-intro", "is-flight"]
        ),
        SCENE_TIMING.MEETING_START
      );
      schedule(
        () => showReducedScene(
          "wedding",
          "is-wedding",
          ["is-intro", "is-flight", "is-meeting"]
        ),
        SCENE_TIMING.WEDDING_START
      );
      schedule(
        revealScrollingExperience,
        SCENE_TIMING.INVITATION_REVEAL
      );
      return;
    }

    console.info("[Wedding Animation] Mode: full");
    showScene("intro", "is-intro");
    schedule(() => showScene("flights", "is-flight"), SCENE_TIMING.FLIGHTS_START);
    schedule(() => showScene("meeting", "is-meeting"), SCENE_TIMING.MEETING_START);
    schedule(() => showScene("wedding", "is-wedding"), SCENE_TIMING.WEDDING_START);
    schedule(revealScrollingExperience, SCENE_TIMING.INVITATION_REVEAL);
  };

  const dismissWelcomeOverlay = () => {
    const { welcomeOverlay } = elements;
    welcomeOverlay.classList.add("is-dismissing");
    welcomeOverlay.setAttribute("aria-hidden", "true");
    let welcomeDismissed = false;
    let welcomeDismissTimer;

    const finishDismissal = () => {
      if (welcomeDismissed || !hasBegun) return;

      welcomeDismissed = true;
      clearTrackedTimer(welcomeDismissTimer);
      welcomeOverlay.removeEventListener("transitionend", finishDismissal);
      welcomeTransitionHandler = undefined;
      welcomeOverlay.hidden = true;
      document.documentElement.classList.remove("is-awaiting-begin");
      console.info("[Wedding Experience] Welcome dismissed");
    };

    welcomeTransitionHandler = finishDismissal;
    welcomeOverlay.addEventListener("transitionend", finishDismissal);
    welcomeDismissTimer = schedule(finishDismissal, 650);
  };

  const handleBegin = () => {
    if (hasBegun) return;

    hasBegun = true;
    elements.beginButton.disabled = true;
    if (resetScrollFrame) {
      window.cancelAnimationFrame(resetScrollFrame);
      resetScrollFrame = undefined;
    }
    console.info("[Wedding Experience] Begin activated");

    // Keep play() inside the trusted click stack for mobile Safari and Chrome.
    window.WeddingMusic?.playFromUserGesture();
    startOpeningAnimation();
    dismissWelcomeOverlay();
  };

  const handleReducedMotionChange = (event) => {
    console.info(`[Wedding Experience] Reduced motion: ${event.matches}`);
    if (hasBegun) resetWeddingExperience();
  };

  const handlePageShow = (event) => {
    console.info(`[Wedding Experience] pageshow persisted: ${event.persisted}`);
    if (event.persisted) resetWeddingExperience();
  };

  const handlePageHide = () => {
    clearAnimationTimers();
    if (resetScrollFrame) {
      window.cancelAnimationFrame(resetScrollFrame);
      resetScrollFrame = undefined;
    }
    window.WeddingMusic?.resetToAwaitingGuest();
    console.info("[Wedding Experience] pagehide cleanup");
  };

  const initialiseAnimation = () => {
    if (isInitialised) return;

    console.info("[Wedding Experience] Initialising");
    const opening = document.querySelector("#opening");
    const welcomeOverlay = document.querySelector(".welcome-overlay");
    const beginButton = document.querySelector(".begin-button");
    const openingExperience = document.querySelector(".opening-experience");

    if (!opening || !welcomeOverlay || !beginButton || !openingExperience) {
      console.error("[Wedding Experience] Required opening elements not found");
      return;
    }

    elements = {
      opening,
      welcomeOverlay,
      beginButton,
      openingExperience
    };

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const navigationEntry = window.performance?.getEntriesByType?.("navigation")?.[0];
    if (navigationEntry?.type) {
      console.info(`[Wedding Experience] Navigation type: ${navigationEntry.type}`);
    }

    beginButton.addEventListener("click", handleBegin);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pagehide", handlePageHide);

    if (typeof window.matchMedia === "function") {
      reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
      if (typeof reducedMotionQuery.addEventListener === "function") {
        reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
      } else if (typeof reducedMotionQuery.addListener === "function") {
        reducedMotionQuery.addListener(handleReducedMotionChange);
      }
    }

    isInitialised = true;
    resetWeddingExperience();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseAnimation, { once: true });
  } else {
    initialiseAnimation();
  }
})();
