"use strict";

const MAIN_PAGE_PATH = "allInOneBarca.html";
const MOBILE_BREAKPOINT = 920;
const STORAGE_KEYS = {
  articlePayload: "barca_article_payload",
  articleCatalog: "barca_article_catalog",
};

let closeMobileMenu = () => {};

function isArticlePage() {
  return /blogpost\.html$/i.test(window.location.pathname);
}

function headerHeightFix() {
  const header = document.querySelector(".header-container");
  if (!header) return;

  const height = header.offsetHeight;
  document.documentElement.style.scrollPaddingTop = `${height + 12}px`;
  document.documentElement.style.setProperty("--header-height", `${height}px`);
}

function hideMainWrapper() {
  const homePage = document.getElementById("home");
  const mainWrapper = document.querySelector(".main-wrapper");

  if (!homePage || !mainWrapper) return;
  mainWrapper.style.display = homePage.classList.contains("active") ? "none" : "block";
}

function setActiveNav(navId) {
  document.querySelectorAll("#main-menu .nav-link[data-nav]").forEach((link) => {
    const active = link.getAttribute("data-nav") === navId;
    link.classList.toggle("active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function activatePage(navId, options = {}) {
  const { scrollTop = true } = options;
  const pages = document.querySelectorAll(".main-container .page");
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

  try {
    sessionStorage.setItem("barca_active_nav", navId);
  } catch (error) {
    // Ignore storage issues.
  }

  return true;
}

function routeToMainPage(navId, query = "") {
  try {
    sessionStorage.setItem("barca_active_nav", navId);
  } catch (error) {
    // Ignore storage issues.
  }

  const encodedHash = `#${encodeURIComponent(navId)}`;
  const path = query ? `${MAIN_PAGE_PATH}?${query}${encodedHash}` : `${MAIN_PAGE_PATH}${encodedHash}`;
  window.location.href = path;
}

function setupNavigation() {
  const navLinks = document.querySelectorAll("#main-menu .nav-link[data-nav]");
  if (!navLinks.length) return;

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeMobileMenu();

      const navId = link.getAttribute("data-nav");
      if (!navId) return;

      const activated = activatePage(navId);
      if (!activated) {
        routeToMainPage(navId);
        return;
      }

      const targetHash = `#${navId}`;
      if (window.location.hash !== targetHash) {
        history.replaceState(null, "", targetHash);
      }
    });
  });
}

function setupJoinShortcut() {
  const joinLinks = document.querySelectorAll('a[href="#join"]');
  if (!joinLinks.length) return;

  joinLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const joinSection = document.getElementById("join");
      if (!joinSection) return;

      event.preventDefault();
      const activated = activatePage("home", { scrollTop: false });
      if (!activated) {
        window.location.href = `${MAIN_PAGE_PATH}#join`;
        return;
      }

      requestAnimationFrame(() => {
        joinSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  });
}

