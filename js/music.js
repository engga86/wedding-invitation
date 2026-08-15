(() => {
  "use strict";

  const MUSIC_VOLUME = 0.3;
  const INTERACTION_EVENTS = ["pointerdown", "touchstart", "keydown"];

  const initialiseMusic = () => {
    const audio = document.querySelector("#wedding-music");
    const control = document.querySelector(".music-control");
    const label = control?.querySelector(".music-control__label");

    if (!audio || !control || !label) return;

    let fallbackAttempted = false;
    let audioUnavailable = false;

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

    const removeInteractionFallback = () => {
      INTERACTION_EVENTS.forEach((eventName) => {
        document.removeEventListener(eventName, handleFirstInteraction, true);
      });
    };

    const attemptPlayback = async () => {
      if (audioUnavailable || !audio.paused) return;

      try {
        await audio.play();
        removeInteractionFallback();
      } catch (error) {
        const autoplayWasBlocked = (
          error?.name === "NotAllowedError" || error?.name === "SecurityError"
        );
        if (!autoplayWasBlocked) {
          console.warn("[Wedding Music] Playback could not start.");
        }
      }
    };

    function handleFirstInteraction(event) {
      const isKeyboardActivation = event.type !== "keydown"
        || event.key === "Enter"
        || event.key === " ";
      const isMusicControl = event.target.closest?.(".music-control");

      if (!isKeyboardActivation || isMusicControl || fallbackAttempted) return;

      fallbackAttempted = true;
      removeInteractionFallback();
      attemptPlayback();
    }

    INTERACTION_EVENTS.forEach((eventName) => {
      document.addEventListener(eventName, handleFirstInteraction, true);
    });

    control.addEventListener("click", () => {
      if (audioUnavailable) return;

      if (audio.paused) {
        fallbackAttempted = true;
        removeInteractionFallback();
        attemptPlayback();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", updateControl);
    audio.addEventListener("pause", updateControl);
    audio.addEventListener("error", () => {
      audioUnavailable = true;
      removeInteractionFallback();
      control.hidden = true;
      console.warn("[Wedding Music] Audio file could not be loaded.");
    }, { once: true });

    updateControl();
    attemptPlayback();
  };

  initialiseMusic();
})();
