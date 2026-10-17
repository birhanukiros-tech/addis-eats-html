
const ORDER_HISTORY_STORAGE_KEY = "addiseats_orders";

let orderDetailsModal = null;
let previousModalFocus = null;

function getAllOrders() {
    try {
        const storedOrders = localStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
        const orders = storedOrders ? JSON.parse(storedOrders) : [];
        return Array.isArray(orders) ? orders : [];
    } catch (error) {
        console.error("Unable to load orders:", error);
        return [];
    }
}

function getCustomerOrders() {
    const user = typeof getCurrentUser === "function"
        ? getCurrentUser()
        : null;

    if (!user || !user.username) {
        return [];
    }

    return getAllOrders().filter((order) => {
        const orderUsername =
            order.username || order.customer?.username || "";

        return (
            String(orderUsername).toLowerCase() ===
            String(user.username).toLowerCase()
        );
    });
}

function escapeOrderHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function safeOrderImage(image) {
    const value = String(image ?? "").trim();

    if (!value || value.startsWith("//")) {
        return "";
    }

    if (/^https?:\/\//i.test(value)) {
        return escapeOrderHTML(value);
    }

    // Allow local project image paths, but not executable or data URLs.
    if (
        !/^[a-z][a-z\d+.-]*:/i.test(value) &&
        !value.startsWith("\\")
    ) {
        return escapeOrderHTML(value);
    }

    return "";
}

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
        timeStyle: "short"
    });
}

function formatOrderMoney(amount) {
    const number = Number(amount);

    if (typeof formatETB === "function") {
        return formatETB(Number.isFinite(number) ? number : 0);
    }

    return `ETB ${(Number.isFinite(number) ? number : 0).toFixed(2)}`;
}

