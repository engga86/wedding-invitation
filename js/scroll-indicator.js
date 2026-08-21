(() => {
  "use strict";

  const initialiseScrollIndicator = () => {
    const indicator = document.querySelector(".side-scroll-indicator");
    const openButton = document.querySelector(".open-button");
    const invitation = document.querySelector("#invitation-content");
    const closing = document.querySelector("#closing");
    const footer = document.querySelector(".site-footer");

    if (!indicator || !openButton || !invitation || !closing || !footer) return;

    const supportsObserver = typeof window.IntersectionObserver === "function";
    let activated = false;
    let invitationEntered = false;
    let closingVisible = false;
    let footerVisible = false;

    const updateVisibility = () => {
      const shouldShow = (
        activated
        && (!supportsObserver || invitationEntered)
        && !closingVisible
        && !footerVisible
      );
      indicator.classList.toggle("is-visible", shouldShow);
    };

    const activate = () => {
      if (activated) return;

      activated = true;
      indicator.hidden = false;
      window.requestAnimationFrame(updateVisibility);
    };

    openButton.addEventListener("click", activate);

    if (!supportsObserver) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === invitation) {
          if (entry.isIntersecting) invitationEntered = true;
        } else if (entry.target === closing) {
          closingVisible = entry.intersectionRatio >= 0.3;
        } else if (entry.target === footer) {
          footerVisible = entry.isIntersecting;
        }
      });

      updateVisibility();
    }, { threshold: [0, 0.3] });

    observer.observe(invitation);
    observer.observe(closing);
    observer.observe(footer);

    window.addEventListener("pagehide", () => observer.disconnect(), {
      once: true
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseScrollIndicator, {
      once: true
    });
  } else {
    initialiseScrollIndicator();
  }
})();
