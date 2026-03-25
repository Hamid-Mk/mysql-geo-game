// =============================================================================
// admin.js  —  SQL Atlas  |  Teacher Dashboard Logic
// =============================================================================
// PURPOSE:
//   Controls everything on admin_teacher.html:
//   - Teacher login / logout
//   - Tab switching
//   - Add Challenge form with validation
//   - View all challenges list with difficulty filter
//
// DEPENDS ON:  app.js  (must be loaded first)
// =============================================================================

// ─── DOM References ───────────────────────────────────────────────────────────
const elLoginSection     = document.getElementById("login-section");
const elDashboardSection = document.getElementById("dashboard-section");
const elPasswordInput    = document.getElementById("password-input");
const elBtnLogin         = document.getElementById("btn-login");
const elBtnLogout        = document.getElementById("btn-logout");
const elLoginError       = document.getElementById("login-error");

const elBtnSaveChallenge = document.getElementById("btn-save-challenge");
const elBtnClearForm     = document.getElementById("btn-clear-form");
const elInputQuestion    = document.getElementById("input-question");
const elInputExpectedSql = document.getElementById("input-expected-sql");
const elInputDifficulty  = document.getElementById("input-difficulty");
const elInputHint        = document.getElementById("input-hint");
const elSaveFeedback     = document.getElementById("save-feedback");

const elBtnRefresh       = document.getElementById("btn-refresh-challenges");
const elFilterDifficulty = document.getElementById("filter-difficulty");
const elChallengesList   = document.getElementById("challenges-list");

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // If already logged in (token in sessionStorage), skip login form
  if (getAdminToken()) {
    showDashboard();
  }

  // Wire buttons
  elBtnLogin.addEventListener("click", handleLogin);
  elBtnLogout.addEventListener("click", handleLogout);
  elBtnSaveChallenge.addEventListener("click", handleSaveChallenge);
  elBtnClearForm.addEventListener("click", clearForm);
  elBtnRefresh.addEventListener("click", loadChallengesList);
  elFilterDifficulty.addEventListener("change", loadChallengesList);

  // Allow Enter key in password field
  elPasswordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN / LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
async function handleLogin() {
  const password = elPasswordInput.value.trim();
  if (!password) {
    elLoginError.textContent = "Please enter a password.";
    elLoginError.style.display = "block";
    return;
  }

  elBtnLogin.disabled = true;
  elBtnLogin.textContent = "Logging in...";
  elLoginError.style.display = "none";

  try {
    const data = await api("/admin/login", "POST", { password });
    setAdminToken(data.token);
    showDashboard();
  } catch (e) {
    elLoginError.textContent = "❌ " + e.message;
    elLoginError.style.display = "block";
  } finally {
    elBtnLogin.disabled = false;
    elBtnLogin.textContent = "Login →";
  }
}

function handleLogout() {
  clearAdminToken();
  elDashboardSection.style.display = "none";
  elLoginSection.style.display = "block";
  elPasswordInput.value = "";
}

function showDashboard() {
  elLoginSection.style.display = "none";
  elDashboardSection.style.display = "block";
  loadChallengesList();  // pre-load challenge list on dashboard open
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────────────────────
function switchTab(tabId) {
  // Update button active states
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  // Show/hide panels
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.style.display = panel.id === `tab-${tabId}` ? "block" : "none";
  });

  // Load challenges list when switching to that tab
  if (tabId === "view-challenges") loadChallengesList();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD CHALLENGE FORM
// ─────────────────────────────────────────────────────────────────────────────
async function handleSaveChallenge() {
  // --- Validate ---
  let valid = true;

  const fields = [
    { el: elInputQuestion,    key: "question" },
    { el: elInputExpectedSql, key: "expected_sql" },
  ];
  fields.forEach(({ el, key }) => {
    const errEl = document.querySelector(`.field-error[data-field="${key}"]`);
    if (!el.value.trim()) {
      el.classList.add("error");
      if (errEl) errEl.style.display = "block";
      valid = false;
    } else {
      el.classList.remove("error");
      if (errEl) errEl.style.display = "none";
    }
  });

  // Difficulty
  const diffErrEl = document.querySelector('.field-error[data-field="difficulty"]');
  if (!elInputDifficulty.value) {
    elInputDifficulty.classList.add("error");
    if (diffErrEl) diffErrEl.style.display = "block";
    valid = false;
  } else {
    elInputDifficulty.classList.remove("error");
    if (diffErrEl) diffErrEl.style.display = "none";
  }

  if (!valid) return;

  // --- Submit ---
  elBtnSaveChallenge.disabled = true;
  elBtnSaveChallenge.textContent = "Saving...";
  hideSaveFeedback();

  try {
    await api("/admin/add-challenge", "POST",
      {
        question_text:  elInputQuestion.value.trim(),
        expected_query: elInputExpectedSql.value.trim(),
        difficulty:     elInputDifficulty.value,
        hint:           elInputHint.value.trim(),
      },
      { "X-Admin-Token": getAdminToken() }
    );
    showSaveFeedback(true, "✅ Challenge saved successfully!");
    clearForm();
  } catch (e) {
    showSaveFeedback(false, "❌ Error: " + e.message);
  } finally {
    elBtnSaveChallenge.disabled = false;
    elBtnSaveChallenge.textContent = "💾 Save Challenge";
  }
}

function clearForm() {
  elInputQuestion.value    = "";
  elInputExpectedSql.value = "";
  elInputDifficulty.value  = "";
  elInputHint.value        = "";
  document.querySelectorAll(".field-error").forEach(el => el.style.display = "none");
  document.querySelectorAll(".form-input.error").forEach(el => el.classList.remove("error"));
  hideSaveFeedback();
}

function showSaveFeedback(success, message) {
  elSaveFeedback.textContent = message;
  elSaveFeedback.className = `save-feedback ${success ? "success" : "error"}`;
  elSaveFeedback.style.display = "block";
  // Auto-hide after 4 seconds
  setTimeout(hideSaveFeedback, 4000);
}

function hideSaveFeedback() {
  elSaveFeedback.style.display = "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW ALL CHALLENGES
// ─────────────────────────────────────────────────────────────────────────────
async function loadChallengesList() {
  elChallengesList.innerHTML = '<p class="loading-text">Loading...</p>';

  let challenges;
  try {
    challenges = await api("/challenges");
  } catch (e) {
    elChallengesList.innerHTML = `<p class="loading-text" style="color:var(--red)">Failed to load: ${e.message}</p>`;
    return;
  }

  // Apply difficulty filter
  const filterVal = elFilterDifficulty.value;
  if (filterVal) {
    challenges = challenges.filter(c => c.difficulty === filterVal);
  }

  if (challenges.length === 0) {
    elChallengesList.innerHTML = '<p class="loading-text">No challenges found.</p>';
    return;
  }

  elChallengesList.innerHTML = "";
  challenges.forEach((c, i) => {
    const row = document.createElement("div");
    row.className = "challenge-row";
    row.innerHTML = `
      <span class="challenge-row-num">#${c.id}</span>
      <div class="challenge-row-body">
        <p>${c.question_text}</p>
        <small>
          <span class="diff-badge ${difficultyClass(c.difficulty)}">${c.difficulty}</span>
          ${c.hint ? ` · 💡 ${c.hint}` : ""}
        </small>
      </div>
    `;
    elChallengesList.appendChild(row);
  });
}
