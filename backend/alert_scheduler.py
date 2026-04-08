import os
from apscheduler.schedulers.background import BackgroundScheduler
from models.portfolio import get_db_connection
from models.user_management import get_db_connection

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

        # Fetch all active alerts that have a threshold set
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
                # Get the current hype score from the sentiment engine
                result = sentiment_engine.calculateHypeScore(ticker)
                current_score = result.get("hype_score", 0)

                print(f"[Scheduler] {ticker} — Score: {current_score}, Threshold: {hype_threshold}, Direction: {direction}")

                # Check if threshold is breached
                breached = (
                    (direction == "above" and current_score >= hype_threshold) or
                    (direction == "below" and current_score <= hype_threshold)
                )

                if breached:
                    print(f"[Scheduler] 🚨 ALERT TRIGGERED — {ticker} score {current_score} is {direction} {hype_threshold} for user {user_id}")
                    trigger_notification(user_id, ticker, current_score, hype_threshold, direction)

            except Exception as e:
                print(f"[Scheduler] Error checking {ticker}: {e}")

    except Exception as e:
        print(f"[Scheduler] Database error: {e}")
    finally:
        if conn:
            conn.close()


def trigger_notification(user_id, ticker, current_score, threshold, direction):
    """
    Subtask 4 — Notification engine.
    Called when a threshold is breached.
    Currently logs to terminal. Email/push can be added here.
    """
    message = (
        f"🚨 StockIQ Alert: {ticker} Hype Score is {current_score}, "
        f"which is {direction} your threshold of {threshold}!"
    )
    print(f"[Notification] User {user_id}: {message}")
    # TODO: add email/push notification here in subtask 4


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