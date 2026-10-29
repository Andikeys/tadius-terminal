import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

// Tadius design tokens live here rather than scattered across components.
// Anything that shows up more than once (colors, fonts, glow shadows,
// animation timings) is defined once and referenced everywhere — this is
// what lets the whole app share one cinematic "DevOps OS" identity instead
// of drifting per-component.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core brand surface — matte black, never pure #000 so panels can
        // still read as "lifted" against it.
        background: "#050505",
        foreground: "#F5F5F5",

        tadius: {
          black: "#050505",
          panel: "#0B0D0C",
          border: "rgba(255,255,255,0.08)",
          green: {
            DEFAULT: "#22C55E",
            50: "#EAFBF1",
            100: "#C8F4DA",
            300: "#7EE3AA",
            500: "#22C55E",
            600: "#16A34A",
            700: "#0F7A38",
            glow: "rgba(34,197,94,0.35)",
          },
          gray: {
            soft: "#D4D4D8",
            muted: "#8A8F98",
            dim: "#5B6069",
          },
        },

        // shadcn/ui semantic tokens, mapped onto the Tadius palette so
        // primitives (Button, Card, Progress...) inherit brand styling
        // for free instead of needing per-component overrides.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      fontFamily: {
        // Sora is reserved for major headings only (logo, page titles).
        heading: ["var(--font-sora)", "sans-serif"],
        // Monospace-first UI: JetBrains Mono primary, IBM Plex Mono as
        // fallback — used for everything that isn't a major heading
        // (sidebar labels, search, buttons, body copy) so the whole
        // dashboard reads like a developer workstation.
        body: ["var(--font-jetbrains-mono)", "var(--font-ibm-plex-mono)", "monospace"],
        mono: ["var(--font-jetbrains-mono)", "var(--font-ibm-plex-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Restrained, premium glow — a soft bloom, not a gamer-RGB halo.
        "glow-sm": "0 0 16px 0 rgba(34,197,94,0.3)",
        "glow-md": "0 0 28px 0 rgba(34,197,94,0.35)",
        "glow-lg": "0 0 56px 0 rgba(34,197,94,0.4)",
        panel: "0 8px 32px 0 rgba(0,0,0,0.55), 0 0 22px 0 rgba(34,197,94,0.06)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-scale": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.1s ease-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-scale": "fade-in-scale 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
