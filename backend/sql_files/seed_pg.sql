-- =============================================================================
-- seed.sql  —  SQL Atlas  |  Sample Data
-- =============================================================================
-- PURPOSE:
--   Populates all tables with real-world geographic data for the game.
--   Run this AFTER schema.sql.
--
-- HOW TO RUN:
--   mysql -u root -p sql_atlas < database/seed.sql
--
-- NOTE:
--   This file contains a starter set of ~30 countries, ~40 cities, 10 rivers,
--   and 15 languages. The full dataset (150+ countries) should be imported
--   from the cleaned CSV files using the import_csv.py script.
--   This seed file is enough to develop and test all 20 challenges.
-- =============================================================================



-- Clear existing data in correct FK order (children before parents)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE country_languages;
TRUNCATE TABLE cities;
TRUNCATE TABLE rivers;
TRUNCATE TABLE challenges;
TRUNCATE TABLE languages;
TRUNCATE TABLE countries;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- COUNTRIES
-- =============================================================================
INSERT INTO countries (name, continent, area, population, gdp, capital, independence_year) VALUES
('France',          'Europe',   551695,   67000000,   2780000000000, 'Paris',         1792),
('Germany',         'Europe',   357114,   83000000,   4260000000000, 'Berlin',        1990),
('United Kingdom',  'Europe',   242495,   67000000,   3130000000000, 'London',        NULL),
('Spain',           'Europe',   505990,   47000000,   1420000000000, 'Madrid',        NULL),
('Italy',           'Europe',   301336,   60000000,   2100000000000, 'Rome',          1861),
('Portugal',        'Europe',    92212,   10000000,    237000000000, 'Lisbon',        1139),
('Netherlands',     'Europe',    41543,   17000000,    990000000000, 'Amsterdam',     1581),
('Sweden',          'Europe',   449964,   10000000,    593000000000, 'Stockholm',     1523),
('Norway',          'Europe',   385207,    5000000,    482000000000, 'Oslo',          1905),
('Denmark',         'Europe',    42924,    6000000,    395000000000, 'Copenhagen',    NULL),
('China',           'Asia',    9596960, 1400000000,  17700000000000, 'Beijing',       NULL),
('India',           'Asia',    3287263, 1380000000,   3730000000000, 'New Delhi',     1947),
('Japan',           'Asia',     377975,  126000000,   4940000000000, 'Tokyo',         NULL),
('South Korea',     'Asia',      99720,   52000000,   1800000000000, 'Seoul',         1945),
('Indonesia',       'Asia',    1904569,  270000000,   1190000000000, 'Jakarta',       1945),
('Brazil',          'South America', 8515767, 213000000, 1800000000000, 'Brasilia',  1822),
('Argentina',       'South America', 2780400,  45000000,  490000000000, 'Buenos Aires',1816),
('Colombia',        'South America',1141748,  50000000,  314000000000, 'Bogota',      1810),
('Peru',            'South America', 1285216,  32000000,  223000000000, 'Lima',        1821),
('Chile',           'South America',  756102,  19000000,  317000000000, 'Santiago',    1818),
('United States',   'North America',9372610, 331000000, 23000000000000,'Washington D.C.',1776),
('Canada',          'North America',9984670,  38000000,  2200000000000, 'Ottawa',      1867),
('Mexico',          'North America',1964375, 128000000,  1270000000000, 'Mexico City', 1810),
('Nigeria',         'Africa',    923768, 206000000,   448000000000,  'Abuja',         1960),
('Egypt',           'Africa',   1002450,  100000000,   394000000000, 'Cairo',         1922),
('South Africa',    'Africa',   1219090,   60000000,   419000000000, 'Pretoria',      1910),
('Kenya',           'Africa',    580367,   54000000,   106000000000, 'Nairobi',       1963),
('Australia',       'Oceania',  7692024,   26000000,  1700000000000, 'Canberra',      1901),
('New Zealand',     'Oceania',   268838,    5000000,   246000000000, 'Wellington',    1907),
('Saudi Arabia',    'Asia',     2149690,   35000000,   833000000000, 'Riyadh',        1932);

