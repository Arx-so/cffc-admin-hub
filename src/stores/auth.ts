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

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    set({ isLoading: false });
    if (error) return false;
    set({ user: userFromSession(data.session) });
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  setUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  initSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ user: userFromSession(session) });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: userFromSession(session) });
    });
  },
}));
