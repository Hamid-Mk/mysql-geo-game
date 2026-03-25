# =============================================================================
# routes.py  —  SQL Atlas  |  All API Route Handlers
# =============================================================================
# PURPOSE:
#   Defines every API endpoint the frontend calls.
#   All routes are prefixed with /api (set in app.py).
#
# ROUTES OVERVIEW:
#   GET  /api/ping                      → health check
#   GET  /api/challenges                → list all challenges (id, question, difficulty)
#   GET  /api/challenges/{id}           → single challenge by ID
#   POST /api/execute-query             → run student SQL, return rows + is_correct
#   POST /api/admin/login               → teacher login
#   POST /api/admin/add-challenge       → add a new challenge (protected)
# =============================================================================

import re
import os
import json
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from passlib.context import CryptContext

from db import get_db

router = APIRouter()

# =============================================================================
# SECURITY HELPERS
# =============================================================================

# Simple token store — in production use JWT or a real session system
VALID_TOKENS: set = set()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Load the hashed admin password from environment
# To generate a hash: python -c "from passlib.context import CryptContext; c=CryptContext(schemes=['bcrypt']); print(c.hash('yourpassword'))"
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")


def verify_admin_token(x_admin_token: Optional[str] = Header(None)):
    """
    FastAPI dependency — checks for a valid admin token in request headers.
    Usage in a route:  def route(..., _=Depends(verify_admin_token))
    """
    if not x_admin_token or x_admin_token not in VALID_TOKENS:
        raise HTTPException(status_code=401, detail="Unauthorized. Please log in.")


# =============================================================================
# SQL SANITIZER
# =============================================================================

# These keywords must never appear in student queries
BLOCKED_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
    "TRUNCATE", "CREATE", "GRANT", "REVOKE", "EXEC",
    "EXECUTE", "CALL", "LOAD", "OUTFILE", "DUMPFILE",
]

def sanitize_query(sql: str) -> Optional[str]:
    """
    Returns an error message string if the query contains blocked keywords.
    Returns None if the query is safe to execute.

    TODO: Extend this list if you discover other dangerous patterns.
    """
    sql_upper = sql.upper()
    for keyword in BLOCKED_KEYWORDS:
        # Use word-boundary check so e.g. "CREATED" doesn't match "CREATE"
        pattern = r'\b' + keyword + r'\b'
        if re.search(pattern, sql_upper):
            return f"❌ Blocked keyword detected: '{keyword}'. Only SELECT statements are allowed."
    return None  # query is safe


# =============================================================================
# REQUEST / RESPONSE MODELS (Pydantic)
# =============================================================================

class ExecuteQueryRequest(BaseModel):
    query: str
    challenge_id: int

class AdminLoginRequest(BaseModel):
    password: str

class AddChallengeRequest(BaseModel):
    question_text: str
    expected_query: str
    difficulty: str       # "easy" | "medium" | "hard"
    hint: Optional[str] = ""


# =============================================================================
# ROUTES
# =============================================================================

