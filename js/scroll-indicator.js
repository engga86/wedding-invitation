(() => {
  "use strict";

  const initialiseScrollIndicator = () => {
    const indicator = document.querySelector(".side-scroll-indicator");
    const opening = document.querySelector("#opening");
    const coupleHero = document.querySelector("#couple-hero");
    const closing = document.querySelector("#closing");
    const footer = document.querySelector(".site-footer");

    if (!indicator || !opening || !coupleHero || !closing || !footer) return;

    const supportsObserver = typeof window.IntersectionObserver === "function";
    let activated = false;
    let mainContentEntered = false;
    let closingVisible = false;
    let footerVisible = false;

    const updateVisibility = () => {
      const shouldShow = (
        activated
        && (!supportsObserver || mainContentEntered)
        && !closingVisible
        && !footerVisible
      );
      indicator.classList.toggle("is-visible", shouldShow);
    };

    const syncOpeningState = () => {
      activated = opening.classList.contains("is-invitation-ready");

      if (!activated) {
        mainContentEntered = false;
        indicator.classList.remove("is-visible");
        indicator.hidden = true;
        return;
      }

      indicator.hidden = false;
      window.requestAnimationFrame(updateVisibility);
    };

    const openingObserver = new MutationObserver(syncOpeningState);
    openingObserver.observe(opening, {
      attributes: true,
      attributeFilter: ["class"]
    });
    syncOpeningState();

    if (!supportsObserver) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === coupleHero) {
          if (entry.isIntersecting) mainContentEntered = true;
        } else if (entry.target === closing) {
          closingVisible = entry.isIntersecting;
        } else if (entry.target === footer) {
          footerVisible = entry.isIntersecting;
        }
      });

      updateVisibility();
    }, { threshold: [0, 0.3] });

    observer.observe(coupleHero);
    observer.observe(closing);
    observer.observe(footer);

  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseScrollIndicator, {
      once: true
    });
  } else {
    initialiseScrollIndicator();
  }
})();
