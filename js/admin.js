
const ADMIN_SESSION_KEY = "addiseats_admin";
const ORDERS_STORAGE_KEY = "addiseats_orders";
const ADMIN_MENU_STORAGE_KEY = "addiseats_menu";
const DELETED_DISHES_STORAGE_KEY = "addiseats_deleted_dishes";

const ADMIN_STATUSES = [
  "Pending",
  "Preparing",
  "Ready",
  "Delivered",
  "Cancelled",
];

const MENU_CATEGORIES = [
  "fasting",
  "traditional",
  "breakfast",
  "snacks",
  "fast-food",
  "drinks",
];

let adminDishes = [];
let adminOrders = [];
let pendingDeleteDishId = null;
let toastTimeout = null;

const adminElement = (id) => document.getElementById(id);

function adminEscape(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function adminMoney(value) {
  return `${Number(value || 0).toLocaleString("en-ET", {
    maximumFractionDigits: 2,
  })} ETB`;
}

function adminReadArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function adminWriteArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function adminStatus(status) {
  const normalized = String(status || "Pending").toLowerCase();
  const knownStatus = ADMIN_STATUSES.find(
    (item) => item.toLowerCase() === normalized
  );
  const label = knownStatus || "Pending";
  const className = knownStatus
    ? normalized.replace(/[^a-z0-9-]/g, "")
    : "pending";

  return `<span class="admin-status-badge status-${className}">${adminEscape(label)}</span>`;
}

function adminAvailabilityBadge(available) {
  return available
    ? '<span class="admin-status-badge status-available">Available</span>'
    : '<span class="admin-status-badge status-disabled">Disabled</span>';
}

function adminDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-ET", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function adminDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-ET", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showAdminToast(message, type = "success") {
  const toast = adminElement("admin-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.toggle("error", type === "error");
  toast.hidden = false;

  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function setTableContent(id, html) {
  const element = adminElement(id);
  if (element) element.innerHTML = html;
}

function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function requireAdminSession() {
  const session = getAdminSession();

  if (!session || session.authenticated !== true) {
    window.location.replace("admin-login.html");
    return false;
  }

  const name = session.username || "Administrator";

  if (adminElement("sidebar-admin-name")) {
    adminElement("sidebar-admin-name").textContent = name;
  }

  if (adminElement("welcome-admin-name")) {
    adminElement("welcome-admin-name").textContent = name;
  }

  return true;
}

function normalizeDish(dish, index) {
  return {
    ...dish,
    id: dish.id ?? `dish-${index + 1}`,
    name: String(dish.name || "Unnamed dish"),
    description: String(dish.description || ""),
    price: Number(dish.price) || 0,
    category: String(dish.category || "fast-food"),
    image: String(dish.image || ""),
    available: dish.available !== false,
    spicy: Boolean(dish.spicy),
  };
}

/*
 * The JSON is the source of truth for the original 23 dishes.
 * Saved admin edits may override their names, descriptions and prices,
 * but the original dishes always use the JSON's category and image path.
 * Availability is preserved. Deleted dish IDs are stored separately.
 */
async function loadAdminData() {
  try {
    const [response] = await Promise.all([
      fetch("data/data.json"),
    ]);

    if (!response.ok) {
      throw new Error("Could not load data/data.json.");
    }

    const sourceDishes = await response.json();

    if (!Array.isArray(sourceDishes)) {
      throw new Error("Menu data must be a JSON array.");
    }

    adminOrders = adminReadArray(ORDERS_STORAGE_KEY);

    const savedMenu = adminReadArray(ADMIN_MENU_STORAGE_KEY);
    const deletedIds = new Set(
      adminReadArray(DELETED_DISHES_STORAGE_KEY).map(String)
    );

    const savedById = new Map(
      savedMenu.map((dish) => [String(dish.id), dish])
    );

    const sourceIds = new Set(sourceDishes.map((dish) => String(dish.id)));

    const originalDishes = sourceDishes
      .filter((dish) => !deletedIds.has(String(dish.id)))
      .map((sourceDish) => {
        const savedDish = savedById.get(String(sourceDish.id)) || {};

        return normalizeDish({
          ...sourceDish,
          ...savedDish,

          // Always use the exact category and image path from the JSON.
          category: sourceDish.category,
          image: sourceDish.image,

          // Keep the saved availability choice, if one exists.
          available: savedById.has(String(sourceDish.id))
            ? savedDish.available !== false
            : true,
        });
      });

    // Preserve admin-created dishes that do not exist in the original JSON.
    const additionalDishes = savedMenu
      .filter((dish) => !sourceIds.has(String(dish.id)))
      .map(normalizeDish);

    adminDishes = [...originalDishes, ...additionalDishes];

    adminWriteArray(ADMIN_MENU_STORAGE_KEY, adminDishes);

    populateDishCategoryOptions();
    renderAdminDashboard();
  } catch (error) {
    console.error("Admin dashboard loading failed:", error);

    adminOrders = adminReadArray(ORDERS_STORAGE_KEY);
    adminDishes = adminReadArray(ADMIN_MENU_STORAGE_KEY).map(normalizeDish);

    populateDishCategoryOptions();
    renderAdminDashboard();

    showAdminToast(
      "Could not load data/data.json. Run the project through a local web server and check the browser console.",
      "error"
    );
  }
}

function saveAdminMenu(message = "Menu changes saved.") {
  try {
    adminWriteArray(ADMIN_MENU_STORAGE_KEY, adminDishes);
    populateDishCategoryOptions();
    renderAdminDashboard();
    showAdminToast(message);
  } catch (error) {
    console.error("Could not save menu:", error);
    showAdminToast("Could not save menu changes in this browser.", "error");
  }
}

function renderAdminDashboard() {
  renderDashboardStats();
  renderSalesChart();
  renderOrderStatusChart();
  renderRecentOrders();
  renderAdminMenu();
  renderAdminOrders();
  renderOrderSummaries();
  updatePendingBadges();
}

function renderDashboardStats() {
  const available = adminDishes.filter((dish) => dish.available).length;
  const pending = adminOrders.filter(
    (order) => String(order.status || "Pending").toLowerCase() === "pending"
  ).length;

  const deliveredRevenue = adminOrders
    .filter((order) => String(order.status).toLowerCase() === "delivered")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const values = {
    "stat-total-dishes": adminDishes.length,
    "stat-active-dishes": available,
    "stat-total-orders": adminOrders.length,
    "stat-total-revenue": adminMoney(deliveredRevenue),
    "stat-pending-orders": pending,
  };

  Object.entries(values).forEach(([id, value]) => {
    if (adminElement(id)) adminElement(id).textContent = value;
  });

  if (adminElement("dashboard-current-date")) {
    adminElement("dashboard-current-date").textContent =
      new Date().toLocaleDateString("en-ET", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  }

  if (adminElement("dashboard-year")) {
    adminElement("dashboard-year").textContent = new Date().getFullYear();
  }
}

function renderSalesChart() {
  const chart = adminElement("sales-chart");
  if (!chart) return;

  const days = Number(adminElement("sales-chart-period")?.value || 7);
  const now = new Date();
  const entries = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const revenue = adminOrders
      .filter((order) => {
        const created = new Date(order.createdAt || order.date || "");

        return (
          String(order.status).toLowerCase() === "delivered" &&
          !Number.isNaN(created.getTime()) &&
          created >= date &&
          created < nextDate
        );
      })
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    entries.push({ date, revenue });
  }

  const total = entries.reduce((sum, entry) => sum + entry.revenue, 0);

  if (adminElement("chart-total-revenue")) {
    adminElement("chart-total-revenue").textContent = adminMoney(total);
  }

  if (adminElement("chart-period-description")) {
    adminElement("chart-period-description").textContent =
      `Last ${days} days · Delivered orders`;
  }

  if (!entries.some((entry) => entry.revenue > 0)) {
    chart.innerHTML = `
      <div class="chart-empty-state">
        <span aria-hidden="true">▥</span>
        <p>No delivered-order revenue for this period yet.</p>
      </div>`;
    return;
  }

  const maxRevenue = Math.max(...entries.map((entry) => entry.revenue), 1);

  chart.innerHTML = `
    <div class="sales-chart-bars" style="--bar-count:${entries.length}">
      ${entries.map((entry) => {
        const height = entry.revenue > 0
          ? Math.max(5, (entry.revenue / maxRevenue) * 100)
          : 2;

        return `
          <div class="sales-bar-group">
            <span class="sales-bar-value">
              ${entry.revenue
                ? adminEscape(Math.round(entry.revenue).toLocaleString())
                : "—"}
            </span>
            <div class="sales-bar-track">
              <div class="sales-bar"
                style="height:${height}%"
                title="${adminEscape(adminMoney(entry.revenue))}">
              </div>
            </div>
            <time>${adminEscape(entry.date.toLocaleDateString("en", {
              day: "numeric",
              month: "short",
            }))}</time>
          </div>`;
      }).join("")}
    </div>`;
}

function renderOrderStatusChart() {
  const chart = adminElement("order-status-chart");
  const legend = adminElement("order-status-legend");
  if (!chart || !legend) return;

  const colors = {
    Pending: "#176b4d",
    Preparing: "#e6c15d",
    Ready: "#79a7d8",
    Delivered: "#49a67b",
    Cancelled: "#d9dfda",
  };

  const counts = ADMIN_STATUSES.map((status) => ({
    status,
    count: adminOrders.filter(
      (order) =>
        String(order.status || "Pending").toLowerCase() === status.toLowerCase()
    ).length,
  }));

  const total = adminOrders.length;
  let angle = 0;

  const segments = counts.map(({ status, count }) => {
    const start = angle;
    angle += total ? (count / total) * 360 : 0;
    return `${colors[status]} ${start}deg ${angle}deg`;
  });

  chart.innerHTML = `
    <div class="status-chart-ring"
      style="background:${total ? `conic-gradient(${segments.join(",")})` : "#e9eee9"}">
      <div class="status-chart-hole">
        <strong>${total}</strong>
        <span>Total orders</span>
      </div>
    </div>`;

  legend.innerHTML = counts.map(({ status, count }) => `
    <div class="status-legend-item">
      <span class="status-legend-dot" style="background:${colors[status]}"></span>
      <span>${status}</span>
      <strong>${count}</strong>
    </div>`).join("");
}

function orderCustomerName(order) {
  return order.customer?.name || order.username || "Customer";
}

function orderCreatedDate(order) {
  return order.createdAt || order.date || "";
}

function renderRecentOrders() {
  const recent = [...adminOrders]
    .sort(
      (a, b) =>
        new Date(orderCreatedDate(b)) - new Date(orderCreatedDate(a))
    )
    .slice(0, 5);

  if (!recent.length) {
    setTableContent("recent-orders-table", `
      <tr><td colspan="5" class="table-empty-state">
        No customer orders have been recorded yet.
      </td></tr>`);
    return;
  }

  setTableContent("recent-orders-table", recent.map((order) => `
    <tr>
      <td><strong>${adminEscape(order.id || "Order")}</strong></td>
      <td>${adminEscape(orderCustomerName(order))}</td>
      <td>${adminEscape(adminDate(orderCreatedDate(order)))}</td>
      <td>${adminEscape(adminMoney(order.total))}</td>
      <td>${adminStatus(order.status)}</td>
    </tr>`).join(""));
}

function populateMenuCategoryFilter() {
  const select = adminElement("admin-menu-category");
  if (!select) return;

  const selected = select.value || "all";

  select.innerHTML = `
    <option value="all">All categories</option>
    ${MENU_CATEGORIES.map((category) => `
      <option value="${adminEscape(category)}">
        ${adminEscape(category.replace(/-/g, " "))}
      </option>`).join("")}`;

  select.value = MENU_CATEGORIES.includes(selected) ? selected : "all";
}

function populateDishCategoryOptions() {
  const select = adminElement("dish-category");
  if (!select || select.tagName !== "SELECT") return;

  const selected = select.value;

  select.innerHTML = `
    <option value="">Select a category</option>
    ${MENU_CATEGORIES.map((category) => `
      <option value="${adminEscape(category)}">
        ${adminEscape(category.replace(/-/g, " "))}
      </option>`).join("")}`;

  if (MENU_CATEGORIES.includes(selected)) {
    select.value = selected;
  }
}

function getFilteredAdminDishes() {
  const query = String(adminElement("admin-menu-search")?.value || "")
    .trim()
    .toLowerCase();

  const category = adminElement("admin-menu-category")?.value || "all";
  const availability = adminElement("admin-menu-availability")?.value || "all";

  return adminDishes.filter((dish) => {
    const matchesQuery = [
      dish.name,
      dish.description,
      dish.category,
      dish.id,
    ].some((value) => String(value).toLowerCase().includes(query));

    const matchesCategory =
      category === "all" || dish.category === category;

    const matchesAvailability =
      availability === "all" ||
      (availability === "available" && dish.available) ||
      (availability === "disabled" && !dish.available);

    return matchesQuery && matchesCategory && matchesAvailability;
  });
}

function renderAdminMenu() {
  const grid = adminElement("admin-menu-grid");
  if (!grid) return;

  populateMenuCategoryFilter();

  const dishes = getFilteredAdminDishes();
  const count = adminElement("admin-menu-count");

  if (count) {
    count.textContent = `Showing ${dishes.length} of ${adminDishes.length} dishes`;
  }

  if (!dishes.length) {
    grid.innerHTML = `
      <div class="admin-menu-empty">
        <span aria-hidden="true">🍽️</span>
        <h3>No dishes found</h3>
        <p>Try another search or filter, or add a new dish to your menu.</p>
      </div>`;
    return;
  }

  grid.innerHTML = dishes.map((dish) => {
    const imagePath = dish.image;

    return `
      <article class="admin-menu-card ${dish.available ? "" : "is-disabled"}">
        <div class="admin-menu-card-image-wrap">
          ${imagePath ? `
            <img class="admin-menu-card-image"
              src="${adminEscape(imagePath)}"
              alt="${adminEscape(dish.name)}"
              loading="lazy"
              onerror="this.hidden=true;this.nextElementSibling.hidden=false;">
            <div class="admin-image-fallback" hidden>
              <span aria-hidden="true">🍽️</span>
              <span>Image unavailable</span>
              <small>${adminEscape(imagePath)}</small>
            </div>
          ` : `
            <div class="admin-image-fallback">
              <span aria-hidden="true">🍽️</span>
              <span>No image path</span>
            </div>
          `}
          ${adminAvailabilityBadge(dish.available)}
        </div>

        <div class="admin-menu-card-body">
          <div class="admin-menu-card-meta">
            <span class="admin-menu-card-category">
              ${adminEscape(dish.category.replace(/-/g, " "))}
            </span>
            <span class="admin-menu-card-id">#${adminEscape(dish.id)}</span>
          </div>

          <h3 class="admin-menu-card-title">${adminEscape(dish.name)}</h3>
          <p class="admin-menu-card-description">
            ${adminEscape(dish.description || "No description added yet.")}
          </p>

          <div class="admin-menu-card-price-row">
            <span class="admin-menu-card-price">
              ${adminEscape(adminMoney(dish.price))}
            </span>
            ${dish.spicy
              ? '<span title="Spicy dish" aria-label="Spicy dish">🌶️</span>'
              : ""}
          </div>

          <div class="admin-menu-card-actions">
            <button class="admin-small-button edit-dish-button"
              type="button" data-edit-dish="${adminEscape(dish.id)}">
              Edit dish
            </button>

            <button class="admin-small-button toggle-dish-button"
              type="button" data-toggle-dish="${adminEscape(dish.id)}">
              ${dish.available ? "Disable dish" : "Enable dish"}
            </button>

            <button class="admin-small-button delete-dish-button"
              type="button" data-delete-dish="${adminEscape(dish.id)}">
              Delete dish
            </button>
          </div>
        </div>
      </article>`;
  }).join("");
}

function renderAdminOrders() {
  const query = String(adminElement("admin-order-search")?.value || "")
    .trim()
    .toLowerCase();

  const statusFilter = adminElement("admin-order-status-filter")?.value || "all";

  const orders = [...adminOrders]
    .sort(
      (a, b) =>
        new Date(orderCreatedDate(b)) - new Date(orderCreatedDate(a))
    )
    .filter((order) => {
      const searchable = [
        order.id,
        orderCustomerName(order),
        order.username,
        order.customer?.phone,
      ].join(" ").toLowerCase();

      const matchesQuery = searchable.includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        String(order.status || "Pending").toLowerCase() === statusFilter;

      return matchesQuery && matchesStatus;
    });

  if (!orders.length) {
    setTableContent("admin-orders-table", `
      <tr><td colspan="7" class="table-empty-state">
        No matching orders found.
      </td></tr>`);
    return;
  }

  setTableContent("admin-orders-table", orders.map((order) => {
    const itemCount = (order.items || []).reduce(
      (sum, item) => sum + Number(item.quantity || 1),
      0
    );

    const options = ADMIN_STATUSES.map((status) => `
      <option value="${status}"
        ${String(order.status || "Pending").toLowerCase() === status.toLowerCase()
          ? "selected"
          : ""}>
        ${status}
      </option>`).join("");

    return `
      <tr>
        <td><strong>${adminEscape(order.id || "Order")}</strong></td>
        <td>
          <strong>${adminEscape(orderCustomerName(order))}</strong>
          <br><span>${adminEscape(order.customer?.phone || "")}</span>
        </td>
        <td>${itemCount} item${itemCount === 1 ? "" : "s"}</td>
        <td>${adminEscape(adminDateTime(orderCreatedDate(order)))}</td>
        <td>${adminEscape(adminMoney(order.total))}</td>
        <td>${adminStatus(order.status)}</td>
        <td>
          <label>
            <span class="visually-hidden">
              Update status for ${adminEscape(order.id)}
            </span>
            <select class="admin-inline-select"
              data-order-status="${adminEscape(order.id)}">
              ${options}
            </select>
          </label>
        </td>
      </tr>`;
  }).join(""));
}

function renderOrderSummaries() {
  const counts = {
    total: adminOrders.length,
    pending: 0,
    preparing: 0,
    completed: 0,
  };

  adminOrders.forEach((order) => {
    const status = String(order.status || "Pending").toLowerCase();

    if (status === "pending") counts.pending += 1;
    if (status === "preparing") counts.preparing += 1;
    if (status === "delivered") counts.completed += 1;
  });

  const mapping = {
    "orders-summary-total": counts.total,
    "orders-summary-pending": counts.pending,
    "orders-summary-preparing": counts.preparing,
    "orders-summary-completed": counts.completed,
  };

  Object.entries(mapping).forEach(([id, value]) => {
    if (adminElement(id)) adminElement(id).textContent = value;
  });
}

function updatePendingBadges() {
  const pending = adminOrders.filter(
    (order) => String(order.status || "Pending").toLowerCase() === "pending"
  ).length;

  if (adminElement("sidebar-pending-count")) {
    adminElement("sidebar-pending-count").textContent = pending;
    adminElement("sidebar-pending-count").hidden = pending === 0;
  }
}

function updateOrderStatus(orderId, newStatus) {
  if (!ADMIN_STATUSES.includes(newStatus)) return;

  const order = adminOrders.find(
    (item) => String(item.id) === String(orderId)
  );

  if (!order) {
    showAdminToast("Order not found. Refresh and try again.", "error");
    return;
  }

  order.status = newStatus;

  try {
    // Keep the same localStorage key used by customer order history.
    adminWriteArray(ORDERS_STORAGE_KEY, adminOrders);
    renderAdminDashboard();
    showAdminToast(`Order ${order.id} updated to ${newStatus}.`);
  } catch (error) {
    console.error("Could not save order status:", error);
    showAdminToast("Could not save the order status.", "error");
  }
}

function openDishDialog(dish = null) {
  const dialog = adminElement("dish-dialog");
  const form = adminElement("dish-form");
  if (!dialog || !form) return;

  form.reset();
  populateDishCategoryOptions();

  adminElement("dish-dialog-title").textContent = dish ? "Edit dish" : "Add a dish";
  adminElement("dish-id").value = dish ? String(dish.id) : "";
  adminElement("dish-name").value = dish?.name || "";
  adminElement("dish-description").value = dish?.description || "";
  adminElement("dish-price").value = dish ? String(dish.price) : "";
  adminElement("dish-category").value = dish?.category || "";
  adminElement("dish-image").value = dish?.image || "";
  adminElement("dish-spicy").checked = Boolean(dish?.spicy);

  if (!dialog.open) dialog.showModal();
  adminElement("dish-name").focus();
}

function closeDishDialog() {
  const dialog = adminElement("dish-dialog");
  if (dialog?.open) dialog.close();
}

function handleDishFormSubmit(event) {
  event.preventDefault();

  const idValue = adminElement("dish-id").value.trim();
  const name = adminElement("dish-name").value.trim();
  const description = adminElement("dish-description").value.trim();
  const price = Number(adminElement("dish-price").value);
  const category = adminElement("dish-category").value.trim().toLowerCase();
  const image = adminElement("dish-image").value.trim();
  const spicy = adminElement("dish-spicy").checked;

  if (
    !name ||
    !description ||
    !MENU_CATEGORIES.includes(category) ||
    !image ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    showAdminToast(
      "Enter a name, description, valid price, image path and one of the six menu categories.",
      "error"
    );
    return;
  }

  const duplicate = adminDishes.find(
    (dish) =>
      dish.name.toLowerCase() === name.toLowerCase() &&
      String(dish.id) !== idValue
  );

  if (duplicate) {
    showAdminToast("A dish with that name already exists.", "error");
    return;
  }

  if (idValue) {
    const index = adminDishes.findIndex(
      (dish) => String(dish.id) === idValue
    );

    if (index === -1) {
      showAdminToast("Dish not found. Refresh and try again.", "error");
      return;
    }

    adminDishes[index] = {
      ...adminDishes[index],
      name,
      description,
      price,
      category,
      image,
      spicy,
    };

    closeDishDialog();
    saveAdminMenu("Dish updated successfully.");
    return;
  }

  const newId = `dish-${Date.now()}`;

  adminDishes.push({
    id: newId,
    name,
    description,
    price,
    category,
    image,
    spicy,
    available: true,
  });

  closeDishDialog();
  saveAdminMenu("New dish added successfully.");
}

function toggleDishAvailability(id) {
  const dish = adminDishes.find(
    (item) => String(item.id) === String(id)
  );

  if (!dish) return;

  dish.available = !dish.available;

  saveAdminMenu(
    dish.available
      ? `${dish.name} is now available in the admin menu.`
      : `${dish.name} has been disabled in the admin menu.`
  );
}

function openDeleteDialog(id) {
  const dish = adminDishes.find(
    (item) => String(item.id) === String(id)
  );

  const dialog = adminElement("delete-dish-dialog");
  if (!dish || !dialog) return;

  pendingDeleteDishId = dish.id;
  adminElement("delete-dish-name").textContent = dish.name;

  if (!dialog.open) dialog.showModal();
  adminElement("confirm-delete-dish").focus();
}

function closeDeleteDialog() {
  const dialog = adminElement("delete-dish-dialog");
  if (dialog?.open) dialog.close();

  pendingDeleteDishId = null;
}

function confirmDeleteDish() {
  if (pendingDeleteDishId === null) return;

  const dish = adminDishes.find(
    (item) => String(item.id) === String(pendingDeleteDishId)
  );

  if (!dish) {
    closeDeleteDialog();
    showAdminToast("Dish not found.", "error");
    return;
  }

  const deletedIds = adminReadArray(DELETED_DISHES_STORAGE_KEY);

  if (
    !deletedIds.some((id) => String(id) === String(pendingDeleteDishId)) &&
    Number.isInteger(Number(pendingDeleteDishId))
  ) {
    deletedIds.push(pendingDeleteDishId);
  }

  adminDishes = adminDishes.filter(
    (item) => String(item.id) !== String(pendingDeleteDishId)
  );

  try {
    adminWriteArray(DELETED_DISHES_STORAGE_KEY, deletedIds);
    adminWriteArray(ADMIN_MENU_STORAGE_KEY, adminDishes);
  } catch (error) {
    console.error("Could not save dish deletion:", error);
    closeDeleteDialog();
    showAdminToast("Could not save the deletion.", "error");
    return;
  }

  closeDeleteDialog();
  populateDishCategoryOptions();
  renderAdminDashboard();
  showAdminToast(`${dish.name} was deleted from the admin menu.`);
}

function showAdminSection(sectionName) {
  const allowed = ["overview", "menu-management", "order-management"];
  if (!allowed.includes(sectionName)) return;

  document.querySelectorAll("[data-admin-panel]").forEach((panel) => {
    const active = panel.dataset.adminPanel === sectionName;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });

  document.querySelectorAll("[data-admin-section]").forEach((link) => {
    const active = link.dataset.adminSection === sectionName;
    link.classList.toggle("active", active);

    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const titles = {
    overview: "Dashboard overview",
    "menu-management": "Menu management",
    "order-management": "Order management",
  };

  if (adminElement("dashboard-page-title")) {
    adminElement("dashboard-page-title").textContent = titles[sectionName];
  }

  const sidebar = adminElement("dashboard-sidebar");
  const menuButton = adminElement("mobile-menu-button");

  sidebar?.classList.remove("mobile-open");
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "Open dashboard navigation");

  if (window.location.hash !== `#${sectionName}`) {
    history.replaceState(null, "", `#${sectionName}`);
  }
}

function initializeAdminDashboard() {
  if (!requireAdminSession()) return;

  document.querySelectorAll("[data-admin-section]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showAdminSection(link.dataset.adminSection);
    });
  });

  document.querySelectorAll("[data-open-admin-section]").forEach((button) => {
    button.addEventListener("click", () => {
      showAdminSection(button.dataset.openAdminSection);
    });
  });

  adminElement("admin-logout-button")?.addEventListener("click", () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.replace("admin-login.html");
  });

  adminElement("mobile-menu-button")?.addEventListener("click", () => {
    const sidebar = adminElement("dashboard-sidebar");
    const button = adminElement("mobile-menu-button");
    if (!sidebar || !button) return;

    const isOpen = sidebar.classList.toggle("mobile-open");

    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute(
      "aria-label",
      isOpen ? "Close dashboard navigation" : "Open dashboard navigation"
    );
  });

  adminElement("add-dish-button")?.addEventListener("click", () => {
    openDishDialog();
  });

  adminElement("close-dish-dialog")?.addEventListener("click", closeDishDialog);
  adminElement("cancel-dish-button")?.addEventListener("click", closeDishDialog);
  adminElement("dish-form")?.addEventListener("submit", handleDishFormSubmit);

  adminElement("close-delete-dialog")?.addEventListener("click", closeDeleteDialog);
  adminElement("cancel-delete-dish")?.addEventListener("click", closeDeleteDialog);
  adminElement("confirm-delete-dish")?.addEventListener("click", confirmDeleteDish);

  adminElement("admin-menu-grid")?.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-dish]");
    const toggleButton = event.target.closest("[data-toggle-dish]");
    const deleteButton = event.target.closest("[data-delete-dish]");

    if (editButton) {
      const dish = adminDishes.find(
        (item) => String(item.id) === editButton.dataset.editDish
      );

      if (dish) openDishDialog(dish);
    }

    if (toggleButton) {
      toggleDishAvailability(toggleButton.dataset.toggleDish);
    }

    if (deleteButton) {
      openDeleteDialog(deleteButton.dataset.deleteDish);
    }
  });

  adminElement("admin-menu-search")?.addEventListener("input", renderAdminMenu);
  adminElement("admin-menu-category")?.addEventListener("change", renderAdminMenu);
  adminElement("admin-menu-availability")?.addEventListener("change", renderAdminMenu);

  adminElement("admin-order-search")?.addEventListener("input", renderAdminOrders);
  adminElement("admin-order-status-filter")?.addEventListener("change", renderAdminOrders);

  adminElement("admin-orders-table")?.addEventListener("change", (event) => {
    const select = event.target.closest("[data-order-status]");
    if (!select) return;

    updateOrderStatus(select.dataset.orderStatus, select.value);
  });

  adminElement("sales-chart-period")?.addEventListener("change", renderSalesChart);

  adminElement("refresh-orders-button")?.addEventListener("click", () => {
    adminOrders = adminReadArray(ORDERS_STORAGE_KEY);
    renderAdminDashboard();
    showAdminToast("Orders refreshed.");
  });

  // Keep order status synchronized across customer and admin tabs.
  window.addEventListener("storage", (event) => {
    if (event.key === ORDERS_STORAGE_KEY) {
      adminOrders = adminReadArray(ORDERS_STORAGE_KEY);
      renderAdminDashboard();
    }
  });

  window.addEventListener("focus", () => {
    adminOrders = adminReadArray(ORDERS_STORAGE_KEY);
    renderAdminDashboard();
  });

  const initialSection = window.location.hash.replace("#", "");

  showAdminSection(
    ["overview", "menu-management", "order-management"].includes(initialSection)
      ? initialSection
      : "overview"
  );

  loadAdminData();
}

document.addEventListener("DOMContentLoaded", initializeAdminDashboard);
