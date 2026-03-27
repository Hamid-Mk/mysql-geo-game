# 🌍 SQL Atlas

> **Learn SQL by Exploring the World** — a geography quiz game for school students.

SQL Atlas is a Duolingo-inspired web application where students answer real geography questions by writing SQL queries against a live MySQL database.

---

## 🗂️ Project Structure

```
sql-atlas/
├── backend/                  # FastAPI Python server
│   ├── app.py                # Entry point — creates the FastAPI app
│   ├── db.py                 # Database connection pool (SQLAlchemy)
│   ├── routes.py             # All API endpoints
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variable template → copy to .env
│
├── database/
│   ├── schema.sql            # CREATE TABLE statements (run first)
│   ├── seed.sql              # Sample data + all 20 game challenges
│   └── challenges.json       # Challenge list for frontend reference
│
├── frontend/
│   ├── index.html            # Home / landing page
│   ├── quiz.html             # Main quiz interface (SQL editor + results)
│   ├── admin_teacher.html    # Teacher dashboard (add challenges, view all)
│   ├── assets/               # Logo SVG/PNG, ERD diagram image
│   │   └── erd_diagram.png   # ← Database architect exports this
│   ├── css/
│   │   └── style.css         # Complete stylesheet (all pages)
│   └── js/
│       ├── app.js            # Shared utilities + API config
│       ├── quiz.js           # Quiz page logic
│       └── admin.js          # Admin page logic
│
├── .gitignore
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites

- Python 3.10+
- MySQL Server 8.0+ running locally
- A modern browser

### Step 1 — Clone the repo

```bash
git clone https://github.com/Hamid-Mk/mysql-geo-game.git
cd mysql-geo-game
```

### Step 2 — Set up the database

```bash
# Log in as MySQL root and create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS sql_atlas;"

# Run the schema (creates all tables)
mysql -u root -p sql_atlas < database/schema.sql

# Seed sample data and challenges
mysql -u root -p sql_atlas < database/seed.sql

# Create the read-only student user
mysql -u root -p -e "
  CREATE USER IF NOT EXISTS 'student_reader'@'localhost' IDENTIFIED BY 'choose_a_password';
  GRANT SELECT ON sql_atlas.* TO 'student_reader'@'localhost';
  FLUSH PRIVILEGES;
"
```

### Step 3 — Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:

- `DB_PASSWORD` — the password you chose for `student_reader`
- `ADMIN_PASSWORD_HASH` — generate with:

```bash
python -c "from passlib.context import CryptContext; c=CryptContext(schemes=['bcrypt']); print(c.hash('your_teacher_password'))"
```

### Step 4 — Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 5 — Start the backend

```bash
cd backend
uvicorn app:app --reload --port 8000
```

API is live at: `http://localhost:8000`  
Docs at: `http://localhost:8000/docs`

### Step 6 — Open the frontend

Open `frontend/index.html` directly in your browser, **or** serve it with:

```bash
cd frontend
python -m http.server 3000
# Then visit http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Path                       | Description                        |
| ------ | -------------------------- | ---------------------------------- |
| GET    | `/api/ping`                | Health check                       |
| GET    | `/api/challenges`          | List all challenges                |
| GET    | `/api/challenges/{id}`     | Single challenge by ID             |
| POST   | `/api/execute-query`       | Run student SQL + verify answer    |
| POST   | `/api/admin/login`         | Teacher login → returns token      |
| POST   | `/api/admin/add-challenge` | Add new challenge (requires token) |

---

## 🗃️ Database Schema

| Table               | Description                                    |
| ------------------- | ---------------------------------------------- |
| `countries`         | Core geography data — the main query table     |
| `cities`            | Cities linked to countries via `country_id`    |
| `rivers`            | Rivers with length and continent               |
| `languages`         | Language names                                 |
| `country_languages` | Many-to-many: which languages a country speaks |
| `challenges`        | Game questions + expected SQL answers          |

---

## 🛠️ Tech Stack

| Layer              | Technology                      |
| ------------------ | ------------------------------- |
| Frontend           | HTML5, CSS3, Vanilla JavaScript |
| Backend            | Python 3, FastAPI, Uvicorn      |
| Database ORM       | SQLAlchemy + PyMySQL            |
| Database           | MySQL 8.0                       |
| Hosting (backend)  | Render.com                      |
| Hosting (frontend) | Vercel / Netlify                |

---

## 👩‍🏫 Teacher Dashboard

Access at: `/admin_teacher.html`  
The URL is not linked from the main site — share it directly with teachers.

- Login with the teacher password (set in `.env`)
- Add new challenges with question text, expected SQL, and difficulty
- View all existing challenges with difficulty filter

---

## 📝 TODO / Future Improvements

- [ ] Add CodeMirror for SQL syntax highlighting in the editor
- [ ] Track student progress per session (localStorage or backend sessions)
- [ ] Add a "Leaderboard" showing fastest correct answers
- [ ] Add edit/delete challenge functionality in teacher dashboard
- [ ] Internationalization (multi-language support)

---

_Built with ❤️ for TOP-Day._
