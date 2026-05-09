import re
import os
import bcrypt
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional

import config
from database import execute_sql_query
from queries import queries
from models.schemas import ExecuteQueryRequest, AdminLoginRequest, AddChallengeRequest

router = APIRouter()

VALID_TOKENS = set()

def verify_admin_token(x_admin_token: Optional[str] = Header(None)):
    if not x_admin_token or x_admin_token not in VALID_TOKENS:
        raise HTTPException(status_code=401, detail="Unauthorized. Please log in.")

BLOCKED_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
    "TRUNCATE", "CREATE", "GRANT", "REVOKE", "EXEC",
    "EXECUTE", "CALL", "LOAD", "OUTFILE", "DUMPFILE",
]

def sanitize_query(sql: str) -> Optional[str]:
    sql_upper = sql.upper()
    for keyword in BLOCKED_KEYWORDS:
        pattern = r'\b' + keyword + r'\b'
        if re.search(pattern, sql_upper):
            return f"❌ Blocked keyword detected: '{keyword}'. Only SELECT statements are allowed."
    return None

@router.get("/ping")
def ping():
    execute_sql_query("SELECT 1")
    return {"status": "ok", "db": "connected"}

@router.get("/challenges")
def get_all_challenges():
    return queries.fetch_all_challenges()

@router.get("/challenges/{challenge_id}")
def get_challenge(challenge_id: int):
    challenge = queries.fetch_challenge_by_id(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    return challenge

@router.post("/execute-query")
def execute_query(body: ExecuteQueryRequest):
    student_sql = body.query.strip()

    error_msg = sanitize_query(student_sql)
    if error_msg:
        return {"success": False, "error": error_msg}

    try:
        student_result = execute_sql_query(student_sql)
        # Convert dict_row list back to columns and rows arrays for the frontend
        if student_result:
            columns = list(student_result[0].keys())
            student_rows = [list(r.values()) for r in student_result]
        else:
            columns = []
            student_rows = []
    except Exception as e:
        return {"success": False, "error": f"SQL Error: {str(e)}"}

    expected_sql = queries.fetch_expected_query(body.challenge_id)
    if not expected_sql:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    try:
        expected_result = execute_sql_query(expected_sql)
        if expected_result:
            expected_rows = [list(r.values()) for r in expected_result]
        else:
            expected_rows = []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Expected query error: {e}")

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

@router.post("/admin/login")
def admin_login(body: AdminLoginRequest):
    if not config.admin_password_hash:
        raise HTTPException(status_code=500, detail="Admin password not configured.")
    try:
        if not bcrypt.checkpw(body.password.encode('utf-8'), config.admin_password_hash.encode('utf-8')):
            raise HTTPException(status_code=401, detail="Incorrect password.")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error verifying password.")

    import secrets
    token = secrets.token_hex(32)
    VALID_TOKENS.add(token)
    return {"success": True, "token": token}

@router.post("/admin/add-challenge")
def add_challenge(body: AddChallengeRequest, _=Depends(verify_admin_token)):
    allowed_difficulties = {"easy", "medium", "hard"}
    allowed_levels = {"Beginner", "Intermediate", "Advanced"}
    if body.difficulty not in allowed_difficulties:
        raise HTTPException(status_code=400, detail="Invalid difficulty")
    if body.level not in allowed_levels:
        raise HTTPException(status_code=400, detail="Invalid level")

    queries.insert_challenge(body)
    return {"success": True, "message": "Challenge saved successfully."}
