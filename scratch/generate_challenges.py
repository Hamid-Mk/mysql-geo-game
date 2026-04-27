import os
import json

challenges = [
    # Category 1: Absolute Beginner (14 questions)
    ("Select everything from the countries table.", "SELECT * FROM countries;", "easy", "Absolute Beginner", "Use SELECT *"),
    ("List the names of all countries.", "SELECT name FROM countries;", "easy", "Absolute Beginner", "Select just the name column"),
    ("Find all columns for cities.", "SELECT * FROM cities;", "easy", "Absolute Beginner", "Use SELECT * on the cities table"),
    ("List all city names.", "SELECT name FROM cities;", "easy", "Absolute Beginner", "Select just the name column from cities"),
    ("Show the first 5 countries.", "SELECT * FROM countries LIMIT 5;", "easy", "Absolute Beginner", "Use LIMIT 5"),
    ("Show the first 10 city names.", "SELECT name FROM cities LIMIT 10;", "easy", "Absolute Beginner", "Use LIMIT 10"),
    ("List all countries ordered by name alphabetically.", "SELECT * FROM countries ORDER BY name ASC;", "medium", "Absolute Beginner", "Use ORDER BY name ASC"),
    ("List all countries ordered by population from highest to lowest.", "SELECT * FROM countries ORDER BY population DESC;", "medium", "Absolute Beginner", "Use ORDER BY population DESC"),
    ("List the top 5 largest countries by area.", "SELECT name, area FROM countries ORDER BY area DESC LIMIT 5;", "medium", "Absolute Beginner", "Combine ORDER BY and LIMIT"),
    ("List the top 3 most populated cities.", "SELECT name, population FROM cities ORDER BY population DESC LIMIT 3;", "medium", "Absolute Beginner", "Combine ORDER BY and LIMIT on cities"),
    ("Show all unique continents from the countries table (use region column).", "SELECT DISTINCT region FROM countries;", "hard", "Absolute Beginner", "Use the DISTINCT keyword"),
    ("List the unique subregions present in the countries table.", "SELECT DISTINCT subregion FROM countries;", "hard", "Absolute Beginner", "Use DISTINCT on subregion"),
    ("List the top 10 richest countries by GDP.", "SELECT name, gdp FROM countries ORDER BY gdp DESC LIMIT 10;", "hard", "Absolute Beginner", "Sort by GDP descending"),
    ("List country names and their capitals ordered by capital name.", "SELECT name, capital FROM countries ORDER BY capital ASC;", "hard", "Absolute Beginner", "Select two columns and sort by one of them"),

    # Category 2: WHERE + SCALAR FUNCTIONS (15 questions)
    ("Find the country with the name 'Japan'.", "SELECT * FROM countries WHERE name = 'Japan';", "easy", "WHERE + Scalar Functions", "Use WHERE name = 'Japan'"),
    ("Find the city named 'Paris'.", "SELECT * FROM cities WHERE name = 'Paris';", "easy", "WHERE + Scalar Functions", "Use WHERE name = 'Paris'"),
    ("Find all countries in the 'Asia' region.", "SELECT name FROM countries WHERE region = 'Asia';", "easy", "WHERE + Scalar Functions", "Use WHERE region = 'Asia'"),
    ("List all cities in the country code 'FR'.", "SELECT name FROM cities WHERE country_code = 'FR';", "easy", "WHERE + Scalar Functions", "Use WHERE country_code = 'FR'"),
    ("Find countries with a population greater than 100,000,000.", "SELECT name, population FROM countries WHERE population > 100000000;", "medium", "WHERE + Scalar Functions", "Use > 100000000"),
    ("Find cities with a population between 1,000,000 and 5,000,000.", "SELECT name, population FROM cities WHERE population BETWEEN 1000000 AND 5000000;", "medium", "WHERE + Scalar Functions", "Use BETWEEN"),
    ("List countries whose names start with 'Z'.", "SELECT name FROM countries WHERE name LIKE 'Z%';", "medium", "WHERE + Scalar Functions", "Use LIKE 'Z%'"),
    ("List cities whose names end with 'burg'.", "SELECT name FROM cities WHERE name LIKE '%burg';", "medium", "WHERE + Scalar Functions", "Use LIKE '%burg'"),
    ("Find all countries where the capital is NULL.", "SELECT name FROM countries WHERE capital IS NULL;", "medium", "WHERE + Scalar Functions", "Use IS NULL"),
    ("Find countries that use the 'Euro' as currency.", "SELECT name FROM countries WHERE currency_name = 'Euro';", "medium", "WHERE + Scalar Functions", "Filter by currency_name"),
    ("Show the name of each country in uppercase letters.", "SELECT UPPER(name) FROM countries;", "hard", "WHERE + Scalar Functions", "Use the UPPER() function"),
    ("Find the length of each country's name.", "SELECT name, LENGTH(name) FROM countries;", "hard", "WHERE + Scalar Functions", "Use the LENGTH() function"),
    ("List countries in 'Europe' with population > 50,000,000.", "SELECT name FROM countries WHERE region = 'Europe' AND population > 50000000;", "hard", "WHERE + Scalar Functions", "Use AND"),
    ("List countries that are either in 'Oceania' or 'Antarctica'.", "SELECT name FROM countries WHERE region IN ('Oceania', 'Antarctica');", "hard", "WHERE + Scalar Functions", "Use IN operator"),
    ("Find countries whose GDP is not null and population is less than 1,000,000.", "SELECT name FROM countries WHERE gdp IS NOT NULL AND population < 1000000;", "hard", "WHERE + Scalar Functions", "Combine IS NOT NULL and <"),

    # Category 3: JOINS (15 questions)
    ("List city names and their corresponding state names.", "SELECT cities.name, states.name FROM cities INNER JOIN states ON cities.state_id = states.id;", "easy", "Joins", "Join cities and states on state_id"),
    ("List city names and their corresponding country names.", "SELECT cities.name, countries.name FROM cities INNER JOIN countries ON cities.country_id = countries.id;", "easy", "Joins", "Join cities and countries on country_id"),
    ("Show all states and the country they belong to.", "SELECT states.name, countries.name FROM states INNER JOIN countries ON states.country_id = countries.id;", "easy", "Joins", "Join states and countries"),
    ("List all cities in the state of 'California'.", "SELECT cities.name FROM cities INNER JOIN states ON cities.state_id = states.id WHERE states.name = 'California';", "medium", "Joins", "Join cities and states, add WHERE clause"),
    ("Find all cities in the country 'Canada'.", "SELECT cities.name FROM cities INNER JOIN countries ON cities.country_id = countries.id WHERE countries.name = 'Canada';", "medium", "Joins", "Join cities and countries, filter by country name"),
    ("Show states in the 'Asia' region.", "SELECT states.name FROM states INNER JOIN countries ON states.country_id = countries.id WHERE countries.region = 'Asia';", "medium", "Joins", "Join states and countries, filter by region"),
    ("List cities, their states, and their countries.", "SELECT cities.name, states.name, countries.name FROM cities INNER JOIN states ON cities.state_id = states.id INNER JOIN countries ON cities.country_id = countries.id;", "medium", "Joins", "Use two INNER JOINs"),
    ("Find all cities located in the subregion 'Southern Europe'.", "SELECT cities.name FROM cities INNER JOIN countries ON cities.country_id = countries.id WHERE countries.subregion = 'Southern Europe';", "medium", "Joins", "Join cities and countries, filter subregion"),
    ("List all countries and their states, including countries without states.", "SELECT countries.name, states.name FROM countries LEFT JOIN states ON countries.id = states.country_id;", "hard", "Joins", "Use a LEFT JOIN from countries to states"),
    ("List all states and their cities, including states without cities.", "SELECT states.name, cities.name FROM states LEFT JOIN cities ON states.id = cities.state_id;", "hard", "Joins", "Use a LEFT JOIN from states to cities"),
    ("Find countries that have no states listed.", "SELECT countries.name FROM countries LEFT JOIN states ON countries.id = states.country_id WHERE states.id IS NULL;", "hard", "Joins", "Use LEFT JOIN and WHERE states.id IS NULL"),
    ("Find states that have no cities listed.", "SELECT states.name FROM states LEFT JOIN cities ON states.id = cities.state_id WHERE cities.id IS NULL;", "hard", "Joins", "Use LEFT JOIN and WHERE cities.id IS NULL"),
    ("List cities in countries that use the 'Euro'.", "SELECT cities.name FROM cities INNER JOIN countries ON cities.country_id = countries.id WHERE countries.currency_name = 'Euro';", "hard", "Joins", "Join and filter by currency"),
    ("Show pairs of cities that are in the same state (Self Join).", "SELECT c1.name, c2.name FROM cities c1 INNER JOIN cities c2 ON c1.state_id = c2.state_id WHERE c1.id < c2.id LIMIT 10;", "hard", "Joins", "Join cities table to itself on state_id"),
    ("List countries and the number of states they have (using JOIN).", "SELECT countries.name, COUNT(states.id) FROM countries LEFT JOIN states ON countries.id = states.country_id GROUP BY countries.id;", "hard", "Joins", "LEFT JOIN countries and states, use COUNT and GROUP BY"),

    # Category 4: SUBQUERIES (14 questions)
    ("Find the city with the largest population using a subquery.", "SELECT name FROM cities WHERE population = (SELECT MAX(population) FROM cities);", "easy", "Subqueries", "WHERE population = (SELECT MAX(population) ...)"),
    ("Find the country with the smallest area.", "SELECT name FROM countries WHERE area = (SELECT MIN(area) FROM countries);", "easy", "Subqueries", "Use a subquery to find MIN(area)"),
    ("Find cities in the same country as 'Tokyo'.", "SELECT name FROM cities WHERE country_id = (SELECT country_id FROM cities WHERE name = 'Tokyo');", "easy", "Subqueries", "Find country_id of Tokyo in a subquery"),
    ("Find states in the same country as the state 'Texas'.", "SELECT name FROM states WHERE country_id = (SELECT country_id FROM states WHERE name = 'Texas');", "medium", "Subqueries", "Find country_id of Texas first"),
    ("List all cities in countries located in 'South America'.", "SELECT name FROM cities WHERE country_id IN (SELECT id FROM countries WHERE region = 'South America');", "medium", "Subqueries", "Use WHERE country_id IN (...)"),
    ("Find countries that have at least one city with a population > 10,000,000.", "SELECT name FROM countries WHERE id IN (SELECT country_id FROM cities WHERE population > 10000000);", "medium", "Subqueries", "Use IN with a subquery on cities"),
    ("List states that belong to countries using the 'United States dollar'.", "SELECT name FROM states WHERE country_id IN (SELECT id FROM countries WHERE currency_name = 'United States dollar');", "medium", "Subqueries", "Use IN with a subquery on countries"),
    ("Find the country with the highest GDP.", "SELECT name FROM countries WHERE gdp = (SELECT MAX(gdp) FROM countries);", "medium", "Subqueries", "Find the MAX(gdp) first"),
    ("Find the country name of the city 'Sydney'.", "SELECT name FROM countries WHERE id = (SELECT country_id FROM cities WHERE name = 'Sydney' LIMIT 1);", "hard", "Subqueries", "Subquery inside cities to find country_id"),
    ("Find cities whose population is greater than the average city population.", "SELECT name FROM cities WHERE population > (SELECT AVG(population) FROM cities);", "hard", "Subqueries", "Compare population to AVG(population)"),
    ("Find countries whose GDP is below the average GDP.", "SELECT name FROM countries WHERE gdp < (SELECT AVG(gdp) FROM countries);", "hard", "Subqueries", "Compare gdp to AVG(gdp)"),
    ("List the names of countries and the ratio of their population to the world population.", "SELECT name, population / (SELECT SUM(population) FROM countries) FROM countries;", "hard", "Subqueries", "Use a subquery in the SELECT clause to get total population"),
    ("Show cities in the state with the highest population.", "SELECT name FROM cities WHERE state_id = (SELECT id FROM states ORDER BY population DESC LIMIT 1);", "hard", "Subqueries", "Find state_id with highest population"),
    ("Find countries that have states with a population over 20,000,000.", "SELECT name FROM countries WHERE id IN (SELECT country_id FROM states WHERE population > 20000000);", "hard", "Subqueries", "Subquery on states population"),

    # Category 5: SET FUNCTIONS (14 questions)
    ("Count the total number of countries.", "SELECT COUNT(*) FROM countries;", "easy", "Set Functions", "Use COUNT(*)"),
    ("Count the total number of cities.", "SELECT COUNT(*) FROM cities;", "easy", "Set Functions", "Use COUNT(*) on cities"),
    ("Count how many countries have a known capital.", "SELECT COUNT(capital) FROM countries;", "easy", "Set Functions", "Use COUNT(capital)"),
    ("Find the total global population.", "SELECT SUM(population) FROM countries;", "easy", "Set Functions", "Use SUM(population)"),
    ("Find the average country population.", "SELECT AVG(population) FROM countries;", "medium", "Set Functions", "Use AVG()"),
    ("Find the largest country area.", "SELECT MAX(area) FROM countries;", "medium", "Set Functions", "Use MAX()"),
    ("Find the smallest country population.", "SELECT MIN(population) FROM countries;", "medium", "Set Functions", "Use MIN()"),
    ("Find the total population of all cities in the database.", "SELECT SUM(population) FROM cities;", "medium", "Set Functions", "Use SUM() on cities population"),
    ("Calculate the average GDP of countries.", "SELECT AVG(gdp) FROM countries;", "medium", "Set Functions", "Use AVG(gdp)"),
    ("Find the total area of all countries in 'Europe'.", "SELECT SUM(area) FROM countries WHERE region = 'Europe';", "hard", "Set Functions", "Combine SUM() with WHERE"),
    ("Count how many cities are in the country 'Japan' (using JOIN).", "SELECT COUNT(cities.id) FROM cities INNER JOIN countries ON cities.country_id = countries.id WHERE countries.name = 'Japan';", "hard", "Set Functions", "JOIN cities and countries, then COUNT"),
    ("Find the average city population in 'India' (using JOIN).", "SELECT AVG(cities.population) FROM cities INNER JOIN countries ON cities.country_id = countries.id WHERE countries.name = 'India';", "hard", "Set Functions", "JOIN and AVG()"),
    ("Find the maximum city population in the 'United States'.", "SELECT MAX(cities.population) FROM cities INNER JOIN countries ON cities.country_id = countries.id WHERE countries.name = 'United States';", "hard", "Set Functions", "JOIN and MAX()"),
    ("Count the number of distinct currencies used in the world.", "SELECT COUNT(DISTINCT currency) FROM countries;", "hard", "Set Functions", "Use COUNT(DISTINCT ...)"),

    # Category 6: CORRELATED SUBQUERIES (14 questions)
    ("Find countries whose population is greater than the average population of their region.", "SELECT name FROM countries c1 WHERE population > (SELECT AVG(population) FROM countries c2 WHERE c1.region = c2.region);", "medium", "Correlated Subqueries", "Subquery must match c1.region = c2.region"),
    ("Find cities whose population is greater than the average population of cities in their country.", "SELECT name FROM cities c1 WHERE population > (SELECT AVG(population) FROM cities c2 WHERE c1.country_id = c2.country_id);", "medium", "Correlated Subqueries", "Match country_id in subquery"),
    ("List countries that have at least one city.", "SELECT name FROM countries c WHERE EXISTS (SELECT 1 FROM cities ci WHERE ci.country_id = c.id);", "medium", "Correlated Subqueries", "Use EXISTS"),
    ("List states that have at least one city.", "SELECT name FROM states s WHERE EXISTS (SELECT 1 FROM cities ci WHERE ci.state_id = s.id);", "medium", "Correlated Subqueries", "Use EXISTS for states and cities"),
    ("Find countries with no cities listed in the database.", "SELECT name FROM countries c WHERE NOT EXISTS (SELECT 1 FROM cities ci WHERE ci.country_id = c.id);", "medium", "Correlated Subqueries", "Use NOT EXISTS"),
    ("Find states with no cities listed in the database.", "SELECT name FROM states s WHERE NOT EXISTS (SELECT 1 FROM cities ci WHERE ci.state_id = s.id);", "hard", "Correlated Subqueries", "Use NOT EXISTS for states"),
    ("List the names of countries and their largest city's population.", "SELECT c.name, (SELECT MAX(population) FROM cities ci WHERE ci.country_id = c.id) FROM countries c;", "hard", "Correlated Subqueries", "Subquery in SELECT clause"),
    ("List the names of states and their total city population.", "SELECT s.name, (SELECT SUM(population) FROM cities ci WHERE ci.state_id = s.id) FROM states s;", "hard", "Correlated Subqueries", "Subquery in SELECT clause summing population"),
    ("Find the city with the largest population in each country.", "SELECT ci.name FROM cities ci WHERE ci.population = (SELECT MAX(population) FROM cities ci2 WHERE ci.country_id = ci2.country_id);", "hard", "Correlated Subqueries", "Compare population to max of that country_id"),
    ("Find countries whose GDP is greater than the average GDP of their subregion.", "SELECT name FROM countries c1 WHERE gdp > (SELECT AVG(gdp) FROM countries c2 WHERE c1.subregion = c2.subregion);", "hard", "Correlated Subqueries", "Correlate on subregion"),
    ("Find the state with the highest population in each country.", "SELECT s.name FROM states s WHERE s.population = (SELECT MAX(population) FROM states s2 WHERE s.country_id = s2.country_id);", "hard", "Correlated Subqueries", "Match state population to max of its country"),
    ("List cities that are the only city listed for their state.", "SELECT ci.name FROM cities ci WHERE 1 = (SELECT COUNT(*) FROM cities ci2 WHERE ci.state_id = ci2.state_id);", "hard", "Correlated Subqueries", "Count must equal 1 for that state_id"),
    ("Find countries where all their states have a population > 100,000.", "SELECT name FROM countries c WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND (s.population <= 100000 OR s.population IS NULL));", "hard", "Correlated Subqueries", "Use NOT EXISTS for states failing the condition"),
    ("Find countries having a city with population > 5 million.", "SELECT name FROM countries c WHERE EXISTS (SELECT 1 FROM cities ci WHERE ci.country_id = c.id AND ci.population > 5000000);", "hard", "Correlated Subqueries", "Use EXISTS with population condition"),

    # Category 7: GROUP BY (14 questions)
    ("Count the number of countries in each region.", "SELECT region, COUNT(*) FROM countries GROUP BY region;", "easy", "Group By", "GROUP BY region"),
    ("Count the number of countries in each subregion.", "SELECT subregion, COUNT(*) FROM countries GROUP BY subregion;", "easy", "Group By", "GROUP BY subregion"),
    ("Find the total population of each region.", "SELECT region, SUM(population) FROM countries GROUP BY region;", "easy", "Group By", "SUM(population) and GROUP BY region"),
    ("Count the number of cities in each country (by country_id).", "SELECT country_id, COUNT(*) FROM cities GROUP BY country_id;", "easy", "Group By", "GROUP BY country_id in cities"),
    ("Count the number of states in each country (by country_id).", "SELECT country_id, COUNT(*) FROM states GROUP BY country_id;", "medium", "Group By", "GROUP BY country_id in states"),
    ("Find the average GDP of countries in each region.", "SELECT region, AVG(gdp) FROM countries GROUP BY region;", "medium", "Group By", "AVG(gdp) and GROUP BY region"),
    ("Find the maximum country area in each subregion.", "SELECT subregion, MAX(area) FROM countries GROUP BY subregion;", "medium", "Group By", "MAX(area) and GROUP BY subregion"),
    ("Find the total city population for each state_id.", "SELECT state_id, SUM(population) FROM cities GROUP BY state_id;", "medium", "Group By", "SUM(population) and GROUP BY state_id"),
    ("List regions that have more than 30 countries.", "SELECT region, COUNT(*) FROM countries GROUP BY region HAVING COUNT(*) > 30;", "hard", "Group By", "Use HAVING COUNT(*) > 30"),
    ("Find subregions where the average country population is over 50,000,000.", "SELECT subregion, AVG(population) FROM countries GROUP BY subregion HAVING AVG(population) > 50000000;", "hard", "Group By", "Use HAVING AVG(population) > 50000000"),
    ("Count the number of cities in each country, showing the country name (using JOIN).", "SELECT countries.name, COUNT(cities.id) FROM countries INNER JOIN cities ON countries.id = cities.country_id GROUP BY countries.name;", "hard", "Group By", "JOIN countries and cities, GROUP BY country name"),
    ("Find countries that have more than 100 cities listed.", "SELECT countries.name, COUNT(cities.id) FROM countries INNER JOIN cities ON countries.id = cities.country_id GROUP BY countries.name HAVING COUNT(cities.id) > 100;", "hard", "Group By", "JOIN, GROUP BY, and HAVING > 100"),
    ("List states and their total city population, only for states with total city population > 5,000,000.", "SELECT states.name, SUM(cities.population) FROM states INNER JOIN cities ON states.id = cities.state_id GROUP BY states.name HAVING SUM(cities.population) > 5000000;", "hard", "Group By", "JOIN, GROUP BY, and HAVING on SUM"),
    ("Find regions where the total GDP is greater than 1,000,000.", "SELECT region, SUM(gdp) FROM countries GROUP BY region HAVING SUM(gdp) > 1000000;", "hard", "Group By", "GROUP BY region and HAVING SUM(gdp)")
]

with open(r"c:\skill\my-sql-game\sql-atlas\database\challenges_seed.sql", "w", encoding="utf-8") as f:
    f.write("-- 100 SQL Challenges Seed File\n")
    f.write("USE sql_atlas;\n")
    f.write("DELETE FROM challenges;\n")
    f.write("ALTER TABLE challenges AUTO_INCREMENT = 1;\n\n")
    
    for q in challenges:
        question = q[0].replace("'", "''")
        query = q[1].replace("'", "''")
        diff = q[2]
        cat = q[3].replace("'", "''")
        hint = q[4].replace("'", "''")
        
        sql = f"INSERT INTO challenges (question_text, expected_query, difficulty, category, hint) VALUES ('{question}', '{query}', '{diff}', '{cat}', '{hint}');\n"
        f.write(sql)

print(f"Generated {len(challenges)} challenges.")
