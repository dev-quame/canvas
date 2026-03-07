"use strict";

const MAIN_PAGE_PATH = "allInOneBarca.html";

function headerHeightFix() {
  const header = document.querySelector(".header-container");
  if (!header) return;

  const headerHeight = header.offsetHeight;
  document.documentElement.style.scrollPaddingTop = `${headerHeight + 5}px`;
}

function hideMainWrapper() {
  const homePage = document.getElementById("home");
  const mainWrapper = document.querySelector(".main-wrapper");

  if (!homePage || !mainWrapper) return;
  mainWrapper.style.display = homePage.classList.contains("active") ? "none" : "block";
}

function setActiveNav(navId) {
  document.querySelectorAll(".nav-link[data-nav]").forEach((link) => {
    const matches = link.getAttribute("data-nav") === navId;
    link.classList.toggle("active", matches);
    if (matches) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function activatePage(navId, options = {}) {
  const { scrollTop = true } = options;
  const pages = document.querySelectorAll(".page");
  const targetPage = document.getElementById(navId);

  if (!pages.length || !targetPage || !targetPage.classList.contains("page")) {
    return false;
  }

  pages.forEach((page) => page.classList.remove("active"));
  targetPage.classList.add("active");
  setActiveNav(navId);
  hideMainWrapper();

  if (scrollTop) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  return true;
}

function routeToMainPage(navId) {
  try {
    sessionStorage.setItem("barca_active_nav", navId);
  } catch (error) {
    // Ignore storage issues.
  }
  window.location.href = `${MAIN_PAGE_PATH}#${encodeURIComponent(navId)}`;
}

function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link[data-nav]");
  if (!navLinks.length) return;

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const navId = link.getAttribute("data-nav");
      if (!navId) return;

      const activated = activatePage(navId);
      if (!activated) {
        routeToMainPage(navId);
        return;
      }

      const targetHash = `#${navId}`;
      if (location.hash !== targetHash) {
        history.replaceState(null, "", targetHash);
      }
    });
  });
}

function setupMediaQueryHighlighter() {
  const element = document.querySelector("#highlighter");
  if (!element) return;

  const highlightClass = "highlight";
  const mediaQuery = window.matchMedia("(width < 635px)");

  function syncHighlight(event) {
    const shouldRemove = event.matches;
    element.classList.toggle(highlightClass, !shouldRemove);
  }

  syncHighlight(mediaQuery);
  mediaQuery.addEventListener("change", syncHighlight);
}

function buildSearchResultItem(post, term) {
  const title = (post.querySelector("h2")?.textContent || "Untitled").trim();
  const description = (post.querySelector(".description")?.textContent || "").trim();
  const lowerDescription = description.toLowerCase();
  const matchIndex = lowerDescription.indexOf(term);

  let snippet = description;
  if (matchIndex >= 0) {
    const start = Math.max(0, matchIndex - 36);
    const end = Math.min(description.length, matchIndex + 120);
    snippet = `${start > 0 ? "..." : ""}${description.slice(start, end)}${end < description.length ? "..." : ""}`;
  } else if (description.length > 150) {
    snippet = `${description.slice(0, 150)}...`;
  }

  const item = document.createElement("button");
  item.type = "button";
  item.className = "search-result-item";
  item.setAttribute("aria-label", `Open article: ${title}`);

  const titleEl = document.createElement("div");
  titleEl.className = "search-result-title";
  titleEl.textContent = title;

  const snippetEl = document.createElement("div");
  snippetEl.className = "search-result-snippet";
  snippetEl.textContent = snippet;

  item.appendChild(titleEl);
  item.appendChild(snippetEl);
  return item;
}

