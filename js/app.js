
/* =========================================================
   ADDIS EATS - MAIN APP
   ========================================================= */

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let allDishes = [];
let filteredDishes = [];
let selectedDish = null;

let previousDishModalFocus = null;

const LAST_SECTION_STORAGE_KEY = "addiseats_last_section";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const sections = document.querySelectorAll("main > section");

const menuSection = document.getElementById("menu");
const menuList = document.getElementById("dish-list");

const menuResultInfo = document.getElementById("menu-result-info");
const menuResultCount = document.getElementById("menu-result-count");

const menuSearch = document.getElementById("menu-search");
const clearSearchButton = document.getElementById("clear-search");

const categoryButtons = document.querySelectorAll(".category-button");

const menuEmptyState = document.getElementById("menu-empty-state");
const menuErrorState = document.getElementById("menu-error-state");
const menuErrorMessage = document.getElementById("menu-error-message");
const retryMenuButton = document.getElementById("retry-menu");
const clearMenuFiltersButton =
  document.getElementById("clear-menu-filters");

const dishModal = document.getElementById("dish-modal");
const closeDishModalButton =
  document.getElementById("close-dish-modal");

const dishModalImage =
  document.getElementById("dish-modal-image");

const dishModalTitle =
  document.getElementById("dish-modal-title");

const dishModalDescription =
  document.getElementById("dish-modal-description");

const dishModalPrice =
  document.getElementById("dish-modal-price");

const dishModalCategory =
  document.getElementById("dish-modal-category");

const dishModalSpicy =
  document.getElementById("dish-modal-spicy");

const dishModalIngredients =
  document.getElementById("dish-modal-ingredients");

const dishModalAdd =
  document.getElementById("dish-modal-add");

const oldSkeleton =
  document.getElementById("dish-skeleton");


/* =========================================================
   OLD SKELETON CONTAINER
   ========================================================= */

if (oldSkeleton) {
  oldSkeleton.style.display = "none";
}


/* =========================================================
   SECTION / PAGE NAVIGATION
   ========================================================= */

function isValidSection(sectionId) {
  return Array.from(sections).some(
    (section) => section.id === sectionId
  );
}

function showSection(sectionId) {
  if (!isValidSection(sectionId)) {
    console.warn(`Addis Eats: section "${sectionId}" was not found.`);
    return;
  }

  sections.forEach((section) => {
    section.hidden = section.id !== sectionId;
  });

  // Remember the section so refresh returns to the same place.
  try {
    localStorage.setItem(
      LAST_SECTION_STORAGE_KEY,
      sectionId
    );
  } catch (error) {
    console.warn("Could not remember the current section.", error);
  }

  window.scrollTo({
    top: 0,
    behavior: "auto",
  });

  if (
    sectionId === "orders" &&
    typeof renderOrders === "function"
  ) {
    renderOrders();
  }

  if (
    sectionId === "favorites" &&
    typeof renderFavorites === "function"
  ) {
    renderFavorites();
  }

  updateActiveNavigation(sectionId);
}

function getInitialSection() {
  try {
    const savedSection = localStorage.getItem(
      LAST_SECTION_STORAGE_KEY
    );

    if (savedSection && isValidSection(savedSection)) {
      return savedSection;
    }
  } catch (error) {
    console.warn("Could not restore the previous section.", error);
  }

  return "home";
}


/* =========================================================
   ACTIVE NAVIGATION
   ========================================================= */

function updateActiveNavigation(sectionId) {
  const navigationLinks = document.querySelectorAll(
    "[data-scroll], [data-section]",
  );

  navigationLinks.forEach((link) => {
    const target =
      link.dataset.scroll || link.dataset.section;

    if (target === sectionId) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });
}


/* =========================================================
   NAVIGATION CLICK HANDLING
   ========================================================= */

document.addEventListener("click", (event) => {
  const navigationTarget = event.target.closest(
    "[data-scroll], [data-section]",
  );

  if (!navigationTarget) {
    return;
  }

  const targetSection =
    navigationTarget.dataset.scroll ||
    navigationTarget.dataset.section;

  if (!targetSection) {
    return;
  }

  if (navigationTarget.hasAttribute("data-category-link")) {
    return;
  }

  if (navigationTarget.closest("#dish-modal")) {
    return;
  }

  event.preventDefault();

  showSection(targetSection);

  const navigation =
    document.getElementById("main-navigation");

  const menuToggle =
    document.getElementById("mobile-menu-toggle");

  if (navigation) {
    navigation.classList.remove("open");
  }

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
  }
});


/* =========================================================
   LOAD DISH DATA
   ========================================================= */

