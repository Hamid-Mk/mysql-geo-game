CREATE DATABASE IF NOT EXISTS sql_atlas;
USE sql_atlas;

CREATE TABLE IF NOT EXISTS countries (
    id mediumint unsigned NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL,
    iso2 char(2) DEFAULT NULL,
    iso3 char(3) DEFAULT NULL,
    capital varchar(255) DEFAULT NULL,
    currency varchar(255) DEFAULT NULL,
    currency_name varchar(255) DEFAULT NULL,
    gdp bigint unsigned DEFAULT NULL,
    latitude decimal(10,8) DEFAULT NULL,
    longitude decimal(11,8) DEFAULT NULL,
    nationality varchar(255) DEFAULT NULL,
    phonecode varchar(255) DEFAULT NULL,
    population bigint unsigned DEFAULT NULL,
    region varchar(255) DEFAULT NULL,
    subregion varchar(255) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_countries_region (region),
    KEY idx_countries_subregion (subregion),
    KEY idx_countries_currency (currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS states (
    id mediumint unsigned NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    country_id mediumint unsigned NOT NULL,
    country_code char(2) NOT NULL,
    country_name varchar(255) DEFAULT NULL,
    latitude decimal(10,8) DEFAULT NULL,
    longitude decimal(11,8) DEFAULT NULL,
    population bigint unsigned DEFAULT NULL,
    type varchar(191) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_states_country (country_id),
    CONSTRAINT fk_states_country FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cities (
    id mediumint unsigned NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    country_id mediumint unsigned NOT NULL,
    country_code char(2) NOT NULL,
    country_name varchar(255) DEFAULT NULL,
    latitude decimal(10,8) NOT NULL,
    longitude decimal(11,8) NOT NULL,
    population bigint unsigned DEFAULT NULL,
    state_id mediumint unsigned NOT NULL,
    state_code varchar(255) NOT NULL,
    state_name varchar(255) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_cities_state (state_id),
    KEY idx_cities_country (country_id),
    CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states(id),
    CONSTRAINT fk_cities_country FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS challenges (
    id int NOT NULL AUTO_INCREMENT,
    question_text text NOT NULL,
    expected_query text NOT NULL,
    difficulty enum('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
    category varchar(100) NOT NULL,
    level enum('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
    hint text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_challenges_diff (difficulty),
    KEY idx_challenges_level (level),
    KEY idx_challenges_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
