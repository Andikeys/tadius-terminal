/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The terminal is meant to feel like an uninterrupted real workstation —
  // Next's own dev-mode "N / N Issues" badge floating over it breaks that
  // illusion, and it's a dev-only build/runtime-error indicator, not
  // product UI. Disabled outright rather than just repositioned: any real
  // build error still fails the terminal build and shows up in the server
  // logs, so nothing gets hidden, it just stops rendering on top of the
  // one surface that's supposed to look like a genuine terminal.
  devIndicators: false,
  // Terminal/lab sessions will proxy to a Node/Express backend + Docker engine
  // in later milestones. Kept centralized here so the rewrite target is a
  // single source of truth as we move from local -> AWS (tadius.cloud).
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.TADIUS_BACKEND_URL ?? "http://localhost:4000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
