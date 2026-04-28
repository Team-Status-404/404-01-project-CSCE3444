import time
import threading

def start_market_scanner(sentiment_engine):
    """
    Background task that scans a baseline of popular tickers every 4 hours 
    to ensure the Discovery page always has fresh data.
    """
    
    # A mix of mega-cap tech, volatile retail favorites, and major indices
    POPULAR_TICKERS = [
        'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'META', 'GOOGL', 'AMD',
        'PLTR', 'SMCI', 'ARM', 'COIN', 'HOOD', 'RDDT', 'INTC', 'NFLX',
        'DIS', 'BA', 'SPY', 'QQQ'
    ]

    def scan_loop():
        # Wait a few seconds for the Flask server to fully boot before starting
        time.sleep(10)
        
        while True:
            print("🤖 [Scanner] Starting background market scan...")
            
            for ticker in POPULAR_TICKERS:
                try:
                    # Calling calculateHypeScore forces the NLP engine to run 
                    # and automatically saves the result to your database
                    sentiment_engine.calculateHypeScore(ticker)
                    
                    # Sleep for 5 seconds between tickers to avoid getting IP banned by Yahoo/News APIs
                    time.sleep(5) 
                except Exception as e:
                    print(f"⚠️ [Scanner] Error scanning {ticker}: {e}")
            
            print("✅ [Scanner] Market scan complete. Sleeping for 4 hours.")
            
            # Sleep for 4 hours (14,400 seconds) before running again
            time.sleep(14400) 

    # Start the loop in a background daemon thread so it doesn't block Flask
    thread = threading.Thread(target=scan_loop, daemon=True)
    thread.start()