-- =============================================================================
-- CITIES
-- =============================================================================
INSERT INTO cities (name, country_id, population, is_capital) VALUES
-- Europe
('Paris',        (SELECT id FROM countries WHERE name='France'),         2161000, TRUE),
('Lyon',         (SELECT id FROM countries WHERE name='France'),          518000, FALSE),
('Berlin',       (SELECT id FROM countries WHERE name='Germany'),        3645000, TRUE),
('Munich',       (SELECT id FROM countries WHERE name='Germany'),        1472000, FALSE),
('London',       (SELECT id FROM countries WHERE name='United Kingdom'), 9000000, TRUE),
('Manchester',   (SELECT id FROM countries WHERE name='United Kingdom'), 2730000, FALSE),
('Madrid',       (SELECT id FROM countries WHERE name='Spain'),          3223000, TRUE),
('Barcelona',    (SELECT id FROM countries WHERE name='Spain'),          1620000, FALSE),
('Rome',         (SELECT id FROM countries WHERE name='Italy'),          2873000, TRUE),
('Milan',        (SELECT id FROM countries WHERE name='Italy'),          1352000, FALSE),
('Amsterdam',    (SELECT id FROM countries WHERE name='Netherlands'),     872000, TRUE),
('Stockholm',    (SELECT id FROM countries WHERE name='Sweden'),          975000, TRUE),
-- Asia
('Beijing',      (SELECT id FROM countries WHERE name='China'),         21540000, TRUE),
('Shanghai',     (SELECT id FROM countries WHERE name='China'),         24870000, FALSE),
('New Delhi',    (SELECT id FROM countries WHERE name='India'),         32940000, TRUE),
('Mumbai',       (SELECT id FROM countries WHERE name='India'),         20670000, FALSE),
('Tokyo',        (SELECT id FROM countries WHERE name='Japan'),         13960000, TRUE),
('Osaka',        (SELECT id FROM countries WHERE name='Japan'),          2691000, FALSE),
('Seoul',        (SELECT id FROM countries WHERE name='South Korea'),    9776000, TRUE),
('Jakarta',      (SELECT id FROM countries WHERE name='Indonesia'),     10560000, TRUE),
('Riyadh',       (SELECT id FROM countries WHERE name='Saudi Arabia'),   7680000, TRUE),
-- Americas
('Brasilia',     (SELECT id FROM countries WHERE name='Brazil'),         3039000, TRUE),
('Sao Paulo',    (SELECT id FROM countries WHERE name='Brazil'),        12330000, FALSE),
('Buenos Aires', (SELECT id FROM countries WHERE name='Argentina'),      3054000, TRUE),
('Washington D.C.', (SELECT id FROM countries WHERE name='United States'), 705000, TRUE),
('New York',     (SELECT id FROM countries WHERE name='United States'), 8336000, FALSE),
('Los Angeles',  (SELECT id FROM countries WHERE name='United States'), 3979000, FALSE),
('Ottawa',       (SELECT id FROM countries WHERE name='Canada'),          994000, TRUE),
('Toronto',      (SELECT id FROM countries WHERE name='Canada'),         2930000, FALSE),
('Mexico City',  (SELECT id FROM countries WHERE name='Mexico'),         9210000, TRUE),
-- Africa / Oceania
('Cairo',        (SELECT id FROM countries WHERE name='Egypt'),         10100000, TRUE),
('Nairobi',      (SELECT id FROM countries WHERE name='Kenya'),          4397000, TRUE),
('Abuja',        (SELECT id FROM countries WHERE name='Nigeria'),        3464000, TRUE),
('Lagos',        (SELECT id FROM countries WHERE name='Nigeria'),       14800000, FALSE),
('Pretoria',     (SELECT id FROM countries WHERE name='South Africa'),   2921000, TRUE),
('Canberra',     (SELECT id FROM countries WHERE name='Australia'),       453000, TRUE),
('Sydney',       (SELECT id FROM countries WHERE name='Australia'),      5312000, FALSE),
('Wellington',   (SELECT id FROM countries WHERE name='New Zealand'),     215000, TRUE);

