let student = ensureStudent();
let currentLevel = student.currentLevel || "Beginner";
let allChallenges = [];
let levelChallenges = [];
let currentIndex = 0;
let currentChallenge = null;
let hintUsedForChallenge = false;
let isReviewMode = false;
let consecutiveWrong = 0;
let streakLives = 3;
let sessionHintsUsed = Number(sessionStorage.getItem("atlas_session_hints_used") || "0");
let soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
let audioContext = null;

const MAX_SESSION_HINTS = 5;
const TOTAL_CHALLENGES = 100;
const els = {};

document.addEventListener("DOMContentLoaded", () => {
  [
    "level-chip", "xp-chip", "streak-chip", "mistake-chip", "hint-chip", "side-xp", "side-streak",
    "side-best-streak", "side-hints", "side-mistakes", "player-name", "challenge-category",
    "challenge-number", "question-text", "progress-label", "progress-fill", "sql-editor",
    "btn-hint", "btn-clear", "btn-run", "hint-box",
    "results-thead", "results-tbody", "feedback-drawer", "feedback-icon", "feedback-title", "feedback-text",
    "feedback-action", "feedback-secondary", "streak-lives", "hint-confirm", "hint-confirm-text", "hint-confirm-yes",
    "hint-confirm-no", "streak-modal", "lost-streak", "streak-try-again", "sound-toggle",
    "line-numbers", "char-count", "syntax-preview", "schema-mobile-toggle", "schema-panel",
    "schema-collapse", "schema-restore", "editor-container", "btn-prev", "btn-next",
    "data-viewport", "viewport-row-count", "viewport-continue", "viewport-close"
  ].forEach((id) => els[id] = document.getElementById(id));

  renderStudentHeader();
  bindEvents();
  loadChallengeFromUrl();
});

function bindEvents() {
  els["btn-run"].addEventListener("click", runQuery);
  els["btn-clear"].addEventListener("click", clearEditor);
  els["btn-hint"].addEventListener("click", requestHintConfirmation);
  els["hint-confirm-yes"].addEventListener("click", () => {
    els["hint-confirm"].hidden = true;
    useHint();
  });
  els["hint-confirm-no"].addEventListener("click", () => { els["hint-confirm"].hidden = true; });
  els["feedback-action"].addEventListener("click", () => {
    const shouldAdvance = els["feedback-action"].dataset.next === "true";
    hideDrawers();
    if (shouldAdvance) goNext();
    else els["sql-editor"].focus();
  });
  els["feedback-secondary"].addEventListener("click", () => {
    hideDrawers();
    openDataViewport();
  });
  els["viewport-close"].addEventListener("click", closeDataViewport);
  els["viewport-continue"].addEventListener("click", () => {
    closeDataViewport();
    hideDrawers();
    goNext();
  });
  // Close on backdrop click
  els["data-viewport"].addEventListener("click", (event) => {
    if (event.target.classList.contains("data-viewport-backdrop")) closeDataViewport();
  });
  els["sql-editor"].addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") runQuery();
  });
  els["sql-editor"].addEventListener("input", updateEditorAssist);
  els["streak-try-again"].addEventListener("click", resetAfterStreakBroken);
  els["sound-toggle"].addEventListener("click", toggleSound);
  els["schema-mobile-toggle"].addEventListener("click", () => els["schema-panel"].classList.toggle("open"));
  els["schema-collapse"].addEventListener("click", () => document.body.classList.add("schema-collapsed"));
  els["schema-restore"].addEventListener("click", () => document.body.classList.remove("schema-collapsed"));
  if (els["btn-prev"]) els["btn-prev"].addEventListener("click", goPrev);
  if (els["btn-next"]) els["btn-next"].addEventListener("click", () => { goNext(); });
  updateSoundButton();
  updateEditorAssist();
}

