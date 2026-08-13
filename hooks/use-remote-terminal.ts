"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

/**
 * Real terminal engine: pipes xterm.js keystrokes to a WebSocket and
 * writes whatever comes back — no local command interpretation. The
 * "shell" on the other end of the socket is a genuine `docker exec -it
 * bash` inside the user's container (see server/src/ws-terminal.ts).
 *
 * Wire protocol — asymmetric on purpose:
 *   client -> server: JSON text frames, {type:"input", data} | {type:"resize", cols, rows}
 *   server -> client: raw BINARY frames for shell output (the actual bytes
 *     from Docker's stream, untouched), JSON text frames only for control
 *     messages ({type:"status", status, message?}). Output used to be
 *     JSON-wrapped too (`{type:"output", data: chunk.toString("utf8")}`),
 *     which corrupted multi-byte UTF-8 characters and ANSI escape
 *     sequences whenever Docker happened to split one across two stream
 *     chunks — exactly the kind of thing that shows up as a stray
 *     character in the prompt or a command silently missing its last few
 *     letters under real load (apt, git). Binary frames + xterm's own
 *     stateful writer (which is built to handle exactly this) fix it.
 */

export interface RemoteTerminalHandle {
  sendCommand: (command: string) => void;
}

export type RemoteTerminalStatus = "connecting" | "open" | "closed" | "error";

interface UseRemoteTerminalOptions {
  wsUrl: string;
  onReady?: (handle: RemoteTerminalHandle) => void;
  onStatusChange?: (status: RemoteTerminalStatus) => void;
}

const ANSI = {
  dim: "\x1b[38;2;138;143;152m",
  red: "\x1b[38;2;248;113;113m",
  reset: "\x1b[0m",
};

const FONT_SIZE = 13;
const FALLBACK_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// --- Debug instrumentation -------------------------------------------------
// Traces every byte crossing the xterm <-> WebSocket boundary on the client
// side. Only active outside production builds. Each line is tagged so it's
// grep-able in the browser console: [tadius:onData] for keystrokes/paste
// leaving xterm, [tadius:recv] for bytes written into xterm. Cross-reference
// timestamps + sequence numbers against the server's own
// [tadius:ws:in]/[tadius:pty:out] log lines (server/src/ws-terminal.ts) to
// see exactly where, between the two ends, a byte sequence stops matching.
const TERMINAL_DEBUG = process.env.NODE_ENV !== "production";
let clientSeq = 0;

function toHex(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function debugLog(tag: string, seq: number, label: string, payload: string) {
  if (!TERMINAL_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(
    `%c[tadius:${tag}]%c #${seq} ${label}`,
    "color:#22c55e;font-weight:600",
    "color:inherit",
    payload
  );
}

/**
 * Waits for the real webfont to finish loading before xterm ever measures
 * a character cell. Without this, xterm's first `fit()` measures against
 * whatever temporary fallback font the browser is showing while the
 * self-hosted JetBrains Mono downloads, then the webfont swaps in a moment
 * later via the normal @font-face flow — but the cell WIDTH stays pinned
 * to the fallback's (different) advance width. Every character after that
 * renders inside a cell sized for a font it's no longer using, which reads
 * exactly like "excessive letter spacing". Measuring once, after the font
 * is actually ready, avoids the mismatch entirely.
 */
async function ensureFontLoaded(fontFamily: string) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await document.fonts.load(`${FONT_SIZE}px ${fontFamily}`);
    await document.fonts.ready;
  } catch {
    // Best effort — if the Font Loading API throws or isn't supported,
    // fall through and let the browser's normal font swap happen; the
    // fallback stack below is a true system monospace either way, so the
    // grid stays fixed-width even in the worst case.
  }
}

