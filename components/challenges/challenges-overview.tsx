"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckSquare, Square, Trophy } from "lucide-react";

import { LABS } from "@/lib/labs";
import { useProgressStore } from "@/store/progress-store";
import { cn } from "@/lib/utils";

/**
 * "Challenges" isn't a separate graded system — there's no engine yet that
 * can verify free-form shell output, and faking a pass/fail grade would be
 * worse than not having one (see progress-store.ts). What's real is each
 * Lab's checkpoint checklist, so this page surfaces every checkpoint
 * across every Lab in one place — genuine data, just a different view of
 * it, with an honest note about what's automated today and what isn't.
 */
export function ChallengesOverview() {
  const progressMap = useProgressStore((s) => s.progress);
  const getProgress = useProgressStore((s) => s.getProgress);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const totalCheckpoints = LABS.reduce((sum, lab) => sum + lab.checkpoints.length, 0);
  const completedCheckpoints = mounted
    ? LABS.reduce((sum, lab) => sum + getProgress("lab", lab.id).completedTaskIds.length, 0)
    : 0;

  return (
    <div className="space-y-8">
      <div className="glass-panel flex items-center gap-4 rounded-xl p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tadius-green-500/10 ring-1 ring-tadius-green-500/30">
          <Trophy className="h-5 w-5 text-tadius-green-500" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm text-white">
            {mounted ? completedCheckpoints : "–"} / {totalCheckpoints} checkpoints cleared
          </p>
          <p className="font-body text-xs text-tadius-gray-muted">
            Self-reported today — a real terminal, honest tracking, no auto-grading yet.
          </p>
        </div>
      </div>

      {LABS.map((lab) => {
        const Icon = lab.icon;
        const completedTaskIds = mounted ? getProgress("lab", lab.id).completedTaskIds : [];

        return (
          <section key={lab.id} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-white/10"
                style={{ backgroundColor: lab.color }}
              >
                <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
              </div>
              <h2 className="font-heading text-sm font-semibold text-white">{lab.name}</h2>
              <Link
                href={`/labs/${lab.id}`}
                className="ml-auto font-mono text-[11px] text-tadius-green-500 hover:underline"
              >
                Open lab →
              </Link>
            </div>

            <div className="glass-panel divide-y divide-white/[0.06] overflow-hidden rounded-xl">
              {lab.checkpoints.map((checkpoint) => {
                const done = completedTaskIds.includes(checkpoint.id);
                return (
                  <div key={checkpoint.id} className="flex items-center gap-2.5 px-4 py-3">
                    {done ? (
                      <CheckSquare className="h-4 w-4 shrink-0 text-tadius-green-500" strokeWidth={2} />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-tadius-gray-muted" strokeWidth={2} />
                    )}
                    <span
                      className={cn(
                        "font-body text-sm",
                        done ? "text-tadius-gray-muted line-through" : "text-white"
                      )}
                    >
                      {checkpoint.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
