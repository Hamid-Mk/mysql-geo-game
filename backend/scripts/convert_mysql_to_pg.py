import os
import re

SQL_DIR = r"C:\skill\my-sql-game\sci-fi version\mysql-geo-game\backend\sql_files"

def convert_mysql_to_postgres(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # 1. Remove backticks
    content = content.replace('`', '')
    
    # 2. Fix data types
    content = re.sub(r'\bmediumint(?:\s+unsigned)?\b', 'integer', content, flags=re.IGNORECASE)
    content = re.sub(r'\bint(?:\s+unsigned)?\b', 'integer', content, flags=re.IGNORECASE)
    content = re.sub(r'\bbigint(?:\s+unsigned)?\b', 'bigint', content, flags=re.IGNORECASE)
    content = re.sub(r'\btinyint\([0-9]+\)', 'smallint', content, flags=re.IGNORECASE)
    content = re.sub(r'\btinyint\b', 'smallint', content, flags=re.IGNORECASE)
    
    # 3. Fix AUTO_INCREMENT and SERIAL combos
    content = re.sub(r'\bAUTO_INCREMENT\b', 'SERIAL', content, flags=re.IGNORECASE)
    content = re.sub(r'\binteger\s+NOT\s+NULL\s+SERIAL\b', 'SERIAL', content, flags=re.IGNORECASE)
    content = re.sub(r'\bbigint\s+NOT\s+NULL\s+SERIAL\b', 'BIGSERIAL', content, flags=re.IGNORECASE)
    
    # 3.5 Fix MySQL ENUM to VARCHAR
    content = re.sub(r'\benum\([^)]+\)', 'varchar(50)', content, flags=re.IGNORECASE)
    
    # 4. Remove ENGINE and CHARSET stuff
    content = re.sub(r'\) ENGINE=InnoDB.*?;', ');', content, flags=re.IGNORECASE)
    
    # 5. Fix string escaping (\' -> '')
    # This is tricky because replacing all \' might hit edge cases, but for standard inserts it's necessary.
    content = content.replace(r"\'", "''")

    # 6. Fix CHARACTER SET and COLLATE inline
    content = re.sub(r'\s+CHARACTER SET [a-zA-Z0-9_]+\s+COLLATE [a-zA-Z0-9_]+', '', content, flags=re.IGNORECASE)

    # 7. Remove CREATE DATABASE and USE statements
    content = re.sub(r'CREATE DATABASE IF NOT EXISTS [a-zA-Z0-9_]+;?', '', content, flags=re.IGNORECASE)
    content = re.sub(r'USE [a-zA-Z0-9_]+;?', '', content, flags=re.IGNORECASE)

    # 8. Remove inline MySQL KEY declarations (and their leading commas) to prevent Postgres trailing comma errors
    # Matches ", KEY index_name (column)" across newlines
    content = re.sub(r',\s*KEY\s+[a-zA-Z0-9_]+\s*\([^)]+\)', '', content, flags=re.IGNORECASE)

    new_filepath = filepath.replace('.sql', '_pg.sql')
    with open(new_filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Converted {os.path.basename(filepath)} -> {os.path.basename(new_filepath)}")

if __name__ == "__main__":
    for filename in os.listdir(SQL_DIR):
        if filename.endswith(".sql") and not filename.endswith("_pg.sql"):
            convert_mysql_to_postgres(os.path.join(SQL_DIR, filename))
