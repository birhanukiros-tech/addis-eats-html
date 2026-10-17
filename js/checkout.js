/* =========================================================
   ADDIS EATS — CUSTOMER CHECKOUT
   ========================================================= */

const CHECKOUT_DRAFT_KEY = "addiseats_checkout_draft";
const ORDERS_STORAGE_KEY = "addiseats_orders";

/* =========================================================
   DELIVERY AREAS
   Values match the HTML <select>
   ========================================================= */

const DELIVERY_AREAS = {
  bole: {
    name: "Bole",
    fee: 80,
    time: "25–35 minutes",
  },

  kazanchis: {
    name: "Kazanchis",
    fee: 70,
    time: "25–35 minutes",
  },

  piassa: {
    name: "Piassa",
    fee: 90,
    time: "30–40 minutes",
  },

  mercato: {
    name: "Mercato",
    fee: 100,
    time: "35–45 minutes",
  },

  arada: {
    name: "Arada",
    fee: 80,
    time: "25–35 minutes",
  },

  yeka: {
    name: "Yeka",
    fee: 100,
    time: "35–45 minutes",
  },

  lideta: {
    name: "Lideta",
    fee: 80,
    time: "25–35 minutes",
  },

  kirkos: {
    name: "Kirkos",
    fee: 70,
    time: "25–35 minutes",
  },

  "nifas-silk-lafto": {
    name: "Nifas Silk-Lafto",
    fee: 110,
    time: "40–50 minutes",
  },

  "akaki-kality": {
    name: "Akaki Kality",
    fee: 130,
    time: "45–60 minutes",
  },

  other: {
    name: "Other",
    fee: 120,
    time: "40–55 minutes",
  },
};

/* =========================================================
   GET DELIVERY INFORMATION
   ========================================================= */

function getDeliveryInformation(area) {
  return (
    DELIVERY_AREAS[area] || {
      name: "",
      fee: 0,
      time: "Select a delivery area",
    }
  );
}

/* =========================================================
   FORMAT CURRENCY
   ========================================================= */

function checkoutFormatETB(amount) {
  if (typeof formatETB === "function") {
    return formatETB(amount);
  }

  return `ETB ${Number(amount).toLocaleString()}`;
}

/* =========================================================
   GET CHECKOUT FORM DATA
   ========================================================= */

function getCheckoutFormData() {
  const nameInput = document.getElementById("customer-name");
  const phoneInput = document.getElementById("customer-phone");
  const areaInput = document.getElementById("delivery-area");
  const addressInput = document.getElementById("delivery-address");
  const instructionsInput = document.getElementById("special-instructions");

  return {
    name: nameInput ? nameInput.value.trim() : "",
    phone: phoneInput ? phoneInput.value.trim() : "",
    area: areaInput ? areaInput.value : "",
    address: addressInput ? addressInput.value.trim() : "",
    instructions: instructionsInput ? instructionsInput.value.trim() : "",
  };
}

/* =========================================================
   SAVE CHECKOUT DRAFT
   ========================================================= */

function saveCheckoutDraft() {
  const data = getCheckoutFormData();

  localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(data));
}

/* =========================================================
   LOAD CHECKOUT DRAFT
   ========================================================= */

function loadCheckoutDraft() {
  const storedDraft = localStorage.getItem(CHECKOUT_DRAFT_KEY);

  if (!storedDraft) {
    return;
  }

  try {
    const data = JSON.parse(storedDraft);

    const nameInput = document.getElementById("customer-name");

    const phoneInput = document.getElementById("customer-phone");

    const areaInput = document.getElementById("delivery-area");

    const addressInput = document.getElementById("delivery-address");

    const instructionsInput = document.getElementById("special-instructions");

    if (nameInput && data.name) {
      nameInput.value = data.name;
    }

    if (phoneInput && data.phone) {
      phoneInput.value = data.phone;
    }

    if (areaInput && data.area) {
      areaInput.value = data.area;
    }

    if (addressInput && data.address) {
      addressInput.value = data.address;
    }

    if (instructionsInput && data.instructions) {
      instructionsInput.value = data.instructions;
    }

    updateDeliveryInformation();
  } catch (error) {
    localStorage.removeItem(CHECKOUT_DRAFT_KEY);
  }
}

