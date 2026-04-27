import os
import requests
import json
import time as time_module
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from dotenv import load_dotenv
from models.user_management import get_db_connection
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from google import genai

# --- NEW OOP DOMAIN MODULES ---
from models.market_intelligence import Stock, SentimentAnalyzer, get_price_data_and_ma, get_5_day_sentiment, calculate_divergence_flag, search_for_tickers, get_full_discovery_data, compare_stocks
from models.portfolio import WatchList, Alerts
from models.user_management import User, token_required
from models.alert_scheduler import start_scheduler
from models.market_scanner import start_market_scanner # imported new auto scanner for the treding tickers

# Load environment variables (Supabase URL, API Keys, etc.)
load_dotenv()

news_cache = {} # add this to pass linting CI

app = Flask(__name__)
# Simple in-memory cache for news articles (avoids redundant API calls)
news_cache = {}
CORS(app, origins=[
    os.getenv("FRONTEND_URL", "https://stockiq-nu.vercel.app"),
    "http://localhost:5173",
    "http://localhost:5174",
])

# ==========================================
# SERVER INITIALIZATION
# ==========================================

# Initialize the VADER engine ONCE when the server starts.
# This saves memory and makes the sentiment route work faster.
vader_engine = SentimentIntensityAnalyzer()
news_api_key = os.getenv("NEWSDATA_API_KEY")
sentiment_engine = SentimentAnalyzer(vader_engine, news_api_key) # applies to all clients making requests of the server

# Start the background alert checker
if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    # Start the alert checker
    start_scheduler(sentiment_engine)
    
    # Start the market checker
    start_market_scanner(sentiment_engine)

# Configure Gemini AI for the article summarizer
gemini_api_key = os.getenv("GEMINI_API_KEY")
gemini_client = None
gemini_model = None
if gemini_api_key:
    gemini_client = genai.Client(api_key=gemini_api_key)
    gemini_model = 'gemini-2.5-flash'

# home route
@app.route('/')
def home():
    return jsonify({"message": "StockIQ Backend is running securely and is connected to Database"})

# ==========================================
# 1. MARKET DATA ROUTES
# ==========================================
@app.route('/api/stocks/search', methods=['GET'])
def search_stocks():
    """Route for the frontend search bar autocomplete dropdown."""
    query = request.args.get('query', '').strip()
    
    if not query:
        return jsonify({"status": "success", "results": []}), 200

    result = search_for_tickers(query)
    
    status_code = 200 if result["status"] == "success" else 500
    return jsonify(result), status_code

@app.route('/api/stocks/trending', methods=['GET'])
def trending_stocks():
    """
    UC-08 | FR-08: Route for the frontend Discovery view and Markets widget.
    Returns an array of the current top trending stocks based on Hype Score.
    """
    try:
        limit_param = request.args.get('limit', default=5, type=int)
        sort_param = request.args.get('sort', default='hype_desc', type=str) # Grabs the sort method
        
        # Pass both parameters to the new backend function
        trending_list = get_full_discovery_data(sort_by=sort_param, limit=limit_param)
        
        if not trending_list:
            return jsonify({
                "status": "success",
                "message": "No trending data available in the last 24 hours.",
                "data": []
            }), 200
            
        return jsonify({
            "status": "success",
            "data": trending_list
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"An internal server error occurred: {str(e)}"
        }), 500
        
@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker): 
    """Fetch stock price, name, and moving averages using the Stock object."""
    try:
        # Create a temporary Stock object to fetch the data
        target_stock = Stock(ticker_symbol=ticker)
        result = target_stock.fetch_stock_data()
        
        # If the fetch failed (e.g, invalid ticker), return a 404
        if not result or result.get("status") == "error":
            return jsonify(result or {"status": "error", "message": "Failed to fetch stock data."}), 404
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sentiment/<ticker>', methods=['GET']) 
def get_stock_sentiment(ticker):
    """Returns the 0-100 Hype Score and Sentiment Tag."""
    try:
        # Use our globally initialized sentiment engine
        result = sentiment_engine.calculateHypeScore(ticker)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/stocks/<ticker>/news', methods=['GET'])
