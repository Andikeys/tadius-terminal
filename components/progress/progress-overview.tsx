"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Clock, Rocket } from "lucide-react";

import { DEVOPS_TOOLS } from "@/lib/devops-tools";
import { LABS } from "@/lib/labs";
import { useProgressStore } from "@/store/progress-store";
import { cn } from "@/lib/utils";

function formatDuration(ms: number): string {
  if (ms <= 0) return "0 min";
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

function formatLastLaunched(timestamp: number | null): string {
  if (!timestamp) return "Never";
  const diffMs = Date.now() - timestamp;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/**
 * Reads directly from useProgressStore — every number here is something
 * the app actually recorded (a real connectToLab resolving, a real
 * session-close timestamp, a real checkbox toggle), not a placeholder.
 * Rows with zero launches still show — that's the honest starting state,
 * not an error.
 */
export function ProgressOverview() {
  const getProgress = useProgressStore((s) => s.getProgress);
  const progressMap = useProgressStore((s) => s.progress);
  const [mounted, setMounted] = useState(false);

  // Zustand's persist middleware hydrates from localStorage after mount;
  // rendering real numbers before that would either show stale zeros or
  // risk a hydration mismatch. One extra frame of skeleton is cheap.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel h-16 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-tadius-gray-muted">
          Playgrounds
        </h2>
        <div className="glass-panel divide-y divide-white/[0.06] overflow-hidden rounded-xl">
          {DEVOPS_TOOLS.map((tool) => {
            const p = getProgress("playground", tool.id);
            return (
              <ProgressRow
                key={tool.id}
                name={tool.playgroundName}
                color={tool.color}
                launchCount={p.launchCount}
                timeSpentMs={p.totalTimeSpentMs}
                lastLaunchedAt={p.lastLaunchedAt}
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-tadius-gray-muted">
          Labs
        </h2>
        <div className="glass-panel divide-y divide-white/[0.06] overflow-hidden rounded-xl">
          {LABS.map((lab) => {
            const p = getProgress("lab", lab.id);
            const percent = Math.round((p.completedTaskIds.length / lab.checkpoints.length) * 100);
            return (
              <ProgressRow
                key={lab.id}
                name={lab.name}
                color={lab.color}
                launchCount={p.launchCount}
                timeSpentMs={p.totalTimeSpentMs}
                lastLaunchedAt={p.lastLaunchedAt}
                checkpointLabel={`${p.completedTaskIds.length}/${lab.checkpoints.length} checkpoints (${percent}%)`}
              />
            );
          })}
        </div>
      </section>

      {Object.keys(progressMap).length === 0 && (
        <p className="text-center font-body text-sm text-tadius-gray-muted">
          No sessions yet — launch a Playground or start a Lab to see your progress here.
        </p>
      )}
    </div>
  );
}

function ProgressRow({
  name,
  color,
  launchCount,
  timeSpentMs,
  lastLaunchedAt,
  checkpointLabel,
}: {
  name: string;
  color: string;
  launchCount: number;
  timeSpentMs: number;
  lastLaunchedAt: number | null;
  checkpointLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="min-w-[10rem] flex-1 font-body text-sm text-white">{name}</span>

      <span className="flex items-center gap-1.5 font-mono text-xs text-tadius-gray-muted">
        <Rocket className="h-3.5 w-3.5" strokeWidth={2} />
        {launchCount} launch{launchCount === 1 ? "" : "es"}
      </span>

      <span className="flex items-center gap-1.5 font-mono text-xs text-tadius-gray-muted">
        <Clock className="h-3.5 w-3.5" strokeWidth={2} />
        {formatDuration(timeSpentMs)}
      </span>

      {checkpointLabel && (
        <span className="flex items-center gap-1.5 font-mono text-xs text-tadius-green-500">
          <CheckSquare className="h-3.5 w-3.5" strokeWidth={2} />
          {checkpointLabel}
        </span>
      )}

      <span
        className={cn(
          "ml-auto font-mono text-[11px]",
          launchCount > 0 ? "text-tadius-gray-dim" : "text-tadius-gray-dim/60"
        )}
      >
        {formatLastLaunched(lastLaunchedAt)}
      </span>
    </div>
  );
}
