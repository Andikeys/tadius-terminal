import { create } from "zustand";

export type AuthMode = "sign-in" | "sign-up";

interface AuthModalState {
  isOpen: boolean;
  mode: AuthMode;
  open: (mode?: AuthMode) => void;
  close: () => void;
  setMode: (mode: AuthMode) => void;
}

/**
 * Every "Sign In" / "Register" trigger across the product (top nav,
 * sidebar guest card, dashboard terminal, launch modal, settings) opens
 * the SAME modal instance mounted once in AppShell, instead of each
 * trigger owning its own dialog state. Keeps the auth UI consistent and
 * means adding a new entry point later is a one-line `open()` call.
 */
export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "sign-in",
  open: (mode = "sign-in") => set({ isOpen: true, mode }),
  close: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),
}));
