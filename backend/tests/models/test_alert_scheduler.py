"""
Unit tests for backend/models/alert_scheduler.py
Team 404 — Krish Gautam
Tests cover: get_user_email, trigger_notification, check_alerts, record_daily_hype_scores, start_scheduler
All external dependencies (DB, SMTP, sentiment engine) are mocked.
"""

import pytest
from unittest.mock import patch, MagicMock, call
import os


# ==========================================
 # TESTS: get_user_email
# ==========================================

class TestGetUserEmail:

    @patch("models.alert_scheduler.get_db_connection")
    def test_get_user_email_valid_user_returns_email(self, mock_db):
        """Returns the correct email when user exists in the database."""
        from models.alert_scheduler import get_user_email

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_cur.fetchone.return_value = ("test@example.com",)
        mock_db.return_value = mock_conn

        result = get_user_email(111)

        assert result == "test@example.com"
        mock_cur.execute.assert_called_once_with(
            "SELECT email FROM users WHERE id = %s;", (111,)
        )

    @patch("models.alert_scheduler.get_db_connection")
    def test_get_user_email_user_not_found_returns_none(self, mock_db):
        """Returns None when user does not exist in the database."""
        from models.alert_scheduler import get_user_email

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_cur.fetchone.return_value = None
        mock_db.return_value = mock_conn

        result = get_user_email(999)

        assert result is None

    @patch("models.alert_scheduler.get_db_connection")
    def test_get_user_email_db_error_returns_none(self, mock_db):
        """Returns None when a database error occurs."""
        from models.alert_scheduler import get_user_email

        mock_db.side_effect = Exception("DB connection failed")

        result = get_user_email(111)

        assert result is None


# ==========================================
# TESTS: trigger_notification
# ==========================================

class TestTriggerNotification:

    @patch("models.alert_scheduler.smtplib.SMTP_SSL")
    @patch("models.alert_scheduler.get_user_email")
    @patch.dict(os.environ, {"ALERT_EMAIL": "stockiq@gmail.com", "ALERT_EMAIL_PASSWORD": "testpass"})
    def test_trigger_notification_valid_inputs_sends_email(self, mock_get_email, mock_smtp):
        """Sends email successfully when all inputs are valid."""
        from models.alert_scheduler import trigger_notification

        mock_get_email.return_value = "user@example.com"
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        trigger_notification(111, "NVDA", 85, 80, "above")

        mock_server.login.assert_called_once_with("stockiq@gmail.com", "testpass")
        mock_server.sendmail.assert_called_once()

    @patch("models.alert_scheduler.get_user_email")
    def test_trigger_notification_user_not_found_does_not_send_email(self, mock_get_email):
        """Does not attempt to send email when user email is not found."""
        from models.alert_scheduler import trigger_notification

        mock_get_email.return_value = None

        with patch("models.alert_scheduler.smtplib.SMTP_SSL") as mock_smtp:
            trigger_notification(999, "NVDA", 85, 80, "above")
            mock_smtp.assert_not_called()

    @patch("models.alert_scheduler.get_user_email")
    @patch.dict(os.environ, {}, clear=True)
    def test_trigger_notification_missing_env_credentials_does_not_send_email(self, mock_get_email):
        """Does not send email when ALERT_EMAIL or ALERT_EMAIL_PASSWORD are missing."""
        from models.alert_scheduler import trigger_notification

        mock_get_email.return_value = "user@example.com"

        with patch("models.alert_scheduler.smtplib.SMTP_SSL") as mock_smtp:
            trigger_notification(111, "NVDA", 85, 80, "above")
            mock_smtp.assert_not_called()

    @patch("models.alert_scheduler.smtplib.SMTP_SSL")
    @patch("models.alert_scheduler.get_user_email")
    @patch.dict(os.environ, {"ALERT_EMAIL": "stockiq@gmail.com", "ALERT_EMAIL_PASSWORD": "testpass"})
    def test_trigger_notification_smtp_error_does_not_raise(self, mock_get_email, mock_smtp):
        """Handles SMTP errors gracefully without raising an exception."""
        from models.alert_scheduler import trigger_notification

        mock_get_email.return_value = "user@example.com"
        mock_smtp.return_value.__enter__.side_effect = Exception("SMTP failed")

        # Should not raise
        trigger_notification(111, "NVDA", 85, 80, "above")


# ==========================================
# TESTS: check_alerts
# ==========================================