async function loadChallengeFromUrl() {
  try {
    allChallenges = await api("/challenges");
  } catch (err) {
    showFeedback("incorrect", "Server offline", err.message, false);
    return;
  }

  const idParam = Number(getParam("id"));
  if (idParam) {
    const challenge = allChallenges.find((item) => Number(item.id) === idParam);
    currentLevel = challenge ? levelFromChallenge(challenge) : levelForId(idParam);
    levelChallenges = allChallenges.filter((item) => levelFromChallenge(item) === currentLevel);
    const completedIds = getCurrentStudent()?.completedChallenges || student.completedChallengeIds || [];
    const completed = new Set((completedIds || []).map(Number));
    const resumeId = nextLevelChallengeId(currentLevel, completedIds);
    const shouldResume = getParam("review") !== "1" && completed.has(idParam) && resumeId !== idParam;
    const targetId = shouldResume ? resumeId : idParam;
    currentIndex = Math.max(0, levelChallenges.findIndex((item) => Number(item.id) === Number(targetId)));
  } else {
    currentLevel = LEVELS[getParam("level")] ? getParam("level") : currentLevel;
    levelChallenges = allChallenges.filter((item) => levelFromChallenge(item) === currentLevel);
    const completedIds = getCurrentStudent()?.completedChallenges || student.completedChallengeIds || [];
    const resumeId = nextLevelChallengeId(currentLevel, completedIds);
    currentIndex = Math.max(0, levelChallenges.findIndex((item) => Number(item.id) === Number(resumeId)));
  }

  if (!levelChallenges.length) {
    showFeedback("incorrect", "No questions found", `${currentLevel} has no questions in the database yet.`, false);
    return;
  }
  loadChallenge(levelChallenges[currentIndex].id);
}

async function loadChallenge(id) {
  hideDrawers();
  hintUsedForChallenge = false;
  const localIndex = levelChallenges.findIndex((challenge) => Number(challenge.id) === Number(id));
  if (localIndex >= 0) currentIndex = localIndex;
  currentChallenge = levelChallenges[currentIndex];
  if (!currentChallenge || Number(currentChallenge.id) !== Number(id)) {
    currentChallenge = await api(`/challenges/${id}`);
  }

  els["sql-editor"].value = "";
  els["hint-box"].hidden = true;
  els["hint-box"].textContent = "";
  closeDataViewport();
  els["viewport-continue"].hidden = true;
  els["challenge-category"].textContent = currentChallenge.category || currentLevel;
  els["challenge-number"].textContent = `Q.${currentChallenge.id} / 100`;
  typeWriter(els["question-text"], currentChallenge.question_text, 12);
  document.title = `SQL Atlas — Q.${currentChallenge.id}`;
  history.replaceState(null, "", `quiz.html?id=${currentChallenge.id}`);
  updateEditorAssist();
  renderStats();
  updatePrevButton();
}

function typeWriter(element, text, speed = 12) {
  element.innerHTML = "";
  element.classList.add("typing");
  let index = 0;
  function type() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index += 1;
      setTimeout(type, speed);
    } else {
      element.classList.remove("typing");
    }
  }
  type();
}

function renderStats() {
  student = normalizeStudent(student);
  const current = getCurrentStudent();
  const xp = current ? current.xp : student.totalXP;
  const streak = current ? current.streak : student.currentStreak;
  const best = current ? current.longestStreak : student.bestStreakByLevel[currentLevel] || 0;
  const completedIds = current ? current.completedChallenges : student.completedChallengeIds;
  const completedInLevel = levelChallenges.filter((challenge) => completedIds.includes(challenge.id)).length;
  const pct = levelChallenges.length ? Math.round((completedInLevel / levelChallenges.length) * 100) : 0;
  const hintsRemaining = Math.max(0, MAX_SESSION_HINTS - sessionHintsUsed);

  els["level-chip"].textContent = currentLevel;
  els["xp-chip"].textContent = `${xp.toLocaleString()} XP`;
  els["streak-chip"].textContent = `🔥 ${streak}`;
  els["mistake-chip"].textContent = `Mistakes ${consecutiveWrong}/3`;
  els["hint-chip"].textContent = `💡 Hints: ${hintsRemaining}/${MAX_SESSION_HINTS}`;
  els["player-name"].textContent = current ? current.displayName : student.name;
  els["side-xp"].textContent = xp.toLocaleString();
  els["side-streak"].textContent = streak;
  els["side-best-streak"].textContent = best;
  els["side-hints"].textContent = `${hintsRemaining} / ${MAX_SESSION_HINTS}`;
  els["side-mistakes"].textContent = `${consecutiveWrong} / 3`;
  els["progress-label"].textContent = `${completedInLevel} / ${levelChallenges.length} complete`;
  els["progress-fill"].style.width = `${pct}%`;
  els["btn-hint"].disabled = hintsRemaining <= 0 || hintUsedForChallenge;
  els["btn-hint"].textContent = hintsRemaining <= 0 ? "No hints remaining" : "Use Hint";
  renderLives();
  renderStudentHeader();
}

