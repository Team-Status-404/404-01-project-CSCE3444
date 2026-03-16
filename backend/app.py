from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
from sentiment import analyze_headline

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "StockIQ Backend is running securely!"})

@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker):
    """
    Fetch stock price using yfinance download
    """
    try:
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

        return jsonify({
            "ticker": ticker.upper(),
            "current_price": round(current_price, 2)
        }), 200

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
    app.run(debug=True, port=5000)