
from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
from sentiment import analyze_headline

app = Flask(__name__)
# CORS allows your React frontend to securely request data from this backend
CORS(app) 

@app.route('/')
def home():
    return jsonify({"message": "StockIQ Backend is running securely!"})

@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker):
    """
    Fetches live stock price data using the yfinance library
    """
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period="1d")
        
        if data.empty:
            return jsonify({"error": "Stock ticker not found"}), 404
            
        current_price = data['Close'].iloc[-1]
        
        return jsonify({
            "ticker": ticker.upper(),
            "current_price": round(current_price, 2)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sentiment/test', methods=['GET'])
def test_sentiment():
    """
    A quick test route to verify our VADER sentiment logic works
    """
    sample_headline = "Massive tech sell-off triggers market panic and drops shares by 20%"
    result = analyze_headline(sample_headline)
    return jsonify(result)

if __name__ == '__main__':
    # Runs the server on port 5000
    app.run(debug=True, port=5000)