import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { BootSequence } from "@/components/boot/boot-sequence";

// next/font self-hosts these at build time (no runtime request to Google
// Fonts, no layout shift from a late-loading <link>). CSS variables are
// exposed on <html> and consumed via the fontFamily.heading/body/mono
// tokens in tailwind.config.ts — components never reference the font
// objects directly, only the Tailwind classes.
//
// Tadius's typography is deliberately monospace-first: JetBrains Mono
// (with IBM Plex Mono as fallback) is the primary UI font everywhere —
// sidebar, search, terminal, buttons — so the whole dashboard reads like
// a developer workstation, not a marketing site. Sora is reserved for
// major headings only.
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tadius — The DevOps Operating System",
  description:
    "A premium browser-based DevOps terminal and hands-on lab platform. Real Linux shells, real containers, real infrastructure practice.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${jetbrainsMono.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <BootSequence>
          <AppShell>{children}</AppShell>
        </BootSequence>
      </body>
    </html>
  );
}
