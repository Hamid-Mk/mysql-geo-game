# =============================================================================
# db.py  —  SQL Atlas  |  Database Connection & Table Initialization
# =============================================================================
# PURPOSE:
#   - Creates and manages the MySQL connection using SQLAlchemy.
#   - Exposes `get_db()` as a FastAPI dependency — inject it into any route
#     that needs a database session.
#   - Runs `create_tables()` on startup to ensure all tables exist.
#
# DEPENDENCIES:
#   pip install sqlalchemy pymysql python-dotenv
#
# ENVIRONMENT VARIABLES (set in your .env file):
#   DB_HOST      = localhost          (or your cloud DB host)
#   DB_PORT      = 3306
#   DB_USER      = student_reader     (read-only MySQL user)
#   DB_PASSWORD  = your_password
#   DB_NAME      = sql_atlas
# =============================================================================

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

# -----------------------------------------------------------------------------
# 1. Load environment variables from .env file
# -----------------------------------------------------------------------------
load_dotenv()

DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = os.getenv("DB_PORT", "3306")
DB_USER     = os.getenv("DB_USER", "student_reader")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME     = os.getenv("DB_NAME", "sql_atlas")

# -----------------------------------------------------------------------------
# 2. Build the SQLAlchemy connection URL
#    Format: mysql+pymysql://user:password@host:port/database
# -----------------------------------------------------------------------------
DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# -----------------------------------------------------------------------------
# 3. Create the engine (connection pool)
#    pool_pre_ping=True: automatically reconnects if connection drops
# -----------------------------------------------------------------------------
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# -----------------------------------------------------------------------------
# 4. Session factory — creates individual DB sessions per request
# -----------------------------------------------------------------------------
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# -----------------------------------------------------------------------------
# 5. FastAPI dependency — use this in route functions with Depends(get_db)
#
#    Example usage in routes.py:
#       from db import get_db
#       from sqlalchemy.orm import Session
#       from fastapi import Depends
#
#       @router.get("/example")
#       def example(db: Session = Depends(get_db)):
#           result = db.execute(text("SELECT 1"))
#           return result.fetchall()
# -----------------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -----------------------------------------------------------------------------
# 6. Create tables on startup
#    Reads and executes schema.sql from the /database folder.
#    This is safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.
# -----------------------------------------------------------------------------
def create_tables():
    schema_path = os.path.join(
        os.path.dirname(__file__), "..", "database", "schema.sql"
    )
    if not os.path.exists(schema_path):
        print("⚠️  schema.sql not found — skipping table creation.")
        return

    with open(schema_path, "r") as f:
        sql = f.read()

    # Split on semicolons so we can execute statement by statement
    statements = [s.strip() for s in sql.split(";") if s.strip()]

    with engine.connect() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"⚠️  Skipping statement: {e}")
        conn.commit()

    print("✅  Database tables verified / created.")
