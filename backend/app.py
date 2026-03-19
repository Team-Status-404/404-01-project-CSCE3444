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
<<<<<<< HEAD
CORS(app) 
=======
CORS(app)
>>>>>>> origin/timilsenayasas-patch-1

@app.route('/')
def home():
    return jsonify({"message": "StockIQ Backend is running securely!"})

@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker):
    """
<<<<<<< HEAD
    Fetch stock price, name, and market cap using yfinance.
    """
    try:
        # 1. Grab the company details (Name, Market Cap)
        stock = yf.Ticker(ticker.upper())
        info = stock.info
        
        # 2. Grab the most accurate recent price using the download method
=======
    Fetch stock price using yfinance download
    """
    try:
>>>>>>> origin/timilsenayasas-patch-1
        data = yf.download(
            ticker.upper(),
            period="5d",
            interval="1d",
            progress=False,
            auto_adjust=False
        )

        if data.empty:
            return jsonify({"error": "Stock ticker not found"}), 404

        current_price = float(data["Close"].dropna().iloc[-1])

<<<<<<< HEAD
        # 3. Return a unified JSON object
        return jsonify({
            "ticker": ticker.upper(),
            "name": info.get("longName", "Unknown"),
            "current_price": round(current_price, 2),
            "marketCap": info.get("marketCap", "N/A")
=======
        return jsonify({
            "ticker": ticker.upper(),
            "current_price": round(current_price, 2)
>>>>>>> origin/timilsenayasas-patch-1
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
<<<<<<< HEAD
    access_db_tables()
=======
>>>>>>> origin/timilsenayasas-patch-1
    app.run(debug=True, port=5000)