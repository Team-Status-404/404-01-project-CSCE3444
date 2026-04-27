import os
import requests
import threading
import time
from curl_cffi import requests as curl_requests
import psycopg2
import yfinance as yf
from typing import List, Dict, Any, Tuple
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


def get_db_connection():
    url = os.getenv("DATABASE_URL")
    if url:
        return psycopg2.connect(url)
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
        self._volume: int = None
        self._marketCap: int = None
        self._fiftyTwoWeekHigh: float = None
        self._fiftyTwoWeekLow: float = None

    def fetch_stock_data(self) -> Dict[str, Any]:
        conn = None
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
                result = {
                    "status": "success", "source": "database_cache", "cached": True,
                    "data": self._get_data_dict()
                }
                return self._append_graph_data(result)
        except Exception as e:
            print(f"DEBUG: Stock Cache Read Error: {e}")
        finally:
            if conn: conn.close()

        api_key = os.getenv("FINANCE_DATA_KEY")
        if not api_key:
            return {"status": "error", "message": "Missing API Key."}

        fresh_data = None
        try:
            profile_url = f"https://financialmodelingprep.com/stable/profile?symbol={self._tickerSymbol}&apikey={api_key}"
            profile_resp = requests.get(profile_url)
            if profile_resp.status_code != 200:
                fresh_data = self._fallback_yfinance()
            elif profile_resp.status_code == 200:
                profile_data = profile_resp.json()
                if profile_data:
                    p = profile_data[0]
                    self._companyName = p.get('companyName', self._tickerSymbol)
                    self._sector = p.get('sector')
                    self._marketCap = p.get('mcap')
                    self._volume = p.get('volAvg')
                    price_range = p.get('range', "").split("-")
                    if len(price_range) == 2:
                        self._fiftyTwoWeekLow = float(price_range[0])
                        self._fiftyTwoWeekHigh = float(price_range[1])
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

        if fresh_data and fresh_data.get("status") == "success":
            self._save_to_db()
            fresh_data["cached"] = False
            return self._append_graph_data(fresh_data)

        return fresh_data or {"status": "error", "message": f"Could not retrieve data for {self._tickerSymbol}."}

    def _get_data_dict(self) -> Dict[str, Any]:
        return {
            "ticker": self._tickerSymbol, "companyName": self._companyName,
            "sector": self._sector, "currentPrice": float(self._currentPrice) if self._currentPrice else None,
            "movingAverage5Day": float(self._movingAverage5Day) if self._movingAverage5Day else None,
            "volatility": float(self._volatility) if self._volatility else None,
            "volume": self._volume, "marketCap": self._marketCap,
            "fiftyTwoWeekHigh": float(self._fiftyTwoWeekHigh) if self._fiftyTwoWeekHigh else None,
            "fiftyTwoWeekLow": float(self._fiftyTwoWeekLow) if self._fiftyTwoWeekLow else None
        }

    def _append_graph_data(self, response_dict: Dict[str, Any]) -> Dict[str, Any]:
        price_data = get_price_data_and_ma(self._tickerSymbol)
        sentiment_data = get_5_day_sentiment(self._tickerSymbol)
        response_dict["data"]["graph_data"] = {
            "historical_prices": price_data.get("historical_prices", []),
            "historical_sentiment": sentiment_data.get("historical_sentiment", [0.0] * 5)
        }
        if "price_trend_pct" in price_data and "trend_pct" in sentiment_data:
            response_dict["data"]["divergence_warning_active"] = calculate_divergence_flag(
                price_data['price_trend_pct'],
                sentiment_data['trend_pct']
            )
        else:
            response_dict["data"]["divergence_warning_active"] = False
        return response_dict

    def _save_to_db(self):
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

    def fetchLivePrice(self) -> Dict[str, Any]:
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """
                SELECT current_price, company_name, last_updated
                FROM stocks
                WHERE ticker = %s AND last_updated >= NOW() - INTERVAL '30 seconds'
                """,
                (self._tickerSymbol,)
            )
            cached = cur.fetchone()
            cur.close()
            if cached:
                return {
                    "status": "success",
                    "cached": True,
                    "data": {
                        "ticker": self._tickerSymbol,
                        "companyName": cached[1] or self._tickerSymbol,
                        "currentPrice": float(cached[0]) if cached[0] else None,
                        "lastUpdated": cached[2].isoformat() if cached[2] else None
                    }
                }
        except Exception as e:
            print(f"DEBUG: LivePrice Cache Read Error: {e}")
        finally:
            if conn: conn.close()

        api_key = os.getenv("FINANCE_DATA_KEY")
        live_price = None
        source = None

        if api_key:
            try:
                quote_url = f"https://financialmodelingprep.com/stable/quote?symbol={self._tickerSymbol}&apikey={api_key}"
                resp = requests.get(quote_url, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    if data:
                        live_price = round(float(data[0].get('price', 0)), 2)
                        self._companyName = data[0].get('name', self._tickerSymbol)
                        source = "fmp"
            except Exception as e:
                print(f"DEBUG: FMP LivePrice Error: {e}")

        if live_price is None:
            try:
                stock_obj = yf.Ticker(self._tickerSymbol)
                hist = stock_obj.history(period="1d")
                if not hist.empty:
                    live_price = round(float(hist['Close'].iloc[-1]), 2)
                    try:
                        self._companyName = stock_obj.info.get('longName', self._tickerSymbol)
                    except Exception:
                        self._companyName = self._tickerSymbol
                    source = "yfinance"
                else:
                    return {"status": "error", "message": f"Ticker '{self._tickerSymbol}' not found."}
            except Exception as e:
                return {"status": "error", "message": f"Price fetch failed: {str(e)}"}

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO stocks (ticker, company_name, current_price, last_updated)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (ticker) DO UPDATE SET
                    current_price = EXCLUDED.current_price,
                    last_updated = EXCLUDED.last_updated
                """,
                (self._tickerSymbol, self._companyName, live_price)
            )
            conn.commit()
            cur.close()
        except Exception as e:
            print(f"DEBUG: LivePrice Cache Write Error: {e}")
        finally:
            if conn: conn.close()

        return {
            "status": "success",
            "cached": False,
            "source": source,
            "data": {
                "ticker": self._tickerSymbol,
                "companyName": self._companyName,
                "currentPrice": live_price,
                "lastUpdated": None
            }
        }


class NewsArticle:
    def __init__(self, article_id: str, headline: str, publish_date: str, source: str, sentiment_score: float, url: str = '', description: str = ''):
        self._articleID: str = article_id
        self._headline: str = headline
        self._publishDate: str = publish_date
        self._source: str = source
        self._sentimentScore: float = sentiment_score
        self._url: str = url
        self._description: str = description


class SentimentAnalyzer:
    def __init__(self, vader_engine: SentimentIntensityAnalyzer, news_api_key: str):
        self._vaderEngine: SentimentIntensityAnalyzer = vader_engine
        self._newsAPIKey: str = news_api_key
        self.articles: List[NewsArticle] = []

    def _get_market_chatter_sentiment(self, ticker: str) -> Tuple[float, int]:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                url = f"https://api.stocktwits.com/api/2/streams/symbol/{ticker.upper()}.json"
                response = curl_requests.get(url, impersonate="chrome", timeout=5)
                if response.status_code == 200:
                    messages = response.json().get('messages', [])
                    if not messages:
                        return 0.0, 0
                    total_compound = sum(self._vaderEngine.polarity_scores(msg.get('body', ''))['compound'] for msg in messages)
                    volume = len(messages)
                    return round(total_compound / volume, 4) if volume > 0 else 0.0, volume
                elif response.status_code == 429:
                    print(f"DEBUG: Rate limited on {ticker}. Attempt {attempt + 1} of {max_retries}.")
                else:
                    print(f"DEBUG: StockTwits API Blocked for {ticker} (Status: {response.status_code}). Attempt {attempt + 1}.")
            except Exception as e:
                print(f"DEBUG: Chatter Error on {ticker} (Attempt {attempt + 1}): {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
        print(f"DEBUG: All {max_retries} retries failed for {ticker} chatter.")
        return 0.0, 0

    def _get_news_sentiment(self, ticker: str) -> Tuple[float, int]:
        total_compound = 0.0
        volume = 0
        self.articles = []

        if self._newsAPIKey:
            url = f"https://newsdata.io/api/1/latest?apikey={self._newsAPIKey}&q={ticker}&language=en"
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    articles_data = response.json().get('results', [])
                    if isinstance(articles_data, list) and articles_data:
                        for art in articles_data:
                            text = f"{art.get('title', '')} {art.get('description', '')}"
                            score = self._vaderEngine.polarity_scores(text)['compound']
                            total_compound += score
                            self.articles.append(NewsArticle(
                                article_id=art.get('article_id', 'unknown'),
                                headline=art.get('title', ''),
                                publish_date=art.get('pubDate', ''),
                                source=art.get('source_id', 'NewsData'),
                                sentiment_score=score,
                                url=art.get('link', ''),
                                description=art.get('description', ''),
                            ))
                        volume = len(self.articles)
                        return (total_compound / volume) if volume > 0 else 0.0, volume
                else:
                    print(f"DEBUG: NewsData API Error (Status: {response.status_code}): {response.text}")
            except Exception as e:
                print(f"DEBUG: NewsData API Exception: {e}")

        # Fallback to yfinance
        print(f"DEBUG: Falling back to yfinance news for {ticker}")
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker)
            yf_news = stock.news
            if yf_news:
                for item in yf_news[:10]:
                    content = item.get('content', {}) if isinstance(item, dict) and 'content' in item else item
                    
                    title = content.get('title', '')
                    desc = content.get('summary', '') or content.get('description', '')
                    text = f"{title} {desc}"
                    score = self._vaderEngine.polarity_scores(text)['compound']
                    total_compound += score
                    
                    provider = content.get('provider', {})
                    source = provider.get('displayName', 'Yahoo Finance') if isinstance(provider, dict) else 'Yahoo Finance'
                    
                    link_info = content.get('clickThroughUrl', {})
                    url = link_info.get('url', '') if isinstance(link_info, dict) else ''
                    
                    self.articles.append(NewsArticle(
                        article_id=content.get('id', item.get('uuid', 'yf-unknown')),
                        headline=title,
                        publish_date=content.get('pubDate', ''),
                        source=source,
                        sentiment_score=score,
                        url=url,
                        description=desc,
                    ))
                volume = len(self.articles)
                return (total_compound / volume) if volume > 0 else 0.0, volume
        except Exception as e:
            print(f"DEBUG: yfinance fallback error: {e}")

        return 0.0, 0

    def calculateHypeScore(self, ticker: str) -> Dict[str, Any]:
        ticker_upper = ticker.upper()
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
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
        finally:
            if conn: conn.close()

        chatter_avg, chatter_vol = self._get_market_chatter_sentiment(ticker)
        news_avg, news_vol = self._get_news_sentiment(ticker)

        if chatter_vol == 0 and news_vol == 0:
            final_compound = 0.0
        elif chatter_vol > 0 and news_vol > 0:
            final_compound = (chatter_avg * 0.60) + (news_avg * 0.40)
        else:
            final_compound = chatter_avg if chatter_vol > 0 else news_avg

        hype_score = round(((final_compound + 1) / 2) * 100)

        if hype_score >= 65:
            tag = "Positive"
        elif hype_score <= 35:
            tag = "Negative"
        else:
            tag = "Neutral"

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM stocks WHERE ticker = %s", (ticker_upper,))
            if not cur.fetchone():
                stock_obj = Stock(ticker_upper)
                profile = stock_obj.fetch_stock_data()
                company_name = ticker_upper
                current_price = None
                sector = None
                volatility = None
                if profile.get("status") == "success":
                    data = profile["data"]
                    company_name = data.get("companyName") or ticker_upper
                    current_price = data.get("currentPrice")
                    sector = data.get("sector")
                    volatility = data.get("volatility")
                cur.execute(
                    """
                    INSERT INTO stocks (ticker, company_name, sector, current_price, volatility) 
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (ticker) DO NOTHING
                    """,
                    (ticker_upper, company_name, sector, current_price, volatility)
                )
            cur.execute(
                """
                INSERT INTO hype_metrics 
                (ticker, social_volume, news_volume, sentiment_score, final_hype_score, tag) 
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (ticker_upper, chatter_vol, news_vol, round(final_compound, 4), hype_score, tag)
            )
            cur.execute(
                "DELETE FROM hype_metrics WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '5 days');"
            )
            conn.commit()
            cur.close()
        except Exception as e:
            if conn: conn.rollback()
            print(f"DEBUG: Cache Write Error: {str(e)}")
        finally:
            if conn: conn.close()

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

    def get_articles(self, ticker: str) -> List[Dict[str, Any]]:
        self._get_news_sentiment(ticker)
        return [
            {
                "article_id": a._articleID,
                "headline": a._headline,
                "publish_date": a._publishDate,
                "source": a._source,
                "sentiment_score": round(a._sentimentScore, 4),
                "url": a._url,
                "description": a._description,
            }
            for a in self.articles
        ]


