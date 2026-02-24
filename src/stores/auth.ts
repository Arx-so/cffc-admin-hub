import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  login: async (email: string, _password: string): Promise<boolean> => {
    set({ isLoading: true });
    // Mock login - accepts any email/password
    await new Promise((r) => setTimeout(r, 800));
    set({ user: { id: "1", email, name: "Admin" }, isLoading: false });
    return true;
  },
  logout: () => set({ user: null }),
}));
