import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# created db tables with db schema prototype from figma/software design doc as reference
def access_db_tables():
    commands = (
        """
        -- Users table to store info and auth details

        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
        """,

        """
        -- Stocks table to store details of stocks

        CREATE TABLE IF NOT EXISTS stocks (
            ticker VARCHAR(10) PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            sector VARCHAR(100),
            current_price NUMERIC(10, 4),
            volatility DOUBLE PRECISION,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,

        """
        -- Watchlist table to store user's stock watchlist and preferences
        -- link user_id to user, link ticker to stock
        
        CREATE TABLE IF NOT EXISTS watchlist (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            ticker VARCHAR(10) REFERENCES stocks(ticker) ON DELETE CASCADE, 
            alert_enabled BOOLEAN DEFAULT FALSE,
            time_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,

        """
        -- News_Articles table to store details of scraped articles
        -- link ticker to stocks ticker

        CREATE TABLE IF NOT EXISTS news_articles (
            id SERIAL PRIMARY KEY,
            ticker VARCHAR(10) REFERENCES stocks(ticker) ON DELETE CASCADE,
            headline TEXT NOT NULL,
            content_summary TEXT,
            source VARCHAR(100),
            url TEXT,
            published_at TIMESTAMP
        )
        """,

        """
        -- Hype_Metrics table to store history of hypescores for possible visualization?
        -- link ticker to stocks ticker, ensure social volume is unsigned

        CREATE TABLE IF NOT EXISTS hype_metrics (
            id SERIAL PRIMARY KEY,
            ticker VARCHAR(10) REFERENCES stocks(ticker) ON DELETE CASCADE,
            social_volume INTEGER CHECK (social_volume >= 0), 
            sentiment_score DOUBLE PRECISION,
            final_hype_score DOUBLE PRECISION,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    conn = None
    try:
        #print("connecting to db check.....")
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME") # database = db_name
        )

        cur = conn.cursor()
        for command in commands:
            cur.execute(command)
        cur.close()
        conn.commit()
        #print("tables added/updated CHECK")

    except Exception as err:
        print(f"DATABASE ERROR: {err}")
        
    finally:
        if conn is not None:
            conn.close()
            #print("db closed")