# ==========================================
# DASHBOARD HELPER FUNCTIONS
# ==========================================

def get_price_data_and_ma(ticker_symbol: str):
    try:
        stock = yf.Ticker(ticker_symbol)
        hist = stock.history(period="5d")
        hist = hist.dropna(subset=['Close'])
        if hist.empty:
            return {"error": "No data found"}
        ma_5_day = hist['Close'].mean()
        current_price = hist['Close'].iloc[-1]
        price_5_days_ago = hist['Close'].iloc[0]
        price_trend_pct = (current_price - price_5_days_ago) / price_5_days_ago
        historical_prices = hist['Close'].tolist()
        return {
            "current_price": float(round(current_price, 2)),
            "ma_5_day": float(round(ma_5_day, 2)),
            "price_trend_pct": float(price_trend_pct),
            "historical_prices": historical_prices
        }
    except Exception as e:
        print(f"yfinance error for {ticker_symbol}: {e}")
        return {"error": str(e)}


def calculate_divergence_flag(price_trend_pct: float, sentiment_trend_pct: float) -> bool:
    divergence = abs(price_trend_pct - sentiment_trend_pct)
    return bool(divergence > 0.20)


def get_5_day_sentiment(ticker_symbol: str) -> dict:
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT DATE(created_at) as log_date, AVG(final_hype_score) as avg_score
            FROM hype_metrics
            WHERE ticker = %s AND created_at >= (CURRENT_TIMESTAMP::timestamp - INTERVAL '5 days')
            GROUP BY DATE(created_at)
            ORDER BY log_date ASC;
            """,
            (ticker_symbol.upper(),)
        )
        rows = cur.fetchall()
        cur.close()
        if not rows or len(rows) < 2:
            return {"trend_pct": 0.0, "historical_sentiment": [0.0] * 5}
        historical_sentiment = [float(row[1] or 0.0) for row in rows]
        oldest_score = historical_sentiment[0]
        newest_score = historical_sentiment[-1]
        trend_pct = 0.0 if oldest_score == 0 else (newest_score - oldest_score) / oldest_score
        while len(historical_sentiment) < 5:
            historical_sentiment.insert(0, oldest_score)
        historical_sentiment = historical_sentiment[-5:]
        return {
            "trend_pct": trend_pct,
            "historical_sentiment": historical_sentiment
        }
    except Exception as e:
        print(f"DEBUG Sentiment DB Error for {ticker_symbol}: {e}")
        return {"trend_pct": 0.0, "historical_sentiment": [0.0] * 5}
    finally:
        if conn is not None:
            conn.close()


def get_full_discovery_data(sort_by: str = "hype_desc", limit: int = 50) -> list:
    """
    UC-08 | FR-08: Enhanced discovery logic for the full-page view.
    Supports dynamic sorting to help users find specific types of opportunities.
    """
    sort_map = {
        "hype_desc": "final_hype_score DESC",
        "hype_asc": "final_hype_score ASC",
        "volume_desc": "social_volume DESC",
        "ticker_asc": "ticker ASC"
    }
    order_clause = sort_map.get(sort_by, "final_hype_score DESC")
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(f"""
            WITH LatestMetrics AS (
                SELECT DISTINCT ON (m.ticker)
                    m.ticker,
                    m.final_hype_score,
                    m.tag,
                    m.social_volume,
                    s.company_name,
                    s.current_price,
                    s.sector
                FROM hype_metrics m
                JOIN stocks s ON m.ticker = s.ticker
                WHERE m.created_at >= NOW() - INTERVAL '24 hours'
                ORDER BY m.ticker, m.created_at DESC
            )
            SELECT * FROM LatestMetrics
            ORDER BY {order_clause} NULLS LAST
            LIMIT %s;
        """, (limit,))
        rows = cur.fetchall()
        cur.close()
        return [
            {
                "ticker": r[0],
                "hype_score": float(r[1]) if r[1] is not None else 0.0,
                "tag": r[2],
                "social_volume": r[3],
                "company_name": r[4],
                "price": float(r[5]) if r[5] else 0.0,
                "sector": r[6]
            } for r in rows
        ]
    except Exception as e:
        print(f"DEBUG: Discovery DB Error: {e}")
        return []
    finally:
        if conn: conn.close()


# ==========================================
# USER DROP-DOWN HELPER FUNCTIONS
# ==========================================

def _async_save_tickers_to_db(tickers_data):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        for item in tickers_data:
            cur.execute("""
                INSERT INTO stocks (ticker, company_name) 
                VALUES (%s, %s)
                ON CONFLICT (ticker) DO NOTHING
            """, (item['symbol'], item['shortname']))
        conn.commit()
        cur.close()
        conn.close()
        print(f"DEBUG: Asynchronously saved {len(tickers_data)} new tickers to database.")
    except Exception as e:
        print(f"DEBUG: Background DB Save Error: {e}")


def search_for_tickers(query: str) -> dict:
    search_term = f"%{query}%"
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT ticker, company_name 
            FROM stocks 
            WHERE ticker ILIKE %s OR company_name ILIKE %s
            LIMIT 10
        """, (search_term, search_term))
        rows = cur.fetchall()
        cur.close()
        if rows:
            db_results = [{"ticker": r[0], "companyName": r[1]} for r in rows]
            return {"status": "success", "source": "database", "results": db_results}
    except Exception as e:
        print(f"DEBUG: Search DB Read Error: {e}")
    finally:
        if conn: conn.close()

    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0"
        headers = {'User-Agent': 'Mozilla/5.0'}
        resp = requests.get(url, headers=headers, timeout=5)
        data = resp.json()
        quotes = data.get('quotes', [])
        api_results = []
        db_save_payload = []
        for q in quotes:
            if 'symbol' in q and 'shortname' in q and q.get('quoteType') == 'EQUITY':
                api_results.append({"ticker": q['symbol'], "companyName": q['shortname']})
                db_save_payload.append({"symbol": q['symbol'], "shortname": q['shortname']})
        if db_save_payload:
            thread = threading.Thread(target=_async_save_tickers_to_db, args=(db_save_payload,))
            thread.start()
        return {"status": "success", "source": "yfinance_api", "results": api_results}
    except Exception as e:
        return {"status": "error", "message": f"External search failed: {str(e)}"}


