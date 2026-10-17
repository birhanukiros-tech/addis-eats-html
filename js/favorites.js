/* =========================================================
   ADDIS EATS — CUSTOMER FAVORITES / WISHLIST
   ========================================================= */

const FAVORITES_STORAGE_KEY = "addiseats_favorites";

/* =========================================================
   GET FAVORITES
   ========================================================= */

function getFavorites() {
  const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);

  if (!storedFavorites) {
    return [];
  }

  try {
    const favorites = JSON.parse(storedFavorites);

    if (!Array.isArray(favorites)) {
      return [];
    }

    return favorites;
  } catch (error) {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);

    return [];
  }
}

/* =========================================================
   SAVE FAVORITES
   ========================================================= */

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

/* =========================================================
   CHECK IF FAVORITE
   ========================================================= */

function isFavorite(id) {
  const favorites = getFavorites();

  return favorites.some((item) => Number(item.id) === Number(id));
}

/* =========================================================
   ADD FAVORITE
   ========================================================= */

function addFavorite(dish) {
  if (!dish || !dish.id) {
    return;
  }

  const favorites = getFavorites();

  const alreadyFavorite = favorites.some(
    (item) => Number(item.id) === Number(dish.id),
  );

  if (alreadyFavorite) {
    return;
  }

  favorites.push({
    id: dish.id,
    name: dish.name,
    description: dish.description,
    price: Number(dish.price),
    category: dish.category,
    spicy: Boolean(dish.spicy),
    image: dish.image,
  });

  saveFavorites(favorites);

  renderFavorites();

  if (typeof updateFavoriteButtons === "function") {
    updateFavoriteButtons();
  }

  if (typeof showToast === "function") {
    showToast(`${dish.name} added to favorites.`, "success");
  }
}

/* =========================================================
   REMOVE FAVORITE
   ========================================================= */

function removeFavorite(id) {
  const favorites = getFavorites();

  const removedItem = favorites.find((item) => Number(item.id) === Number(id));

  const updatedFavorites = favorites.filter(
    (item) => Number(item.id) !== Number(id),
  );

  saveFavorites(updatedFavorites);

  renderFavorites();

  if (typeof updateFavoriteButtons === "function") {
    updateFavoriteButtons();
  }

  if (removedItem && typeof showToast === "function") {
    showToast(`${removedItem.name} removed from favorites.`, "info");
  }
}

/* =========================================================
   TOGGLE FAVORITE
   ========================================================= */

function toggleFavorite(dish) {
  if (!dish || !dish.id) {
    return;
  }

  if (isFavorite(dish.id)) {
    removeFavorite(dish.id);
  } else {
    addFavorite(dish);
  }
}

/* =========================================================
   RENDER FAVORITES
   ========================================================= */

function renderFavorites() {
  const favoritesList = document.getElementById("favorites-list");

  const emptyState = document.getElementById("favorites-empty-state");

  if (!favoritesList) {
    return;
  }

  const favorites = getFavorites();

  /* -----------------------------------------
     EMPTY STATE
  ----------------------------------------- */

  if (favorites.length === 0) {
    favoritesList.innerHTML = "";

    if (emptyState) {
      emptyState.hidden = false;
    }

    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  /* -----------------------------------------
     FAVORITE CARDS
  ----------------------------------------- */

  favoritesList.innerHTML = favorites
    .map((dish) => {
      return `
        <article
          class="dish-card favorite-card"
          data-dish-id="${dish.id}"
        >

          <div class="dish-image-wrapper">

            <img
              src="${dish.image}"
              alt="${dish.name}"
              class="dish-image"
              loading="lazy"
            />

            <button
              type="button"
              class="favorite-button is-favorite"
              data-favorite-id="${dish.id}"
              aria-label="Remove ${dish.name} from favorites"
              aria-pressed="true"
            >
              ♥
            </button>

          </div>


          <div class="dish-content">

            <div class="dish-card-top">

              <span class="dish-category">
                ${dish.category}
              </span>

              ${dish.spicy ? `<span class="dish-spicy">🌶 Spicy</span>` : ""}

            </div>


            <h3 class="dish-name">
              ${dish.name}
            </h3>


            <p class="dish-description">
              ${dish.description}
            </p>


            <div class="dish-card-bottom">

              <strong class="dish-price">
                ${
                  typeof formatETB === "function"
                    ? formatETB(dish.price)
                    : `ETB ${Number(dish.price).toLocaleString()}`
                }
              </strong>


              <button
                type="button"
                class="button button-primary favorite-add-button"
                data-add-favorite-cart="${dish.id}"
              >
                Add to Cart
              </button>

            </div>

          </div>

        </article>
      `;
    })
    .join("");
}

/* =========================================================
   UPDATE FAVORITE BUTTONS
   ========================================================= */

function updateFavoriteButtons() {
  const buttons = document.querySelectorAll("[data-favorite-id]");

  buttons.forEach((button) => {
    const id = button.dataset.favoriteId;

    const favorite = isFavorite(id);

    button.classList.toggle("is-favorite", favorite);

    button.setAttribute("aria-pressed", String(favorite));

    button.setAttribute(
      "aria-label",
      favorite ? "Remove from favorites" : "Add to favorites",
    );

    button.textContent = favorite ? "♥" : "♡";
  });
}

/* =========================================================
   ADD FAVORITE DISH TO CART
   ========================================================= */

function addFavoriteDishToCart(id) {
  const favorites = getFavorites();

  const dish = favorites.find((item) => Number(item.id) === Number(id));

  if (!dish) {
    return;
  }

  if (typeof addToCart === "function") {
    addToCart(dish);
  }
}

/* =========================================================
   FAVORITES EVENTS
   ========================================================= */

function initializeFavorites() {
  const favoritesList = document.getElementById("favorites-list");

  if (favoritesList) {
    favoritesList.addEventListener("click", function (event) {
      /* -------------------------------------
           REMOVE FAVORITE
        ------------------------------------- */

      const favoriteButton = event.target.closest("[data-favorite-id]");

      if (favoriteButton) {
        const id = favoriteButton.dataset.favoriteId;

        removeFavorite(id);

        return;
      }

      /* -------------------------------------
           ADD FAVORITE TO CART
        ------------------------------------- */

      const addButton = event.target.closest("[data-add-favorite-cart]");

      if (addButton) {
        const id = addButton.dataset.addFavoriteCart;

        addFavoriteDishToCart(id);
      }
    });
  }

  renderFavorites();
}

/* =========================================================
   GLOBAL FAVORITES ACCESS
   ========================================================= */

window.getFavorites = getFavorites;
window.isFavorite = isFavorite;
window.addFavorite = addFavorite;
window.removeFavorite = removeFavorite;
window.toggleFavorite = toggleFavorite;
window.renderFavorites = renderFavorites;
window.updateFavoriteButtons = updateFavoriteButtons;

/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", initializeFavorites);