function normalizeOrderStatus(status) {
    return String(status || "Pending")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function getOrderStatusClass(status) {
    return normalizeOrderStatus(status);
}

function getOrderStatusLabel(status) {
    const value = String(status || "Pending").trim();

    return value
        .toLowerCase()
        .replace(/(^|\s|-)\w/g, (match) => match.toUpperCase());
}

function renderOrders() {
    const ordersList = document.getElementById("orders-list");
    const emptyState = document.getElementById("orders-empty-state");

    if (!ordersList || !emptyState) {
        return;
    }

    const user = typeof getCurrentUser === "function"
        ? getCurrentUser()
        : null;

    ordersList.innerHTML = "";

    if (!user || !user.username) {
        emptyState.hidden = false;
        emptyState.innerHTML = `
            <div class="orders-empty-icon" aria-hidden="true">🛍️</div>
            <h3>Sign in to view your orders</h3>
            <p>Your Addis Eats order history will appear here after you sign in.</p>
            <button class="button button-primary" type="button"
                data-order-action="sign-in">
                Sign In
            </button>
        `;
        return;
    }

    const orders = getCustomerOrders();

    if (orders.length === 0) {
        emptyState.hidden = false;
        emptyState.innerHTML = `
            <div class="orders-empty-icon" aria-hidden="true">🍽️</div>
            <h3>No orders yet</h3>
            <p>Your next delicious Ethiopian meal is waiting for you.</p>
            <button class="button button-primary" type="button"
                data-order-action="browse-menu">
                Explore the Menu
            </button>
        `;
        return;
    }

    emptyState.hidden = true;

    // Checkout adds new orders to the beginning of storage.
    // Keep that order so the newest order appears first.
    orders.forEach((order) => {
        ordersList.insertAdjacentHTML("beforeend", createOrderCard(order));
    });
}

function createOrderCard(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    const previewItems = items.slice(0, 3);
    const remainingItems = Math.max(0, items.length - previewItems.length);
    const status = getOrderStatusLabel(order.status);
    const statusClass = getOrderStatusClass(order.status);

    const itemPreviewHTML = previewItems.map((item) => {
        const image = safeOrderImage(item.image);
        const quantity = Math.max(0, Number(item.quantity) || 0);
        const price = Math.max(0, Number(item.price) || 0);

        return `
            <div class="order-item-preview">
                ${
                    image
                        ? `<img class="order-item-preview-image"
                            src="${image}"
                            alt=""
                            loading="lazy">`
                        : `<span class="order-item-preview-placeholder"
                            aria-hidden="true">🍽️</span>`
                }
                <div class="order-item-preview-info">
                    <strong>${escapeOrderHTML(item.name || "Menu item")}</strong>
                    <span>Qty: ${quantity}</span>
                </div>
                <span class="order-item-preview-price">
                    ${escapeOrderHTML(formatOrderMoney(price * quantity))}
                </span>
            </div>
        `;
    }).join("");

    const moreItemsHTML = remainingItems > 0
        ? `<p class="order-more-items">+ ${remainingItems} more ${
            remainingItems === 1 ? "item" : "items"
        }</p>`
        : "";

    return `
        <article class="order-card" data-order-id="${escapeOrderHTML(order.id)}">
            <div class="order-card-header">
                <div>
                    <span class="order-card-id">
                        Order #${escapeOrderHTML(order.id || "N/A")}
                    </span>
                    <p class="order-card-date">
                        ${escapeOrderHTML(formatOrderDate(order.createdAt))}
                    </p>
                </div>
                <span class="order-status ${escapeOrderHTML(statusClass)}">
                    ${escapeOrderHTML(status)}
                </span>
            </div>

            <div class="order-card-body">
                <div class="order-items-preview">
                    ${itemPreviewHTML || "<p>No item details available.</p>"}
                    ${moreItemsHTML}
                </div>
            </div>

            <div class="order-card-footer">
                <div class="order-card-total">
                    <span>Total</span>
                    <strong>${escapeOrderHTML(formatOrderMoney(order.total))}</strong>
                </div>

                <div class="order-actions">
                    <button class="button button-secondary" type="button"
                        data-order-action="details"
                        data-order-id="${escapeOrderHTML(order.id)}">
                        View Details
                    </button>
                    <button class="button button-primary" type="button"
                        data-order-action="reorder"
                        data-order-id="${escapeOrderHTML(order.id)}">
                        Reorder
                    </button>
                </div>
            </div>
        </article>
    `;
}

function getOwnedOrder(orderId) {
    return getCustomerOrders().find(
        (order) => String(order.id) === String(orderId)
    );
}

function ensureOrderDetailsModal() {
    if (orderDetailsModal && document.body.contains(orderDetailsModal)) {
        return orderDetailsModal;
    }

    orderDetailsModal = document.createElement("div");
    orderDetailsModal.className = "order-details-modal";
    orderDetailsModal.hidden = true;
    orderDetailsModal.innerHTML = `
        <div class="order-details-backdrop" data-order-modal-close></div>

        <section class="order-details-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
            tabindex="-1">

            <button class="order-details-close" type="button"
                data-order-modal-close
                aria-label="Close order details">
                <span aria-hidden="true">&times;</span>
            </button>

            <div class="order-details-body"></div>
        </section>
    `;

    document.body.appendChild(orderDetailsModal);

    orderDetailsModal.addEventListener("click", (event) => {
        if (event.target.closest("[data-order-modal-close]")) {
            closeOrderDetails();
        }
    });

    orderDetailsModal.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") {
            return;
        }

        const focusable = getModalFocusableElements();

        if (focusable.length === 0) {
            event.preventDefault();
            orderDetailsModal
                .querySelector(".order-details-content")
                ?.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            first.focus();
        }
    });

    return orderDetailsModal;
}

function getModalFocusableElements() {
    if (!orderDetailsModal) {
        return [];
    }

    return Array.from(
        orderDetailsModal.querySelectorAll(
            'button:not([disabled]), a[href], input:not([disabled]), ' +
            'select:not([disabled]), textarea:not([disabled]), ' +
            '[tabindex]:not([tabindex="-1"])'
        )
    ).filter((element) => {
        return element.getClientRects().length > 0;
    });
}

