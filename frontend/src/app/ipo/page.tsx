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
  DollarSign,
  PlusCircle,
  Clock,
  Briefcase,
  Edit3,
  Trash2,
  ChevronRight,
  Filter
} from "lucide-react";

export interface AppliedIPOData {
  applied: boolean;
  lots: number;
  amount: number;
  mandateStatus: "UPI Mandate Approved" | "Submitted (Pending UPI)" | "Shares Allotted" | "Not Allotted";
  broker?: string;
  appliedAt: string;
}

const STORAGE_KEY = "marketmind_applied_ipos";

export default function IPOTrackerPage() {
  const [allIpos, setAllIpos] = useState<IPOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Applied status map persisted in localStorage
  const [appliedMap, setAppliedMap] = useState<Record<string, AppliedIPOData>>({});

  // Apply Modal state
  const [applyModalIpo, setApplyModalIpo] = useState<IPOItem | null>(null);
  const [applyLots, setApplyLots] = useState(1);
  const [applyMandate, setApplyMandate] = useState<AppliedIPOData["mandateStatus"]>("UPI Mandate Approved");
  const [applyBroker, setApplyBroker] = useState("Zerodha");

  // AI Verdict Modal State
  const [activeIpo, setActiveIpo] = useState<IPOItem | null>(null);
  const [aiVerdict, setAiVerdict] = useState<IPOAIVerdict | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [verdictError, setVerdictError] = useState<string | null>(null);

  // Load applied IPOs from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setAppliedMap(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveAppliedMap = (updated: Record<string, AppliedIPOData>) => {
    setAppliedMap(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const fetchIpos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getIPOs("all");
      setAllIpos(data.ipos);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleOpenApplyModal = (ipo: IPOItem) => {
    setApplyModalIpo(ipo);
    const existing = appliedMap[ipo.id];
    if (existing) {
      setApplyLots(existing.lots || 1);
      setApplyMandate(existing.mandateStatus || "UPI Mandate Approved");
      setApplyBroker(existing.broker || "Zerodha");
    } else {
      setApplyLots(1);
      setApplyMandate("UPI Mandate Approved");
      setApplyBroker("Zerodha");
    }
  };

  const handleSaveApplication = () => {
    if (!applyModalIpo) return;
    const totalAmount = applyLots * applyModalIpo.lot_size * applyModalIpo.max_price;
    const updated: Record<string, AppliedIPOData> = {
      ...appliedMap,
      [applyModalIpo.id]: {
        applied: true,
        lots: applyLots,
        amount: totalAmount,
        mandateStatus: applyMandate,
        broker: applyBroker,
        appliedAt: appliedMap[applyModalIpo.id]?.appliedAt || new Date().toISOString(),
      },
    };
    saveAppliedMap(updated);
    setApplyModalIpo(null);
  };

  const handleRemoveApplication = (ipoId: string) => {
    const updated = { ...appliedMap };
    delete updated[ipoId];
    saveAppliedMap(updated);
    setApplyModalIpo(null);
  };

  // Filter logic
  const filteredIpos = allIpos.filter((item) => {
    const matchesSearch =
      item.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sector.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedStatus === "all") return true;
    if (selectedStatus === "open") return item.status.toLowerCase() === "open";
    if (selectedStatus === "closed") return item.status.toLowerCase() === "closed";
    if (selectedStatus === "upcoming") return item.status.toLowerCase() === "upcoming";
    if (selectedStatus === "listed") return item.status.toLowerCase() === "listed";
    if (selectedStatus === "applied") return !!appliedMap[item.id]?.applied;

    return true;
  });

  // Counts for tabs
  const openCount = allIpos.filter((i) => i.status === "Open").length;
  const closedCount = allIpos.filter((i) => i.status === "Closed").length;
  const upcomingCount = allIpos.filter((i) => i.status === "Upcoming").length;
  const listedCount = allIpos.filter((i) => i.status === "Listed").length;
  const appliedCount = Object.values(appliedMap).filter((a) => a.applied).length;
  const totalAppliedCapital = Object.values(appliedMap)
    .filter((a) => a.applied)
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            🔥 Bidding Open
          </span>
        );
      case "Closed":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 border border-purple-200 text-purple-700">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            ⏳ Closed (Allotment Pending)
          </span>
        );
      case "Upcoming":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            📅 Upcoming Issue
          </span>
        );
      case "Listed":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Listed on NSE
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getVerdictBadge = (v: string) => {
    switch (v) {
      case "Apply for Listing Gains":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" /> Apply for Listing Gains
          </span>
        );
      case "Apply for Long Term":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 border border-blue-300 text-blue-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" /> Apply for Long Term
          </span>
        );
      case "Avoid":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 border border-rose-300 text-rose-800 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> High Risk / Avoid
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 border border-amber-300 text-amber-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Neutral / Watch
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
              <Rocket className="w-3.5 h-3.5 text-indigo-600" />
              Indian Primary Markets Intelligence
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Indian IPO Tracker & AI Verdicts
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Track newly opened IPOs, live grey market premiums (GMP), subscription demand, and upcoming pipeline. Mark your bids, track UPI mandates, and evaluate subscription risk with Claude AI thesis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={fetchIpos}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh IPOs</span>
            </button>
          </div>
        </div>

        {/* Highlight Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div 
            onClick={() => setSelectedStatus("open")}
            className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">🔥 Newly Opened</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">{openCount} Live</div>
            <span className="text-[11px] text-emerald-700">Bidding active right now</span>
          </div>

          <div 
            onClick={() => setSelectedStatus("closed")}
            className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">⏳ Closed / Pending</span>
              <Clock className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-900 mt-1">{closedCount} Issues</div>
            <span className="text-[11px] text-purple-700">Allotment & listing pending</span>
          </div>

          <div 
            onClick={() => setSelectedStatus("upcoming")}
            className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">📅 Upcoming</span>
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">{upcomingCount} Issues</div>
            <span className="text-[11px] text-amber-700">Tata Capital, boAt, Ather</span>
          </div>

          <div 
            onClick={() => setSelectedStatus("applied")}
            className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide">✅ My Applied IPOs</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-1">{appliedCount} Applied</div>
            <span className="text-[11px] text-indigo-700">{formatINR(totalAppliedCapital)} blocked</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
          {[
            { id: "all", label: "All IPOs", count: allIpos.length },
            { id: "open", label: "🔥 Newly Opened", count: openCount },
            { id: "closed", label: "⏳ Closed / Pending", count: closedCount },
            { id: "upcoming", label: "📅 Upcoming", count: upcomingCount },
            { id: "listed", label: "🎉 Recently Listed", count: listedCount },
            { id: "applied", label: "✅ My Applied", count: appliedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStatus === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStatus === tab.id
                    ? "bg-indigo-700/80 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* IPO Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredIpos.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 shadow-xs">
              <Rocket className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <p className="text-base font-bold text-slate-800">
                {selectedStatus === "applied" ? "No applied IPOs tracked yet" : "No IPOs match your criteria"}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {selectedStatus === "applied"
                  ? "Click 'Mark as Applied' on any Newly Opened or Closed IPO card to track your lots, investment amount, and UPI mandate status."
                  : "Try clearing your search query or selecting a different status filter."}
              </p>
              {selectedStatus === "applied" && (
                <button
                  onClick={() => setSelectedStatus("open")}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  View Newly Opened IPOs
                </button>
              )}
            </div>
          ) : (
            filteredIpos.map((ipo) => {
              const isGmpPositive = ipo.gmp >= 0;
              const appliedInfo = appliedMap[ipo.id];

              return (
                <div
                  key={ipo.id}
                  className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between gap-5 relative overflow-hidden group ${
                    appliedInfo?.applied ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {ipo.company_name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-bold text-slate-700">{ipo.symbol}</span>
                          <span>•</span>
                          <span>{ipo.sector}</span>
                        </div>
                      </div>
                      <div>{getStatusBadge(ipo.status)}</div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                      {ipo.overview}
                    </p>

                    {/* Applied Status Banner if user marked as applied */}
                    {appliedInfo?.applied && (
                      <div className="mt-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 flex items-center justify-between text-xs shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <span className="font-bold text-indigo-950">
                              Applied: {appliedInfo.lots} Lot{appliedInfo.lots > 1 ? "s" : ""} ({formatINR(appliedInfo.amount)})
                            </span>
                            <span className="text-indigo-400 mx-1.5">•</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-indigo-200 text-indigo-800">
                              {appliedInfo.mandateStatus}
                            </span>
                            {appliedInfo.broker && (
                              <span className="text-[11px] text-indigo-700 ml-1.5 font-medium hidden sm:inline">
                                ({appliedInfo.broker})
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenApplyModal(ipo)}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-1 rounded border border-indigo-200 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    )}

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Price Band</span>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                          {ipo.price_band}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Issue Size</span>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                          {ipo.issue_size}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Min Ticket</span>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                          {formatINR(ipo.min_investment)}
                        </div>
                        <span className="text-[9px] text-slate-500 block">({ipo.lot_size} shares)</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          {ipo.status === "Listed" ? "Listing Gain" : "Est. GMP"}
                        </span>
                        {ipo.status === "Listed" ? (
                          <div
                            className={`text-xs sm:text-sm font-black mt-0.5 ${
                              (ipo.listing_gain_pct ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {(ipo.listing_gain_pct ?? 0) >= 0 ? "+" : ""}
                            {(ipo.listing_gain_pct ?? 0).toFixed(1)}%
                          </div>
                        ) : (
                          <div
                            className={`text-xs sm:text-sm font-black mt-0.5 ${
                              isGmpPositive ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isGmpPositive ? "+" : ""}
                            {formatINR(ipo.gmp)} ({ipo.gmp_percent >= 0 ? "+" : ""}
                            {ipo.gmp_percent.toFixed(1)}%)
                          </div>
                        )}
                        <span className="text-[9px] text-slate-500 block">
                          {ipo.status === "Listed" ? `Listed at ₹${ipo.listing_price}` : "Grey Market Spread"}
                        </span>
                      </div>
                    </div>

                    {/* Subscription Meter (if bidding has occurred) */}
                    {ipo.subscription.total > 0 && (
                      <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600 font-semibold">Subscription Demand:</span>
                          <span className="font-extrabold text-indigo-600">
                            {ipo.subscription.total}x Total
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700">
                          <div className="bg-white px-2 py-1 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-medium">QIB:</span>
                            <span className="font-bold">{ipo.subscription.qib}x</span>
                          </div>
                          <div className="bg-white px-2 py-1 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-medium">NII/HNI:</span>
                            <span className="font-bold">{ipo.subscription.nii}x</span>
                          </div>
                          <div className="bg-white px-2 py-1 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-medium">Retail:</span>
                            <span className="font-bold">{ipo.subscription.retail}x</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer with Key Dates & Interactive Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {ipo.status === "Listed"
                          ? `Listed: ${ipo.listing_date}`
                          : ipo.status === "Closed"
                          ? `Closed on: ${ipo.close_date} • Allotment: ${ipo.listing_date}`
                          : `Closes: ${ipo.close_date}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Mark / Edit Applied Button */}
                      {!appliedInfo?.applied ? (
                        <button
                          onClick={() => handleOpenApplyModal(ipo)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
                          <span>Mark as Applied</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenApplyModal(ipo)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold transition-all shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Applied ✓</span>
                        </button>
                      )}

                      {/* Claude AI Verdict Button */}
                      <button
                        onClick={() => handleOpenAiVerdict(ipo)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-95 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Verdict</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Track & Apply IPO Modal */}
      {applyModalIpo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setApplyModalIpo(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {applyModalIpo.company_name}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {applyModalIpo.symbol} &bull; Application & Mandate Tracker
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Lots Input & Stepper */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Number of Lots Applied
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setApplyLots((prev) => Math.max(1, prev - 1))}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-sm font-black text-slate-900 min-w-[48px] text-center">
                      {applyLots}
                    </span>
                    <button
                      type="button"
                      onClick={() => setApplyLots((prev) => Math.min(20, prev + 1))}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900">
                      {applyLots * applyModalIpo.lot_size} shares
                    </span>{" "}
                    @ ₹{applyModalIpo.max_price}/share
                  </div>
                </div>
              </div>

              {/* Total Investment Amount Preview */}
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide block">
                    Total Application Amount
                  </span>
                  <span className="text-lg font-black text-indigo-950">
                    {formatINR(applyLots * applyModalIpo.lot_size * applyModalIpo.max_price)}
                  </span>
                </div>
                <span className="text-xs text-indigo-700 font-semibold px-2 py-1 bg-white rounded-lg border border-indigo-200">
                  Cut-off Bid
                </span>
              </div>

              {/* Mandate Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  UPI Mandate / Application Status
                </label>
                <select
                  value={applyMandate}
                  onChange={(e) => setApplyMandate(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="UPI Mandate Approved">UPI Mandate Approved ✓ (Funds Blocked)</option>
                  <option value="Submitted (Pending UPI)">Submitted (Pending UPI Approval)</option>
                  <option value="Shares Allotted">Shares Allotted 🎉</option>
                  <option value="Not Allotted">Not Allotted (Funds Released)</option>
                </select>
              </div>

              {/* Broker / Demat Account */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Demat Broker (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zerodha, Groww, Angel One, Upstox"
                  value={applyBroker}
                  onChange={(e) => setApplyBroker(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                {appliedMap[applyModalIpo.id]?.applied ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveApplication(applyModalIpo.id)}
                    className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold py-2 px-3 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Status
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalIpo(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveApplication}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                  >
                    Save Status ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claude AI Verdict Modal */}
      {activeIpo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveIpo(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {activeIpo.company_name}
                </h3>
                <span className="text-xs text-indigo-600 font-semibold">
                  Claude 3.5 Sonnet IPO Subscription Analysis
                </span>
              </div>
            </div>

            {/* Loading */}
            {verdictLoading && (
              <div className="py-12 text-center space-y-3 animate-pulse">
                <RefreshCw className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
                <p className="text-sm font-bold text-slate-700">
                  Synthesizing valuation multiples, grey market demand, and promoter dilution...
                </p>
                <p className="text-xs text-slate-500">Evaluating risks against industry peers</p>
              </div>
            )}

            {/* Error */}
            {verdictError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                {verdictError}
              </div>
            )}

            {/* Loaded Content */}
            {aiVerdict && !verdictLoading && (
              <div className="space-y-5">
                {/* Verdict Badge */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                    Subscription Recommendation:
                  </div>
                  {getVerdictBadge(aiVerdict.verdict)}
                </div>

                {/* Executive Summary */}
                <div>
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1.5">
                    Executive Thesis
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                    {aiVerdict.verdict_summary}
                  </p>
                </div>

                {/* Valuation Assessment */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Valuation Assessment
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {aiVerdict.valuation_assessment}
                  </p>
                </div>

                {/* Strengths & Risks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                    <h5 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Key Strengths
                    </h5>
                    <ul className="space-y-1.5 text-xs text-emerald-950">
                      {aiVerdict.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                    <h5 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Key Risks
                    </h5>
                    <ul className="space-y-1.5 text-xs text-rose-950">
                      {aiVerdict.risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-600 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Compliance Disclaimer */}
                <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
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
