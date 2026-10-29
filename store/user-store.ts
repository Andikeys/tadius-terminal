import { create } from "zustand";

/**
 * Single source of truth for "who is logged in" — identity only (name,
 * username, email). Level, XP, day streak, labs completed, and
 * challenges solved used to live here as static seeded numbers, which
 * meant a brand-new sign-in showed "34 labs completed" and a "12 day
 * streak" despite zero real activity. Those are now computed live from
 * real progress-store data instead — see lib/user-stats.ts and
 * hooks/use-user-stats.ts. This store no longer has an opinion on them.
 *
 * Tadius is public-first: visitors land in guest mode (no session fetch on
 * mount) and see zero-state stats plus a sign-in prompt, matching the
 * product's real auth flow. `signIn()` currently resolves a mock session —
 * when real auth ships (later milestone), only this function's body
 * changes to call the Express backend; every consumer (greeting, XP bar,
 * stat cards, top nav) keeps working unmodified because they all read
 * `user` / `isAuthenticated` from here, never a hardcoded value.
 *
 * `signIn()` accepts optional details from the real sign-up/sign-in form
 * (components/auth/auth-modal.tsx) so the mock session reflects what was
 * actually typed instead of always showing the same hardcoded name —
 * there's no real user database yet, but the account you "create" looks
 * and feels like the one you typed.
 */

export interface TadiusUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

export interface SignInDetails {
  name?: string;
  username?: string;
  email?: string;
}

interface UserState {
  user: TadiusUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (details?: SignInDetails) => Promise<void>;
  signOut: () => void;
}

// Fallback only — every field is normally overwritten below with something
// derived from what was actually typed into the auth form. `id` specifically
// must NEVER be this constant for a real sign-in: it used to be, always,
// for every single account, which is exactly what caused two different
// people signing in on the same machine to land in the SAME backend
// container (container-manager.ts keys everything off `userId`) and see
// each other's files. deriveUserId() below fixes that; MOCK_SESSION.id only
// survives as the absolute last resort if somehow no email came through at
// all, which shouldn't be reachable given the auth form requires one.
const MOCK_SESSION: TadiusUser = {
  id: "usr_001",
  name: "Learner",
  username: "learner",
};

/**
 * There's no real backend/database yet — no password verification, no
 * account table, nothing stopping someone from typing any email and
 * "becoming" that account. What this DOES guarantee, with zero backend,
 * is workspace isolation: the same email always maps to the same id
 * (so signing back in returns you to the same container/filesystem you
 * had before — real persistence, not a fresh box every time), and
 * different emails always map to different ids (so two different people
 * on the same machine never share a container). That's the actual bug
 * being fixed here; real authentication (verifying the person typing the
 * email IS that person) is a separate, still-open gap for when a real
 * backend exists.
 */
function deriveUserId(email: string): string {
  const cleaned = email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `usr_${cleaned || "learner"}`;
}

/** No real backend to look up a name by email, so Sign In (which only
 * collects email + password) derives a plausible display name/username
 * from the email's local part — "jane.doe@example.com" becomes
 * "Jane Doe" / "@jane.doe". Not fabricated data, just a readable
 * transform of what the person actually typed. */
function deriveFromEmail(email: string): { name: string; username: string } {
  const localPart = email.split("@")[0] ?? "";
  const username = localPart.toLowerCase().replace(/[^a-z0-9_.-]/g, "") || "learner";
  const name =
    localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ") || "Learner";
  return { name, username };
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  signIn: async (details) => {
    set({ isLoading: true });
    // Simulated latency stands in for the future POST /api/backend/auth
    // call so loading states are built and tested from day one.
    await new Promise((resolve) => setTimeout(resolve, 600));

    const derived = details?.email ? deriveFromEmail(details.email) : null;

    set({
      user: {
        ...MOCK_SESSION,
        id: details?.email ? deriveUserId(details.email) : MOCK_SESSION.id,
        name: details?.name || derived?.name || MOCK_SESSION.name,
        username: details?.username || derived?.username || MOCK_SESSION.username,
        ...(details?.email ? { email: details.email } : {}),
      },
      isAuthenticated: true,
      isLoading: false,
    });
  },
  signOut: () => set({ user: null, isAuthenticated: false }),
}));
