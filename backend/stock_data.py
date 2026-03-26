import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("FINANCE_DATA_KEY")

def stock_data(ticker):
    if not API_KEY:
        return {"error": "Server configuration error: Missing API Key."}, 500

    ticker = ticker.upper()
    
    try:
        # --- PROFILE ENDPOINT ---
        profile_url = f"https://financialmodelingprep.com/stable/profile?symbol={ticker}&apikey={API_KEY}"
        profile_resp = requests.get(profile_url)
        
        # NEW: Catch non-JSON HTML error pages from FMP
        if profile_resp.status_code != 200:
            print(f"Profile API Failed: {profile_resp.text}")
            return {"error": f"FMP Profile Endpoint rejected {ticker}. Status: {profile_resp.status_code}"}, 500
            
        profile_response = profile_resp.json()
        
        if isinstance(profile_response, dict) and "Error Message" in profile_response:
            return {"error": f"API Provider Error: {profile_response['Error Message']}"}, 403

        if not profile_response:
            return {"error": f"No data found for {ticker}."}, 404

        name = profile_response[0].get('companyName', ticker)

        # --- HISTORICAL ENDPOINT ---
        history_url = f"https://financialmodelingprep.com/stable/historical-price-eod/full?symbol={ticker}&apikey={API_KEY}"
        history_resp = requests.get(history_url)
        
        # NEW: Catch non-JSON HTML error pages from FMP
        if history_resp.status_code != 200:
            print(f"History API Failed: {history_resp.text}")
            return {"error": f"FMP History Endpoint rejected {ticker}. Status: {history_resp.status_code}"}, 500

        history_response = history_resp.json()

        if isinstance(history_response, dict) and "Error Message" in history_response:
             return {"error": f"API Provider Error: {history_response['Error Message']}"}, 403

        if not isinstance(history_response, list) or len(history_response) == 0:
            return {"error": "Historical data unavailable."}, 404
            
        historical_data = history_response
        current_price = historical_data[0]['close']
        
        recent_5_days = historical_data[:5]
        closing_prices = [day['close'] for day in recent_5_days]
        moving_avg_5d = sum(closing_prices) / len(closing_prices)

        return {
            "ticker": ticker,
            "name": name,
            "current_price": round(current_price, 2),
            "moving_average_5d": round(moving_avg_5d, 2),
            "status": "Success!"
        }, 200

    except Exception as e:
        return {"error": f"Internal Server Error: {str(e)}"}, 500
