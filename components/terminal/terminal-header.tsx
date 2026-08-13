"use client";

import { Menu } from "lucide-react";

interface TerminalHeaderProps {
  label: string;
  /** Present only on session terminals launched from a modal — the "3
   * horizontal lines" control on the left closes the session. */
  onClose?: () => void;
}

export function TerminalHeader({ label, onClose }: TerminalHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close session"
          className="mr-1 rounded p-0.5 text-tadius-gray-muted transition-colors hover:text-white"
        >
          <Menu className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
      <span className="h-3 w-3 rounded-full bg-red-500/80" />
      <span className="h-3 w-3 rounded-full bg-amber-400/80" />
      <span className="h-3 w-3 rounded-full bg-tadius-green-500/80" />
      <span className="ml-2 font-mono text-xs text-tadius-gray-dim">{label}</span>
    </div>
  );
}