-- =============================================================================
-- RIVERS
-- =============================================================================
INSERT INTO rivers (name, length_km, continent, outflow) VALUES
('Nile',          6650, 'Africa',        'Mediterranean Sea'),
('Amazon',        6400, 'South America', 'Atlantic Ocean'),
('Yangtze',       6300, 'Asia',          'East China Sea'),
('Mississippi',   6275, 'North America', 'Gulf of Mexico'),
('Yenisei',       5539, 'Asia',          'Kara Sea'),
('Yellow River',  5464, 'Asia',          'Bohai Sea'),
('Ob',            5410, 'Asia',          'Gulf of Ob'),
('Congo',         4700, 'Africa',        'Atlantic Ocean'),
('Amur',          4444, 'Asia',          'Sea of Okhotsk'),
('Lena',          4400, 'Asia',          'Laptev Sea'),
('Mekong',        4350, 'Asia',          'South China Sea'),
('Niger',         4180, 'Africa',        'Gulf of Guinea'),
('Rhine',         1230, 'Europe',        'North Sea'),
('Danube',        2860, 'Europe',        'Black Sea'),
('Volga',         3530, 'Europe',        'Caspian Sea');

-- =============================================================================
-- LANGUAGES
-- =============================================================================
INSERT INTO languages (name) VALUES
('English'), ('French'), ('German'), ('Spanish'), ('Portuguese'),
('Mandarin Chinese'), ('Hindi'), ('Arabic'), ('Japanese'), ('Korean'),
('Dutch'), ('Swedish'), ('Norwegian'), ('Danish'), ('Indonesian');

