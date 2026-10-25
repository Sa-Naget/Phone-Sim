"use client";

import { useEffect, useState } from "react";
import { usePhoneStore } from "@/store/usePhoneStore";

/**
 * Returns how many milliseconds have elapsed since the reader unlocked
 * the phone for the first time. Ticks every second so components can
 * reactively reveal content.
 *
 * Usage in an app (e.g. iMessage thread):
 *   const elapsedMs = useStoryElapsedMs();
 *   const visibleMessages = messages.filter(m => m.revealAtMs <= elapsedMs);
 */
export function useStoryElapsedMs(): number {
  const storyStartedAt = usePhoneStore((s) => s.storyStartedAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (storyStartedAt === null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [storyStartedAt]);

  if (storyStartedAt === null) return 0;
  return Math.max(0, now - storyStartedAt);
}

/**
 * Convenience: schedule a message at N seconds/minutes after unlock.
 * Use these when authoring chat data instead of raw milliseconds.
 */
export const afterSeconds = (s: number) => s * 1000;
export const afterMinutes = (m: number) => m * 60 * 1000;
export const afterHours = (h: number) => h * 60 * 60 * 1000;
