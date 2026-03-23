from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
from dotenv import load_dotenv
from database import access_db_tables

# Import the advanced sentiment engine (from your dev branch)
from sentiment import analyze_stock_hype

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app) 

@app.route('/')
def home():
    return jsonify({"message": "StockIQ Backend is running securely!"})


@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker):
    """
    Fetch stock price, name, and market cap using yfinance efficiently.
    """
    try:
        ticker_upper = ticker.upper()
        stock = yf.Ticker(ticker_upper)
        
        # 1. Grab all details in ONE network request
        info = stock.info
        
        # Check if the ticker is valid by looking for a common key
        if not info or 'symbol' not in info:
            return jsonify({"error": "Stock ticker not found"}), 404

        # 2. Extract data safely using .get()
        name = info.get("longName", "Unknown")
        market_cap = info.get("marketCap", "N/A")
        
        # yfinance sometimes changes the key for the current price
        current_price = info.get("currentPrice") or info.get("regularMarketPrice")
        
        # Safe fallback: If info doesn't have the price, use a lightweight history call
        if not current_price:
            hist = stock.history(period="1d")
            if hist.empty:
                return jsonify({"error": "No price data available"}), 404
            current_price = hist["Close"].iloc[-1]

        # 3. Return a unified JSON object
        return jsonify({
            "ticker": ticker_upper,
            "name": name,
            "current_price": round(float(current_price), 2),
            "marketCap": market_cap
        }), 200

    except Exception as e:
        error_message = str(e)
        # Catch the 429 rate limit error gracefully
        if "429" in error_message:
            return jsonify({"error": "Rate limit exceeded. Please wait a few minutes."}), 429
        return jsonify({"error": error_message}), 500

@app.route('/api/sentiment/<ticker>', methods=['GET'])
def get_stock_sentiment(ticker):
    """
    Returns the 0-100 Hype Score and Sentiment Tag for a given ticker.
    """
    try:
        result = analyze_stock_hype(ticker)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    access_db_tables()
    app.run(debug=True, port=5000)