-- =============================================================================
-- COUNTRY_LANGUAGES  (which country speaks which language)
-- =============================================================================
INSERT INTO country_languages (country_id, language_id, is_official) VALUES
-- France
((SELECT id FROM countries WHERE name='France'), (SELECT id FROM languages WHERE name='French'), TRUE),
-- Germany
((SELECT id FROM countries WHERE name='Germany'), (SELECT id FROM languages WHERE name='German'), TRUE),
-- UK
((SELECT id FROM countries WHERE name='United Kingdom'), (SELECT id FROM languages WHERE name='English'), TRUE),
-- Spain
((SELECT id FROM countries WHERE name='Spain'), (SELECT id FROM languages WHERE name='Spanish'), TRUE),
-- Portugal
((SELECT id FROM countries WHERE name='Portugal'), (SELECT id FROM languages WHERE name='Portuguese'), TRUE),
-- Netherlands
((SELECT id FROM countries WHERE name='Netherlands'), (SELECT id FROM languages WHERE name='Dutch'), TRUE),
-- Sweden
((SELECT id FROM countries WHERE name='Sweden'), (SELECT id FROM languages WHERE name='Swedish'), TRUE),
-- Norway
((SELECT id FROM countries WHERE name='Norway'), (SELECT id FROM languages WHERE name='Norwegian'), TRUE),
-- Denmark
((SELECT id FROM countries WHERE name='Denmark'), (SELECT id FROM languages WHERE name='Danish'), TRUE),
-- China
((SELECT id FROM countries WHERE name='China'), (SELECT id FROM languages WHERE name='Mandarin Chinese'), TRUE),
-- India
((SELECT id FROM countries WHERE name='India'), (SELECT id FROM languages WHERE name='Hindi'), TRUE),
((SELECT id FROM countries WHERE name='India'), (SELECT id FROM languages WHERE name='English'), TRUE),
-- Japan
((SELECT id FROM countries WHERE name='Japan'), (SELECT id FROM languages WHERE name='Japanese'), TRUE),
-- South Korea
((SELECT id FROM countries WHERE name='South Korea'), (SELECT id FROM languages WHERE name='Korean'), TRUE),
-- Indonesia
((SELECT id FROM countries WHERE name='Indonesia'), (SELECT id FROM languages WHERE name='Indonesian'), TRUE),
-- Brazil
((SELECT id FROM countries WHERE name='Brazil'), (SELECT id FROM languages WHERE name='Portuguese'), TRUE),
-- Argentina, Colombia, Peru, Chile, Mexico
((SELECT id FROM countries WHERE name='Argentina'), (SELECT id FROM languages WHERE name='Spanish'), TRUE),
((SELECT id FROM countries WHERE name='Colombia'),  (SELECT id FROM languages WHERE name='Spanish'), TRUE),
((SELECT id FROM countries WHERE name='Peru'),      (SELECT id FROM languages WHERE name='Spanish'), TRUE),
((SELECT id FROM countries WHERE name='Chile'),     (SELECT id FROM languages WHERE name='Spanish'), TRUE),
((SELECT id FROM countries WHERE name='Mexico'),    (SELECT id FROM languages WHERE name='Spanish'), TRUE),
-- USA, Canada, Australia, New Zealand
((SELECT id FROM countries WHERE name='United States'), (SELECT id FROM languages WHERE name='English'), TRUE),
((SELECT id FROM countries WHERE name='Canada'),        (SELECT id FROM languages WHERE name='English'), TRUE),
((SELECT id FROM countries WHERE name='Canada'),        (SELECT id FROM languages WHERE name='French'),  TRUE),
((SELECT id FROM countries WHERE name='Australia'),     (SELECT id FROM languages WHERE name='English'), TRUE),
((SELECT id FROM countries WHERE name='New Zealand'),   (SELECT id FROM languages WHERE name='English'), TRUE),
-- Nigeria (English is official)
((SELECT id FROM countries WHERE name='Nigeria'),    (SELECT id FROM languages WHERE name='English'), TRUE),
-- Egypt, Saudi Arabia
((SELECT id FROM countries WHERE name='Egypt'),        (SELECT id FROM languages WHERE name='Arabic'), TRUE),
((SELECT id FROM countries WHERE name='Saudi Arabia'), (SELECT id FROM languages WHERE name='Arabic'), TRUE),
-- Kenya
((SELECT id FROM countries WHERE name='Kenya'),      (SELECT id FROM languages WHERE name='English'), TRUE),
-- South Africa
((SELECT id FROM countries WHERE name='South Africa'), (SELECT id FROM languages WHERE name='English'), TRUE);

-- =============================================================================
-- CHALLENGES  (20 questions: 7 easy, 7 medium, 6 hard)
-- =============================================================================
INSERT INTO challenges (question_text, expected_query, difficulty, hint) VALUES

-- ── EASY (WHERE with =) ──
('Show the population of France.',
 "SELECT population FROM countries WHERE name = 'France'",
 'easy', ' name = to filter by country name.'),

('Show the name and capital of Germany.',
 "SELECT name, capital FROM countries WHERE name = 'Germany'",
 'easy', 'Select the columns you need: name and capital.'),

('List all countries in Asia.',
 "SELECT name FROM countries WHERE continent = 'Asia'",
 'easy', 'Filter by the continent column.'),

('Show the area and population of Brazil.',
 "SELECT area, population FROM countries WHERE name = 'Brazil'",
 'easy', 'You need two columns: area and population.'),

('Show all details of Australia.',
 "SELECT * FROM countries WHERE name = 'Australia'",
 'easy', 'Use * to select all columns.'),

