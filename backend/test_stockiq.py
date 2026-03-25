import datetime
from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
CORS(app)

# Requirement FR-05: 5-Minute Cache (In-memory storage)
stock_cache = {}

@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock(ticker):
    ticker = ticker.upper()
    current_time = datetime.datetime.now()

    # 1. Check Cache for existing data within 5 minutes
    if ticker in stock_cache:
        cached_entry = stock_cache[ticker]
        if (current_time - cached_entry['timestamp']).total_seconds() < 300:
            return jsonify({
                "status": "success",
                "source": "cache",
                "data": cached_entry['data']
            })

    # 2. Fetch Fresh Data (Requirement FR-06)
    try:
        stock_obj = yf.Ticker(ticker)
        
        # Get Info for Full Company Name
        info = stock_obj.info
        
        # Get 1 month of history for moving average calculation
        hist = stock_obj.history(period="1mo")

        if hist.empty:
            return jsonify({"status": "error", "message": "Ticker not found"}), 404

        # Calculate metrics defined in Class Diagram
        current_price = hist['Close'].iloc[-1]
        moving_avg_5d = hist['Close'].tail(5).mean()

        # Cleaned Data Object (No currency, No sector)
        processed_data = {
            "ticker": ticker,
            "companyName": info.get('longName', 'N/A'),
            "currentPrice": round(float(current_price), 2),
            "movingAverage5Day": round(float(moving_avg_5d), 2)
        }

        # 3. Update Cache
        stock_cache[ticker] = {
            "timestamp": current_time,
            "data": processed_data
        }

        return jsonify({
            "status": "success",
            "source": "live_api",
            "data": processed_data
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Print the "HTTPS" link instructions in the terminal
    print("\n" + "="*60)
    print("STOCKIQ TEST SERVER IS LIVE")
    print("Click or Copy this link into your browser:")
    print("http://127.0.0.1:5000/api/stock/AAPL")
    print("\nYou can change AAPL to any symbol like TSLA, NVDA, or MSFT")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000)