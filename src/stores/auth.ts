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

/** Evita que onAuthStateChange defina user antes do login validar role admin. */
let authListenerPaused = false;

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

async function fetchProfileRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from("profile")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data?.role) return null;
  return data.role as UserRole;
}

async function clearAuthSession(set: (partial: Partial<AuthState>) => void): Promise<void> {
  await supabase.auth.signOut();
  try {
    localStorage.removeItem(LOGIN_DATE_KEY);
  } catch {
    /* ignore */
  }
  set({ user: null });
}

function adminUserFromSession(session: Session): User {
  return { ...userFromSession(session)!, role: "admin" };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  login: async (email: string, password: string): Promise<LoginResult> => {
    authListenerPaused = true;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, reason: "credentials" };
      if (await isCurrentUserBanned()) {
        await clearAuthSession(set);
        return { ok: false, reason: "banned" };
      }
      const userId = data.session?.user?.id;
      if (!userId || (await fetchProfileRole(userId)) !== "admin") {
        await clearAuthSession(set);
        return { ok: false, reason: "credentials" };
      }
      const today = new Date().toDateString();
      try {
        localStorage.setItem(LOGIN_DATE_KEY, today);
      } catch {
        /* ignore */
      }
      set({ user: adminUserFromSession(data.session!) });
      return { ok: true };
    } finally {
      authListenerPaused = false;
      set({ isLoading: false });
    }
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
    } else if (session) {
      const userId = session.user.id;
      const role = await fetchProfileRole(userId);
      if (role !== "admin") {
        await supabase.auth.signOut();
        if (typeof localStorage !== "undefined") localStorage.removeItem(LOGIN_DATE_KEY);
        set({ user: null, isInitialized: true });
      } else {
        if (typeof localStorage !== "undefined" && !savedLoginDate) {
          localStorage.setItem(LOGIN_DATE_KEY, today);
        }
        set({ user: adminUserFromSession(session), isInitialized: true });
      }
    } else {
      set({ user: null, isInitialized: true });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (authListenerPaused) return;
      if (!session) {
        set({ user: null });
        return;
      }
      const role = await fetchProfileRole(session.user.id);
      if (role !== "admin") {
        await supabase.auth.signOut();
        try {
          localStorage.removeItem(LOGIN_DATE_KEY);
        } catch {
          /* ignore */
        }
        set({ user: null });
        return;
      }
      set({ user: adminUserFromSession(session) });
    });
  },
}));
