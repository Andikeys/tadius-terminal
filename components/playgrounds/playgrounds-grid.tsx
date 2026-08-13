"use client";

import { useState } from "react";
import { TerminalSquare } from "lucide-react";

import { DEVOPS_TOOLS, type DevOpsTool } from "@/lib/devops-tools";
import { PlaygroundCard } from "@/components/playgrounds/playground-card";
import { LaunchSessionModal } from "@/components/playgrounds/launch-session-modal";

// No filters, no difficulty sort — Playgrounds is a flat, always-visible
// set of sandboxes. Difficulty/progression framing lives in Labs instead.
export function PlaygroundsGrid() {
  const [activeTool, setActiveTool] = useState<DevOpsTool | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {DEVOPS_TOOLS.map((tool, i) => (
          <PlaygroundCard key={tool.id} tool={tool} index={i} onLaunch={setActiveTool} />
        ))}
      </div>

      <div className="glass-panel relative flex items-center justify-between gap-6 overflow-hidden rounded-xl border border-tadius-green-500/20 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-tadius-green-500/10 ring-1 ring-tadius-green-500/25">
            <TerminalSquare className="h-5 w-5 text-tadius-green-500" strokeWidth={2} />
          </div>
          <div>
            <p className="font-heading text-lg font-bold text-white">Build. Learn. Deploy.</p>
            <p className="font-body text-sm text-tadius-gray-muted">
              Every playground is isolated, secure and ready when you are.
            </p>
          </div>
        </div>
        <svg
          viewBox="0 0 100 100"
          className="hidden h-20 w-20 shrink-0 text-tadius-green-500/25 sm:block"
          aria-hidden="true"
        >
          <polygon
            points="50,4 92,27 92,73 50,96 8,73 8,27"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <polygon
            points="50,4 92,27 50,50 8,27"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line x1="50" y1="50" x2="50" y2="96" stroke="currentColor" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="92" y2="73" stroke="currentColor" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="8" y2="73" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <LaunchSessionModal tool={activeTool} onOpenChange={(open) => !open && setActiveTool(null)} />
    </>
  );
}
