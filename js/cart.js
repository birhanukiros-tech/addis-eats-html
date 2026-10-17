const CART_STORAGE_KEY = "addiseats_cart";

// ===============================
// CART STORAGE
// ===============================

function getCart() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      return [];
    }

    const cart = JSON.parse(savedCart);

    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error("Failed to load cart:", error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// ===============================
// CART CALCULATIONS
// ===============================

function getCartItemCount() {
  return getCart().reduce((total, item) => {
    return total + (Number(item.quantity) || 0);
  }, 0);
}

function getCartSubtotal() {
  return getCart().reduce((total, item) => {
    return total + (Number(item.price) || 0) * (Number(item.quantity) || 0);
  }, 0);
}

function getCurrentDeliveryFee() {
  if (typeof getSelectedDeliveryFee === "function") {
    return Number(getSelectedDeliveryFee()) || 0;
  }

  return 0;
}

function getCartTotal() {
  return getCartSubtotal() + getCurrentDeliveryFee();
}

// ===============================
// FORMAT CURRENCY
// ===============================

function formatETB(amount) {
  return `${Number(amount).toLocaleString("en-US")} ETB`;
}

window.formatETB = formatETB;

// ===============================
// CART BADGE
// ===============================

function updateCartBadge() {
  const cartCount = document.getElementById("cart-count");

  if (!cartCount) {
    return;
  }

  cartCount.textContent = getCartItemCount();
}

// ===============================
// ADD TO CART
// ===============================

function addToCart(dish) {
  if (!dish) {
    return;
  }

  const cart = getCart();

  const existingItem = cart.find((item) => {
    return Number(item.id) === Number(dish.id);
  });

  if (existingItem) {
    existingItem.quantity = (Number(existingItem.quantity) || 0) + 1;
  } else {
    cart.push({
      id: dish.id,
      name: dish.name,
      description: dish.description || "",
      price: Number(dish.price) || 0,
      image: dish.image || "",
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartBadge();
  renderCart();

  // Open the drawer immediately after adding.
  openCart();

  if (typeof showToast === "function") {
    showToast(`${dish.name} added to your cart.`, "success");
  }
}

// ===============================
// UPDATE QUANTITY
// ===============================

function increaseCartItem(id) {
  const cart = getCart();

  const item = cart.find((cartItem) => {
    return Number(cartItem.id) === Number(id);
  });

  if (!item) {
    return;
  }

  item.quantity = (Number(item.quantity) || 0) + 1;

  saveCart(cart);
  updateCartBadge();
  renderCart();
}

function decreaseCartItem(id) {
  const cart = getCart();

  const item = cart.find((cartItem) => {
    return Number(cartItem.id) === Number(id);
  });

  if (!item) {
    return;
  }

  if (Number(item.quantity) > 1) {
    item.quantity -= 1;
  } else {
    const itemIndex = cart.findIndex((cartItem) => {
      return Number(cartItem.id) === Number(id);
    });

    if (itemIndex !== -1) {
      cart.splice(itemIndex, 1);
    }
  }

  saveCart(cart);
  updateCartBadge();
  renderCart();
}

function removeCartItem(id) {
  const cart = getCart();

  const updatedCart = cart.filter((item) => {
    return Number(item.id) !== Number(id);
  });

  saveCart(updatedCart);
  updateCartBadge();
  renderCart();
}

// ===============================
// RENDER CART
// ===============================

function renderCart() {
  const cartItemsContainer = document.getElementById("cart-items");
  const emptyState = document.getElementById("cart-empty-state");

  if (!cartItemsContainer) {
    return;
  }

  const cart = getCart();

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    if (emptyState) {
      emptyState.hidden = false;
    }

    updateCartSummary();
    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  cart.forEach((item) => {
    const cartItem = document.createElement("article");
    cartItem.className = "cart-item";

    const image = document.createElement("img");
    image.className = "cart-item-image";
    image.src = item.image || "";
    image.alt = item.name || "Food item";

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const top = document.createElement("div");
    top.className = "cart-item-top";

    const details = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = item.name || "Food item";

    const price = document.createElement("p");
    price.textContent = formatETB(item.price);

    details.append(name, price);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-cart-item";
    removeButton.dataset.cartRemove = item.id;
    removeButton.setAttribute(
      "aria-label",
      `Remove ${item.name || "food item"}`
    );
    removeButton.textContent = "×";

    top.append(details, removeButton);

    const description = document.createElement("p");
    description.className = "cart-item-description";
    description.textContent = item.description || "";

    const bottom = document.createElement("div");
    bottom.className = "cart-item-bottom";

    const quantityControls = document.createElement("div");
    quantityControls.className = "quantity-controls";

    const decreaseButton = document.createElement("button");
    decreaseButton.type = "button";
    decreaseButton.className = "quantity-button";
    decreaseButton.dataset.cartDecrease = item.id;
    decreaseButton.setAttribute(
      "aria-label",
      `Decrease quantity of ${item.name || "food item"}`
    );
    decreaseButton.textContent = "−";

    const quantity = document.createElement("span");
    quantity.className = "quantity-value";
    quantity.textContent = item.quantity;

    const increaseButton = document.createElement("button");
    increaseButton.type = "button";
    increaseButton.className = "quantity-button";
    increaseButton.dataset.cartIncrease = item.id;
    increaseButton.setAttribute(
      "aria-label",
      `Increase quantity of ${item.name || "food item"}`
    );
    increaseButton.textContent = "+";

    quantityControls.append(
      decreaseButton,
      quantity,
      increaseButton
    );

    const itemTotal = document.createElement("strong");
    itemTotal.className = "cart-item-total";
    itemTotal.textContent = formatETB(
      (Number(item.price) || 0) * (Number(item.quantity) || 0)
    );

    bottom.append(quantityControls, itemTotal);
    info.append(top, description, bottom);
    cartItem.append(image, info);

    cartItemsContainer.appendChild(cartItem);
  });

  updateCartSummary();
}

// ===============================
// CART SUMMARY
// ===============================

function updateCartSummary() {
  const subtotalElement = document.getElementById("cart-subtotal");
  const deliveryElement = document.getElementById("cart-delivery-fee");
  const totalElement = document.getElementById("cart-total");

  const subtotal = getCartSubtotal();
  const deliveryFee = getCurrentDeliveryFee();
  const total = subtotal + deliveryFee;

  if (subtotalElement) {
    subtotalElement.textContent = formatETB(subtotal);
  }

  if (deliveryElement) {
    deliveryElement.textContent = formatETB(deliveryFee);
  }

  if (totalElement) {
    totalElement.textContent = formatETB(total);
  }
}

// ===============================
// OPEN CART DRAWER
// ===============================

function openCart() {
  const overlay = document.getElementById("cart-overlay");
  const drawer = document.getElementById("cart-drawer");

  if (!overlay || !drawer) {
    return;
  }

  renderCart();

  // The overlay starts hidden in index.html.
  // Remove hidden before applying the open animation.
  overlay.hidden = false;

  overlay.classList.add("open");
  drawer.classList.add("open");

  overlay.setAttribute("aria-hidden", "false");
  drawer.setAttribute("aria-hidden", "false");

  document.body.classList.add("cart-open");
}

// ===============================
// CLOSE CART DRAWER
// ===============================

function closeCart() {
  const overlay = document.getElementById("cart-overlay");
  const drawer = document.getElementById("cart-drawer");

  if (!overlay || !drawer) {
    return;
  }

  overlay.classList.remove("open");
  drawer.classList.remove("open");

  overlay.setAttribute("aria-hidden", "true");
  drawer.setAttribute("aria-hidden", "true");

  document.body.classList.remove("cart-open");

  // Hide the overlay after its fade-out transition.
  const hideOverlay = () => {
    if (!overlay.classList.contains("open")) {
      overlay.hidden = true;
    }
  };

  overlay.addEventListener(
    "transitionend",
    (event) => {
      if (event.target === overlay && event.propertyName === "opacity") {
        hideOverlay();
      }
    },
    { once: true }
  );

  // Fallback in case a transitionend event does not fire.
  setTimeout(hideOverlay, 300);
}

// ===============================
// CHECKOUT
// ===============================

function goToCheckout() {
  if (getCart().length === 0) {
    if (typeof showToast === "function") {
      showToast("Your cart is empty.", "error");
    }

    return;
  }

  closeCart();

  if (typeof requireCustomerLogin === "function") {
    if (!requireCustomerLogin()) {
      return;
    }
  }

  if (typeof showSection === "function") {
    showSection("checkout");
  }

  if (typeof refreshCheckout === "function") {
    refreshCheckout();
  }
}

function browseMenuFromCart() {
  closeCart();

  if (typeof showSection === "function") {
    showSection("menu");
  }
}

// ===============================
// HTML SAFETY
// ===============================

function escapeCartHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===============================
// CART EVENTS
// ===============================

function initializeCart() {
  updateCartBadge();
  renderCart();

  const openCartButton = document.getElementById("open-cart-button");
  const closeCartButton = document.getElementById("close-cart-button");
  const overlay = document.getElementById("cart-overlay");
  const checkoutButton = document.getElementById("cart-checkout-button");
  const browseMenuButton = document.getElementById("cart-browse-menu");

  if (openCartButton) {
    openCartButton.addEventListener("click", openCart);
  }

  if (closeCartButton) {
    closeCartButton.addEventListener("click", closeCart);
  }

  // Clicking the overlay closes the drawer.
  if (overlay) {
    overlay.addEventListener("click", closeCart);
  }

  if (checkoutButton) {
    checkoutButton.addEventListener("click", goToCheckout);
  }

  if (browseMenuButton) {
    browseMenuButton.addEventListener("click", browseMenuFromCart);
  }

  // Quantity and remove controls.
  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const increaseButton = target.closest("[data-cart-increase]");

    if (increaseButton) {
      increaseCartItem(increaseButton.dataset.cartIncrease);
      return;
    }

    const decreaseButton = target.closest("[data-cart-decrease]");

    if (decreaseButton) {
      decreaseCartItem(decreaseButton.dataset.cartDecrease);
      return;
    }

    const removeButton = target.closest("[data-cart-remove]");

    if (removeButton) {
      removeCartItem(removeButton.dataset.cartRemove);
    }
  });

  // Escape closes the cart drawer.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
    }
  });
}

// ===============================
// GLOBAL FUNCTIONS
// ===============================

window.getCart = getCart;
window.saveCart = saveCart;
window.getCartItemCount = getCartItemCount;
window.getCartSubtotal = getCartSubtotal;
window.getCartTotal = getCartTotal;

window.addToCart = addToCart;
window.increaseCartItem = increaseCartItem;
window.decreaseCartItem = decreaseCartItem;
window.removeCartItem = removeCartItem;

window.renderCart = renderCart;
window.updateCartBadge = updateCartBadge;
window.updateCartSummary = updateCartSummary;

window.openCart = openCart;
window.closeCart = closeCart;
window.goToCheckout = goToCheckout;

// ===============================
// START
// ===============================

document.addEventListener("DOMContentLoaded", initializeCart);