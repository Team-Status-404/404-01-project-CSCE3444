from typing import List, Any
from datetime import datetime

class User:
    def __init__(self, user_id: str, email: str, password_hash: str, oauth_token: str):
        # Private Attributes
        self._userID: str = user_id
        self._email: str = email
        self._passwordHash: str = password_hash
        self._oAuthToken: str = oauth_token
        
        # Relationships
        self.watchlist = None  # Each User begins with no WatchList, but can only have a maximum of 1 Watchlist
        self.alerts: List['Alerts'] = []  # Each User begins with zero alerts, and can have as many as they want

    def login(self, email: str, password_hash: str) -> bool: # Lance's Authentication function
        pass # tells python to do nothing for now

    def register(self, email: str, password_hash: str) -> bool: # Lance's Authentication function
        pass
    
    def delete_account(self, email: str, password_hash: str) -> bool: # Lance's Authentication function
        pass

    def updateProfile(self, email: str) -> None: # to be built buy me, Yasas is building the frontend
        pass


class WatchList:
    def __init__(self, user_id: str):
        # Private Attributes
        self._userID: str = user_id
        
        # Relationships
        self.stocks: List['Stock'] = []  # 1 WatchList has 0..5 Stocks

    def addTicker(self, params: Any) -> Any:
        pass

    def removeTicker(self, params: Any):
        pass

    def checkLimit(self):
        pass
    
    
class Alerts:
    def __init__(self, alert_id: str, user_id: str, ticker_symbol: str, hype_threshold: int, is_active: bool):
        # Private Attributes
        self._alertID: str = alert_id
        self._userID: str = user_id
        self._tickerSymbol: str = ticker_symbol
        self._hypeThreshold: int = hype_threshold
        self._isActive: bool = is_active

    def configureAlert(self, threshold: int) -> None:
        pass

    def triggerNotification(self) -> None:
        pass


class Stock:
    def __init__(self, ticker_symbol: str, current_price: float, moving_average_5_day: float):
        # Private Attributes
        self._tickerSymbol: str = ticker_symbol
        self._currentPrice: float = current_price
        self._movingAverage5Day: float = moving_average_5_day
        
        # Note: Alerts are linked to Stocks (1 Stock -> 0..* Alerts) 
        # but typically the Alert holds the stock reference. 
        # A list can be added here if bi-directional navigation is needed.

    def fetchLivePrice(self) -> float:
        pass

    def getHistoricalData(self, days: int) -> List[float]:
        pass


class NewsArticle:
    def __init__(self, article_id: str, headline: str, publish_date: datetime, source: str, sentiment_score: float):
        # Private Attributes
        self._articleID: str = article_id
        self._headline: str = headline
        self._publishDate: datetime = publish_date
        self._source: str = source
        self._sentimentScore: float = sentiment_score

    def generateAISummary(self) -> str:
        pass


class SentimentAnalyzer:
    def __init__(self, vader_engine: object, news_api_key: str):
        # Private Attributes
        self._vaderEngine: object = vader_engine
        self._newsAPIKey: str = news_api_key
        
        # Relationships
        self.articles: List['NewsArticle'] = []  # 1 SentimentAnalyzer handles 1..* NewsArticles

    def calculateHypeScore(self, ticker: str) -> float:
        # Diagram shows a dependency (dashed line) to the Stock class
        pass

    def tagSentiment(self):
        pass
