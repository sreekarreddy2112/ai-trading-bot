"use client";

import React, { useState, useEffect } from "react";
import { requestEmailOTP, verifyEmailOTP, isSupabaseConfigured } from "@/lib/supabase";
import { 
  X, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Edit2
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Send OTP to Email
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
      await verifyEmailOTP(email.trim(), cleanOtp);
      setMessage("Email verified successfully! Signing you in...");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setStep("email");
        setOtp("");
        setError(null);
        setMessage(null);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-2">
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
                <span>{loading ? "Verifying..." : "Verify Code & Sign In"}</span>
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
    </div>
  );
}
