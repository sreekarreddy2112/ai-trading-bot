"use client";

import React, { useState } from "react";
import { AIAnalysisResponse } from "@/lib/types";
import { api } from "@/lib/api";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Compass, 
  CheckCircle2, 
  RefreshCw,
  ShieldAlert
} from "lucide-react";

interface Props {
  symbol: string;
  initialAnalysis?: AIAnalysisResponse | null;
}

export default function AIAnalystCard({ symbol, initialAnalysis }: Props) {
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(initialAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.generateAIAnalysis(symbol);
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI analysis");
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "uptrend") return <TrendingUp className="w-4 h-4 text-bullish" />;
    if (trend === "downtrend") return <TrendingDown className="w-4 h-4 text-bearish" />;
    return <Minus className="w-4 h-4 text-neutral" />;
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors: Record<string, string> = {
      high: "bg-emerald-50 border-emerald-300 text-emerald-800",
      medium: "bg-amber-50 border-amber-300 text-amber-800",
      low: "bg-rose-50 border-rose-300 text-rose-800",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[confidence] || colors.medium}`}>
        {confidence.toUpperCase()} CONFIDENCE
      </span>
    );
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-surface-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-100">Claude AI Analyst</h3>
              <span className="text-[10px] bg-primary-500/15 border border-primary-500/30 text-primary-300 px-2 py-0.5 rounded-full font-medium">
                Claude 3.5 Sonnet
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Plain-English synthesis grounded strictly in verified technical indicators & headlines
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md shadow-primary-500/20 active:scale-95"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{analysis ? "Refresh AI Insight" : "Generate AI Analysis"}</span>
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-4 bg-red-950/40 border border-red-500/40 rounded-lg text-red-200 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-surface-border/50 rounded w-3/4"></div>
          <div className="h-16 bg-surface-border/30 rounded w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="h-28 bg-surface-border/30 rounded"></div>
            <div className="h-28 bg-surface-border/30 rounded"></div>
          </div>
        </div>
      )}

      {/* Empty State before first generation */}
      {!analysis && !loading && !error && (
        <div className="py-10 text-center text-gray-400">
          <Sparkles className="w-10 h-10 mx-auto text-primary-400/40 mb-3" />
          <p className="text-sm font-medium text-gray-300">
            Click &quot;Generate AI Analysis&quot; to review Claude&apos;s plain-English thesis for {symbol}
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Claude will synthesize the 14-day RSI, MACD momentum, 50/200-day SMAs, support/resistance levels, and recent news into structured observations.
          </p>
        </div>
      )}

      {/* Loaded Structured Content */}
      {analysis && !loading && (
        <div className="space-y-6">
          {/* Trend & Confidence Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface/70 border border-surface-border p-3.5 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-gray-400">Evaluated Trend:</span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface border border-surface-border text-gray-200 font-semibold uppercase text-xs">
                {getTrendIcon(analysis.trend)}
                {analysis.trend}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getConfidenceBadge(analysis.confidence)}
              {analysis.cached && (
                <span className="text-[11px] text-gray-400 bg-surface px-2 py-0.5 rounded border border-surface-border">
                  Cached (30m)
                </span>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-400 mb-1.5">
              Executive Summary
            </h4>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed bg-surface/40 p-3.5 rounded-lg border border-surface-border/50">
              {analysis.summary}
            </p>
          </div>

          {/* Key Observations & Risks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Points */}
            <div className="bg-surface/50 border border-surface-border rounded-lg p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-3">
                <CheckCircle2 className="w-4 h-4" /> Technical Observations
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                {analysis.key_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Risks */}
            <div className="bg-surface/50 border border-surface-border rounded-lg p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-4 h-4" /> Key Risks & Downside Triggers
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                {analysis.risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* What to Watch Next */}
          <div className="bg-surface/50 border border-surface-border rounded-lg p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-2.5">
              <Compass className="w-4 h-4" /> Levels & Catalysts To Watch
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              {analysis.watch_next.map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">→</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fixed Compliance Footer */}
          <div className="text-[11px] text-gray-500 border-t border-surface-border/50 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>{analysis.disclaimer}</div>
            <div className="text-gray-400 shrink-0">Generated: {analysis.generated_at}</div>
          </div>
        </div>
      )}
    </div>
  );
}

