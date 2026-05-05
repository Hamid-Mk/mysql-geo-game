const el = {};
let cachedChallenges = [];

document.addEventListener("DOMContentLoaded", () => {
  [
    "login-section", "dashboard-section", "password-input", "btn-login", "btn-logout", "login-error",
    "btn-save-challenge", "btn-clear-form", "input-question", "input-expected-sql", "input-category",
    "input-difficulty", "input-level", "input-hint", "save-feedback", "btn-refresh-challenges",
    "filter-difficulty", "filter-level", "filter-category", "challenges-list"
  ].forEach((id) => el[id] = document.getElementById(id));

  if (getAdminToken()) showDashboard();
  el["btn-login"].addEventListener("click", handleLogin);
  el["password-input"].addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleLogin();
  });
  el["btn-logout"].addEventListener("click", handleLogout);
  el["btn-save-challenge"].addEventListener("click", handleSaveChallenge);
  el["btn-clear-form"].addEventListener("click", clearForm);
  el["btn-refresh-challenges"].addEventListener("click", loadChallengesList);
  el["filter-difficulty"].addEventListener("change", renderChallengeList);
  el["filter-level"].addEventListener("change", renderChallengeList);
  el["filter-category"].addEventListener("change", renderChallengeList);
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });
});

async function handleLogin() {
  const password = el["password-input"].value.trim();
  if (!password) return showLoginError("Please enter the teacher password.");
  el["btn-login"].disabled = true;
  el["btn-login"].textContent = "Checking...";
  el["login-error"].hidden = true;
  try {
    const data = await api("/admin/login", "POST", { password });
    setAdminToken(data.token);
    showDashboard();
  } catch (err) {
    showLoginError(err.message);
  } finally {
    el["btn-login"].disabled = false;
    el["btn-login"].textContent = "Access Portal";
  }
}

function showLoginError(message) {
  el["login-error"].textContent = message;
  el["login-error"].hidden = false;
}

function handleLogout() {
  clearAdminToken();
  el["dashboard-section"].hidden = true;
  el["login-section"].hidden = false;
}

function showDashboard() {
  el["login-section"].hidden = true;
  el["dashboard-section"].hidden = false;
  loadChallengesList();
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.hidden = panel.id !== `tab-${tabId}`);
  if (tabId === "view-challenges") loadChallengesList();
}

async function handleSaveChallenge() {
  const payload = {
    question_text: el["input-question"].value.trim(),
    expected_query: el["input-expected-sql"].value.trim(),
    category: el["input-category"].value,
    difficulty: el["input-difficulty"].value,
    level: el["input-level"].value,
    hint: el["input-hint"].value.trim(),
  };
  if (!payload.question_text || !payload.expected_query || !payload.category || !payload.difficulty || !payload.level) {
    return showSaveFeedback("Please fill in level, category, difficulty, question, and SQL.", false);
  }
  el["btn-save-challenge"].disabled = true;
  el["btn-save-challenge"].textContent = "Saving...";
  try {
    await api("/admin/add-challenge", "POST", payload, { "X-Admin-Token": getAdminToken() });
    showSaveFeedback("Quest saved.", true);
    clearForm();
    loadChallengesList();
  } catch (err) {
    showSaveFeedback(err.message, false);
  } finally {
    el["btn-save-challenge"].disabled = false;
    el["btn-save-challenge"].textContent = "Save Quest";
  }
}

function clearForm() {
  el["input-question"].value = "";
  el["input-expected-sql"].value = "";
  el["input-hint"].value = "";
  el["input-level"].value = "Beginner";
  el["input-difficulty"].value = "easy";
}

function showSaveFeedback(message, success) {
  el["save-feedback"].textContent = message;
  el["save-feedback"].className = `form-message ${success ? "success" : "error"}`;
  el["save-feedback"].hidden = false;
}

async function loadChallengesList() {
  el["challenges-list"].innerHTML = `<p class="muted">Loading quests...</p>`;
  try {
    cachedChallenges = await api("/challenges");
  } catch (err) {
    el["challenges-list"].innerHTML = `<p class="field-error">${err.message}</p>`;
    return;
  }
  populateCategoryFilter();
  renderChallengeList();
}

function populateCategoryFilter() {
  const categories = [...new Set(cachedChallenges.map((challenge) => challenge.category).filter(Boolean))].sort();
  const current = el["filter-category"].value;
  el["filter-category"].innerHTML = `<option value="">All Categories</option>`;
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    el["filter-category"].appendChild(option);
  });
  el["filter-category"].value = current;
}

function renderChallengeList() {
  const level = el["filter-level"].value;
  const category = el["filter-category"].value;
  const difficulty = el["filter-difficulty"].value;
  const rows = cachedChallenges.filter((challenge) => {
    const challengeLevel = levelFromChallenge(challenge);
    return (!level || challengeLevel === level)
      && (!category || challenge.category === category)
      && (!difficulty || challenge.difficulty === difficulty);
  });

  if (!rows.length) {
    el["challenges-list"].innerHTML = `<p class="muted">No quests match those filters.</p>`;
    return;
  }

  el["challenges-list"].innerHTML = "";
  rows.forEach((challenge) => {
    const row = document.createElement("article");
    row.className = `mission-row ${difficultyClass(challenge.difficulty)}`;
    row.innerHTML = `
      <span class="mission-id">#${challenge.id}</span>
      <div>
        <strong>${escapeHtml(challenge.question_text)}</strong>
        <p>
          <span>${levelFromChallenge(challenge)}</span>
          <span>${escapeHtml(challenge.category || "")}</span>
          <span class="diff ${difficultyClass(challenge.difficulty)}">${escapeHtml(challenge.difficulty || "")}</span>
        </p>
        ${challenge.hint ? `<small>Hint: ${escapeHtml(challenge.hint)}</small>` : ""}
      </div>
    `;
    el["challenges-list"].appendChild(row);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
