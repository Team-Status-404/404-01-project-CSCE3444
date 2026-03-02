
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def analyze_headline(headline):
    """
    Takes a news headline and returns a sentiment score and signal.
    """
    # Initialize the VADER AI
    analyzer = SentimentIntensityAnalyzer()
    
    # Calculate the sentiment
    sentiment_scores = analyzer.polarity_scores(headline)
    
    # Extract the compound score (ranges from -1 to 1)
    compound_score = sentiment_scores['compound']
    
    # Determine the financial signal based on the score thresholds
    if compound_score > 0.05:
        signal = "BULLISH"
    elif compound_score < -0.05:
        signal = "BEARISH"
    else:
        signal = "NEUTRAL"
        
    return {
        "headline": headline,
        "sentiment_score": compound_score,
        "signal": signal
    }