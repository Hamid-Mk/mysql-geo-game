import os
from dotenv import load_dotenv

load_dotenv()

# We will use DB_CONNECTION string like the reference project
db_connection = os.environ.get('DB_CONNECTION')
origins = os.environ.get('ORIGINS', '*')
admin_password_hash = os.environ.get('ADMIN_PASSWORD_HASH', '')
