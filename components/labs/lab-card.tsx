"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBookmarksStore } from "@/store/bookmarks-store";
import { cn } from "@/lib/utils";
import type { Lab } from "@/lib/labs";

export function LabCard({ lab, index }: { lab: Lab; index: number }) {
  const Icon = lab.icon;
  const glowStyle = { "--tool-color": lab.color } as React.CSSProperties;
  const bookmarked = useBookmarksStore((s) => s.isBookmarked(lab.id));
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      style={glowStyle}
      className="group glass-panel relative flex flex-col gap-4 rounded-xl p-5 transition-shadow duration-300 hover:border-tadius-green-500/40 hover:shadow-[0_0_36px_var(--tool-color)]"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggleBookmark(lab.id);
        }}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark this lab"}
        aria-pressed={bookmarked}
        className={cn(
          "absolute right-4 top-4 rounded-md p-1 transition-colors",
          bookmarked
            ? "text-tadius-green-500"
            : "text-tadius-gray-dim hover:text-tadius-gray-soft"
        )}
      >
        <Bookmark className="h-4 w-4" strokeWidth={2} fill={bookmarked ? "currentColor" : "none"} />
      </button>

      <div
        className="flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-white/10"
        style={{ backgroundColor: lab.color }}
      >
        <Icon className="h-6 w-6 text-white" strokeWidth={2} />
      </div>

      <div className="space-y-1.5">
        <h3 className="font-heading text-base font-semibold text-white">{lab.name}</h3>
        <p className="font-body text-sm leading-relaxed text-tadius-gray-muted">
          {lab.description}
        </p>
      </div>

      <Button asChild className="mt-auto w-full gap-2">
        <Link href={`/labs/${lab.id}`}>
          Start Lab
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </Button>
    </motion.div>
  );
}
