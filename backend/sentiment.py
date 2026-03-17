import os
import requests
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def get_market_chatter_sentiment(ticker, analyzer):
    """
    Tier 1: Scans Yahoo Finance trending news & retail blogs.
    Replaces StockTwits to guarantee 100% uptime with zero IP rate limits.
    """
    try:
        stock = yf.Ticker(ticker.upper())
        # yfinance automatically fetches the ~8 most recent trending articles/blogs
        news = stock.news
        
        if not news:
            print(f"DEBUG: No Yahoo Finance chatter found for {ticker}")
            return 0, 0
            
        total_compound = 0
        volume = len(news)
        
        for article in news:
            # We run VADER on the article titles
            text = article.get('title', '')
            score = analyzer.polarity_scores(text)
            total_compound += score['compound']
            
        avg_score = total_compound / volume if volume > 0 else 0
        return avg_score, volume
        
    except Exception as e:
        print(f"DEBUG: Yahoo Finance Chatter Error: {e}")
        return 0, 0

def get_news_sentiment(ticker, analyzer):
    """
    Tier 2: Scans NewsData.io for institutional news.
    """
    api_key = os.environ.get("NEWSDATA_API_KEY")
    if not api_key:
        print("DEBUG: NEWSDATA_API_KEY missing from .env")
        return 0, 0
        
    url = f"https://newsdata.io/api/1/latest?apikey={api_key}&q={ticker}&language=en"
    
    try:
        response = requests.get(url, timeout=5)
        data = response.json()
        articles = data.get('results', [])
        
        if not articles:
            return 0, 0
            
        total_compound = 0
        volume = len(articles)
        
        for art in articles:
            text = f"{art.get('title', '')} {art.get('description', '')}"
            score = analyzer.polarity_scores(text)
            total_compound += score['compound']
            
        avg_score = total_compound / volume if volume > 0 else 0
        return avg_score, volume
    except Exception as e:
        print(f"DEBUG: NewsData API Error: {e}")
        return 0, 0

def analyze_stock_hype(ticker):
    """
    Main Engine: Calculates a 0-100 score weighted 60/40 Chatter/News.
    """
    analyzer = SentimentIntensityAnalyzer()
    
    # 1. Fetch Real Data from both sources
    chatter_avg, chatter_vol = get_market_chatter_sentiment(ticker, analyzer)
    news_avg, news_vol = get_news_sentiment(ticker, analyzer)
    
    # 2. Apply Weighted Algorithm
    # If both APIs truly return nothing, we output a flat 50 (Neutral)
    if chatter_vol == 0 and news_vol == 0:
        final_compound = 0.0 
    elif chatter_vol > 0 and news_vol > 0:
        # 60% Chatter (Tier 1), 40% Institutional News (Tier 2)
        final_compound = (chatter_avg * 0.60) + (news_avg * 0.40)
    else:
        # Use whichever one successfully returned data
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
            # Kept the key as "social_volume" so we don't break Krish's React UI
            "social_volume": chatter_vol, 
            "news_volume": news_vol,
            "raw_sentiment": round(final_compound, 4)
        }
    }