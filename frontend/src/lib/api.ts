import {
  MarketOverviewResponse,
  StockDetailResponse,
  StockIndicatorsResponse,
  AIAnalysisResponse,
  NewsSentimentResponse,
  BacktestResponse,
  WatchlistItem,
  WatchlistTrendsResponse,
  IPOListResponse,
  IPOItem,
  IPOAIVerdict,
  Nifty50Stock,
  CreateAlertRequest,
  AlertItem,
  AlertListResponse,
} from "./types";
import { getAuthHeader } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const authHeaders = await getAuthHeader();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errDetail = "API request failed";
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || errJson.message || errDetail;
    } catch {
      // fallback
    }
    throw new Error(errDetail);
  }

  return res.json();
}

export const api = {
  // F1 Market Overview & Nifty 50 Trade
  getMarketOverview: () => fetchJson<MarketOverviewResponse>("/api/market/overview"),
  getNifty50Constituents: () => fetchJson<Nifty50Stock[]>("/api/market/nifty50"),
  getMarketStatus: () => fetchJson<{ market: any; provider: any }>("/api/market/status"),

  // F2 Stock Analyzer & Fundamentals
  getStockDetail: (symbol: string, period: string = "1y") =>
    fetchJson<StockDetailResponse>(`/api/stocks/${encodeURIComponent(symbol)}?period=${period}`),

  getStockIndicators: (symbol: string, period: string = "1y") =>
    fetchJson<StockIndicatorsResponse>(`/api/stocks/${encodeURIComponent(symbol)}/indicators?period=${period}`),

  // F3 AI Analyst
  generateAIAnalysis: (symbol: string) =>
    fetchJson<AIAnalysisResponse>(`/api/stocks/${encodeURIComponent(symbol)}/ai-analysis`, {
      method: "POST",
    }),

  // F4 News & Sentiment
  getNewsSentiment: (symbol?: string) =>
    fetchJson<NewsSentimentResponse>(symbol ? `/api/news?symbol=${encodeURIComponent(symbol)}` : "/api/news"),

  // F5 Backtester
  runBacktest: (data: { symbol: string; strategy: string; timeframe_years: number; initial_capital: number }) =>
    fetchJson<BacktestResponse>("/api/backtest", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Watchlist & Marketing Trends
  getWatchlist: () => fetchJson<WatchlistItem[]>("/api/watchlist"),
  getWatchlistTrends: () => fetchJson<WatchlistTrendsResponse>("/api/watchlist/trends"),

  addToWatchlist: (symbol: string) =>
    fetchJson<WatchlistItem>("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ symbol }),
    }),

  removeFromWatchlist: (symbol: string) =>
    fetchJson<{ status: string; message: string }>(`/api/watchlist/${encodeURIComponent(symbol)}`, {
      method: "DELETE",
    }),

  // Price Alerts (Target & Limit Notifications)
  getAlerts: () => fetchJson<AlertListResponse>("/api/alerts"),

  createAlert: (req: CreateAlertRequest) =>
    fetchJson<AlertItem>("/api/alerts", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  deleteAlert: (alertId: string) =>
    fetchJson<{ status: string; message: string }>(`/api/alerts/${encodeURIComponent(alertId)}`, {
      method: "DELETE",
    }),

  resetAlert: (alertId: string) =>
    fetchJson<{ status: string; message: string }>(`/api/alerts/${encodeURIComponent(alertId)}/reset`, {
      method: "POST",
    }),

  // F6 Indian IPO Tracker
  getIPOs: (status?: string) =>
    fetchJson<IPOListResponse>(status ? `/api/ipo?status=${encodeURIComponent(status)}` : "/api/ipo"),

  getIPODetail: (id: string) => fetchJson<IPOItem>(`/api/ipo/${encodeURIComponent(id)}`),

  getIPOAIVerdict: (id: string) =>
    fetchJson<IPOAIVerdict>(`/api/ipo/${encodeURIComponent(id)}/ai-verdict`, {
      method: "POST",
    }),
};
