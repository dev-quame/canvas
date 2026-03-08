"use strict";

const MOBILE_BREAKPOINT = 940;

function setupHeaderScroll() {
  const headerContainer = document.querySelector(".header-container");
  if (!headerContainer) return;

  const updateHeader = () => {
    headerContainer.classList.toggle("scrolled", window.scrollY > 18);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function setupMobileNav() {
  const hamburger = document.getElementById("hamburger");
  const navList = document.getElementById("primary-nav");
  const scrim = document.getElementById("nav-scrim");
  if (!hamburger || !navList || !scrim) {
    return {
      closeMenu: () => {},
    };
  }

  function openMenu() {
    document.body.classList.add("nav-open");
    hamburger.classList.add("active");
    hamburger.setAttribute("aria-expanded", "true");
    scrim.hidden = false;
  }

  function closeMenu() {
    document.body.classList.remove("nav-open");
    hamburger.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    scrim.hidden = true;
  }

  hamburger.addEventListener("click", () => {
    if (document.body.classList.contains("nav-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  scrim.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      closeMenu();
    }
  });

  return { closeMenu };
}

function setupNavLinks(closeMenu) {
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  if (!navLinks.length) return;

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href")?.replace("#", "").trim();
      return id ? document.getElementById(id) : null;
    })
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) {
    return;
  }

  const linkBySection = new Map();
  navLinks.forEach((link) => {
    const id = link.getAttribute("href")?.replace("#", "").trim();
    if (id) {
      linkBySection.set(id, link);
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible?.target?.id) return;

      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${visible.target.id}`;
        link.classList.toggle("active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    {
      threshold: [0.25, 0.5, 0.7],
      rootMargin: "-25% 0px -55% 0px",
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupCarousel() {
  const carousel = document.querySelector(".carousel-container");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const nextButton = document.querySelector(".next-caro");
  const previousButton = document.querySelector(".previous-caro");
  const indicators = Array.from(document.querySelectorAll(".indicator"));
  const offersContainer = document.querySelector(".special-offers");

  if (!carousel || !slides.length || !nextButton || !previousButton || !indicators.length || !offersContainer) {
    return;
  }

  let currentSlide = 0;
  const totalSlides = slides.length;
  let autoplayInterval = null;
  let startX = 0;
  let endX = 0;

  function updateCarousel() {
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    indicators.forEach((indicator, index) => {
      const isActive = index === currentSlide;
      indicator.classList.toggle("active", isActive);
      indicator.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function goToSlide(index) {
    currentSlide = (index + totalSlides) % totalSlides;
    updateCarousel();
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function previousSlide() {
    goToSlide(currentSlide - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = window.setInterval(nextSlide, 4500);
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      window.clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  nextButton.addEventListener("click", () => {
    nextSlide();
    startAutoplay();
  });

  previousButton.addEventListener("click", () => {
    previousSlide();
    startAutoplay();
  });

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      goToSlide(index);
      startAutoplay();
    });
  });

  offersContainer.addEventListener("mouseenter", stopAutoplay);
  offersContainer.addEventListener("mouseleave", startAutoplay);
  offersContainer.addEventListener("focusin", stopAutoplay);
  offersContainer.addEventListener("focusout", startAutoplay);

  carousel.addEventListener(
    "touchstart",
    (event) => {
      startX = event.touches[0].clientX;
      endX = startX;
    },
    { passive: true }
  );

  carousel.addEventListener(
    "touchmove",
    (event) => {
      endX = event.touches[0].clientX;
    },
    { passive: true }
  );

  carousel.addEventListener("touchend", () => {
    const delta = startX - endX;
    if (delta > 45) {
      nextSlide();
      startAutoplay();
      return;
    }

    if (delta < -45) {
      previousSlide();
      startAutoplay();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  updateCarousel();
  startAutoplay();
}

function setupMenuFiltering() {
  const searchInput = document.getElementById("menu-search-input");
  const filters = Array.from(document.querySelectorAll(".filter-btn"));
  const dishes = Array.from(document.querySelectorAll(".dish-container"));
  if (!searchInput || !filters.length || !dishes.length) return;

  let activeFilter = "all";

  function applyFilters() {
    const term = (searchInput.value || "").trim().toLowerCase();

    dishes.forEach((dish) => {
      const category = (dish.getAttribute("data-category") || "").toLowerCase();
      const dishName = (dish.getAttribute("data-name") || "").toLowerCase();
      const text = dish.textContent.toLowerCase();

      const matchesFilter = activeFilter === "all" || category === activeFilter;
      const matchesTerm = !term || dishName.includes(term) || text.includes(term);

      dish.hidden = !(matchesFilter && matchesTerm);
    });
  }

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.getAttribute("data-filter") || "all";
      filters.forEach((item) => item.classList.toggle("active", item === btn));
      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);
  applyFilters();
}

function createPopup() {
  const popupOverlay = document.createElement("div");
  popupOverlay.className = "popup-overlay";
  popupOverlay.id = "popup-overlay";

  const popupContent = document.createElement("section");
  popupContent.className = "popup-content";
  popupContent.setAttribute("role", "dialog");
  popupContent.setAttribute("aria-modal", "true");
  popupContent.setAttribute("aria-labelledby", "popup-title");

  const popupImage = document.createElement("img");
  popupImage.alt = "";

  const body = document.createElement("div");
  body.className = "popup-body";

  const titleRow = document.createElement("div");
  titleRow.className = "popup-title-row";

  const popupTitle = document.createElement("h3");
  popupTitle.className = "popup-title";
  popupTitle.id = "popup-title";

  const closeButton = document.createElement("button");
  closeButton.className = "popup-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close popup");
  closeButton.textContent = "Close";

  const popupMeta = document.createElement("p");
  popupMeta.className = "popup-meta";

  const popupPrice = document.createElement("p");
  popupPrice.className = "popup-price";

  const popupAction = document.createElement("button");
  popupAction.className = "popup-action-btn";
  popupAction.type = "button";
  popupAction.textContent = "Start Order";

  titleRow.append(popupTitle, closeButton);
  body.append(titleRow, popupMeta, popupPrice, popupAction);
  popupContent.append(popupImage, body);
  popupOverlay.appendChild(popupContent);
  document.body.appendChild(popupOverlay);

  return { popupOverlay, popupContent, popupImage, popupTitle, popupMeta, popupPrice, closeButton };
}

function setupDishPopups() {
  const dishes = Array.from(document.querySelectorAll(".dish-container"));
  if (!dishes.length) return;

  const popup = createPopup();
  let lastFocused = null;

  function closePopup() {
    popup.popupOverlay.classList.remove("active");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function showPopup(dish, trigger) {
    const title = dish.querySelector("h3")?.textContent.trim() || "Dish";
    const description = dish.querySelector(".dish-info p")?.textContent.trim() || "";
    const price = dish.querySelector(".price")?.textContent.trim() || "";
    const image = dish.querySelector("img");

    popup.popupTitle.textContent = title;
    popup.popupMeta.textContent = `${description} We prepare this fresh when ordered.`;
    popup.popupPrice.textContent = price;
    popup.popupImage.src = image?.getAttribute("src") || "";
    popup.popupImage.alt = image?.getAttribute("alt") || title;

    popup.popupOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
    lastFocused = trigger || null;
    popup.closeButton.focus();
  }

  dishes.forEach((dish) => {
    const trigger = dish.querySelector(".dish-action");
    if (!trigger) return;

    trigger.addEventListener("click", () => showPopup(dish, trigger));
  });

  popup.closeButton.addEventListener("click", closePopup);

  popup.popupOverlay.addEventListener("click", (event) => {
    if (event.target === popup.popupOverlay) {
      closePopup();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.popupOverlay.classList.contains("active")) {
      closePopup();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupHeaderScroll();

  const { closeMenu } = setupMobileNav();
  setupNavLinks(closeMenu);

  setupCarousel();
  setupMenuFiltering();
  setupDishPopups();
});
