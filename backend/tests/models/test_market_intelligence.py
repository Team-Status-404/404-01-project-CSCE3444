"""
Unit tests for backend/models/market_intelligence.py
Team 404
All external dependencies (DB, APIs, yfinance) are mocked.
"""

import pytest
from unittest.mock import patch, MagicMock


@patch("models.market_intelligence.get_db_connection")
def test_calculate_hype_score_cache_hit_returns_cached_result(mock_db):
    """Returns cached hype score directly from DB without calling external APIs."""
    from models.market_intelligence import SentimentAnalyzer

    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_conn.cursor.return_value = mock_cur
    mock_cur.fetchone.return_value = (50, 10, 0.25, 62, "Neutral")
    mock_db.return_value = mock_conn

    mock_vader = MagicMock()
    analyzer = SentimentAnalyzer(mock_vader, "newskey")
    result = analyzer.calculateHypeScore("AAPL")

    assert result["cached"] is True
    assert result["hype_score"] == 62
    assert result["tag"] == "Neutral"
    assert result["ticker"] == "AAPL"
