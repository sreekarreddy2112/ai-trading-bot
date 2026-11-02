"use client";

import React from "react";
import { NewsSentimentResponse } from "@/lib/types";
import { Newspaper, ExternalLink, ThumbsUp, ThumbsDown, Minus } from "lucide-react";

interface Props {
  symbol?: string;
  sentimentData: NewsSentimentResponse;
}

export default function NewsSentimentFeed({ symbol, sentimentData }: Props) {
  const { overall_sentiment, average_score, articles } = sentimentData;

  const getSentimentChip = (sentiment: string, score: number) => {
    const safeScore = (score ?? 0).toFixed(2);
    if (sentiment === "Positive") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800">
          <ThumbsUp className="w-3 h-3" /> Positive (+{safeScore})
        </span>
      );
    }
    if (sentiment === "Negative") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 border border-rose-300 text-rose-800">
          <ThumbsDown className="w-3 h-3" /> Negative ({safeScore})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800">
        <Minus className="w-3 h-3" /> Neutral (0.00)
      </span>
    );
  };

  // Calculate percentage fill for gauge: map [-1, 1] to [0, 100]
  const meterPercentage = Math.min(100, Math.max(0, ((average_score + 1) / 2) * 100));

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-surface-border/60">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary-400" />
          <h3 className="font-bold text-gray-100 text-base">
            {symbol ? `${symbol} News & AI Sentiment` : "Market News Sentiment"}
          </h3>
        </div>

        {/* Sentiment Meter Bar */}
        <div className="flex items-center gap-3 bg-surface px-3 py-1.5 rounded-lg border border-surface-border text-xs">
          <span className="text-gray-400">Aggregate Mood:</span>
          <span
            className={`font-bold ${
              overall_sentiment === "Positive"
                ? "text-bullish"
                : overall_sentiment === "Negative"
                ? "text-bearish"
                : "text-neutral"
            }`}
          >
            {overall_sentiment} ({(average_score ?? 0) > 0 ? "+" : ""}{(average_score ?? 0).toFixed(2)})
          </span>
          <div className="w-20 h-2 bg-surface-border rounded-full overflow-hidden relative">
            <div
              style={{ width: `${meterPercentage}%` }}
              className={`h-full ${
                overall_sentiment === "Positive"
                  ? "bg-bullish"
                  : overall_sentiment === "Negative"
                  ? "bg-bearish"
                  : "bg-neutral"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Headlines List */}
      <div className="space-y-3">
        {articles.length === 0 ? (
          <div className="text-gray-400 text-sm py-4 text-center">
            No recent news headlines available for this query.
          </div>
        ) : (
          articles.map((art) => (
            <div
              key={art.headline_hash}
              className="p-3 bg-surface/50 border border-surface-border/70 rounded-lg hover:border-surface-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex-1">
                <a
                  href={art.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-200 hover:text-primary-300 transition-colors flex items-start gap-1.5 group"
                >
                  <span className="leading-snug">{art.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary-400 shrink-0 mt-0.5" />
                </a>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-300">{art.publisher}</span>
                  <span>•</span>
                  <span>{art.published_date}</span>
                </div>
              </div>

              <div className="shrink-0">
                {getSentimentChip(art.sentiment, art.score)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

