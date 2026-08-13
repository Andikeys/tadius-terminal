import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Real, locally-persisted preferences — no backend account-settings API
 * exists yet, so these are honestly scoped to what a client-only store can
 * actually do: control what the app itself shows, nothing sent anywhere. */

interface SettingsState {
  sessionReminders: boolean;
  productUpdates: boolean;
  setSessionReminders: (value: boolean) => void;
  setProductUpdates: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sessionReminders: true,
      productUpdates: false,
      setSessionReminders: (value) => set({ sessionReminders: value }),
      setProductUpdates: (value) => set({ productUpdates: value }),
    }),
    { name: "tadius:settings" }
  )
);