export function useRemoteTerminal({ wsUrl, onReady, onStatusChange }: UseRemoteTerminalOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let ws: WebSocket | null = null;
    let dataDisposable: { dispose: () => void } | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    async function setup() {
      const cssFont = getComputedStyle(document.documentElement)
        .getPropertyValue("--font-jetbrains-mono")
        .trim();
      const fontFamily = cssFont ? `${cssFont}, ${FALLBACK_STACK}` : FALLBACK_STACK;

      await ensureFontLoaded(fontFamily);
      if (cancelled || !container) return;

      term = new Terminal({
        fontFamily,
        fontSize: FONT_SIZE,
        lineHeight: 1.15,
        letterSpacing: 0,
        fontWeight: "400",
        fontWeightBold: "600",
        cursorBlink: true,
        cursorStyle: "block",
        scrollback: 5000,
        // convertEol deliberately OFF: this is a real PTY (Docker exec with
        // Tty:true), and a real PTY's line discipline already translates a
        // bare LF written by the shell into CR+LF before it ever reaches
        // this stream (the kernel does it, not bash). If xterm ALSO forces
        // every LF to imply a carriage return, every real "\r\n" the PTY
        // sends turns into a redundant double carriage-return. That's
        // exactly the failure signature reported: a single stray leftover
        // character surviving at column 0 of an otherwise-correct new
        // line, because the cursor's home position got computed twice.
        // convertEol is a workaround for raw (non-PTY) stdout that only
        // sends bare "\n" — it doesn't apply here and was actively fighting
        // the real prompt/output redraws.
        convertEol: false,
        theme: {
          background: "#0b0d0c",
          foreground: "#f5f5f5",
          cursor: "#22c55e",
          cursorAccent: "#050505",
          selectionBackground: "rgba(34,197,94,0.35)",
          black: "#050505",
          green: "#22c55e",
          brightGreen: "#4ade80",
          yellow: "#fbbf24",
          brightYellow: "#fcd34d",
          red: "#f87171",
          white: "#d4d4d8",
          brightBlack: "#5b6069",
          brightWhite: "#ffffff",
        },
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(container);
      fitAddon.fit();
      term.writeln(`${ANSI.dim}Connecting to your workspace...${ANSI.reset}`);
      term.focus();

      const activeTerm = term;
      const activeFit = fitAddon;

      onStatusChange?.("connecting");
      ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      const socket = ws;

      socket.onopen = () => {
        onReady?.({
          sendCommand: (command) => {
            if (socket.readyState !== WebSocket.OPEN) return;
            const line = command.endsWith("\n") ? command : `${command}\n`;
            socket.send(JSON.stringify({ type: "input", data: line }));
          },
        });
      };

      socket.onmessage = (event) => {
        // Shell output arrives as raw binary frames now (see the wire
        // protocol note above) — write the bytes straight through and let
        // xterm's own parser handle UTF-8 decoding and any escape
        // sequence that happens to span two separate messages.
        if (event.data instanceof ArrayBuffer) {
          const bytes = new Uint8Array(event.data);
          if (TERMINAL_DEBUG) {
            const seq = clientSeq++;
            const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
            debugLog(
              "recv",
              seq,
              `${bytes.length}B raw from server, BEFORE xterm.write()`,
              `hex=[${toHex(bytes)}] text=${JSON.stringify(text)}`
            );
          }
          activeTerm.write(bytes);
          return;
        }
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === "status" && msg.status === "ready") {
            // Wipe the local "Connecting to your workspace..." message
            // ourselves, synchronously, instead of relying on the server's
            // `clear` (sent through the shell as part of the PS1 setup
            // line) to survive a full round trip — write to PTY stdin, get
            // echoed by the PTY, get executed, come back over the
            // WebSocket, get parsed by xterm — before it overwrites this
            // line. Any timing hiccup anywhere in that round trip leaves a
            // fragment of "Connecting..." behind, and a fragment of
            // "Connecting..." is a "C" sitting right where the first
            // prompt draws — which is exactly the stray leading character
            // being reported. term.clear() has no such dependency: it's
            // local, instant, and can't race with anything.
            activeTerm.clear();
            // Only send the initial size once the server confirms the
            // shell is attached. Sending it eagerly on "open" races the
            // server's own async container/exec setup — if it arrives
            // before the server has registered its message listener, it's
            // silently dropped, and the PTY is left at Docker's default
            // width while xterm renders at the real one. That mismatch is
            // what makes bash wrap long lines at the wrong column and
            // overwrite the previous prompt instead of moving to a new
            // row (garbled text mixed into the prompt on long commands).
            socket.send(JSON.stringify({ type: "resize", cols: activeTerm.cols, rows: activeTerm.rows }));
            onStatusChange?.("open");
          } else if (msg.type === "status" && msg.status === "error") {
            activeTerm.writeln(`\r\n${ANSI.red}${msg.message ?? "Connection error"}${ANSI.reset}`);
            onStatusChange?.("error");
          } else if (msg.type === "status" && msg.status === "closed") {
            onStatusChange?.("closed");
          }
        } catch {
          // ignore malformed frames
        }
      };

      socket.onerror = () => onStatusChange?.("error");
      socket.onclose = () => onStatusChange?.("closed");

      // Client -> server input path. xterm's onData fires once per
      // keystroke AND once per paste (a paste is delivered as a single
      // call with the full pasted string, bracketed-paste markers already
      // included if the shell requested them) — either way this forwards
      // exactly the bytes xterm handed it, once, as one JSON message. There
      // is no separate local echo here: this only ever sends to the
      // server, it never calls activeTerm.write() itself, so the PTY's own
      // canonical-mode echo (reflected back through socket.onmessage above)
      // is the *only* place typed/pasted characters get drawn. If both
      // xterm and the PTY were echoing, every keystroke would visibly
      // double — they don't, because only one side ever writes to the
      // terminal.
      dataDisposable = activeTerm.onData((data) => {
        if (TERMINAL_DEBUG) {
          const seq = clientSeq++;
          debugLog(
            "onData",
            seq,
            `${data.length} chars leaving xterm, about to socket.send()`,
            `hex=[${toHex(data)}] text=${JSON.stringify(data)}`
          );
        }
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "input", data }));
        }
      });

      // Container-size changes (sidebar collapse, dialog entrance
      // animation, mobile layout shifts) don't fire a window "resize"
      // event at all — only the browser chrome resizing does. Watching the
      // terminal's own element with ResizeObserver catches every case that
      // actually changes xterm's cell grid. Debounced 80ms so a CSS
      // transition settling over several frames doesn't call fit()/resize()
      // once per frame — each call reflows the buffer and re-sends PTY
      // dimensions, and doing that mid-animation was a real candidate for
      // the intermittent visual corruption being reported.
      const triggerResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          activeFit.fit();
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({ type: "resize", cols: activeTerm.cols, rows: activeTerm.rows })
            );
          }
        }, 80);
      };
      resizeObserver = new ResizeObserver(triggerResize);
      resizeObserver.observe(container);
    }

    setup();

    return () => {
      cancelled = true;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      dataDisposable?.dispose();
      ws?.close();
      term?.dispose();
    };
    // onReady/onStatusChange are intentionally excluded — including them
    // would tear the socket (and the real shell session) down on every
    // parent re-render instead of only when wsUrl actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl]);

  return { containerRef };
}
