import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";

import { ensureContainer, resetContainer } from "./container-manager";
import { createTerminalWss, handleUpgrade } from "./ws-terminal";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3010" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// MVP auth: userId is a client-asserted query param straight from the
// (currently mocked) frontend session — good enough for local dev, not
// for anything public. Swap for a verified session/JWT before deploying.
app.post("/api/labs/:labId/connect", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  const { labId } = req.params;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  try {
    const containerId = await ensureContainer(userId, labId);
    res.json({ containerId, ready: true });
  } catch (err) {
    console.error("[connect] failed:", err);
    res.status(500).json({ error: "Failed to provision environment" });
  }
});

app.post("/api/labs/:labId/reset", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  const { labId } = req.params;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  try {
    const containerId = await resetContainer(userId, labId);
    res.json({ containerId, ready: true });
  } catch (err) {
    console.error("[reset] failed:", err);
    res.status(500).json({ error: "Failed to reset environment" });
  }
});

const server = http.createServer(app);
const wss = createTerminalWss();

server.on("upgrade", (request, socket, head) => {
  if (request.url?.startsWith("/ws/terminal")) {
    handleUpgrade(wss, request, socket, head);
  } else {
    socket.destroy();
  }
});

const port = Number(process.env.PORT ?? 4001);
server.listen(port, () => {
  console.log(`[tadius-backend] listening on http://localhost:${port}`);
});