function renderOrderDetails(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    const customer = order.customer || {};
    const delivery = order.delivery || {};
    const status = getOrderStatusLabel(order.status);
    const statusClass = getOrderStatusClass(order.status);

    const itemsHTML = items.map((item) => {
        const quantity = Math.max(0, Number(item.quantity) || 0);
        const price = Math.max(0, Number(item.price) || 0);
        const image = safeOrderImage(item.image);

        return `
            <div class="order-details-item">
                ${
                    image
                        ? `<img class="order-details-item-image"
                            src="${image}"
                            alt=""
                            loading="lazy">`
                        : `<span class="order-details-item-placeholder"
                            aria-hidden="true">🍽️</span>`
                }

                <div class="order-details-item-info">
                    <strong>${escapeOrderHTML(item.name || "Menu item")}</strong>
                    <span>${quantity} × ${
                        escapeOrderHTML(formatOrderMoney(price))
                    }</span>
                </div>

                <strong class="order-details-item-total">
                    ${escapeOrderHTML(formatOrderMoney(price * quantity))}
                </strong>
            </div>
        `;
    }).join("");

    const subtotal = order.subtotal ??
        items.reduce((sum, item) => {
            return sum +
                (Math.max(0, Number(item.price) || 0) *
                Math.max(0, Number(item.quantity) || 0));
        }, 0);

    const deliveryFee = order.deliveryFee ?? delivery.fee ?? 0;
    const customerName = customer.name || "";
    const customerPhone = customer.phone || "";
    const deliveryArea = delivery.area || "";
    const deliveryAddress = delivery.address || "";
    const estimatedTime = delivery.estimatedTime || delivery.time || "";
    const instructions = order.specialInstructions || "";

    return `
        <header class="order-details-header">
            <p class="order-details-eyebrow">ADDIS EATS · ORDER SUMMARY</p>
            <h2 id="order-details-title">Order Details</h2>
            <p class="order-details-number">
                Order #${escapeOrderHTML(order.id || "N/A")}
            </p>
            <p class="order-details-date">
                ${escapeOrderHTML(formatOrderDate(order.createdAt))}
            </p>
            <span class="order-status ${escapeOrderHTML(statusClass)}">
                ${escapeOrderHTML(status)}
            </span>
        </header>

        <section class="order-details-section">
            <h3>Your Items</h3>
            <div class="order-details-items">
                ${itemsHTML || "<p>No item details are available.</p>"}
            </div>
        </section>

        <section class="order-details-section order-details-summary">
            <h3>Payment Summary</h3>
            <div class="order-details-summary-row">
                <span>Subtotal</span>
                <span>${escapeOrderHTML(formatOrderMoney(subtotal))}</span>
            </div>
            <div class="order-details-summary-row">
                <span>Delivery fee</span>
                <span>${escapeOrderHTML(formatOrderMoney(deliveryFee))}</span>
            </div>
            <div class="order-details-summary-row order-details-grand-total">
                <strong>Total</strong>
                <strong>${escapeOrderHTML(formatOrderMoney(order.total))}</strong>
            </div>
        </section>

        <section class="order-details-section">
            <h3>Delivery Information</h3>
            ${
                customerName
                    ? `<p><span>Customer</span><strong>${
                        escapeOrderHTML(customerName)
                    }</strong></p>`
                    : ""
            }
            ${
                customerPhone
                    ? `<p><span>Phone</span><strong>${
                        escapeOrderHTML(customerPhone)
                    }</strong></p>`
                    : ""
            }
            ${
                deliveryArea
                    ? `<p><span>Area</span><strong>${
                        escapeOrderHTML(deliveryArea)
                    }</strong></p>`
                    : ""
            }
            ${
                deliveryAddress
                    ? `<p><span>Address</span><strong>${
                        escapeOrderHTML(deliveryAddress)
                    }</strong></p>`
                    : ""
            }
            ${
                estimatedTime
                    ? `<p><span>Estimated delivery</span><strong>${
                        escapeOrderHTML(estimatedTime)
                    }</strong></p>`
                    : ""
            }
            ${
                instructions
                    ? `<div class="order-details-instructions">
                        <span>Special instructions</span>
                        <p>${escapeOrderHTML(instructions)}</p>
                    </div>`
                    : ""
            }
        </section>

        <footer class="order-details-footer">
            <button class="button button-primary" type="button"
                data-order-modal-close>
                Done
            </button>
        </footer>
    `;
}