async function runQuery() {
  const query = els["sql-editor"].value.trim();
  if (!query) {
    showFeedback("incorrect", "Terminal empty", "Write a SELECT query before checking your answer.", false);
    return;
  }

  ensureAudio();
  els["btn-run"].disabled = true;
  els["btn-run"].innerHTML = `<span class="loading-dots">Running</span>`;
  els["editor-container"].classList.add("is-running");
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
  else handleWrong(`The query ran, but the result does not match yet. Expected row count is ${data.row_count}.`);
}

function finishRunButton() {
  els["btn-run"].disabled = false;
  els["btn-run"].textContent = "Run Query";
  els["editor-container"].classList.remove("is-running");
}

function handleCorrect(rowCount) {
  const current = getCurrentStudent();
  const numericChallengeId = Number(currentChallenge.id);
  const currentCompleted = (current?.completedChallenges || []).map(Number);
  const legacyCompleted = (student.completedChallengeIds || []).map(Number);
  const alreadyComplete = current
    ? currentCompleted.includes(numericChallengeId)
    : legacyCompleted.includes(numericChallengeId);
  const reward = alreadyComplete ? 0 : Math.max(20, rewardForCurrentQuestion() - (hintUsedForChallenge ? 30 : 0));
  consecutiveWrong = 0;

  if (current) updateStudentXP(reward, numericChallengeId);
  if (!alreadyComplete) student.completedChallengeIds.push(numericChallengeId);
  student.totalXP += reward;
  student.currentStreak += 1;
  student.mistakeStreak = 0;
  student.bestStreakByLevel[currentLevel] = Math.max(student.bestStreakByLevel[currentLevel] || 0, student.currentStreak);
  student.currentChallengeByLevel[currentLevel] = Math.min(currentIndex + 1, levelChallenges.length - 1);
  student = saveStudent(student);
  renderStats();
  playSuccessChime();
  playXPGain();
  fireConfetti();
  floatXP(reward);
  triggerPageFeedback("correct");
  document.querySelector(".question-card")?.classList.add("card-bounce");
  setTimeout(() => document.querySelector(".question-card")?.classList.remove("card-bounce"), 550);
  showCorrectDrawer(reward, currentChallenge.id, currentIndex < levelChallenges.length - 1);
  els["viewport-continue"].hidden = currentIndex >= levelChallenges.length - 1;
  updatePrevButton();
}

function handleWrong(message) {
  consecutiveWrong += 1;
  els["viewport-continue"].hidden = true;
  streakLives = Math.max(0, streakLives - 1);
  studentWrongAnswer();
  renderLives();
  playFailBuzz();
  triggerPageFeedback("wrong");
  els["editor-container"].classList.add("shake");
  setTimeout(() => els["editor-container"].classList.remove("shake"), 500);

  if (consecutiveWrong >= 3) {
    const current = getCurrentStudent();
    const lost = current ? current.streak : student.currentStreak;
    student.currentStreak = 0;
    student.mistakeStreak = 0;
    student = saveStudent(student);
    resetCurrentStudentStreak();
    showStreakBrokenModal(lost);
    return;
  }

  student.mistakeStreak = consecutiveWrong;
  student = saveStudent(student);
  renderStats();
  const hintPrompt = Math.max(0, MAX_SESSION_HINTS - sessionHintsUsed) > 0 ? " You can use a hint if you are stuck." : "";
  showWrongDrawer(`${message}${hintPrompt}`);
}

