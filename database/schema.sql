-- =============================================================================
-- schema.sql  —  SQL Atlas  |  Database Schema
-- =============================================================================
-- PURPOSE:
--   Defines all tables for the SQL Atlas geography game.
--   Run this FIRST before seed.sql.
--   Safe to re-run — uses CREATE TABLE IF NOT EXISTS.
--
-- HOW TO RUN:
--   mysql -u root -p sql_atlas < database/schema.sql
--
-- TABLE OVERVIEW:
--   countries         — core geography data (the main table students query)
--   cities            — cities linked to countries
--   rivers            — rivers with length and continent
--   languages         — language names
--   country_languages — many-to-many: which languages a country speaks
--   challenges        — the game questions + expected SQL answers
-- =============================================================================

CREATE DATABASE IF NOT EXISTS sql_atlas;
USE sql_atlas;



-- -----------------------------------------------------------------------------
-- 3. RIVERS
--    Independent table (rivers cross multiple countries).
--    Advanced challenges ask about rivers.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rivers (
    id          INT           PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100)  NOT NULL UNIQUE,
    length_km   FLOAT,                        -- total length in km
    continent   VARCHAR(50),
    outflow     VARCHAR(100)                  -- body of water the river flows into
);

-- -----------------------------------------------------------------------------
-- 4. LANGUAGES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS languages (
    id      INT           PRIMARY KEY AUTO_INCREMENT,
    name    VARCHAR(100)  NOT NULL UNIQUE
);

-- -----------------------------------------------------------------------------
-- 5. COUNTRY_LANGUAGES  (many-to-many join table)
--    Tracks which languages are spoken/official in each country.
--    Hard-level JOIN challenges use this table.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS country_languages (
    country_id  MEDIUMINT UNSIGNED NOT NULL,
    language_id INT     NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (country_id, language_id),
    FOREIGN KEY (country_id)  REFERENCES countries(id)  ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id)  ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 6. CHALLENGES
--    Stores all game questions and their correct SQL answers.
--    The backend fetches expected_query server-side — never sent to the client.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges (
    id              INT           PRIMARY KEY AUTO_INCREMENT,
    question_text   TEXT          NOT NULL,     -- shown to the student
    expected_query  TEXT          NOT NULL,     -- kept server-side, used for verification
    category        VARCHAR(100)  NOT NULL,     -- e.g. 'Joins', 'Subqueries'
    difficulty      ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
    hint            TEXT,                       -- optional hint shown after 2 wrong attempts
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Indexes for performance (added after table creation)
-- Note: MySQL 8.0.30+ supports IF NOT EXISTS, but for compatibility we use standard CREATE INDEX
-- db.py handles skipping these if they already exist.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_cl_country        ON country_languages(country_id);
CREATE INDEX idx_cl_language       ON country_languages(language_id);
CREATE INDEX idx_challenges_diff   ON challenges(difficulty);
