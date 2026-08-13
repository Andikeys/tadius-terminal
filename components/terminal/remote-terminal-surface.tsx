"use client";

import { cn } from "@/lib/utils";
import {
  useRemoteTerminal,
  type RemoteTerminalHandle,
  type RemoteTerminalStatus,
} from "@/hooks/use-remote-terminal";

interface RemoteTerminalSurfaceProps {
  wsUrl: string;
  onReady?: (handle: RemoteTerminalHandle) => void;
  onStatusChange?: (status: RemoteTerminalStatus) => void;
  heightClass?: string;
}

/** Bare mount point for a real, backend-connected terminal session. */
export function RemoteTerminalSurface({
  wsUrl,
  onReady,
  onStatusChange,
  heightClass = "h-[420px]",
}: RemoteTerminalSurfaceProps) {
  const { containerRef } = useRemoteTerminal({ wsUrl, onReady, onStatusChange });
  return <div ref={containerRef} className={cn("scrollbar-tadius px-2 py-2", heightClass)} />;
}

// Also exported as default specifically so next/dynamic(() =>
// import("./remote-terminal-surface"), { ssr: false }) can resolve it
// without a `.then(mod => mod.RemoteTerminalSurface)` — see the two call
// sites (dashboard-terminal.tsx, launch-session-modal.tsx) for why this
// needs to be loaded with SSR disabled at all: @xterm/xterm and
// @xterm/addon-fit reference browser-only globals (`self`) at module
// top-level, and Next.js server-renders "use client" components' initial
// HTML too, not just their interactivity — so a plain static import of
// this file crashes the very first render on the server before hydration
// ever gets a chance to take over. next/dynamic with ssr:false is the
// standard fix for exactly this class of browser-only-library dependency.
export default RemoteTerminalSurface;
