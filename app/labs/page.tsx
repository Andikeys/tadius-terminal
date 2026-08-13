"use client";

import { LABS } from "@/lib/labs";
import { LabCard } from "@/components/labs/lab-card";

// Client component: LABS entries carry a `icon: LucideIcon` component
// reference, which React Server Components cannot serialize across the
// server/client boundary ("Only plain objects can be passed to Client
// Components..."). Rendering this page entirely client-side keeps the
// data and the LabCard that consumes it on the same side of that
// boundary — there's no async server data-fetching here to lose by doing
// so, LABS is a static in-memory array either way.

export default function LabsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="space-y-1.5">
        <h1 className="flex items-baseline font-heading text-2xl font-bold text-white sm:text-3xl">
          Labs
          <span
            aria-hidden="true"
            className="ml-1.5 inline-block h-6 w-[3px] animate-caret-blink bg-tadius-green-500 sm:h-7"
          />
        </h1>
        <p className="font-body text-sm font-medium text-tadius-green-500">
          The academy — guided lessons, checkpoints, and a real terminal to practice in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {LABS.map((lab, i) => (
          <LabCard key={lab.id} lab={lab} index={i} />
        ))}
      </div>
    </div>
  );
}
