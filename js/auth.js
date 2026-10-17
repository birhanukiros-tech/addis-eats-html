/* =========================================================
   ADDIS EATS — CUSTOMER AUTHENTICATION
   ========================================================= */

const CUSTOMER_USERNAME = "customer";
const CUSTOMER_PASSWORD = "1234";

const CUSTOMER_AUTH_KEY = "addiseats_user";
const AUTH_RETURN_KEY = "addiseats_auth_return";

/* =========================================================
   GET CURRENT USER
   ========================================================= */

function getCurrentUser() {
  const savedUser = localStorage.getItem(CUSTOMER_AUTH_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    localStorage.removeItem(CUSTOMER_AUTH_KEY);
    return null;
  }
}

/* =========================================================
   CHECK LOGIN
   ========================================================= */

function isLoggedIn() {
  return getCurrentUser() !== null;
}

/* =========================================================
   LOGIN CUSTOMER
   ========================================================= */

function loginCustomer(username, password) {
  username = username.trim();

  if (username !== CUSTOMER_USERNAME) {
    return {
      success: false,
      message: "Incorrect username.",
    };
  }

  if (password !== CUSTOMER_PASSWORD) {
    return {
      success: false,
      message: "Incorrect password.",
    };
  }

  const user = {
    username: username,
    loggedInAt: new Date().toISOString(),
  };

  localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(user));

  updateAuthUI();
  updateCheckoutAuthState();

  return {
    success: true,
    user: user,
  };
}

/* =========================================================
   LOGOUT CUSTOMER
   ========================================================= */

function logoutCustomer() {
  localStorage.removeItem(CUSTOMER_AUTH_KEY);
  localStorage.removeItem(AUTH_RETURN_KEY);

  updateAuthUI();
  updateCheckoutAuthState();

  if (typeof showSection === "function") {
    showSection("home");
  }

  if (typeof showToast === "function") {
    showToast("You have been signed out.", "success");
  }
}

/* =========================================================
   UPDATE NAV AUTH BUTTON
   ========================================================= */

function updateAuthUI() {
  const signInButton = document.getElementById("nav-signin-button");

  if (!signInButton) {
    return;
  }

  if (isLoggedIn()) {
    signInButton.textContent = "Sign Out";

    signInButton.dataset.authAction = "logout";

    signInButton.setAttribute("aria-label", "Sign out");
  } else {
    signInButton.textContent = "Sign In";

    signInButton.dataset.authAction = "login";

    signInButton.setAttribute("aria-label", "Sign in");
  }
}

/* =========================================================
   CHECKOUT AUTH STATUS
   ========================================================= */

function updateCheckoutAuthState() {
  const authStatus = document.getElementById("checkout-auth-status");

  if (!authStatus) {
    return;
  }

  if (isLoggedIn()) {
    const user = getCurrentUser();

    authStatus.innerHTML = `
      <div class="checkout-auth-success">
        <strong>Signed in</strong>
        <span>
          Welcome, ${escapeAuthHTML(user.username)}
        </span>
      </div>
    `;
  } else {
    authStatus.innerHTML = `
      <div class="checkout-auth-required">
        <p>
          Please sign in before placing your order.
        </p>

        <button
          type="button"
          class="secondary-button"
          data-scroll="signin"
        >
          Sign In
        </button>
      </div>
    `;
  }
}

/* =========================================================
   REQUIRE CUSTOMER LOGIN
   ========================================================= */

