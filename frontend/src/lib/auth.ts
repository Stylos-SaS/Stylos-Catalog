import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AUTH_STORAGE_KEY, type AdminUser } from "./auth-storage";

type AuthState = {
  token: string | null;
  user: AdminUser | null;
  setSession: (token: string, user: AdminUser) => void;
  clearSession: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    { name: AUTH_STORAGE_KEY },
  ),
);

export function useIsAuthenticated(): boolean {
  return useAuth((s) => Boolean(s.token));
}
