import os
import re
import smtplib # added for sending reset emails to the user
from email.mime.text import MIMEText # added for sending reset emails to the user
from email.mime.multipart import MIMEMultipart # added for sending reset emails to the user
import secrets
import datetime
import bcrypt
import jwt
import psycopg2
from psycopg2 import errors
from typing import Dict, Any
from functools import wraps
from flask import request, jsonify
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timezone, timedelta

load_dotenv()

# Email configuration fallback
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME") 
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") 
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

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


# added helper function to handle sending reset emails to users
def _send_reset_email(to_email: str, token: str):
    """Sends the reset email, or prints to terminal if SMTP is not configured."""
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    # fallback if the username and password details are not retrieved
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("\n*** WARNING: SMTP credentials not set in .env. Falling back to terminal. ***")
        print(f"*** SIMULATED EMAIL TO {to_email} ***\nClick to reset: {reset_link}\n")
        return

    msg = MIMEMultipart()
    msg['From'] = SMTP_USERNAME
    msg['To'] = to_email
    msg['Subject'] = "StockIQ Password Reset"

    body = f"""
    Hello,

    You recently requested to reset the password for your StockIQ account.
    Please click the link below to securely set a new password. 
    
    This link is valid for 30 minutes:
    {reset_link}

    If you did not request this reset, you can safely ignore this email.

    Best regards,
    The StockIQ Team
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Secure the connection
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent reset email to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")

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
        # --- PASSWORD SECURITY STANDARDS CHECK ---
        if len(password_raw) < 8:
            return {"status": "error", "message": "Password must be at least 8 characters."}
        if len(password_raw) > 72:
            return {"status": "error", "message": "Password must be at most 72 characters."}
        if not re.search(r'[!@#$%^&*()\-_=+\[\]{};\':"\\|,.<>/?`~]', password_raw):
            return {"status": "error", "message": "Password must contain at least one special character."}
        
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

    @classmethod
    def generate_reset_token(cls, email: str) -> Dict[str, Any]:
        """Generates a secure reset token for the given email and saves it to the DB."""
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()

            # 1. Check if user exists
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            user = cur.fetchone()

            if user:
                # Only generates the token and sends the email IF the user exists
                # 2. Generate token and expiration
                reset_token = secrets.token_urlsafe(32)
                expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

                # 3. Save to database
                cur.execute(
                    """
                    UPDATE users 
                    SET reset_token = %s, reset_token_expires_at = %s 
                    WHERE email = %s
                    """,
                    (reset_token, expires_at, email)
                )
                conn.commit()

                # 4. Send reset email to user
                _send_reset_email(email, reset_token)

            # Always return a generic success message to prevent email enumeration
            return {
                "status": "success",
                "message": "If that email is in our system, a reset link has been sent."
            }

        except Exception as e:
            if conn:
                conn.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            if conn:
                cur.close()
                conn.close()

    @classmethod
    def reset_password_with_token(cls, token: str, new_password: str) -> Dict[str, Any]:
        """Validates token and updates the password."""
        conn = None
        try:
            # 1. Validate password strength (matches existing updateProfile constraints)
            if len(new_password) < 8: 
                return {"status": "error", "message": "Password must be at least 8 characters."}
            if len(new_password) > 72:  # Set to bcrypt's maximum byte limit
                return {"status": "error", "message": "Password must be at most 72 characters."}
            if not re.search(r'[!@#$%^&*()\-_=+\[\]{};\':"\\|,.<>/?`~]', new_password):
                return {"status": "error", "message": "Password must contain at least one special character."}

            conn = get_db_connection()
            cur = conn.cursor()

            # 2. Validate token existence and check expiration
            current_time = datetime.now(timezone.utc)
            cur.execute(
                """
                SELECT id FROM users 
                WHERE reset_token = %s AND reset_token_expires_at > %s
                """,
                (token, current_time)
            )
            user = cur.fetchone()

            if not user:
                return {"status": "error", "message": "Invalid or expired token"}

            # 3. Securely encrypt the new password
            hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            # 4. Update the database and clear the token
            cur.execute(
                """
                UPDATE users 
                SET password = %s, reset_token = NULL, reset_token_expires_at = NULL 
                WHERE id = %s
                """,
                (hashed_password, user[0])
            )
            conn.commit()

            return {"status": "success", "message": "Password has been successfully reset."}

        except Exception as e:
            if conn:
                conn.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            if conn:
                cur.close()
                conn.close()


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
