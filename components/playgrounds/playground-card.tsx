"use client";

import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DevOpsTool } from "@/lib/devops-tools";

interface PlaygroundCardProps {
  tool: DevOpsTool;
  index: number;
  onLaunch: (tool: DevOpsTool) => void;
}

/**
 * Deliberately minimal: icon, title, description, Launch. Playgrounds is
 * a hands-on sandbox, not a difficulty-gated course — no badges, no
 * metadata clutter, nothing that frames this as a graded tutorial. That
 * framing lives in Labs instead.
 */
export function PlaygroundCard({ tool, index, onLaunch }: PlaygroundCardProps) {
  const Icon = tool.icon;
  const glowStyle = { "--tool-color": tool.color } as React.CSSProperties;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      style={glowStyle}
      className="group glass-panel flex flex-col gap-4 rounded-xl p-5 transition-shadow duration-300 hover:border-tadius-green-500/40 hover:shadow-[0_0_36px_var(--tool-color)]"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-white/10"
        style={{ backgroundColor: tool.color }}
      >
        <Icon className="h-6 w-6 text-white" strokeWidth={2} />
      </div>

      <div className="space-y-1.5">
        <h3 className="font-heading text-base font-semibold text-white">{tool.playgroundName}</h3>
        <p className="font-body text-sm leading-relaxed text-tadius-gray-muted">
          {tool.description}
        </p>
      </div>

      <Button
        className="mt-auto w-full gap-2"
        onClick={() => onLaunch(tool)}
      >
        Launch
        <Rocket className="h-4 w-4" strokeWidth={2} />
      </Button>
    </motion.div>
  );
}
