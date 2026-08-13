"use client";

import { useEffect, useState } from "react";

import { Starfield } from "@/components/background/starfield";
import { Watermark } from "@/components/background/watermark";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { AuthModal } from "@/components/auth/auth-modal";
import { cn } from "@/lib/utils";

const COLLAPSE_STORAGE_KEY = "tadius:sidebar-collapsed";

/**
 * App-wide chrome: background layers + neon frame + sidebar + top nav wrap
 * every route. Lives in the root layout so it never remounts on
 * navigation — only the `children` (page content) swaps out.
 *
 * No session fetch here: Tadius starts every visitor in guest mode.
 * `useUserStore`'s `signIn()` is only ever triggered explicitly, from the
 * Sign In / Register controls in TopNav and the sidebar's guest card.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Read the persisted preference after mount only — reading localStorage
  // during render would produce a server/client markup mismatch, since
  // the server always renders the default (expanded) state.
  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="relative min-h-screen">
      <Starfield />
      <Watermark />

      {/* Cinematic frame: a thin glowing border around the whole viewport.
          Fixed + pointer-events-none so it never intercepts input and
          never affects layout/scroll of the real content underneath. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 rounded-none border border-tadius-green-500/50 shadow-[inset_0_0_110px_rgba(34,197,94,0.13)]"
      />

      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      <div
        className={cn(
          "relative transition-[padding-left] duration-300 ease-in-out",
          collapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <AuthModal />
        <TopNav onMenuClick={() => setMobileNavOpen(true)} />
        <main className="relative z-0 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
