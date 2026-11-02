"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { IndicatorSeriesPoint } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Eye, EyeOff, Layers, Sliders } from "lucide-react";

interface Props {
  symbol: string;
  series: IndicatorSeriesPoint[];
  supportLevel: number;
  resistanceLevel: number;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

export default function PriceChart({
  symbol,
  series,
  supportLevel,
  resistanceLevel,
  timeframe,
  onTimeframeChange,
}: Props) {
  // Indicator Toggles
  const [showSMA, setShowSMA] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showSupportResistance, setShowSupportResistance] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);

  if (!series || series.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-surface-card rounded-xl border border-surface-border text-gray-400">
        No chart data available for this timeframe
      </div>
    );
  }

  // Filter series based on timeframe
  let displayedSeries = series;
  if (timeframe === "1mo") {
    displayedSeries = series.slice(-22);
  } else if (timeframe === "6mo") {
    displayedSeries = series.slice(-125);
  } else {
    displayedSeries = series; // 1y
  }

  const prices = displayedSeries.map((d) => d.close);
  const minPrice = Math.min(...prices) * 0.97;
  const maxPrice = Math.max(...prices) * 1.03;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 sm:p-5 shadow-xl">
      {/* Header with Timeframe & Indicator Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-surface-border/60">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-400" />
          <h2 className="text-base sm:text-lg font-bold text-gray-100">
            {symbol} Technical Price Action
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Buttons */}
          <div className="bg-surface border border-surface-border rounded-lg p-0.5 flex items-center">
            {["1mo", "6mo", "1y"].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeframe === tf
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tf === "1mo" ? "1M" : tf === "6mo" ? "6M" : "1Y"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Indicator Toggle Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <span className="text-gray-500 font-medium flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5" /> Overlays:
        </span>

        <button
          onClick={() => setShowSMA(!showSMA)}
          className={`px-2.5 py-1 rounded-md border transition-all ${
            showSMA
              ? "bg-indigo-950/60 border-indigo-500/40 text-indigo-300"
              : "bg-surface border-surface-border text-gray-500 line-through"
          }`}
        >
          SMA (20/50/200)
        </button>

        <button
          onClick={() => setShowBollinger(!showBollinger)}
          className={`px-2.5 py-1 rounded-md border transition-all ${
            showBollinger
              ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
              : "bg-surface border-surface-border text-gray-500 line-through"
          }`}
        >
          Bollinger Bands
        </button>

        <button
          onClick={() => setShowSupportResistance(!showSupportResistance)}
          className={`px-2.5 py-1 rounded-md border transition-all ${
            showSupportResistance
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
              : "bg-surface border-surface-border text-gray-500 line-through"
          }`}
        >
          Support / Resistance
        </button>

        <button
          onClick={() => setShowRSI(!showRSI)}
          className={`px-2.5 py-1 rounded-md border transition-all ${
            showRSI
              ? "bg-purple-950/60 border-purple-500/40 text-purple-300"
              : "bg-surface border-surface-border text-gray-500 line-through"
          }`}
        >
          RSI (14)
        </button>

        <button
          onClick={() => setShowMACD(!showMACD)}
          className={`px-2.5 py-1 rounded-md border transition-all ${
            showMACD
              ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
              : "bg-surface border-surface-border text-gray-500 line-through"
          }`}
        >
          MACD (12, 26, 9)
        </button>
      </div>

      {/* Main Price Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayedSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `₹${Math.round(v)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                borderRadius: "10px",
                fontSize: "12px",
                color: "#0f172a",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
              }}
              formatter={(value: any, name: string) => [
                typeof value === "number" ? `₹${value.toFixed(2)}` : value,
                name,
              ]}
            />

            {/* Support and Resistance Lines */}
            {showSupportResistance && (
              <>
                <ReferenceLine
                  y={resistanceLevel}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `Res ₹${resistanceLevel}`,
                    fill: "#ef4444",
                    fontSize: 11,
                    position: "right",
                  }}
                />
                <ReferenceLine
                  y={supportLevel}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Sup ₹${supportLevel}`,
                    fill: "#10b981",
                    fontSize: 11,
                    position: "right",
                  }}
                />
              </>
            )}

            {/* Bollinger Bands */}
            {showBollinger && (
              <>
                <Line
                  type="monotone"
                  dataKey="bb_upper"
                  name="BB Upper"
                  stroke="#06b6d4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bb_lower"
                  name="BB Lower"
                  stroke="#06b6d4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </>
            )}

            {/* Moving Averages */}
            {showSMA && (
              <>
                <Line
                  type="monotone"
                  dataKey="sma_20"
                  name="SMA 20"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="sma_50"
                  name="SMA 50"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="sma_200"
                  name="SMA 200"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  dot={false}
                />
              </>
            )}

            {/* Primary Price Line */}
            <Area
              type="monotone"
              dataKey="close"
              name="Close Price"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={0.15}
              fill="#6366f1"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Subchart: RSI */}
      {showRSI && (
        <div className="mt-4 pt-3 border-t border-surface-border/50">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-semibold text-purple-400">RSI (14 Period)</span>
            <span className="text-gray-400">
              Current:{" "}
              <strong className="text-purple-300">
                {displayedSeries[displayedSeries.length - 1]?.rsi?.toFixed(1) || "N/A"}
              </strong>
            </span>
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayedSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <YAxis domain={[0, 100]} ticks={[30, 50, 70]} stroke="#64748b" fontSize={10} />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.6} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.6} />
                <Line
                  type="monotone"
                  dataKey="rsi"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  name="RSI"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subchart: MACD */}
      {showMACD && (
        <div className="mt-4 pt-3 border-t border-surface-border/50">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-semibold text-amber-400">MACD (12, 26, 9)</span>
            <span className="text-gray-400">
              Histogram:{" "}
              <strong className="text-amber-300">
                {displayedSeries[displayedSeries.length - 1]?.macd_hist?.toFixed(2) || "N/A"}
              </strong>
            </span>
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayedSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <YAxis stroke="#64748b" fontSize={10} />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="macd_hist" fill="#3b82f6" opacity={0.7} name="Hist" />
                <Line type="monotone" dataKey="macd" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="MACD" />
                <Line type="monotone" dataKey="macd_signal" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Signal" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

