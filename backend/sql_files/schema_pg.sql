


CREATE TABLE IF NOT EXISTS countries (
    id SERIAL,
    name varchar(100) NOT NULL,
    iso2 char(2) DEFAULT NULL,
    iso3 char(3) DEFAULT NULL,
    capital varchar(255) DEFAULT NULL,
    currency varchar(255) DEFAULT NULL,
    currency_name varchar(255) DEFAULT NULL,
    gdp bigint DEFAULT NULL,
    latitude decimal(10,8) DEFAULT NULL,
    longitude decimal(11,8) DEFAULT NULL,
    nationality varchar(255) DEFAULT NULL,
    phonecode varchar(255) DEFAULT NULL,
    population bigint DEFAULT NULL,
    region varchar(255) DEFAULT NULL,
    subregion varchar(255) DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS states (
    id SERIAL,
    name varchar(255) NOT NULL,
    country_id integer NOT NULL,
    country_code char(2) NOT NULL,
    country_name varchar(255) DEFAULT NULL,
    latitude decimal(10,8) DEFAULT NULL,
    longitude decimal(11,8) DEFAULT NULL,
    population bigint DEFAULT NULL,
    type varchar(191) DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_states_country FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS cities (
    id SERIAL,
    name varchar(255) NOT NULL,
    country_id integer NOT NULL,
    country_code char(2) NOT NULL,
    country_name varchar(255) DEFAULT NULL,
    latitude decimal(10,8) NOT NULL,
    longitude decimal(11,8) NOT NULL,
    population bigint DEFAULT NULL,
    state_id integer NOT NULL,
    state_code varchar(255) NOT NULL,
    state_name varchar(255) DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states(id),
    CONSTRAINT fk_cities_country FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL,
    question_text text NOT NULL,
    expected_query text NOT NULL,
    difficulty varchar(50) NOT NULL DEFAULT 'easy',
    category varchar(100) NOT NULL,
    level varchar(50) NOT NULL DEFAULT 'Beginner',
    hint text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
