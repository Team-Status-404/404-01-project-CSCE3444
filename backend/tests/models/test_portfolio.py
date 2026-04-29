from unittest.mock import MagicMock, patch

@patch("models.portfolio.get_db_connection")
def test_remove_stock_not_in_watchlist(mock_conn):
    """TC-003: Removing a stock not in the watchlist returns an error."""
    mock_cursor = MagicMock()
    mock_cursor.rowcount = 0
    mock_conn.return_value.cursor.return_value = mock_cursor

    from models.portfolio import WatchList
    wl = WatchList(user_id=1)
    result = wl.removeTicker("GOOG")

    assert result["status"] == "error"
    assert "not found" in result["message"]