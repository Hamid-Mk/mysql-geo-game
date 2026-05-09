import psycopg
from fastapi import HTTPException
import config
from psycopg.rows import dict_row

def connect_to_database():
    try:
        connection = psycopg.connect(config.db_connection, row_factory=dict_row)
        return connection
    except psycopg.Error as error:
        print("Error connecting to the database:", error)
        return None

def execute_sql_query(sql_query, query_parameters=None):
    connection = connect_to_database()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(sql_query, query_parameters)

                if sql_query.strip().upper().startswith("SELECT"):
                    # Execute SELECT queries for GET requests
                    result = cursor.fetchall()
                else:
                    # Non-SELECT queries are automatically committed when the 'with connection' block finishes
                    result = True
                return result
    except psycopg.Error as exception:
        print("Error executing SQL query:", exception)
        raise HTTPException(status_code=500, detail=str(exception))
    finally:
        connection.close()
