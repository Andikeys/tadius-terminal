"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Trophy, Flame, Zap } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { useUserStore } from "@/store/user-store";
import { useUserStats } from "@/hooks/use-user-stats";

const STAT_META = [
  { key: "labsCompleted", label: "Labs Completed", icon: FlaskConical, description: "Keep building" },
  { key: "challengesSolved", label: "Challenges Solved", icon: Trophy, description: "Keep going" },
  { key: "dayStreak", label: "Day Streak", icon: Flame, description: "Start your streak" },
  { key: "xp", label: "Total XP", icon: Zap, description: "Earn XP" },
] as const;

export function StatsGrid() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);
  const stats = useUserStats();

  // Same hydration-safety pattern used by ProgressOverview/BookmarksOverview
  // — stats read from a persisted store, so wait one frame past mount
  // before trusting them to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (isLoading || !mounted) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel h-[104px] animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  // Guest visitors see the same layout with zero-state values rather than
  // a different component — the numbers becoming real the moment they
  // start completing checkpoints is the whole point of the CTA in the
  // sidebar / top nav. Every value is computed from real activity (see
  // lib/user-stats.ts) — nothing here is seeded or fabricated.
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_META.map((meta, i) => (
        <StatCard
          key={meta.key}
          index={i}
          label={meta.label}
          icon={meta.icon}
          description={meta.description}
          value={isAuthenticated ? stats[meta.key] : 0}
        />
      ))}
    </div>
  );
}