function requireCustomerLogin(returnSection = "checkout") {
  if (isLoggedIn()) {
    return true;
  }

  /*
     Remember where the customer wanted to go.
     After successful login, we will return there.
  */

  localStorage.setItem(AUTH_RETURN_KEY, returnSection);

  if (typeof showSection === "function") {
    showSection("signin");
  }

  if (typeof showToast === "function") {
    showToast("Please sign in before continuing.", "error");
  }

  return false;
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeAuthHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   REMOVE LOGIN PLACEHOLDERS
   ========================================================= */

function removeLoginPlaceholders() {
  const usernameInput = document.getElementById("signin-username");

  const passwordInput = document.getElementById("signin-password");

  if (usernameInput) {
    usernameInput.removeAttribute("placeholder");
  }

  if (passwordInput) {
    passwordInput.removeAttribute("placeholder");
  }
}

/* =========================================================
   GET RETURN SECTION
   ========================================================= */

function getAuthReturnSection() {
  const returnSection = localStorage.getItem(AUTH_RETURN_KEY);

  localStorage.removeItem(AUTH_RETURN_KEY);

  return returnSection || "home";
}

/* =========================================================
   INITIALIZE CUSTOMER AUTH
   ========================================================= */

function initializeCustomerAuth() {
  const signInForm = document.getElementById("signin-form");

  const usernameInput = document.getElementById("signin-username");

  const passwordInput = document.getElementById("signin-password");

  const usernameError = document.getElementById("signin-username-error");

  const passwordError = document.getElementById("signin-password-error");

  const signInError = document.getElementById("signin-error");

  removeLoginPlaceholders();

  updateAuthUI();
  updateCheckoutAuthState();

  /* =======================================================
     NAV SIGN IN / SIGN OUT BUTTON
     ======================================================= */

  const signInButton = document.getElementById("nav-signin-button");

  if (signInButton) {
    signInButton.addEventListener("click", () => {
      if (isLoggedIn()) {
        logoutCustomer();
        return;
      }

      localStorage.setItem(AUTH_RETURN_KEY, "signin");

      if (typeof showSection === "function") {
        showSection("signin");
      }

      setTimeout(() => {
        if (usernameInput) {
          usernameInput.focus();
        }
      }, 300);
    });
  }

  /* =======================================================
     SIGN IN FORM
     ======================================================= */

  if (!signInForm) {
    return;
  }

  signInForm.addEventListener("submit", (event) => {
    event.preventDefault();

    /* Clear old errors */

    if (usernameError) {
      usernameError.textContent = "";
      usernameError.hidden = true;
    }

    if (passwordError) {
      passwordError.textContent = "";
      passwordError.hidden = true;
    }

    if (signInError) {
      signInError.textContent = "";
      signInError.hidden = true;
    }

    /* Get values */

    const username = usernameInput?.value.trim() || "";

    const password = passwordInput?.value || "";

    /* Username validation */

    if (!username) {
      if (usernameError) {
        usernameError.textContent = "Please enter your username.";

        usernameError.hidden = false;
      }

      usernameInput?.focus();
      return;
    }

    /* Password validation */

    if (!password) {
      if (passwordError) {
        passwordError.textContent = "Please enter your password.";

        passwordError.hidden = false;
      }

      passwordInput?.focus();
      return;
    }

    /* Attempt login */

    const result = loginCustomer(username, password);

    if (!result.success) {
      if (signInError) {
        signInError.textContent = result.message;

        signInError.hidden = false;
      }

      return;
    }

    /* Clear form */

    signInForm.reset();

    /* Success message */

    if (typeof showToast === "function") {
      showToast(`Welcome, ${username}!`, "success");
    }

    /*
         IMPORTANT:
         Return the customer to the section
         they originally requested.
      */

    const returnSection = getAuthReturnSection();

    if (typeof showSection === "function") {
      showSection(returnSection);
    }

    /*
         If returning to checkout,
         refresh the checkout information.
      */

    if (returnSection === "checkout" && typeof refreshCheckout === "function") {
      refreshCheckout();
    }
  });
}

/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.getCurrentUser = getCurrentUser;

window.isLoggedIn = isLoggedIn;

window.loginCustomer = loginCustomer;

window.logoutCustomer = logoutCustomer;

window.requireCustomerLogin = requireCustomerLogin;

window.updateAuthUI = updateAuthUI;

window.updateCheckoutAuthState = updateCheckoutAuthState;

/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", initializeCustomerAuth);
