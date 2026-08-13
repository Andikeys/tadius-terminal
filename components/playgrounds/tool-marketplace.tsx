"use client";

import { Check, Download, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MARKETPLACE_TOOLS } from "@/lib/marketplace-tools";

interface ToolMarketplaceProps {
  onInstall: (command: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Clicking Install doesn't call a dedicated backend route — it sends the
 * real install command straight into the currently open shell session,
 * exactly as if the user had typed it. That keeps this panel purely a
 * frontend convenience: no extra API surface, and output streams into
 * the terminal the same way any other command's output would.
 */
export function ToolMarketplace({ onInstall, disabled, className }: ToolMarketplaceProps) {
  return (
    <div className={cn("flex flex-col overflow-hidden border-l border-white/[0.06]", className)}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <Store className="h-4 w-4 text-tadius-green-500" strokeWidth={2} />
        <span className="font-heading text-xs font-semibold uppercase tracking-wide text-tadius-gray-muted">
          Tool Marketplace
        </span>
      </div>

      <div className="scrollbar-tadius flex-1 space-y-2 overflow-y-auto p-3">
        {MARKETPLACE_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] p-2.5"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: tool.color }}
              >
                <Icon className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <span className="flex-1 truncate font-body text-xs text-white">{tool.name}</span>
              {tool.preinstalled ? (
                <span className="flex items-center gap-1 font-mono text-[10px] text-tadius-green-500">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  Included
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={() => onInstall(tool.command)}
                >
                  <Download className="h-3 w-3" strokeWidth={2} />
                  Install
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
