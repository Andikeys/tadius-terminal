# Tadius Backend

Provisions a real, isolated Ubuntu 22.04 Docker container per authenticated
user and bridges xterm.js (in the Next.js app) to a real `bash` shell
inside it over WebSocket. This is what turns the Playgrounds launch flow
from a simulation into an actual Linux environment.

## Prerequisites

- **Docker Desktop**, running, before you start this server. On Windows,
  Docker Desktop must be started and its engine healthy — this backend
  talks to it over the named pipe `//./pipe/docker_engine` by default.
- Node.js 18+.

## Setup

```bash
cd server
npm install
cp .env.example .env
npm run build:image     # builds the tadius-base:latest Ubuntu image (one-time, rebuild if you edit the Dockerfile)
npm run dev              # starts the API + WebSocket server on :4001
```

Then, in the Next.js app's root, copy `.env.local.example` to `.env.local`
(already points at `http://localhost:4001`) and restart `npm run dev`
there. Launching a Playground now provisions a real container instead of
the client-side command simulator.

## What's real vs. simulated right now

**Real:** container creation via `dockerode`, 1 vCPU / 1GB RAM limits
(`NanoCpus` / `Memory` on `HostConfig`), a genuine `docker exec -it bash`
streamed over WebSocket, Reset Environment (destroys and recreates the
container), and every Tool Marketplace install command (actual `apt`/`curl`
installers run for real, inside the container, with real internet access).

**Not yet built — do not expose this publicly until these exist:**

- **Auth.** `userId` is a client-asserted query param from the (still
  mocked) frontend session store. Anyone who can reach this API can claim
  any `userId` and touch that user's container. Needs a verified
  session/JWT before this is anything but a local dev tool.
- **Idle timeout.** Containers are never automatically destroyed. Left
  running, they sit there consuming the resource limit indefinitely.
- **Stronger isolation.** Plain Docker namespaces/cgroups, not
  gVisor/Kata/Firecracker. Fine for you running it locally; not the
  isolation bar for letting the internet run arbitrary install scripts.
- **Rate limiting.** Nothing stops one user from spamming container
  creates/resets.
- **Binary-safe terminal I/O.** The WebSocket protocol is JSON text
  frames, so raw binary output (e.g. `cat` on a binary file) can get
  mangled. Fine for install logs and normal shell use; a real terminal
  product would use binary WS frames instead.

## Architecture

```
Browser (xterm.js)
   |  WebSocket  ws://localhost:4001/ws/terminal?labId=...&userId=...
   v
Express + ws server (server/src/index.ts, ws-terminal.ts)
   |  dockerode
   v
Docker Engine  ->  tadius-<userId> container (tadius-base:latest, 1 vCPU / 1GB)
                       `docker exec -it bash` per WebSocket connection
```

`server/src/container-manager.ts` is the only place that creates,
finds, or destroys containers — `ensureContainer` (connect) and
`resetContainer` (Reset Environment button) are its whole public surface.
