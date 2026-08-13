"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, RotateCcw, type LucideIcon } from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TerminalHeader } from "@/components/terminal/terminal-header";
import { ToolMarketplace } from "@/components/playgrounds/tool-marketplace";
import {
  connectToLab,
  disconnectFromLab,
  resetLabEnvironment,
  type LabConnection,
} from "@/lib/lab-session";
import { useUserStore } from "@/store/user-store";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useProgressStore, type ProgressKind } from "@/store/progress-store";
import type { RemoteTerminalHandle } from "@/hooks/use-remote-terminal";
import { cn } from "@/lib/utils";

type SessionStatus = "auth-required" | "provisioning" | "connected" | "failed";

// @xterm/xterm and @xterm/addon-fit touch browser-only globals (`self`) at
// module load time. This modal is mounted (even while closed) on server-
// rendered pages like /playgrounds and /labs/[labId], so a plain static
// import of RemoteTerminalSurface would crash SSR before hydration ever
// runs. next/dynamic with ssr:false skips server rendering for this
// subtree entirely. See remote-terminal-surface.tsx's default export.
const RemoteTerminalSurface = dynamic(() => import("@/components/terminal/remote-terminal-surface"), {
  ssr: false,
});

/**
 * Minimal shape the modal actually needs — satisfied by both DevOpsTool
 * (Playgrounds) and a small inline object built from a Lab (see
 * app/labs/[labId]/page.tsx), so one modal serves both without either
 * data model depending on the other.
 */
export interface LaunchableTool {
  id: string;
  playgroundName: string;
  icon: LucideIcon;
  color: string;
}

interface LaunchSessionModalProps {
  tool: LaunchableTool | null;
  onOpenChange: (open: boolean) => void;
  /** "playground" (default) or "lab" — determines which progress bucket
   * launches/time-spent are recorded against and whether the Tool
   * Marketplace panel is shown (Labs bring their own curriculum instead). */
  kind?: ProgressKind;
}

