"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { IPOItem, IPOAIVerdict } from "@/lib/types";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { formatINR } from "@/lib/utils";
import {
  Rocket,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  Building2,
  DollarSign
} from "lucide-react";

export default function IPOTrackerPage() {
  const [ipos, setIpos] = useState<IPOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // AI Verdict Modal / Drawer State
  const [activeIpo, setActiveIpo] = useState<IPOItem | null>(null);
  const [aiVerdict, setAiVerdict] = useState<IPOAIVerdict | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [verdictError, setVerdictError] = useState<string | null>(null);

  const fetchIpos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getIPOs(selectedStatus);
      setIpos(data.ipos);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchIpos();
  }, [fetchIpos]);

  const handleOpenAiVerdict = async (ipo: IPOItem) => {
    setActiveIpo(ipo);
    setAiVerdict(null);
    setVerdictError(null);
    setVerdictLoading(true);
    try {
      const verdict = await api.getIPOAIVerdict(ipo.id);
      setAiVerdict(verdict);
    } catch (err: any) {
      setVerdictError(err.message || "Failed to generate AI evaluation");
    } finally {
      setVerdictLoading(false);
    }
  };

  const filteredIpos = ipos.filter(
    (item) =>
      item.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Bidding Open
          </span>
        );
      case "Upcoming":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300">
            Upcoming
          </span>
        );
      case "Listed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/60 border border-indigo-500/40 text-indigo-300">
            Listed on NSE
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface border border-surface-border text-gray-400">
            {status}
          </span>
        );
    }
  };

  const getVerdictBadge = (v: string) => {
    switch (v) {
      case "Apply for Listing Gains":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Apply for Listing Gains
          </span>
        );
      case "Apply for Long Term":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Apply for Long Term
          </span>
        );
      case "Avoid":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 border border-rose-500/50 text-rose-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> High Risk / Avoid
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Neutral / Watch
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-surface-card to-surface border border-surface-border p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold mb-3">
              <Rocket className="w-3.5 h-3.5 text-primary-400" />
              Indian Primary Markets Intelligence
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Indian IPO Tracker & AI Verdicts
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
              Track upcoming, active, and recent NSE/BSE initial public offerings with live Grey Market Premium (GMP) estimates, subscription telemetry, and one-click Claude AI subscription thesis.
            </p>
          </div>

          <button
            onClick={fetchIpos}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-border border border-surface-border rounded-xl text-xs font-semibold text-gray-300 transition-colors self-start md:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh IPOs</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-1 flex items-center gap-1 self-start">
          {[
            { id: "all", label: "All IPOs" },
            { id: "open", label: "Open Now" },
            { id: "upcoming", label: "Upcoming" },
            { id: "listed", label: "Recently Listed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === tab.id
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by company or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-surface-card border border-surface-border rounded-xl text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-surface-card rounded-2xl border border-surface-border animate-pulse" />
          ))}
        </div>
      )}

      {/* IPO Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredIpos.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-surface-card border border-surface-border rounded-2xl text-gray-400">
              <Rocket className="w-10 h-10 mx-auto text-gray-500 mb-3" />
              <p className="text-base font-semibold text-gray-200">No IPOs found</p>
              <p className="text-xs text-gray-500 mt-1">Try selecting a different filter or search term.</p>
            </div>
          ) : (
            filteredIpos.map((ipo) => {
              const isGmpPositive = ipo.gmp >= 0;
              return (
                <div
                  key={ipo.id}
                  className="bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-surface-border/90 transition-all shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group"
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-white group-hover:text-primary-300 transition-colors">
                            {ipo.company_name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="font-semibold text-gray-300">{ipo.symbol}</span>
                          <span>•</span>
                          <span>{ipo.sector}</span>
                        </div>
                      </div>
                      {getStatusBadge(ipo.status)}
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                      {ipo.overview}
                    </p>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-surface-border/60">
                      <div className="bg-surface p-2.5 rounded-xl border border-surface-border/50">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Price Band</span>
                        <div className="text-xs sm:text-sm font-bold text-gray-200 mt-0.5 truncate">
                          {ipo.price_band}
                        </div>
                      </div>

                      <div className="bg-surface p-2.5 rounded-xl border border-surface-border/50">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Issue Size</span>
                        <div className="text-xs sm:text-sm font-bold text-gray-200 mt-0.5 truncate">
                          {ipo.issue_size}
                        </div>
                      </div>

                      <div className="bg-surface p-2.5 rounded-xl border border-surface-border/50">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Min Ticket</span>
                        <div className="text-xs sm:text-sm font-bold text-gray-200 mt-0.5 truncate">
                          {formatINR(ipo.min_investment)}
                        </div>
                        <span className="text-[9px] text-gray-500 block">({ipo.lot_size} shares)</span>
                      </div>

                      <div className="bg-surface p-2.5 rounded-xl border border-surface-border/50">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">
                          {ipo.status === "Listed" ? "Listing Gain" : "Est. GMP"}
                        </span>
                        {ipo.status === "Listed" ? (
                          <div
                            className={`text-xs sm:text-sm font-black mt-0.5 ${
                              (ipo.listing_gain_pct ?? 0) >= 0 ? "text-bullish" : "text-bearish"
                            }`}
                          >
                            {(ipo.listing_gain_pct ?? 0) >= 0 ? "+" : ""}
                            {(ipo.listing_gain_pct ?? 0).toFixed(1)}%
                          </div>
                        ) : (
                          <div
                            className={`text-xs sm:text-sm font-black mt-0.5 ${
                              isGmpPositive ? "text-bullish" : "text-bearish"
                            }`}
                          >
                            {isGmpPositive ? "+" : ""}
                            {formatINR(ipo.gmp)} ({ipo.gmp_percent >= 0 ? "+" : ""}
                            {ipo.gmp_percent.toFixed(1)}%)
                          </div>
                        )}
                        <span className="text-[9px] text-gray-500 block">
                          {ipo.status === "Listed" ? `Listed at ₹${ipo.listing_price}` : "Grey Market"}
                        </span>
                      </div>
                    </div>

                    {/* Subscription Meter (if bidding has occurred) */}
                    {ipo.subscription.total > 0 && (
                      <div className="mt-4 bg-surface p-3 rounded-xl border border-surface-border/50">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-gray-400 font-medium">Subscription Demand:</span>
                          <span className="font-bold text-primary-400">
                            {ipo.subscription.total}x Total
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-300">
                          <div className="bg-surface-card px-2 py-1 rounded border border-surface-border">
                            <span className="text-gray-500 block text-[10px]">QIB:</span>
                            <span className="font-semibold">{ipo.subscription.qib}x</span>
                          </div>
                          <div className="bg-surface-card px-2 py-1 rounded border border-surface-border">
                            <span className="text-gray-500 block text-[10px]">NII/HNI:</span>
                            <span className="font-semibold">{ipo.subscription.nii}x</span>
                          </div>
                          <div className="bg-surface-card px-2 py-1 rounded border border-surface-border">
                            <span className="text-gray-500 block text-[10px]">Retail:</span>
                            <span className="font-semibold">{ipo.subscription.retail}x</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer with Key Dates & AI Button */}
                  <div className="flex items-center justify-between gap-3 border-t border-surface-border/60 pt-3 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Calendar className="w-3.5 h-3.5 text-primary-400" />
                      <span>
                        {ipo.status === "Listed"
                          ? `Listed: ${ipo.listing_date}`
                          : `Close: ${ipo.close_date}`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenAiVerdict(ipo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-primary-500/20 active:scale-95 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Verdict</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Claude AI Verdict Modal */}
      {activeIpo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-surface-card border border-surface-border rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveIpo(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {activeIpo.company_name}
                </h3>
                <span className="text-xs text-primary-400 font-medium">
                  Claude 3.5 Sonnet IPO Subscription Analysis
                </span>
              </div>
            </div>

            {/* Loading */}
            {verdictLoading && (
              <div className="py-12 text-center space-y-3 animate-pulse">
                <RefreshCw className="w-8 h-8 mx-auto text-primary-400 animate-spin" />
                <p className="text-sm font-semibold text-gray-300">
                  Synthesizing valuation multiples, grey market demand, and promoter dilution...
                </p>
                <p className="text-xs text-gray-500">Evaluating risks against industry peers</p>
              </div>
            )}

            {/* Error */}
            {verdictError && (
              <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-200 text-xs">
                {verdictError}
              </div>
            )}

            {/* Loaded Content */}
            {aiVerdict && !verdictLoading && (
              <div className="space-y-5">
                {/* Verdict Badge */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-xl border border-surface-border">
                  <div className="text-xs text-gray-400 font-medium">Subscription Recommendation:</div>
                  {getVerdictBadge(aiVerdict.verdict)}
                </div>

                {/* Executive Summary */}
                <div>
                  <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1.5">
                    Executive Thesis
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-200 bg-surface/50 p-3.5 rounded-xl border border-surface-border leading-relaxed">
                    {aiVerdict.verdict_summary}
                  </p>
                </div>

                {/* Valuation Assessment */}
                <div>
                  <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
                    Valuation Assessment
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-300 bg-surface/50 p-3 rounded-xl border border-surface-border">
                    {aiVerdict.valuation_assessment}
                  </p>
                </div>

                {/* Strengths & Risks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface/50 p-3 rounded-xl border border-surface-border">
                    <h5 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                      <Check className="w-3.5 h-3.5" /> Strengths
                    </h5>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      {aiVerdict.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-surface/50 p-3 rounded-xl border border-surface-border">
                    <h5 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Key Risks
                    </h5>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      {aiVerdict.risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Compliance Disclaimer */}
                <div className="text-[10px] text-gray-500 border-t border-surface-border/50 pt-3">
                  {aiVerdict.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

