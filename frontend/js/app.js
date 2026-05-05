const API_BASE_URL = "http://localhost:8000/api";
const STUDENT_STORAGE_KEY = "sql_atlas_student";
const THEME_STORAGE_KEY = "theme";
const SOUND_STORAGE_KEY = "atlas_sound";

const LEVELS = {
  Beginner: { total: 28, hints: 5, reward: 100, startId: 1, requiredXP: 0 },
  Intermediate: { total: 44, hints: 5, reward: 150, startId: 29, requiredXP: 500 },
  Advanced: { total: 28, hints: 5, reward: 200, startId: 73, requiredXP: 2000 },
};

async function api(path, method = "GET", body = null, extraHeaders = {}) {
  const options = {
    method,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  };
  if (body) options.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (_err) {
    throw new Error("Cannot reach the SQL Atlas server.");
  }

  const json = await response.json();
  if (!response.ok) throw new Error(json.detail || json.error || `Server error ${response.status}`);
  return json;
}

function getStudents() {
  return JSON.parse(localStorage.getItem("atlas_students") || "{}");
}

function saveStudents(data) {
  localStorage.setItem("atlas_students", JSON.stringify(data));
}

function getCurrentStudent() {
  const username = localStorage.getItem("atlas_current_student");
  if (!username) return null;
  return getStudents()[username] || null;
}

function studentLogin(username, password) {
  const cleanUsername = normalizeUsername(username);
  const students = getStudents();
  if (!students[cleanUsername]) return { ok: false, error: "Username not found." };
  if (students[cleanUsername].password !== password) return { ok: false, error: "Wrong password." };
  localStorage.setItem("atlas_current_student", cleanUsername);
  students[cleanUsername].lastLogin = todayString();
  saveStudents(students);
  return { ok: true, student: students[cleanUsername] };
}

function studentRegister(username, displayName, password) {
  const cleanUsername = normalizeUsername(username);
  const cleanDisplayName = String(displayName || cleanUsername).trim() || cleanUsername;
  const students = getStudents();
  if (!cleanUsername) return { ok: false, error: "Choose a username." };
  if (!password) return { ok: false, error: "Choose a password." };
  if (students[cleanUsername]) return { ok: false, error: "Username already taken." };
  students[cleanUsername] = {
    username: cleanUsername,
    displayName: cleanDisplayName,
    password,
    xp: 0,
    level: "Beginner",
    streak: 0,
    longestStreak: 0,
    completedChallenges: [],
    hintsUsed: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    lastLogin: todayString(),
  };
  saveStudents(students);
  localStorage.setItem("atlas_current_student", cleanUsername);
  return { ok: true, student: students[cleanUsername] };
}

function studentLogout() {
  localStorage.removeItem("atlas_current_student");
  renderStudentHeader();
}

function updateStudentXP(xpGained, challengeId) {
  const username = localStorage.getItem("atlas_current_student");
  if (!username) return;
  const students = getStudents();
  const student = students[username];
  if (!student) return;
  student.xp += xpGained;
  student.totalCorrect += 1;
  student.totalAttempts += 1;
  if (!student.completedChallenges.includes(challengeId)) student.completedChallenges.push(challengeId);
  student.streak += 1;
  if (student.streak > student.longestStreak) student.longestStreak = student.streak;
  if (student.xp >= 5000) student.level = "Advanced";
  else if (student.xp >= 1500) student.level = "Intermediate";
  else student.level = "Beginner";
  saveStudents(students);
  syncLegacyStudent(student);
  renderStudentHeader();
}

function studentWrongAnswer() {
  const username = localStorage.getItem("atlas_current_student");
  if (!username) return;
  const students = getStudents();
  if (!students[username]) return;
  students[username].totalAttempts += 1;
  saveStudents(students);
}

function resetCurrentStudentStreak() {
  const username = localStorage.getItem("atlas_current_student");
  if (!username) return;
  const students = getStudents();
  if (!students[username]) return;
  students[username].streak = 0;
  saveStudents(students);
  syncLegacyStudent(students[username]);
  renderStudentHeader();
}