function showOrderDetails(orderId) {
    const order = getOwnedOrder(orderId);

    if (!order) {
        if (typeof showToast === "function") {
            showToast("We couldn't find that order in your order history.");
        }
        return;
    }

    const modal = ensureOrderDetailsModal();
    const body = modal.querySelector(".order-details-body");

    if (!body) {
        return;
    }

    previousModalFocus = document.activeElement;
    body.innerHTML = renderOrderDetails(order);

    modal.hidden = false;
    document.body.classList.add("modal-open");

    const closeButton = modal.querySelector(".order-details-close");
    closeButton?.focus();
}

function closeOrderDetails() {
    if (!orderDetailsModal || orderDetailsModal.hidden) {
        return;
    }

    orderDetailsModal.hidden = true;
    document.body.classList.remove("modal-open");

    if (
        previousModalFocus &&
        typeof previousModalFocus.focus === "function" &&
        document.contains(previousModalFocus)
    ) {
        previousModalFocus.focus();
    }

    previousModalFocus = null;
}

function reorderOrder(orderId) {
    const order = getOwnedOrder(orderId);

    if (!order) {
        if (typeof showToast === "function") {
            showToast("We couldn't find that order in your order history.");
        }
        return;
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
        if (typeof showToast === "function") {
            showToast("This order has no items to reorder.");
        }
        return;
    }

    const cart = typeof getCart === "function" ? getCart() : [];

    order.items.forEach((item) => {
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const existingItem = cart.find(
            (cartItem) => String(cartItem.id) === String(item.id)
        );

        if (existingItem) {
            existingItem.quantity =
                Math.max(0, Number(existingItem.quantity) || 0) + quantity;
        } else {
            cart.push({
                id: item.id,
                name: item.name || "Menu item",
                description: item.description || "",
                price: Math.max(0, Number(item.price) || 0),
                image: item.image || "",
                quantity
            });
        }
    });

    if (typeof saveCart === "function") {
        saveCart(cart);
    } else {
        localStorage.setItem("addiseats_cart", JSON.stringify(cart));
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
        showToast("Your previous items have been added to your cart!");
    }
}

function handleOrderAction(event) {
    const button = event.target.closest("[data-order-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.orderAction;
    const orderId = button.dataset.orderId;

    if (action === "details") {
        showOrderDetails(orderId);
    } else if (action === "reorder") {
        reorderOrder(orderId);
    } else if (action === "sign-in") {
        const signInButton = document.getElementById("sign-in-button");

        if (signInButton) {
            signInButton.click();
        }
    } else if (action === "browse-menu") {
        document.getElementById("menu")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeOrderDetails();
    }
});

document.addEventListener("click", handleOrderAction);

function refreshOrders() {
    renderOrders();
}

window.getAllOrders = getAllOrders;
window.getCustomerOrders = getCustomerOrders;
window.renderOrders = renderOrders;
window.refreshOrders = refreshOrders;
window.showOrderDetails = showOrderDetails;
window.closeOrderDetails = closeOrderDetails;
window.reorderOrder = reorderOrder;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderOrders);
} else {
    renderOrders();
}
