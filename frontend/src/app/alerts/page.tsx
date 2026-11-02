"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AlertItem, AlertListResponse } from "@/lib/types";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import PriceAlertModal from "@/components/PriceAlertModal";
import { 
  Bell, 
  Trash2, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Plus, 
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function AlertsPage() {
  const [data, setData] = useState<AlertListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "triggered">("all");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSymbol, setModalSymbol] = useState("RELIANCE");
  const [modalPrice, setModalPrice] = useState(2980.50);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAlerts();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load price alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-poll alerts every 30 seconds for live updates
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (alertId: string) => {
    try {
      await api.deleteAlert(alertId);
      setData((prev) => {
        if (!prev) return null;
        const remaining = prev.alerts.filter((a) => a.id !== alertId);
        return {
          ...prev,
          alerts: remaining,
          active_count: remaining.filter((a) => a.status === "ACTIVE").length,
          triggered_count: remaining.filter((a) => a.status === "TRIGGERED").length,
        };
      });
    } catch (err: any) {
      alert("Failed to delete alert: " + err.message);
    }
  };

  const handleReset = async (alertId: string) => {
    try {
      await api.resetAlert(alertId);
      fetchAlerts();
    } catch (err: any) {
      alert("Failed to reset alert: " + err.message);
    }
  };

  const alerts = data?.alerts || [];
  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === "active") return a.status === "ACTIVE";
    if (activeTab === "triggered") return a.status === "TRIGGERED";
    return true;
  });

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "ABOVE_LIMIT":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800">
            <TrendingUp className="w-3 h-3 text-emerald-600" /> Target Price
          </span>
        );
      case "BELOW_LIMIT":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-300 text-rose-800">
            <TrendingDown className="w-3 h-3 text-rose-600" /> Stop Loss
          </span>
        );
      case "PCT_GAIN":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-800">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Surge Alert
          </span>
        );
      case "PCT_DROP":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800">
            <ShieldAlert className="w-3 h-3 text-amber-600" /> Drop Alert
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Price Alerts & Limit Orders
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Instant alerts for target price breakouts, stop loss breaches, and daily percentage surges for NSE stocks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setModalSymbol("RELIANCE");
              setModalPrice(2980.50);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-primary-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Alert</span>
          </button>
          <button
            onClick={fetchAlerts}
            className="p-2.5 rounded-xl bg-surface border border-surface-border text-gray-400 hover:text-white transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-card border border-surface-border rounded-xl p-4">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Alerts</span>
          <div className="text-xl sm:text-2xl font-black text-gray-100 mt-1">
            {alerts.length}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-4">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Active Monitoring</span>
          <div className="text-xl sm:text-2xl font-black text-primary-400 mt-1">
            {data?.active_count || 0}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-4">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Triggered Alerts</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            {data?.triggered_count || 0}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-4">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Telemetry Engine</span>
          <div className="text-xs sm:text-sm font-bold text-gray-200 mt-1 flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Active Tick Feed
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === "all"
              ? "bg-primary-600/20 text-primary-300 border border-primary-500/40"
              : "text-gray-400 hover:text-white"
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === "active"
              ? "bg-primary-600/20 text-primary-300 border border-primary-500/40"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Active Monitoring ({data?.active_count || 0})
        </button>
        <button
          onClick={() => setActiveTab("triggered")}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === "triggered"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Triggered ({data?.triggered_count || 0})
        </button>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <Bell className="w-10 h-10 text-gray-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-200">No Alerts Found</h3>
          <p className="text-xs text-gray-400">
            Set limit price alerts to get notified whenever Indian equities cross your price targets or stop losses.
          </p>
          <button
            onClick={() => {
              setModalSymbol("RELIANCE");
              setModalPrice(2980.50);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-500"
          >
            Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlerts.map((alert) => {
            const isTriggered = alert.status === "TRIGGERED";
            const isPriceLimit = alert.alert_type === "ABOVE_LIMIT" || alert.alert_type === "BELOW_LIMIT";

            return (
              <div
                key={alert.id}
                className={`bg-surface-card border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all ${
                  isTriggered
                    ? "border-emerald-500/50 bg-emerald-950/10 shadow-emerald-500/10"
                    : "border-surface-border hover:border-primary-500/40"
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Link
                      href={`/analyze/${alert.symbol}`}
                      className="group flex items-center gap-2 hover:text-primary-400 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-surface border border-surface-border flex items-center justify-center font-bold text-sm text-gray-100 group-hover:border-primary-500">
                        {alert.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-extrabold text-base text-gray-100 flex items-center gap-1">
                          <span>{alert.symbol}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[130px]">
                          {alert.company_name}
                        </div>
                      </div>
                    </Link>

                    {getAlertBadge(alert.alert_type)}
                  </div>

                  {/* Target Value Display */}
                  <div className="bg-surface/60 border border-surface-border/60 rounded-xl p-3 my-3">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                      <span>Target Condition</span>
                      <span className="font-mono text-gray-300">
                        LTP: <strong>{formatINR(alert.current_price)}</strong>
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="text-xl font-black text-gray-100 font-mono">
                        {isPriceLimit ? formatINR(alert.target_value) : `${alert.target_value}%`}
                      </div>

                      {isTriggered ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> TRIGGERED
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-primary-400 font-mono">
                          {Math.abs(alert.distance_percent).toFixed(1)}% away
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Note / Created */}
                  {alert.note && (
                    <p className="text-xs text-gray-300 italic mb-3">"{alert.note}"</p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-surface-border/60 pt-2.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {isTriggered ? `Triggered: ${alert.triggered_at}` : `Created: ${alert.created_at}`}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-surface-border/60">
                  {isTriggered && (
                    <button
                      onClick={() => handleReset(alert.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface border border-surface-border text-gray-300 hover:text-white hover:bg-surface-card transition-colors"
                      title="Reset Alert to Active"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-primary-400" /> Reset
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-surface transition-colors"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <PriceAlertModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        symbol={modalSymbol}
        currentPrice={modalPrice}
        onAlertCreated={fetchAlerts}
      />
    </div>
  );
}

