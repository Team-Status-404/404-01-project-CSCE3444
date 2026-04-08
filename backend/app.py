import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# --- NEW OOP DOMAIN MODULES ---
from models.market_intelligence import Stock, SentimentAnalyzer
from models.portfolio import WatchList, Alerts
from models.user_management import User, token_required

# Load environment variables (Supabase URL, API Keys, etc.)
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# ==========================================
# SERVER INITIALIZATION
# ==========================================

# Initialize the VADER engine ONCE when the server starts.
# This saves memory and makes the sentiment route work faster.
vader_engine = SentimentIntensityAnalyzer()
news_api_key = os.getenv("NEWSDATA_API_KEY")
sentiment_engine = SentimentAnalyzer(vader_engine, news_api_key) # applies to all clients making requests of the server


@app.route('/')
def home():
    return jsonify({"message": "StockIQ Backend is running securely and is connected to Database"})

# ==========================================
# 1. MARKET DATA ROUTES (Jeel's route)
# ==========================================

@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker): 
    """Fetch stock price, name, and moving averages using the Stock object."""
    try:
        # Create a temporary Stock object to fetch the data
        target_stock = Stock(ticker_symbol=ticker)
        result = target_stock.fetch_stock_data()
        
        # If the fetch failed (e.g., invalid ticker), return a 404
        if result.get("status") == "error":
            return jsonify(result), 404
            
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

# ==========================================
# 2. PORTFOLIO ROUTES
# ==========================================

@app.route('/api/watchlist/add', methods=['POST'])
def add_to_watchlist(): 
    """
        this function is fatter than the previous functions because our python classes 
        don't know what http or json is, so the route has to handle "upacking" the web request
        before it can hand it over to the variables
    """
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
    """
        this function is fatter than the previous functions because our python classes 
        don't know what http or json is, so the route has to handle "upacking" the web request
        before it can hand it over to the variables
    """
    """Removes a ticker from a user's watchlist."""
    data = request.json
    user_id = data.get('user_id')
    ticker = data.get('ticker')
    
    user_watchlist = WatchList(user_id=user_id)
    result = user_watchlist.removeTicker(ticker)
    
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code

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

# ==========================================
# 3. USER & AUTH ROUTES (Lance's Domain)
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)