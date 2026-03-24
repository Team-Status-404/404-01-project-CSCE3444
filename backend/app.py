from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
from dotenv import load_dotenv
from database import access_db_tables

# Import the advanced sentiment engine (from your dev branch)
from sentiment import analyze_stock_hype

from stock_data import stock_data


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
    Fetch stock price, name, and market cap efficiently.
    """
    try:
        # Unpack the dictionary and the status code
        result_dict, status_code = stock_data(ticker)
        
        # jsonify the dictionary, and return the status code alongside it
        return jsonify(result_dict), status_code
        
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
    access_db_tables()
    app.run(debug=True, port=5000)
