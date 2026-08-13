import type { IncomingMessage } from "http";
import type { Duplex } from "stream";
import { URL } from "url";
import { WebSocketServer, WebSocket } from "ws";

import { docker } from "./docker-client";
import { ensureContainer } from "./container-manager";

interface ClientMessage {
  type: "input" | "resize";
  data?: string;
  cols?: number;
  rows?: number;
}

// --- Debug instrumentation -------------------------------------------------
// Traces every byte crossing the WebSocket <-> Docker-exec-stream boundary
// on the server side. Only active outside production. Tags line up with the
// client-side ones in hooks/use-remote-terminal.ts:
//   [tadius:ws:in]   raw WS message received from the browser
//   [tadius:pty:in]  bytes actually written into the PTY stream (stdin)
//   [tadius:pty:raw] bytes read directly off Docker's exec stream, BEFORE
//                    demuxing — Docker's own frame headers included. This
//                    is what proved the root cause (see createStdoutDemuxer
//                    below): these headers were being forwarded to the
//                    browser unstripped.
//   [tadius:pty:out] the same data AFTER demuxing — true terminal payload
//                    only, headers stripped, this is what actually gets
//                    sent to the browser now.
// There are exactly two call sites that write to `stream` in this whole
// file: the one-time PS1 setup write right after exec.start(), and the
// input-forwarding write inside ws.on("message") below. Both are logged
// with the same [tadius:pty:in] tag specifically so a stray write from a
// third, unexpected source would show up as an extra, unexplained log line
// instead of being invisible.
const TERMINAL_DEBUG = process.env.NODE_ENV !== "production";

