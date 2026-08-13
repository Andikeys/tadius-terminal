# Tadius

A premium, browser-based DevOps terminal and hands-on lab platform. Cinematic UI, real Linux shells, real containers, real infrastructure practice.

## Status

The app shell, dashboard, Playgrounds grid, and a real container backend
are all in place. Playground launches provision an actual isolated Ubuntu
container (via `server/`) and connect a real shell over WebSocket — see
`server/README.md` for what's real vs. still-simulated and what's missing
before this could be exposed publicly.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 3 · shadcn/ui primitives (hand-authored on Radix) · Framer Motion · Zustand · Lucide React · xterm.js.

Backend (`server/`): Express · `ws` · `dockerode` — provisions and bridges into real Docker containers. Requires Docker Desktop running locally.

## Getting started

Two processes: the Next.js app, and the backend that provisions containers.

```bash
# 1. Backend — requires Docker Desktop running
cd server
npm install
cp .env.example .env
npm run build:image   # one-time: builds the tadius-base:latest Ubuntu image
npm run dev             # http://localhost:4001

# 2. Next.js app, in a second terminal, from the repo root
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3010. Without the backend running, Playground
launches will show a "couldn't reach your workspace" state with a retry
button rather than failing silently.

Other scripts: `npm run build`, `npm run start` (production server), `npm run lint`, `npm run typecheck`.

## Folder structure

```
app/                   Next.js App Router: routes, root layout, global CSS
  layout.tsx           Loads fonts, mounts <AppShell>
  page.tsx             Dashboard route
  playgrounds/page.tsx Playgrounds route
  globals.css          Tailwind layers + shadcn CSS variables (dark-only theme)

components/
  ui/                  shadcn/ui primitives (button, card, progress, avatar, separator, tooltip, dialog)
  layout/              App chrome: sidebar, top nav, app shell, logo, profile card
  background/          Starfield (canvas) + Watermark
  dashboard/           Greeting, stat cards, count-up animation
  terminal/            TerminalHeader (chrome) + TerminalSurface (local sim) + RemoteTerminalSurface (real backend)
  playgrounds/         Playground cards, launch/session modal, Tool Marketplace panel
  dock/                Dashboard's DevOps tool dock

hooks/
  use-interactive-terminal.ts   xterm + client-side command interpreter (dashboard idle terminal)
  use-remote-terminal.ts        xterm + real WebSocket-to-container bridge (Playground sessions)

store/
  user-store.ts        Zustand store — single source of truth for the logged-in user & stats

lib/
  utils.ts             cn() class-merge helper used by every UI primitive
  devops-tools.ts       Shared tool data (icon/color/copy) for the dock and Playgrounds grid
  marketplace-tools.ts  Real install commands for the Tool Marketplace panel
  lab-session.ts         connectToLab / resetLabEnvironment — the seam into server/

server/                Standalone Express + dockerode backend — see server/README.md

tailwind.config.ts     Design tokens: colors, fonts, shadows, animation keyframes
next.config.mjs        Rewrites /api/backend/* (unused for now — the app calls the backend directly via NEXT_PUBLIC_TADIUS_BACKEND_URL)
```

## Key architectural decisions

**Canvas over DOM for the starfield.** Hundreds of stars plus continuously spawning meteors would mean hundreds of DOM nodes restyled every frame if built with `<div>`s. A single `<canvas>` with one `requestAnimationFrame` loop keeps this at 60fps regardless of star count, and is a single paint per frame instead of hundreds of style recalculations.

**Zustand store as the only source of user data.** The dashboard greeting, XP bar, streak, and stat cards all read from `useUserStore`. Nothing hardcodes a name or number. Milestone 1 seeds the store with a mocked session (`fetchSession()` resolves after a simulated delay); when real auth ships, only that one function changes — every consumer keeps working unmodified.

**shadcn/ui primitives are hand-authored, not CLI-generated.** Same source pattern the shadcn CLI would produce (Radix primitive + `cva` variants + `cn()`), but written directly against the Tadius token set so `Button`, `Card`, `Progress`, etc. are on-brand by default with zero per-usage overrides.

**Dark-only theme via CSS variables.** `globals.css` defines the shadcn semantic tokens (`--background`, `--card`, `--primary`, …) once in HSL; `tailwind.config.ts` maps Tailwind's semantic color names onto those variables. Tadius ships one cinematic theme — no light/dark toggle — so this is simpler than the typical shadcn setup but keeps the same extensibility if that ever changes.

**Sidebar: fixed rail (desktop) + Framer Motion drawer (mobile).** One `NAV_ITEMS` array and one `<SidebarContent>` render both, so desktop and mobile can never drift out of sync.

**`next.config.mjs` rewrites are already wired** to a `TADIUS_BACKEND_URL` env var pointing at `http://localhost:4000` by default. The Express + Docker backend (Milestone 3+) will live behind `/api/backend/*` from day one, so no route restructuring is needed when it's introduced.

## What's next

Real auth (replacing the client-asserted `userId`), idle-timeout container teardown, and stronger sandboxing (gVisor/rootless) before this could go anywhere near a public deployment — see server/README.md's "not yet built" list. Also still pending: the cinematic terminal boot sequence from the original brief, and persistent (opt-in) environments beyond the current disposable-by-default containers.
