import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Real, locally-persisted progress data — no fabricated numbers. Tracks
 * exactly what the app can actually observe: how many times a Playground
 * or Lab has been launched, how long sessions ran, which checkpoints a
 * learner has self-reported as done, and which calendar days had any
 * activity at all (backs the real day-streak calculation in
 * lib/user-stats.ts — see that file for why streak/XP/level live there
 * instead of as static fields on the user object).
 *
 * Deliberately NOT tracked yet: per-command success/failure inside a real
 * shell. That needs shell-side instrumentation (e.g. reporting exit codes
 * back over the WebSocket) that doesn't exist yet — see server/README.md.
 * Faking that number would be worse than not showing it.
 */

export type ProgressKind = "playground" | "lab";

export interface ToolProgress {
  toolId: string;
  kind: ProgressKind;
  launchCount: number;
  totalTimeSpentMs: number;
  lastLaunchedAt: number | null;
  completedTaskIds: string[];
}

interface ProgressState {
  progress: Record<string, ToolProgress>;
  /** Calendar days (YYYY-MM-DD, local time) with at least one real launch
   * or checkpoint completion — the raw data behind the day-streak stat. */
  activeDates: string[];
  recordLaunch: (kind: ProgressKind, toolId: string) => void;
  recordSessionEnd: (kind: ProgressKind, toolId: string, durationMs: number) => void;
  toggleCheckpoint: (kind: ProgressKind, toolId: string, checkpointId: string) => void;
  getProgress: (kind: ProgressKind, toolId: string) => ToolProgress;
  resetAll: () => void;
}

function progressKey(kind: ProgressKind, toolId: string) {
  return `${kind}:${toolId}`;
}

// Shared, never-mutated reference for the "no progress recorded" case.
// getProgress() has to return a brand-new ToolProgress object whenever
// nothing is stored yet, but every consumer only reads specific fields off
// it inside a zustand selector — if completedTaskIds were a fresh `[]`
// literal on every call, that field's identity would change on every
// render even though nothing actually changed, and React's
// useSyncExternalStore treats a changing snapshot as "the store changed,
// re-render" forever, erroring with "The result of getSnapshot should be
// cached to avoid an infinite loop." Reusing this constant keeps the
// reference stable across calls so that failure mode can't happen.
const EMPTY_TASK_IDS: string[] = [];

function emptyProgress(kind: ProgressKind, toolId: string): ToolProgress {
  return {
    toolId,
    kind,
    launchCount: 0,
    totalTimeSpentMs: 0,
    lastLaunchedAt: null,
    completedTaskIds: EMPTY_TASK_IDS,
  };
}

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function withTodayRecorded(activeDates: string[]): string[] {
  const today = todayKey();
  return activeDates.includes(today) ? activeDates : [...activeDates, today];
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      activeDates: [],

      recordLaunch: (kind, toolId) =>
        set((state) => {
          const k = progressKey(kind, toolId);
          const existing = state.progress[k] ?? emptyProgress(kind, toolId);
          return {
            progress: {
              ...state.progress,
              [k]: { ...existing, launchCount: existing.launchCount + 1, lastLaunchedAt: Date.now() },
            },
            activeDates: withTodayRecorded(state.activeDates),
          };
        }),

      recordSessionEnd: (kind, toolId, durationMs) =>
        set((state) => {
          const k = progressKey(kind, toolId);
          const existing = state.progress[k] ?? emptyProgress(kind, toolId);
          return {
            progress: {
              ...state.progress,
              [k]: {
                ...existing,
                totalTimeSpentMs: existing.totalTimeSpentMs + Math.max(0, durationMs),
              },
            },
          };
        }),

      toggleCheckpoint: (kind, toolId, checkpointId) =>
        set((state) => {
          const k = progressKey(kind, toolId);
          const existing = state.progress[k] ?? emptyProgress(kind, toolId);
          const alreadyDone = existing.completedTaskIds.includes(checkpointId);
          const completedTaskIds = alreadyDone
            ? existing.completedTaskIds.filter((id) => id !== checkpointId)
            : [...existing.completedTaskIds, checkpointId];
          return {
            progress: { ...state.progress, [k]: { ...existing, completedTaskIds } },
            // Only mark today active when actually completing a checkpoint,
            // not when un-checking one — unchecking isn't "activity".
            activeDates: alreadyDone ? state.activeDates : withTodayRecorded(state.activeDates),
          };
        }),

      getProgress: (kind, toolId) => get().progress[progressKey(kind, toolId)] ?? emptyProgress(kind, toolId),

      resetAll: () => set({ progress: {}, activeDates: [] }),
    }),
    { name: "tadius:progress" }
  )
);
