"use client";

import { motion } from "framer-motion";

import { useUserStore } from "@/store/user-store";

/**
 * Greeting + subtitle are derived from useUserStore, never hardcoded.
 * Two real states once loading resolves:
 *
 *  - Guest:         "Welcome to Tadius" / "Create an account to start
 *                    your DevOps journey."
 *  - Authenticated: "Welcome back, {firstName}" / workspace copy.
 *
 * Heading and subtitle live in one component so they always agree on
 * which state they're rendering.
 */
export function DashboardGreeting() {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-56 animate-pulse rounded bg-white/[0.04]" />
      </div>
    );
  }

  const firstName = user?.name.split(" ")[0];

  return (
    <div className="space-y-1.5">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-baseline font-heading text-2xl font-bold text-white sm:text-3xl"
      >
        {isAuthenticated && user ? (
          <>
            Welcome back,
            <span className="ml-2 text-glow text-tadius-green-500">{firstName}</span>
          </>
        ) : (
          <>
            Welcome to&nbsp;<span className="text-glow text-tadius-green-500">Tadius</span>
          </>
        )}
        <span
          aria-hidden="true"
          className="ml-1.5 inline-block h-6 w-[3px] animate-caret-blink bg-tadius-green-500 sm:h-7"
        />
      </motion.h1>

      <p className="font-body text-sm text-tadius-gray-muted">
        {isAuthenticated
          ? "Your workspace is provisioned and ready. Pick up where you left off."
          : "Create an account to start your DevOps journey."}
      </p>
    </div>
  );
}
