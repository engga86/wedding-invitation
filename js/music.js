(() => {
  "use strict";

  const MUSIC_VOLUME = 0.3;
  const VALID_KEYS = ["Enter", " ", "Spacebar"];

  const initialiseMusic = () => {
    const audio = document.querySelector("#wedding-music");
    const control = document.querySelector(".music-control");
    const label = control?.querySelector(".music-control__label");

    if (!audio || !control || !label) return;

    const activationEvents = typeof window.PointerEvent === "function"
      ? ["pointerup", "keydown"]
      : ["touchend", "click", "keydown"];
    let audioUnavailable = false;
    let gesturePlayPending = false;

    audio.volume = MUSIC_VOLUME;

    const updateControl = () => {
      const isPlaying = !audio.paused && !audio.ended;
      control.classList.toggle("is-playing", isPlaying);
      control.setAttribute("aria-pressed", String(isPlaying));
      control.setAttribute(
        "aria-label",
        isPlaying ? "Pause background music" : "Play background music"
      );
      label.textContent = isPlaying ? "Music on" : "Music off";
    };

    const removeActivationListeners = () => {
      activationEvents.forEach((eventName) => {
        document.removeEventListener(eventName, handleUserGesture, true);
      });
    };

    const handlePlayPromise = (playPromise, source) => {
      if (!playPromise || typeof playPromise.then !== "function") {
        if (source === "gesture") gesturePlayPending = false;
        return;
      }

      playPromise.then(() => {
        if (source === "gesture") gesturePlayPending = false;
        removeActivationListeners();
        updateControl();
      }).catch((error) => {
        if (source === "gesture") gesturePlayPending = false;
        updateControl();

        const policyBlockedPlayback = (
          error?.name === "NotAllowedError" || error?.name === "SecurityError"
        );

        if (source === "initial" && policyBlockedPlayback && audio.paused) {
          console.info("[Wedding Music] Autoplay blocked");
        } else if (!policyBlockedPlayback) {
          console.warn("[Wedding Music] Playback could not start.");
        }
      });
    };

    function handleUserGesture(event) {
      const isValidKeyboardGesture = event.type !== "keydown"
        || VALID_KEYS.includes(event.key);
      const cameFromMusicControl = event.target.closest?.(".music-control");

      if (
        !isValidKeyboardGesture
        || cameFromMusicControl
        || audioUnavailable
        || !audio.paused
        || gesturePlayPending
      ) {
        return;
      }

      console.info("[Wedding Music] User gesture activation");
      gesturePlayPending = true;

      try {
        const playPromise = audio.play();
        handlePlayPromise(playPromise, "gesture");
      } catch (error) {
        gesturePlayPending = false;
        updateControl();
        console.warn("[Wedding Music] Playback could not start.");
      }
    }

    activationEvents.forEach((eventName) => {
      document.addEventListener(eventName, handleUserGesture, true);
    });

    control.addEventListener("click", () => {
      if (audioUnavailable) return;

      if (!audio.paused && !audio.ended) {
        audio.pause();
        return;
      }

      console.info("[Wedding Music] User gesture activation");

      try {
        const playPromise = audio.play();
        handlePlayPromise(playPromise, "gesture");
      } catch (error) {
        gesturePlayPending = false;
        updateControl();
        console.warn("[Wedding Music] Playback could not start.");
      }
    });

    audio.addEventListener("play", () => {
      gesturePlayPending = false;
      removeActivationListeners();
      updateControl();
      console.info("[Wedding Music] Playback started");
    });

    audio.addEventListener("pause", () => {
      updateControl();
      console.info("[Wedding Music] Playback paused");
    });

    audio.addEventListener("error", () => {
      audioUnavailable = true;
      gesturePlayPending = false;
      removeActivationListeners();
      control.hidden = true;
      console.error("[Wedding Music] Audio load error");
    }, { once: true });

    updateControl();
    console.info("[Wedding Music] Initial autoplay attempt");

    try {
      const initialPlayPromise = audio.play();
      handlePlayPromise(initialPlayPromise, "initial");
    } catch (error) {
      updateControl();
      console.info("[Wedding Music] Autoplay blocked");
    }
  };

  initialiseMusic();
})();
