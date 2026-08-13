import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Icon mark only, no wordmark/tagline — used when the sidebar is collapsed. */
  collapsed?: boolean;
}

export function Logo({ className, collapsed = false }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Tadius home"
      className={cn(
        "flex items-center gap-3 rounded-md transition-opacity hover:opacity-80",
        className
      )}
    >
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.45)]"
        aria-hidden="true"
      >
        <path
          d="M20 2 L36 11 V29 L20 38 L4 29 V11 Z"
          fill="rgba(34,197,94,0.12)"
          stroke="#22C55E"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M13 15H27M20 15V27"
          stroke="#22C55E"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <span className="block font-heading text-lg font-bold tracking-tight text-white">
            TADIUS
          </span>
          <span className="block truncate font-body text-[10px] font-medium uppercase tracking-wider text-tadius-green-500/80">
            Forge your infrastructure
          </span>
        </div>
      )}
    </Link>
  );
}
