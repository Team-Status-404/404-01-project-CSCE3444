import os
import psycopg2
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# We use the direct Postgres Connection String provided by Supabase
# Add this to your .env file as DATABASE_URL=postgresql://postgres...
def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

class WatchList:
    def __init__(self, user_id: int):
        self._userID: int = user_id

    # helper function
    def checkLimit(self) -> int:
        """Counts how many stocks the user is watching in the database."""
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute("SELECT COUNT(*) FROM watchlist WHERE user_id = %s;", (self._userID,))
            count = cur.fetchone()[0]
            
            cur.close()
            return count
        except Exception as e:
            print(f"DEBUG DB Error checking limit: {e}")
            return 5  # Failsafe: block inserts if DB is down
        finally:
            if conn is not None:
                conn.close()
               
    # helper function 
    def get_all_tickers(self) -> list:
        """Returns a list of ticker strings for the user."""
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT ticker FROM watchlist WHERE user_id = %s;", (self._userID,))
            rows = cur.fetchall()
            cur.close()
            
            # Extracts the first item from each tuple returned by the DB
            return [row[0] for row in rows] 
        except Exception as e:
            print(f"DEBUG DB Error fetching tickers: {e}")
            return []
        finally:
            if conn is not None:
                conn.close()

    def addTicker(self, ticker: str) -> Dict[str, Any]:
        """Enforces the 5-stock limit and inserts into the watchlist table."""
        ticker = ticker.upper()
        
        # 1. Enforce the limit
        if self.checkLimit() >= 5:
            return {"status": "error", "message": "Limit reached. You can only track a maximum of 5 stocks."}

        # 2. Add to database
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute(
                "INSERT INTO watchlist (user_id, ticker) VALUES (%s, %s);", 
                (self._userID, ticker)
            )
            
            conn.commit()
            cur.close()
            return {"status": "success", "message": f"{ticker} successfully added to watchlist."}
            
        except psycopg2.errors.ForeignKeyViolation:
            if conn: conn.rollback()
            return {"status": "error", "message": f"Cannot add {ticker}. It must be viewed/saved to the database first."}
        except psycopg2.errors.UniqueViolation:
            if conn: conn.rollback()
            return {"status": "error", "message": f"{ticker} is already in your watchlist."}
        except Exception as e:
            if conn: conn.rollback()
            return {"status": "error", "message": f"Database error: {str(e)}"}
        finally:
            if conn is not None:
                conn.close()

    def removeTicker(self, ticker: str) -> Dict[str, Any]:
        """Removes a ticker from the user's watchlist."""
        ticker = ticker.upper()
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute(
                "DELETE FROM watchlist WHERE user_id = %s AND ticker = %s;", 
                (self._userID, ticker)
            )
            
            if cur.rowcount == 0:
                return {"status": "error", "message": f"{ticker} was not found in your watchlist."}
                
            conn.commit()
            cur.close()
            return {"status": "success", "message": f"{ticker} removed from watchlist."}
            
        except Exception as e:
            if conn: conn.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            if conn is not None:
                conn.close()


class Alerts:
    def __init__(self, user_id: int, ticker_symbol: str):
        self._userID: int = user_id
        self._tickerSymbol: str = ticker_symbol.upper()

    def toggleAlert(self, is_enabled: bool) -> Dict[str, Any]:
        """Updates the alert_enabled boolean in the watchlist table."""
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute(
                "UPDATE watchlist SET alert_enabled = %s WHERE user_id = %s AND ticker = %s;",
                (is_enabled, self._userID, self._tickerSymbol)
            )
            
            if cur.rowcount == 0:
                return {"status": "error", "message": "Could not update alert. Is this stock in your watchlist?"}
                
            conn.commit()
            cur.close()
            
            state = "enabled" if is_enabled else "disabled"
            return {"status": "success", "message": f"Alerts {state} for {self._tickerSymbol}."}
            
        except Exception as e:
            if conn: conn.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            if conn is not None:
                conn.close()