import React from "react";
import Link from "next/link";
import { TrendingUp, Github, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/60 mt-16 text-gray-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center text-white">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">MarketMind India</span>
            <span className="text-gray-500">| Quantitative AI Equity Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-gray-200 transition-colors">
              Market
            </Link>
            <Link href="/analyze/RELIANCE" className="hover:text-gray-200 transition-colors">
              Analyzer
            </Link>
            <Link href="/backtest" className="hover:text-gray-200 transition-colors">
              Backtester
            </Link>
            <Link href="/watchlist" className="hover:text-gray-200 transition-colors">
              Watchlist
            </Link>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>Built with Claude 3.5 Sonnet & Next.js</span>
          </div>
        </div>

        <div className="border-t border-surface-border/50 mt-6 pt-4 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} MarketMind India. Purely for educational and analytical purposes. Not an investment advisory tool under SEBI Regulations.
        </div>
      </div>
    </footer>
  );
}

