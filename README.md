# 404-01-project-CSCE3444 (StockIQ)

<div align="center">

<a href="https://stockiq-nu.vercel.app/"><img src="https://img.shields.io/badge/Website-stockiq--nu.vercel.app-00853E?style=flat-square" alt="Website" height="25"></a>
<a href="https://stockiq-nu.vercel.app/"><img src="https://img.shields.io/website?url=https%3A%2F%2Fstockiq-nu.vercel.app%2F&label=Frontend&style=flat-square" alt="Frontend Status" height="25"></a>
<a href="https://stockiq-353106949537.us-south1.run.app/"><img src="https://img.shields.io/website?url=https%3A%2F%2Fstockiq-353106949537.us-south1.run.app%2F&label=Backend&style=flat-square" alt="Backend Status" height="25"></a>

</div>


**Team Name:** Group 404

**Project Overview:** StockIQ is a financial analytics application designed to quantify public sentiment around specific U.S.-traded stock symbols. By aggregating real-time data from news headlines and social forums to generate a "Hype Score," StockIQ provides contextual insights to help novice investors distinguish between genuine market value and social media noise.

## Current Features
* **Secure Authentication:** Create an account using an email/password (securely hashed with bcrypt) or bypass registration entirely by logging in with Google OAuth 2.0.  

<p align="center">
  <img src="images/login.png" width="70%" alt="Login page">
</p>

* **Personalized Dashboard:** Complete a quick onboarding flow to select up to 5 favorite stocks, which populate your home dashboard with live, real-time data.

<p align="center">
  <img src="images/dashboard.png" width="90%" alt="Login page">
</p>

* **Live Ticker Search:** Instantly query valid US stock tickers using the integrated yfinance API.

<p align="center">
  <img src="images/search.png" width="80%" alt="Login page">
</p>

* **Hype Score & Sentiment Tagging:** View a visual 0-100 speedometer gauge for any stock. Our backend uses VADER NLP to parse recent news and tag the sentiment as Positive, Neutral, or Negative.

<p align="center">
  <img src="images/hype_meter.png" width="80%" alt="Login page">
</p>

* **Trending Hype Display:** Discover new opportunities by viewing stocks that are currently trending with high social media volume across the market.

<p align="center">
  <img src="images/trending.png" width="80%" alt="Login page">
</p>

* **Custom Hype Alerts:** Set custom numeric thresholds on specific stocks to receive notifications when market hype exceeds your configured limits.

<p align="center">
  <img src="images/alerts.png" width="80%" alt="Login page">
</p>

* **Profile Management:** Securely manage your account details, update your password, or permanently delete your data and watchlist preferences.

<p align="center">
  <img src="images/profile_management.png" width="70%" alt="Login page">
</p>

## Getting Started (Local Development)

To get this project running locally, you will need to have **Python 3**, **Node.js**, and **npm** installed on your machine.

### 1. Run the Setup Script
We have provided initialization scripts that will automatically create your Python virtual environment, install all backend and frontend dependencies, and generate your local `.env` files.

**For macOS / Linux:**
Open your terminal in the root directory and run:
\`\`\`bash
bash init-mac.sh
\`\`\`

**For Windows:**
Double-click the script in your file explorer, or run this in your Command Prompt:
\`\`\`bat
init-windows.bat
\`\`\`

### 2. Configure Environment Variables
The setup script automatically creates `.env` files in both the `/backend` and `/frontend` directories. You will need to open them and fill in the missing values:
* **DB_PASSWORD:** (Ask Lance for the current password)
* **NEWSDATA_API_KEY:** (Obtain from your newsdata.io dashboard)
* **GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID:** (Obtain from Google Cloud Console)

### 3. Run the Application
Once setup is complete, you will need two terminal windows to run the full stack:

**Terminal 1 (Backend):**
\`\`\`bash
cd backend
# On Mac/Linux: source venv/bin/activate
# On Windows: venv\Scripts\activate
python app.py
\`\`\`

**Terminal 2 (Frontend):**
\`\`\`bash
cd frontend
npm run dev
\`\`\`

Finally, open your browser and navigate to **http://localhost:5173** to view the application!

## Team Roster

* **David Oladipupo**
  * **Role:** Repository Owner / Developer
  * **EUID:** do0261
  * **Email:** DavidOladipupo@my.unt.edu
  * **Phone:** 682 246 8060

* **Lance Joseph Trasporto**
  * **Role:** Repository Owner / Developer
  * **EUID:** lat0242
  * **Email:** LanceJosephTrasporto@my.unt.edu
  * **Phone:** 940 758 2193    

* **Patel Jeel**
  * **Role:** Developer
  * **EUID:** jdp0476
  * **Email:** JeelDharmeshkumarPatel@my.unt.edu
  * **Phone:** 580 853 3998

* **Yasas P Timilsena**
  * **Role:** Developer
  * **EUID:** ypt0007
  * **Email:** YasasTimilsena@my.unt.edu
  * **Phone:** 606 898 7367

* **Krish Gautam**
  * **Role:** Developer
  * **EUID:** kg0761
  * **Email:** Krishgautam@my.unt.edu
  * **Phone:** 940 843 7404

## Project Links
* **Trello Board:** [StockIQ Sprint Board](https://trello.com/invite/b/699055a25d002d93008bee54/ATTIb5663ce079b4dbd5a988e69b9a963ac39055F0DD/404-01-project-csce3444)
