"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---- Types -----------------------------------------------------------

export type ScreenState = "lock" | "home" | "app";

interface PhoneState {
  // Core navigation — NOT persisted, always starts fresh on page load
  screen: ScreenState;
  openAppId: string | null;
  homePage: number; // which homescreen page is active (0-indexed)

  // "Is this the reader's first visit" — drives story start timestamp.
  // This IS persisted so refreshing mid-story doesn't reset scheduled
  // message reveal timing.
  storyStartedAt: number | null;

  // Notification badges, keyed by app id — persisted so unread state survives a refresh.
  unreadCounts: Record<string, number>;

  // Actions
  unlock: () => void;
  lockPhone: () => void;
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

      // Locks the phone: sends the UI back to the lockscreen and closes
      // whatever app was open. Because LockScreen's passcode-entry state
      // lives locally in that component (not here), it unmounts/remounts
      // fresh every time we come back to "lock" — so passcode progress
      // is automatically cleared with no extra state to manage.
      lockPhone: () => set({ screen: "lock", openAppId: null }),

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
      // Only persist narrative/story state. screen, openAppId and homePage
      // are deliberately excluded so every fresh page load (refresh, new
      // tab, etc.) lands back on the lockscreen instead of resuming on
      // the homescreen — matching how a real phone behaves when its
      // screen times out.
      partialize: (state) => ({
        storyStartedAt: state.storyStartedAt,
        unreadCounts: state.unreadCounts,
      }),
    }
  )
);
