"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";
import { 
  TrendingUp, 
  BarChart2, 
  Cpu, 
  Bookmark, 
  Search, 
  Menu, 
  X, 
  ShieldCheck,
  User,
  LogOut,
  Rocket,
  Bell
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [navSearch, setNavSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/analyze/${navSearch.trim().toUpperCase()}`);
      setNavSearch("");
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Overview", icon: TrendingUp },
    { href: "/analyze/RELIANCE", label: "Stock Analyzer", icon: BarChart2 },
    { href: "/alerts", label: "Price Alerts", icon: Bell },
    { href: "/watchlist", label: "Watchlist", icon: Bookmark },
    { href: "/ipo", label: "IPOs", icon: Rocket, badge: "LIVE" },
    { href: "/backtest", label: "Backtester", icon: Cpu },
  ];

  return (
    <>
      <header className="border-b border-surface-border bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary-500 to-emerald-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                    MarketMind <span className="text-indigo-600 font-extrabold text-sm px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200">India</span>
                  </span>
                </div>
              </Link>

              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full ml-2">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> NSE / BSE
              </span>
            </div>

            {/* Nav Links Desktop */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = 
                  link.href === "/" 
                    ? pathname === "/" 
                    : pathname.startsWith(link.href.split("/")[1]);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Search & Supabase Auth Actions */}
            <div className="hidden sm:flex items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search (e.g. TCS)..."
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  className="w-36 lg:w-48 pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors uppercase"
                />
              </form>

              {/* Supabase User / Sign In Button */}
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-card border border-surface-border text-xs text-gray-300">
                    <User className="w-3.5 h-3.5 text-primary-400" />
                    <span className="max-w-[100px] truncate">{user.email?.split("@")[0]}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-surface transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/40 text-primary-300 text-xs font-semibold transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              {!user && (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary-600/20 border border-primary-500/30 text-primary-300"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-400 hover:text-white rounded-lg focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-surface-border bg-surface px-4 pt-3 pb-5 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search symbol (e.g. INFY)..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 uppercase"
              />
            </form>
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:bg-surface-card hover:text-white"
                  >
                    <Icon className="w-5 h-5 text-primary-400" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
            {user && (
              <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                <span className="text-xs text-gray-400 truncate">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-rose-400 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
