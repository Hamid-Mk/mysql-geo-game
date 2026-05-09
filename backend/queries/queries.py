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
