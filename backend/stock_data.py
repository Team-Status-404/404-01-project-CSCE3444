import yfinance as yf
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # This allows your computer to talk to this API

# --- Your Stock Logic ---
def stock_data(ticker):
    try:
        stock = yf.Ticker(ticker.upper())
        # Fetch 1 month of data to ensure we have enough for a 5-day average
        df = stock.history(period="1mo")

        if df.empty:
            return {"error": "No data found."}, 404

        # Calculate values
        name = stock.info.get('shortName', ticker.upper())
        current_price = df['Close'].iloc[-1]
        moving_avg_5d = df['Close'].tail(5).mean()

        return {
            "ticker": ticker.upper(),
            "name": name,
            "current_price": round(float(current_price), 2),
            "moving_average_5d": round(float(moving_avg_5d), 2),
            "status": "Success!"
        }, 200

    except Exception as e:
        return {"error": str(e)}, 500


if __name__ == "__main__":
    # This starts the server
    print("\n Starting server... Look for the URL below!")
    app.run(debug=True, port=5000)
