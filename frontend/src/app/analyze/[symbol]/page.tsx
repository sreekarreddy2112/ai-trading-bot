"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  StockDetailResponse, 
  StockIndicatorsResponse, 
  NewsSentimentResponse 
} from "@/lib/types";
import PriceChart from "@/components/PriceChart";
import AIAnalystCard from "@/components/AIAnalystCard";
import NewsSentimentFeed from "@/components/NewsSentimentFeed";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import StockSearch from "@/components/StockSearch";
import CompanyFundamentals from "@/components/CompanyFundamentals";
import PriceAlertModal from "@/components/PriceAlertModal";
import { 
  Bookmark, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  ShieldCheck, 
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Bell
} from "lucide-react";
import { formatINR, formatLargeNumber, formatPercent } from "@/lib/utils";

export default function StockAnalyzerPage() {
  const params = useParams();
  const symbol = ((params.symbol as string) || "RELIANCE").toUpperCase();

  const [timeframe, setTimeframe] = useState("1y");
  const [stockDetail, setStockDetail] = useState<StockDetailResponse | null>(null);
  const [indicators, setIndicators] = useState<StockIndicatorsResponse | null>(null);
  const [news, setNews] = useState<NewsSentimentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchActionLoading, setWatchActionLoading] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailData, indData, newsData] = await Promise.all([
        api.getStockDetail(symbol, timeframe),
        api.getStockIndicators(symbol, timeframe),
        api.getNewsSentiment(symbol),
      ]);
      setStockDetail(detailData);
      setIndicators(indData);
      setNews(newsData);
    } catch (err: any) {
      setError(err.message || `Failed to retrieve analytics for ${symbol}`);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleWatchlist = async () => {
    setWatchActionLoading(true);
    try {
      if (isWatchlisted) {
        await api.removeFromWatchlist(symbol);
        setIsWatchlisted(false);
      } else {
        await api.addToWatchlist(symbol);
        setIsWatchlisted(true);
      }
    } catch {
      // Toggle locally for demo smoothness if backend is guest
      setIsWatchlisted(!isWatchlisted);
    } finally {
      setWatchActionLoading(false);
    }
  };

  const getSignalBadge = (sig: string) => {
    if (sig === "Bullish") {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs uppercase tracking-wide">
          <TrendingUp className="w-4 h-4 text-emerald-600" /> Bullish Signal
        </span>
      );
    }
    if (sig === "Bearish") {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-800 font-bold text-xs uppercase tracking-wide">
          <TrendingDown className="w-4 h-4 text-rose-600" /> Bearish Signal
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 font-bold text-xs uppercase tracking-wide">
        <Minus className="w-4 h-4 text-amber-600" /> Neutral Signal
      </span>
    );
  };

  if (loading && !stockDetail) {
    return (
      <div className="space-y-6">
        <DisclaimerBanner />
        <div className="h-28 bg-surface-card rounded-xl animate-pulse border border-surface-border"></div>
        <div className="h-96 bg-surface-card rounded-xl animate-pulse border border-surface-border"></div>
      </div>
    );
  }

  if (error || !stockDetail || !indicators) {
    return (
      <div className="space-y-6">
        <DisclaimerBanner />
        <div className="p-8 bg-surface-card border border-surface-border rounded-xl text-center max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-white mb-2">Symbol Not Found</h2>
          <p className="text-sm text-gray-400 mb-6">{error || `Unable to load data for ${symbol}`}</p>
          <StockSearch />
        </div>
      </div>
    );
  }

  const isPositive = stockDetail.change >= 0;

  return (
    <div className="space-y-6">
      {/* SEBI Compliance Banner */}
      <DisclaimerBanner />

      {/* Stock Header & Actions */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-primary-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
            {symbol.slice(0, 3)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {stockDetail.company_name}
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-surface-border text-gray-300">
                {stockDetail.exchange}: {stockDetail.symbol}
              </span>
              {getSignalBadge(indicators.signal)}
            </div>

            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-100">
                {formatINR(stockDetail.current_price)}
              </span>
              <span
                className={`flex items-center text-sm sm:text-base font-bold ${
                  isPositive ? "text-bullish" : "text-bearish"
                }`}
              >
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {isPositive ? "+" : ""}
                {(stockDetail.change ?? 0).toFixed(2)} ({formatPercent(stockDetail.change_percent, isPositive)})
              </span>
            </div>
          </div>
        </div>

        {/* Watchlist & Alert Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAlertModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-all shadow-sm"
          >
            <Bell className="w-4 h-4" />
            <span>Set Alert</span>
          </button>

          <button
            onClick={handleToggleWatchlist}
            disabled={watchActionLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              isWatchlisted
                ? "bg-indigo-950/60 border-primary-500/50 text-primary-300"
                : "bg-surface hover:bg-surface-card border-surface-border text-gray-300"
            }`}
          >
            {isWatchlisted ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>In Watchlist</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Add to Watchlist</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fundamentals Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface-card border border-surface-border rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Market Cap</span>
          <div className="text-sm sm:text-base font-bold text-gray-100 mt-0.5">
            {formatLargeNumber(stockDetail.fundamentals.market_cap)}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">P/E Ratio</span>
          <div className="text-sm sm:text-base font-bold text-gray-100 mt-0.5">
            {stockDetail.fundamentals.pe_ratio ? `${stockDetail.fundamentals.pe_ratio}x` : "N/A"}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">52W High</span>
          <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
            {formatINR(stockDetail.fundamentals.high_52w)}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">52W Low</span>
          <div className="text-sm sm:text-base font-bold text-rose-400 mt-0.5">
            {formatINR(stockDetail.fundamentals.low_52w)}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Key Support</span>
          <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
            {formatINR(indicators.support_level)}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Key Resistance</span>
          <div className="text-sm sm:text-base font-bold text-rose-400 mt-0.5">
            {formatINR(indicators.resistance_level)}
          </div>
        </div>
      </div>

      {/* Main Interactive Technical Chart */}
      <PriceChart
        symbol={symbol}
        series={indicators.series}
        supportLevel={indicators.support_level}
        resistanceLevel={indicators.resistance_level}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      {/* Algorithmic Signal Drivers Card */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-primary-400" />
          <h3 className="font-bold text-gray-100 text-base">
            Rule-Based Technical Signal Rationale
          </h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Deterministic quantitative checklist evaluating RSI momentum, MACD crossover, and 50/200-day moving average alignment:
        </p>
        <div className="space-y-2">
          {indicators.signal_reasons.map((reason, idx) => (
            <div
              key={idx}
              className="p-3 bg-surface/60 border border-surface-border/60 rounded-lg text-xs sm:text-sm text-gray-300 flex items-start gap-2.5"
            >
              <span className="text-primary-400 font-bold shrink-0">{idx + 1}.</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature 3: Company Fundamentals & Quarterly Financial Health */}
      <CompanyFundamentals
        symbol={symbol}
        fundamentals={stockDetail.fundamentals}
        companyName={stockDetail.company_name}
      />

      {/* Headline Feature F3: Claude AI Analyst */}
      <AIAnalystCard symbol={symbol} />

      {/* Feature F4: News & Sentiment Feed */}
      {news && <NewsSentimentFeed symbol={symbol} sentimentData={news} />}

      {/* Feature 4: Price Alert Setup Modal */}
      <PriceAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        symbol={symbol}
        currentPrice={stockDetail.current_price}
      />
    </div>
  );
}

