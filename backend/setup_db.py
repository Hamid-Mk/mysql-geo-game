import os
import subprocess
import getpass
from dotenv import load_dotenv

def run_setup():
    print("==================================================")
    print(" SQL Atlas - Automated Database Setup ")
    print("==================================================")
    
    # 1. Load config
    load_dotenv(".env")
    port = os.getenv("DB_PORT", "3307")
    
    print("\nTo set up the database, we need your MySQL 'root' password.")
    print("If you don't have a password, just press Enter.")
    root_password = getpass.getpass("Enter MySQL root password: ")
    
    # Base mysql command
    base_cmd = ["mysql", "-u", "root", f"-P{port}"]
    if root_password:
        base_cmd.append(f"-p{root_password}")
        
    # Re-create database from scratch to avoid 'Table already exists' errors
    print("\n🧹 Resetting the database for a clean installation...")
    reset_cmd = f'mysql -u root -P {port} '
    if root_password:
        reset_cmd += f'-p"{root_password}" '
    reset_cmd += '-e "DROP DATABASE IF EXISTS sql_atlas; CREATE DATABASE sql_atlas;"'
    
    subprocess.run(reset_cmd, shell=True)

    # The files to import in order
    files_to_import = [
        ("../comperhensive_sql_database/countries.sql", "sql_atlas"),
        ("../comperhensive_sql_database/states.sql", "sql_atlas"),
        ("../comperhensive_sql_database/cities.sql", "sql_atlas"),
        ("../database/schema.sql", "sql_atlas"), 
        ("../database/challenges_seed.sql", "sql_atlas"),
    ]
    
    print("\nStarting import... (This may take 1-2 minutes for cities.sql)")
    
    for filepath, db_name in files_to_import:
        if not os.path.exists(filepath):
            print(f"❌ Error: File not found: {filepath}")
            continue
            
        print(f"⏳ Importing {filepath}...")
        
        # Build the command string for subprocess shell
        # e.g.: mysql -u root -pPassword -P3307 sql_atlas < path/to/file.sql
        cmd_str = f'mysql -u root -P {port} '
        if root_password:
            # Wrap password in quotes in case of special characters
            cmd_str += f'-p"{root_password}" '
        
        if db_name:
            cmd_str += f'{db_name} '
            
        cmd_str += f'< "{filepath}"'
        
        try:
            result = subprocess.run(cmd_str, shell=True, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"❌ Failed to import {filepath}")
                print(f"Error details: {result.stderr}")
                return
            else:
                print(f"✅ Successfully imported {filepath}")
        except Exception as e:
            print(f"❌ Unexpected error running command: {e}")
            return
            
    print("\n🎉 Setup Complete! You can now start your uvicorn server.")
    print("Make sure your backend/.env still has DB_USER=student_reader and DB_PASSWORD=student_pass")

if __name__ == "__main__":
    run_setup()
