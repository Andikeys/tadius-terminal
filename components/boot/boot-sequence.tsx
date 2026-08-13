"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

interface BootLine {
  text: string;
  /** ms per character — slower on the title/closing lines for emphasis, brisk on the status lines so the whole sequence stays cinematic without dragging. */
  charDelay: number;
  emphasis?: boolean;
}

const LINES: BootLine[] = [
  { text: "TADIUS RUNTIME v1.0", charDelay: 40, emphasis: true },
  { text: "Initializing secure workspace...", charDelay: 16 },
  { text: "Loading kernel modules...", charDelay: 16 },
  { text: "Mounting isolated filesystem...", charDelay: 16 },
  { text: "Starting container runtime...", charDelay: 16 },
  { text: "Connecting terminal session...", charDelay: 16 },
  { text: "Verifying DevOps toolchain...", charDelay: 16 },
  { text: "Environment ready.", charDelay: 40, emphasis: true },
];

/**
 * Plays once per full page load (not on SPA navigation — this wraps
 * AppShell in the root layout, so it only mounts when the document
 * itself loads/refreshes). Typewriter effect on every line, then fades
 * and scales out to reveal the real app, which is already mounted
 * underneath the whole time — no flash, no re-fetch on reveal.
 */
export function BootSequence({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [completedLines, setCompletedLines] = useState<BootLine[]>([]);

  useEffect(() => {
    if (lineIndex >= LINES.length) {
      const finishTimer = setTimeout(() => setBooting(false), 550);
      return () => clearTimeout(finishTimer);
    }

    const current = LINES[lineIndex];
    if (!current) return;

    if (charIndex < current.text.length) {
      const typeTimer = setTimeout(() => setCharIndex((c) => c + 1), current.charDelay);
      return () => clearTimeout(typeTimer);
    }

    const lineTimer = setTimeout(() => {
      setCompletedLines((lines) => [...lines, current]);
      setLineIndex((i) => i + 1);
      setCharIndex(0);
    }, 180);
    return () => clearTimeout(lineTimer);
  }, [lineIndex, charIndex]);

  const currentLine = LINES[lineIndex];
  const typedText = currentLine ? currentLine.text.slice(0, charIndex) : "";

  return (
    <>
      <AnimatePresence>
        {booting && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-tadius-black"
          >
            <div className="w-full max-w-lg px-6 font-mono text-sm">
              {completedLines.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    line.emphasis ? "font-semibold text-tadius-green-500 text-glow" : "text-tadius-gray-soft"
                  )}
                >
                  {line.text}
                </p>
              ))}
              {currentLine && (
                <p
                  className={cn(
                    currentLine.emphasis
                      ? "font-semibold text-tadius-green-500 text-glow"
                      : "text-tadius-gray-soft"
                  )}
                >
                  {typedText}
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-caret-blink bg-tadius-green-500 align-middle"
                  />
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