# -----------------------------------------------------------------------------
# Health Check
# -----------------------------------------------------------------------------
@router.get("/ping")
def ping(db: Session = Depends(get_db)):
    """
    Quick check that the server AND database are both alive.
    Frontend can call this on load to detect connection issues.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB connection failed: {e}")


# -----------------------------------------------------------------------------
# Get All Challenges (for the challenge list / progress bar)
# -----------------------------------------------------------------------------
@router.get("/challenges")
def get_all_challenges(db: Session = Depends(get_db)):
    """
    Returns a summary list of all challenges.
    Does NOT return expected_query (that stays server-side).

    Response shape:
    [
      { "id": 1, "question_text": "...", "difficulty": "easy", "hint": "..." },
      ...
    ]
    """
    result = db.execute(
        text("SELECT id, question_text, difficulty, hint FROM challenges ORDER BY id ASC")
    )
    rows = result.mappings().all()
    return [dict(row) for row in rows]


# -----------------------------------------------------------------------------
# Get Single Challenge by ID
# -----------------------------------------------------------------------------
@router.get("/challenges/{challenge_id}")
def get_challenge(challenge_id: int, db: Session = Depends(get_db)):
    """
    Returns a single challenge by ID.
    Used by the quiz page to load a specific question.

    TODO: Add a 'completed_by_session' flag once session tracking is added.
    """
    result = db.execute(
        text("SELECT id, question_text, difficulty, hint FROM challenges WHERE id = :id"),
        {"id": challenge_id}
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    return dict(row)


# -----------------------------------------------------------------------------
# Execute Student Query  ← CORE ENDPOINT
# -----------------------------------------------------------------------------
@router.post("/execute-query")
def execute_query(body: ExecuteQueryRequest, db: Session = Depends(get_db)):
    """
    Receives the student's SQL query + the current challenge_id.
    Steps:
      1. Sanitize — block any non-SELECT keywords.
      2. Execute the student query on the DB (as student_reader — read-only).
      3. Fetch the expected query for this challenge.
      4. Execute the expected query to get the "answer key".
      5. Compare results and return is_correct flag.

    Response shape:
    {
      "success": true,
      "columns": ["name", "population"],
      "rows": [["France", 67000000], ...],
      "is_correct": true | false,
      "row_count": 1
    }
    """
    student_sql = body.query.strip()

    # --- Step 1: Sanitize ---
    error_msg = sanitize_query(student_sql)
    if error_msg:
        return {"success": False, "error": error_msg}

    # --- Step 2: Execute student query ---
    try:
        student_result = db.execute(text(student_sql))
        columns = list(student_result.keys())
        student_rows = [list(row) for row in student_result.fetchall()]
    except Exception as e:
        # Return a friendly error — not a raw Python traceback
        return {
            "success": False,
            "error": f"SQL Error: {str(e).split('(')[0].strip()}"
        }

    # --- Step 3: Fetch expected query from DB ---
    challenge_result = db.execute(
        text("SELECT expected_query FROM challenges WHERE id = :id"),
        {"id": body.challenge_id}
    )
    challenge = challenge_result.mappings().first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    # --- Step 4: Execute expected query ---
    try:
        expected_result = db.execute(text(challenge["expected_query"]))
        expected_rows = [list(row) for row in expected_result.fetchall()]
    except Exception as e:
        # The expected query has a bug — this should never happen in production
        raise HTTPException(status_code=500, detail=f"Expected query error: {e}")

    # --- Step 5: Compare results ---
    # Sort both by their string representation so column order doesn't matter
    def normalize(rows):
        return sorted([sorted([str(cell) for cell in row]) for row in rows])

    is_correct = normalize(student_rows) == normalize(expected_rows)

    return {
        "success": True,
        "columns": columns,
        "rows": student_rows,
        "row_count": len(student_rows),
        "is_correct": is_correct,
    }


# -----------------------------------------------------------------------------
# Admin: Teacher Login
# -----------------------------------------------------------------------------
@router.post("/admin/login")
def admin_login(body: AdminLoginRequest):
    """
    Checks the submitted password against the hashed password in .env.
    On success, returns a session token the frontend stores in localStorage.
    The token must be sent as the X-Admin-Token header on protected routes.

    TODO: Replace this simple token with JWT for a more robust solution.
    """
    if not ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=500, detail="Admin password not configured.")

    if not pwd_context.verify(body.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    # Generate a simple random token
    import secrets
    token = secrets.token_hex(32)
    VALID_TOKENS.add(token)

    return {"success": True, "token": token}


# -----------------------------------------------------------------------------
# Admin: Add New Challenge (protected)
# -----------------------------------------------------------------------------
@router.post("/admin/add-challenge")
def add_challenge(
    body: AddChallengeRequest,
    db: Session = Depends(get_db),
    _=Depends(verify_admin_token),   # <-- requires valid X-Admin-Token header
):
    """
    Saves a new challenge to the database.
    Only accessible with a valid admin token (from /admin/login).

    TODO: Add input validation to test expected_query against the live DB
          before saving, to catch typos in the answer key.
    """
    allowed_difficulties = {"easy", "medium", "hard"}
    if body.difficulty not in allowed_difficulties:
        raise HTTPException(
            status_code=400,
            detail=f"Difficulty must be one of: {allowed_difficulties}"
        )

    db.execute(
        text("""
            INSERT INTO challenges (question_text, expected_query, difficulty, hint)
            VALUES (:question_text, :expected_query, :difficulty, :hint)
        """),
        {
            "question_text": body.question_text,
            "expected_query": body.expected_query,
            "difficulty": body.difficulty,
            "hint": body.hint,
        }
    )
    db.commit()
    return {"success": True, "message": "Challenge saved successfully."}
