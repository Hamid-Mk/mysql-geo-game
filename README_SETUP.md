# SQL Atlas — Local Setup & Run Guide

> Step-by-step instructions for running SQL Atlas locally after cloning the repo.
> Covers **macOS** and **Windows**.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Python** | 3.11 – 3.13 | ⚠️ Do **not** use Python 3.14 (preview) — packages like Pydantic and bcrypt may fail to build. |
| **MySQL Server** | 8.0+ | Must be installed and running before you start. |
| **Git** | Any | To clone the repo. |
| **A modern browser** | Chrome, Firefox, Edge, Safari | For the frontend. |

### Installing MySQL (if not already installed)

<details>
<summary><strong>macOS — Native Installer (no Homebrew)</strong></summary>

1. Download the **DMG** installer from https://dev.mysql.com/downloads/mysql/ (select macOS, x86 or ARM depending on your Mac).
2. Run the installer — accept defaults. **Remember the root password** it asks you to set.
3. After installation, MySQL lives at `/usr/local/mysql/`.
4. Start/stop it from **System Preferences → MySQL** (a preference pane is installed automatically).

> The `mysql` command won't be in your PATH by default. Use the full path:
> ```bash
> /usr/local/mysql/bin/mysql
> ```
> Or add it to your shell profile once:
> ```bash
> echo 'export PATH="/usr/local/mysql/bin:$PATH"' >> ~/.zshrc
> source ~/.zshrc
> ```

</details>

<details>
<summary><strong>Windows — MySQL Installer or XAMPP</strong></summary>

**Option A — MySQL Installer** (recommended):
1. Download from https://dev.mysql.com/downloads/installer/
2. Choose "Developer Default" or "Server Only".
3. Set a root password during setup. Remember it.
4. MySQL will run as a Windows service (starts automatically).

**Option B — XAMPP:**
1. Download from https://www.apachefriends.org/
2. Install and open the XAMPP Control Panel.
3. Start the **MySQL** module.

</details>

---

## Step 1 — Clone the Repo

```bash
git clone https://github.com/Hamid-Mk/mysql-geo-game.git
cd mysql-geo-game
```

---

## Step 2 — Create the Database & Import Data

Make sure MySQL is running, then open a terminal **in the project root folder**.

### macOS

```bash
# Create the database and tables
/usr/local/mysql/bin/mysql -u root -p < database/schema.sql

# Import geography data
/usr/local/mysql/bin/mysql -u root -p sql_atlas < comperhensive_sql_database/countries.sql
/usr/local/mysql/bin/mysql -u root -p sql_atlas < comperhensive_sql_database/states.sql
/usr/local/mysql/bin/mysql -u root -p sql_atlas < comperhensive_sql_database/cities.sql    # ~1-3 min

# Import the 100 game challenges
/usr/local/mysql/bin/mysql -u root -p sql_atlas < database/challenges_seed.sql
```

> **Tip — skip retyping your password every time:**
> ```bash
> /usr/local/mysql/bin/mysql -u root -p'YOUR_PASSWORD' < database/schema.sql && \
> /usr/local/mysql/bin/mysql -u root -p'YOUR_PASSWORD' sql_atlas < comperhensive_sql_database/countries.sql && \
> /usr/local/mysql/bin/mysql -u root -p'YOUR_PASSWORD' sql_atlas < comperhensive_sql_database/states.sql && \
> /usr/local/mysql/bin/mysql -u root -p'YOUR_PASSWORD' sql_atlas < comperhensive_sql_database/cities.sql && \
> /usr/local/mysql/bin/mysql -u root -p'YOUR_PASSWORD' sql_atlas < database/challenges_seed.sql
> ```
> *(no space between `-p` and the password)*

### Windows (PowerShell)

```powershell
mysql -u root -p < database/schema.sql
mysql -u root -p sql_atlas < comperhensive_sql_database/countries.sql
mysql -u root -p sql_atlas < comperhensive_sql_database/states.sql
mysql -u root -p sql_atlas < comperhensive_sql_database/cities.sql
mysql -u root -p sql_atlas < database/challenges_seed.sql
```

> If `mysql` is not recognized, use the full path, e.g.:
> `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"`

---

## Step 3 — Set Up the Python Backend

### 3a. Create a virtual environment

**macOS:**
```bash
python3.13 -m venv .venv        # or python3.12, python3.11
source .venv/bin/activate
```

**Windows:**
```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

Verify you're on the right version:
```bash
python --version
# Should print Python 3.11.x, 3.12.x, or 3.13.x
```

### 3b. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

> MySQL 8 commonly uses the `caching_sha2_password` authentication method. The project includes `cryptography` in `requirements.txt` so PyMySQL can connect to those MySQL accounts correctly.

### 3c. Create the `.env` file

```bash
cp .env.example .env        # macOS / Git Bash
# or
copy .env.example .env      # Windows PowerShell
```

Open `backend/.env` in any text editor and fill it in:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=sql_atlas
PORT=8000
ADMIN_PASSWORD_HASH=paste_hash_here
```

