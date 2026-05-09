from database import execute_sql_query

def fetch_all_challenges():
    query = "SELECT id, question_text, difficulty, category, level, hint FROM challenges ORDER BY id ASC"
    return execute_sql_query(query)

def fetch_challenge_by_id(challenge_id: int):
    query = "SELECT id, question_text, difficulty, category, level, hint FROM challenges WHERE id = %s"
    result = execute_sql_query(query, (challenge_id,))
    return result[0] if result else None

def fetch_expected_query(challenge_id: int):
    query = "SELECT expected_query FROM challenges WHERE id = %s"
    result = execute_sql_query(query, (challenge_id,))
    return result[0]['expected_query'] if result else None

def insert_challenge(data):
    query = """
        INSERT INTO challenges (question_text, expected_query, difficulty, category, level, hint)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    execute_sql_query(query, (
        data.question_text, 
        data.expected_query, 
        data.difficulty, 
        data.category, 
        data.level, 
        data.hint
    ))

def upsert_student(data):
    query = """
        INSERT INTO students (username, display_name, xp, streak, longest_streak, level, completed_quests, total_correct, total_attempts, last_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (username) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            xp = EXCLUDED.xp,
            streak = EXCLUDED.streak,
            longest_streak = EXCLUDED.longest_streak,
            level = EXCLUDED.level,
            completed_quests = EXCLUDED.completed_quests,
            total_correct = EXCLUDED.total_correct,
            total_attempts = EXCLUDED.total_attempts,
            last_active = CURRENT_TIMESTAMP
    """
    execute_sql_query(query, (
        data.username,
        data.display_name,
        data.xp,
        data.streak,
        data.longest_streak,
        data.level,
        data.completed_quests,
        data.total_correct,
        data.total_attempts
    ))

def fetch_leaderboard():
    query = """
        SELECT username, display_name, xp, streak, longest_streak, level, completed_quests, total_correct, total_attempts
        FROM students
        ORDER BY xp DESC
        LIMIT 50
    """
    return execute_sql_query(query)