/* =========================================================
   CLEAR CHECKOUT ERRORS
   ========================================================= */

function clearCheckoutErrors() {
  const formError = document.getElementById("checkout-error");

  if (formError) {
    formError.textContent = "";
    formError.hidden = true;
  }

  const fields = [
    "customer-name",
    "customer-phone",
    "delivery-area",
    "delivery-address",
  ];

  fields.forEach((id) => {
    const input = document.getElementById(id);

    if (input) {
      input.classList.remove("input-error");
    }
  });
}

/* =========================================================
   SHOW CHECKOUT ERROR
   ========================================================= */

function showCheckoutError(message) {
  const formError = document.getElementById("checkout-error");

  if (!formError) {
    return;
  }

  formError.textContent = message;
  formError.hidden = false;
}

/* =========================================================
   MARK FIELD ERROR
   ========================================================= */

function markCheckoutFieldError(id) {
  const input = document.getElementById(id);

  if (input) {
    input.classList.add("input-error");
  }
}

/* =========================================================
   VALIDATE ETHIOPIAN PHONE
   ========================================================= */

function isValidEthiopianPhone(phone) {
  const cleanPhone = phone.replace(/[\s-]/g, "");

  return (
    /^09\d{8}$/.test(cleanPhone) ||
    /^\+2519\d{8}$/.test(cleanPhone) ||
    /^2519\d{8}$/.test(cleanPhone)
  );
}

/* =========================================================
   VALIDATE CHECKOUT
   ========================================================= */

function validateCheckout(data) {
  clearCheckoutErrors();

  /* -----------------------------------------
     LOGIN
     ----------------------------------------- */

  if (typeof isLoggedIn === "function" && !isLoggedIn()) {
    showCheckoutError("Please sign in before placing your order.");

    return false;
  }

  /* -----------------------------------------
     CART
     ----------------------------------------- */

  const cart = typeof getCart === "function" ? getCart() : [];

  if (cart.length === 0) {
    showCheckoutError("Your cart is empty. Please add a dish before checkout.");

    return false;
  }

  /* -----------------------------------------
     CUSTOMER NAME
     ----------------------------------------- */

  if (!data.name) {
    markCheckoutFieldError("customer-name");

    showCheckoutError("Please enter your full name.");

    document.getElementById("customer-name")?.focus();

    return false;
  }

  if (data.name.length < 2) {
    markCheckoutFieldError("customer-name");

    showCheckoutError("Please enter a valid name.");

    document.getElementById("customer-name")?.focus();

    return false;
  }

  /* -----------------------------------------
     PHONE
     ----------------------------------------- */

  if (!data.phone) {
    markCheckoutFieldError("customer-phone");

    showCheckoutError("Please enter your phone number.");

    document.getElementById("customer-phone")?.focus();

    return false;
  }

  if (!isValidEthiopianPhone(data.phone)) {
    markCheckoutFieldError("customer-phone");

    showCheckoutError("Please enter a valid Ethiopian phone number.");

    document.getElementById("customer-phone")?.focus();

    return false;
  }

  /* -----------------------------------------
     DELIVERY AREA
     ----------------------------------------- */

  if (!data.area) {
    markCheckoutFieldError("delivery-area");

    showCheckoutError("Please select your delivery area.");

    document.getElementById("delivery-area")?.focus();

    return false;
  }

  /* -----------------------------------------
     DELIVERY ADDRESS
     ----------------------------------------- */

  if (!data.address) {
    markCheckoutFieldError("delivery-address");

    showCheckoutError("Please enter your delivery address.");

    document.getElementById("delivery-address")?.focus();

    return false;
  }

  if (data.address.length < 5) {
    markCheckoutFieldError("delivery-address");

    showCheckoutError("Please enter a more complete delivery address.");

    document.getElementById("delivery-address")?.focus();

    return false;
  }

  return true;
}

/* =========================================================
   UPDATE DELIVERY INFORMATION
   ========================================================= */

