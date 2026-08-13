"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

import { LABS } from "@/lib/labs";
import { LabCard } from "@/components/labs/lab-card";
import { useBookmarksStore } from "@/store/bookmarks-store";

/** Reads real bookmark state from useBookmarksStore — the star toggle
 * lives on each LabCard, this page is just a filtered view of the same
 * data, not a separate fake list. */
export function BookmarksOverview() {
  const labIds = useBookmarksStore((s) => s.labIds);
  const [mounted, setMounted] = useState(false);

  // Same hydration-safety pattern as ProgressOverview: persisted zustand
  // state resolves after mount, so wait one frame before trusting it.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel h-48 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const bookmarkedLabs = LABS.filter((lab) => labIds.includes(lab.id));

  if (bookmarkedLabs.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center gap-3 rounded-xl p-12 text-center">
        <Bookmark className="h-8 w-8 text-tadius-gray-muted" strokeWidth={1.5} />
        <p className="font-body text-sm text-tadius-gray-muted">
          No bookmarks yet. Tap the bookmark icon on any Lab card to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {bookmarkedLabs.map((lab, i) => (
        <LabCard key={lab.id} lab={lab} index={i} />
      ))}
    </div>
  );
}
