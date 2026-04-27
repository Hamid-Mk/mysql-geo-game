// =============================================================================
// app.js  —  SQL Atlas  |  Shared JavaScript Utilities & Particles
// =============================================================================

const API_BASE_URL = "http://localhost:8000/api";

// -----------------------------------------------------------------------------
// API Wrapper
// -----------------------------------------------------------------------------
async function api(path, method = "GET", body = null, extraHeaders = {}) {
  const options = {
    method,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  };
  if (body) options.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (err) {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.detail || json.error || `Server error: ${response.status}`);
  }
  return json;
}

// -----------------------------------------------------------------------------
// Token Management
// -----------------------------------------------------------------------------
function getAdminToken() { return sessionStorage.getItem("admin_token"); }
function setAdminToken(token) { sessionStorage.setItem("admin_token", token); }
function clearAdminToken() { sessionStorage.removeItem("admin_token"); }

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function difficultyClass(difficulty) {
  const map = { easy: "easy", medium: "medium", hard: "hard" };
  return map[difficulty] || "easy";
}

// -----------------------------------------------------------------------------
// Background Particles (tsParticles)
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // If tsParticles is loaded, initialize a beautiful space/data background
  if (window.tsParticles) {
    tsParticles.load("tsparticles", {
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      particles: {
        color: { value: ["#4F46E5", "#0891B2", "#059669", "#D97706", "#DB2777"] },
        links: { enable: true, color: "#4F46E5", opacity: 0.07, distance: 140, width: 1 },
        move: { enable: true, speed: 0.7, direction: "none", random: true, outModes: { default: "bounce" } },
        number: { value: 50, density: { enable: true, area: 900 } },
        opacity: { value: { min: 0.15, max: 0.5 }, animation: { enable: true, speed: 0.4 } },
        shape: { type: ["circle", "triangle"] },
        size: { value: { min: 2, max: 5 } }
      },
      interactivity: {
        events: { onHover: { enable: true, mode: "grab" }, onClick: { enable: true, mode: "push" } },
        modes: { grab: { distance: 160, links: { opacity: 0.35 } }, push: { quantity: 3 } }
      },
      detectRetina: true
    });
  }
});
