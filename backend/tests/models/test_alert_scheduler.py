"""
Unit tests for trigger_notification() in backend/models/alert_scheduler.py
Team 404 — Krish Gautam
"""

import pytest
from unittest.mock import patch, MagicMock
import os


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