async function loadDishes() {
  showMenuLoading();

  try {
    const response = await fetch("data/data.json");

    if (!response.ok) {
      throw new Error("Failed to load menu data.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Menu data is not valid.");
    }

    allDishes = data;

    if (menuErrorState) {
      menuErrorState.hidden = true;
    }

    applyMenuFilters();

  } catch (error) {
    console.error("Menu loading error:", error);

    allDishes = [];
    filteredDishes = [];

    if (menuList) {
      menuList.innerHTML = "";
    }

    if (menuResultInfo) {
      menuResultInfo.hidden = true;
    }

    if (menuEmptyState) {
      menuEmptyState.hidden = true;
    }

    if (menuErrorState) {
      menuErrorState.hidden = false;
    }

    if (menuErrorMessage) {
      menuErrorMessage.textContent =
        "We could not load the menu right now. Please try again.";
    }
  }
}


/* =========================================================
   MENU LOADING STATE
   ========================================================= */

function showMenuLoading() {
  if (menuErrorState) {
    menuErrorState.hidden = true;
  }

  if (menuEmptyState) {
    menuEmptyState.hidden = true;
  }

  if (menuResultInfo) {
    menuResultInfo.hidden = true;
  }

  if (!menuList) {
    return;
  }

  menuList.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    menuList.insertAdjacentHTML(
      "beforeend",
      createLoadingSkeleton(),
    );
  }
}


/* =========================================================
   LOADING SKELETON
   ========================================================= */

function createLoadingSkeleton() {
  return `
    <article class="dish-card is-loading">
      <div class="dish-image-wrapper">
        <div class="dish-skeleton-image"></div>
      </div>

      <div class="dish-card-content">
        <div class="dish-text-skeleton skeleton-title"></div>
        <div class="dish-text-skeleton skeleton-description"></div>
        <div class="dish-text-skeleton skeleton-description short"></div>

        <div class="dish-card-bottom">
          <div class="dish-text-skeleton skeleton-price"></div>
          <div class="dish-text-skeleton skeleton-button"></div>
        </div>
      </div>
    </article>
  `;
}


/* =========================================================
   APPLY MENU FILTERS
   ========================================================= */