class TestCheckAlerts:

    @patch("models.alert_scheduler.trigger_notification")
    @patch("models.alert_scheduler.get_db_connection")
    def test_check_alerts_score_above_threshold_triggers_notification(self, mock_db, mock_notify):
        """Calls trigger_notification when hype score is above threshold."""
        from models.alert_scheduler import check_alerts

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_cur.fetchall.return_value = [(111, "NVDA", 80, "above")]
        mock_db.return_value = mock_conn

        mock_engine = MagicMock()
        mock_engine.calculateHypeScore.return_value = {"hype_score": 85}

        check_alerts(mock_engine)

        mock_notify.assert_called_once_with(111, "NVDA", 85, 80, "above")

    @patch("models.alert_scheduler.trigger_notification")
    @patch("models.alert_scheduler.get_db_connection")
    def test_check_alerts_score_below_threshold_triggers_notification(self, mock_db, mock_notify):
        """Calls trigger_notification when hype score is below threshold."""
        from models.alert_scheduler import check_alerts

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_cur.fetchall.return_value = [(111, "NVDA", 30, "below")]
        mock_db.return_value = mock_conn

        mock_engine = MagicMock()
        mock_engine.calculateHypeScore.return_value = {"hype_score": 20}

        check_alerts(mock_engine)

        mock_notify.assert_called_once_with(111, "NVDA", 20, 30, "below")

    @patch("models.alert_scheduler.trigger_notification")
    @patch("models.alert_scheduler.get_db_connection")
    def test_check_alerts_score_not_breached_does_not_trigger_notification(self, mock_db, mock_notify):
        """Does not call trigger_notification when threshold is not breached."""
        from models.alert_scheduler import check_alerts

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_cur.fetchall.return_value = [(111, "NVDA", 90, "above")]
        mock_db.return_value = mock_conn

        mock_engine = MagicMock()
        mock_engine.calculateHypeScore.return_value = {"hype_score": 50}

        check_alerts(mock_engine)

        mock_notify.assert_not_called()

    @patch("models.alert_scheduler.trigger_notification")
    @patch("models.alert_scheduler.get_db_connection")
    def test_check_alerts_no_active_alerts_does_not_trigger_notification(self, mock_db, mock_notify):
        """Does not call trigger_notification when there are no active alerts."""
        from models.alert_scheduler import check_alerts

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_cur.fetchall.return_value = []
        mock_db.return_value = mock_conn

        mock_engine = MagicMock()

        check_alerts(mock_engine)

        mock_notify.assert_not_called()

    @patch("models.alert_scheduler.trigger_notification")
    @patch("models.alert_scheduler.get_db_connection")
    def test_check_alerts_db_error_does_not_raise(self, mock_db, mock_notify):
        """Handles database errors gracefully without raising an exception."""
        from models.alert_scheduler import check_alerts

        mock_db.side_effect = Exception("DB connection failed")
        mock_engine = MagicMock()

        # Should not raise
        check_alerts(mock_engine)
        mock_notify.assert_not_called()


# ==========================================
# TESTS: record_daily_hype_scores
# ==========================================

class TestRecordDailyHypeScores:

    @patch("models.alert_scheduler.get_db_connection")
    def test_record_daily_hype_scores_inserts_score_for_each_ticker(self, mock_db):
        """Inserts a hype score record for each active ticker."""
        from models.alert_scheduler import record_daily_hype_scores

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_cur.fetchall.return_value = [("NVDA",), ("AAPL",)]
        mock_db.return_value = mock_conn

        mock_engine = MagicMock()
        mock_engine.calculateHypeScore.side_effect = [
            {"hype_score": 75},
            {"hype_score": 60},
        ]

        record_daily_hype_scores(mock_engine)

        assert mock_engine.calculateHypeScore.call_count == 2

    @patch("models.alert_scheduler.get_db_connection")
    def test_record_daily_hype_scores_no_tickers_does_nothing(self, mock_db):
        """Does nothing when there are no active tickers in the watchlist."""
        from models.alert_scheduler import record_daily_hype_scores

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_cur.fetchall.return_value = []
        mock_db.return_value = mock_conn

        mock_engine = MagicMock()

        record_daily_hype_scores(mock_engine)

        mock_engine.calculateHypeScore.assert_not_called()

    @patch("models.alert_scheduler.get_db_connection")
    def test_record_daily_hype_scores_db_error_does_not_raise(self, mock_db):
        """Handles database errors gracefully without raising an exception."""
        from models.alert_scheduler import record_daily_hype_scores

        mock_db.side_effect = Exception("DB connection failed")
        mock_engine = MagicMock()

        # Should not raise
        record_daily_hype_scores(mock_engine)


# ==========================================
# TESTS: start_scheduler
# ==========================================

class TestStartScheduler:

    @patch("models.alert_scheduler.BackgroundScheduler")
    def test_start_scheduler_adds_two_jobs(self, mock_scheduler_class):
        """Adds exactly two jobs to the scheduler — alert checker and daily recorder."""
        from models.alert_scheduler import start_scheduler

        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        mock_engine = MagicMock()
        start_scheduler(mock_engine)

        assert mock_scheduler.add_job.call_count == 2

    @patch("models.alert_scheduler.BackgroundScheduler")
    def test_start_scheduler_starts_the_scheduler(self, mock_scheduler_class):
        """Calls scheduler.start() when start_scheduler is invoked."""
        from models.alert_scheduler import start_scheduler

        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        mock_engine = MagicMock()
        start_scheduler(mock_engine)

        mock_scheduler.start.assert_called_once()

    @patch("models.alert_scheduler.BackgroundScheduler")
    def test_start_scheduler_returns_scheduler_instance(self, mock_scheduler_class):
        """Returns the scheduler instance after starting."""
        from models.alert_scheduler import start_scheduler

        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        mock_engine = MagicMock()
        result = start_scheduler(mock_engine)

        assert result == mock_scheduler