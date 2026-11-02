import React from "react";
import { IndexCard } from "@/lib/types";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatINR, formatPercent } from "@/lib/utils";

interface Props {
  index: IndexCard;
}

export default function MarketCard({ index }: Props) {
  const isPositive = (index.change ?? 0) >= 0;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 sm:p-5 hover:border-surface-border/80 transition-all shadow-lg hover:shadow-primary-500/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {index.name}
        </span>
        <span
          className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
            isPositive
              ? "bg-bullish/10 text-bullish border border-bullish/20"
              : "bg-bearish/10 text-bearish border border-bearish/20"
          }`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(index.change_percent, isPositive)}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xl sm:text-2xl font-bold text-gray-100 tracking-tight">
            {formatINR(index.current_price).replace("₹", "")}
          </div>
          <div className={`text-xs mt-0.5 font-medium ${isPositive ? "text-bullish" : "text-bearish"}`}>
            {isPositive ? "+" : ""}
            {(index.change ?? 0).toFixed(2)} pts
          </div>
        </div>

        {/* Mini Sparkline Visualization */}
        {index.sparkline && index.sparkline.length > 1 && (
          <div className="flex items-end gap-1 h-8">
            {index.sparkline.map((val, idx) => {
              const min = Math.min(...index.sparkline);
              const max = Math.max(...index.sparkline);
              const heightPct = max === min ? 50 : Math.max(15, ((val - min) / (max - min)) * 100);
              return (
                <div
                  key={idx}
                  style={{ height: `${heightPct}%` }}
                  className={`w-1.5 rounded-t-sm ${isPositive ? "bg-bullish/60" : "bg-bearish/60"}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