function applyMenuFilters() {
  const searchValue =
    menuSearch?.value.trim().toLowerCase() || "";

  const urlParams = new URLSearchParams(
    window.location.search,
  );

  const selectedCategory =
    urlParams.get("category") || "all";

  filteredDishes = allDishes.filter((dish) => {
    const name = String(dish.name || "").toLowerCase();
    const description = String(dish.description || "").toLowerCase();

    const matchesSearch =
      name.includes(searchValue) ||
      description.includes(searchValue);

    const matchesCategory =
      selectedCategory === "all" ||
      dish.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  updateCategoryButtons(selectedCategory);
  renderDishesWithSkeleton(filteredDishes);
}


/* =========================================================
   RENDER DISHES WITH SKELETON
   ========================================================= */

function renderDishesWithSkeleton(dishes) {
  if (!menuList) {
    return;
  }

  if (menuEmptyState) {
    menuEmptyState.hidden = true;
  }

  if (menuResultInfo) {
    menuResultInfo.hidden = true;
  }

  if (dishes.length === 0) {
    renderDishes(dishes);
    return;
  }

  menuList.innerHTML = dishes
    .map((dish) => createDishCard(dish, true))
    .join("");

  setTimeout(() => {
    const loadingCards = menuList.querySelectorAll(
      ".dish-card.is-loading",
    );

    loadingCards.forEach((card) => {
      card.classList.remove("is-loading");
    });

    if (menuResultInfo) {
      menuResultInfo.hidden = false;
    }

    if (menuResultCount) {
      menuResultCount.textContent =
        `${dishes.length} ${dishes.length === 1 ? "dish" : "dishes"}`;
    }

    if (typeof updateFavoriteButtons === "function") {
      updateFavoriteButtons();
    }
  }, 2000);
}


/* =========================================================
   RENDER REAL DISHES
   ========================================================= */

function renderDishes(dishes) {
  if (!menuList) {
    return;
  }

  if (dishes.length === 0) {
    menuList.innerHTML = "";

    if (menuResultInfo) {
      menuResultInfo.hidden = true;
    }

    if (menuEmptyState) {
      menuEmptyState.hidden = false;
    }

    return;
  }

  menuList.innerHTML = dishes
    .map((dish) => createDishCard(dish, false))
    .join("");

  if (menuResultInfo) {
    menuResultInfo.hidden = false;
  }

  if (menuResultCount) {
    menuResultCount.textContent =
      `${dishes.length} ${dishes.length === 1 ? "dish" : "dishes"}`;
  }

  if (typeof updateFavoriteButtons === "function") {
    updateFavoriteButtons();
  }
}


/* =========================================================
   CREATE DISH CARD
   ========================================================= */

function createDishCard(dish, isLoading = false) {
  const favorite =
    typeof isFavorite === "function"
      ? isFavorite(dish.id)
      : false;

  return `
    <article
      class="dish-card ${isLoading ? "is-loading" : ""}"
      data-dish-id="${escapeHTML(dish.id)}"
    >
      <div class="dish-image-wrapper">
        <img
          src="${escapeHTML(dish.image)}"
          alt="${escapeHTML(dish.name)}"
          class="dish-image"
          loading="lazy"
        >

        <button
          type="button"
          class="favorite-button ${favorite ? "active" : ""}"
          data-favorite-id="${escapeHTML(dish.id)}"
          aria-label="${favorite ? "Remove from favorites" : "Add to favorites"}"
          aria-pressed="${favorite}"
        >
          ${favorite ? "♥" : "♡"}
        </button>

        ${dish.spicy ? '<span class="dish-spicy-badge">🌶 Spicy</span>' : ""}

        <div class="dish-skeleton-image"></div>
      </div>

      <div class="dish-card-content">
        <div class="dish-card-top">
          <div>
            <h3>${escapeHTML(dish.name)}</h3>
            <span class="dish-category">${escapeHTML(dish.category)}</span>
          </div>
        </div>

        <p class="dish-description">
          ${escapeHTML(dish.description)}
        </p>

        <div class="dish-card-bottom">
          <strong class="dish-price">
            ${formatPrice(dish.price)}
          </strong>

          <button
            type="button"
            class="dish-add-button"
            data-add-to-cart="${escapeHTML(dish.id)}"
          >
            Add to Cart
          </button>
        </div>
      </div>

      <div class="dish-skeleton-content">
        <div class="dish-text-skeleton skeleton-title"></div>
        <div class="dish-text-skeleton skeleton-description"></div>
        <div class="dish-text-skeleton skeleton-description short"></div>

        <div class="dish-card-bottom">
          <div class="dish-text-skeleton skeleton-price"></div>
          <div class="dish-text-skeleton skeleton-button"></div>
        </div>
      </div>
    </article>
  `;
}


/* =========================================================
   PRICE FORMAT
   ========================================================= */

function formatPrice(price) {
  return `${Number(price).toLocaleString("en-US")} ETB`;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

function updateCategoryButtons(selectedCategory) {
  categoryButtons.forEach((button) => {
    const category = button.dataset.category;
    const isActive = category === selectedCategory;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.category || "all";
    const url = new URL(window.location.href);

    if (category === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", category);
    }

    window.history.pushState({}, "", url);
    applyMenuFilters();
  });
});


/* =========================================================
   SEARCH
   ========================================================= */

if (menuSearch) {
  menuSearch.addEventListener("input", () => {
    applyMenuFilters();

    if (clearSearchButton) {
      clearSearchButton.hidden = menuSearch.value.trim() === "";
    }
  });
}

if (clearSearchButton) {
  clearSearchButton.addEventListener("click", () => {
    if (menuSearch) {
      menuSearch.value = "";
    }

    clearSearchButton.hidden = true;
    applyMenuFilters();
    menuSearch?.focus();
  });
}


/* =========================================================
   CLEAR MENU FILTERS
   ========================================================= */

if (clearMenuFiltersButton) {
  clearMenuFiltersButton.addEventListener("click", () => {
    if (menuSearch) {
      menuSearch.value = "";
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("category");

    window.history.pushState({}, "", url);

    if (clearSearchButton) {
      clearSearchButton.hidden = true;
    }

    applyMenuFilters();
  });
}


/* =========================================================
   RETRY MENU
   ========================================================= */

if (retryMenuButton) {
  retryMenuButton.addEventListener("click", loadDishes);
}


/* =========================================================
   BROWSER BACK / FORWARD
   ========================================================= */

window.addEventListener("popstate", () => {
  applyMenuFilters();
});


/* =========================================================
   DISH MODAL
   ========================================================= */

function openDishModal(dish) {
  if (!dishModal) {
    return;
  }

  selectedDish = dish;
  previousDishModalFocus = document.activeElement;

  if (dishModalImage) {
    dishModalImage.innerHTML = `
      <img
        src="${escapeHTML(dish.image)}"
        alt="${escapeHTML(dish.name)}"
      >
    `;
  }

  if (dishModalTitle) {
    dishModalTitle.textContent = dish.name;
  }

  if (dishModalDescription) {
    dishModalDescription.textContent = dish.description;
  }

  if (dishModalPrice) {
    dishModalPrice.textContent = formatPrice(dish.price);
  }

  if (dishModalCategory) {
    dishModalCategory.textContent = dish.category;
  }

  if (dishModalSpicy) {
    dishModalSpicy.textContent = dish.spicy ? "🌶 Spicy" : "Mild";
  }

  if (dishModalIngredients) {
    dishModalIngredients.textContent =
      "Prepared with traditional Ethiopian ingredients and spices.";
  }

  // Keep the modal outside the main sections so section navigation
  // cannot hide it or constrain it to the menu section.
  if (dishModal.parentElement !== document.body) {
    document.body.appendChild(dishModal);
  }

  dishModal.hidden = false;
  document.body.classList.add("modal-open");

  closeDishModalButton?.focus();
}

function closeDishModal() {
  if (!dishModal || dishModal.hidden) {
    return;
  }

  dishModal.hidden = true;
  document.body.classList.remove("modal-open");

  selectedDish = null;

  if (
    previousDishModalFocus &&
    typeof previousDishModalFocus.focus === "function" &&
    document.contains(previousDishModalFocus)
  ) {
    previousDishModalFocus.focus();
  }

  previousDishModalFocus = null;
}

if (closeDishModalButton) {
  closeDishModalButton.addEventListener("click", closeDishModal);
}

if (dishModal) {
  dishModal.addEventListener("click", (event) => {
    if (
      event.target === dishModal ||
      event.target.closest("[data-close-modal]") ||
      event.target.classList.contains("modal-backdrop")
    ) {
      closeDishModal();
    }
  });
}


/* =========================================================
   DISH CARD CLICK HANDLING
   ========================================================= */

if (menuList) {
  menuList.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-to-cart]");

    if (addButton) {
      const dishId = Number(addButton.dataset.addToCart);
      const dish = allDishes.find((item) => item.id === dishId);

      if (dish && typeof addToCart === "function") {
        addToCart(dish);
      }

      return;
    }

    const favoriteButton = event.target.closest("[data-favorite-id]");

    if (favoriteButton) {
      const dishId = Number(favoriteButton.dataset.favoriteId);
      const dish = allDishes.find((item) => item.id === dishId);

      if (dish && typeof toggleFavorite === "function") {
        toggleFavorite(dish);
      }

      return;
    }

    const card = event.target.closest(".dish-card");

    if (!card || card.classList.contains("is-loading")) {
      return;
    }

    const dishId = Number(card.dataset.dishId);
    const dish = allDishes.find((item) => item.id === dishId);

    if (dish) {
      openDishModal(dish);
    }
  });
}


