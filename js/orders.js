/* =========================================================
   ADDIS EATS — ORDER HISTORY
   ========================================================= */

/* =========================================================
   GET ORDERS
   ========================================================= */

function getAllOrders() {
  try {
    const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);

    if (!savedOrders) {
      return [];
    }

    const orders = JSON.parse(savedOrders);

    return Array.isArray(orders) ? orders : [];
  } catch (error) {
    console.error("Failed to load orders:", error);
    return [];
  }
}

/* =========================================================
   GET CURRENT CUSTOMER ORDERS
   ========================================================= */

function getCustomerOrders() {
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  if (!user) {
    return [];
  }

  const username = user.username;

  return getAllOrders().filter((order) => {
    const orderUsername = order.username || order.customer?.username || "";

    return orderUsername === username;
  });
}

/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatOrderDate(dateValue) {
  if (!dateValue) {
    return "Date unavailable";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeOrderHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   RENDER ORDERS
   ========================================================= */

function renderOrders() {
  const ordersContainer = document.getElementById("orders-list");

  const ordersEmpty = document.getElementById("orders-empty");

  if (!ordersContainer) {
    return;
  }

  /* Customer must be signed in */
  if (typeof isLoggedIn === "function" && !isLoggedIn()) {
    ordersContainer.innerHTML = "";

    if (ordersEmpty) {
      ordersEmpty.hidden = false;
      ordersEmpty.innerHTML = `
        <div class="empty-state">
          <h3>Sign in to view your orders</h3>
          <p>Your order history will appear here after you sign in.</p>

          <button
            type="button"
            class="button button-primary"
            data-scroll="signin"
          >
            Sign In
          </button>
        </div>
      `;
    }

    return;
  }

  const orders = getCustomerOrders();

  console.log("Customer orders:", orders);

  /* No orders */
  if (orders.length === 0) {
    ordersContainer.innerHTML = "";

    if (ordersEmpty) {
      ordersEmpty.hidden = false;
      ordersEmpty.innerHTML = `
        <div class="empty-state">
          <h3>No orders yet</h3>
          <p>Your completed orders will appear here.</p>
        </div>
      `;
    }

    return;
  }

  /* Orders exist */
  if (ordersEmpty) {
    ordersEmpty.hidden = true;
  }

  ordersContainer.innerHTML = orders
    .slice()
    .reverse()
    .map(createOrderCard)
    .join("");
}

/* =========================================================
   CREATE ORDER CARD
   ========================================================= */

function createOrderCard(order) {
  const items = Array.isArray(order.items) ? order.items : [];

  const itemPreview = items
    .slice(0, 3)
    .map((item) => {
      return `
        <div class="order-item-preview">
          <img
            src="${escapeOrderHTML(item.image)}"
            alt="${escapeOrderHTML(item.name)}"
          />

          <div>
            <strong>
              ${escapeOrderHTML(item.name)}
            </strong>

            <span>
              ${item.quantity} × ${formatETB(item.price)}
            </span>
          </div>
        </div>
      `;
    })
    .join("");

  const extraItems =
    items.length > 3
      ? `
        <p class="order-more-items">
          +${items.length - 3} more item(s)
        </p>
      `
      : "";

  return `
    <article
      class="order-card"
      data-order-id="${escapeOrderHTML(order.id)}"
    >
      <div class="order-card-header">
        <div>
          <span class="order-label">Order</span>
          <h3>${escapeOrderHTML(order.id)}</h3>
        </div>

        <span class="order-status ${getOrderStatusClass(order.status)}">
          ${escapeOrderHTML(order.status || "Pending")}
        </span>
      </div>

      <div class="order-card-date">
        ${formatOrderDate(order.createdAt)}
      </div>

      <div class="order-items-preview">
        ${itemPreview}
        ${extraItems}
      </div>

      <div class="order-card-footer">
        <strong>
          Total: ${formatETB(order.total)}
        </strong>

        <div class="order-actions">
          <button
            type="button"
            class="button button-secondary"
            data-order-action="details"
            data-order-id="${escapeOrderHTML(order.id)}"
          >
            View Details
          </button>

          <button
            type="button"
            class="button button-primary"
            data-order-action="reorder"
            data-order-id="${escapeOrderHTML(order.id)}"
          >
            Reorder
          </button>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   STATUS CLASS
   ========================================================= */

function getOrderStatusClass(status) {
  return String(status || "pending")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/* =========================================================
   VIEW ORDER DETAILS
   ========================================================= */

function showOrderDetails(orderId) {
  const order = getAllOrders().find(
    (item) => String(item.id) === String(orderId),
  );

  if (!order) {
    showToast("Order could not be found.", "error");
    return;
  }

  const itemsText = order.items
    .map((item) => `${item.name} × ${item.quantity}`)
    .join("\n");

  alert(
    `Order ${order.id}\n\n` +
      `Items:\n${itemsText}\n\n` +
      `Subtotal: ${formatETB(order.subtotal)}\n` +
      `Delivery: ${formatETB(order.deliveryFee)}\n` +
      `Total: ${formatETB(order.total)}\n\n` +
      `Delivery area: ${order.delivery?.area || "Not provided"}\n` +
      `Estimated time: ${order.delivery?.estimatedTime || "Not provided"}`,
  );
}

/* =========================================================
   REORDER
   ========================================================= */

function reorderOrder(orderId) {
  const order = getAllOrders().find(
    (item) => String(item.id) === String(orderId),
  );

  if (!order || !Array.isArray(order.items)) {
    showToast("Order could not be found.", "error");
    return;
  }

  let cart = typeof getCart === "function" ? getCart() : [];

  order.items.forEach((item) => {
    const existingItem = cart.find(
      (cartItem) => Number(cartItem.id) === Number(item.id),
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
      });
    }
  });

  if (typeof saveCart === "function") {
    saveCart(cart);
  }

  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }

  if (typeof renderCart === "function") {
    renderCart();
  }

  if (typeof openCart === "function") {
    openCart();
  }

  if (typeof showToast === "function") {
    showToast("Previous order added to your cart.", "success");
  }
}

/* =========================================================
   ORDER BUTTON EVENTS
   ========================================================= */

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.orderAction;

  const orderId = button.dataset.orderId;

  if (action === "details") {
    showOrderDetails(orderId);
  }

  if (action === "reorder") {
    reorderOrder(orderId);
  }
});

/* =========================================================
   REFRESH ORDERS
   ========================================================= */

function refreshOrders() {
  renderOrders();
}

/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.getAllOrders = getAllOrders;
window.getCustomerOrders = getCustomerOrders;
window.renderOrders = renderOrders;
window.refreshOrders = refreshOrders;
window.showOrderDetails = showOrderDetails;
window.reorderOrder = reorderOrder;

/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  renderOrders();
});
