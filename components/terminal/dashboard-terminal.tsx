"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, LogIn, TerminalSquare } from "lucide-react";

import { TerminalHeader } from "@/components/terminal/terminal-header";
import { Button } from "@/components/ui/button";
import { connectToLab, type LabConnection } from "@/lib/lab-session";
import { useUserStore } from "@/store/user-store";
import { useAuthModalStore } from "@/store/auth-modal-store";

/**
 * A dedicated labId for the always-on workspace shown on the dashboard —
 * not tied to any specific Lab or Playground curriculum, just the user's
 * persistent sandbox. container-manager.ts keys containers off userId, not
 * labId, so this resolves to the exact same container (and filesystem) any
 * Lab or Playground session for this user connects to: one real workspace
 * per user, reachable from anywhere in the product.
 */
const SANDBOX_LAB_ID = "sandbox";

// @xterm/xterm and @xterm/addon-fit touch browser-only globals (`self`) at
// module load time, and Next.js server-renders "use client" components'
// initial HTML too — so a plain static import of RemoteTerminalSurface
// crashes SSR before hydration ever runs. Loading it through next/dynamic
// with ssr:false skips server rendering for this subtree entirely; it only
// ever mounts in the browser, which is the only place it can safely exist
// anyway. See remote-terminal-surface.tsx's default export for context.
const RemoteTerminalSurface = dynamic(() => import("@/components/terminal/remote-terminal-surface"), {
  ssr: false,
});

/**
 * Real, backend-connected terminal — the same RemoteTerminalSurface used
 * by every Lab/Playground session, not a local command simulator. There is
 * exactly one terminal implementation in the product; this is it.
 */
export function DashboardTerminal() {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const openAuthModal = useAuthModalStore((s) => s.open);

  const [connection, setConnection] = useState<LabConnection | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setConnection(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setConnecting(true);
    setError(null);

    connectToLab(SANDBOX_LAB_ID, user.id, user.username)
      .then((conn) => {
        if (!cancelled) setConnection(conn);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to connect");
      })
      .finally(() => {
        if (!cancelled) setConnecting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, attempt]);

  const label = `tadius — ${isAuthenticated && user ? user.username : "guest"}@tadius`;

  return (
    <div className="glass-panel relative overflow-hidden rounded-xl border border-tadius-green-500/30 shadow-glow-sm">
      <TerminalHeader label={label} />

      <div className="h-[300px]">
        {!isAuthenticated || !user ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <TerminalSquare className="h-6 w-6 text-tadius-gray-muted" strokeWidth={1.5} />
            <p className="font-body text-sm text-tadius-gray-muted">
              No active workspace detected.
            </p>
            <Button size="sm" onClick={() => openAuthModal("sign-in")} className="gap-1.5">
              <LogIn className="h-3.5 w-3.5" strokeWidth={2} />
              Sign in to launch your workspace
            </Button>
          </div>
        ) : connecting ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-tadius-green-500" strokeWidth={2} />
            <p className="font-mono text-xs text-tadius-gray-muted">
              Attaching to your Ubuntu workspace...
            </p>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-body text-sm text-tadius-gray-muted">{error}</p>
            <p className="font-mono text-[11px] text-tadius-gray-dim">
              Make sure the backend in <code className="text-tadius-green-500">server/</code> is
              running with Docker Desktop started.
            </p>
            <Button size="sm" variant="outline" onClick={() => setAttempt((a) => a + 1)}>
              Try Again
            </Button>
          </div>
        ) : connection ? (
          <RemoteTerminalSurface wsUrl={connection.wsUrl} heightClass="h-full" />
        ) : null}
      </div>

      {/* Soft reflection: a faint green bloom along the bottom edge, like
          light catching the glass. Purely decorative, sits above the
          terminal but below any real content since xterm's own canvas
          paints opaque cells over it where text exists. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 rounded-b-xl bg-gradient-to-t from-tadius-green-500/[0.06] to-transparent"
      />
    </div>
  );
}
