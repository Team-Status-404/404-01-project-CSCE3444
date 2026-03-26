import os
import psycopg2
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Database connection helper
def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


class User:
    def __init__(self, user_id: int, username: str, email: str):
        # Mapped to the 'users' table schema.
        # Note: user_id is now an 'int', and we added 'username'.
        self._userID: int = user_id
        self._username: str = username
        self._email: str = email
        
        # Security Best Practice: DO NOT store the password_hash in the active 
        # Python object. Once they are authenticated, the object only needs their identity.

    @classmethod # The "@classmethod" here ensure that the function belongs to the class, not a specific user."
    def register(cls, username: str, email: str, password_raw: str) -> Dict[str, Any]:
        """
        [LANCE'S DOMAIN]
        Registers a new user in the database.
        Usage: User.register("david_o", "david@test.com", "Password123")
        """
        # TODO for Lance:
        # 1. Hash the 'password_raw' (e.g., using bcrypt). NEVER store plain text!
        # 2. Connect to the DB using get_db_connection().
        # 3. INSERT INTO users (username, email, password) VALUES (...).
        # 4. Use the 'RETURNING id' SQL clause to grab the newly generated ID. (we are letting Supabase handle generating IDs)
        # 5. Return the new ID so the frontend can log them in immediately.
        
        return {"status": "pending", "message": "Lance is building this!"}

    @classmethod
    def login(cls, email: str, password_raw: str) -> Dict[str, Any]:
        """
        For Lance to implement
        Verifies credentials and logs the user in.
        """
        # TODO for Lance:
        # 1. Connect to the DB and fetch the user record (id, username, password_hash) by email.
        # 2. If no user is found, return an error.
        # 3. Compare 'password_raw' against the stored 'password_hash' using bcrypt.checkpw().
        # 4. If they match, return {"status": "success", "user_data": {id, username, email}}.
        # 5. If they don't match, return an "Invalid credentials" error.
        
        return {"status": "pending", "message": "Lance is building this!"}

    def delete_account(self) -> Dict[str, Any]:
        """
        For Lance to implement
        Deletes the user from the database entirely.
        """
        # TODO for Lance:
        # Connect to DB and run: DELETE FROM users WHERE id = self._userID;
        # Note: Because we used 'ON DELETE CASCADE' in the database schema, 
        # this will automatically wipe their watchlist data too! No extra code needed.
        
        return {"status": "pending", "message": "Lance is building this!"}

    def updateProfile(self, new_username: str = None, new_email: str = None) -> Dict[str, Any]:
        """
        Updates the user's information. Yasas already built the frontend ui for this, so I'll take care of the actuall backend stuff
        """
        # TODO for David:
        # 1. Connect to the database using get_db_connection().
        # 2. Write an UPDATE query targeting the 'users' table where id = self._userID.
        # 3. You can update the username, the email, or both depending on what Yasas sends.
        # 4. If the database update is successful, update self._username and self._email.
        # 5. Catch 'UniqueViolation' errors in case they pick an email that is already taken!
        
        return {"status": "pending", "message": "David is building this!"}