function setupSearch() {
  const menuSearchBtn = document.getElementById("menu-search");
  const searchOverlay = document.getElementById("searchOverlay");
  const closeSearchBtn = searchOverlay?.querySelector(".close-search");
  const searchInput = document.getElementById("barca-search-input");
  const resultsContainer = document.getElementById("search-results");

  if (!menuSearchBtn || !searchOverlay || !closeSearchBtn || !searchInput || !resultsContainer) {
    return;
  }

  function openOverlay() {
    searchOverlay.hidden = false;
    searchOverlay.classList.add("active");
    menuSearchBtn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeOverlay() {
    searchOverlay.classList.remove("active");
    searchOverlay.hidden = true;
    menuSearchBtn.setAttribute("aria-expanded", "false");
    searchInput.value = "";
    resultsContainer.textContent = "";
  }

  menuSearchBtn.addEventListener("click", () => {
    if (searchOverlay.classList.contains("active")) {
      closeOverlay();
    } else {
      openOverlay();
    }
  });

  closeSearchBtn.addEventListener("click", closeOverlay);

  searchOverlay.addEventListener("click", (event) => {
    if (event.target === searchOverlay) {
      closeOverlay();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && searchOverlay.classList.contains("active")) {
      closeOverlay();
    }
  });

  searchInput.addEventListener("input", (event) => {
    const term = (event.target.value || "").trim().toLowerCase();
    resultsContainer.textContent = "";
    if (!term) return;

    const posts = Array.from(document.querySelectorAll(".main-wrapper .blogPost"))
      .filter((post) => !post.classList.contains("blog-placeholder"));

    const matches = posts.filter((post) => {
      const title = post.querySelector("h2")?.textContent.toLowerCase() || "";
      const desc = post.querySelector(".description")?.textContent.toLowerCase() || "";
      return `${title} ${desc}`.includes(term);
    }).slice(0, 20);

    if (!matches.length) {
      const noResult = document.createElement("p");
      noResult.className = "search-result-snippet";
      noResult.textContent = "No results found.";
      resultsContainer.appendChild(noResult);
      return;
    }

    matches.forEach((post) => {
      const resultItem = buildSearchResultItem(post, term);
      resultItem.addEventListener("click", () => {
        const page = post.closest(".page");
        if (!page?.id) return;

        activatePage(page.id, { scrollTop: false });
        closeOverlay();
        setTimeout(() => {
          post.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      });
      resultsContainer.appendChild(resultItem);
    });
  });
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function calculateReadTime(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function setArticleBodyFromText(container, text) {
  container.textContent = "";
  const paragraphs = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    const p = document.createElement("p");
    p.textContent = text.trim();
    container.appendChild(p);
    return;
  }

  paragraphs.forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    container.appendChild(p);
  });
}

function populateArticleFromParams() {
  const title = getQueryParam("title");
  const img = getQueryParam("img");
  const author = getQueryParam("author");
  const date = getQueryParam("date");
  const desc = getQueryParam("desc");

  const titleEl = document.getElementById("article-title");
  const imageEl = document.getElementById("article-image");
  const authorEl = document.getElementById("article-author");
  const dateEl = document.getElementById("article-date");
  const contentEl = document.getElementById("article-content");
  const readTimeEl = document.getElementById("read-time");

  if (titleEl && title) {
    titleEl.textContent = title;
    document.title = `Barca4L | ${title}`;
  }

  if (authorEl) {
    authorEl.textContent = author || "@Barca4L";
  }

  if (dateEl && date) {
    dateEl.textContent = date;
  }

  if (imageEl && img) {
    const normalizedImg = img.replace(/^\/+/, "");
    if (normalizedImg.startsWith("img/")) {
      imageEl.src = normalizedImg;
      imageEl.alt = title || "Article image";
    }
  }

  if (contentEl && desc) {
    setArticleBodyFromText(contentEl, desc);
  }

  if (readTimeEl && contentEl) {
    const minutes = calculateReadTime(contentEl.textContent || "");
    readTimeEl.textContent = `${minutes} min read`;
  }
}

function openShareWindow(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function initShareButtons() {
  const shareButtons = document.querySelectorAll(".share-btn");
  if (!shareButtons.length) return;

  const currentUrl = window.location.href;
  const articleTitle = document.getElementById("article-title")?.textContent || document.title;

  shareButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("twitter")) {
        openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(currentUrl)}`);
        return;
      }

      if (button.classList.contains("facebook")) {
        openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`);
        return;
      }

      if (button.classList.contains("whatsapp")) {
        openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${articleTitle} ${currentUrl}`)}`);
      }
    });
  });
}

function setupBlogPostPage() {
  populateArticleFromParams();
  initShareButtons();

  try {
    const pending = sessionStorage.getItem("barca_active_nav");
    if (pending) {
      setActiveNav(pending);
    }
  } catch (error) {
    // Ignore storage issues.
  }
}

function initActivePageFromHash() {
  const hashId = window.location.hash.replace("#", "").trim();
  if (hashId && activatePage(hashId, { scrollTop: false })) {
    return;
  }
  activatePage("home", { scrollTop: false });
}

document.addEventListener("DOMContentLoaded", () => {
  headerHeightFix();
  hideMainWrapper();
  setupNavigation();
  setupMediaQueryHighlighter();
  setupSearch();

  if (window.location.pathname.toLowerCase().includes("blogpost.html")) {
    setupBlogPostPage();
  } else {
    initActivePageFromHash();
  }
});

window.addEventListener("load", () => {
  headerHeightFix();
  hideMainWrapper();
});

window.addEventListener("resize", headerHeightFix);
window.addEventListener("hashchange", () => {
  const hashId = window.location.hash.replace("#", "").trim();
  if (hashId) {
    activatePage(hashId, { scrollTop: false });
  }
  hideMainWrapper();
});
