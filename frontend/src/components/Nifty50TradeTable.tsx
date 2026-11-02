"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Nifty50Stock } from "@/lib/types";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Bell, 
  ChevronRight,
  Sparkles,
  BarChart2
} from "lucide-react";
import { formatINR, formatPercent } from "@/lib/utils";

interface Nifty50TradeTableProps {
  stocks: Nifty50Stock[];
  onOpenAlertModal?: (symbol: string, currentPrice: number) => void;
}

export default function Nifty50TradeTable({ stocks, onOpenAlertModal }: Nifty50TradeTableProps) {
  const [activeTab, setActiveTab] = useState<"all" | "gainers" | "losers" | "turnover" | "near52w">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    // Filter by tab
    if (activeTab === "gainers") {
      result = result.filter((s) => s.change > 0).sort((a, b) => b.change_percent - a.change_percent);
    } else if (activeTab === "losers") {
      result = result.filter((s) => s.change < 0).sort((a, b) => a.change_percent - b.change_percent);
    } else if (activeTab === "turnover") {
      result = result.sort((a, b) => b.value_cr - a.value_cr);
    } else if (activeTab === "near52w") {
      result = result
        .filter((s) => s.week_52_high > 0)
        .sort((a, b) => (b.price / b.week_52_high) - (a.price / a.week_52_high));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)
      );
    }

    return result;
  }, [stocks, activeTab, searchQuery]);

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Nifty 50 Constituents Live Board
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-surface-border text-gray-400 font-mono">
              {stocks.length} Tickers
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time equity quotes, daily ranges, 52-week positions, and instant limit price alerts.
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Nifty 50 stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface border border-surface-border rounded-lg text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors uppercase"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-surface-border/80 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg border transition-all ${
            activeTab === "all"
              ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
              : "border-transparent text-gray-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          All Nifty 50 ({stocks.length})
        </button>
        <button
          onClick={() => setActiveTab("gainers")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
            activeTab === "gainers"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
              : "border-transparent text-gray-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Top Gainers
        </button>
        <button
          onClick={() => setActiveTab("losers")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
            activeTab === "losers"
              ? "bg-rose-50 text-rose-700 border-rose-200 shadow-sm"
              : "border-transparent text-gray-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-600" /> Top Losers
        </button>
        <button
          onClick={() => setActiveTab("turnover")}
          className={`px-3 py-1.5 rounded-lg border transition-all ${
            activeTab === "turnover"
              ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
              : "border-transparent text-gray-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          High Turnover (₹ Cr)
        </button>
        <button
          onClick={() => setActiveTab("near52w")}
          className={`px-3 py-1.5 rounded-lg border transition-all ${
            activeTab === "near52w"
              ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
              : "border-transparent text-gray-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Near 52W High
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-surface-border text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-3">Company & Sector</th>
              <th className="py-3 px-3 text-right">LTP (₹)</th>
              <th className="py-3 px-3 text-right">Day Chg</th>
              <th className="py-3 px-3 hidden md:table-cell text-center">Day Range (L - H)</th>
              <th className="py-3 px-3 hidden lg:table-cell text-center">52W Position</th>
              <th className="py-3 px-3 hidden sm:table-cell text-right">Turnover</th>
              <th className="py-3 px-3 text-center">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/50">
            {filteredStocks.map((stock) => {
              const isPos = stock.change >= 0;
              const dayRangePct = stock.day_high > stock.day_low
                ? Math.min(100, Math.max(0, ((stock.price - stock.day_low) / (stock.day_high - stock.day_low)) * 100))
                : 50;

              const week52Pct = stock.week_52_high > stock.week_52_low
                ? Math.min(100, Math.max(0, ((stock.price - stock.week_52_low) / (stock.week_52_high - stock.week_52_low)) * 100))
                : 50;

              return (
                <tr key={stock.symbol} className="hover:bg-surface/60 transition-colors group">
                  {/* Symbol & Name */}
                  <td className="py-3 px-3">
                    <Link href={`/analyze/${stock.symbol}`} className="block group-hover:text-primary-400 transition-colors">
                      <div className="font-bold text-gray-100 flex items-center gap-1.5">
                        <span>{stock.symbol}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[11px] text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">
                        {stock.name}
                      </div>
                      <span className="text-[10px] text-gray-500">{stock.sector}</span>
                    </Link>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-gray-100">
                    {formatINR(stock.price)}
                  </td>

                  {/* Change */}
                  <td className="py-3 px-3 text-right">
                    <div className={`flex items-center justify-end gap-1 font-semibold ${isPos ? "text-bullish" : "text-bearish"}`}>
                      {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{isPos ? "+" : ""}{stock.change.toFixed(2)}</span>
                    </div>
                    <div className={`text-[11px] font-bold ${isPos ? "text-bullish" : "text-bearish"}`}>
                      {formatPercent(stock.change_percent, isPos)}
                    </div>
                  </td>

                  {/* Day Range Bar */}
                  <td className="py-3 px-3 hidden md:table-cell">
                    <div className="w-36 mx-auto space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                        <span>₹{stock.day_low}</span>
                        <span>₹{stock.day_high}</span>
                      </div>
                      <div className="w-full bg-surface-border rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${dayRangePct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* 52W Position */}
                  <td className="py-3 px-3 hidden lg:table-cell">
                    <div className="w-36 mx-auto space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                        <span>₹{stock.week_52_low}</span>
                        <span>₹{stock.week_52_high}</span>
                      </div>
                      <div className="w-full bg-surface-border rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${week52Pct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Turnover */}
                  <td className="py-3 px-3 hidden sm:table-cell text-right">
                    <div className="font-semibold text-gray-200">₹{stock.value_cr.toLocaleString("en-IN")} Cr</div>
                    <div className="text-[10px] text-gray-400 font-mono">{(stock.volume / 100000).toFixed(1)}L shares</div>
                  </td>

                  {/* Quick Action Buttons */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/analyze/${stock.symbol}`}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-surface hover:bg-surface-card border border-surface-border text-primary-300 transition-colors"
                        title="Open Technical Chart & AI Analyst"
                      >
                        Analyze
                      </Link>
                      {onOpenAlertModal && (
                        <button
                          onClick={() => onOpenAlertModal(stock.symbol, stock.price)}
                          className="p-1.5 rounded bg-surface hover:bg-surface-card border border-surface-border text-gray-400 hover:text-amber-400 transition-colors"
                          title="Set Price Alert"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

