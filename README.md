# 🌍 SQL Atlas (Sci-Fi Edition)

> **Learn SQL by Exploring the World** — a premium, sci-fi-themed geography quiz game designed to teach students SQL.

SQL Atlas is an immersive, gamified web application where students answer real geography questions by writing SQL queries against a live PostgreSQL database. It features a full sci-fi UI, XP tracking, level streaks, and hints!

### 🚀 Live Links
- **Frontend (Play the Game):** [https://mysqlatlas.netlify.app](https://mysqlatlas.netlify.app)
- **Backend API Docs:** [https://mysql-geo-game.vercel.app/docs](https://mysql-geo-game.vercel.app/docs)

---

## 🗂️ Project Structure (Monorepo)

```
sql-atlas/
├── backend/                  # FastAPI Python server (Vercel)
│   ├── main.py               # Entry point
│   ├── database.py           # PostgreSQL connection pool
│   ├── routes/               # API endpoints
│   ├── sql_files/            # Database schema & seed scripts
│   ├── vercel.json           # Vercel Serverless configuration
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Static HTML/JS/CSS (Netlify)
│   ├── index.html            # Landing / Login page
│   ├── quiz.html             # Main terminal interface
│   ├── css/
│   │   └── style.css         # Sci-Fi UI styling
│   └── js/
│       ├── app.js            # Shared config & dynamic API URLs
│       └── quiz.js           # Core terminal logic
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (Custom Glassmorphism), Vanilla JS |
| **Backend** | Python 3.10+, FastAPI |
| **Database** | PostgreSQL (Neon DB) |
| **Hosting (API)** | Vercel (Serverless Functions) |
| **Hosting (UI)** | Netlify |

---

## 🚀 Deployment Guide

This repository is designed to be easily deployed using a "monorepo" strategy.

### 1. Deploy the Backend (Vercel)
1. Import this repository into Vercel.
2. Under **Root Directory**, click edit and select `backend`.
3. Add the `DB_CONNECTION` environment variable with your Neon DB string.
4. Deploy to get your live API URL.

### 2. Deploy the Frontend (Netlify)
1. In `frontend/js/app.js`, update `API_BASE_URL` with your Vercel URL.
2. Import this repository into Netlify.
3. Under **Base directory**, type `frontend`.
4. Leave the Publish directory blank or set it to `.`.
5. Deploy to get your live game URL.

### 3. Final Step (CORS)
Add the `ORIGINS` environment variable in Vercel and set it to your Netlify URL so the backend accepts requests.

---

*Built with ❤️ for aspiring database engineers.*