export function LaunchSessionModal({ tool, onOpenChange, kind = "playground" }: LaunchSessionModalProps) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.user);
  const openAuthModal = useAuthModalStore((s) => s.open);
  const recordLaunch = useProgressStore((s) => s.recordLaunch);
  const recordSessionEnd = useProgressStore((s) => s.recordSessionEnd);

  const [status, setStatus] = useState<SessionStatus>("provisioning");
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [connection, setConnection] = useState<LabConnection | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  const terminalHandleRef = useRef<RemoteTerminalHandle | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  const steps = tool
    ? [
        `provisioning ${tool.playgroundName.replace(" Playground", "").toLowerCase()} environment...`,
        "attaching interactive shell...",
        "starting Ubuntu 22.04 container (1 vCPU, 1GB RAM)...",
      ]
    : [];

  // Provision (or re-provision) whenever a tool is launched or the user
  // signs in mid-flow. Real network call now — see lib/lab-session.ts.
  useEffect(() => {
    if (!tool) return;
    setVisibleSteps(0);
    setErrorMessage(null);

    if (!isAuthenticated || !user) {
      setStatus("auth-required");
      return;
    }

    setStatus("provisioning");
    let cancelled = false;

    const stepTimers = steps.map((_, i) =>
      setTimeout(() => {
        if (!cancelled) setVisibleSteps((v) => Math.max(v, i + 1));
      }, (i + 1) * 420)
    );

    connectToLab(tool.id, user.id, user.username)
      .then((conn) => {
        if (cancelled) return;
        setConnection(conn);
        setStatus("connected");
        recordLaunch(kind, tool.id);
        sessionStartRef.current = Date.now();
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : "Failed to connect");
        setStatus("failed");
      });

    return () => {
      cancelled = true;
      stepTimers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool?.id, isAuthenticated]);

  function handleOpenChange(open: boolean) {
    if (!open) {
      if (connection) disconnectFromLab(connection);
      if (sessionStartRef.current && tool) {
        recordSessionEnd(kind, tool.id, Date.now() - sessionStartRef.current);
        sessionStartRef.current = null;
      }
      setConnection(null);
      terminalHandleRef.current = null;
      setConfirmingReset(false);
    }
    onOpenChange(open);
  }

  // Destroys the container and everything in it — real files, real
  // git clones, real installed tools. Requires a second click within the
  // same session to confirm (same pattern as "Reset Progress" in
  // Settings) so a stray click doesn't wipe real work with no warning.
  async function handleReset() {
    if (!tool || !user || isResetting) return;
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    setConfirmingReset(false);
    setIsResetting(true);
    try {
      const conn = await resetLabEnvironment(tool.id, user.id, user.username);
      setConnection(conn);
      terminalHandleRef.current = null;
      setSessionKey((k) => k + 1); // remounts RemoteTerminalSurface on the fresh wsUrl
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reset environment");
    } finally {
      setIsResetting(false);
    }
  }

  const isConnected = status === "connected" && connection;

  return (
    <Dialog open={!!tool} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("p-0", isConnected ? "max-w-4xl" : "max-w-2xl")}
      >
        {tool && (
          <>
            <DialogTitle className="sr-only">{tool.playgroundName}</DialogTitle>
            <DialogDescription className="sr-only">
              Launch session for {tool.playgroundName}
            </DialogDescription>

            {isConnected ? (
              <div className="flex h-[560px]">
                <div className="flex min-w-0 flex-1 flex-col">
                  <TerminalHeader
                    label={`tadius — ${tool.playgroundName}`}
                    onClose={() => handleOpenChange(false)}
                  />
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
                    <span className="font-mono text-[11px] text-tadius-gray-dim">
                      1 vCPU · 1GB RAM · Ubuntu 22.04 · isolated
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isResetting}
                      onClick={handleReset}
                      onBlur={() => setConfirmingReset(false)}
                      className={cn(
                        "h-6 gap-1.5 px-2 text-[11px] text-tadius-gray-muted hover:text-white",
                        confirmingReset && "text-red-400 hover:text-red-300"
                      )}
                    >
                      <RotateCcw
                        className={cn("h-3 w-3", isResetting && "animate-spin")}
                        strokeWidth={2}
                      />
                      {isResetting
                        ? "Resetting..."
                        : confirmingReset
                          ? "Click again to erase & reset"
                          : "Reset Environment"}
                    </Button>
                  </div>
                  <RemoteTerminalSurface
                    key={`${tool.id}-${sessionKey}`}
                    wsUrl={connection.wsUrl}
                    onReady={(handle) => {
                      terminalHandleRef.current = handle;
                    }}
                    heightClass="flex-1 min-h-0"
                  />
                </div>
                {kind === "playground" && (
                  <ToolMarketplace
                    className="w-64 shrink-0"
                    disabled={isResetting}
                    onInstall={(command) => terminalHandleRef.current?.sendCommand(command)}
                  />
                )}
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center gap-6 p-8 text-center">
                {status === "auth-required" ? (
                  <>
                    <p className="font-heading text-lg font-semibold text-white">
                      Sign in required
                    </p>
                    <p className="max-w-xs font-body text-sm text-tadius-gray-muted">
                      Create an account or sign in to launch {tool.playgroundName}.
                    </p>
                    <Button onClick={() => openAuthModal("sign-in")}>Sign In</Button>
                  </>
                ) : status === "failed" ? (
                  <>
                    <p className="font-heading text-lg font-semibold text-white">
                      Couldn&apos;t reach your workspace
                    </p>
                    <p className="max-w-sm font-body text-sm text-tadius-gray-muted">
                      {errorMessage ?? "The Tadius backend isn't reachable."} Make sure the
                      backend in <code className="text-tadius-green-500">server/</code> is
                      running (<code className="text-tadius-green-500">npm run dev</code>) with
                      Docker Desktop started.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatus("provisioning");
                        setVisibleSteps(0);
                        if (user) {
                          connectToLab(tool.id, user.id, user.username)
                            .then((conn) => {
                              setConnection(conn);
                              setStatus("connected");
                              recordLaunch(kind, tool.id);
                              sessionStartRef.current = Date.now();
                            })
                            .catch((err) => {
                              setErrorMessage(err instanceof Error ? err.message : "Failed to connect");
                              setStatus("failed");
                            });
                        }
                      }}
                    >
                      Try Again
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-tadius-green-500" />
                    <div className="space-y-1.5 text-left font-mono text-sm">
                      <p className="text-tadius-green-500">$ tadius launch {tool.id}</p>
                      {steps.slice(0, visibleSteps).map((step, i) => (
                        <p key={i} className="text-tadius-gray-soft">
                          <span className="text-tadius-green-500">→</span> {step}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