def get_stock_news(ticker):
    """Returns the latest 5-10 news articles for a given ticker."""
    try:
        ticker_upper = ticker.upper()

        # In-memory cache — avoids duplicate API calls within 5 minutes
        cache_key = f"news_{ticker_upper}"
        cached = news_cache.get(cache_key)
        
        if cached:
            return jsonify({"status": "success", "ticker": ticker_upper, "articles": cached, "cached": True}), 200

        # Fetch using sentiment_engine which has fallbacks
        articles = sentiment_engine.get_articles(ticker_upper)
        
        if not articles:
            return jsonify({"status": "success", "ticker": ticker_upper, "articles": [], "cached": False}), 200

        # Save to in-memory cache
        news_cache[cache_key] = articles

        return jsonify({"status": "success", "ticker": ticker_upper, "articles": articles, "cached": False}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/news/summarize', methods=['POST'])
def summarize_article():
    """Accepts article text or URL and returns a 2-3 sentence AI financial summary via Gemini.
       Also will be using gemini-2.5-flash, since 2.0 will be deprecated in a bit"""
    if not gemini_client or not gemini_model:
        return jsonify({"status": "error", "message": "AI summarizer is not configured on this server."}), 503

    data = request.json or {}
    text = data.get('text', '').strip()
    url = data.get('url', '').strip()

    if not text and not url:
        return jsonify({"status": "error", "message": "Missing text or url in request body."}), 400

    content = text if text else f"Article URL: {url}"

    prompt = (
        "You are a financial analyst assistant. Summarize the following news article in exactly 2-3 sentences, focusing strictly on the financial impact, market implications, and what this means for investors. Be concise and data-driven."
        f"Article: {content[:3000]} Financial Summary:"
    )

    try:
        response = gemini_client.models.generate_content(
            model=gemini_model,
            contents=prompt,
        )
        summary = response.text.strip()
        return jsonify({"status": "success", "summary": summary}), 200
    except Exception as e:
        print(f"DEBUG: Gemini API error: {e}")
        return jsonify({"status": "error", "message": "Failed to generate AI summary. Please try again."}), 500

@app.route('/api/news/<ticker>', methods=['GET'])
def get_news(ticker):
    """Returns recent news articles for a given ticker."""
    try:
        articles = sentiment_engine.get_articles(ticker.upper())
        return jsonify({"status": "success", "articles": articles}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/stocks/<ticker>/hype-history', methods=['GET'])
def get_hype_history(ticker):
    """Returns timestamped hype score history for a given ticker with trend metadata."""
    ticker_upper = ticker.upper()
    period = request.args.get('period', '7')
    
    # Validate period
    if period not in ('7', '30', '90'):
        return jsonify({"status": "error", "message": "Period must be 7, 30, or 90"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Fetch history for the requested period
        cur.execute("""
            SELECT DATE(recorded_at) as date, AVG(score) as avg_score
            FROM hype_score_history
            WHERE ticker = %s 
            AND recorded_at >= CURRENT_TIMESTAMP - INTERVAL '%s days'
            GROUP BY DATE(recorded_at)
            ORDER BY date ASC;
        """, (ticker_upper, int(period)))
        
        rows = cur.fetchall()
        cur.close()

        if not rows:
            return jsonify({
                "status": "success",
                "ticker": ticker_upper,
                "period": period,
                "history": [],
                "trend": {"direction": "neutral", "change_pct": 0.0},
                "message": "Not enough data yet."
            }), 200

        history = [{"date": str(row[0]), "score": float(row[1])} for row in rows]

        # Calculate trend metadata
        oldest_score = history[0]["score"]
        newest_score = history[-1]["score"]
        
        if oldest_score == 0:
            change_pct = 0.0
        else:
            change_pct = round(((newest_score - oldest_score) / oldest_score) * 100, 2)

        direction = "up" if change_pct > 0 else "down" if change_pct < 0 else "neutral"

        return jsonify({
            "status": "success",
            "ticker": ticker_upper,
            "period": period,
            "history": history,
            "trend": {
                "direction": direction,
                "change_pct": change_pct
            }
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()
# ==========================================
# UC-09: REAL-TIME PRICE ROUTES (Jeel Patel - Sprint 3)
# ==========================================

@app.route('/api/stocks/<ticker>/price', methods=['GET'])
def get_live_price(ticker):
    """
    UC-09 | FR-10: Returns ONLY the current trading price for a stock.
    Much faster than /api/stock/<ticker> since it skips sentiment and graphs.
    Performance target: respond within 2.0 seconds (including cache).
    """
    try:
        target_stock = Stock(ticker_symbol=ticker)
        result = target_stock.fetchLivePrice()

        if result.get("status") == "error":
            return jsonify(result), 404

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/stocks/<ticker>/stream', methods=['GET'])
def stream_live_price(ticker):
    """
    UC-09 | SSE endpoint: Streams live price updates to connected clients.
    Sends a new price event every 10 seconds.
    The frontend connects with: const eventSource = new EventSource('/api/stocks/AAPL/stream')
    """
    def generate_price_stream(ticker_symbol):
        """Generator function that yields SSE-formatted price events."""
        while True:
            try:
                target_stock = Stock(ticker_symbol=ticker_symbol)
                result = target_stock.fetchLivePrice()

                if result.get("status") == "success":
                    event_data = {
                        "ticker": result["data"]["ticker"],
                        "currentPrice": result["data"]["currentPrice"],
                        "companyName": result["data"]["companyName"],
                        "timestamp": time_module.strftime("%Y-%m-%dT%H:%M:%S"),
                        "status": "live"
                    }
                else:
                    # If fetch failed, send a stale status so frontend shows fallback UI
                    event_data = {
                        "ticker": ticker_symbol.upper(),
                        "currentPrice": None,
                        "timestamp": time_module.strftime("%Y-%m-%dT%H:%M:%S"),
                        "status": "stale"
                    }

                # SSE format: "data: {json}\n\n"
                yield f"data: {json.dumps(event_data)}\n\n"

            except Exception as e:
                # Send error event so frontend can show "Price Stale" or "Market Closed" UI
                error_data = {
                    "ticker": ticker_symbol.upper(),
                    "currentPrice": None,
                    "timestamp": time_module.strftime("%Y-%m-%dT%H:%M:%S"),
                    "status": "error",
                    "message": str(e)
                }
                yield f"data: {json.dumps(error_data)}\n\n"

            # Wait 10 seconds before sending next update
            time_module.sleep(10)

    return Response(
        generate_price_stream(ticker),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'  # Prevents Nginx from buffering SSE
        }
    )

# ==========================================
# UC-17: STOCK COMPARISON ROUTE (Jeel Patel - Sprint 3)
# ==========================================

# ==========================================
# UC-17: STOCK COMPARISON ROUTE (Jeel Patel - Sprint 3)
# ==========================================

@app.route('/api/stocks/compare', methods=['POST'])
def compare_stocks_route():
    """
    Jeel Patel - Sprint 3 | UC-17
    Bridge for the Comparison View.
    """
    data = request.json or {}
    tickers = data.get('tickers', [])
    
    if not tickers or len(tickers) < 1:
        return jsonify({"status": "error", "message": "No tickers provided"}), 400
        
    result = compare_stocks(tickers)
    return jsonify(result), 200


# 2. PORTFOLIO ROUTES. (Krish's Route)
# ==========================================

@app.route('/api/watchlist/add', methods=['POST'])
def add_to_watchlist(): 
   
    """Adds a ticker to a user's watchlist, enforcing the 5-stock limit."""
    data = request.json
    user_id = data.get('user_id')
    ticker = data.get('ticker')
    
    if not user_id or not ticker:
        return jsonify({"status": "error", "message": "Missing user_id or ticker"}), 400

    user_watchlist = WatchList(user_id=user_id)
    result = user_watchlist.addTicker(ticker)
    
    #if a user tried to add a 6th stock, the watchlist class returns {"status": "error"}, and the frontend also looks at the HTTP Status Code
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code

@app.route('/api/watchlist/remove', methods=['DELETE'])
def remove_from_watchlist():
    """Removes a ticker from a user's watchlist."""
    data = request.json
    user_id = data.get('user_id')
    ticker = data.get('ticker')
    
    user_watchlist = WatchList(user_id=user_id)
    result = user_watchlist.removeTicker(ticker)
    
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code

@app.route('/api/user/watchlist', methods=['GET'])
def get_user_watchlist():
    """
    UC-13 | Returns enriched watchlist data with hype scores, 24h price change,
    and 5-day total return. Supports optional ?sort= server-side sorting.
    """
    user_id = request.args.get('user_id')
    sort = request.args.get('sort', '')

    if not user_id:
        return jsonify({"status": "error", "message": "Missing user_id"}), 400

    user_watchlist = WatchList(user_id=user_id)
    tickers = user_watchlist.get_all_tickers()

    if not tickers:
        return jsonify({"status": "success", "watchlist": []}), 200

    # Batch-fetch company names so we avoid N individual queries
    company_names = {}
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT ticker, company_name FROM stocks WHERE ticker = ANY(%s);",
            (tickers,)
        )
        company_names = {row[0]: row[1] for row in cur.fetchall()}
        cur.close()
    except Exception as e:
        print(f"DEBUG: Company name fetch error: {e}")
    finally:
        if conn:
            conn.close()

    dashboard_data = []

    for ticker in tickers:
        stock_data = get_price_data_and_ma(ticker)

        if "error" in stock_data:
            continue

        sentiment_data = get_5_day_sentiment(ticker)

        divergence_warning = calculate_divergence_flag(
            stock_data['price_trend_pct'],
            sentiment_data['trend_pct']
        )

        # hype score — calculateHypeScore uses a 5-minute DB cache so repeated calls are fast
        hype_result = sentiment_engine.calculateHypeScore(ticker)
        hype_score = hype_result.get('hype_score', 50)
        hype_tag = hype_result.get('tag', 'Neutral')

        # 24h price change derived from the two most recent closes already in historical_prices
        hist = stock_data['historical_prices']
        if len(hist) >= 2 and hist[-2]:
            price_change_24h = round(hist[-1] - hist[-2], 2)
            price_change_pct_24h = round((price_change_24h / hist[-2]) * 100, 2)
        else:
            price_change_24h = 0.0
            price_change_pct_24h = 0.0

        # total_return = 5-day price trend expressed as a percentage
        total_return = round(stock_data['price_trend_pct'] * 100, 2)

        dashboard_data.append({
            "ticker": ticker,
            "company_name": company_names.get(ticker, ticker),
            "current_price": stock_data['current_price'],
            "ma_5_day": stock_data['ma_5_day'],
            "hype_score": hype_score,
            "hype_tag": hype_tag,
            "price_change_24h": price_change_24h,
            "price_change_pct_24h": price_change_pct_24h,
            "total_return": total_return,
            "divergence_warning_active": divergence_warning,
            "graph_data": {
                "historical_prices": stock_data['historical_prices'],
                "historical_sentiment": sentiment_data['historical_sentiment']
            }
        })

    # Server-side sort when ?sort= is provided
    if sort == 'hype_desc':
        dashboard_data.sort(key=lambda x: x['hype_score'], reverse=True)
    elif sort == 'hype_asc':
        dashboard_data.sort(key=lambda x: x['hype_score'])
    elif sort == 'price_mover_desc':
        dashboard_data.sort(key=lambda x: abs(x['price_change_pct_24h']), reverse=True)

    return jsonify({
        "status": "success",
        "watchlist": dashboard_data
    }), 200
    
    
@app.route('/api/watchlist/alert', methods=['PATCH'])
def toggle_alert():
    """Toggles the alert_enabled boolean for a specific stock."""
    data = request.json
    user_id = data.get('user_id')
    ticker = data.get('ticker')
    is_enabled = data.get('is_enabled') # Expecting a boolean (True/False)
    
    alert_manager = Alerts(user_id=user_id, ticker_symbol=ticker)
    result = alert_manager.toggleAlert(is_enabled)
    
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code

@app.route('/api/alerts', methods=['POST'])
def configure_alert():
    """Saves a user's hype score alert threshold for a specific ticker."""
    data = request.json
    user_id = data.get('user_id')
    ticker = data.get('ticker')
    hype_threshold = data.get('hype_threshold')
    direction = data.get('direction', 'above')

    # Validate inputs
    if not user_id or not ticker or hype_threshold is None:
        return jsonify({"status": "error", "message": "Missing user_id, ticker, or hype_threshold"}), 400

    if not isinstance(hype_threshold, int) or not (1 <= hype_threshold <= 99):
        return jsonify({"status": "error", "message": "hype_threshold must be between 1 and 99"}), 400

    if direction not in ('above', 'below'):
        return jsonify({"status": "error", "message": "direction must be 'above' or 'below'"}), 400

    alert_manager = Alerts(user_id=user_id, ticker_symbol=ticker)
    result = alert_manager.configureAlert(hype_threshold, direction)

    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code
  # 2nd route
@app.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    """Returns the user's watchlist with alert settings."""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"status": "error", "message": "Missing user_id"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """SELECT ticker, alert_enabled, hype_threshold, direction 
               FROM watchlist WHERE user_id = %s;""",
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close()
        
        watchlist = [
            {"ticker": r[0], "alert_enabled": r[1], "hype_threshold": r[2], "direction": r[3]}
            for r in rows
        ]
        return jsonify({"status": "success", "watchlist": watchlist}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()
# ==========================================
# 3. USER & AUTH ROUTES
# ==========================================

@app.route('/api/user/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"status": "error", "message": "Missing username, email, or password"}), 400

    result = User.register(username, email, password)
    status_code = 201 if result["status"] == "success" else 400
    return jsonify(result), status_code

@app.route('/api/user/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"status": "error", "message": "Missing email or password"}), 400

    result = User.login(email, password)
    status_code = 200 if result["status"] == "success" else 401
    return jsonify(result), status_code

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    """Verifies Google OAuth token and logs in or auto-registers the user."""
    data = request.json
    credential = data.get('credential')

    if not credential:
        return jsonify({"status": "error", "message": "Missing Google credential"}), 400

    result = User.google_login(credential)
    status_code = 200 if result["status"] == "success" else 401
    return jsonify(result), status_code

@app.route('/api/user/delete', methods=['DELETE'])
@token_required
def delete_account():
    """Deletes the authenticated user's account."""
    current_user = User(request.current_user_id, request.current_username, "")
    result = current_user.delete_account()
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile():
    """Returns the authenticated user's profile including onboarding status."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT username, email, has_completed_onboarding FROM users WHERE id = %s",
            (request.current_user_id,)
        )
        row = cur.fetchone()
        cur.close()
        if row is None:
            return jsonify({"status": "error", "message": "User not found"}), 404
        username, email, has_completed_onboarding = row
        return jsonify({
            "status": "success",
            "username": username,
            "email": email,
            "has_completed_onboarding": has_completed_onboarding,
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_profile():
    """Updates user information (protected — requires JWT)."""
    data = request.json
    current_user = User(request.current_user_id, request.current_username, "")
    result = current_user.updateProfile(
        new_username=data.get('username'),
        new_email=data.get('email'),
        new_password=data.get('password'),
    )
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code

# ==========================================
# FORGOT PASSWORD & RESET PASSWORD ROUTES
# ==========================================
@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Endpoint to trigger the password reset email flow."""
    data = request.json
    # we'll conduct the user reset by email
    email = data.get('email')

    # if no email in payload, return an error message
    if not email:
        return jsonify({"status": "error", "message": "Missing email address"}), 400

    # generate the secret reset token to allow the user to resest their password
    result = User.generate_reset_token(email)
    status_code = 200 if result["status"] == "success" else 500
    return jsonify(result), status_code

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Endpoint that receives the token and apply the new password."""
    data = request.json
    token = data.get('token')
    new_password = data.get('new_password')

    # if no email in payload, return an error message
    if not token or not new_password:
        return jsonify({"status": "error", "message": "Missing token or new password"}), 400

    # call the reset password function and return the result
    result = User.reset_password_with_token(token, new_password)
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code

@app.route('/api/user/onboarding', methods=['PATCH'])
@token_required
def complete_onboarding():
    """Marks the interactive tour as completed for the authenticated user."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET has_completed_onboarding = TRUE WHERE id = %s",
            (request.current_user_id,)
        )
        conn.commit()
        cur.close()
        return jsonify({"status": "success", "message": "Onboarding tour marked as completed"}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

# starts the flask server in development mode
if __name__ == '__main__':
    app.run(debug=True, port=5000)