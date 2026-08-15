(() => {
  "use strict";

  const SLIDE_INTERVAL = 3000;
  const FADE_DURATION = 450;
  const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

  const initialiseGallery = () => {
    const galleryElements = Array.from(document.querySelectorAll("[data-gallery]"));
    const allItems = Array.from(document.querySelectorAll("[data-gallery-item]"));
    const lightbox = document.querySelector(".lightbox");

    if (!galleryElements.length || !allItems.length || !lightbox) return;

    const lightboxImage = lightbox.querySelector(".lightbox__image");
    const lightboxCaption = lightbox.querySelector(".lightbox__caption");
    const closeButton = lightbox.querySelector(".lightbox__close");
    const previousButton = lightbox.querySelector(".lightbox__control--previous");
    const nextButton = lightbox.querySelector(".lightbox__control--next");
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const itemOwners = new Map();
    const slideshowInstances = [];
    let availableImages = [];
    let currentLightboxIndex = 0;
    let lightboxOpen = false;
    let returnFocus = null;
    let reducedMotionEnabled = reducedMotionQuery.matches;

    const pauseSlideshows = () => {
      slideshowInstances.forEach((slideshow) => slideshow.pause());
    };

    const resumeSlideshows = () => {
      slideshowInstances.forEach((slideshow) => slideshow.resume());
    };

    const showLightboxImage = (index) => {
      if (!availableImages.length) return;

      currentLightboxIndex = (
        index + availableImages.length
      ) % availableImages.length;

      const { item, image } = availableImages[currentLightboxIndex];
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent = (
        `${image.alt} — ${currentLightboxIndex + 1} of ${availableImages.length}`
      );
      returnFocus = item;
      itemOwners.get(item)?.selectItem(item);

      const multipleImages = availableImages.length > 1;
      previousButton.hidden = !multipleImages;
      nextButton.hidden = !multipleImages;
    };

    const openLightbox = (item) => {
      const index = availableImages.findIndex((entry) => entry.item === item);
      if (index < 0) return;

      lightboxOpen = true;
      pauseSlideshows();
      showLightboxImage(index);
      lightbox.hidden = false;
      document.body.classList.add("has-open-lightbox");
      closeButton.focus();
    };

    const closeLightbox = () => {
      if (lightbox.hidden) return;

      lightbox.hidden = true;
      lightboxImage.src = "";
      document.body.classList.remove("has-open-lightbox");
      lightboxOpen = false;
      resumeSlideshows();
      returnFocus?.focus();
    };

    const registerLoadedImage = (item, image) => {
      if (item.classList.contains("is-loaded")) return;

      image.hidden = false;
      item.classList.add("is-loaded");
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "-1");
      item.setAttribute("aria-label", `Open photo: ${image.alt}`);
      availableImages.push({ item, image });
      availableImages.sort((first, second) => (
        allItems.indexOf(first.item) - allItems.indexOf(second.item)
      ));

      item.addEventListener("click", () => openLightbox(item));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(item);
        }
      });
    };

    const createSlideshow = (gallery) => {
      const items = Array.from(gallery.querySelectorAll("[data-gallery-item]"));
      const controls = gallery.querySelector(".slideshow-controls");
      const previous = gallery.querySelector(".slideshow-arrow--previous");
      const next = gallery.querySelector(".slideshow-arrow--next");
      const dotsContainer = gallery.querySelector(".slideshow-dots");
      const galleryName = gallery.dataset.gallery;
      let loadedItems = [];
      let dots = [];
      let currentIndex = 0;
      let timer = null;
      let ready = false;
      let visible = typeof window.IntersectionObserver !== "function";

      gallery.style.setProperty("--slide-transition", `${FADE_DURATION}ms`);

      const stopTimer = () => {
        if (timer !== null) {
          window.clearInterval(timer);
          timer = null;
        }
      };

      const canAdvance = () => (
        ready
        && loadedItems.length > 1
        && visible
        && !lightboxOpen
        && !reducedMotionEnabled
        && !document.hidden
      );

      const startTimer = () => {
        stopTimer();
        if (!canAdvance()) return;

        timer = window.setInterval(() => {
          showSlide(currentIndex + 1, false);
        }, SLIDE_INTERVAL);
      };

      const showSlide = (index, restartTimer = true) => {
        if (!loadedItems.length) return;

        currentIndex = (index + loadedItems.length) % loadedItems.length;
        loadedItems.forEach((item, itemIndex) => {
          const isCurrent = itemIndex === currentIndex;
          item.classList.toggle("is-active", isCurrent);
          item.setAttribute("aria-hidden", String(!isCurrent));
          item.setAttribute("tabindex", isCurrent ? "0" : "-1");
        });
        dots.forEach((dot, dotIndex) => {
          const isCurrent = dotIndex === currentIndex;
          dot.classList.toggle("is-active", isCurrent);
          dot.setAttribute("aria-pressed", String(isCurrent));
        });

        if (restartTimer) startTimer();
      };

      const selectItem = (item) => {
        const index = loadedItems.indexOf(item);
        if (index >= 0) showSlide(index, false);
      };

      const instance = {
        pause: stopTimer,
        resume: startTimer,
        selectItem
      };

      slideshowInstances.push(instance);
      items.forEach((item) => itemOwners.set(item, instance));

      previous.addEventListener("click", () => {
        showSlide(currentIndex - 1);
      });
      next.addEventListener("click", () => {
        showSlide(currentIndex + 1);
      });

      if (typeof window.IntersectionObserver === "function") {
        const observer = new IntersectionObserver((entries) => {
          visible = entries[0]?.isIntersecting === true;
          if (visible) startTimer();
          else stopTimer();
        }, { threshold: 0.15 });
        observer.observe(gallery);
      }

      const imageLoads = items.map((item) => new Promise((resolve) => {
        const image = item.querySelector("img");
        if (!image) {
          resolve();
          return;
        }

        const handleLoad = () => {
          registerLoadedImage(item, image);
          resolve();
        };
        const handleError = () => {
          image.hidden = true;
          resolve();
        };

        if (image.complete) {
          if (image.naturalWidth > 0) handleLoad();
          else handleError();
          return;
        }

        image.addEventListener("load", handleLoad, { once: true });
        image.addEventListener("error", handleError, { once: true });
      }));

      Promise.all(imageLoads).then(() => {
        loadedItems = items.filter((item) => item.classList.contains("is-loaded"));
        ready = true;
        gallery.classList.add("is-ready");

        if (!loadedItems.length) {
          gallery.classList.add("has-no-images");
          items.forEach((item, index) => {
            item.hidden = index !== 0;
          });
          return;
        }

        gallery.classList.add("has-images");
        items.forEach((item) => {
          item.hidden = !item.classList.contains("is-loaded");
        });

        if (loadedItems.length > 1) {
          dots = loadedItems.map((item, index) => {
            const dot = document.createElement("button");
            dot.className = "slideshow-dot";
            dot.type = "button";
            dot.setAttribute("aria-label", `Show ${galleryName} photo ${index + 1}`);
            dot.setAttribute("aria-pressed", "false");
            dot.addEventListener("click", () => showSlide(index));
            dotsContainer.append(dot);
            return dot;
          });
          controls.hidden = false;
        }

        showSlide(0, false);
        startTimer();
      });

      return instance;
    };

    galleryElements.forEach(createSlideshow);

    closeButton.addEventListener("click", closeLightbox);
    previousButton.addEventListener("click", () => {
      showLightboxImage(currentLightboxIndex - 1);
    });
    nextButton.addEventListener("click", () => {
      showLightboxImage(currentLightboxIndex + 1);
    });

    lightbox.addEventListener("click", (event) => {
      const figure = lightbox.querySelector(".lightbox__figure");
      if (event.target === lightbox || event.target === figure) closeLightbox();
    });

    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;

      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showLightboxImage(currentLightboxIndex - 1);
      if (event.key === "ArrowRight") showLightboxImage(currentLightboxIndex + 1);
      if (event.key === "Tab") {
        const controls = [closeButton, previousButton, nextButton].filter((button) => (
          !button.hidden
        ));
        const firstControl = controls[0];
        const lastControl = controls[controls.length - 1];

        if (event.shiftKey && document.activeElement === firstControl) {
          event.preventDefault();
          lastControl.focus();
        } else if (!event.shiftKey && document.activeElement === lastControl) {
          event.preventDefault();
          firstControl.focus();
        }
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pauseSlideshows();
      else resumeSlideshows();
    });

    reducedMotionQuery.addEventListener?.("change", (event) => {
      reducedMotionEnabled = event.matches;
      if (reducedMotionEnabled) pauseSlideshows();
      else resumeSlideshows();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseGallery, { once: true });
  } else {
    initialiseGallery();
  }
})();
