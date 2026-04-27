# SQL Atlas — Local Setup & Execution Guide

This guide provides step-by-step instructions for running the SQL Atlas platform locally on your machine, including running the MySQL database in the background and starting the backend and frontend servers.

## Prerequisites

1. **Python 3.9+** installed on your system.
2. **MySQL Server** installed and running on your system (e.g., via XAMPP, MySQL Installer, or Docker).
3. **Git Bash** or **PowerShell** for running commands.

---

## Step 1: Database Setup (Background MySQL)

Since the `cities.sql` file is extremely large (100MB+), we must import the SQL files manually using the MySQL Command Line Interface (CLI).

1. Ensure your MySQL server is running in the background. (If using XAMPP, start the MySQL module).
2. Open your terminal (PowerShell or Git Bash) in the root `sql-atlas` directory.
3. Run the following commands one by one to set up the schema and import the data. **IMPORTANT: You must use the `root` user for this step to ensure you have permissions to create tables.**

```powershell
# 1. Create the database and tables
mysql -u root -p < database/schema.sql

# 2. Import countries
mysql -u root -p sql_atlas < comperhensive_sql_database/countries.sql

# 3. Import states
mysql -u root -p sql_atlas < comperhensive_sql_database/states.sql

# 4. Import cities (This may take a few minutes!)
mysql -u root -p sql_atlas < comperhensive_sql_database/cities.sql

# 5. Import the 100 challenges
mysql -u root -p sql_atlas < database/challenges_seed.sql
```
*(Note: If your MySQL user is not `root`, replace `root` with your username).*

---

## Step 2: Backend Setup (FastAPI)

We will use PyCharm (or terminal) to install all dependencies at once.

1. Open the `sql-atlas` folder in PyCharm.
2. Navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```
3. Create a virtual environment and activate it:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
4. Install all requirements at once:
   ```powershell
   pip install -r requirements.txt
   ```
5. **CRITICAL:** Open your `backend/.env` file and set `DB_USER=root` and your `DB_PASSWORD`. The application needs these permissions to verify the tables on startup.
6. Start the FastAPI backend server (make sure you are in the `backend` folder):
   ```powershell
   uvicorn app:app --reload --port 8000
   ```
   *The backend is now running at `http://localhost:8000`.*

> [!IMPORTANT]
> **Python Version Note:** It looks like you are using **Python 3.14 (Preview)**. This version is very new and many libraries (like Pydantic) may fail to build. If you encounter "Building wheel" errors, it is highly recommended to use a stable version like **Python 3.11** or **3.12**.

---

## Step 3: Frontend Setup

The frontend consists of static HTML/JS/CSS files. You need to serve them on a local web server.

1. Open a **new** terminal window (leave the backend running in the first one).
2. Navigate to the `frontend/` directory:
   ```powershell
   cd frontend
   ```
3. Start Python's built-in HTTP server:
   ```powershell
   python -m http.server 3000
   ```
4. Open your web browser and go to:
   **http://localhost:3000**

---

## Teacher Login
The teacher login page is located at `http://localhost:3000/admin_teacher.html`.
The default password is **`teacher123`**. 
*(This uses the bcrypt hash stored in the backend `.env` file).*