function updateDeliveryInformation() {
  const areaInput = document.getElementById("delivery-area");

  const deliveryFeeElement = document.getElementById("checkout-delivery-fee");

  const totalElement = document.getElementById("checkout-total");

  const deliveryTimeElement = document.getElementById(
    "estimated-delivery-time",
  );

  const subtotal =
    typeof getCartSubtotal === "function" ? getCartSubtotal() : 0;

  const area = areaInput ? areaInput.value : "";

  const delivery = getDeliveryInformation(area);

  const total = subtotal + delivery.fee;

  /* Checkout delivery fee */

  if (deliveryFeeElement) {
    deliveryFeeElement.textContent = checkoutFormatETB(delivery.fee);
  }

  /* Checkout total */

  if (totalElement) {
    totalElement.textContent = checkoutFormatETB(total);
  }

  /* Estimated delivery time */

  if (deliveryTimeElement) {
    deliveryTimeElement.textContent = delivery.time;
  }

  /* -----------------------------------------
     KEEP CART SUMMARY SYNCHRONIZED
     ----------------------------------------- */

  const cartDeliveryFee = document.getElementById("cart-delivery-fee");

  const cartTotal = document.getElementById("cart-total");

  if (cartDeliveryFee) {
    cartDeliveryFee.textContent = checkoutFormatETB(delivery.fee);
  }

  if (cartTotal) {
    cartTotal.textContent = checkoutFormatETB(total);
  }
}

/* =========================================================
   RENDER CHECKOUT SUMMARY
   ========================================================= */

function renderCheckoutSummary() {
  const itemsContainer = document.getElementById("checkout-summary-items");

  const emptyState = document.getElementById("checkout-summary-empty");

  const itemCountElement = document.getElementById("summary-item-count");

  if (!itemsContainer) {
    return;
  }

  const cart = typeof getCart === "function" ? getCart() : [];

  const itemCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

  if (itemCountElement) {
    itemCountElement.textContent = `${itemCount} ${
      itemCount === 1 ? "item" : "items"
    }`;
  }

  /* -----------------------------------------
     EMPTY CART
     ----------------------------------------- */

  if (cart.length === 0) {
    itemsContainer.innerHTML = "";

    if (emptyState) {
      emptyState.hidden = false;
    }

    updateDeliveryInformation();

    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  /* -----------------------------------------
     RENDER ITEMS
     ----------------------------------------- */

  itemsContainer.innerHTML = cart
    .map((item) => {
      const itemTotal = Number(item.price) * Number(item.quantity);

      return `
        <div class="checkout-summary-item">

          <div class="checkout-summary-item-info">

            <strong>
              ${escapeCheckoutHTML(item.name)}
            </strong>

            <span>
              ${item.quantity} ×
              ${checkoutFormatETB(item.price)}
            </span>

          </div>

          <strong>
            ${checkoutFormatETB(itemTotal)}
          </strong>

        </div>
      `;
    })
    .join("");

  /* -----------------------------------------
     SUBTOTAL
     ----------------------------------------- */

  const subtotal =
    typeof getCartSubtotal === "function" ? getCartSubtotal() : 0;

  const subtotalElement = document.getElementById("checkout-subtotal");

  if (subtotalElement) {
    subtotalElement.textContent = checkoutFormatETB(subtotal);
  }

  updateDeliveryInformation();
}

/* =========================================================
   ESCAPE CHECKOUT HTML
   ========================================================= */

function escapeCheckoutHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   PLACE ORDER
   ========================================================= */

function placeOrder() {
  clearCheckoutErrors();

  /* -----------------------------------------
     REQUIRE LOGIN
     ----------------------------------------- */

  if (typeof requireCustomerLogin === "function" && !requireCustomerLogin()) {
    return;
  }

  const data = getCheckoutFormData();

  if (!validateCheckout(data)) {
    return;
  }

  const cart = getCart();

  const delivery = getDeliveryInformation(data.area);

  const subtotal = getCartSubtotal();

  const total = subtotal + delivery.fee;

  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  /* -----------------------------------------
     CREATE ORDER
     ----------------------------------------- */

  const order = {
    id: `AE-${Date.now().toString().slice(-8)}`,

    username: user ? user.username : "",

    customer: {
      name: data.name,
      phone: data.phone,
    },

    delivery: {
      area: delivery.name,
      address: data.address,
      fee: delivery.fee,
      estimatedTime: delivery.time,
    },

    specialInstructions: data.instructions,

    items: cart.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image,
    })),

    subtotal,

    deliveryFee: delivery.fee,

    total,

    status: "Pending",

    createdAt: new Date().toISOString(),
  };

  /* -----------------------------------------
     SAVE ORDER
     ----------------------------------------- */

  let orders = [];

  const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);

  if (storedOrders) {
    try {
      const parsedOrders = JSON.parse(storedOrders);

      if (Array.isArray(parsedOrders)) {
        orders = parsedOrders;
      }
    } catch (error) {
      orders = [];
    }
  }

  orders.unshift(order);

  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

  /* -----------------------------------------
     CLEAR CART
     ----------------------------------------- */

  localStorage.removeItem("addiseats_cart");

  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }

  if (typeof renderCart === "function") {
    renderCart();
  }

  /* -----------------------------------------
     CLEAR CHECKOUT DRAFT
     ----------------------------------------- */

  localStorage.removeItem(CHECKOUT_DRAFT_KEY);

  /* -----------------------------------------
     REFRESH ORDERS
     ----------------------------------------- */

  if (typeof refreshOrders === "function") {
    refreshOrders();
  }

  /* -----------------------------------------
     SHOW CONFIRMATION
     ----------------------------------------- */

  showOrderConfirmation(order);
}

