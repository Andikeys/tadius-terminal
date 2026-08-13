"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckSquare, Square, TerminalSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LaunchSessionModal } from "@/components/playgrounds/launch-session-modal";
import { useProgressStore } from "@/store/progress-store";
import { cn } from "@/lib/utils";
import { getLabById } from "@/lib/labs";

export function LabDetail({ labId }: { labId: string }) {
  const [launching, setLaunching] = useState(false);
  // Resolved client-side from just the id — see app/labs/[labId]/page.tsx
  // for why the full Lab object (it carries a component reference in
  // `icon`) can't cross the server/client boundary as a prop.
  const lab = getLabById(labId);

  // Hooks must run unconditionally on every render (Rules of Hooks), so
  // these are called before the `!lab` guard below.
  //
  // Subscribing to the raw `progress` map (rather than calling
  // getProgress() inside the selector) is deliberate: getProgress()
  // builds a brand-new object on every call when nothing's stored yet, so
  // using it as the selector itself hands useSyncExternalStore a
  // different reference on every read and it errors with "The result of
  // getSnapshot should be cached to avoid an infinite loop." Subscribing
  // to the stable `progress` record instead, then calling getProgress()
  // as a plain function afterward, re-renders correctly on real changes
  // without that trap.
  const progress = useProgressStore((s) => s.progress);
  const getProgress = useProgressStore((s) => s.getProgress);
  const toggleCheckpoint = useProgressStore((s) => s.toggleCheckpoint);
  void progress;

  if (!lab) return null;

  const Icon = lab.icon;
  const completedTaskIds = getProgress("lab", lab.id).completedTaskIds;
  const completedCount = completedTaskIds.length;
  const percent = Math.round((completedCount / lab.checkpoints.length) * 100);

  return (
    <div className="space-y-8">
      <Link
        href="/labs"
        className="inline-flex items-center gap-1.5 font-body text-sm text-tadius-gray-muted transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to Labs
      </Link>

      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 ring-white/10"
          style={{ backgroundColor: lab.color }}
        >
          <Icon className="h-7 w-7 text-white" strokeWidth={2} />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-bold text-white">{lab.name}</h1>
          <p className="max-w-2xl font-body text-sm leading-relaxed text-tadius-gray-muted">
            {lab.intro}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5">
            <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-tadius-gray-muted">
              Learning objectives
            </h2>
            <ul className="space-y-2">
              {lab.objectives.map((objective) => (
                <li
                  key={objective}
                  className="flex items-start gap-2 font-body text-sm text-tadius-gray-soft"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-tadius-green-500" />
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          <Button size="lg" className="w-full gap-2" onClick={() => setLaunching(true)}>
            <TerminalSquare className="h-4 w-4" strokeWidth={2} />
            Launch Interactive Terminal
          </Button>
        </div>

        <div className="glass-panel space-y-3 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-tadius-gray-muted">
              Checkpoints
            </h2>
            <span className="font-mono text-xs text-tadius-green-500">
              {completedCount}/{lab.checkpoints.length}
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full bg-tadius-green-500 shadow-glow-sm transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          <ul className="space-y-1 pt-1">
            {lab.checkpoints.map((checkpoint) => {
              const done = completedTaskIds.includes(checkpoint.id);
              return (
                <li key={checkpoint.id}>
                  <button
                    type="button"
                    onClick={() => toggleCheckpoint("lab", lab.id, checkpoint.id)}
                    className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    {done ? (
                      <CheckSquare
                        className="mt-0.5 h-4 w-4 shrink-0 text-tadius-green-500"
                        strokeWidth={2}
                      />
                    ) : (
                      <Square
                        className="mt-0.5 h-4 w-4 shrink-0 text-tadius-gray-muted"
                        strokeWidth={2}
                      />
                    )}
                    <span
                      className={cn(
                        "font-body text-sm",
                        done ? "text-tadius-gray-muted line-through" : "text-white"
                      )}
                    >
                      {checkpoint.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <LaunchSessionModal
        kind="lab"
        tool={
          launching
            ? { id: lab.id, playgroundName: lab.name, icon: lab.icon, color: lab.color }
            : null
        }
        onOpenChange={(open) => setLaunching(open)}
      />
    </div>
  );
}
