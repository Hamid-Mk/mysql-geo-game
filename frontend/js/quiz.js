let student = ensureStudent();
let currentLevel = LEVELS[getParam("level")] ? getParam("level") : student.currentLevel || "Beginner";
let allChallenges = [];
let levelChallenges = [];
let currentIndex = 0;
let currentChallenge = null;
let hintUsedForChallenge = false;

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  [
    "level-chip", "xp-chip", "streak-chip", "mistake-chip", "hint-chip", "side-xp", "side-streak",
    "side-best-streak", "side-hints", "side-mistakes", "player-name", "challenge-category",
    "challenge-number", "question-text", "progress-label", "progress-fill", "sql-editor",
    "btn-hint", "btn-clear", "btn-run", "hint-box", "results-container", "results-count",
    "results-thead", "results-tbody", "feedback-drawer", "feedback-title", "feedback-text",
    "feedback-action"
  ].forEach((id) => els[id] = document.getElementById(id));

  renderStudentHeader();
  bindEvents();
  bootPractice();
});

function bindEvents() {
  els["btn-run"].addEventListener("click", runQuery);
  els["btn-clear"].addEventListener("click", () => {
    els["sql-editor"].value = "";
    els["sql-editor"].focus();
  });
  els["btn-hint"].addEventListener("click", useHint);
  els["feedback-action"].addEventListener("click", () => {
    hideFeedback();
    if (els["feedback-action"].dataset.next === "true") goNext();
  });
  els["sql-editor"].addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") runQuery();
  });
}

async function bootPractice() {
  student.currentLevel = currentLevel;
  student.hintsByLevel[currentLevel] ??= LEVELS[currentLevel].hints;
  student = saveStudent(student);
  try {
    allChallenges = await api("/challenges");
  } catch (err) {
    showFeedback("incorrect", "Server offline", err.message, false);
    return;
  }
  levelChallenges = allChallenges.filter((challenge) => levelFromChallenge(challenge) === currentLevel);
  if (!levelChallenges.length) {
    showFeedback("incorrect", "No questions found", `${currentLevel} has no questions in the database yet.`, false);
    return;
  }
  currentIndex = Math.min(student.currentChallengeByLevel[currentLevel] || 0, levelChallenges.length - 1);
  loadCurrentChallenge();
}

function loadCurrentChallenge() {
  hideFeedback();
  hintUsedForChallenge = false;
  currentChallenge = levelChallenges[currentIndex];
  els["sql-editor"].value = "";
  els["hint-box"].hidden = true;
  els["hint-box"].textContent = "";
  els["results-container"].hidden = true;
  els["challenge-category"].textContent = currentChallenge.category || currentLevel;
  els["challenge-number"].textContent = `Question ${currentIndex + 1} / ${levelChallenges.length}`;
  els["question-text"].textContent = currentChallenge.question_text;
  document.title = `SQL Atlas — ${currentLevel} ${currentIndex + 1}`;
  history.replaceState(null, "", `quiz.html?level=${encodeURIComponent(currentLevel)}`);
  renderStats();
}

function renderStats() {
  student = normalizeStudent(student);
  const completedInLevel = levelChallenges.filter((challenge) => student.completedChallengeIds.includes(challenge.id)).length;
  const pct = levelChallenges.length ? Math.round((completedInLevel / levelChallenges.length) * 100) : 0;
  els["level-chip"].textContent = currentLevel;
  els["xp-chip"].textContent = `${student.totalXP.toLocaleString()} XP`;
  els["streak-chip"].textContent = `Streak ${student.currentStreak}`;
  els["mistake-chip"].textContent = `Mistakes ${student.mistakeStreak}/3`;
  els["hint-chip"].textContent = `Hints ${student.hintsByLevel[currentLevel]}`;
  els["player-name"].textContent = student.name;
  els["side-xp"].textContent = student.totalXP.toLocaleString();
  els["side-streak"].textContent = student.currentStreak;
  els["side-best-streak"].textContent = student.bestStreakByLevel[currentLevel] || 0;
  els["side-hints"].textContent = student.hintsByLevel[currentLevel];
  els["side-mistakes"].textContent = `${student.mistakeStreak} / 3`;
  els["progress-label"].textContent = `${completedInLevel} / ${levelChallenges.length} complete`;
  els["progress-fill"].style.width = `${pct}%`;
  els["btn-hint"].disabled = student.hintsByLevel[currentLevel] <= 0 || hintUsedForChallenge;
}

