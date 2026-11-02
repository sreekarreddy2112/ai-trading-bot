"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { BacktestResponse } from "@/lib/types";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Cpu,
  TrendingUp,
  Percent,
  Activity,
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { formatINR, formatPercent } from "@/lib/utils";

export default function BacktestPage() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [strategy, setStrategy] = useState("sma_crossover");
  const [timeframeYears, setTimeframeYears] = useState(2);
  const [initialCapital, setInitialCapital] = useState(100000);

  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.runBacktest({
        symbol: symbol.trim().toUpperCase(),
        strategy,
        timeframe_years: timeframeYears,
        initial_capital: initialCapital,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to execute backtest");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="space-y-6">
      {/* SEBI Compliance Banner */}
      <DisclaimerBanner />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Quantitative Strategy Backtester
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Simulate rule-based algorithmic strategies on Indian equities with guaranteed ZERO look-ahead bias
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Symbol */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1.5">
              NSE Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. RELIANCE, TCS"
              className="w-full px-3.5 py-2 bg-surface border border-surface-border rounded-lg text-sm text-gray-100 uppercase focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Strategy */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1.5">
              Strategy Model
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full px-3.5 py-2 bg-surface border border-surface-border rounded-lg text-sm text-gray-100 focus:outline-none focus:border-primary-500"
            >
              <option value="sma_crossover">SMA Crossover (20 vs 50)</option>
              <option value="rsi_reversal">RSI Mean Reversion (30/70)</option>
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1.5">
              Lookback Period
            </label>
            <select
              value={timeframeYears}
              onChange={(e) => setTimeframeYears(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-surface border border-surface-border rounded-lg text-sm text-gray-100 focus:outline-none focus:border-primary-500"
            >
              <option value={1}>1 Year Historical</option>
              <option value={2}>2 Years Historical</option>
              <option value={3}>3 Years Historical</option>
              <option value={5}>5 Years Historical</option>
            </select>
          </div>

          {/* Run Button */}
          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-primary-500/20 active:scale-98"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Computing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Backtest</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Strategy Return */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">
                Strategy Total Return
              </span>
              <div
                className={`text-2xl font-black mt-1 ${
                  (result.total_return_pct ?? 0) >= 0 ? "text-bullish" : "text-bearish"
                }`}
              >
                {formatPercent(result.total_return_pct, true)}
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Final: {formatINR(result.final_equity)}
              </span>
            </div>

            {/* Benchmark Buy & Hold */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">
                Buy & Hold Benchmark
              </span>
              <div
                className={`text-2xl font-black mt-1 ${
                  (result.buy_hold_return_pct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatPercent(result.buy_hold_return_pct, true)}
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Passive benchmark return
              </span>
            </div>

            {/* Win Rate */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">
                Win Rate
              </span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {(result.win_rate_pct ?? 0).toFixed(1)}%
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                {result.winning_trades} Win / {result.losing_trades} Loss ({result.total_trades} total)
              </span>
            </div>

            {/* Max Drawdown */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">
                Max Drawdown
              </span>
              <div className="text-2xl font-black text-rose-400 mt-1">
                -{(result.max_drawdown_pct ?? 0).toFixed(2)}%
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Peak-to-trough drop
              </span>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border/60">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-gray-100 text-base">
                  Equity Growth Curve: Strategy vs Benchmark
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                Starting: {formatINR(result.initial_capital)}
              </span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.equity_curve} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d42" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      borderColor: "#1f2d42",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#e2e8f0",
                    }}
                    formatter={(v: any, name: string) => [
                      formatINR(v),
                      name === "strategy_equity" ? "Strategy Capital" : "Buy & Hold Capital",
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) =>
                      value === "strategy_equity" ? "Strategy Equity" : "Buy & Hold Benchmark"
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="strategy_equity"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={false}
                    name="strategy_equity"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark_equity"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                    name="benchmark_equity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Log Table */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 shadow-xl">
            <h3 className="font-bold text-gray-100 text-base mb-4 pb-2 border-b border-surface-border/60">
              Executed Trade Log ({result.trades.length} trades)
            </h3>

            {result.trades.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No trades were triggered during this period for the selected parameters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-surface text-gray-400 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Entry Date</th>
                      <th className="py-2.5 px-3">Entry Price</th>
                      <th className="py-2.5 px-3">Exit Date</th>
                      <th className="py-2.5 px-3">Exit Price</th>
                      <th className="py-2.5 px-3 text-right">Return %</th>
                      <th className="py-2.5 px-3 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50 text-gray-200">
                    {result.trades.map((t, idx) => {
                      const isWin = t.return_pct > 0;
                      return (
                        <tr key={idx} className="hover:bg-surface/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-primary-400">
                            {t.trade_type}
                          </td>
                          <td className="py-2.5 px-3">{t.entry_date}</td>
                          <td className="py-2.5 px-3">{formatINR(t.entry_price)}</td>
                          <td className="py-2.5 px-3">{t.exit_date}</td>
                          <td className="py-2.5 px-3">{formatINR(t.exit_price)}</td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold ${
                              isWin ? "text-bullish" : "text-bearish"
                            }`}
                          >
                            {formatPercent(t.return_pct, isWin)}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold ${
                              isWin ? "text-bullish" : "text-bearish"
                            }`}
                          >
                            {isWin ? "+" : ""}
                            {formatINR(t.pnl)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past Performance Guarantee Notice */}
          <div className="p-4 bg-surface rounded-xl border border-surface-border text-xs text-gray-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Methodological Note: </span>
              {result.disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

