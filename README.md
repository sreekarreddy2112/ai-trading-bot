# MarketMind India 🇮🇳
### Autonomous AI Indian Stock Market Analyst & Quantitative Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat&logo=next.js)](https://nextjs.org)
[![Anthropic Claude](https://img.shields.io/badge/Claude%203.5-Sonnet-D97706?style=flat&logo=anthropic)](https://anthropic.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python)](https://www.python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com)

MarketMind India is an institutional-grade, full-stack stock analysis platform engineered specifically for the Indian equity universe (**NSE/BSE**). It combines algorithmic technical indicator computation, Google News sentiment scoring, zero look-ahead bias strategy backtesting, and structured synthesis from **Claude 3.5 Sonnet** to deliver plain-English financial thesis cards.

---

> ### ⚠️ Mandatory Regulatory Compliance Notice (SEBI)
> **Educational & Informational Purpose Only.**  
> MarketMind India is not a SEBI-registered investment advisor, research analyst, or portfolio manager. Nothing within this application constitutes financial advice, trade signals, or recommendations to buy or sell securities. Past performance is no guarantee of future returns.

---

## 🏗️ Architecture

```
                                      [ User Browser ]
                                             │
                       HTTPS / REST          ▼
              ┌──────────────────────────────────────────────┐
              │             Next.js 14+ Frontend             │
              │  (Vercel App Router, Tailwind CSS, Recharts) │
              └──────────────────────┬───────────────────────┘
                                     │  (Client never touches Claude API
                                     │   or external secret keys)
                                     ▼
              ┌──────────────────────────────────────────────┐
              │             FastAPI Backend Server           │
              │         (Render / Cloud Python Runtime)      │
              │                                              │
              │  • Market Data Service (yfinance .NS)       │
              │  • Indicator Engine (pandas, Wilder RSI,    │
              │     MACD, Bollinger, SMA 20/50/200)          │
              │  • Deterministic Signal Classifier           │
              │  • Claude 3.5 Sonnet Synthesis Engine        │
              │  • News Sentiment & MD5 Hash Cache           │
              │  • Backtesting Engine (0 Look-Ahead Bias)    │
              │  • Supabase / Local Persistence Store        │
              └──────────────────────────────────────────────┘
```

---

## ⚡ Key Features

### 1. Market Overview Dashboard (`/`)
- Benchmark telemetry for **Nifty 50 (^NSEI)**, **BSE Sensex (^BSESN)**, and **Bank Nifty (^NSEBANK)** with sparklines.
- Real-time Top 5 Gainers and Losers across the Nifty 50 universe.
- Sector performance overview across IT, Banking, Auto, Energy, FMCG, Pharma, and Metal.
- In-memory 5-minute cache with delayed data compliance indicators.

### 2. Deep Stock Analyzer (`/analyze/{symbol}`)
- Autocomplete search across all NSE equities (e.g. `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, `TATAMOTORS`).
- Comprehensive fundamentals: Market Cap, P/E Ratio, 52-Week High/Low, Support/Resistance levels.
- Interactive multi-timeframe chart (1M, 6M, 1Y) with toggleable overlays:
  - Simple Moving Averages: SMA 20, 50, 200
  - Bollinger Bands (20 period, 2 std dev)
  - Dynamic Support & Resistance levels from swing pivots
  - RSI (14 period Wilder smoothed) with 70/30 thresholds
  - MACD (12, 26, 9) with histogram
- Rule-based algorithmic signal generator: **Bullish**, **Neutral**, or **Bearish** with specific supporting reasons.

### 3. Claude 3.5 Sonnet AI Analyst
- One-click synthesis converting quantitative metrics into plain-English reasoning.
- Strict Pydantic JSON schema:
  - `summary`: 2-3 sentence executive thesis
  - `trend`: "uptrend" | "downtrend" | "sideways"
  - `key_points`: Grounded technical observations
  - `risks`: Downside triggers & macro volatility risks
  - `watch_next`: Levels and catalysts to monitor
  - `confidence`: "low" | "medium" | "high"
- **Zero Hallucination Guardrail**: The system prompt strictly prohibits inventing prices; all metrics are pre-calculated by pandas and injected into the prompt.
- 30-minute caching and per-IP rate limiting (10 requests/hour).

### 4. News & Sentiment Engine
- Live RSS feed streaming from Google News for `{symbol} NSE stock`.
- Financial sentiment classification: Positive, Neutral, Negative with score (-1.0 to +1.0).
- MD5 headline hash caching to guarantee the same headline is never analyzed twice.

### 5. Quantitative Strategy Backtester (`/backtest`)
- Supported models:
  1. **SMA Crossover**: 20 SMA vs 50 SMA
  2. **RSI Mean Reversion**: Buy < 30, Exit > 70
- **Strictly Zero Look-Ahead Bias**: Signal calculated at bar $t-1$ close executes strictly on bar $t$.
- Output metrics: Strategy Return %, Benchmark (Buy & Hold) Return %, Win Rate %, Max Drawdown %, and full equity curve comparison chart.

### 6. Dynamic Watchlist (`/watchlist`)
- Save favorite stocks with live prices, percentage change, and an instant one-line AI brief.

---

## 🛠️ Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide React | High-performance, responsive dark-themed trading dashboard |
| **Backend** | Python 3.11+, FastAPI, pandas, numpy, yfinance, Pydantic v2 | Industry-standard for quantitative finance and AI engineering |
| **AI Synthesis** | Anthropic Claude API (`claude-3-5-sonnet-20241022`) | Superior financial reasoning and schema compliance |
| **Testing** | pytest (13/13 passing tests) | Validates indicator math and backtest logic |
| **Deployment** | Vercel (Frontend), Render (Backend) | Free-tier compatible CI/CD |

---

## 📁 Repository Structure

```
ai trading bot/
├── backend/
│   ├── main.py                     # FastAPI entry point, CORS, routers
│   ├── config.py                   # Environment & caching settings
│   ├── requirements.txt            # Python dependencies
│   ├── conftest.py                 # Pytest configuration
│   ├── models/
│   │   └── schemas.py              # Pydantic models for request/response validation
│   ├── services/
│   │   ├── market_data.py          # yfinance NSE fetcher, caching & fallback
│   │   ├── indicators.py           # Wilder RSI, MACD, SMA, Bollinger, Signals
│   │   ├── ai_analyst.py           # Claude 3.5 Sonnet integration & schema validation
│   │   ├── news_sentiment.py       # Google News RSS & sentiment hash cache
│   │   └── backtester.py           # Quantitative backtester (no look-ahead)
│   ├── routers/
│   │   ├── market.py               # /api/market/overview
│   │   ├── stocks.py               # /api/stocks/{symbol}, /indicators, /ai-analysis
│   │   ├── news.py                 # /api/news
│   │   ├── backtest.py             # /api/backtest
│   │   └── watchlist.py            # /api/watchlist
│   └── tests/
│       ├── test_indicators.py      # Unit tests for indicator mathematics
│       └── test_backtester.py      # Unit tests for backtest execution & no-lookahead
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   └── src/
│       ├── app/                    # App Router pages (/, /analyze, /backtest, /watchlist)
│       ├── components/             # Reusable UI components
│       └── lib/                    # API client, TypeScript definitions, formatting
└── docs/
    └── SOW.md                      # Statement of Work & requirements
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm / pnpm

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Edit backend/.env and optionally add your ANTHROPIC_API_KEY

# Run unit tests
python -m pytest tests

# Start FastAPI server
python -m uvicorn main:app --reload --port 8000
```
Backend API will be accessible at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Configure environment variables
copy .env.example .env.local

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🌐 Production Deployment

### Backend (Render)
1. Push this repository to GitHub.
2. In Render Dashboard, click **New +** -> **Web Service**.
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
6. Add Environment Variables:
   - `ANTHROPIC_API_KEY`: your Claude API key
   - `ALLOWED_ORIGIN`: your Vercel frontend URL (e.g. `https://marketmind-india.vercel.app`)

### Frontend (Vercel)
1. In Vercel Dashboard, import the Git repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Next.js**.
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: your deployed Render backend URL (e.g. `https://marketmind-backend.onrender.com`)
5. Click **Deploy**.

---

## 🎯 3 Key Architecture Decisions

1. **Why API keys stay strictly on the backend**:  
   Exposing an Anthropic API key on the frontend would allow malicious actors to extract and drain token balances. All AI calls, rate limits (10/hour), and 30-minute response caching are managed by FastAPI.
2. **How Claude is prevented from inventing numbers**:  
   The indicator engine calculates numerical values in Python using `pandas` and passes verified floats in JSON to Claude. The system prompt instructs Claude to act solely as an analytical explainer of the provided numbers and never invent market prices.
3. **How look-ahead bias is eliminated in the backtester**:  
   Signals generated at the close of trading bar $t-1$ are explicitly shifted (`signal.shift(1)`), ensuring that the position is only entered on bar $t$ without future price knowledge.
