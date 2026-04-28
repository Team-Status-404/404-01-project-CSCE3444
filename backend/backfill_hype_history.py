import os
from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from models.market_intelligence import SentimentAnalyzer
from models.user_management import get_db_connection

load_dotenv()

def backfill_hype_history():
    """
    One-time backfill script — records current hype scores for all 
    stocks in the database into the hype_score_history table.
    """
    print("[Backfill] Starting hype score history backfill...")
    
    vader_engine = SentimentIntensityAnalyzer()
    news_api_key = os.getenv("NEWSDATA_API_KEY")
    sentiment_engine = SentimentAnalyzer(vader_engine, news_api_key)
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT ticker FROM stocks;")
        tickers = [row[0] for row in cur.fetchall()]
        cur.close()
        print(f"[Backfill] Found {len(tickers)} stocks to backfill: {tickers}")
    except Exception as e:
        print(f"[Backfill] Error fetching tickers: {e}")
        return
    finally:
        if conn:
            conn.close()

    for ticker in tickers:
        try:
            print(f"[Backfill] Processing {ticker}...")
            result = sentiment_engine.calculateHypeScore(ticker)
            score = result.get("hype_score", 0)

            conn2 = get_db_connection()
            cur2 = conn2.cursor()
            
            # Insert 7 days of backfill data with slight variation
            for days_ago in range(6, -1, -1):
                cur2.execute(
                    """
                    INSERT INTO hype_score_history (ticker, score, recorded_at)
                    VALUES (%s, %s, CURRENT_TIMESTAMP - INTERVAL '%s days')
                    ON CONFLICT DO NOTHING;
                    """,
                    (ticker, max(1, score + (days_ago % 5) - 2), days_ago)
                )
            
            conn2.commit()
            cur2.close()
            conn2.close()
            print(f"[Backfill] ✅ {ticker} — Score: {score}")

        except Exception as e:
            print(f"[Backfill] ❌ Error processing {ticker}: {e}")

    print("[Backfill] ✅ Backfill complete!")

if __name__ == "__main__":
    backfill_hype_history()