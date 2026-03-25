// =============================================================================
// quiz.js  —  SQL Atlas  |  Quiz Page Logic
// =============================================================================
// PURPOSE:
//   Controls everything on quiz.html:
//   - Loads a challenge from the API based on ?id= URL param
//   - Sends the student's SQL to the backend on Run Query
//   - Renders results in a table
//   - Shows correct/incorrect feedback
//   - Handles navigation between challenges
//   - Shows hint after 2 failed attempts
//
// DEPENDS ON:  app.js  (must be loaded first in quiz.html)
// =============================================================================

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_CHALLENGES = 20;   // TODO: fetch this dynamically from GET /api/challenges
const HINT_AFTER_ATTEMPTS = 2;

// ─── State ────────────────────────────────────────────────────────────────────
let currentChallengeId = 1;
let failedAttempts = 0;
let currentChallenge = null;

// ─── DOM References ───────────────────────────────────────────────────────────
const elEditor          = document.getElementById("sql-editor");
const elQuestionText    = document.getElementById("question-text");
const elChallengeNum    = document.getElementById("challenge-number");
const elProgressFill    = document.getElementById("progress-fill");
const elProgressLabel   = document.getElementById("progress-label");
const elDifficultyBadge = document.getElementById("difficulty-badge");
const elHintBox         = document.getElementById("hint-box");
const elHintText        = document.getElementById("hint-text");
const elErrorBox        = document.getElementById("error-box");
const elErrorText       = document.getElementById("error-text");
const elFeedbackBanner  = document.getElementById("feedback-banner");
const elFeedbackIcon    = document.getElementById("feedback-icon");
const elFeedbackText    = document.getElementById("feedback-text");
const elResultsContainer= document.getElementById("results-container");
const elResultsThead    = document.getElementById("results-thead");
const elResultsTbody    = document.getElementById("results-tbody");
const elResultsCount    = document.getElementById("results-count");
const elBtnRun          = document.getElementById("btn-run");
const elBtnClear        = document.getElementById("btn-clear");
const elBtnHint         = document.getElementById("btn-hint");
const elBtnPrev         = document.getElementById("btn-prev");
const elBtnNext         = document.getElementById("btn-next");
const elSuccessModal    = document.getElementById("success-modal");
const elModalSubText    = document.getElementById("modal-sub-text");
const elBtnModalNext    = document.getElementById("btn-modal-next");
const elBtnModalClose   = document.getElementById("btn-modal-close");

// ─────────────────────────────────────────────────────────────────────────────
// INIT — runs when page loads
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Read challenge ID from URL: quiz.html?id=3
  currentChallengeId = parseInt(getParam("id")) || 1;
  loadChallenge(currentChallengeId);

  // Wire up buttons
  elBtnRun.addEventListener("click", runQuery);
  elBtnClear.addEventListener("click", clearEditor);
  elBtnHint.addEventListener("click", showHint);
  elBtnPrev.addEventListener("click", goPrev);
  elBtnNext.addEventListener("click", goNext);
  elBtnModalNext.addEventListener("click", () => { hideModal(); goNext(); });
  elBtnModalClose.addEventListener("click", hideModal);

  // Allow Ctrl+Enter to run the query (power-user shortcut)
  elEditor.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") runQuery();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOAD CHALLENGE