function requestHintConfirmation() {
  const remaining = Math.max(0, MAX_SESSION_HINTS - sessionHintsUsed);
  if (remaining <= 0 || hintUsedForChallenge) return;
  els["hint-confirm-text"].textContent = `Are you sure? You have ${remaining} hints left.`;
  els["hint-confirm"].hidden = false;
}

function useHint() {
  const remaining = Math.max(0, MAX_SESSION_HINTS - sessionHintsUsed);
  if (remaining <= 0 || hintUsedForChallenge) return;
  sessionHintsUsed += 1;
  sessionStorage.setItem("atlas_session_hints_used", String(sessionHintsUsed));
  incrementCurrentStudentHints();
  hintUsedForChallenge = true;
  els["hint-box"].hidden = false;
  els["hint-box"].textContent = currentChallenge.hint || "Read the question carefully and compare it with the schema guide.";
  renderStats();
  playHintUsed();
  triggerPageFeedback("hint");
  showFeedback("hint", "Hint used", "This question reward will be reduced, but you have a clearer path now.", false);
}

function goPrev() {
  if (currentIndex > 0) {
    currentIndex -= 1;
    isReviewMode = true;
    loadChallenge(levelChallenges[currentIndex].id);
  }
}

function updatePrevButton() {
  if (!els["btn-prev"]) return;
  els["btn-prev"].disabled = currentIndex <= 0;
  // Update Next button
  if (els["btn-next"]) {
    const numericId = Number(currentChallenge?.id);
    const current = getCurrentStudent();
    const completedIds = (current?.completedChallenges || student?.completedChallengeIds || []).map(Number);
    const alreadyDone = completedIds.includes(numericId);
    // Next enabled if: current question is already completed AND not the last question
    els["btn-next"].disabled = !alreadyDone || currentIndex >= levelChallenges.length - 1;
  }
  // Show review badge when in review mode
  const numericId = Number(currentChallenge?.id);
  const current = getCurrentStudent();
  const completedIds = (current?.completedChallenges || student?.completedChallengeIds || []).map(Number);
  const alreadyDone = completedIds.includes(numericId);
  if (alreadyDone && isReviewMode) {
    els["btn-prev"].title = "Reviewing — no XP awarded";
  } else {
    els["btn-prev"].title = "Review previous question";
  }
}

function goNext() {
  isReviewMode = false;
  if (currentIndex < levelChallenges.length - 1) {
    currentIndex += 1;
    loadChallenge(levelChallenges[currentIndex].id);
  } else {
    playLevelUp();
    showFeedback("correct", "LEVEL COMPLETE", `${currentLevel} is complete. Choose another level from the dashboard.`, false);
  }
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
  els["viewport-row-count"].textContent = `${count} rows${count > 100 ? " (showing first 100)" : ""}`;
  openDataViewport();
}

