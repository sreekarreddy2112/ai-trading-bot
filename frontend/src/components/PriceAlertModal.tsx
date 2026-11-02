"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { CreateAlertRequest } from "@/lib/types";
import { 
  Bell, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  AlertCircle, 
  Sparkles,
  ShieldAlert
} from "lucide-react";
import { formatINR } from "@/lib/utils";

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  onAlertCreated?: () => void;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  onAlertCreated,
}: PriceAlertModalProps) {
  const [alertType, setAlertType] = useState<"ABOVE_LIMIT" | "BELOW_LIMIT" | "PCT_GAIN" | "PCT_DROP">("ABOVE_LIMIT");
  const [targetValue, setTargetValue] = useState<string>((currentPrice * 1.03).toFixed(2));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTypeChange = (type: "ABOVE_LIMIT" | "BELOW_LIMIT" | "PCT_GAIN" | "PCT_DROP") => {
    setAlertType(type);
    if (type === "ABOVE_LIMIT") {
      setTargetValue((currentPrice * 1.03).toFixed(2));
    } else if (type === "BELOW_LIMIT") {
      setTargetValue((currentPrice * 0.97).toFixed(2));
    } else if (type === "PCT_GAIN") {
      setTargetValue("3.0");
    } else if (type === "PCT_DROP") {
      setTargetValue("2.5");
    }
  };

  const handleShortcut = (pct: number) => {
    if (alertType === "ABOVE_LIMIT" || alertType === "BELOW_LIMIT") {
      const val = currentPrice * (1 + pct / 100);
      setTargetValue(val.toFixed(2));
    } else {
      setTargetValue(Math.abs(pct).toFixed(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetValue);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid positive target value");
      return;
    }

    setLoading(true);
    setError(null);

    // Request browser notification permission if available
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }

    try {
      const payload: CreateAlertRequest = {
        symbol: symbol.toUpperCase(),
        alert_type: alertType,
        target_value: val,
        note: note.trim() || undefined,
      };

      await api.createAlert(payload);
      setSuccess(true);
      if (onAlertCreated) onAlertCreated();

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || "Failed to create price alert");
    } finally {
      setLoading(false);
    }
  };

  const numericTarget = parseFloat(targetValue) || 0;
  const isPriceLimit = alertType === "ABOVE_LIMIT" || alertType === "BELOW_LIMIT";
  const diffPct = isPriceLimit && currentPrice > 0
    ? (((numericTarget - currentPrice) / currentPrice) * 100).toFixed(2)
    : "0.0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface-card border border-surface-border rounded-2xl p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Set Price Alert for {symbol}
            </h3>
            <p className="text-xs text-gray-400">
              Current Market Price: <span className="font-bold text-gray-200 font-mono">{formatINR(currentPrice)}</span>
            </p>
          </div>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Price Alert Created!</h4>
            <p className="text-xs text-gray-400">
              You will be notified immediately when {symbol} triggers your limit condition.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Alert Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Alert Trigger Condition
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleTypeChange("ABOVE_LIMIT")}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    alertType === "ABOVE_LIMIT"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                      : "bg-surface border-surface-border text-gray-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Target (Rises Above)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("BELOW_LIMIT")}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    alertType === "BELOW_LIMIT"
                      ? "bg-rose-50 border-rose-500 text-rose-800 shadow-sm"
                      : "bg-surface border-surface-border text-gray-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <span>Stop Loss (Drops Below)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("PCT_GAIN")}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    alertType === "PCT_GAIN"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm"
                      : "bg-surface border-surface-border text-gray-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Day Gain (+X%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("PCT_DROP")}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    alertType === "PCT_DROP"
                      ? "bg-amber-50 border-amber-500 text-amber-800 shadow-sm"
                      : "bg-surface border-surface-border text-gray-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Day Drop (-X%)</span>
                </button>
              </div>
            </div>

            {/* Target Limit Input */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-1.5">
                <span>{isPriceLimit ? "Limit Price (₹)" : "Threshold Percentage (%)"}</span>
                {isPriceLimit && (
                  <span className="text-[11px] text-gray-400 font-mono">
                    Distance: <strong className={Number(diffPct) >= 0 ? "text-bullish" : "text-bearish"}>{diffPct}%</strong>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={isPriceLimit ? "3150.00" : "3.0"}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-xl text-base font-mono font-bold text-gray-100 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Quick shortcut buttons */}
              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px] font-semibold text-gray-400">
                <button
                  type="button"
                  onClick={() => handleShortcut(1)}
                  className="px-2 py-0.5 rounded bg-surface hover:bg-surface-border/80 border border-surface-border"
                >
                  +1%
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcut(2.5)}
                  className="px-2 py-0.5 rounded bg-surface hover:bg-surface-border/80 border border-surface-border"
                >
                  +2.5%
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcut(5)}
                  className="px-2 py-0.5 rounded bg-surface hover:bg-surface-border/80 border border-surface-border"
                >
                  +5%
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcut(-2)}
                  className="px-2 py-0.5 rounded bg-surface hover:bg-surface-border/80 border border-surface-border"
                >
                  -2%
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcut(-5)}
                  className="px-2 py-0.5 rounded bg-surface hover:bg-surface-border/80 border border-surface-border"
                >
                  -5%
                </button>
              </div>
            </div>

            {/* Note / Catalyst */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Note / Strategy Reasoning (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Resistance breakout target, 50 SMA breakdown stop loss"
                className="w-full px-3.5 py-2 bg-surface border border-surface-border rounded-xl text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-xs font-semibold text-gray-400 hover:text-white hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-primary-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Bell className="w-4 h-4" />
                <span>{loading ? "Creating Alert..." : "Activate Alert"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

