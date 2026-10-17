
/* ADDIS EATS — ADMIN DEMO LOGIN */

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "AddisAdmin123!";
const ADMIN_SESSION_KEY = "addiseats_admin";

function getAdminSession() {
  try {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);

    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error("Failed to read admin session:", error);
    return null;
  }
}

function isAdminLoggedIn() {
  const session = getAdminSession();

  return Boolean(
    session &&
    session.username === ADMIN_USERNAME &&
    session.authenticated === true
  );
}

function showAdminLoginError(message) {
  const errorElement = document.getElementById("admin-login-error");

  if (!errorElement) return;

  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearAdminLoginError() {
  const errorElement = document.getElementById("admin-login-error");

  if (!errorElement) return;

  errorElement.textContent = "";
  errorElement.hidden = true;
}

function handleAdminLogin(event) {
  event.preventDefault();
  clearAdminLoginError();

  const usernameInput = document.getElementById("admin-username");
  const passwordInput = document.getElementById("admin-password");
  const submitButton = event.currentTarget.querySelector(
    'button[type="submit"]'
  );

  if (!usernameInput || !passwordInput) {
    showAdminLoginError("The login form could not be loaded. Please refresh.");
    return;
  }

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    showAdminLoginError(
      "Incorrect username or password. Please check the demo credentials."
    );
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  try {
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        username: ADMIN_USERNAME,
        authenticated: true,
        signedInAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Failed to save admin demo session:", error);
    showAdminLoginError(
      "Your browser could not save the demo session. Please enable local storage."
    );
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Opening dashboard...";
  }

  window.location.href = "admin-dashboard.html";
}

function initializeAdminLogin() {
  // If this browser already has a demo session, open the dashboard.
  if (isAdminLoggedIn()) {
    window.location.replace("admin-dashboard.html");
    return;
  }

  const form = document.getElementById("admin-login-form");

  if (!form) {
    console.error("Admin login form was not found.");
    return;
  }

  form.addEventListener("submit", handleAdminLogin);

  const usernameInput = document.getElementById("admin-username");

  if (usernameInput) {
    usernameInput.focus();
  }
}

window.getAdminSession = getAdminSession;
window.isAdminLoggedIn = isAdminLoggedIn;

document.addEventListener("DOMContentLoaded", initializeAdminLogin);
