"use client";

import { useProgressStore } from "@/store/progress-store";
import { computeUserStats, type UserStats } from "@/lib/user-stats";

/** Live, derived stats — level/XP/streak/labs-completed/challenges-solved
 * are all computed here from real progress-store data on every render
 * where that data changes, never stored as static fields on the user
 * object. See lib/user-stats.ts for the actual formulas. */
export function useUserStats(): UserStats {
  const progress = useProgressStore((s) => s.progress);
  const activeDates = useProgressStore((s) => s.activeDates);
  return computeUserStats(progress, activeDates);
}