function incrementCurrentStudentHints() {
  const username = localStorage.getItem("atlas_current_student");
  if (!username) return;
  const students = getStudents();
  if (!students[username]) return;
  students[username].hintsUsed += 1;
  saveStudents(students);
}

function defaultStudent(name = "Guest explorer") {
  return {
    name,
    totalXP: 0,
    completedChallengeIds: [],
    currentLevel: "Beginner",
    currentChallengeByLevel: { Beginner: 0, Intermediate: 0, Advanced: 0 },
    bestStreakByLevel: { Beginner: 0, Intermediate: 0, Advanced: 0 },
    currentStreak: 0,
    hintsByLevel: { Beginner: 5, Intermediate: 5, Advanced: 5 },
    mistakeStreak: 0,
    lastPlayedDate: new Date().toISOString(),
  };
}

function normalizeStudent(student) {
  const current = getCurrentStudent();
  if (current) {
    return {
      ...defaultStudent(current.displayName),
      name: current.displayName,
      totalXP: current.xp,
      completedChallengeIds: current.completedChallenges,
      currentLevel: current.level,
      bestStreakByLevel: { Beginner: current.longestStreak, Intermediate: current.longestStreak, Advanced: current.longestStreak },
      currentStreak: current.streak,
      hintsByLevel: { Beginner: Math.max(0, 5 - current.hintsUsed), Intermediate: Math.max(0, 5 - current.hintsUsed), Advanced: Math.max(0, 5 - current.hintsUsed) },
      mistakeStreak: 0,
      lastPlayedDate: current.lastLogin,
    };
  }
  const base = defaultStudent(student?.name || "Guest explorer");
  const merged = { ...base, ...student };
  merged.currentChallengeByLevel = { ...base.currentChallengeByLevel, ...(student?.currentChallengeByLevel || {}) };
  merged.bestStreakByLevel = { ...base.bestStreakByLevel, ...(student?.bestStreakByLevel || {}) };
  merged.hintsByLevel = { ...base.hintsByLevel, ...(student?.hintsByLevel || {}) };
  merged.completedChallengeIds = Array.isArray(student?.completedChallengeIds) ? student.completedChallengeIds : [];
  return merged;
}

function getStudent() {
  const current = getCurrentStudent();
  if (current) return normalizeStudent();
  const raw = localStorage.getItem(STUDENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeStudent(JSON.parse(raw));
  } catch (_err) {
    return null;
  }
}

