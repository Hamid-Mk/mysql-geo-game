from pydantic import BaseModel
from typing import Optional

class ExecuteQueryRequest(BaseModel):
    query: str
    challenge_id: int

class AdminLoginRequest(BaseModel):
    password: str

class AddChallengeRequest(BaseModel):
    question_text: str
    expected_query: str
    difficulty: str       # "easy" | "medium" | "hard"
    category: str
    level: Optional[str] = "Beginner"
    hint: Optional[str] = ""

class SyncStudentRequest(BaseModel):
    username: str
    display_name: str
    xp: int
    streak: int
    longest_streak: int
    level: str
    completed_quests: int
    total_correct: int
    total_attempts: int
