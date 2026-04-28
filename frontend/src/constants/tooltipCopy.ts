// UC-14: Tooltip copy constants for all StockIQ labels and metrics.
export const TOOLTIP_COPY = {
  // ── Proprietary metrics ──────────────────────────────────
  HYPE_SCORE: "A 0–100 score measuring how much buzz a stock is generating from news and social media right now.",
  HYPE_SENTIMENT: "An AI-driven overall sentiment reading that factors in price momentum and media coverage.",
  DIVERGENCE_WARNING: "Triggered when price and sentiment move in opposite directions by more than 20%.",
  NLP_TAGS: "Sentiment label extracted directly from recent news headlines using NLP.",

  // ── Navigation & Search ──────────────────────────────────
  SEARCH_BAR: "Type any stock ticker (e.g. AAPL) and press Enter to open its full analysis page.",

  // ── Dashboard ─────────────────────────────────────────────
  WATCHLIST_SECTION: "Stocks you're personally tracking with live price and trend data.",
  DASHBOARD_MA: "5-Day Moving Average — the average closing price over the last 5 trading days.",

  // ── Markets page ─────────────────────────────────────────
  TRENDING_STOCKS: "Stocks with unusually high trading volume or news coverage today.",
  MARKET_SENTIMENT: "How positive or negative the overall market mood is right now.",
  // NEW UC-17 CONSTANT ADDED HERE:
  MARKET_COMPARISON: "Enter multiple stock tickers (e.g., AAPL NVDA) to compare their relative performance side-by-side.",

  // ── Watchlist & Alerts ───────────────────────────────────
  ADD_TO_WATCHLIST: "Saves this stock to your personal dashboard. Track up to 5 stocks.",
  SET_ALERT: "Get notified when a stock's Hype Score crosses a chosen threshold.",
  ALERTS_THRESHOLD: "The Hype Score value (1–99) that triggers your notification.",

  // ── Stock Analysis stats ─────────────────────────────────
  VOLATILITY: "How much the stock price has been swinging. Higher means more risk.",
  WEEK_52_HIGH: "The highest price this stock reached over the past year.",
  WEEK_52_LOW: "The lowest price this stock hit over the past year.",

  // ── Profile page ─────────────────────────────────────────
  PROFILE_USERNAME: "Your display name shown across StockIQ.",
  PROFILE_PASSWORD: "Choose a new password between 6–10 characters with one special character.",
  DANGER_ZONE: "Permanently removes your account and data. This cannot be undone.",
} as const;