/* =========================================================
   SHOW ORDER CONFIRMATION
   ========================================================= */

function showOrderConfirmation(order) {
  const confirmation = document.getElementById("order-confirmation");

  if (!confirmation) {
    return;
  }

  const message = document.getElementById("confirmation-message");

  const orderId = document.getElementById("confirmation-order-id");

  const totalElement = document.getElementById("confirmation-total");

  const deliveryElement = document.getElementById("confirmation-delivery");

  if (message) {
    message.textContent = `Thank you, ${order.customer.name}! Your order has been received.`;
  }

  if (orderId) {
    orderId.textContent = order.id;
  }

  if (totalElement) {
    totalElement.textContent = checkoutFormatETB(order.total);
  }

  if (deliveryElement) {
    deliveryElement.textContent = `${order.delivery.area} • ${order.delivery.estimatedTime}`;
  }

  confirmation.hidden = false;

  confirmation.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  if (typeof showToast === "function") {
    showToast("Your order has been placed successfully!", "success");
  }
}

/* =========================================================
   CHECKOUT EVENTS
   ========================================================= */

function initializeCheckout() {
  const form = document.getElementById("checkout-form");

  const areaInput = document.getElementById("delivery-area");

  /* -----------------------------------------
     FORM SUBMIT
     ----------------------------------------- */

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      placeOrder();
    });
  }

  /* -----------------------------------------
     DELIVERY AREA
     ----------------------------------------- */

  if (areaInput) {
    areaInput.addEventListener("change", function () {
      updateDeliveryInformation();

      saveCheckoutDraft();
    });
  }

  /* -----------------------------------------
     SAVE FORM DRAFT
     ----------------------------------------- */

  const formFields = document.querySelectorAll(
    "#checkout-form input, #checkout-form textarea, #checkout-form select",
  );

  formFields.forEach((field) => {
    field.addEventListener("input", saveCheckoutDraft);
  });

  /* -----------------------------------------
     LOAD SAVED FORM
     ----------------------------------------- */

  loadCheckoutDraft();

  /* -----------------------------------------
     INITIAL SUMMARY
     ----------------------------------------- */

  renderCheckoutSummary();

  /* -----------------------------------------
     CHECK AUTH STATE
     ----------------------------------------- */

  if (typeof updateCheckoutAuthState === "function") {
    updateCheckoutAuthState();
  }
}

/* =========================================================
   REFRESH CHECKOUT
   ========================================================= */

window.refreshCheckout = function () {
  renderCheckoutSummary();

  updateDeliveryInformation();

  if (typeof updateCheckoutAuthState === "function") {
    updateCheckoutAuthState();
  }
};

/* =========================================================
   GLOBAL CHECKOUT ACCESS
   ========================================================= */

window.getDeliveryInformation = getDeliveryInformation;

window.getCheckoutFormData = getCheckoutFormData;

window.validateCheckout = validateCheckout;

window.updateDeliveryInformation = updateDeliveryInformation;

window.renderCheckoutSummary = renderCheckoutSummary;

window.placeOrder = placeOrder;

/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", initializeCheckout);
