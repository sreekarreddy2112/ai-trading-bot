import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes("placeholder") &&
  !rawKey.includes("placeholder")
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : "https://placeholder.supabase.co";
const supabaseAnonKey = isSupabaseConfigured ? rawKey : "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  provider: "supabase" | "local";
}

const LOCAL_STORAGE_KEY = "marketmind_user_session";
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
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
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
        name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
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
        name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
        provider: "supabase",
      };
      notifyListeners(u);
      return u;
    }
  }

  return signIn(cleanEmail, password);
}

export async function signInDemo(demoEmail: string = "investor@marketmind.in"): Promise<AuthUser> {
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
            name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
            provider: "supabase",
          });
        } else {
          // If Supabase signed out, check if local user exists
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
  const user = await getCurrentUser();
  if (user) {
    const token = createLocalToken(user.id, user.email);
    return { Authorization: `Bearer ${token}` };
  }

  return {};
}
