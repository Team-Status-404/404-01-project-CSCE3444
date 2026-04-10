import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from apscheduler.schedulers.background import BackgroundScheduler
from models.user_management import get_db_connection


def get_user_email(user_id):
    """Fetches the user's email from the database."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT email FROM users WHERE id = %s;", (user_id,))
        row = cur.fetchone()
        cur.close()
        return row[0] if row else None
    except Exception as e:
        print(f"[Notification] Error fetching email: {e}")
        return None
    finally:
        if conn:
            conn.close()


def trigger_notification(user_id, ticker, current_score, threshold, direction):
    """
    Notification engine — sends email when threshold is breached.
    """
    # Always log to terminal
    print(f"[Notification] 🚨 {ticker} score {current_score} is {direction} threshold {threshold} for user {user_id}")

    # Get user email from database
    user_email = get_user_email(user_id)
    if not user_email:
        print(f"[Notification] Could not find email for user {user_id}")
        return

    # Email config from .env
    sender_email = os.getenv("ALERT_EMAIL")
    sender_password = os.getenv("ALERT_EMAIL_PASSWORD")

    if not sender_email or not sender_password:
        print("[Notification] Email credentials not set in .env")
        return

    # Build the email
    subject = f"🚨 StockIQ Alert: {ticker} Hype Score is {direction} {threshold}!"
    body = f"""
Hello,

Your StockIQ alert has been triggered!

Stock: {ticker}
Current Hype Score: {current_score}
Your Threshold: {threshold}
Direction: {direction}

The Hype Score is currently {direction} your set threshold of {threshold}.
Log in to StockIQ to take action.

- StockIQ Team
stockiq.alerts@gmail.com
    """

    try:
        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = user_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Send via Gmail SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, user_email, msg.as_string())

        print(f"[Notification] ✅ Email sent to {user_email}")

    except Exception as e:
        print(f"[Notification] ❌ Failed to send email: {e}")


def check_alerts(sentiment_engine):
    """
    Runs every 5 minutes. Fetches all active alerts and checks
    if any hype scores have crossed their thresholds.
    """
    print("[Scheduler] Checking active alerts...")
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT user_id, ticker, hype_threshold, direction
            FROM watchlist
            WHERE alert_enabled = TRUE
            AND hype_threshold IS NOT NULL
            AND direction IS NOT NULL;
        """)
        active_alerts = cur.fetchall()
        cur.close()

        if not active_alerts:
            print("[Scheduler] No active alerts found.")
            return

        for user_id, ticker, hype_threshold, direction in active_alerts:
            try:
                result = sentiment_engine.calculateHypeScore(ticker)
                current_score = result.get("hype_score", 0)

                print(f"[Scheduler] {ticker} — Score: {current_score}, Threshold: {hype_threshold}, Direction: {direction}")

                breached = (
                    (direction == "above" and current_score >= hype_threshold) or
                    (direction == "below" and current_score <= hype_threshold)
                )

                if breached:
                    trigger_notification(user_id, ticker, current_score, hype_threshold, direction)

            except Exception as e:
                print(f"[Scheduler] Error checking {ticker}: {e}")

    except Exception as e:
        print(f"[Scheduler] Database error: {e}")
    finally:
        if conn:
            conn.close()


def start_scheduler(sentiment_engine):
    """
    Starts the background scheduler when Flask starts.
    Runs check_alerts every 5 minutes.
    """
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=lambda: check_alerts(sentiment_engine),
        trigger="interval",
        minutes=5,
        id="alert_checker",
        replace_existing=True,
    )
    scheduler.start()
    print("[Scheduler] Alert checker started — running every 5 minutes.")
    return scheduler