async function runQuery() {
  const query = els["sql-editor"].value.trim();
  if (!query) {
    showFeedback("incorrect", "Terminal empty", "Write a SELECT query before checking your answer.", false);
    return;
  }

  els["btn-run"].disabled = true;
  els["btn-run"].textContent = "Running...";
  let data;
  try {
    data = await api("/execute-query", "POST", { query, challenge_id: currentChallenge.id });
  } catch (err) {
    handleWrong(err.message);
    finishRunButton();
    return;
  }
  finishRunButton();

  if (!data.success) {
    handleWrong(data.error || "The database rejected that query.");
    return;
  }

  renderResults(data.columns, data.rows, data.row_count);
  if (data.is_correct) handleCorrect(data.row_count);
  else handleWrong("The query ran, but the result does not match this question yet.");
}

function finishRunButton() {
  els["btn-run"].disabled = false;
  els["btn-run"].textContent = "Run Query";
}

function handleCorrect(rowCount) {
  const alreadyComplete = student.completedChallengeIds.includes(currentChallenge.id);
  const baseReward = LEVELS[currentLevel].reward;
  const reward = alreadyComplete ? 0 : Math.max(20, baseReward - (hintUsedForChallenge ? 30 : 0));
  if (!alreadyComplete) student.completedChallengeIds.push(currentChallenge.id);
  student.totalXP += reward;
  student.currentStreak += 1;
  student.mistakeStreak = 0;
  student.bestStreakByLevel[currentLevel] = Math.max(student.bestStreakByLevel[currentLevel] || 0, student.currentStreak);
  student.currentChallengeByLevel[currentLevel] = Math.min(currentIndex + 1, levelChallenges.length - 1);
  student = saveStudent(student);
  renderStats();
  const text = reward > 0
    ? `Correct. You returned ${rowCount} rows and earned ${reward} XP.`
    : `Correct. You already completed this one, so no extra XP was awarded.`;
  triggerPageFeedback("correct");
  showFeedback("correct", "Query accepted", text, currentIndex < levelChallenges.length - 1);
}

function handleWrong(message) {
  student.mistakeStreak += 1;
  if (student.mistakeStreak >= 3) {
    student.currentStreak = 0;
    student.mistakeStreak = 0;
    currentIndex = firstUnfinishedIndex();
    student.currentChallengeByLevel[currentLevel] = currentIndex;
    student.hintsByLevel[currentLevel] = LEVELS[currentLevel].hints;
    student = saveStudent(student);
    renderStats();
    triggerPageFeedback("wrong");
    showFeedback("incorrect", "Streak reset", "Three mistakes in a row reset your streak. This level has restarted with fresh hints.", false);
    setTimeout(loadCurrentChallenge, 1400);
    return;
  }
  student = saveStudent(student);
  renderStats();
  triggerPageFeedback("wrong");
  showFeedback("incorrect", "Not yet", message, false);
}

function useHint() {
  if (student.hintsByLevel[currentLevel] <= 0 || hintUsedForChallenge) return;
  student.hintsByLevel[currentLevel] -= 1;
  hintUsedForChallenge = true;
  student = saveStudent(student);
  els["hint-box"].hidden = false;
  els["hint-box"].textContent = currentChallenge.hint || "Read the question carefully and compare it with the schema guide.";
  renderStats();
  triggerPageFeedback("hint");
  showFeedback("hint", "Hint used", "This question reward will be reduced, but you have a clearer path now.", false);
}

function goNext() {
  if (currentIndex < levelChallenges.length - 1) {
    currentIndex += 1;
    student.currentChallengeByLevel[currentLevel] = currentIndex;
    student = saveStudent(student);
    loadCurrentChallenge();
  } else {
    showFeedback("correct", "Level complete", `${currentLevel} is complete. Choose another level from the dashboard.`, false);
  }
}

function firstUnfinishedIndex() {
  const index = levelChallenges.findIndex((challenge) => !student.completedChallengeIds.includes(challenge.id));
  return index === -1 ? 0 : index;
}

function renderResults(columns = [], rows = [], count = 0) {
  const headRow = document.createElement("tr");
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column;
    headRow.appendChild(th);
  });
  els["results-thead"].innerHTML = "";
  els["results-thead"].appendChild(headRow);
  els["results-tbody"].innerHTML = "";
  rows.slice(0, 100).forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell ?? "NULL";
      tr.appendChild(td);
    });
    els["results-tbody"].appendChild(tr);
  });
  els["results-count"].textContent = `${count} rows${count > 100 ? " shown as first 100" : ""}`;
  els["results-container"].hidden = false;
}

function showFeedback(type, title, text, canContinue) {
  els["feedback-drawer"].className = `feedback-drawer is-visible ${type}`;
  els["feedback-title"].textContent = title;
  els["feedback-text"].textContent = text;
  els["feedback-action"].textContent = canContinue ? "Next Question" : "Continue";
  els["feedback-action"].dataset.next = canContinue ? "true" : "false";
}

function hideFeedback() {
  els["feedback-drawer"].classList.remove("is-visible");
}
