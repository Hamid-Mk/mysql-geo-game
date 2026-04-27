// =============================================================================
// quiz.js  —  SQL Atlas  |  Quiz Page Logic (Gamified)
// =============================================================================

const TOTAL_CHALLENGES = 100;
const HINT_AFTER_ATTEMPTS = 2;

// Gamification State
let currentChallengeId = 1;
let failedAttempts = 0;
let currentChallenge = null;
let xp = 0;
let soundEnabled = true;

// DOM References
const elEditor          = document.getElementById("sql-editor");
const elQuestionText    = document.getElementById("question-text");
const elChallengeNum    = document.getElementById("challenge-number");
const elChallengeCat    = document.getElementById("challenge-category");
const elProgressFill    = document.getElementById("progress-fill");
const elProgressLabel   = document.getElementById("progress-label");
const elDifficultyBadge = document.getElementById("difficulty-badge");
const elHintBox         = document.getElementById("hint-box");
const elHintText        = document.getElementById("hint-text");
const elErrorBox        = document.getElementById("error-box");
const elErrorText       = document.getElementById("error-text");
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
const elModalTitle      = document.getElementById("modal-title-text");
const elModalEmoji      = document.getElementById("modal-emoji");
const elBtnModalNext    = document.getElementById("btn-modal-next");
const elBtnModalClose   = document.getElementById("btn-modal-close");
const elXpTotal         = document.getElementById("xp-total");
const elSoundToggle     = document.getElementById("btn-sound-toggle");

// Audio setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  if (!soundEnabled || !audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  if (type === 'success') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc.start();
    osc.stop(audioContext.currentTime + 0.5);
  } else if (type === 'error') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  currentChallengeId = parseInt(getParam("id")) || 1;
  loadChallenge(currentChallengeId);

  elBtnRun.addEventListener("click", runQuery);
  elBtnClear.addEventListener("click", clearEditor);
  elBtnHint.addEventListener("click", showHint);
  elBtnPrev.addEventListener("click", goPrev);
  elBtnNext.addEventListener("click", goNext);
  elBtnModalNext.addEventListener("click", () => { hideModal(); goNext(); });
  elBtnModalClose.addEventListener("click", hideModal);
  
  elSoundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    elSoundToggle.textContent = soundEnabled ? "🔊" : "🔇";
    if(soundEnabled && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  });

  elEditor.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") runQuery();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPEWRITER EFFECT
// ─────────────────────────────────────────────────────────────────────────────
function typeWriter(element, text, speed = 15) {
  element.innerHTML = '';
  let i = 0;
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD CHALLENGE
// ─────────────────────────────────────────────────────────────────────────────
async function loadChallenge(id) {
  resetFeedback();
  failedAttempts = 0;
  elEditor.value = "";
  elHintBox.style.display = "none";
  elResultsContainer.style.display = "none";

  const pct = Math.round((id / TOTAL_CHALLENGES) * 100);
  elProgressFill.style.width = `${pct}%`;
  elProgressLabel.textContent = `Quest ${id} of ${TOTAL_CHALLENGES}`;
  elChallengeNum.textContent = `Q.${id}`;

  elBtnPrev.disabled = id <= 1;
  elBtnNext.disabled = id >= TOTAL_CHALLENGES;

  elQuestionText.textContent = "Summoning quest...";
  try {
    currentChallenge = await api(`/challenges/${id}`);
  } catch (e) {
    elQuestionText.textContent = "Failed to load quest. Is the magic server running?";
    return;
  }

  typeWriter(elQuestionText, currentChallenge.question_text);
  
  if(elChallengeCat && currentChallenge.category) {
    elChallengeCat.textContent = currentChallenge.category;
  }

  const diff = currentChallenge.difficulty || "easy";
  elDifficultyBadge.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
  elDifficultyBadge.className = `diff-badge ${difficultyClass(diff)}`;

  document.title = `SQL Atlas — Quest ${id}`;
  history.replaceState(null, "", `quiz.html?id=${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN QUERY
// ─────────────────────────────────────────────────────────────────────────────
async function runQuery() {
  const sql = elEditor.value.trim();
  if (!sql) {
    showError("Your scroll is empty. Write a query first.");
    return;
  }

  elBtnRun.disabled = true;
  elBtnRun.innerHTML = "⏳ Casting...";
  resetFeedback();

  let data;
  try {
    data = await api("/execute-query", "POST", { query: sql, challenge_id: currentChallengeId });
  } catch (e) {
    showError(e.message);
    elBtnRun.disabled = false;
    elBtnRun.innerHTML = "⚡ Execute";
    return;
  }

  elBtnRun.disabled = false;
  elBtnRun.innerHTML = "⚡ Execute";

  if (!data.success) {
    triggerShake();
    playSound('error');
    showError(data.error);
    failedAttempts++;
    if (failedAttempts >= HINT_AFTER_ATTEMPTS) showHintBox();
    return;
  }

  renderResults(data.columns, data.rows, data.row_count);

  if (data.is_correct) {
    playSound('success');
    fireConfetti();
    
    // Calculate XP
    let gainedXp = currentChallenge.difficulty === 'hard' ? 200 : (currentChallenge.difficulty === 'medium' ? 150 : 100);
    if(failedAttempts > 0) gainedXp = Math.floor(gainedXp * 0.8);
    xp += gainedXp;
    elXpTotal.textContent = xp.toLocaleString();

    const messages = ["Legendary!", "Flawless Execution!", "Database Master!", "Query Accepted!"];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    
    showModal(msg, `+${gainedXp} XP gained. You returned ${data.row_count} rows.`);
  } else {
    triggerShake();
    playSound('error');
    showError("The spell executed, but the results don't match the prophecy. Try again.");
    failedAttempts++;
    if (failedAttempts >= HINT_AFTER_ATTEMPTS) showHintBox();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GAMIFIED EFFECTS
// ─────────────────────────────────────────────────────────────────────────────
function triggerShake() {
  const container = document.getElementById('editor-container');
  container.classList.remove('shake');
  void container.offsetWidth; // trigger reflow
  container.classList.add('shake');
}

function fireConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 1100 };

  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER RESULTS
// ─────────────────────────────────────────────────────────────────────────────
function renderResults(columns, rows, count) {
  const tr = document.createElement("tr");
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    tr.appendChild(th);
  });
  elResultsThead.innerHTML = "";
  elResultsThead.appendChild(tr);

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

  elResultsCount.textContent = `${count} rows`;
  elResultsContainer.style.display = "block";
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function showError(message) {
  elErrorBox.style.display = "flex";
  elErrorText.textContent = message;
}

function resetFeedback() {
  elErrorBox.style.display = "none";
}

function showHintBox() {
  elBtnHint.classList.add('pulse-glow');
}

function showHint() {
  if (currentChallenge && currentChallenge.hint) {
    elHintBox.style.display = "flex";
    typeWriter(elHintText, currentChallenge.hint);
    elBtnHint.classList.remove('pulse-glow');
  } else {
    elHintBox.style.display = "flex";
    elHintText.textContent = "No hint available for this quest.";
  }
}

function clearEditor() {
  elEditor.value = "";
  elEditor.focus();
}

function showModal(title, subText) {
  elModalTitle.textContent = title;
  elModalSubText.textContent = subText;
  
  const emojis = ["🏆", "🌟", "🔥", "⚡", "💎"];
  elModalEmoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  
  elSuccessModal.style.display = "flex";
}

function hideModal() {
  elSuccessModal.style.display = "none";
}

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