### 3d. Generate the admin password hash

With the venv active, run:

```bash
python -c "import bcrypt; print(bcrypt.hashpw(b'teacher123', bcrypt.gensalt()).decode())"
```

Copy the output (starts with `$2b$...`) and paste it as the `ADMIN_PASSWORD_HASH` value in `.env`.

> ⚠️ **Do not** use the `passlib` version — it crashes with bcrypt 4.x.
> If you see `AttributeError: module 'bcrypt' has no attribute '__about__'`, use the command above instead.

---

## Step 4 — Start the Backend

```bash
# From the backend/ directory, with venv active:
uvicorn app:app --reload --port 8000
```

> Important: use `app:app`, not `main:app`. The FastAPI entry file in this project is `backend/app.py`, and the FastAPI instance inside it is named `app`.

You should see:
```
✅  Database tables verified / created.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Verify by opening http://localhost:8000/docs — you should see the Swagger API docs.

> ⚠️ **Keep this terminal open** — the backend must stay running.

---

## Step 5 — Start the Frontend

Open a **second terminal** (leave the backend running in the first one):

```bash
cd frontend
python -m http.server 3000
```

Open your browser and go to: **http://localhost:3000**

Useful frontend pages:

| Page | URL | Notes |
|------|-----|-------|
| Student dashboard | http://localhost:3000/index.html | Level cards, student login, progress, XP, and dark/light mode. |
| Quiz page | http://localhost:3000/quiz.html | Usually opened through the dashboard so students resume from their first unfinished question. |
| Leaderboard | http://localhost:3000/leaderboard.html | Client-side leaderboard from registered students in this browser. |
| Teacher dashboard | http://localhost:3000/admin_teacher.html | Teacher login and challenge creation. |

Student accounts and leaderboard data are stored in browser `localStorage`. This means progress is saved on the same device/browser, but it is not shared across different computers unless backend student auth is added later.

### Alternative: cache-busting dev server

From the project root:
```bash
python run_frontend.py
```
Then open: **http://127.0.0.1:8080**

---

## Summary — What's Running

| # | Component | Terminal | Command | URL |
|---|-----------|----------|---------|-----|
| 1 | MySQL | Background service | Already running | port 3306 |
| 2 | Backend | Terminal 1 | `uvicorn app:app --reload --port 8000` | http://localhost:8000 |
| 3 | Frontend | Terminal 2 | `python -m http.server 3000` | http://localhost:3000 |

---

## Teacher Dashboard

Navigate to http://localhost:3000/admin_teacher.html  
Login with password: **`teacher123`** (or whatever you set in Step 3d).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `mysql: command not found` | **macOS:** Use `/usr/local/mysql/bin/mysql`. **Windows:** Use the full path or add MySQL's `bin` folder to your system PATH. |
| `Access denied for user 'root'@'localhost'` | Wrong MySQL password. Double-check what you set during MySQL installation. |
| `Can't connect to local MySQL server through socket` | MySQL server is not running. **macOS:** System Preferences → MySQL → Start. **Windows:** Start it from XAMPP or Services. |
| `Building wheel for pydantic` hangs or fails | You're likely using Python 3.14. Switch to 3.11–3.13. |
| `ModuleNotFoundError: No module named 'uvicorn'` | Activate the venv first: `source .venv/bin/activate` (macOS) or `.\.venv\Scripts\activate` (Windows). |
| `Error loading ASGI app. Could not import module "main"` | Use `uvicorn app:app --reload --port 8000` from the `backend/` folder. This project has `app.py`, not `main.py`. |
| `'cryptography' package is required for sha256_password or caching_sha2_password` | Run `pip install -r requirements.txt` again. If needed, run `pip install cryptography` inside the active virtual environment. |
| Frontend says "Cannot reach the SQL Atlas server" | The backend is not running on port 8000. Check Terminal 1. |
| `AttributeError: module 'bcrypt' has no attribute '__about__'` | Don't use `passlib`. Use the direct bcrypt command from Step 3d. |
| **Forgot MySQL root password (macOS):** | Stop MySQL → start in safe mode → reset. See commands below. |

<details>
<summary><strong>Reset MySQL root password (macOS)</strong></summary>

```bash
# 1. Stop MySQL
sudo /usr/local/mysql/support-files/mysql.server stop

# 2. Start in safe mode (skip authentication)
sudo /usr/local/mysql/bin/mysqld_safe --skip-grant-tables &

# 3. Connect without password
/usr/local/mysql/bin/mysql -u root

# 4. Reset the password (inside the mysql prompt)
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
FLUSH PRIVILEGES;
EXIT;

# 5. Restart MySQL normally
sudo /usr/local/mysql/support-files/mysql.server restart
```

</details>
