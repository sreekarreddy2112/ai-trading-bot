"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { WatchlistItem, WatchlistTrendsResponse } from "@/lib/types";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import PriceAlertModal from "@/components/PriceAlertModal";
import { 
  Bookmark, 
  Trash2, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  Search,
  Bell,
  Activity,
  Compass,
  BarChart3,
  ChevronDown
} from "lucide-react";
import { formatINR, formatPercent } from "@/lib/utils";

// Top popular NSE stocks for quick add suggestion chips
const QUICK_SUGGESTIONS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "BHARTIARTL", "ITC", "SBIN"];

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [trends, setTrends] = useState<WatchlistTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"change" | "price" | "name">("change");

  // Alert Modal State
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertSymbol, setAlertSymbol] = useState("RELIANCE");
  const [alertPrice, setAlertPrice] = useState(2980.50);

  const fetchWatchlistAndTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, tr] = await Promise.all([
        api.getWatchlist(),
        api.getWatchlistTrends(),
      ]);
      setWatchlist(items);
      setTrends(tr);
    } catch (err: any) {
      setError(err.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlistAndTrends();
  }, []);

  const handleAddSymbol = async (symToAdd: string) => {
    const clean = symToAdd.trim().toUpperCase();
    if (!clean) return;
    setAdding(true);
    setError(null);
    try {
      const item = await api.addToWatchlist(clean);
      setWatchlist((prev) => [item, ...prev.filter((p) => p.symbol !== item.symbol)]);
      setNewSymbol("");
      // Refresh trends
      api.getWatchlistTrends().then(setTrends).catch(() => {});
    } catch (err: any) {
      setError(err.message || `Failed to add ${clean}`);
    } finally {
      setAdding(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddSymbol(newSymbol);
  };

  const handleRemove = async (symbol: string) => {
    try {
      await api.removeFromWatchlist(symbol);
      setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
      api.getWatchlistTrends().then(setTrends).catch(() => {});
    } catch {
      setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
    }
  };

  const handleOpenAlert = (sym: string, price: number) => {
    setAlertSymbol(sym);
    setAlertPrice(price);
    setAlertModalOpen(true);
  };

  const sortedWatchlist = useMemo(() => {
    const list = [...watchlist];
    if (sortBy === "change") {
      return list.sort((a, b) => b.change_percent - a.change_percent);
    } else if (sortBy === "price") {
      return list.sort((a, b) => b.current_price - a.current_price);
    } else if (sortBy === "name") {
      return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
    return list;
  }, [watchlist, sortBy]);

  const getSignalBadge = (signal: string) => {
    if (signal === "Bullish") {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bullish/15 border border-bullish/30 text-bullish">
          <TrendingUp className="w-3 h-3" /> Bullish
        </span>
      );
    }
    if (signal === "Bearish") {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bearish/15 border border-bearish/30 text-bearish">
          <TrendingDown className="w-3 h-3" /> Bearish
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-neutral/15 border border-neutral/30 text-neutral">
        <Minus className="w-3 h-3" /> Neutral
      </span>
    );
  };

  const getTrendBadge = (trend?: string) => {
    const t = trend || "Consolidation";
    if (t.includes("Uptrend")) {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800">
          {t}
        </span>
      );
    }
    if (t.includes("Downtrend") || t.includes("Pullback")) {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-50 border border-rose-300 text-rose-800">
          {t}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-800">
        {t}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Stock Watchlist & Trend Tracker
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Real-time Indian equity tracking, marketing posture analysis, and instant limit price alerts.
            </p>
          </div>
        </div>

        {/* Add Symbol Input */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search or add symbol (e.g. INFY)..."
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="pl-9 pr-3.5 py-2 bg-surface border border-surface-border rounded-xl text-xs sm:text-sm text-gray-100 placeholder-gray-500 uppercase focus:outline-none focus:border-primary-500 w-52 sm:w-64 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Quick Suggestions Chips */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-400 px-1">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mr-1">Quick Add:</span>
        {QUICK_SUGGESTIONS.map((sym) => {
          const isAdded = watchlist.some((w) => w.symbol === sym);
          return (
            <button
              key={sym}
              type="button"
              disabled={isAdded || adding}
              onClick={() => handleAddSymbol(sym)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                isAdded
                  ? "bg-surface/40 border-surface-border/50 text-gray-500 cursor-default"
                  : "bg-surface hover:bg-surface-card border-surface-border text-gray-300 hover:text-white hover:border-primary-500/50"
              }`}
            >
              +{sym}
            </button>
          );
        })}
      </div>

      {/* Marketing Trends & Sentiment Telemetry Banner */}
      {trends && (
        <div className="bg-gradient-to-r from-surface-card via-surface to-surface-card border border-surface-border rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Portfolio Posture:</span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    trends.market_posture === "Bullish"
                      ? "bg-bullish/15 text-bullish border border-bullish/30"
                      : trends.market_posture === "Bearish"
                      ? "bg-bearish/15 text-bearish border border-bearish/30"
                      : "bg-neutral/15 text-neutral border border-neutral/30"
                  }`}
                >
                  {trends.market_posture}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Monitoring {trends.total_watched} equities | Average Day Return:{" "}
                <strong className={trends.average_change_percent >= 0 ? "text-bullish" : "text-bearish"}>
                  {trends.average_change_percent >= 0 ? "+" : ""}{trends.average_change_percent}%
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-bullish font-bold">{trends.bullish_pct}% Bullish</span>
              <span className="text-gray-500">|</span>
              <span className="text-bearish font-bold">{trends.bearish_pct}% Bearish</span>
            </div>

            {trends.top_performer && (
              <div className="bg-surface/80 border border-surface-border px-3 py-1.5 rounded-xl flex items-center gap-2">
                <span className="text-gray-400 text-[11px]">Top Leader:</span>
                <Link
                  href={`/analyze/${trends.top_performer.symbol}`}
                  className="font-bold text-gray-100 hover:text-primary-400"
                >
                  {trends.top_performer.symbol}
                </Link>
                <span className="text-bullish font-bold">
                  +{trends.top_performer.change_percent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls Bar: Sort & Count */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span className="font-semibold">{watchlist.length} stocks tracked</span>
        <div className="flex items-center gap-2">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-surface border border-surface-border text-gray-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-primary-500"
          >
            <option value="change">Day % Change</option>
            <option value="price">Stock Price</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-card rounded-xl border border-surface-border animate-pulse" />
          ))}
        </div>
      )}

      {/* Watchlist Cards */}
      {!loading && (
        <div className="space-y-3">
          {sortedWatchlist.length === 0 ? (
            <div className="p-12 text-center bg-surface-card border border-surface-border rounded-xl text-gray-400 max-w-md mx-auto space-y-3">
              <Bookmark className="w-10 h-10 mx-auto text-gray-500" />
              <p className="text-base font-bold text-gray-200">Your Watchlist is Empty</p>
              <p className="text-xs text-gray-500">
                Click any suggestion chip above or search an NSE stock to track its live price, trend, and alerts.
              </p>
            </div>
          ) : (
            sortedWatchlist.map((item) => {
              const isPos = item.change >= 0;
              const has52w = (item.week_52_high || 0) > (item.week_52_low || 0);
              const week52Pct = has52w
                ? Math.min(100, Math.max(0, ((item.current_price - item.week_52_low!) / (item.week_52_high! - item.week_52_low!)) * 100))
                : 50;

              return (
                <div
                  key={item.symbol}
                  className="bg-surface-card border border-surface-border rounded-xl p-4 sm:p-5 hover:border-surface-border/90 transition-all shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* Left: Symbol, Name, Trend & Signal Badges */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-surface border border-surface-border flex items-center justify-center font-black text-sm text-primary-400 shrink-0">
                      {item.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/analyze/${item.symbol}`}
                          className="font-extrabold text-gray-100 hover:text-primary-400 text-base flex items-center gap-1 transition-colors"
                        >
                          {item.symbol}
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <span className="text-xs text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">
                          {item.company_name}
                        </span>
                        {getSignalBadge(item.signal)}
                        {getTrendBadge(item.trend)}
                      </div>

                      {/* One-Line AI Brief */}
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-300/90 font-medium">
                        <Sparkles className="w-3 h-3 text-primary-400 shrink-0" />
                        <span>{item.ai_brief}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: 52-Week Range Position */}
                  {has52w && (
                    <div className="hidden xl:block w-40 space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                        <span>52W L: ₹{item.week_52_low}</span>
                        <span>H: ₹{item.week_52_high}</span>
                      </div>
                      <div className="w-full bg-surface-border rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary-500 h-full rounded-full"
                          style={{ width: `${week52Pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Right: LTP, Change & Quick Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-5 border-t lg:border-t-0 border-surface-border/50 pt-2 lg:pt-0">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-gray-100 font-mono">
                        {formatINR(item.current_price)}
                      </div>
                      <div
                        className={`text-xs font-bold ${
                          isPos ? "text-bullish" : "text-bearish"
                        }`}
                      >
                        {isPos ? "+" : ""}
                        {(item.change ?? 0).toFixed(2)} ({formatPercent(item.change_percent, isPos)})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAlert(item.symbol, item.current_price)}
                        className="p-2 rounded-lg bg-surface hover:bg-surface-card border border-surface-border text-gray-400 hover:text-amber-400 transition-colors"
                        title="Set Price Alert"
                      >
                        <Bell className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/analyze/${item.symbol}`}
                        className="px-3 py-1.5 bg-surface hover:bg-surface-card border border-surface-border rounded-lg text-xs font-semibold text-gray-200 transition-colors"
                      >
                        Analyze
                      </Link>

                      <button
                        onClick={() => handleRemove(item.symbol)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-surface transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        symbol={alertSymbol}
        currentPrice={alertPrice}
      />
    </div>
  );
}
