document.addEventListener("DOMContentLoaded", () => {
  renderStudentModal();
  bindStudentButtons();
  renderStudentHeader();
});

function renderStudentModal() {
  if (document.getElementById("student-modal")) return;
  const modal = document.createElement("div");
  modal.id = "student-modal";
  modal.className = "student-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="student-modal-panel glass-card">
      <button class="modal-close" type="button" aria-label="Close student panel">×</button>
      <div id="student-modal-content"></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeStudentModal();
  });
  modal.querySelector(".modal-close").addEventListener("click", closeStudentModal);
}

function bindStudentButtons() {
  document.querySelectorAll(".student-login-btn").forEach((button) => {
    button.addEventListener("click", openStudentModal);
  });
}

function openStudentModal() {
  const modal = document.getElementById("student-modal");
  modal.hidden = false;
  document.body.classList.add("modal-open");
  renderStudentModalContent("login");
}

function closeStudentModal() {
  const modal = document.getElementById("student-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function renderStudentModalContent(tab = "login") {
  const content = document.getElementById("student-modal-content");
  const student = getCurrentStudent();
  if (student) {
    content.innerHTML = `
      <div class="profile-card">
        <div class="avatar large">${initials(student.displayName)}</div>
        <p class="eyebrow">Student Profile</p>
        <h2>${escapeHtml(student.displayName)}</h2>
        <p class="muted">@${escapeHtml(student.username)}</p>
        <div class="profile-stats">
          <span><strong>${student.xp.toLocaleString()}</strong>XP</span>
          <span><strong>${student.streak}</strong>Streak</span>
          <span><strong>${student.longestStreak}</strong>Best</span>
          <span><strong>${student.completedChallenges.length}</strong>Done</span>
        </div>
        <button id="student-logout-btn" class="mission-button" type="button">Logout</button>
      </div>
    `;
    document.getElementById("student-logout-btn").addEventListener("click", () => {
      studentLogout();
      renderHomeProgress?.();
      closeStudentModal();
    });
    return;
  }

  content.innerHTML = `
    <div class="student-tabs" role="tablist">
      <button class="${tab === "login" ? "active" : ""}" data-student-tab="login" type="button">Login</button>
      <button class="${tab === "register" ? "active" : ""}" data-student-tab="register" type="button">Register</button>
    </div>
    <div class="student-form-wrap">
      ${tab === "login" ? loginFormTemplate() : registerFormTemplate()}
    </div>
  `;
  content.querySelectorAll("[data-student-tab]").forEach((button) => {
    button.addEventListener("click", () => renderStudentModalContent(button.dataset.studentTab));
  });
  const form = content.querySelector("form");
  form.addEventListener("submit", tab === "login" ? handleStudentLoginSubmit : handleStudentRegisterSubmit);
}

function loginFormTemplate() {
  return `
    <form id="student-login-form" class="student-form">
      <p class="eyebrow">Welcome back</p>
      <h2>Log in to SQL Atlas</h2>
      <label>Username
        <input id="student-login-username" name="username" autocomplete="username" required />
      </label>
      <label>Password
        <input id="student-login-password" name="password" type="password" autocomplete="current-password" required />
      </label>
      <p id="student-auth-error" class="field-error" hidden></p>
      <button class="mission-button" type="submit">Login</button>
    </form>
  `;
}

function registerFormTemplate() {
  return `
    <form id="student-register-form" class="student-form">
      <p class="eyebrow">New explorer</p>
      <h2>Create your profile</h2>
      <label>Display name
        <input id="student-register-display" name="displayName" autocomplete="name" required />
      </label>
      <label>Username
        <input id="student-register-username" name="username" autocomplete="username" required />
      </label>
      <label>Password
        <input id="student-register-password" name="password" type="password" autocomplete="new-password" required />
      </label>
      <p id="student-auth-error" class="field-error" hidden></p>
      <button class="mission-button" type="submit">Register</button>
    </form>
  `;
}

function handleStudentLoginSubmit(event) {
  event.preventDefault();
  const result = studentLogin(
    document.getElementById("student-login-username").value,
    document.getElementById("student-login-password").value
  );
  finishAuth(result);
}

function handleStudentRegisterSubmit(event) {
  event.preventDefault();
  const result = studentRegister(
    document.getElementById("student-register-username").value,
    document.getElementById("student-register-display").value,
    document.getElementById("student-register-password").value
  );
  finishAuth(result);
}

function finishAuth(result) {
  const error = document.getElementById("student-auth-error");
  if (!result.ok) {
    error.textContent = result.error;
    error.hidden = false;
    return;
  }
  syncLegacyStudent(result.student);
  renderStudentHeader();
  renderHomeProgress?.();
  renderStudentModalContent();
}
