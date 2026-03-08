(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const body = document.body;
    const themeToggle = document.getElementById("themeToggle");
    const hamburger = document.getElementById("hamburger");
    const navList = document.getElementById("primaryNav");
    const overlay = document.getElementById("overlay");
    const navBar = document.getElementById("nav");
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

    if (navList) {
      navList.setAttribute("aria-hidden", String(!navList.classList.contains("open")));
    }

    if (overlay) {
      overlay.setAttribute("aria-hidden", "true");
    }

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
      overlay.setAttribute("aria-hidden", String(!isActive));
    }

    function closeMenu() {
      if (!navList || !hamburger) return;
      navList.classList.remove("open");
      navList.setAttribute("aria-hidden", "true");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      setOverlayActive(false);
      body.classList.remove("nav-open");
    }

    function openMenu() {
      if (!navList || !hamburger) return;
      navList.classList.add("open");
      navList.setAttribute("aria-hidden", "false");
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

    document.addEventListener("click", (event) => {
      if (!navList || !hamburger || !isMobileViewport()) return;
      if (!navList.classList.contains("open")) return;

      const clickedInsideMenu = navList.contains(event.target);
      const clickedHamburger = hamburger.contains(event.target);
      if (!clickedInsideMenu && !clickedHamburger) {
        closeMenu();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const targetId = link.getAttribute("href")?.replace("#", "");
        if (targetId) {
          setActiveLink(targetId);
        }
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

    function getScrollSpyOffset() {
      const navHeight = navBar?.offsetHeight || 0;
      return navHeight + 36;
    }

    function updateActiveLinkOnScroll() {
      if (!sections.length) return;

      const scrollPosition = window.scrollY + getScrollSpyOffset();
      const lastSectionId = sections[sections.length - 1]?.id;
      let activeId = sections[0].id;

      sections.forEach((section) => {
        if (scrollPosition >= section.offsetTop) {
          activeId = section.id;
        }
      });

      const reachedBottom =
        Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 2;

      if (reachedBottom && lastSectionId) {
        activeId = lastSectionId;
      }

      setActiveLink(activeId);
    }

    if (sections.length > 0) {
      let ticking = false;

      const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          updateActiveLinkOnScroll();
          ticking = false;
        });
      };

      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate);
      window.addEventListener("load", requestUpdate);
      requestUpdate();
    } else {
      setActiveLink("home");
    }

    if (typingEl) {
      const phrases = [
        "Timeless interfaces built to last.",
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
