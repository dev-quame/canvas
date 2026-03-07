(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const body = document.body;
    const themeToggle = document.getElementById("themeToggle");
    const hamburger = document.getElementById("hamburger");
    const navList = document.getElementById("primaryNav");
    const overlay = document.getElementById("overlay");
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    const sections = navLinks
      .map((link) => {
        const id = link.getAttribute("href")?.replace("#", "");
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);
    const typingEl = document.getElementById("typing");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const themeStorageKey = "portfolio_theme";

    const isMobileViewport = () => window.matchMedia("(max-width: 900px)").matches;

    function readStoredTheme() {
      try {
        return localStorage.getItem(themeStorageKey);
      } catch (error) {
        return null;
      }
    }

    function storeTheme(theme) {
      try {
        localStorage.setItem(themeStorageKey, theme);
      } catch (error) {
        // Ignore storage errors in restricted/private contexts.
      }
    }

    function applyTheme(theme) {
      const safeTheme = theme === "light" ? "light" : "dark";
      root.setAttribute("data-theme", safeTheme);

      if (themeToggle) {
        const isDark = safeTheme === "dark";
        themeToggle.setAttribute("aria-pressed", String(isDark));
        const label = themeToggle.querySelector(".theme-label");
        if (label) {
          label.textContent = isDark ? "Switch to light theme" : "Switch to dark theme";
        }
      }

      if (themeMeta) {
        themeMeta.setAttribute("content", safeTheme === "dark" ? "#081a26" : "#f3f7fb");
      }
    }

    const storedTheme = readStoredTheme();
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : systemPrefersDark
          ? "dark"
          : "light";
    applyTheme(initialTheme);

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const currentTheme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        storeTheme(nextTheme);
      });
    }

    function setOverlayActive(isActive) {
      if (!overlay) return;
      overlay.hidden = !isActive;
      overlay.classList.toggle("active", isActive);
    }

    function closeMenu() {
      if (!navList || !hamburger) return;
      navList.classList.remove("open");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      setOverlayActive(false);
      body.classList.remove("nav-open");
    }

    function openMenu() {
      if (!navList || !hamburger) return;
      navList.classList.add("open");
      hamburger.classList.add("active");
      hamburger.setAttribute("aria-expanded", "true");
      setOverlayActive(true);
      body.classList.add("nav-open");
    }

    if (hamburger && navList) {
      hamburger.addEventListener("click", () => {
        const isOpen = navList.classList.contains("open");
        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });
    }

    if (overlay) {
      overlay.addEventListener("click", closeMenu);
    }

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (isMobileViewport()) {
          closeMenu();
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navList && navList.classList.contains("open")) {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (!isMobileViewport()) {
        closeMenu();
      }
    });

    function setActiveLink(sectionId) {
      navLinks.forEach((link) => {
        const target = link.getAttribute("href")?.replace("#", "");
        const isActive = target === sectionId;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    setActiveLink("home");

    if ("IntersectionObserver" in window && sections.length > 0) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          let candidate = null;

          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!candidate || entry.intersectionRatio > candidate.intersectionRatio) {
                candidate = entry;
              }
            }
          });

          if (candidate && candidate.target.id) {
            setActiveLink(candidate.target.id);
          }
        },
        {
          root: null,
          threshold: [0.2, 0.35, 0.55, 0.75],
          rootMargin: "-42% 0px -48% 0px",
        }
      );

      sections.forEach((section) => sectionObserver.observe(section));
    }

    if (typingEl) {
      const phrases = [
        "Classic interfaces built to last.",
        "Full-stack products with clear structure.",
        "Robust UX that drives real action.",
      ];

      if (reduceMotion) {
        typingEl.textContent = phrases[0];
      } else {
        let phraseIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const typeDelay = 62;
        const deleteDelay = 34;
        const holdDelay = 1450;

        const runTyping = () => {
          const currentPhrase = phrases[phraseIndex];

          if (!deleting) {
            charIndex += 1;
            typingEl.textContent = currentPhrase.slice(0, charIndex);

            if (charIndex >= currentPhrase.length) {
              deleting = true;
              setTimeout(runTyping, holdDelay);
              return;
            }

            setTimeout(runTyping, typeDelay);
            return;
          }

          charIndex -= 1;
          typingEl.textContent = currentPhrase.slice(0, Math.max(0, charIndex));

          if (charIndex <= 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(runTyping, 180);
            return;
          }

          setTimeout(runTyping, deleteDelay);
        };

        setTimeout(runTyping, 500);
      }
    }

    const revealItems = Array.from(document.querySelectorAll(".reveal"));

    if (revealItems.length > 0) {
      if (reduceMotion || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
      } else {
        const revealObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
              }
            });
          },
          {
            threshold: 0.18,
            rootMargin: "0px 0px -10% 0px",
          }
        );

        revealItems.forEach((item) => revealObserver.observe(item));
      }
    }
  });
})();
