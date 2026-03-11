import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "athlete" | "pro" | "club" | "admin";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "credentials" | "banned" };

const LOGIN_DATE_KEY = "cffc_admin_login_date";

/** Returns true if the current user is banned (reads banned_until from auth.users via RPC). */
export async function isCurrentUserBanned(): Promise<boolean> {
  const { data, error } = await supabase.rpc("get_my_banned_until");
  if (error || data == null) return false;
  return new Date(data) > new Date();
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  setUser: (partial: Partial<Pick<User, "name" | "role">>) => void;
  setLoading: (loading: boolean) => void;
  initSession: () => Promise<void>;
}

function userFromSession(session: Session | null): User | null {
  const u = session?.user;
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? "",
    name: null,
    role: "athlete",
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  login: async (email: string, password: string): Promise<LoginResult> => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    set({ isLoading: false });
    if (error) return { ok: false, reason: "credentials" };
    if (await isCurrentUserBanned()) {
      await supabase.auth.signOut();
      try {
        localStorage.removeItem(LOGIN_DATE_KEY);
      } catch {
        /* ignore */
      }
      set({ user: null });
      return { ok: false, reason: "banned" };
    }
    const today = new Date().toDateString();
    try {
      localStorage.setItem(LOGIN_DATE_KEY, today);
    } catch {
      /* ignore */
    }
    set({ user: userFromSession(data.session) });
    return { ok: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem(LOGIN_DATE_KEY);
    } catch {
      /* ignore */
    }
    set({ user: null });
  },

  setUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  initSession: async () => {
    set({ isInitialized: false });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const today = new Date().toDateString();
    const savedLoginDate = (typeof localStorage !== "undefined" && localStorage.getItem(LOGIN_DATE_KEY)) || null;
    if (session && savedLoginDate && savedLoginDate !== today) {
      await supabase.auth.signOut();
      if (typeof localStorage !== "undefined") localStorage.removeItem(LOGIN_DATE_KEY);
      set({ user: null, isInitialized: true });
    } else if (session && (await isCurrentUserBanned())) {
      await supabase.auth.signOut();
      if (typeof localStorage !== "undefined") localStorage.removeItem(LOGIN_DATE_KEY);
      set({ user: null, isInitialized: true });
    } else {
      if (session && typeof localStorage !== "undefined" && !savedLoginDate) {
        localStorage.setItem(LOGIN_DATE_KEY, today);
      }
      set({ user: userFromSession(session), isInitialized: true });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: userFromSession(session) });
    });
  },
}));
