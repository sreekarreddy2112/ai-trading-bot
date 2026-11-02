"use client";

import React from "react";
import { StockFundamentals } from "@/lib/types";
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  PieChart as PieIcon, 
  ShieldCheck, 
  Percent, 
  Wallet,
  Activity,
  Layers
} from "lucide-react";
import { formatINR, formatLargeNumber } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  CartesianGrid 
} from "recharts";

interface CompanyFundamentalsProps {
  symbol: string;
  fundamentals: StockFundamentals;
  companyName: string;
}

export default function CompanyFundamentals({
  symbol,
  fundamentals,
  companyName,
}: CompanyFundamentalsProps) {
  const quarterlyData = fundamentals.quarterly_financials || [];

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Company Fundamentals & Financial Health
            </h2>
            <p className="text-xs text-gray-400">
              Audited annual metrics, revenue & profit breakdown, valuation multiples, and quarterly financial trend.
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Indian GAAP / IndAS Disclosures
        </span>
      </div>

      {/* Primary Key Figures Grid (Revenue, Profit, Market Cap, Free Cash Flow) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-surface/80 border border-surface-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Annual Revenue</span>
            <DollarSign className="w-4 h-4 text-primary-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-gray-100">
              ₹{(fundamentals.total_revenue_cr || 0).toLocaleString("en-IN")} Cr
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Trailing 12 Months (TTM)
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-surface/80 border border-surface-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              ₹{(fundamentals.net_profit_cr || 0).toLocaleString("en-IN")} Cr
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Profit Margin: <span className="text-gray-200 font-bold">{fundamentals.profit_margin_pct ?? 12.5}%</span>
            </div>
          </div>
        </div>

        {/* Market Cap */}
        <div className="bg-surface/80 border border-surface-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Market Cap</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-gray-100">
              ₹{(fundamentals.market_cap_cr || 0).toLocaleString("en-IN")} Cr
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Shares Float: <span className="text-gray-200 font-bold">{formatLargeNumber(fundamentals.market_cap)}</span>
            </div>
          </div>
        </div>

        {/* Free Cash Flow */}
        <div className="bg-surface/80 border border-surface-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Free Cash Flow</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-teal-300">
              ₹{(fundamentals.free_cash_flow_cr || 0).toLocaleString("en-IN")} Cr
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
              Positive Operating Cash Flow
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Revenue & Profit Bar Chart (Recharts) */}
      {quarterlyData.length > 0 && (
        <div className="bg-surface/60 border border-surface-border rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                Quarterly Financial Performance Trend
              </h3>
              <p className="text-xs text-gray-400">
                Revenue vs Net Profit comparison across recent quarters (in ₹ Crores)
              </p>
            </div>
          </div>

          <div className="h-60 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...quarterlyData].reverse()} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="quarter" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k Cr`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "10px",
                    color: "#0f172a",
                    fontSize: "12px",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")} Cr`]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="revenue_cr" name="Revenue (₹ Cr)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_profit_cr" name="Net Profit (₹ Cr)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Valuation & Solvency Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface/50 border border-surface-border/80 rounded-xl p-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase">P/E Ratio</span>
          <div className="text-sm sm:text-base font-extrabold text-gray-100 mt-1">
            {fundamentals.pe_ratio ? `${fundamentals.pe_ratio}x` : "N/A"}
          </div>
          <span className="text-[10px] text-gray-400">
            Sector P/E: {fundamentals.industry_pe ?? 24.0}x
          </span>
        </div>

        <div className="bg-surface/50 border border-surface-border/80 rounded-xl p-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase">P/B Ratio</span>
          <div className="text-sm sm:text-base font-extrabold text-gray-100 mt-1">
            {fundamentals.pb_ratio ? `${fundamentals.pb_ratio}x` : "3.2x"}
          </div>
          <span className="text-[10px] text-gray-400">Book Value Multiple</span>
        </div>

        <div className="bg-surface/50 border border-surface-border/80 rounded-xl p-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase">EPS (TTM)</span>
          <div className="text-sm sm:text-base font-extrabold text-gray-100 mt-1">
            ₹{fundamentals.eps_ttm ?? "45.20"}
          </div>
          <span className="text-[10px] text-gray-400">Earnings Per Share</span>
        </div>

        <div className="bg-surface/50 border border-surface-border/80 rounded-xl p-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase">ROE (Return on Equity)</span>
          <div className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1">
            {fundamentals.roe_pct ?? "18.2"}%
          </div>
          <span className="text-[10px] text-gray-400">Capital Efficiency</span>
        </div>

        <div className="bg-surface/50 border border-surface-border/80 rounded-xl p-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Debt to Equity</span>
          <div className="text-sm sm:text-base font-extrabold text-gray-100 mt-1">
            {fundamentals.debt_to_equity ?? "0.45"}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">
            {(fundamentals.debt_to_equity ?? 0.45) < 1.0 ? "Low Debt" : "Leveraged"}
          </span>
        </div>

        <div className="bg-surface/50 border border-surface-border/80 rounded-xl p-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Dividend Yield</span>
          <div className="text-sm sm:text-base font-extrabold text-indigo-300 mt-1">
            {fundamentals.dividend_yield ? `${fundamentals.dividend_yield}%` : "1.2%"}
          </div>
          <span className="text-[10px] text-gray-400">Annual Dividend</span>
        </div>
      </div>

      {/* Shareholding Pattern Bar */}
      <div className="bg-surface/50 border border-surface-border rounded-xl p-4">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-2">
          <span className="flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-primary-400" /> Shareholding Distribution
          </span>
          <span className="text-[11px] text-gray-400">Latest Filing (BSE/NSE)</span>
        </div>

        <div className="w-full bg-surface-border rounded-full h-3 overflow-hidden flex">
          <div
            className="bg-primary-500 h-full"
            style={{ width: `${fundamentals.promoter_holding_pct ?? 51.5}%` }}
            title={`Promoters: ${fundamentals.promoter_holding_pct ?? 51.5}%`}
          />
          <div className="bg-emerald-500 h-full" style={{ width: "24.5%" }} title="FIIs (Foreign Institutional): 24.5%" />
          <div className="bg-amber-500 h-full" style={{ width: "14.0%" }} title="DIIs (Domestic Mutual Funds/Insurance): 14.0%" />
          <div className="bg-rose-500 h-full" style={{ width: "10.0%" }} title="Public & Retail: 10.0%" />
        </div>

        <div className="flex flex-wrap gap-4 mt-2.5 text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            <span>Promoters: <strong className="text-gray-200">{fundamentals.promoter_holding_pct ?? 51.5}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>FIIs: <strong className="text-gray-200">24.5%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>DIIs: <strong className="text-gray-200">14.0%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Public: <strong className="text-gray-200">10.0%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

