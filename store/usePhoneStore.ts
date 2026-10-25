"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---- Types -----------------------------------------------------------

export type ScreenState = "lock" | "home" | "app";

export interface AppWindowState {
  appId: string | null; // which app is currently open (null = none)
}

interface PhoneState {
  // Core navigation
  screen: ScreenState;
  openAppId: string | null;
  homePage: number; // which homescreen page is active (0-indexed)

  // "Is this the reader's first visit" — drives story start timestamp
  storyStartedAt: number | null;

  // Notification badges, keyed by app id
  unreadCounts: Record<string, number>;

  // Actions
  unlock: () => void;
  lock: () => void;
  openApp: (appId: string) => void;
  closeApp: () => void;
  setHomePage: (page: number) => void;
  startStoryClockIfNeeded: () => void;
  setUnread: (appId: string, count: number) => void;
  clearUnread: (appId: string) => void;
}

export const usePhoneStore = create<PhoneState>()(
  persist(
    (set, get) => ({
      screen: "lock",
      openAppId: null,
      homePage: 0,
      storyStartedAt: null,
      unreadCounts: {},

      unlock: () => {
        get().startStoryClockIfNeeded();
        set({ screen: "home" });
      },

      lock: () => set({ screen: "lock", openAppId: null }),

      openApp: (appId: string) => {
        get().clearUnread(appId);
        set({ screen: "app", openAppId: appId });
      },

      closeApp: () => set({ screen: "home", openAppId: null }),

      setHomePage: (page: number) => set({ homePage: page }),

      // Called once, on first unlock. Every time-delayed narrative event
      // (e.g. "this text arrives 10 minutes into reading") is computed
      // as an offset from this timestamp — see lib/storyClock.ts
      startStoryClockIfNeeded: () => {
        if (get().storyStartedAt === null) {
          set({ storyStartedAt: Date.now() });
        }
      },

      setUnread: (appId, count) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [appId]: count },
        })),

      clearUnread: (appId) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [appId]: 0 },
        })),
    }),
    {
      name: "au-phone-sim-state", // localStorage key
    }
  )
);
