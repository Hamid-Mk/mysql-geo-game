CREATE TABLE IF NOT EXISTS students (
    username varchar(255) PRIMARY KEY,
    display_name varchar(255),
    xp integer DEFAULT 0,
    streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    level varchar(50) DEFAULT 'Beginner',
    completed_quests integer DEFAULT 0,
    total_correct integer DEFAULT 0,
    total_attempts integer DEFAULT 0,
    last_active timestamp DEFAULT CURRENT_TIMESTAMP
);