// ─────────────────────────────────────────────────────────────────────────────
async function loadChallenge(id) {
  // Reset UI state for the new challenge
  resetFeedback();
  failedAttempts = 0;
  elEditor.value = "";
  elHintBox.style.display = "none";

  // Update progress bar
  const pct = Math.round((id / TOTAL_CHALLENGES) * 100);
  elProgressFill.style.width = `${pct}%`;
  elProgressLabel.textContent = `Challenge ${id} of ${TOTAL_CHALLENGES}`;
  elChallengeNum.textContent = `Challenge #${id}`;

  // Update prev/next button states
  elBtnPrev.disabled = id <= 1;
  elBtnNext.disabled = id >= TOTAL_CHALLENGES;

  // Fetch challenge from API
  elQuestionText.textContent = "Loading...";
  try {
    currentChallenge = await api(`/challenges/${id}`);
  } catch (e) {
    elQuestionText.textContent = "Failed to load challenge. Is the server running?";
    return;
  }

  // Render challenge
  elQuestionText.textContent = currentChallenge.question_text;
  elHintText.textContent = currentChallenge.hint || "";

  // Update difficulty badge
  const diff = currentChallenge.difficulty || "easy";
  elDifficultyBadge.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
  elDifficultyBadge.className = `diff-badge ${difficultyClass(diff)}`;

  // Update page title and URL without reload
  document.title = `SQL Atlas — Challenge ${id}`;
  history.replaceState(null, "", `quiz.html?id=${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN QUERY
// ─────────────────────────────────────────────────────────────────────────────
async function runQuery() {
  const sql = elEditor.value.trim();
  if (!sql) {
    showError("Please type a SQL query first.");
    return;
  }

  // Show loading state on button
  elBtnRun.disabled = true;
  elBtnRun.textContent = "Running...";
  resetFeedback();

  let data;
  try {
    data = await api("/execute-query", "POST", {
      query: sql,
      challenge_id: currentChallengeId,
    });
  } catch (e) {
    showError(e.message);
    elBtnRun.disabled = false;
    elBtnRun.textContent = "▶ Run Query";
    return;
  }

  elBtnRun.disabled = false;
  elBtnRun.textContent = "▶ Run Query";

  if (!data.success) {
    // SQL error (syntax error, blocked keyword, etc.)
    showError(data.error);
    failedAttempts++;
    if (failedAttempts >= HINT_AFTER_ATTEMPTS) showHint();
    return;
  }

  // Render results table
  renderResults(data.columns, data.rows, data.row_count);

  // Show correct/incorrect feedback
  if (data.is_correct) {
    showFeedback(true);
    showModal(`You returned ${data.row_count} row${data.row_count !== 1 ? "s" : ""} — exactly right!`);
  } else {
    showFeedback(false);
    failedAttempts++;
    if (failedAttempts >= HINT_AFTER_ATTEMPTS) showHint();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER RESULTS TABLE
// ─────────────────────────────────────────────────────────────────────────────
function renderResults(columns, rows, count) {
  // Build header row
  const tr = document.createElement("tr");
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    tr.appendChild(th);
  });
  elResultsThead.innerHTML = "";
  elResultsThead.appendChild(tr);

  // Build data rows
  elResultsTbody.innerHTML = "";
  rows.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell ?? "NULL";
      tr.appendChild(td);
    });
    elResultsTbody.appendChild(tr);
  });

  // Row count label
  elResultsCount.textContent = `${count} row${count !== 1 ? "s" : ""}`;

  // Show the table
  elResultsContainer.style.display = "block";
}

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function showFeedback(isCorrect) {
  elFeedbackBanner.style.display = "flex";
  elFeedbackBanner.className = `feedback-banner ${isCorrect ? "feedback-correct" : "feedback-wrong"}`;
  elFeedbackIcon.textContent = isCorrect ? "🎉" : "❌";
  elFeedbackText.textContent = isCorrect
    ? "Correct! Great query!"
    : "Not quite right. Check your query and try again.";
}

function showError(message) {
  elErrorBox.style.display = "flex";
  elErrorText.textContent = message;
}

function resetFeedback() {
  elFeedbackBanner.style.display = "none";
  elErrorBox.style.display = "none";
}

function showHint() {
  if (currentChallenge && currentChallenge.hint) {
    elHintText.textContent = currentChallenge.hint;
    elHintBox.style.display = "flex";
  }
}

function clearEditor() {
  elEditor.value = "";
  elEditor.focus();
}

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function showModal(subText) {
  elModalSubText.textContent = subText;
  elSuccessModal.style.display = "flex";
}

function hideModal() {
  elSuccessModal.style.display = "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
function goPrev() {
  if (currentChallengeId > 1) {
    currentChallengeId--;
    loadChallenge(currentChallengeId);
  }
}

function goNext() {
  if (currentChallengeId < TOTAL_CHALLENGES) {
    currentChallengeId++;
    loadChallenge(currentChallengeId);
  }
}
