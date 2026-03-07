(function () {
  "use strict";

  const storageKeys = {
    scroll: "barca_scroll",
    hash: "barca_hash",
    activeNav: "barca_active_nav",
  };

  function saveMainPageState(href) {
    if (!href.includes("blogPost.html")) return;

    try {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const currentHash = location.hash || "";

      sessionStorage.setItem(storageKeys.scroll, String(scrollY));
      sessionStorage.setItem(storageKeys.hash, currentHash);

      const activeNav = document.querySelector(".nav-link.active")?.getAttribute("data-nav");
      if (activeNav) {
        sessionStorage.setItem(storageKeys.activeNav, activeNav);
      }
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function applyPendingNavOnArticle() {
    if (!document.querySelector(".blog-container")) return;

    try {
      const pendingNav = sessionStorage.getItem(storageKeys.activeNav);
      if (!pendingNav) return;

      document.querySelectorAll(".nav-link[data-nav]").forEach((link) => {
        const isActive = link.getAttribute("data-nav") === pendingNav;
        link.classList.toggle("active", isActive);
      });
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function restoreMainPageState() {
    if (!document.querySelector(".main-container")) return;

    try {
      const savedHash = sessionStorage.getItem(storageKeys.hash);
      const savedScroll = parseInt(sessionStorage.getItem(storageKeys.scroll) || "0", 10);
      const pendingNav = sessionStorage.getItem(storageKeys.activeNav);

      if (pendingNav) {
        document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
        document.querySelectorAll(".nav-link[data-nav]").forEach((link) => link.classList.remove("active"));

        const targetPage = document.getElementById(pendingNav);
        if (targetPage) targetPage.classList.add("active");
        document.querySelectorAll(`.nav-link[data-nav="${pendingNav}"]`).forEach((link) => {
          link.classList.add("active");
        });

        if (typeof hideMainWrapper === "function") {
          hideMainWrapper();
        }

        sessionStorage.removeItem(storageKeys.activeNav);
      }

      if (savedHash) {
        if (savedHash !== location.hash) {
          location.hash = savedHash;
        }
        sessionStorage.removeItem(storageKeys.hash);
      }

      if (!Number.isNaN(savedScroll) && savedScroll > 0) {
        setTimeout(() => {
          window.scrollTo({ top: savedScroll, left: 0, behavior: "auto" });
          sessionStorage.removeItem(storageKeys.scroll);
        }, 100);
      }
    } catch (error) {
      // Ignore storage errors.
    }
  }

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest && event.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href.includes("blogPost.html")) return;

      if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
        saveMainPageState(href);
      }
    },
    { capture: true }
  );

  window.addEventListener("DOMContentLoaded", () => {
    applyPendingNavOnArticle();
    restoreMainPageState();
  });

  window.addEventListener("pageshow", () => {
    applyPendingNavOnArticle();
    restoreMainPageState();
  });
})();
