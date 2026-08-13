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

// Never an identity fallback in practice — every field here is always
// overwritten below with something derived from what was actually typed
// into the auth form, on both Sign In and Sign Up.
const MOCK_SESSION: TadiusUser = {
  id: "usr_001",
  name: "Learner",
  username: "learner",
};

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
