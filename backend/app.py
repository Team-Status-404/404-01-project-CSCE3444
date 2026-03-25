from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
from dotenv import load_dotenv


# Import the advanced sentiment engine (from your dev branch)
from sentiment import analyze_stock_hype
from stock_data import get_stock

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
    Fetch stock price, name, and market cap using yfinance.
    """
    try:
        result = get_stock(ticker)
        return jsonify(result)
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
    app.run(debug=True, port=5000)