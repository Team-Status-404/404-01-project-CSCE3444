import os
import requests
import yfinance as yf
from datetime import datetime
from typing import List, Dict, Any, Tuple
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


class Stock:
    def __init__(self, ticker_symbol: str):
        self._tickerSymbol: str = ticker_symbol.upper()
        self._companyName: str = "N/A"
        self._currentPrice: float = 0.0
        self._movingAverage5Day: float = 0.0

    def fetch_stock_data(self) -> Dict[str, Any]:
        """
        Attempts to fetch data using FMP first. 
        If it hits a paywall (402) for ETFs, it falls back to yfinance.
        """
        api_key = os.getenv("FINANCE_DATA_KEY")
        if not api_key:
            return {"status": "error", "message": "Server configuration error: Missing API Key."}

        try:
            # --- PRIMARY API: Financial Modeling Prep ---
            profile_url = f"https://financialmodelingprep.com/stable/profile?symbol={self._tickerSymbol}&apikey={api_key}"
            profile_resp = requests.get(profile_url)
            
            # If FMP asks for money, immediately trigger the fallback
            if profile_resp.status_code == 402:
                print(f"DEBUG: FMP Paywall hit for {self._tickerSymbol}. Triggering yfinance fallback.")
                return self._fallback_yfinance()

            if profile_resp.status_code != 200:
                return {"status": "error", "message": f"FMP Profile Endpoint rejected {self._tickerSymbol}. Status: {profile_resp.status_code}"}
                
            profile_response = profile_resp.json()
            if not profile_response:
                return {"status": "error", "message": f"No data found for {self._tickerSymbol}."}

            self._companyName = profile_response[0].get('companyName', self._tickerSymbol)

            # --- HISTORICAL ENDPOINT ---
            history_url = f"https://financialmodelingprep.com/stable/historical-price-eod/full?symbol={self._tickerSymbol}&apikey={api_key}"
            history_resp = requests.get(history_url)
            
            if history_resp.status_code == 402:
                print(f"DEBUG: FMP History Paywall hit for {self._tickerSymbol}. Triggering yfinance fallback.")
                return self._fallback_yfinance()

            if history_resp.status_code != 200:
                return {"status": "error", "message": f"FMP History Endpoint rejected {self._tickerSymbol}. Status: {history_resp.status_code}"}

            history_response = history_resp.json()
            if not isinstance(history_response, list) or len(history_response) == 0:
                return {"status": "error", "message": "Historical data unavailable."}
                
            # Calculate metrics
            self._currentPrice = round(history_response[0]['close'], 2)
            recent_5_days = history_response[:5]
            closing_prices = [day['close'] for day in recent_5_days]
            self._movingAverage5Day = round(sum(closing_prices) / len(closing_prices), 2)

            return {
                "status": "success",
                "source": "financial_modeling_prep",
                "data": {
                    "ticker": self._tickerSymbol,
                    "companyName": self._companyName,
                    "currentPrice": self._currentPrice,
                    "movingAverage5Day": self._movingAverage5Day
                }
            }

        except Exception as e:
            # If FMP completely crashes for some reason, fallback to yfinance
            print(f"DEBUG: FMP Error ({e}). Triggering fallback.")
            return self._fallback_yfinance()

    def _fallback_yfinance(self) -> Dict[str, Any]:
        """
        Private method: Used only when FMP fails or paywalls the request.
        """
        try:
            import yfinance as yf
            stock_obj = yf.Ticker(self._tickerSymbol)
            
            # 1. Fetch history FIRST (This is the most stable part of yfinance)
            hist = stock_obj.history(period="1mo")
            if hist.empty:
                return {"status": "error", "message": "Ticker not found in FMP or Yahoo Finance."}

            self._currentPrice = round(float(hist['Close'].iloc[-1]), 2)
            self._movingAverage5Day = round(float(hist['Close'].tail(5).mean()), 2)

            # 2. Try to get the name, but don't let it crash the app if Yahoo blocks it
            try:
                info = stock_obj.info
                self._companyName = info.get('longName', self._tickerSymbol)
            except Exception:
                print(f"DEBUG: yfinance info blocked for {self._tickerSymbol}. Using ticker as name.")
                self._companyName = self._tickerSymbol

            return {
                "status": "success",
                "source": "yfinance_fallback",
                "data": {
                    "ticker": self._tickerSymbol,
                    "companyName": self._companyName,
                    "currentPrice": self._currentPrice,
                    "movingAverage5Day": self._movingAverage5Day
                }
            }
        except Exception as e:
            return {"status": "error", "message": f"All data sources failed for {self._tickerSymbol}: {str(e)}"}


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
        """Private method: Tier 1 StockTwits scan."""
        try:
            url = f"https://api.stocktwits.com/api/2/streams/symbol/{ticker.upper()}.json"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json",
                "Origin": "https://stocktwits.com",
            }
            response = requests.get(url, headers=headers, timeout=5)
            
            if response.status_code != 200:
                print(f"DEBUG: StockTwits API Failed for {ticker}. Status: {response.status_code}")
                return 0.0, 0
                
            messages = response.json().get('messages', [])
            if not messages:
                return 0.0, 0
                
            total_compound = sum(self._vaderEngine.polarity_scores(msg.get('body', ''))['compound'] for msg in messages)
            volume = len(messages)
            
            return round(total_compound / volume, 4) if volume > 0 else 0.0, volume
            
        except Exception as e:
            print(f"DEBUG: Chatter Error: {str(e)}")
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
            
            # Optional OOP upgrade: Store these as NewsArticle objects
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
        """
        # 1. Fetch data using our internal private methods
        chatter_avg, chatter_vol = self._get_market_chatter_sentiment(ticker)
        news_avg, news_vol = self._get_news_sentiment(ticker)
        
        # 2. Apply Weighted Algorithm
        if chatter_vol == 0 and news_vol == 0:
            final_compound = 0.0 
        elif chatter_vol > 0 and news_vol > 0:
            final_compound = (chatter_avg * 0.60) + (news_avg * 0.40)
        else:
            final_compound = chatter_avg if chatter_vol > 0 else news_avg

        # 3. Convert to 0-100 Hype Score
        hype_score = round(((final_compound + 1) / 2) * 100)
        
        # 4. Tags
        if hype_score >= 65:
            tag = "Positive"
        elif hype_score <= 35:
            tag = "Negative"
        else:
            tag = "Neutral"
            
        return {
            "ticker": ticker.upper(),
            "hype_score": hype_score,
            "tag": tag,
            "metrics": {
                "social_volume": chatter_vol, 
                "news_volume": news_vol,
                "raw_sentiment": round(final_compound, 4)
            }
        }