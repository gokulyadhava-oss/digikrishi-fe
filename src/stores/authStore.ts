import { create } from "zustand";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  tenantId: string | null;
  /** JWT sent in Authorization header when set; avoids cookie not sent (e.g. cross-origin in dev) */
  token: string | null;
  setAuth: (user: User | null, token?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  tenantId: null,
  token: null,
  setAuth: (user, token) =>
    set((prev) => ({
      user,
      role: user?.role ?? null,
      tenantId: user?.tenant_id ?? null,
      token: token !== undefined ? token : user ? prev.token : null,
    })),
  logout: () =>
    set({
      user: null,
      role: null,
      tenantId: null,
      token: null,
    }),
}));