# ==========================================
# UC-17: STOCK COMPARISON (Jeel Patel - Sprint 3)
# ==========================================

import yfinance as yf

def compare_stocks(tickers, period='1mo'):
    """
    UC-17 logic that correctly parses space-separated tickers
    and prevents the 'NoneType' crash seen in logs.
    """
    processed_tickers = []
    # Fix for the 'AAPL TSLA' single-string bug
    for item in tickers:
        parts = item.replace(',', ' ').split()
        processed_tickers.extend(parts)
    
    comparison_data = []
    for ticker in processed_tickers[:4]: # FR-17a: 2-4 stock limit
        symbol = ticker.strip().upper()
        try:
            stock_obj = yf.Ticker(symbol)
            # Defensive check for the 'NoneType' attribute 'get' error
            info = stock_obj.info if stock_obj.info is not None else {}
            if not info or ('regularMarketPrice' not in info and 'currentPrice' not in info):
                continue

            # FR-17b: Metrics Table data
            metrics = {
                "symbol": symbol,
                "price": info.get("regularMarketPrice") or info.get("currentPrice") or 0.0,
                "marketCap": info.get("marketCap") or 0,
                "peRatio": info.get("trailingPE") or "N/A",
                "dailyChange": info.get("regularMarketChangePercent") or 0.0,
                "weekHigh": info.get("fiftyTwoWeekHigh") or 0.0,
                "weekLow": info.get("fiftyTwoWeekLow") or 0.0
            }

            hist = stock_obj.history(period=period)
            history_list = []
            if not hist.empty:
                start_price = hist['Close'].iloc[0]
                for date, price in zip(hist.index, hist['Close']):
                    # Normalize to 100 for side-by-side comparison
                    history_list.append({
                        "date": date.strftime('%m/%d'),
                        symbol: round((price / start_price) * 100, 2)
                    })

            comparison_data.append({"metrics": metrics, "history": history_list})
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            continue

    return {"status": "success", "data": comparison_data}