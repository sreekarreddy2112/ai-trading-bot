"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUser, onAuthChange, AuthUser } from "@/lib/supabase";
import LoginGateway from "@/components/LoginGateway";
import { RefreshCw } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 1. Initial session check
    getCurrentUser().then((u) => {
      setUser(u);
      setChecking(false);
    });

    // 2. Real-time auth listener (sign-in, sign-out, session refresh)
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Loading state while checking session
  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  // Gated Access: User is strictly prohibited from viewing or interacting with any page until verified
  if (!user) {
    return (
      <div className="py-4">
        <LoginGateway
          onSuccess={(authenticatedUser) => {
            setUser(authenticatedUser);
          }}
        />
      </div>
    );
  }

  // Access Granted: Render the requested page
  return <>{children}</>;
}

