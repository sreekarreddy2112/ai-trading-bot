"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { MarketOverviewResponse, StockMover, Nifty50Stock, IPOItem } from "@/lib/types";
import MarketCard from "@/components/MarketCard";
import StockSearch from "@/components/StockSearch";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import Nifty50TradeTable from "@/components/Nifty50TradeTable";
import PriceAlertModal from "@/components/PriceAlertModal";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Sparkles, 
  Layers, 
  PieChart, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Bell,
  Activity,
  ShieldCheck,
  Rocket,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { formatINR, formatPercent } from "@/lib/utils";
import { getCurrentUser, onAuthChange, AuthUser } from "@/lib/supabase";
import LoginGateway from "@/components/LoginGateway";

export default function MarketOverviewPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [data, setData] = useState<MarketOverviewResponse | null>(null);
  const [niftyStocks, setNiftyStocks] = useState<Nifty50Stock[]>([]);
  const [ipos, setIpos] = useState<IPOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Price Alert Modal State
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalSymbol, setAlertModalSymbol] = useState("RELIANCE");
  const [alertModalPrice, setAlertModalPrice] = useState(2980.50);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, n50, ipoRes] = await Promise.all([
        api.getMarketOverview(),
        api.getNifty50Constituents(),
        api.getIPOs("all").catch(() => ({ ipos: [], total: 0, last_updated: "", data_notice: "" })),
      ]);
      setData(overview);
      setNiftyStocks(n50);
      if (ipoRes?.ipos) {
        setIpos(ipoRes.ipos);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load market overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check initial user authentication
    getCurrentUser().then((u) => {
      setUser(u);
      setAuthChecking(false);
      if (u) {
        fetchOverview();
      }
    });

    // Listen to real-time auth changes (e.g. login or sign out)
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setAuthChecking(false);
      if (u && !data) {
        fetchOverview();
      }
    });

    return () => unsubscribe();
  }, [data]);

  const handleOpenAlert = (sym: string, price: number) => {
    setAlertModalSymbol(sym);
    setAlertModalPrice(price);
    setAlertModalOpen(true);
  };

  const isMarketOpen = data?.market_status === "OPEN";

  // 1. Session verification loading state
  if (authChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  // 2. Unauthenticated state: show Email OTP Login Gateway
  if (!user) {
    return (
      <LoginGateway
        onSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          fetchOverview();
        }}
      />
    );
  }

  // 3. Authenticated state: show full MarketMind India Dashboard
  return (
    <div className="space-y-8">
      {/* SEBI Compliance Banner */}
      <DisclaimerBanner />

      {/* User Authenticated Welcome Chip */}
      <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-4 py-2.5 text-xs text-indigo-900 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Authenticated as <strong className="font-bold text-indigo-950">{user.email}</strong> &bull; Personalized watchlists & alerts active
          </span>
        </div>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
          Email Verified ✓
        </span>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-surface-card to-surface border border-surface-border p-6 sm:p-10 shadow-2xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Autonomous Technical, Fundamental & AI Synthesis for Indian Equities
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          MarketMind{" "}
          <span className="inline-block text-indigo-600 font-black bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-2xl align-middle text-2xl sm:text-4xl shadow-sm">
            India
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 mb-8 leading-relaxed">
          Live NSE market dashboard, Nifty 50 trade telemetry, company fundamental health metrics, and automated limit price alerts.
        </p>

        {/* Global Search Bar */}
        <StockSearch />
      </div>

      {/* Live Market Status & Telemetry Bar */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMarketOpen ? "bg-emerald-400 animate-ping" : "bg-gray-500"
              }`}
            />
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                isMarketOpen
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                  : "bg-surface border border-surface-border text-gray-400"
              }`}
            >
              NSE {data?.market_status || "CLOSED"}
            </span>
          </div>

          <span className="text-xs text-gray-300 font-medium">
            {data?.market_status_message || "NSE Trading: Mon-Fri 09:15 - 15:30 IST"}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-primary-400" />
            <span>{data ? data.last_updated : "Connecting..."}</span>
          </div>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Backend connection notice if server is offline or waking up */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Backend is unreachable at{" "}
              <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-900 font-mono text-xs border border-amber-200">
                {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
              </code>
              . If hosted on Render, free instances take ~30–50s to wake up on the first request.
            </span>
          </div>
          <button
            onClick={fetchOverview}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 self-start sm:self-auto transition-colors shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Benchmark Indices Grid */}
      {loading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-surface-card animate-pulse rounded-xl border border-surface-border" />
          ))}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.indices.map((idx) => (
            <MarketCard key={idx.symbol} index={idx} />
          ))}
        </div>
      )}

      {/* 🔥 Newly Opened & Active IPOs Showcase Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">🔥 Newly Opened & Active IPOs</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Bidding Open
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Live primary market issues with GMP estimates & AI subscription thesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/ipo"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 shadow-2xs"
            >
              <span>Explore IPO Tracker ({ipos.filter(i => i.status === "Open").length} Open &bull; {ipos.filter(i => i.status === "Closed").length} Closed &bull; {ipos.filter(i => i.status === "Upcoming").length} Upcoming)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3 Active Newly Opened IPO Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {ipos
            .filter((i) => i.status === "Open")
            .slice(0, 3)
            .map((ipo) => (
              <Link
                key={ipo.id}
                href="/ipo"
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex flex-col justify-between gap-3 group bg-slate-50/70"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {ipo.company_name}
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">
                        {ipo.symbol} &bull; {ipo.sector}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      Live
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Price Band</span>
                      <span className="font-bold text-slate-900">{ipo.price_band}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Est. GMP</span>
                      <span className="font-black text-emerald-600">
                        +{formatINR(ipo.gmp)} ({ipo.gmp_percent >= 0 ? "+" : ""}{ipo.gmp_percent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>Closes: <strong className="text-slate-800 font-semibold">{ipo.close_date}</strong></span>
                  <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Track / Apply →
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Market Movers: Top Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Nifty 50 Top Gainers</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Top 5 Leaders</span>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.top_gainers.map((stock: StockMover) => (
              <div
                key={stock.symbol}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors group"
              >
                <Link href={`/analyze/${stock.symbol}`} className="block">
                  <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 flex items-center gap-1">
                    {stock.symbol}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-xs">{stock.name}</div>
                </Link>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">{formatINR(stock.price)}</div>
                    <div className="text-xs font-bold text-emerald-600">
                      {formatPercent(stock.change_percent, true)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAlert(stock.symbol, stock.price)}
                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-amber-500 transition-colors"
                    title="Set Limit Price Alert"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Nifty 50 Top Losers</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Top 5 Laggards</span>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.top_losers.map((stock: StockMover) => (
              <div
                key={stock.symbol}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors group"
              >
                <Link href={`/analyze/${stock.symbol}`} className="block">
                  <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 flex items-center gap-1">
                    {stock.symbol}
                    <ArrowDownRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-600" />
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-xs">{stock.name}</div>
                </Link>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">{formatINR(stock.price)}</div>
                    <div className="text-xs font-bold text-rose-600">
                      {formatPercent(stock.change_percent)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAlert(stock.symbol, stock.price)}
                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-amber-500 transition-colors"
                    title="Set Limit Price Alert"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature 1 Core: Nifty 50 Full Interactive Trade Table */}
      <Nifty50TradeTable
        stocks={niftyStocks}
        onOpenAlertModal={handleOpenAlert}
      />

      {/* Sector Performance Grid */}
      {data && data.sectors && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border/60">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-400" />
              <h3 className="font-bold text-gray-100 text-base">Key Sectoral Indices</h3>
            </div>
            <span className="text-xs text-gray-500">Intraday %</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {data.sectors.map((sec) => {
              const isPos = sec.change_percent >= 0;
              return (
                <div
                  key={sec.sector}
                  className="bg-surface border border-surface-border rounded-lg p-3 text-center"
                >
                  <div className="text-xs font-medium text-gray-300 truncate">{sec.sector}</div>
                  <div className={`text-sm font-bold mt-1 ${isPos ? "text-bullish" : "text-bearish"}`}>
                    {formatPercent(sec.change_percent, isPos)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Alert Modal */}
      <PriceAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        symbol={alertModalSymbol}
        currentPrice={alertModalPrice}
      />
    </div>
  );
}