function setupMobileMenu() {
  const menuButton = document.getElementById("menu-toggle");
  const menuIcon = menuButton?.querySelector("i");
  const nav = document.getElementById("primary-nav");
  const scrim = document.getElementById("nav-scrim");
  if (!menuButton || !nav || !scrim || !menuIcon) return;

  function syncToggleVisual(isOpen) {
    menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    menuIcon.classList.toggle("fa-bars", !isOpen);
    menuIcon.classList.toggle("fa-xmark", isOpen);
  }

  function openMenu() {
    scrim.hidden = false;
    document.body.classList.add("menu-open");
    syncToggleVisual(true);
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    syncToggleVisual(false);
    scrim.hidden = true;
  }

  syncToggleVisual(false);

  menuButton.addEventListener("click", () => {
    if (document.body.classList.contains("menu-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMenu();
    }
  });

  scrim.addEventListener("click", closeMenu);

  const desktopMedia = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT + 1}px)`);
  const syncMenuForViewport = (event) => {
    if (event.matches) {
      closeMenu();
    }
  };
  syncMenuForViewport(desktopMedia);
  if (typeof desktopMedia.addEventListener === "function") {
    desktopMedia.addEventListener("change", syncMenuForViewport);
  } else if (typeof desktopMedia.addListener === "function") {
    desktopMedia.addListener(syncMenuForViewport);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
      closeMenu();
    }
  });

  closeMobileMenu = closeMenu;
}

function getPostElements() {
  return Array.from(document.querySelectorAll(".main-wrapper .blogPost")).filter((post) => !post.classList.contains("blog-placeholder"));
}

function extractSlugFromHref(href) {
  try {
    const url = new URL(href, window.location.href);
    return url.searchParams.get("slug") || "";
  } catch (error) {
    return "";
  }
}

function parseDateLine(dateLine) {
  const trimmed = (dateLine || "").trim();
  const match = trimmed.match(/^(@?[^\d]+?)\s+(\d.*)$/);
  if (!match) {
    return {
      author: "@Barca4L",
      date: trimmed || "August 2025",
    };
  }

  return {
    author: match[1].trim(),
    date: match[2].trim(),
  };
}

function extractPostData(post) {
  const title = (post.querySelector("h2")?.textContent || "Untitled story").trim();
  const description = (post.querySelector(".description")?.textContent || "").trim();
  const dateLine = post.querySelector(".date")?.textContent || "";
  const image = post.querySelector("img")?.getAttribute("src") || "";
  const link = post.querySelector('a[href*="blogPost.html"]')?.getAttribute("href") || "";
  const slug = extractSlugFromHref(link);
  const parsedDate = parseDateLine(dateLine);

  return {
    slug,
    title,
    description,
    dateLine,
    author: parsedDate.author,
    date: parsedDate.date,
    image,
    link,
  };
}

function buildSearchResultItem(post, term) {
  const title = (post.querySelector("h2")?.textContent || "Untitled").trim();
  const description = (post.querySelector(".description")?.textContent || "").trim();
  const dateLine = (post.querySelector(".date")?.textContent || "").trim();
  const lowerDescription = description.toLowerCase();
  const matchIndex = lowerDescription.indexOf(term);

  let snippet = description;
  if (matchIndex >= 0) {
    const start = Math.max(0, matchIndex - 38);
    const end = Math.min(description.length, matchIndex + 116);
    snippet = `${start > 0 ? "..." : ""}${description.slice(start, end)}${end < description.length ? "..." : ""}`;
  } else if (description.length > 156) {
    snippet = `${description.slice(0, 156)}...`;
  }

  const item = document.createElement("button");
  item.type = "button";
  item.className = "search-result-item";
  item.setAttribute("aria-label", `Open article: ${title}`);

  const titleEl = document.createElement("div");
  titleEl.className = "search-result-title";
  titleEl.textContent = title;

  const snippetEl = document.createElement("p");
  snippetEl.className = "search-result-snippet";
  snippetEl.textContent = dateLine ? `${dateLine} - ${snippet}` : snippet;

  item.append(titleEl, snippetEl);
  return item;
}

function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function setupSearch() {
  const menuSearchBtn = document.getElementById("menu-search");
  const searchOverlay = document.getElementById("searchOverlay");
  const closeSearchBtn = searchOverlay?.querySelector(".close-search");
  const searchInput = document.getElementById("barca-search-input");
  const resultsContainer = document.getElementById("search-results");
  const searchHint = document.getElementById("search-hint");

  if (!menuSearchBtn || !searchOverlay || !closeSearchBtn || !searchInput || !resultsContainer) {
    return {
      openAndSearch: () => {},
    };
  }

  function openOverlay() {
    closeMobileMenu();
    searchOverlay.hidden = false;
    menuSearchBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("search-open");
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeOverlay() {
    searchOverlay.hidden = true;
    menuSearchBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("search-open");
    clearNode(resultsContainer);
    searchInput.value = "";
    if (searchHint) {
      searchHint.textContent = "Type at least 2 characters to search your stories.";
    }
  }

  function renderNoMainFeedResults(term) {
    const link = document.createElement("a");
    link.className = "search-link-item";
    link.href = `${MAIN_PAGE_PATH}?search=${encodeURIComponent(term)}#latest`;
    link.textContent = `Open main feed and search for "${term}"`;
    clearNode(resultsContainer);
    resultsContainer.appendChild(link);
  }

  function performSearch(rawTerm) {
    const term = (rawTerm || "").trim().toLowerCase();
    clearNode(resultsContainer);

    if (term.length < 2) {
      if (searchHint) {
        searchHint.textContent = "Type at least 2 characters to search your stories.";
      }
      return;
    }

    const posts = getPostElements();
    if (!posts.length) {
      if (searchHint) {
        searchHint.textContent = "Search runs on the main feed.";
      }
      renderNoMainFeedResults(term);
      return;
    }

    const matches = posts
      .filter((post) => {
        const title = post.querySelector("h2")?.textContent.toLowerCase() || "";
        const desc = post.querySelector(".description")?.textContent.toLowerCase() || "";
        const date = post.querySelector(".date")?.textContent.toLowerCase() || "";
        return `${title} ${desc} ${date}`.includes(term);
      })
      .slice(0, 18);

    if (!matches.length) {
      const message = document.createElement("p");
      message.className = "search-result-snippet";
      message.textContent = "No stories matched that term.";
      resultsContainer.appendChild(message);
      if (searchHint) {
        searchHint.textContent = "Try another keyword like player name, match, or transfer.";
      }
      return;
    }

    if (searchHint) {
      searchHint.textContent = `${matches.length} result${matches.length > 1 ? "s" : ""} found.`;
    }

    matches.forEach((post) => {
      const item = buildSearchResultItem(post, term);
      item.addEventListener("click", () => {
        const page = post.closest(".page");
        if (!page?.id) return;

        activatePage(page.id, { scrollTop: false });
        closeOverlay();
        window.requestAnimationFrame(() => {
          post.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
      resultsContainer.appendChild(item);
    });
  }

  menuSearchBtn.addEventListener("click", () => {
    if (searchOverlay.hidden) {
      openOverlay();
    } else {
      closeOverlay();
    }
  });

  closeSearchBtn.addEventListener("click", closeOverlay);

  searchOverlay.addEventListener("click", (event) => {
    if (event.target === searchOverlay) {
      closeOverlay();
    }
  });

  searchInput.addEventListener("input", (event) => {
    performSearch(event.target.value || "");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !searchOverlay.hidden) {
      closeOverlay();
    }
  });

  return {
    openAndSearch(term) {
      openOverlay();
      searchInput.value = term;
      performSearch(term);
    },
  };
}

function setupNewsletterForm() {
  const form = document.querySelector(".newsletter-form");
  const emailInput = document.getElementById("newsletter-email");
  const statusEl = document.getElementById("newsletter-status");
  if (!form || !emailInput || !statusEl) return;

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove("success", "error");
    if (type) {
      statusEl.classList.add(type);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = (emailInput.value || "").trim();
    if (!emailInput.checkValidity()) {
      setStatus("Enter a valid email address.", "error");
      emailInput.focus();
      return;
    }

    form.querySelector("button")?.setAttribute("disabled", "disabled");
    setStatus("Subscribing...", "");

    window.setTimeout(() => {
      try {
        localStorage.setItem("barca_newsletter_email", email);
      } catch (error) {
        // Ignore storage issues.
      }

      setStatus("You are subscribed. Weekly Barca4L bulletin is on the way.", "success");
      form.reset();
      form.querySelector("button")?.removeAttribute("disabled");
    }, 450);
  });
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getStoredJson(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function calculateReadTime(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
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

function buildArticleNarrative(title, summary) {
  const cleanSummary = (summary || "").trim();
  if (!cleanSummary) {
    return [
      "Barca4L article content was not attached to this link yet.",
      "Use the main feed to open a story card and this page will carry its full summary and context automatically.",
    ].join("\n\n");
  }

  return [
    cleanSummary,
    `${title} is a developing storyline in the wider season arc, with implications for squad balance, role clarity, and short-term results.`,
    "Barca4L tracks these stories with an emphasis on practical impact: who benefits, who loses minutes, and what changes before the next fixture.",
  ].join("\n\n");
}

function renderRelatedArticles(currentSlug) {
  const container = document.getElementById("related-articles");
  if (!container) return;

  const catalog = getStoredJson(STORAGE_KEYS.articleCatalog);
  if (!Array.isArray(catalog) || !catalog.length) return;

  const candidates = catalog.filter((item) => item.slug && item.slug !== currentSlug).slice(0, 3);
  if (!candidates.length) return;

  clearNode(container);

  candidates.forEach((item) => {
    const card = document.createElement("a");
    card.className = "related-card";
    card.href = item.link || `${MAIN_PAGE_PATH}#latest`;

    const img = document.createElement("img");
    img.src = item.image || "img/barcaLogo.jpeg";
    img.alt = item.title || "Related story";

    const content = document.createElement("div");
    content.className = "related-card-content";

    const title = document.createElement("h4");
    title.textContent = item.title || "Barca story";

    content.appendChild(title);
    card.append(img, content);
    container.appendChild(card);
  });
}

function populateArticleFromParams() {
  const queryTitle = getQueryParam("title");
  const queryImg = getQueryParam("img");
  const queryAuthor = getQueryParam("author");
  const queryDate = getQueryParam("date");
  const queryDesc = getQueryParam("desc");
  const querySlug = getQueryParam("slug");

  const stored = getStoredJson(STORAGE_KEYS.articlePayload);
  const canUseStored = stored && (!querySlug || !stored.slug || stored.slug === querySlug);

  const title = queryTitle || (canUseStored ? stored.title : "Story title");
  const img = queryImg || (canUseStored ? stored.image : "");
  const author = queryAuthor || (canUseStored ? stored.author : "@Barca4L");
  const date = queryDate || (canUseStored ? stored.date : "August 2025");
  const description = queryDesc || (canUseStored ? stored.description : "");

  const titleEl = document.getElementById("article-title");
  const imageEl = document.getElementById("article-image");
  const authorEl = document.getElementById("article-author");
  const dateEl = document.getElementById("article-date");
  const contentEl = document.getElementById("article-content");
  const readTimeEl = document.getElementById("read-time");

  if (titleEl) {
    titleEl.textContent = title;
    document.title = `Barca4L | ${title}`;
  }

  if (authorEl) {
    authorEl.textContent = author || "@Barca4L";
  }

  if (dateEl) {
    dateEl.textContent = date || "August 2025";
  }

  if (imageEl) {
    const normalizedImg = (img || "").replace(/^\/+/, "");
    if (normalizedImg && normalizedImg.startsWith("img/")) {
      imageEl.src = normalizedImg;
      imageEl.alt = title || "Article image";
    } else {
      imageEl.src = "img/barcaLogo.jpeg";
      imageEl.alt = "Barca4L";
    }
  }

  if (contentEl) {
    const bodyText = buildArticleNarrative(title, description);
    setArticleBodyFromText(contentEl, bodyText);
  }

  if (readTimeEl && contentEl) {
    const minutes = calculateReadTime(contentEl.textContent || "");
    readTimeEl.textContent = `${minutes} min read`;
  }

  renderRelatedArticles(querySlug || (canUseStored ? stored.slug : ""));
}

function openShareWindow(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }

  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  tempInput.setAttribute("readonly", "readonly");
  tempInput.style.position = "fixed";
  tempInput.style.opacity = "0";
  tempInput.style.pointerEvents = "none";
  tempInput.style.left = "-9999px";
  document.body.appendChild(tempInput);

  try {
    tempInput.select();
    const copied = document.execCommand("copy");
    if (!copied) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(tempInput);
  }
}

function initShareButtons() {
  const shareButtons = document.querySelectorAll(".share-btn");
  if (!shareButtons.length) return;

  const currentUrl = window.location.href;
  const articleTitle = document.getElementById("article-title")?.textContent || document.title;
  const copyButton = document.getElementById("copy-article-link");
  const defaultCopyLabel = copyButton?.textContent?.trim() || "Copy Link";

  shareButtons.forEach((button) => {
    button.addEventListener("click", async () => {
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
        return;
      }

      if (button.classList.contains("copy-link")) {
        try {
          await copyTextToClipboard(currentUrl);
          if (copyButton) {
            copyButton.textContent = "Link Copied";
            setTimeout(() => {
              copyButton.textContent = defaultCopyLabel;
            }, 1200);
          }
        } catch (error) {
          if (copyButton) {
            copyButton.textContent = "Copy Failed";
            setTimeout(() => {
              copyButton.textContent = defaultCopyLabel;
            }, 1400);
          }
        }
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

function saveCatalogFromMainPage() {
  const posts = getPostElements();
  if (!posts.length) return;

  const catalog = posts
    .map(extractPostData)
    .filter((item) => item.title && item.link)
    .slice(0, 40);

  try {
    sessionStorage.setItem(STORAGE_KEYS.articleCatalog, JSON.stringify(catalog));
  } catch (error) {
    // Ignore storage issues.
  }
}

function setupArticleSelectionPersistence() {
  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest && event.target.closest('a[href*="blogPost.html"]');
      if (!anchor) return;

      const post = anchor.closest(".blogPost");
      if (!post) return;

      const payload = extractPostData(post);
      if (!payload.title) return;

      try {
        sessionStorage.setItem(STORAGE_KEYS.articlePayload, JSON.stringify(payload));
      } catch (error) {
        // Ignore storage issues.
      }
    },
    { capture: true }
  );
}

function applyPendingSearch(searchApi) {
  if (!searchApi || typeof searchApi.openAndSearch !== "function") return;
  const searchTerm = getQueryParam("search");
  if (!searchTerm) return;

  searchApi.openAndSearch(searchTerm);
}

document.addEventListener("DOMContentLoaded", () => {
  headerHeightFix();
  hideMainWrapper();
  setupMobileMenu();
  setupNavigation();
  setupJoinShortcut();
  setupNewsletterForm();
  setupArticleSelectionPersistence();
  saveCatalogFromMainPage();

  const searchApi = setupSearch();

  if (isArticlePage()) {
    setupBlogPostPage();
  } else {
    initActivePageFromHash();
    applyPendingSearch(searchApi);
  }
});

window.addEventListener("load", () => {
  headerHeightFix();
  hideMainWrapper();
});

let resizeFrame = 0;
window.addEventListener("resize", () => {
  if (resizeFrame) {
    window.cancelAnimationFrame(resizeFrame);
  }

  resizeFrame = window.requestAnimationFrame(() => {
    headerHeightFix();
    resizeFrame = 0;
  });
});
window.addEventListener("hashchange", () => {
  const hashId = window.location.hash.replace("#", "").trim();
  if (hashId) {
    activatePage(hashId, { scrollTop: false });
  }
  hideMainWrapper();
});
