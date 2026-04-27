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
      interactivity: {
        events: {
          onClick: { enable: true, mode: "push" },
          onHover: { enable: true, mode: "repulse" },
          resize: true
        },
        modes: {
          push: { quantity: 4 },
          repulse: { distance: 100, duration: 0.4 }
        }
      },
      particles: {
        color: { value: ["#7c3aed", "#06b6d4", "#f59e0b"] },
        links: {
          color: "#ffffff",
          distance: 150,
          enable: true,
          opacity: 0.1,
          width: 1
        },
        collisions: { enable: true },
        move: {
          direction: "none",
          enable: true,
          outModes: { default: "bounce" },
          random: false,
          speed: 1,
          straight: false
        },
        number: { density: { enable: true, area: 800 }, value: 60 },
        opacity: { value: 0.5 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } }
      },
      detectRetina: true
    });
  }
});
