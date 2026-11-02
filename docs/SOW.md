# SOW: AI Indian Stock Market Analyst

**Working name:** MarketMind India  
**Target:** Full-stack AI-powered Indian (NSE/BSE) Equity Analytics & Intelligence Platform  
**Purpose:** Portfolio-grade, production-ready web application for investors, analysts, and recruiters to explore Indian equities with technical indicators, news sentiment, AI narrative explanations, and backtested trading strategies.

---

## 1. Objective

Build a deployed web app that analyzes Indian (NSE/BSE) stocks using technical indicators and news, then uses the Claude API to explain the result in plain English. The goal is a portfolio piece that HR and founders can open in 30 seconds and understand.

> **Non-goals:** Real order execution, broker login, paid signals, guaranteed predictions. This is an analysis and education tool, not investment advice (SEBI rules apply to financial advice).

---

## 2. Architecture & System Flow

```
[User Browser]
      │
      ▼
[Next.js 14+ Web App] (Vercel)
      │  (Client never accesses external APIs or secret keys directly)
      ▼
[FastAPI Backend] (Render)
      ├── Market Data Service (yfinance for NSE .NS tickers, Yahoo Finance RSS)
      ├── Indicator Engine (pandas, numpy: RSI, MACD, SMA/EMA, Bollinger Bands, Support/Resistance)
      ├── Rule-based Signal Classifier (Bullish, Neutral, Bearish with reasons)
      ├── AI Analyst Service (Claude API / Anthropic SDK with validated JSON schema)
      ├── News & Sentiment Service (Google News RSS + batch sentiment caching)
      ├── Backtesting Engine (SMA crossover, RSI 30/70, strictly no look-ahead bias)
      └── Storage & Auth Layer (Supabase Postgres & JWT Auth, with local persistence fallback)
```

**Rule:** The browser never calls Claude or market APIs directly. Everything routes through the backend to keep keys secure, apply rate limiting, and cache expensive calls.

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts | Modern, highly responsive, professional dark/light financial UI |
| **Backend** | Python 3.11+, FastAPI, pandas, numpy, yfinance, Pydantic v2 | Industry standard for Python AI Engineering & quantitative finance |
| **Database / Auth** | Supabase (Postgres + Supabase Auth) | Row Level Security, clean auth flow, scalable |
| **AI Layer** | Claude API (`claude-3-5-sonnet-20241022` / `claude-sonnet-5-5`) | Best-in-class financial reasoning, structured JSON outputs |
| **Testing** | pytest, httpx | Unit tests for technical indicator formulas & backtest engine |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend) | Free tier friendly, zero-friction CI/CD |

---

## 4. Core Features

### F1. Market Overview Dashboard
- Benchmark cards: **Nifty 50 (^NSEI)**, **BSE Sensex (^BSESN)**, **Bank Nifty (^NSEBANK)** with day change, percentage, and sparkline trends.
- Top 5 Gainers & Top 5 Losers from Nifty 50 universe.
- Sector performance overview (IT, Banking, Auto, Pharma, Energy, FMCG, Metal).
- Data caching (5 minutes in-memory backend cache) to prevent rate limits and ensure sub-3-second load times.
- "Data Delayed (15 min) - For Educational Use Only" compliance badge.

### F2. Stock Analyzer
- Search any NSE stock (e.g., `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, `TATAMOTORS`).
- Interactive candlestick / price chart (1M, 6M, 1Y timeframes).
- Indicator overlays & subcharts:
  - RSI (14 period with 70/30 overbought/oversold levels)
  - MACD (12, 26, 9 with histogram)
  - SMA 20, 50, 200 & EMA 20
  - Bollinger Bands (20 period, 2 std dev)
  - Support & Resistance key levels (calculated from local swing extrema)
- Algorithmic Rule-based Signal: **Bullish**, **Neutral**, or **Bearish** with specific supporting reasons.

### F3. AI Analyst (Headline Feature)
- One-click deep synthesis sending computed technical metrics and news headlines to Claude.
- Strict Pydantic output schema:
  - `summary`: 2-3 sentences executive summary
  - `trend`: "uptrend" | "downtrend" | "sideways"
  - `key_points`: List of 3-4 bullet observations
  - `risks`: List of primary downside / upside risks
  - `watch_next`: Catalysts and technical price triggers to monitor
  - `confidence`: "low" | "medium" | "high"
- Strict guardrails: Model never invents prices; prompt instructs analysis only on provided metrics. Mandatory disclaimer appended in code.
- 30-minute result caching and per-user/IP rate limiting.

### F4. News & Sentiment Feed
- Real-time headline fetching for `{SYMBOL} NSE stock` via Google News RSS.
- Claude batch sentiment classification: Positive, Neutral, Negative with score (-1.0 to +1.0).
- Sentiment meter & aggregate sentiment gauge.
- In-memory / database caching by headline MD5 hash to prevent redundant AI calls.

### F5. Watchlist & Strategy Backtester
- User watchlist with real-time price updates and 1-line AI summary brief.
- Quantitative backtesting engine supporting:
  - Strategy 1: SMA Crossover (e.g. 20 SMA crossing 50 SMA)
  - Strategy 2: RSI Mean Reversion (Buy < 30, Sell > 70)
- Execution guarantees: Strictly zero look-ahead bias (signals generated on previous bar close).
- Performance metrics: Total Return %, Benchmark (Buy & Hold) Return %, Win Rate %, Max Drawdown %, and full equity curve comparison.

---

## 5. Security & Compliance (SEBI Disclaimer)

- Prominent banner on all views:  
  *“MarketMind India is an analytical and educational platform. It does not provide SEBI-registered investment advice, stock recommendations, or portfolio management services. Past performance does not guarantee future returns.”*
- Zero collection or storage of broker credentials or trade execution APIs.
- API keys strictly isolated on the backend.

