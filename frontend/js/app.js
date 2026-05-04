const API_BASE_URL = "http://localhost:8000/api";
const STUDENT_STORAGE_KEY = "sql_atlas_student";
const THEME_STORAGE_KEY = "sql_atlas_theme";

const LEVELS = {
  Beginner: { total: 30, hints: 5, reward: 80 },
  Intermediate: { total: 40, hints: 3, reward: 120 },
  Advanced: { total: 30, hints: 2, reward: 180 },
};

async function api(path, method = "GET", body = null, extraHeaders = {}) {
  const options = { method, headers: { "Content-Type": "application/json", ...extraHeaders } };
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

function getTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "light";
}

function applyTheme(theme = getTheme()) {
  const cleanTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = cleanTheme;
  localStorage.setItem(THEME_STORAGE_KEY, cleanTheme);
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.textContent = cleanTheme === "dark" ? "Light mode" : "Dark mode";
    button.setAttribute("aria-label", `Switch to ${cleanTheme === "dark" ? "light" : "dark"} mode`);
  });
}

function toggleTheme() {
  applyTheme(getTheme() === "dark" ? "light" : "dark");
}

function installThemeToggle() {
  document.querySelectorAll(".header-actions").forEach((container) => {
    if (container.querySelector("[data-theme-toggle]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.dataset.themeToggle = "true";
    button.addEventListener("click", toggleTheme);
    container.prepend(button);
  });
  applyTheme();
}

function installInteractiveMotion() {
  let ticking = false;
  window.addEventListener("pointermove", (event) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const x = Math.round((event.clientX / window.innerWidth) * 100);
      const y = Math.round((event.clientY / window.innerHeight) * 100);
      document.documentElement.style.setProperty("--pointer-x", `${x}%`);
      document.documentElement.style.setProperty("--pointer-y", `${y}%`);
      ticking = false;
    });
  }, { passive: true });

  document.querySelectorAll(".level-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
      card.style.setProperty("--card-x", `${x}%`);
      card.style.setProperty("--card-y", `${y}%`);
    });
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
  const colors = {
    correct: "var(--success)",
    wrong: "var(--danger)",
    hint: "var(--warning)",
  };
  const centerX = window.innerWidth / 2;
  const centerY = Math.min(window.innerHeight - 120, window.innerHeight * 0.72);
  const count = type === "correct" ? 18 : 10;
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement("span");
    const angle = (Math.PI * 2 * i) / count;
    const distance = 45 + Math.random() * 70;
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

function defaultStudent(name = "Guest explorer") {
  return {
    name,
    totalXP: 0,
    completedChallengeIds: [],
    currentLevel: "Beginner",
    currentChallengeByLevel: { Beginner: 0, Intermediate: 0, Advanced: 0 },
    bestStreakByLevel: { Beginner: 0, Intermediate: 0, Advanced: 0 },
    currentStreak: 0,
    hintsByLevel: { Beginner: 5, Intermediate: 3, Advanced: 2 },
    mistakeStreak: 0,
    lastPlayedDate: new Date().toISOString(),
  };
}

function normalizeStudent(student) {
  const base = defaultStudent(student?.name || "Guest explorer");
  const merged = { ...base, ...student };
  merged.currentChallengeByLevel = { ...base.currentChallengeByLevel, ...(student?.currentChallengeByLevel || {}) };
  merged.bestStreakByLevel = { ...base.bestStreakByLevel, ...(student?.bestStreakByLevel || {}) };
  merged.hintsByLevel = { ...base.hintsByLevel, ...(student?.hintsByLevel || {}) };
  merged.completedChallengeIds = Array.isArray(student?.completedChallengeIds) ? student.completedChallengeIds : [];
  return merged;
}

function getStudent() {
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
  const existing = getStudent();
  return saveStudent({ ...defaultStudent(cleanName), ...(existing || {}), name: cleanName });
}

function logoutStudent() {
  const student = getStudent();
  if (student) saveStudent({ ...student, name: "Guest explorer" });
  window.location.href = "login.html";
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
  const category = challenge.category || "";
  if (["Table Exploration", "Sorting and Limiting", "Absolute Beginner"].includes(category)) return "Beginner";
  if (["Filtering", "Scalar Functions", "Aggregate Functions", "WHERE + Scalar Functions", "Set Functions"].includes(category)) return "Intermediate";
  return "Advanced";
}

function renderStudentHeader() {
  const target = document.getElementById("student-status");
  if (!target) return;
  const student = getStudent();
  if (!student || student.name === "Guest explorer") {
    target.innerHTML = `<a class="nav-link login-link" href="login.html">Student Login</a>`;
    return;
  }
  target.innerHTML = `
    <span class="student-pill">${student.name}</span>
    <span class="student-pill">${student.totalXP.toLocaleString()} XP</span>
    <button class="logout-button" type="button" onclick="logoutStudent()">Logout</button>
  `;
}

async function renderHomeProgress() {
  const student = ensureStudent();
  const name = document.getElementById("home-player-name");
  if (!name) return;
  name.textContent = student.name;
  document.getElementById("home-xp").textContent = student.totalXP.toLocaleString();
  document.getElementById("home-completed").textContent = student.completedChallengeIds.length;
  document.getElementById("home-best-streak").textContent = Math.max(...Object.values(student.bestStreakByLevel));

  let challenges = [];
  try {
    challenges = await api("/challenges");
  } catch (_err) {
    challenges = [];
  }

  Object.keys(LEVELS).forEach((level) => {
    const levelChallenges = challenges.filter((c) => levelFromChallenge(c) === level);
    const total = levelChallenges.length || LEVELS[level].total;
    const completed = levelChallenges.filter((c) => student.completedChallengeIds.includes(c.id)).length;
    const pct = total ? Math.round((completed / total) * 100) : 0;
    const label = document.querySelector(`[data-progress-label="${level}"]`);
    const bar = document.querySelector(`[data-progress-bar="${level}"]`);
    const streak = document.querySelector(`[data-streak-label="${level}"]`);
    const link = document.querySelector(`[data-level-link="${level}"]`);
    if (label) label.textContent = `${pct}%`;
    if (bar) bar.style.width = `${pct}%`;
    if (streak) streak.textContent = student.bestStreakByLevel[level] || 0;
    if (link) {
      link.textContent = completed > 0 ? `Continue ${level}` : `Start ${level}`;
      link.href = `quiz.html?level=${encodeURIComponent(level)}`;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  installThemeToggle();
  installInteractiveMotion();
});