function saveStudent(student) {
  const normalized = normalizeStudent(student);
  normalized.lastPlayedDate = new Date().toISOString();
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function ensureStudent() {
  return getStudent() || saveStudent(defaultStudent());
}

function loginStudent(name) {
  const cleanName = String(name || "").trim().slice(0, 32) || "Student";
  const legacy = saveStudent({ ...defaultStudent(cleanName), name: cleanName });
  return legacy;
}

function logoutStudent() {
  studentLogout();
}

function syncLegacyStudent(student) {
  saveStudent({
    ...defaultStudent(student.displayName),
    name: student.displayName,
    totalXP: student.xp,
    completedChallengeIds: student.completedChallenges,
    currentLevel: student.level,
    currentStreak: student.streak,
    bestStreakByLevel: { Beginner: student.longestStreak, Intermediate: student.longestStreak, Advanced: student.longestStreak },
  });
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function getAdminToken() { return sessionStorage.getItem("admin_token"); }
function setAdminToken(token) { sessionStorage.setItem("admin_token", token); }
function clearAdminToken() { sessionStorage.removeItem("admin_token"); }

function difficultyClass(difficulty) {
  return { easy: "easy", medium: "medium", hard: "hard" }[difficulty] || "easy";
}

function levelFromChallenge(challenge) {
  if (challenge.level) return challenge.level;
  const id = Number(challenge.id || 0);
  if (id <= 28) return "Beginner";
  if (id <= 72) return "Intermediate";
  return "Advanced";
}

function applyTheme(theme = localStorage.getItem(THEME_STORAGE_KEY) || "dark") {
  const cleanTheme = theme === "light" ? "light" : "dark";
  document.body.classList.toggle("light-mode", cleanTheme === "light");
  document.body.classList.toggle("dark-mode", cleanTheme === "dark");
  document.documentElement.dataset.theme = cleanTheme;
  localStorage.setItem(THEME_STORAGE_KEY, cleanTheme);
  document.querySelectorAll("#theme-toggle").forEach((toggle) => {
    toggle.checked = cleanTheme === "light";
  });
}

function toggleTheme() {
  applyTheme(document.body.classList.contains("light-mode") ? "dark" : "light");
}

function initThemeToggle() {
  applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || "dark");
  document.querySelectorAll("#theme-toggle").forEach((toggle) => {
    toggle.addEventListener("change", toggleTheme);
  });
}

function initHamburger() {
  document.querySelectorAll(".hamburger").forEach((button) => {
    button.addEventListener("click", () => {
      const nav = button.parentElement.querySelector(".nav-links");
      const open = nav.classList.toggle("open");
      button.classList.toggle("open", open);
      button.setAttribute("aria-expanded", String(open));
    });
  });
}

function initGlowCursor() {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  const cursor = document.createElement("div");
  cursor.className = "glow-cursor";
  document.body.appendChild(cursor);
  document.addEventListener("mousemove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    document.documentElement.style.setProperty("--pointer-x", `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
    document.documentElement.style.setProperty("--pointer-y", `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
  });
}

function initPageTransitions() {
  document.body.classList.add("page-enter");
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http")) return;
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      document.body.classList.add("page-exit");
      setTimeout(() => { window.location.href = href; }, 170);
    });
  });
}

function installInteractiveMotion() {
  document.querySelectorAll(".level-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--card-x", `${Math.round(((event.clientX - rect.left) / rect.width) * 100)}%`);
      card.style.setProperty("--card-y", `${Math.round(((event.clientY - rect.top) / rect.height) * 100)}%`);
    });
  });
}

function initTsParticles() {
  if (!window.tsParticles) return;
  window.tsParticles.load("tsparticles", {
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 35 },
      color: { value: ["#22D3EE", "#7C3AED", "#06B6D4"] },
      links: { enable: true, color: "#22D3EE", opacity: 0.12, distance: 130 },
      move: { enable: true, speed: 0.7 },
      opacity: { value: 0.35 },
      size: { value: { min: 1, max: 3 } },
    },
  });
}

function triggerPageFeedback(type = "hint") {
  const className = type === "correct" ? "answer-correct" : type === "wrong" ? "answer-wrong" : "answer-hint";
  document.body.classList.remove("answer-correct", "answer-wrong", "answer-hint");
  void document.body.offsetWidth;
  document.body.classList.add(className);
  setTimeout(() => document.body.classList.remove(className), 800);
  createFeedbackBurst(type);
}

function createFeedbackBurst(type) {
  const colors = { correct: "var(--atlas-green)", wrong: "var(--atlas-red)", hint: "var(--atlas-gold)" };
  const centerX = window.innerWidth / 2;
  const centerY = Math.min(window.innerHeight - 120, window.innerHeight * 0.72);
  const count = type === "correct" ? 22 : 12;
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement("span");
    const angle = (Math.PI * 2 * i) / count;
    const distance = 45 + Math.random() * 80;
    particle.className = "feedback-particle";
    particle.style.setProperty("--x", `${centerX}px`);
    particle.style.setProperty("--y", `${centerY}px`);
    particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--particle-color", colors[type] || colors.hint);
    document.body.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }
}

function renderStudentHeader() {
  const targets = document.querySelectorAll("#student-status");
  const student = getCurrentStudent();
  targets.forEach((target) => {
    if (!student) {
      target.innerHTML = `<span class="streak-nav">🔥 0</span>`;
      return;
    }
    target.innerHTML = `
      <div class="student-pill">
        <div class="avatar">${initials(student.displayName)}</div>
        <span class="student-name">${escapeHtml(student.username)}</span>
        <span class="student-xp">💎 ${student.xp.toLocaleString()} XP</span>
        <span class="student-streak">🔥 ${student.streak}</span>
      </div>
    `;
  });
  document.querySelectorAll(".student-login-btn").forEach((button) => {
    button.textContent = student ? "Student Profile" : "Student Login";
  });
}

function initials(name) {
  return String(name || "SA").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

async function renderHomeProgress() {
  const student = getCurrentStudent();
  const legacyStudent = ensureStudent();
  const xp = student ? student.xp : legacyStudent.totalXP;
  const completedIds = student ? student.completedChallenges : legacyStudent.completedChallengeIds;
  const bestStreak = student ? student.longestStreak : Math.max(...Object.values(legacyStudent.bestStreakByLevel));
  const homeXp = document.getElementById("home-xp");
  const continueButton = document.getElementById("continue-journey");
  if (homeXp) {
    homeXp.textContent = xp.toLocaleString();
    homeXp.dataset.target = String(xp);
  }
  if (continueButton && student) {
    continueButton.textContent = `Welcome back, ${student.displayName}! Continue your journey`;
    continueButton.href = `quiz.html?id=${nextChallengeId(completedIds)}`;
  }

  let challenges = [];
  try {
    challenges = await api("/challenges");
  } catch (_err) {
    challenges = [];
  }

  Object.keys(LEVELS).forEach((level) => {
    const levelChallenges = challenges.filter((challenge) => levelFromChallenge(challenge) === level);
    const total = levelChallenges.length || LEVELS[level].total;
    const completed = levelChallenges.filter((challenge) => completedIds.includes(challenge.id)).length;
    const pct = total ? Math.round((completed / total) * 100) : 0;
    const label = document.querySelector(`[data-progress-label="${level}"]`);
    const bar = document.querySelector(`[data-progress-bar="${level}"]`);
    const streak = document.querySelector(`[data-streak-label="${level}"]`);
    const card = document.querySelector(`[data-level-card="${level}"]`);
    const link = document.querySelector(`[data-level-link="${level}"]`);
    const required = LEVELS[level].requiredXP;
    const locked = xp < required;
    if (label) label.textContent = `${pct}%`;
    if (bar) bar.style.width = `${pct}%`;
    if (streak) streak.textContent = bestStreak || 0;
    if (link) {
      link.href = `quiz.html?id=${LEVELS[level].startId}`;
      link.classList.toggle("disabled", locked);
      link.setAttribute("aria-disabled", String(locked));
    }
    if (card) renderLockedState(card, locked, xp, required);
  });
}

function renderLockedState(card, locked, xp, required) {
  const overlay = card.querySelector(".locked-overlay");
  if (!overlay) return;
  overlay.hidden = !locked;
  if (!locked) {
    card.classList.remove("is-locked");
    overlay.innerHTML = "";
    return;
  }
  card.classList.add("is-locked");
  const pct = required ? Math.min(100, Math.round((xp / required) * 100)) : 100;
  overlay.innerHTML = `
    <div class="lock-icon">🔒</div>
    <strong>Unlock at ${required.toLocaleString()} XP</strong>
    <span>You have ${xp.toLocaleString()} XP</span>
    <div class="lock-progress"><i style="width:${pct}%"></i></div>
  `;
}

function nextChallengeId(completedIds) {
  for (let id = 1; id <= 100; id += 1) {
    if (!completedIds.includes(id)) return id;
  }
  return 1;
}

function animateCounters() {
  document.querySelectorAll(".counter").forEach((counter) => {
    const target = Number(counter.dataset.target || counter.textContent || 0);
    const duration = 850;
    const started = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - started) / duration);
      counter.textContent = Math.round(target * progress).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initHamburger();
  initGlowCursor();
  initPageTransitions();
  installInteractiveMotion();
  initTsParticles();
  renderStudentHeader();
});
