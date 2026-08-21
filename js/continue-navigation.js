(() => {
  "use strict";

  const MOBILE_QUERY = "(max-width: 47.999rem)";
  const SCROLL_IDLE_DELAY = 850;
  const SECTION_FOCUS_MARGIN = "-28% 0px -62% 0px";

  const SECTION_DESTINATIONS = Object.freeze({
    "invitation-content": Object.freeze({
      href: "#our-story",
      label: "Continue to Our Story"
    }),
    "our-story": Object.freeze({
      href: "#gifts",
      label: "Continue to Gifts and Contributions"
    }),
    gifts: Object.freeze({
      href: "#wedding-day",
      label: "Continue to The Wedding Day"
    }),
    "wedding-day": Object.freeze({
      href: "#closing",
      label: "Continue to Closing"
    })
  });

  const initialiseContinueNavigation = () => {
    const cue = document.querySelector(".continue-cue");
    const openButton = document.querySelector(".open-button");
    const supportedSections = Object.keys(SECTION_DESTINATIONS)
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const closing = document.querySelector("#closing");

    if (
      !cue
      || !openButton
      || supportedSections.length !== Object.keys(SECTION_DESTINATIONS).length
      || !closing
      || typeof window.IntersectionObserver !== "function"
    ) {
      return;
    }

    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const contributionOptions = Array.from(
      document.querySelectorAll(".contribution-option")
    );
    const slideshowControls = Array.from(
      document.querySelectorAll(".slideshow-controls")
    );
    const sectionCoverage = new Map();
    let activeSectionId = null;
    let activated = false;
    let hasReachedClosing = false;
    let scrollIdle = false;
    let scrollIdleTimer = null;

    const hideCue = () => cue.classList.remove("is-visible");

    const hasSlideshowControlConflict = () => {
      if (activeSectionId !== "our-story") return false;

      const protectedTop = window.innerHeight - 112;
      return slideshowControls.some((controls) => {
        if (controls.hidden) return false;

        const bounds = controls.getBoundingClientRect();
        return bounds.bottom > protectedTop && bounds.top < window.innerHeight;
      });
    };

    const hasExpandedContribution = () => (
      activeSectionId === "gifts"
      && contributionOptions.some((option) => option.open)
    );

    const updateCue = () => {
      const destination = SECTION_DESTINATIONS[activeSectionId];
      const shouldShow = (
        activated
        && mobileQuery.matches
        && scrollIdle
        && !hasReachedClosing
        && destination
        && !document.body.classList.contains("has-open-lightbox")
        && !hasExpandedContribution()
        && !hasSlideshowControlConflict()
      );

      if (destination) {
        cue.href = destination.href;
        cue.setAttribute("aria-label", destination.label);
        cue.dataset.activeSection = activeSectionId;
      }

      cue.classList.toggle("is-visible", Boolean(shouldShow));
    };

    const chooseActiveSection = () => {
      const activeEntry = Array.from(sectionCoverage.entries())
        .filter(([, coverage]) => coverage > 0)
        .sort((first, second) => second[1] - first[1])[0];

      activeSectionId = activeEntry?.[0] || activeSectionId;
      updateCue();
    };

    const scheduleIdle = () => {
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        scrollIdle = true;
        updateCue();
      }, SCROLL_IDLE_DELAY);
    };

    const handleScroll = () => {
      if (!activated) return;

      scrollIdle = false;
      hideCue();
      scheduleIdle();
    };

    const handleViewportChange = () => {
      if (!activated) return;

      if (!mobileQuery.matches) {
        cue.hidden = true;
        hideCue();
        return;
      }

      cue.hidden = false;
      scrollIdle = false;
      hideCue();
      scheduleIdle();
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const rootHeight = entry.rootBounds?.height || 1;
        const coverage = entry.isIntersecting
          ? entry.intersectionRect.height / rootHeight
          : 0;
        sectionCoverage.set(entry.target.id, coverage);
      });

      chooseActiveSection();
    }, {
      root: null,
      rootMargin: SECTION_FOCUS_MARGIN,
      threshold: [0, 0.5, 1]
    });

    const closingObserver = new IntersectionObserver((entries) => {
      if (entries[0]?.intersectionRatio < 0.35) return;

      hasReachedClosing = true;
      hideCue();
    }, { threshold: 0.35 });

    const activate = () => {
      if (activated) return;

      activated = true;
      supportedSections.forEach((section) => observer.observe(section));
      closingObserver.observe(closing);
      handleViewportChange();
    };

    openButton.addEventListener("click", activate);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleViewportChange, { passive: true });
    mobileQuery.addEventListener?.("change", handleViewportChange);

    cue.addEventListener("click", () => {
      if (cue.getAttribute("href") === "#closing") {
        hasReachedClosing = true;
      }

      scrollIdle = false;
      hideCue();
      scheduleIdle();
    });

    contributionOptions.forEach((option) => {
      option.addEventListener("toggle", updateCue);
    });

    window.addEventListener("pagehide", () => {
      window.clearTimeout(scrollIdleTimer);
      observer.disconnect();
      closingObserver.disconnect();
    }, { once: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseContinueNavigation, {
      once: true
    });
  } else {
    initialiseContinueNavigation();
  }
})();
