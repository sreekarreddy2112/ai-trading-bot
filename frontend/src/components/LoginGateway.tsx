"use client";

import React, { useState } from "react";
import { signInUser, signUpUser, AuthUser } from "@/lib/supabase";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  TrendingUp,
  Cpu, 
  Bell, 
  Eye, 
  EyeOff,
  LogIn,
  UserPlus
} from "lucide-react";

interface Props {
  onSuccess: (user: AuthUser) => void;
}

export default function LoginGateway({ onSuccess }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  
  // Sign In state (either email, username, or phone)
  const [identifier, setIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Handle Sign In (Email, Username, or Phone Number + Password)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    const cleanPw = signInPassword.trim();

    if (!cleanId) {
      setError("Please enter your Email, Username, or Phone number.");
      return;
    }
    if (!cleanPw) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const user = await signInUser({
        identifier: cleanId,
        password: cleanPw,
      });
      setMessage(`Welcome back, ${user.name || user.username || user.email}! Opening your dashboard...`);
      setTimeout(() => {
        onSuccess(user);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up (Email, Username, Phone Number, and Password)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = signUpUsername.trim();
    const cleanEmail = signUpEmail.trim();
    const cleanPhone = signUpPhone.trim();
    const cleanPw = signUpPassword.trim();
    const cleanConfirm = signUpConfirmPassword.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      setError("Username must be at least 3 characters in length.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, "").length < 7) {
      setError("Please enter a valid phone number (at least 7 digits).");
      return;
    }
    if (cleanPw.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }
    if (cleanPw !== cleanConfirm) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const user = await signUpUser({
        email: cleanEmail,
        username: cleanUsername,
        phone: cleanPhone,
        password: cleanPw,
      });
      setMessage("Account created successfully! Opening your dashboard...");
      setTimeout(() => {
        onSuccess(user);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* SEBI Compliance Banner */}
      <DisclaimerBanner />

      {/* Hero Welcome Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Autonomous Technical, Fundamental & AI Synthesis for Indian Equities
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          MarketMind{" "}
          <span className="inline-block text-indigo-600 font-black bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-2xl align-middle text-2xl sm:text-4xl shadow-xs">
            India
          </span>
        </h1>
        <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          Sign in or create an account to unlock real-time NSE market telemetry, Claude 3.5 Sonnet quantitative analytics, price limit alerts, and IPO tracking.
        </p>
      </div>

      {/* Authentication Card */}
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl relative">
        {/* Toggle Mode Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "signin"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "signup"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Card Title & Icon */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
            {mode === "signin" ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === "signin" ? "Sign In to MarketMind" : "Create MarketMind Account"}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] text-slate-500 font-medium">
                {mode === "signin"
                  ? "Access via Email, Username, or Phone Number"
                  : "Instant Account Registration"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          {mode === "signin"
            ? "Enter your registered Email, Username, or Phone number, along with your password to continue."
            : "Complete the fields below to create your account. You will be signed in immediately."}
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

        {/* ================= MODE 1: SIGN IN FORM ================= */}
        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email, Username, or Phone Number
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. investor@gmail.com, trader99, or 9876543210"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{loading ? "Signing in..." : "Sign In to Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                >
                  Create Free Account
                </button>
              </span>
            </div>
          </form>
        ) : (
          /* ================= MODE 2: SIGN UP FORM ================= */
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
                  placeholder="e.g. sreekar21"
                  className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="investor@example.com"
                  className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  placeholder="e.g. 9876543210 or +91 9876543210"
                  className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Creating Account..." : "Create Free Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                >
                  Sign In
                </button>
              </span>
            </div>
          </form>
        )}
      </div>

      {/* Feature Showcase Grid below the card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-1.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live NSE Market Telemetry</h4>
          <p className="text-xs text-slate-500">Real-time Nifty 50 constituents, top gainers, and top losers refreshed continuously.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-1.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 border border-indigo-100">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Claude 3.5 AI Analyst</h4>
          <p className="text-xs text-slate-500">Zero-hallucination mathematical indicators coupled with institutional qualitative trade thesis.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-1.5 shadow-xs">
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