function hexDump(buf: Buffer | string): string {
  const bytes = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function debugLog(tag: string, seq: number, label: string, payload: string) {
  if (!TERMINAL_DEBUG) return;
  console.log(`[tadius:${tag}] #${seq} ${label} :: ${payload}`);
}

/**
 * THE root cause, found via the raw [tadius:pty:out] byte dumps: despite
 * `Tty: true` on the exec (which is documented to make Docker send a raw,
 * unframed stream), this dockerode/Docker Engine combination is still
 * multiplexing stdout/stderr using the standard 8-byte frame header —
 * `[streamType, 0, 0, 0, len0, len1, len2, len3]` (big-endian length)
 * followed by exactly that many payload bytes, repeated. Every prior
 * "stray character" report — the leading Q/N/W/Z/C/F/0/9/6 etc., and
 * commands losing a character or two mid-string — was this: the raw frame
 * header being forwarded straight into xterm.write() as if it were
 * terminal output. A header's length byte lands on a printable ASCII
 * value constantly (0x43='C', 0x30='0', 0x46='F' — all real examples
 * captured from this bug), and when a frame boundary falls in the middle
 * of echoed input, the next frame's header bytes get spliced into the
 * middle of that text. This wasn't a paste bug, a PTY line-discipline bug,
 * or an xterm bug at all — it was unstripped protocol framing.
 *
 * This demuxes properly: buffers across `stream.on("data", ...)` calls
 * (a single Docker frame can arrive split across multiple Node chunks,
 * and multiple frames can arrive concatenated in a single chunk — both
 * are handled), strips every 8-byte header, and emits only true payload
 * bytes in original order. stdin(0) frames are never emitted (shouldn't
 * appear on this stream, ignored defensively). If a byte that isn't a
 * valid stream type (0/1/2) turns up where a header is expected, that's
 * logged loudly rather than silently misinterpreted — it would mean this
 * stream isn't actually multiplexed the way it's currently proven to be.
 */
function createStdoutDemuxer(connId: string, onPayload: (chunk: Buffer) => void) {
  let buffer = Buffer.alloc(0);
  return function feed(chunk: Buffer) {
    buffer = buffer.length ? Buffer.concat([buffer, chunk]) : chunk;
    for (;;) {
      if (buffer.length < 8) return; // incomplete header, wait for more
      const streamType = buffer[0];
      if (streamType > 2) {
        console.error(
          `[tadius:demux] [${connId}] unexpected stream type byte 0x${streamType.toString(16)} — stream may no longer be multiplexed as expected. Raw: ${hexDump(buffer.subarray(0, Math.min(16, buffer.length)))}`
        );
        // Bail out and forward the raw buffer untouched rather than loop
        // forever misparsing it — better a visibly wrong screen than a
        // silently stuck one.
        onPayload(buffer);
        buffer = Buffer.alloc(0);
        return;
      }
      const payloadLength = buffer.readUInt32BE(4);
      if (buffer.length < 8 + payloadLength) return; // header seen, payload not fully arrived yet
      const payload = buffer.subarray(8, 8 + payloadLength);
      if (streamType === 1 || streamType === 2) {
        onPayload(Buffer.from(payload));
      }
      buffer = buffer.subarray(8 + payloadLength);
    }
  };
}

/** Strips anything that isn't safe to interpolate into a shell command —
 * the username arrives as a client-asserted query param, same trust level
 * as userId (see container-manager.ts's MVP-auth note). */
function safeUsername(raw: string | null): string {
  const cleaned = (raw ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned || "learner";
}

/**
 * Real bash's default prompt for a root shell (root@<container-hostname>:~#)
 * leaks the container's internal hostname and doesn't match Tadius's
 * identity, so it's overridden below.
 *
 * Matches a stock, polished Ubuntu prompt: green username, default
 * (white) `@tadius:`, green working directory, default (white) `$`. Kept
 * as a single static SGR pair per segment — no command substitution, no
 * conditional coloring — deliberately, since every extra moving part in
 * PS1 is one more thing that can perturb readline's prompt-width
 * calculation. No single-quote characters appear anywhere in this value:
 * it gets interpolated into `export PS1='...'` below, and a stray `'`
 * would terminate that early.
 */
function buildPs1(username: string): string {
  const green = "\\e[0;32m";
  const reset = "\\e[0m";
  return `\\[${green}\\]${username}\\[${reset}\\]@tadius:\\[${green}\\]\\w\\[${reset}\\]\\$ `;
}

/**
 * Bridges one browser WebSocket connection to one real `docker exec -it
 * bash` session inside the user's container.
 *
 * Shell *output* goes over raw binary WebSocket frames — `ws.send(payload)`
 * with the demuxed Buffer (see createStdoutDemuxer above), no string
 * decoding on this end at all. Two bugs stacked here historically: (1)
 * output used to go out as `JSON.stringify({type:"output", data:
 * chunk.toString("utf8")})`, decoding each chunk to a string in isolation,
 * which mangled any multi-byte UTF-8 character or ANSI escape sequence
 * Docker happened to split across two chunks — fixed by switching to
 * binary frames and letting xterm's own stateful writer handle partial
 * sequences. (2) the deeper bug, found later via byte-level tracing: even
 * after that fix, what was being forwarded still included Docker's raw
 * 8-byte stdout/stderr multiplexing frame headers, un-stripped — despite
 * `Tty: true` on the exec, which is supposed to make Docker skip that
 * framing entirely. Every "stray character before the prompt" report
 * traced back to a frame's length byte landing on a printable ASCII value
 * and getting written straight to the screen. createStdoutDemuxer() now
 * strips that framing before anything reaches the WebSocket. xterm.js's
 * own writer accepts a Uint8Array directly and has a real stateful parser
 * built exactly for UTF-8/escape-sequence continuity — it carries partial
 * sequences (now correctly demuxed ones) across separate
 * write() calls correctly, which independently decoding each chunk on
 * this end could never guarantee. Control messages (status/etc.) still go
 * over JSON text frames since they're small, structured, and never at
 * risk of a mid-sequence byte split.
 */
export function createTerminalWss() {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", async (ws: WebSocket, request: IncomingMessage) => {
    const url = new URL(request.url ?? "", "http://localhost");
    const userId = url.searchParams.get("userId");
    const labId = url.searchParams.get("labId") ?? "unknown";

    if (!userId) {
      ws.send(JSON.stringify({ type: "status", status: "error", message: "Missing userId" }));
      ws.close();
      return;
    }

    try {
      const containerId = await ensureContainer(userId, labId);
      const container = docker.getContainer(containerId);

      const exec = await container.exec({
        Cmd: ["/bin/bash"],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Env: ["TERM=xterm-256color"],
      });

      const stream = await exec.start({ hijack: true, stdin: true });

      let inSeq = 0;
      let outSeq = 0;
      const connId = `${userId}-${Date.now().toString(36)}`;

      // Every listener is wired up FIRST, before a single byte is written
      // to the PTY or the client is told "ready". In plain synchronous JS
      // this ordering couldn't previously cause a real race (there's no
      // `await` between the old write/ready/listener lines, so the event
      // loop never got a chance to deliver anything early) — but it's one
      // fewer thing to have to reason about while chasing a byte-level bug,
      // and it's the objectively correct order regardless.
      const demux = createStdoutDemuxer(connId, (payload) => {
        // This is the actual terminal payload, header already stripped —
        // what xterm should have been receiving from the start.
        const seq = outSeq++;
        debugLog(
          "pty:out",
          seq,
          `[${connId}] ${payload.length}B demuxed payload, BEFORE ws.send()`,
          `hex=[${hexDump(payload)}] text=${JSON.stringify(payload.toString("utf8"))}`
        );
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });

      stream.on("data", (chunk: Buffer) => {
        // Logged BEFORE demuxing, straight off Docker's exec stream — the
        // ground truth for what Docker actually put on the wire (frame
        // headers and all). Compare against the [tadius:pty:out] line
        // above for the same content to see the header get stripped.
        debugLog(
          "pty:raw",
          outSeq,
          `[${connId}] ${chunk.length}B raw from Docker exec stream, BEFORE demux`,
          `hex=[${hexDump(chunk)}]`
        );
        demux(chunk);
      });

      stream.on("close", () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "status", status: "closed" }));
          ws.close();
        }
      });

      ws.on("message", (raw) => {
        // Logged as received, before JSON.parse — proves message ordering
        // (sequence numbers are assigned strictly in the order the WS
        // library delivers frames, which for a single WebSocket connection
        // is guaranteed to match send order; ws does not reorder) and shows
        // whether a paste arrived as one frame or got split into several by
        // the browser/network before it ever reached this handler.
        const wsSeq = inSeq;
        if (TERMINAL_DEBUG) {
          const rawBuf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
          debugLog(
            "ws:in",
            wsSeq,
            `[${connId}] raw WS frame received, ${rawBuf.length}B`,
            `hex=[${hexDump(rawBuf)}]`
          );
        }

        let msg: ClientMessage;
        try {
          msg = JSON.parse(raw.toString());
        } catch (err) {
          debugLog("ws:in", wsSeq, `[${connId}] JSON.parse FAILED`, String(err));
          return;
        }

        if (msg.type === "input" && typeof msg.data === "string") {
          const seq = inSeq++;
          debugLog(
            "pty:in",
            seq,
            `[${connId}] writing ${msg.data.length} chars into PTY stdin (from ws.on("message"))`,
            `hex=[${hexDump(msg.data)}] text=${JSON.stringify(msg.data)}`
          );
          stream.write(msg.data);
        } else if (msg.type === "resize" && msg.cols && msg.rows) {
          debugLog("resize", inSeq, `[${connId}] resize`, `cols=${msg.cols} rows=${msg.rows}`);
          exec.resize({ h: msg.rows, w: msg.cols }).catch(() => undefined);
        }
      });

      ws.on("close", () => {
        stream.end();
      });

      // Only now, with every listener already wired up, do we touch the
      // PTY or tell the client anything. Since the PTY is in canonical
      // mode with echo on, this write gets echoed back through the
      // `stream.on("data", ...)` listener above like anything else typed —
      // that echo is real, expected traffic and will show up in the
      // [tadius:pty:out] log as the first entry for this connection.
      const ps1 = buildPs1(safeUsername(url.searchParams.get("username")));
      const setupLine = `export PS1='${ps1}'; clear\n`;
      debugLog(
        "pty:in",
        inSeq++,
        `[${connId}] one-time PS1 setup write`,
        `hex=[${hexDump(setupLine)}] text=${JSON.stringify(setupLine)}`
      );
      stream.write(setupLine);

      ws.send(JSON.stringify({ type: "status", status: "ready" }));
    } catch (err) {
      console.error("[ws-terminal] failed to attach:", err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "status",
            status: "error",
            message: err instanceof Error ? err.message : "Failed to attach shell",
          })
        );
        ws.close();
      }
    }
  });

  return wss;
}

export function handleUpgrade(
  wss: WebSocketServer,
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer
) {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
}
