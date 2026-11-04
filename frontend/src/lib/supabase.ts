import { createClient } from "@supabase/supabase-js";
import { api } from "./api";

const FALLBACK_SUPABASE_URL = "https://unkrcdpscnzwlwpridjt.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "sb_publishable_wieVUbLjOy02kgQwxSEMsw_Lg9toMIr";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes("placeholder") &&
  !rawKey.includes("placeholder")
);

const supabaseUrl = rawUrl;
const supabaseAnonKey = rawKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  name?: string;
  provider: "backend" | "supabase" | "local";
}

const LOCAL_STORAGE_KEY = "marketmind_user_session";
const LOCAL_TOKEN_KEY = "marketmind_auth_token";
const listeners = new Set<(user: AuthUser | null) => void>();

function notifyListeners(user: AuthUser | null) {
  listeners.forEach((cb) => {
    try {
      cb(user);
    } catch {
      // ignore
    }
  });
}

export async function signUpUser(req: {
  email: string;
  username: string;
  phone: string;
  password: string;
}): Promise<AuthUser> {
  const res = await api.registerUser(req);
  const user: AuthUser = {
    id: res.user.id,
    email: res.user.email,
    username: res.user.username,
    phone: res.user.phone,
    name: res.user.name || res.user.username,
    provider: "backend",
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    if (res.token) {
      localStorage.setItem(LOCAL_TOKEN_KEY, res.token);
    }
  }

  notifyListeners(user);
  return user;
}

export async function signInUser(req: {
  identifier: string;
  password: string;
}): Promise<AuthUser> {
  const res = await api.loginUser(req);
  const user: AuthUser = {
    id: res.user.id,
    email: res.user.email,
    username: res.user.username,
    phone: res.user.phone,
    name: res.user.name || res.user.username,
    provider: "backend",
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    if (res.token) {
      localStorage.setItem(LOCAL_TOKEN_KEY, res.token);
    }
  }

  notifyListeners(user);
  return user;
}

function createLocalToken(id: string, email: string): string {
  try {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: id,
        email: email,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      })
    );
    return `${header}.${payload}.local_mock_signature`;
  } catch {
    return `local_${id}`;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  // 1. Check Supabase session first if configured
  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || "user@marketmind.in",
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0].toUpperCase(),
          provider: "supabase",
        };
      }
    } catch {
      // fallback to local
    }
  }

  // 2. Check local storage session
  if (typeof window !== "undefined") {
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        return JSON.parse(localData);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function requestEmailOTP(email: string): Promise<{ message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  let supabaseErrMsg: string | null = null;

  // 1. Deliver directly to user inbox via Supabase Auth Email OTP
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });
      if (!error) {
        return { message: `Verification code sent directly to ${cleanEmail}. Please check your inbox.` };
      }
      supabaseErrMsg = error.message;
      console.warn("Supabase OTP notice:", error.message);
    } catch (err: any) {
      supabaseErrMsg = err.message;
      console.warn("Supabase OTP failed, attempting backend delivery:", err.message);
    }
  }

  // 2. Call backend OTP endpoint (delivers directly via SMTP/Resend)
  try {
    const res = await api.sendOTP(cleanEmail);
    return {
      message: res.message,
    };
  } catch (backendErr: any) {
    if (supabaseErrMsg && supabaseErrMsg.toLowerCase().includes("rate limit")) {
      throw new Error(
        "Supabase hourly email rate limit reached (free tier limit: 3-4 emails/hr). Please wait a few minutes, or configure Gmail/Resend SMTP in backend."
      );
    }
    throw new Error(
      backendErr.message || supabaseErrMsg || "Failed to deliver verification code. Please check your email address."
    );
  }
}

export async function verifyEmailOTP(email: string, otp: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  // 1. Try Supabase verifyOtp first
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "email",
      });
      if (error) {
        throw new Error(error.message);
      }
      if (data.user) {
        const u: AuthUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0].toUpperCase(),
          provider: "supabase",
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(u));
        }
        notifyListeners(u);
        return u;
      }
    } catch (err: any) {
      console.warn("Supabase verifyOtp error:", err.message);
      // If user requested via backend OTP instead, try backend
      try {
        const res = await api.verifyOTP(cleanEmail, cleanOtp);
        const user: AuthUser = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          provider: "local",
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
          if (res.token) {
            localStorage.setItem(LOCAL_TOKEN_KEY, res.token);
          }
        }
        notifyListeners(user);
        return user;
      } catch {
        throw new Error(err.message || "Invalid or expired verification code. Please check your email inbox.");
      }
    }
  }

  // 2. Call backend verify-otp endpoint directly
  const res = await api.verifyOTP(cleanEmail, cleanOtp);
  const user: AuthUser = {
    id: res.user.id,
    email: res.user.email,
    name: res.user.name,
    provider: "local",
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    if (res.token) {
      localStorage.setItem(LOCAL_TOKEN_KEY, res.token);
    }
  }

  notifyListeners(user);
  return user;
}

export async function signIn(email: string, password?: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw error;
    if (data.user) {
      const u: AuthUser = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0].toUpperCase(),
        provider: "supabase",
      };
      notifyListeners(u);
      return u;
    }
  }

  // Local authentication mode
  const id = `usr_${cleanEmail.replace(/[^a-z0-9]/g, "")}_${cleanEmail.length}`;
  const user: AuthUser = {
    id,
    email: cleanEmail,
    name: cleanEmail.split("@")[0].toUpperCase(),
    provider: "local",
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
  }

  notifyListeners(user);
  return user;
}

export async function signUp(email: string, password?: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && password) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });
    if (error) throw error;
    if (data.user) {
      const u: AuthUser = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0].toUpperCase(),
        provider: "supabase",
      };
      notifyListeners(u);
      return u;
    }
  }

  return signIn(cleanEmail, password);
}

export async function signInDemo(demoEmail: string = "demo.investor@marketmind.in"): Promise<AuthUser> {
  return signIn(demoEmail);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_TOKEN_KEY);
  }

  notifyListeners(null);
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  listeners.add(callback);

  // Also sync with Supabase auth listener if configured
  let supabaseUnsub: (() => void) | null = null;
  if (isSupabaseConfigured) {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          callback({
            id: session.user.id,
            email: session.user.email || "user@marketmind.in",
            name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0].toUpperCase(),
            provider: "supabase",
          });
        } else {
          const localUser = await getCurrentUser();
          callback(localUser);
        }
      });
      supabaseUnsub = () => subscription.unsubscribe();
    } catch {
      // ignore
    }
  }

  return () => {
    listeners.delete(callback);
    if (supabaseUnsub) supabaseUnsub();
  };
}

export async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return { Authorization: `Bearer ${session.access_token}` };
      }
    }
  } catch {
    // fallback
  }

  // Fallback to local session token
  if (typeof window !== "undefined") {
    const savedToken = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (savedToken) {
      return { Authorization: `Bearer ${savedToken}` };
    }
  }

  const user = await getCurrentUser();
  if (user) {
    const token = createLocalToken(user.id, user.email);
    return { Authorization: `Bearer ${token}` };
  }

  return {};
}
