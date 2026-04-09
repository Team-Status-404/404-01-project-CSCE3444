import os
import re
import datetime
import bcrypt
import jwt
import psycopg2
from psycopg2 import errors
from typing import Dict, Any, Optional
from functools import wraps
from flask import request, jsonify
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timezone, timedelta

load_dotenv()

# change this by putting it to .env once deployed (fine for now since we're using a dev env)
JWT_SECRET = os.getenv("JWT_SECRET", "stockiq-dev-secret-change-in-prod")
JWT_EXPIRATION_HOURS = 24
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# db connection helper function bcz the conn is bricking for some reason
def get_db_connection():
    url = os.getenv("DATABASE_URL")
    if url:
        return psycopg2.connect(url)
    # Fallback: build connection from individual env vars
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


"""We are now able to use @token_required, under any route in our app.py to protect the route from unauthorized users"""
def token_required(f):
    """Decorator that protects routes by requiring a valid JWT in the Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({"status": "error", "message": "Missing auth token"}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.current_user_id = payload["user_id"]
            request.current_username = payload["username"]
        except jwt.ExpiredSignatureError:
            return jsonify({"status": "error", "message": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status": "error", "message": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated


"""Creates a user token specific to the user, after they enter their username and password"""
def _generate_token(user_id: int, username: str) -> str:
    """Creates a JWT containing user identity with an expiration time."""
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


class User:
    def __init__(self, user_id: int, username: str, email: str):
        self._userID: int = user_id
        self._username: str = username
        self._email: str = email

    @classmethod
    def register(cls, username: str, email: str, password_raw: str) -> Dict[str, Any]:
        """
        Registers a new user in the database.
        Usage: User.register("david_o", "david@test.com", "Password123")
        """
        #hash w/ bcrypt
        password_hash = bcrypt.hashpw(password_raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # conn to db, append to db, then return user id
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id",
                (username, email, password_hash),
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()

            # return data + JWT so the frontend can log them in immediately
            token = _generate_token(new_id, username)
            return {
                "status": "success",
                "user_id": new_id,
                "username": username,
                "email": email,
                "token": token,
            }
        except errors.UniqueViolation:
            if conn:
                conn.rollback()
            return {"status": "error", "message": "Username or email already exists"}
        except Exception as e:
            if conn:
                conn.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            if conn:
                conn.close()

    @classmethod
    def login(cls, email: str, password_raw: str) -> Dict[str, Any]:
        """Verifies credentials and logs the user in."""
        conn = None
        try:
            # grab user record by email
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                "SELECT id, username, password FROM users WHERE email = %s",
                (email,),
            )
            row = cur.fetchone()
            cur.close()

            # 2. if user doesnt exist
            if row is None:
                return {"status": "error", "message": "Invalid credentials"}

            user_id, username, stored_hash = row

            # 3. compare entered pw and hashed pw
            if not bcrypt.checkpw(password_raw.encode("utf-8"), stored_hash.encode("utf-8")):
                return {"status": "error", "message": "Invalid credentials"}

            # 4. if valid, generate the JWT
            token = _generate_token(user_id, username)
            return {
                "status": "success",
                "user_id": user_id,
                "username": username,
                "email": email,
                "token": token,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            if conn:
                conn.close()

    @classmethod
    def google_login(cls, google_credential: str) -> Dict[str, Any]:
        """Verifies a Google OAuth credential token and logs the user in (or auto-registers)."""
        try:
            # verify token
            idinfo = id_token.verify_oauth2_token(
                google_credential, google_requests.Request(), GOOGLE_CLIENT_ID
            )
            google_email = idinfo["email"]
            google_name = idinfo.get("name", google_email.split("@")[0])
        except ValueError:
            return {"status": "error", "message": "Invalid Google token"}

        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()

            # check if google email used already in db
            cur.execute("SELECT id, username FROM users WHERE email = %s", (google_email,))
            row = cur.fetchone()

            if row:
                # if exists, log in
                user_id, username = row
                is_new_user = False # Tag as existing user
            else:
                # if new user, auto register — ensure the username is unique
                placeholder_hash = bcrypt.hashpw(os.urandom(32), bcrypt.gensalt()).decode("utf-8")
                base_name = google_name
                username = base_name
                suffix = 1
                while True:
                    cur.execute("SELECT 1 FROM users WHERE username = %s", (username,))
                    if cur.fetchone() is None:
                        break
                    username = f"{base_name}{suffix}"
                    suffix += 1
                cur.execute(
                    "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id",
                    (username, google_email, placeholder_hash),
                )
                user_id = cur.fetchone()[0]
                conn.commit()
                is_new_user = True # Tag as brand new user

            cur.close()
            token = _generate_token(user_id, username)
            return {
                "status": "success",
                "user_id": user_id,
                "username": username,
                "email": google_email,
                "token": token,
                "is_new_user": is_new_user, # Pass the flag to the frontend
            }
        except Exception as e:
            if conn:
                conn.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            if conn:
                conn.close()

    def reset_password(self) -> Dict[str, Any]:
        """Need a function to reset the user password, please implement this Lance"""
        pass


    def delete_account(self) -> Dict[str, Any]:
        """Deletes the user from the database using user_id (ON DELETE CASCADE applies)."""
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()

            cur.execute("DELETE FROM users WHERE id = %s", (self._userID,))

            if cur.rowcount == 0:
                return {"status": "error", "message": "No user found"}

            conn.commit()
            cur.close()

            return {"status": "success", "message": "Account deleted"}

        except Exception as e:
            if conn:
                conn.rollback()
            return {"status": "error", "message": str(e)}

        finally:
            if conn:
                conn.close()


    def updateProfile(
        self,
        new_username: str = None,
        new_email: str = None,
        new_password: str = None,
    ) -> Dict[str, Any]:
        """Updates the user's profile fields (username, email, password)."""
        conn = None
        try:
            fields = []
            params = []

            if new_username is not None:
                fields.append("username = %s")
                params.append(new_username)

            if new_email is not None:
                fields.append("email = %s")
                params.append(new_email)

            if new_password is not None:
                if len(new_password) < 6:
                    return {"status": "error", "message": "Password must be at least 6 characters."}
                if len(new_password) > 10:
                    return {"status": "error", "message": "Password must be at most 10 characters."}
                if not re.search(r'[!@#$%^&*()\-_=+\[\]{};\':"\\|,.<>/?`~]', new_password):
                    return {"status": "error", "message": "Password must contain at least one special character."}
                hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                fields.append("password = %s")
                params.append(hashed)

            if not fields:
                return {"status": "error", "message": "No fields to update"}

            params.append(self._userID)
            query = "UPDATE users SET " + ", ".join(fields) + " WHERE id = %s"

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(query, tuple(params))
            conn.commit()
            cur.close()

            if new_username is not None:
                self._username = new_username
            if new_email is not None:
                self._email = new_email

            return {
                "status": "success",
                "message": "Profile updated",
                "username": self._username,
                "email": self._email,
            }
        except errors.UniqueViolation:
            if conn:
                conn.rollback()
            return {"status": "error", "message": "Username or email already exists"}
        except Exception as e:
            if conn:
                conn.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            if conn:
                conn.close()