/* =========================================================
   MODAL ADD TO CART
   ========================================================= */

if (dishModalAdd) {
  dishModalAdd.addEventListener("click", () => {
    if (selectedDish && typeof addToCart === "function") {
      addToCart(selectedDish);
      closeDishModal();
    }
  });
}


/* =========================================================
   KEYBOARD ACCESSIBILITY
   ========================================================= */

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDishModal();
  }
});


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

const mobileMenuToggle =
  document.getElementById("mobile-menu-toggle");

const mainNavigation =
  document.getElementById("main-navigation");

if (mobileMenuToggle && mainNavigation) {
  mobileMenuToggle.addEventListener("click", () => {
    const isOpen = mainNavigation.classList.toggle("open");

    mobileMenuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });
}


/* =========================================================
   INITIAL PAGE
   ========================================================= */

function initializeApp() {
  // Restore the customer's last section instead of always showing Home.
  showSection(getInitialSection());

  // Move the modal out of any section that could become hidden.
  if (dishModal && dishModal.parentElement !== document.body) {
    document.body.appendChild(dishModal);
  }

  loadDishes();

  if (typeof updateFavoriteButtons === "function") {
    updateFavoriteButtons();
  }

  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }

  if (typeof renderFavorites === "function") {
    renderFavorites();
  }

  if (typeof renderOrders === "function") {
    renderOrders();
  }

  if (typeof refreshCheckout === "function") {
    refreshCheckout();
  }
}


/* =========================================================
   START APP
   ========================================================= */

document.addEventListener("DOMContentLoaded", initializeApp);


/* =========================================================
   DARK / LIGHT THEME
   ========================================================= */

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

const THEME_STORAGE_KEY = "addiseats_theme";

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");

    if (themeIcon) {
      themeIcon.textContent = "☀";
    }

    if (themeToggle) {
      themeToggle.setAttribute("aria-label", "Switch to light mode");
    }
  } else {
    document.documentElement.setAttribute("data-theme", "light");

    if (themeIcon) {
      themeIcon.textContent = "☾";
    }

    if (themeToggle) {
      themeToggle.setAttribute("aria-label", "Switch to dark mode");
    }
  }
}

function initializeTheme() {
  let savedTheme = "light";

  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
  } catch (error) {
    console.warn("Could not load the saved theme.", error);
  }

  applyTheme(savedTheme === "dark" ? "dark" : "light");
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme");

    const newTheme = currentTheme === "dark" ? "light" : "dark";

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.warn("Could not save the selected theme.", error);
    }

    applyTheme(newTheme);
  });
}

initializeTheme();
