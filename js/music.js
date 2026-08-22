(() => {
  "use strict";

  const MUSIC_VOLUME = 0.3;

  const initialiseMusic = () => {
    const audio = document.querySelector("#wedding-music");
    const control = document.querySelector(".music-control");
    const label = control?.querySelector(".music-control__label");

    if (!audio || !control || !label) return;

    let audioUnavailable = false;
    let playPending = false;
    let awaitingGuest = true;

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

    const handlePlayPromise = (playPromise) => {
      if (!playPromise || typeof playPromise.then !== "function") {
        playPending = false;
        return;
      }

      playPromise.then(() => {
        playPending = false;
        if (awaitingGuest) {
          audio.pause();
          try {
            audio.currentTime = 0;
          } catch (error) {
            // Metadata may not be available yet; pausing is the important reset.
          }
        }
        updateControl();
      }).catch((error) => {
        playPending = false;
        updateControl();

        const policyBlockedPlayback = (
          error?.name === "NotAllowedError" || error?.name === "SecurityError"
        );

        if (!policyBlockedPlayback) {
          console.warn("[Wedding Music] Playback could not start.");
        }
      });
    };

    const playFromUserGesture = () => {
      if (audioUnavailable || playPending || (!audio.paused && !audio.ended)) return;

      console.info("[Wedding Music] User gesture activation");
      awaitingGuest = false;
      playPending = true;

      try {
        const playPromise = audio.play();
        handlePlayPromise(playPromise);
      } catch (error) {
        playPending = false;
        updateControl();
        console.warn("[Wedding Music] Playback could not start.");
      }
    };

    const resetToAwaitingGuest = () => {
      awaitingGuest = true;
      playPending = false;
      audio.pause();

      try {
        audio.currentTime = 0;
      } catch (error) {
        // Metadata may not be available yet; pausing is the important reset.
      }

      updateControl();
    };

    window.WeddingMusic = Object.freeze({
      playFromUserGesture,
      resetToAwaitingGuest
    });

    control.addEventListener("click", () => {
      if (audioUnavailable) return;

      if (!audio.paused && !audio.ended) {
        audio.pause();
        return;
      }

      playFromUserGesture();
    });

    audio.addEventListener("play", () => {
      playPending = false;
      if (awaitingGuest) {
        audio.pause();
        return;
      }
      updateControl();
      console.info("[Wedding Music] Playback started");
    });

    audio.addEventListener("pause", () => {
      updateControl();
      console.info("[Wedding Music] Playback paused");
    });

    audio.addEventListener("error", () => {
      audioUnavailable = true;
      playPending = false;
      control.hidden = true;
      console.error("[Wedding Music] Audio load error");
    }, { once: true });

    updateControl();
    console.info("[Wedding Experience] Awaiting guest");
  };

  initialiseMusic();
})();
