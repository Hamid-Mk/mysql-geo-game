// =============================================================================
// app.js  —  SQL Atlas  |  Shared JavaScript Utilities
// =============================================================================
// PURPOSE:
//   Loaded on EVERY page. Contains:
//   - API_BASE_URL: central place to change the backend URL
//   - api(): a fetch wrapper used by quiz.js and admin.js
//   - Utility functions shared across pages
//
// IMPORTANT:
//   Change API_BASE_URL here when you deploy.
//   Local:       http://localhost:8000
//   Production:  https://your-backend.onrender.com   ← update this!
// =============================================================================

// -----------------------------------------------------------------------------
// 1. API Configuration
// -----------------------------------------------------------------------------
const API_BASE_URL = "http://localhost:8000/api";

// -----------------------------------------------------------------------------
// 2. Generic API fetch wrapper
//    Usage:
//      const data = await api("/challenges");
//      const data = await api("/execute-query", "POST", { query: "SELECT ...", challenge_id: 1 });
//
//    Returns the JSON response body.
//    Throws an Error with a readable message on HTTP errors.
// -----------------------------------------------------------------------------
async function api(path, method = "GET", body = null, extraHeaders = {}) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (networkError) {
    // Server is completely unreachable (offline / wrong port)
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const json = await response.json();

  if (!response.ok) {
    // FastAPI returns { detail: "..." } for HTTP errors
    const message = json.detail || json.error || `Server error: ${response.status}`;
    throw new Error(message);
  }

  return json;
}

// -----------------------------------------------------------------------------
// 3. Admin token helpers
//    Token is stored in sessionStorage so it clears when the browser tab closes.
// -----------------------------------------------------------------------------
function getAdminToken() {
  return sessionStorage.getItem("admin_token");
}

function setAdminToken(token) {
  sessionStorage.setItem("admin_token", token);
}

function clearAdminToken() {
  sessionStorage.removeItem("admin_token");
}

// -----------------------------------------------------------------------------
// 4. URL parameter helper
//    Usage:  getParam("id")  →  "3"  (from quiz.html?id=3)
// -----------------------------------------------------------------------------
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// -----------------------------------------------------------------------------
// 5. Difficulty badge helper
//    Returns the CSS class string for a difficulty value
// -----------------------------------------------------------------------------
function difficultyClass(difficulty) {
  const map = { easy: "easy", medium: "medium", hard: "hard" };
  return map[difficulty] || "easy";
}

// -----------------------------------------------------------------------------
// 6. Connection check on page load
//    Shows a subtle warning banner if the backend is unreachable.
//    TODO: Style the #api-status-banner element in style.css if you add it to HTML.
// -----------------------------------------------------------------------------
async function checkConnection() {
  try {
    await api("/ping");
  } catch (e) {
    console.warn("Backend unreachable:", e.message);
    // Optionally show a banner
    const banner = document.getElementById("api-status-banner");
    if (banner) {
      banner.textContent = "⚠️ Cannot connect to server. Please check the backend.";
      banner.style.display = "block";
    }
  }
}

// Only run connection check on quiz and admin pages (not home)
if (document.body.classList.contains("page-quiz") ||
    document.body.classList.contains("page-admin")) {
  checkConnection();
}
