"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp } from "lucide-react";

const POPULAR_NSE_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy" },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
  { symbol: "INFY", name: "Infosys Ltd", sector: "IT" },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking" },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Auto" },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG" },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Capital Goods" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking" },
  { symbol: "TITAN", name: "Titan Company", sector: "Consumer" },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Auto" },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharma" },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: "Metals" },
];

export default function StockSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filtered = query.trim()
    ? POPULAR_NSE_STOCKS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase())
      )
    : POPULAR_NSE_STOCKS.slice(0, 6);

  const handleSelect = (symbol: string) => {
    router.push(`/analyze/${symbol}`);
    setQuery("");
    setIsFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSelect(query.trim().toUpperCase());
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search any NSE stock (e.g. RELIANCE, TCS, INFY)..."
            className="w-full pl-12 pr-28 py-3.5 bg-surface-card border border-surface-border rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm sm:text-base shadow-xl"
          />
          <button
            type="submit"
            className="absolute right-2.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors"
          >
            Analyze
          </button>
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-card border border-surface-border rounded-xl shadow-2xl z-40 overflow-hidden divide-y divide-surface-border/50">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-surface/50">
            {query.trim() ? "Search Suggestions" : "Popular Indian Equities"}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map((stock) => (
              <div
                key={stock.symbol}
                onMouseDown={() => handleSelect(stock.symbol)}
                className="px-4 py-3 hover:bg-surface-border/50 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center font-bold text-xs text-primary-400 border border-surface-border">
                    {stock.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-100 text-sm">{stock.symbol}</span>
                    <span className="text-gray-400 text-xs ml-2">{stock.name}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-surface border border-surface-border text-gray-400">
                  {stock.sector}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

