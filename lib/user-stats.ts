import { LABS } from "./labs";
import type { ProgressKind, ToolProgress } from "@/store/progress-store";

/**
 * Every number here is derived from real, observed activity in
 * progress-store — nothing is seeded or hardcoded. This used to live as
 * static fields (level, xp, dayStreak, ...) on the mock user object,
 * which meant a brand-new sign-in showed "34 labs completed" and a "12
 * day streak" despite the person never having done anything. Computing
 * these live from real data means a new account genuinely starts at
 * zero and only moves when a checkpoint is actually completed, a lab is
 * actually finished, or a real day of activity is recorded.
 *
 * XP/level are a transparent, fixed formula over real actions (50 XP per
 * completed checkpoint, 500 XP per level) — not a fabricated number, just
 * a deterministic function of something real. It's fine that this reads
 * as "gamified"; what matters is it's never disconnected from what you
 * actually did.
 */

export interface UserStats {
  completedCheckpoints: number;
  totalCheckpoints: number;
  labsCompleted: number;
  challengesSolved: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  dayStreak: number;
}

const XP_PER_CHECKPOINT = 50;
const XP_PER_LEVEL = 500;

export function computeUserStats(progress: Record<string, ToolProgress>, activeDates: string[]): UserStats {
  let completedCheckpoints = 0;
  let totalCheckpoints = 0;
  let labsCompleted = 0;

  for (const lab of LABS) {
    const done = progress[`lab:${lab.id}`]?.completedTaskIds.length ?? 0;
    completedCheckpoints += done;
    totalCheckpoints += lab.checkpoints.length;
    if (done >= lab.checkpoints.length) labsCompleted += 1;
  }

  const xp = completedCheckpoints * XP_PER_CHECKPOINT;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpToNextLevel = level * XP_PER_LEVEL;

  return {
    completedCheckpoints,
    totalCheckpoints,
    labsCompleted,
    // "Challenges" (see app/challenges/page.tsx) is every checkpoint
    // across every Lab surfaced in one place, not a separate graded
    // system — so "solved" is the same real completed-checkpoint count.
    challengesSolved: completedCheckpoints,
    xp,
    level,
    xpToNextLevel,
    dayStreak: computeDayStreak(activeDates),
  };
}

/** Counts consecutive calendar days of real activity ending today — or
 * ending yesterday if nothing's been done yet today, since today isn't
 * over. Anything older than a one-day gap breaks the streak. */
export function computeDayStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;

  const active = new Set(activeDates);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!active.has(toDateKey(cursor))) {
    // Nothing today yet — see if the streak is still alive as of yesterday.
    cursor.setDate(cursor.getDate() - 1);
    if (!active.has(toDateKey(cursor))) return 0;
  }

  let streak = 0;
  while (active.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Re-exported so callers don't need a second import just for the type.
export type { ProgressKind };