('How many countries are in the database?',
 "SELECT COUNT(*) AS total_countries FROM countries",
 'easy', '(*) to count rows.'),

('Show the name and continent of all countries, ordered alphabetically by name.',
 "SELECT name, continent FROM countries ORDER BY name ASC",
 'easy', ' BY column ASC to sort A→Z.'),

-- ── MEDIUM (IN, BETWEEN, ORDER BY, GROUP BY, LIMIT) ──
('Show the name and population of Sweden, Norway and Denmark.',
 "SELECT name, population FROM countries WHERE name IN ('Sweden', 'Norway', 'Denmark')",
 'medium', ' name IN (...) to match a list of values.'),

('List countries with a population between 50 million and 100 million.',
 "SELECT name, population FROM countries WHERE population BETWEEN 50000000 AND 100000000",
 'medium', ' low AND high for range checks.'),

('Show the 5 most populated countries.',
 "SELECT name, population FROM countries ORDER BY population DESC LIMIT 5",
 'medium', 'Sort DESC (largest first) and .'),

('Show the name and area of countries with area greater than 3,000,000 km², ordered by area descending.',
 "SELECT name, area FROM countries WHERE area > 3000000 ORDER BY area DESC",
 'medium', 'Combine WHERE and ORDER BY.'),

('How many countries are there on each continent? Show continent and count.',
 "SELECT continent, COUNT(*) AS country_count FROM countries GROUP BY continent ORDER BY country_count DESC",
 'medium', ' BY continent and COUNT(*).'),

('Show all cities in France.',
 "SELECT cities.name, cities.population FROM cities JOIN countries ON cities.country_id = countries.id WHERE countries.name = 'France'",
 'medium', 'JOIN cities with countries on country_id.'),

('Show the total population of all countries in Europe.',
 "SELECT SUM(population) AS europe_population FROM countries WHERE continent = 'Europe'",
 'medium', '() to add up all values in a column.'),

-- ── HARD (JOINs, subqueries, GROUP BY with HAVING) ──
('List all countries and their official language(s).',
 "SELECT countries.name AS country, languages.name AS language FROM countries JOIN country_languages ON countries.id = country_languages.country_id JOIN languages ON country_languages.language_id = languages.id WHERE country_languages.is_official = TRUE ORDER BY countries.name",
 'hard', 'You need two JOINs: countries → country_languages → languages.'),

('Show all cities with a population greater than 5 million, along with their country name.',
 "SELECT cities.name AS city, cities.population, countries.name AS country FROM cities JOIN countries ON cities.country_id = countries.id WHERE cities.population > 5000000 ORDER BY cities.population DESC",
 'hard', 'JOIN cities and countries, then filter on cities.population.'),

('Which continent has the highest total GDP? Show the continent and total GDP.',
 "SELECT continent, SUM(gdp) AS total_gdp FROM countries GROUP BY continent ORDER BY total_gdp DESC LIMIT 1",
 'hard', '(gdp), GROUP BY continent, then LIMIT 1 to get only the top.'),

('List countries that have more than one official language.',
 "SELECT countries.name, COUNT(country_languages.language_id) AS language_count FROM countries JOIN country_languages ON countries.id = country_languages.country_id WHERE country_languages.is_official = TRUE GROUP BY countries.name HAVING language_count > 1",
 'hard', ' BY + HAVING COUNT(...) > 1.'),

('Show the name and length of the top 3 longest rivers.',
 "SELECT name, length_km FROM rivers ORDER BY length_km DESC LIMIT 3",
 'hard', ' BY length_km DESC and LIMIT 3.'),

('List all capital cities and their population, ordered by population descending.',
 "SELECT cities.name AS capital, countries.name AS country, cities.population FROM cities JOIN countries ON cities.country_id = countries.id WHERE cities.is_capital = TRUE ORDER BY cities.population DESC",
 'hard', 'Filter WHERE is_capital = TRUE, then JOIN to get the country name.');
