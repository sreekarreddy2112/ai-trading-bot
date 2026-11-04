"use client";

import React, { useState, useEffect } from "react";
import { requestEmailOTP, verifyEmailOTP, isSupabaseConfigured, AuthUser } from "@/lib/supabase";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { 
  Sparkles, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  TrendingUp,
  Cpu, 
  Bell, 
  RefreshCw,
  Edit2
} from "lucide-react";

interface Props {
  onSuccess: (user: AuthUser) => void;
}

export default function LoginGateway({ onSuccess }: Props) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request OTP delivered directly to user's email
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await requestEmailOTP(cleanEmail);
      setStep("otp");
      setMessage(res.message || `A 6-digit verification code was sent directly to ${cleanEmail}. Please check your inbox.`);
      setResendCooldown(45);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please check your email address and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code received in your email.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const user = await verifyEmailOTP(email.trim(), cleanOtp);
      setMessage("Email verified successfully! Opening your dashboard...");
      setTimeout(() => {
        onSuccess(user);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code. Please check the code in your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* SEBI Compliance Banner */}
      <DisclaimerBanner />

      {/* Hero Welcome Card */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Autonomous Technical, Fundamental & AI Synthesis for Indian Equities
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          MarketMind{" "}
          <span className="inline-block text-indigo-600 font-black bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-2xl align-middle text-2xl sm:text-4xl shadow-sm">
            India
          </span>
        </h1>
        <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          Please verify your email address to unlock real-time NSE market telemetry, Claude 3.5 Sonnet quantitative analytics, and automated limit price alerts.
        </p>
      </div>

      {/* Main Authentication Gateway Card */}
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            {step === "email" ? <Mail className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {step === "email" ? "Email Verification" : "Enter Verification Code"}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] text-slate-500 font-medium">
                {isSupabaseConfigured ? "Secured via Supabase Email Auth" : "Direct Email OTP Delivery"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          {step === "email"
            ? "Enter your email address to receive your private 6-digit verification code directly in your inbox."
            : `A 6-digit code has been delivered directly to your email inbox. Please check your mail.`}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-snug">{message}</span>
          </div>
        )}

        {/* ================= STEP 1: ENTER EMAIL ================= */}
        {step === "email" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{loading ? "Sending Code to Email..." : "Send Verification Code"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* ================= STEP 2: ENTER OTP ================= */
          <div>
            {/* Target Email Confirmation Bar */}
            <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-semibold truncate">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError(null);
                  setMessage(null);
                }}
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 text-[11px] shrink-0 ml-2 hover:underline"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
                  6-Digit Code Received in Your Email
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="••••••"
                  className="w-full text-center text-2xl font-mono font-extrabold tracking-[0.5em] py-3 bg-white border-2 border-indigo-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl text-slate-900 placeholder:text-slate-300 focus:outline-none shadow-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>{loading ? "Verifying..." : "Verify Code & Open Dashboard"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>

            {/* Resend OTP */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Didn&apos;t receive the email?</span>
              {resendCooldown > 0 ? (
                <span className="text-slate-400 font-medium">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOTP()}
                  disabled={loading}
                  className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feature Showcase Grid below the card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live NSE Market Telemetry</h4>
          <p className="text-xs text-slate-500">Real-time Nifty 50 constituents, top gainers, and top losers refreshed continuously.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 border border-indigo-100">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Claude 3.5 AI Analyst</h4>
          <p className="text-xs text-slate-500">Zero-hallucination mathematical indicators coupled with institutional qualitative trade thesis.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-100">
            <Bell className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Automated Limit Price Alerts</h4>
          <p className="text-xs text-slate-500">Set customized target and stop-loss price threshold notifications tied to your account.</p>
        </div>
      </div>
    </div>
  );
}