function openDataViewport() {
  els["data-viewport"].hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDataViewport() {
  els["data-viewport"].hidden = true;
  document.body.style.overflow = "";
}

function showFeedback(type, title, text, canContinue) {
  const cleanType = type === "incorrect" ? "wrong" : type;
  els["feedback-drawer"].className = `feedback-drawer visible ${cleanType}`;
  els["feedback-icon"].textContent = cleanType === "correct" ? "✓" : cleanType === "wrong" ? "✗" : "!";
  els["feedback-title"].textContent = title;
  els["feedback-text"].textContent = text;
  els["feedback-action"].textContent = canContinue ? "CONTINUE →" : "TRY AGAIN";
  els["feedback-action"].dataset.next = canContinue ? "true" : "false";
  els["feedback-secondary"].hidden = !canContinue;
  els["feedback-secondary"].textContent = "VIEW RESULT";
}

function hideFeedback() {
  hideDrawers();
}

function showCorrectDrawer(xpGained, challengeNum, canContinue = true) {
  showFeedback("correct", "CORRECT!", `+${xpGained} XP · Quest ${challengeNum} of ${TOTAL_CHALLENGES}`, canContinue);
}

function showWrongDrawer(message = "") {
  const livesRemaining = Math.max(0, streakLives);
  const livesText = livesRemaining === 1 ? "1 shield remaining." : `${livesRemaining} shields remaining.`;
  showFeedback("wrong", "NOT QUITE", `Check your query and try again. ${livesText}${message ? ` ${message}` : ""}`, false);
}

function hideDrawers() {
  document.querySelectorAll(".feedback-drawer").forEach((drawer) => drawer.classList.remove("visible"));
}

function showModal(title, subText) {
  showFeedback("correct", title, subText, true);
}

function hideModal() {
  hideFeedback();
}

function renderLives() {
  const lives = els["streak-lives"]?.querySelectorAll(".life") || [];
  lives.forEach((life, index) => {
    const active = index < streakLives;
    life.classList.toggle("active", active);
    life.classList.toggle("lost", !active);
  });
}

function showStreakBrokenModal(lostStreak) {
  playStreakBroken();
  els["lost-streak"].textContent = `Lost streak: ${lostStreak}`;
  els["streak-modal"].hidden = false;
}

function resetAfterStreakBroken() {
  consecutiveWrong = 0;
  streakLives = 3;
  els["streak-modal"].hidden = true;
  renderStats();
}

function rewardForCurrentQuestion() {
  const id = Number(currentChallenge.id);
  if (id >= 73) return 200;
  if (id >= 29) return 150;
  return 100;
}

function levelForId(id) {
  if (id >= 73) return "Advanced";
  if (id >= 29) return "Intermediate";
  return "Beginner";
}

function clearEditor() {
  els["sql-editor"].value = "";
  updateEditorAssist();
  els["sql-editor"].focus();
}

function updateEditorAssist() {
  const value = els["sql-editor"].value || "";
  const lines = Math.max(1, value.split("\n").length);
  els["line-numbers"].textContent = Array.from({ length: lines }, (_, index) => index + 1).join("\n");
  els["char-count"].textContent = `${value.length} characters`;
  const keywords = value
    .replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]))
    .replace(/\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|GROUP BY|ORDER BY|HAVING|LIMIT|COUNT|SUM|AVG|MIN|MAX|DISTINCT)\b/gi, "<mark>$1</mark>");
  els["syntax-preview"].innerHTML = keywords || "Keywords light up as you type.";
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? "on" : "off");
  updateSoundButton();
}

function updateSoundButton() {
  els["sound-toggle"].textContent = soundEnabled ? "Sound On" : "Sound Off";
}

function ensureAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
}

function playTone(frequency, duration, type = "sine", start = 0, volume = 0.08) {
  if (!soundEnabled) return;
  ensureAudio();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioContext.currentTime + start);
  gain.gain.setValueAtTime(volume, audioContext.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(audioContext.currentTime + start);
  osc.stop(audioContext.currentTime + start + duration);
}

function playSuccessChime() {
  [523.25, 659.25, 783.99].forEach((note, index) => playTone(note, 0.28, "sine", index * 0.08, 0.07));
}

function playFailBuzz() {
  if (!soundEnabled) return;
  ensureAudio();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(150, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.28);
  gain.gain.setValueAtTime(0.08, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.28);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + 0.28);
}

function playStreakBroken() {
  [110, 82, 55].forEach((note, index) => playTone(note, 0.45, "sawtooth", index * 0.12, 0.06));
}

function playLevelUp() {
  [392, 523.25, 659.25, 783.99, 1046.5].forEach((note, index) => playTone(note, 0.2, "triangle", index * 0.07, 0.06));
}

function playHintUsed() {
  playTone(740, 0.22, "sine", 0, 0.05);
}

function playXPGain() {
  [880, 988, 1175].forEach((note, index) => playTone(note, 0.12, "sine", index * 0.04, 0.04));
}

function fireConfetti() {
  if (!window.confetti) return;
  window.confetti({ particleCount: 90, spread: 75, origin: { y: 0.72 } });
}

function floatXP(amount) {
  if (!amount) return;
  const label = document.createElement("div");
  label.className = "floating-xp";
  label.textContent = `+${amount} XP`;
  const rect = els["btn-run"].getBoundingClientRect();
  label.style.left = `${rect.left + rect.width / 2}px`;
  label.style.top = `${rect.top}px`;
  document.body.appendChild(label);
  label.addEventListener("animationend", () => label.remove(), { once: true });
}
