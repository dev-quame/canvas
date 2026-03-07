"use strict";

function setupHeaderScroll() {
  const headerContainer = document.querySelector(".header-container");
  if (!headerContainer) return;

  window.addEventListener(
    "scroll",
    () => {
      headerContainer.classList.toggle("scrolled", window.scrollY > 50);
    },
    { passive: true }
  );
}

function setupCarousel() {
  const carousel = document.querySelector(".carousel-container");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const nextButton = document.querySelector(".next-caro");
  const previousButton = document.querySelector(".previous-caro");
  const indicators = Array.from(document.querySelectorAll(".indicator"));

  if (!carousel || !slides.length || !nextButton || !previousButton || !indicators.length) {
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

  function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
  }

  function previousSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = window.setInterval(nextSlide, 4000);
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      window.clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  nextButton.addEventListener("click", nextSlide);
  previousButton.addEventListener("click", previousSlide);

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      currentSlide = index;
      updateCarousel();
    });
  });

  const offersContainer = carousel.parentElement;
  if (offersContainer) {
    offersContainer.addEventListener("mouseenter", stopAutoplay);
    offersContainer.addEventListener("mouseleave", startAutoplay);
  }

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
    if (delta > 50) nextSlide();
    if (delta < -50) previousSlide();
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

function setupMobileNav() {
  const hamburger = document.getElementById("hamburger");
  const navList = document.getElementById("primary-nav");
  const overlay = document.getElementById("overlay");
  if (!hamburger || !navList || !overlay) return;

  function closeMenu() {
    navList.classList.remove("active");
    hamburger.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    overlay.classList.remove("active");
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  function openMenu() {
    navList.classList.add("active");
    hamburger.classList.add("active");
    hamburger.setAttribute("aria-expanded", "true");
    overlay.hidden = false;
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  hamburger.addEventListener("click", () => {
    if (navList.classList.contains("active")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navList.classList.contains("active")) {
      closeMenu();
    }
  });

  document.querySelectorAll("#primary-nav a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 751px)").matches) {
      closeMenu();
    }
  });
}

function createPopup() {
  const popupOverlay = document.createElement("div");
  popupOverlay.className = "popup-overlay";
  popupOverlay.id = "popup-overlay";

  const popupContent = document.createElement("div");
  popupContent.className = "popup-content";

  const closeButton = document.createElement("button");
  closeButton.className = "popup-close";
  closeButton.textContent = "×";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close popup");

  const popupTitle = document.createElement("h2");
  popupTitle.className = "popup-title";

  const popupBody = document.createElement("div");
  popupBody.className = "popup-body";

  popupContent.appendChild(closeButton);
  popupContent.appendChild(popupTitle);
  popupContent.appendChild(popupBody);
  popupOverlay.appendChild(popupContent);
  document.body.appendChild(popupOverlay);

  closeButton.addEventListener("click", closePopup);
  popupOverlay.addEventListener("click", (event) => {
    if (event.target === popupOverlay) {
      closePopup();
    }
  });

  return { popupOverlay, popupTitle, popupBody };
}

function closePopup() {
  if (!window.musaPopupElements) return;

  const { popupOverlay } = window.musaPopupElements;
  popupOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

function showPopup(title) {
  if (!window.musaPopupElements) {
    window.musaPopupElements = createPopup();
  }

  const { popupOverlay, popupTitle, popupBody } = window.musaPopupElements;

  popupTitle.textContent = title;
  popupBody.textContent = "";

  const info = document.createElement("p");
  info.textContent = `${title} is one of our most requested dishes and a top recommendation from our kitchen.`;

  const note = document.createElement("p");
  note.textContent = "Place your order and we will prepare it fresh for you.";

  const actionWrap = document.createElement("div");
  actionWrap.style.marginTop = "1rem";

  const actionButton = document.createElement("button");
  actionButton.className = "popup-action-btn";
  actionButton.type = "button";
  actionButton.textContent = "Order in progress";
  actionButton.style.padding = "10px 20px";
  actionButton.style.background = "#4CAF50";
  actionButton.style.color = "#ffffff";
  actionButton.style.border = "none";
  actionButton.style.borderRadius = "5px";
  actionButton.style.cursor = "pointer";

  actionWrap.appendChild(actionButton);
  popupBody.appendChild(info);
  popupBody.appendChild(note);
  popupBody.appendChild(actionWrap);

  popupOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function setupDishPopups() {
  const dishHeaders = document.querySelectorAll(".dish-container .dish-info h3");
  if (!dishHeaders.length) return;

  dishHeaders.forEach((header) => {
    header.style.cursor = "pointer";
    header.setAttribute("tabindex", "0");
    header.setAttribute("role", "button");
    header.setAttribute("aria-label", `Open details for ${header.textContent}`);

    const open = () => showPopup(header.textContent.trim());
    header.addEventListener("click", open);
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && window.musaPopupElements?.popupOverlay.classList.contains("active")) {
      closePopup();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupHeaderScroll();
  setupCarousel();
  setupMobileNav();
  setupDishPopups();
});
