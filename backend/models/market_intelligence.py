import os
import requests
import time
from curl_cffi import requests as curl_requests
import psycopg2
from psycopg2 import errors
import yfinance as yf
from datetime import datetime
from typing import List, Dict, Any, Tuple
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


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

class Stock:
    def __init__(self, ticker_symbol: str):
        self._tickerSymbol: str = ticker_symbol.upper()
        self._companyName: str = "N/A"
        self._currentPrice: float = 0.0
        self._movingAverage5Day: float = 0.0
        self._sector: str = None
        self._volatility: float = None
        # NEW PROPERTIES
        self._volume: int = None
        self._marketCap: int = None
        self._fiftyTwoWeekHigh: float = None
        self._fiftyTwoWeekLow: float = None

    def fetch_stock_data(self) -> Dict[str, Any]:
        """
        Attempts to fetch data using FMP first, falls back to yfinance.
        Includes full profile mapping for the updated database schema.
        """
        conn = None
        
        # 1. --- READ FROM DATABASE CACHE ---
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """
                SELECT company_name, sector, current_price, volatility, 
                       moving_average_5_day, volume, market_cap, 
                       fifty_two_week_high, fifty_two_week_low 
                FROM stocks 
                WHERE ticker = %s AND last_updated >= NOW() - INTERVAL '5 minutes'
                """,
                (self._tickerSymbol,)
            )
            cached_row = cur.fetchone()
            cur.close()
            
            if cached_row:
                (self._companyName, self._sector, self._currentPrice, self._volatility,
                 self._movingAverage5Day, self._volume, self._marketCap,
                 self._fiftyTwoWeekHigh, self._fiftyTwoWeekLow) = cached_row
                
                return {
                    "status": "success", "source": "database_cache", "cached": True,
                    "data": self._get_data_dict()
                }
        except Exception as e:
            print(f"DEBUG: Stock Cache Read Error: {e}")
        finally:
            if conn: conn.close()

        # 2. --- FETCH FRESH DATA ---
        api_key = os.getenv("FINANCE_DATA_KEY")
        if not api_key:
            return {"status": "error", "message": "Missing API Key."}

        fresh_data = None
        try:
            # --- PRIMARY API: Financial Modeling Prep ---
            profile_url = f"https://financialmodelingprep.com/stable/profile?symbol={self._tickerSymbol}&apikey={api_key}"
            profile_resp = requests.get(profile_url)
            
            if profile_resp.status_code == 402:
                fresh_data = self._fallback_yfinance()
            elif profile_resp.status_code == 200:
                profile_data = profile_resp.json()
                if profile_data:
                    p = profile_data[0]
                    self._companyName = p.get('companyName', self._tickerSymbol)
                    self._sector = p.get('sector')
                    self._marketCap = p.get('mcap')
                    self._volume = p.get('volAvg')
                    # 52-week range often comes in a 'range' string (e.g. "120.5-190.2")
                    # but FMP usually provides explicit fields in the profile or quote
                    price_range = p.get('range', "").split("-")
                    if len(price_range) == 2:
                        self._fiftyTwoWeekLow = float(price_range[0])
                        self._fiftyTwoWeekHigh = float(price_range[1])

                    # --- HISTORICAL DATA ---
                    history_url = f"https://financialmodelingprep.com/stable/historical-price-eod/full?symbol={self._tickerSymbol}&apikey={api_key}"
                    history_resp = requests.get(history_url)
                    if history_resp.status_code == 200:
                        h_data = history_resp.json()
                        if h_data:
                            self._currentPrice = round(h_data[0]['close'], 2)
                            recent = h_data[:5]
                            closes = [d['close'] for d in recent]
                            self._movingAverage5Day = round(sum(closes) / 5, 2)
                            ranges = [(d['high'] - d['low']) / d['close'] for d in recent]
                            self._volatility = round((sum(ranges) / 5) * 100, 2)
                            
                            fresh_data = {"status": "success", "source": "fmp", "data": self._get_data_dict()}
                else:
                    fresh_data = self._fallback_yfinance()
        except Exception as e:
            print(f"DEBUG: FMP Error: {e}")
            fresh_data = self._fallback_yfinance()

        # 3. --- SAVE TO DATABASE ---
        if fresh_data and fresh_data.get("status") == "success":
            self._save_to_db()
            fresh_data["cached"] = False

        return fresh_data

    def _get_data_dict(self) -> Dict[str, Any]:
        """Helper to return the current state as a dictionary."""
        return {
            "ticker": self._tickerSymbol, "companyName": self._companyName,
            "sector": self._sector, "currentPrice": float(self._currentPrice) if self._currentPrice else None,
            "movingAverage5Day": float(self._movingAverage5Day) if self._movingAverage5Day else None,
            "volatility": float(self._volatility) if self._volatility else None,
            "volume": self._volume, "marketCap": self._marketCap,
            "fiftyTwoWeekHigh": float(self._fiftyTwoWeekHigh) if self._fiftyTwoWeekHigh else None,
            "fiftyTwoWeekLow": float(self._fiftyTwoWeekLow) if self._fiftyTwoWeekLow else None
        }

    def _save_to_db(self):
        """Internal method to UPSERT the stock data."""
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO stocks (ticker, company_name, sector, current_price, volatility, 
                                   moving_average_5_day, volume, market_cap, 
                                   fifty_two_week_high, fifty_two_week_low, last_updated) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (ticker) DO UPDATE SET 
                    company_name = EXCLUDED.company_name, sector = EXCLUDED.sector,
                    current_price = EXCLUDED.current_price, volatility = EXCLUDED.volatility,
                    moving_average_5_day = EXCLUDED.moving_average_5_day,
                    volume = EXCLUDED.volume, market_cap = EXCLUDED.market_cap,
                    fifty_two_week_high = EXCLUDED.fifty_two_week_high,
                    fifty_two_week_low = EXCLUDED.fifty_two_week_low,
                    last_updated = EXCLUDED.last_updated
                """,
                (self._tickerSymbol, self._companyName, self._sector, self._currentPrice, 
                 self._volatility, self._movingAverage5Day, self._volume, self._marketCap, 
                 self._fiftyTwoWeekHigh, self._fiftyTwoWeekLow)
            )
            conn.commit()
            cur.close()
        except Exception as e:
            print(f"DEBUG: Stock DB Write Error: {e}")
        finally:
            if conn: conn.close()

    def _fallback_yfinance(self) -> Dict[str, Any]:
        """Private method: yfinance fallback for all data points."""
        try:
            import yfinance as yf
            stock_obj = yf.Ticker(self._tickerSymbol)
            hist = stock_obj.history(period="1mo")
            if hist.empty: return {"status": "error", "message": "Ticker not found."}

            self._currentPrice = round(float(hist['Close'].iloc[-1]), 2)
            recent = hist.tail(5)
            self._movingAverage5Day = round(float(recent['Close'].mean()), 2)
            daily_ranges = (recent['High'] - recent['Low']) / recent['Close']
            self._volatility = round(float(daily_ranges.mean() * 100), 2)

            try:
                info = stock_obj.info
                self._companyName = info.get('longName', self._tickerSymbol)
                self._sector = info.get('sector')
                self._marketCap = info.get('marketCap')
                self._volume = info.get('volume')
                self._fiftyTwoWeekHigh = info.get('fiftyTwoWeekHigh')
                self._fiftyTwoWeekLow = info.get('fiftyTwoWeekLow')
            except Exception:
                self._companyName = self._tickerSymbol

            return {"status": "success", "source": "yfinance", "data": self._get_data_dict()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

class NewsArticle:
    def __init__(self, article_id: str, headline: str, publish_date: str, source: str, sentiment_score: float):
        self._articleID: str = article_id
        self._headline: str = headline
        self._publishDate: str = publish_date
        self._source: str = source
        self._sentimentScore: float = sentiment_score

    def generateAISummary(self) -> str:
        pass


class SentimentAnalyzer:
    def __init__(self, vader_engine: SentimentIntensityAnalyzer, news_api_key: str):
        # We pass the VADER engine in so we don't have to rebuild it every time
        self._vaderEngine: SentimentIntensityAnalyzer = vader_engine
        self._newsAPIKey: str = news_api_key
        self.articles: List[NewsArticle] = []

    def _get_market_chatter_sentiment(self, ticker: str) -> Tuple[float, int]:
        """Private method: Tier 1 StockTwits scan using TLS Spoofing and Retry Logic."""
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                url = f"https://api.stocktwits.com/api/2/streams/symbol/{ticker.upper()}.json"
                
                # Using this to fake an actual human requesting the data
                response = curl_requests.get(url, impersonate="chrome", timeout=5)
                
                # If successful, process the data and exit the function immediately
                if response.status_code == 200:
                    messages = response.json().get('messages', [])
                    if not messages:
                        return 0.0, 0
                        
                    total_compound = sum(self._vaderEngine.polarity_scores(msg.get('body', ''))['compound'] for msg in messages)
                    volume = len(messages)
                    
                    return round(total_compound / volume, 4) if volume > 0 else 0.0, volume
                
                # Handle specific failure cases for logging in case, StockTwits api gives us an error
                elif response.status_code == 429:
                    print(f"DEBUG: Rate limited on {ticker}. Attempt {attempt + 1} of {max_retries}.")
                else:
                    print(f"DEBUG: StockTwits API Blocked for {ticker} (Status: {response.status_code}). Attempt {attempt + 1}.")
                    
            except Exception as e:
                print(f"DEBUG: Chatter Error on {ticker} (Attempt {attempt + 1}): {str(e)}")
            
            # If the loop hasn't returned yet, it means the request failed.
            # Pause before the next attempt using exponential backoff (1s, then 2s)
            if attempt < max_retries - 1:
                sleep_time = 2 ** attempt 
                time.sleep(sleep_time)
                
        # If the loop finishes all attempts without returning, it's a total failure for this ticker
        print(f"DEBUG: All {max_retries} retries failed for {ticker} chatter.")
        return 0.0, 0

    def _get_news_sentiment(self, ticker: str) -> Tuple[float, int]:
        """Private method: Tier 2 NewsData scan."""
        if not self._newsAPIKey:
            print("DEBUG: NEWSDATA_API_KEY missing")
            return 0.0, 0
            
        url = f"https://newsdata.io/api/1/latest?apikey={self._newsAPIKey}&q={ticker}&language=en"
        
        try:
            response = requests.get(url, timeout=5)
            articles_data = response.json().get('results', [])
            
            if not articles_data:
                return 0.0, 0
                
            total_compound = 0
            volume = len(articles_data)
            
            # Store these as NewsArticle objects
            self.articles = [] 
            
            for art in articles_data:
                text = f"{art.get('title', '')} {art.get('description', '')}"
                score = self._vaderEngine.polarity_scores(text)['compound']
                total_compound += score
                
                # Saving the articles to our class list
                self.articles.append(NewsArticle(
                    article_id=art.get('article_id', 'unknown'),
                    headline=art.get('title', ''),
                    publish_date=art.get('pubDate', ''),
                    source=art.get('source_id', 'NewsData'),
                    sentiment_score=score
                ))
                
            return (total_compound / volume) if volume > 0 else 0.0, volume
        except Exception as e:
            print(f"DEBUG: NewsData API Error: {e}")
            return 0.0, 0

    def calculateHypeScore(self, ticker: str) -> Dict[str, Any]:
        """
        Main Engine: Calculates a 0-100 score weighted 60/40 Chatter/News.
        Includes a 5-minute database cache.
        """
        ticker_upper = ticker.upper()
        conn = None
        
        # conn to db, append to db, return ticker data if found
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Use PostgreSQL to handle the 5-minute time check
            cur.execute(
                """
                SELECT social_volume, news_volume, sentiment_score, final_hype_score, tag 
                FROM hype_metrics 
                WHERE ticker = %s AND created_at >= NOW() - INTERVAL '5 minutes'
                ORDER BY created_at DESC LIMIT 1
                """,
                (ticker_upper,)
            )
            cached_row = cur.fetchone()
            cur.close()
            
            # If we found recent data, return the found data directly
            if cached_row:
                chatter_vol, news_vol, raw_sentiment, hype_score, db_tag = cached_row
                    
                return {
                    "ticker": ticker_upper,
                    "hype_score": hype_score,
                    "tag": db_tag,
                    "metrics": {
                        "social_volume": chatter_vol,
                        "news_volume": news_vol,
                        "raw_sentiment": float(raw_sentiment)
                    },
                    "cached": True
                }
                
        except Exception as e:
            print(f"DEBUG: Cache Read Error: {e}")
            # Proceed to calculate fresh data if the DB read fails
        finally:
            if conn:
                conn.close()

        # CALCULATES FRESH DATA
        chatter_avg, chatter_vol = self._get_market_chatter_sentiment(ticker)
        news_avg, news_vol = self._get_news_sentiment(ticker)
        
        # Apply Weighted Algorithm
        if chatter_vol == 0 and news_vol == 0:
            final_compound = 0.0 
        elif chatter_vol > 0 and news_vol > 0:
            final_compound = (chatter_avg * 0.60) + (news_avg * 0.40)
        else:
            final_compound = chatter_avg if chatter_vol > 0 else news_avg

        # Convert to 0-100 Hype Score
        hype_score = round(((final_compound + 1) / 2) * 100)
        
        # Tags
        if hype_score >= 65:
            tag = "Positive"
        elif hype_score <= 35:
            tag = "Negative"
        else:
            tag = "Neutral"
            
        # SAVE NEW DATA TO DATABASE
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Check if the stock exists in the parent table
            cur.execute("SELECT 1 FROM stocks WHERE ticker = %s", (ticker_upper,))
            
            if not cur.fetchone():
                print(f"DEBUG: {ticker_upper} not found in stocks table. Fetching profile...")
                
                # Uses existing Stock class to fetch the required stock data
                stock_obj = Stock(ticker_upper)
                profile = stock_obj.fetch_stock_data()
                
                # Provide fallbacks just in case the API completely fails
                company_name = ticker_upper 
                current_price = None
                sector = None
                volatility = None
                
                if profile.get("status") == "success":
                    data = profile["data"]
                    
                    # Use 'or' to fallback if the API returns None/null
                    company_name = data.get("companyName") or ticker_upper
                    current_price = data.get("currentPrice")
                    sector = data.get("sector")
                    volatility = data.get("volatility")
                
                # Creates parent record to satisfy foreign key constraint
                cur.execute(
                    """
                    INSERT INTO stocks (ticker, company_name, sector, current_price, volatility) 
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (ticker) DO NOTHING
                    """,
                    (ticker_upper, company_name, sector, current_price, volatility)
                )
            
            # Now that parent record is guaranteed to exist, we insert the metrics
            cur.execute(
                """
                INSERT INTO hype_metrics 
                (ticker, social_volume, news_volume, sentiment_score, final_hype_score, tag) 
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (ticker_upper, chatter_vol, news_vol, round(final_compound, 4), hype_score, tag)
            )
            
            conn.commit()
            cur.close()
            
        except Exception as e:
            if conn:
                conn.rollback() 
            print(f"DEBUG: Cache Write Error: {str(e)}")
        finally:
            if conn:
                conn.close()
            
        return {
            "ticker": ticker_upper,
            "hype_score": hype_score,
            "tag": tag,
            "metrics": {
                "social_volume": chatter_vol, 
                "news_volume": news_vol,
                "raw_sentiment": round(final_compound, 4)
            },
            "cached": False
        }