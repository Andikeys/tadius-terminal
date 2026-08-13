"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Grid2x2 } from "lucide-react";

import { DEVOPS_TOOLS, type DevOpsTool } from "@/lib/devops-tools";

// Every icon here launches the same tool's card on /playgrounds, the real
// launch surface — clicking a dock icon and clicking its Playground card
// lead to the same place.
export function DevOpsDock() {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {DEVOPS_TOOLS.map((tool) => (
          <DockItem key={tool.id} tool={tool} />
        ))}
        <Link
          href="/playgrounds"
          className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-white/[0.04]"
        >
          <motion.div
            whileHover={{ y: -4, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 350, damping: 18 }}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-tadius-gray-soft ring-1 ring-white/10 group-hover:text-white group-hover:shadow-glow-sm"
          >
            <Grid2x2 className="h-5 w-5" strokeWidth={1.75} />
          </motion.div>
          <span className="font-body text-[11px] text-tadius-gray-muted group-hover:text-white">
            More
          </span>
        </Link>
      </div>
    </div>
  );
}

function DockItem({ tool }: { tool: DevOpsTool }) {
  const Icon = tool.icon;
  // Custom property isn't part of React's CSSProperties type — cast once,
  // here, instead of sprinkling ts-expect-error comments at the call site.
  const glowStyle = { "--tool-color": tool.color } as React.CSSProperties;

  return (
    <Link
      href="/playgrounds"
      className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-white/[0.04]"
    >
      <motion.div
        whileHover={{ y: -4, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 350, damping: 18 }}
        style={glowStyle}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/10 transition-shadow duration-200 group-hover:shadow-[0_0_18px_var(--tool-color)]"
      >
        <Icon className="h-5 w-5" style={{ color: tool.color }} strokeWidth={1.75} />
      </motion.div>
      <span className="font-body text-[11px] text-tadius-gray-muted group-hover:text-white">
        {tool.dockLabel}
      </span>
    </Link>
  );
}
