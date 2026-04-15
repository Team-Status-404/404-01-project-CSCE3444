// UC-14: Tooltip copy constants for all StockIQ labels and metrics.
// Plain-English, beginner-friendly, 1–2 sentences max.
// Add new entries here — never hard-code copy inside components.

export const TOOLTIP_COPY = {
  // ── Proprietary metrics (UC-14 FR-26) ──────────────────────────────────
  HYPE_SCORE:
    "A 0–100 score measuring how much buzz a stock is generating from news and social media right now. Higher scores mean more market attention.",
  DIVERGENCE_WARNING:
    "Triggered when the price trend and sentiment trend move in opposite directions by more than 20% — a signal that the market narrative may be disconnecting from actual price action.",
  NLP_TAGS:
    "Sentiment label (Positive, Neutral, or Negative) automatically assigned by our NLP engine after scanning recent news headlines and social posts about this stock.",

  // ── Navigation & Search ─────────────────────────────────────────────────
  SEARCH_BAR:
    "Type any stock ticker (e.g. AAPL) or company name and press Enter to open its full analysis page.",

  // ── Dashboard ───────────────────────────────────────────────────────────
  WATCHLIST_SECTION:
    "Stocks you're personally tracking. Each card shows live price, a 5-day trend, and any active market warnings.",
  DASHBOARD_MA:
    "5-Day Moving Average — the average closing price over the last 5 trading days. A rising MA means the stock has been trending up.",

  // ── Markets page ────────────────────────────────────────────────────────
  TRENDING_STOCKS:
    "Stocks with unusually high trading volume or news coverage today. Click any row to open the full analysis page.",
  MARKET_SENTIMENT:
    "How positive or negative the overall market mood is right now, based on scanning recent news and social media posts.",

  // ── Watchlist & Alerts ──────────────────────────────────────────────────
  ADD_TO_WATCHLIST:
    "Saves this stock to your personal dashboard so you can monitor its price and sentiment every day. You can track up to 5 stocks at a time.",
  SET_ALERT:
    "Get notified when this stock's Hype Score goes above or below a number you choose — so you never miss a big move.",
  ALERTS_THRESHOLD:
    "The Hype Score value (1–99) that triggers your alert. When the score crosses this number in your chosen direction, you'll receive a notification.",

  // ── Stock Analysis stats ─────────────────────────────────────────────────
  VOLATILITY:
    "How much the stock price has been swinging lately. Higher volatility means bigger price moves — both up and down — which means more risk.",
  WEEK_52_HIGH:
    "The highest price this stock reached over the past year. Useful for seeing how far the stock is from its recent peak.",
  WEEK_52_LOW:
    "The lowest price this stock hit over the past year. Can signal a potential recovery opportunity or an ongoing decline.",

  // ── Profile page ────────────────────────────────────────────────────────
  PROFILE_USERNAME:
    "Your display name shown across StockIQ. It's not your email address — just how we identify you.",
  PROFILE_PASSWORD:
    "Choose a new password between 6–10 characters that includes at least one special character (e.g. ! @ # $ %).",
  DANGER_ZONE:
    "Permanently removes your account and all associated data from StockIQ. This action cannot be undone.",
} as const;
