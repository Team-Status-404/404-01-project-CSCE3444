"""
Unit tests for backend/models/market_scanner.py
Team 404 — David Oladipupo
Tests cover: start_market_scanner
All external dependencies (threading) are mocked to ensure non-blocking execution.
"""

import pytest
from unittest.mock import MagicMock, patch
from models.market_scanner import start_market_scanner

def test_start_market_scanner_valid_engine_starts_daemon_thread():
    """
    Verifies that calling start_market_scanner creates and starts a daemon thread
    without actually running the infinite scan_loop and blocking Pytest.
    """
    # Arrange
    mock_sentiment_engine = MagicMock()

    # Act & Assert
    # We patch threading.Thread where it is used in the market_scanner module
    with patch("models.market_scanner.threading.Thread") as mock_thread_class:
        
        # Call the function
        start_market_scanner(mock_sentiment_engine)

        # Assert a thread was created
        mock_thread_class.assert_called_once()
        
        # Extract the arguments passed to threading.Thread
        _, kwargs = mock_thread_class.call_args
        
        # Assert it was configured as a background daemon
        assert kwargs.get("daemon") is True
        
        # Assert a target function (scan_loop) was passed
        assert callable(kwargs.get("target"))

        # Assert the thread was actually started
        mock_thread_instance = mock_thread_class.return_value
        mock_thread_instance.start.assert_called_once()