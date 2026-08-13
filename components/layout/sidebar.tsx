"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/sidebar-nav-items";
import { Logo } from "@/components/layout/logo";
import { UserProfileCard } from "@/components/layout/user-profile-card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

interface SidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapsed?: () => void;
}

function SidebarContent({ collapsed = false, onNavigate, onToggleCollapsed }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col gap-6 p-4">
        <div
          className={cn(
            "flex gap-2 pt-1",
            collapsed ? "flex-col items-center" : "items-center"
          )}
        >
          {onToggleCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-tadius-gray-muted transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Menu className="h-5 w-5" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          )}
          <Logo collapsed={collapsed} className={collapsed ? "px-0" : "px-1"} />
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm font-medium transition-colors duration-150",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-tadius-green-500/10 text-tadius-green-500"
                    : "text-tadius-gray-soft hover:bg-white/[0.05] hover:text-white"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-tadius-green-500 shadow-glow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <UserProfileCard collapsed={collapsed} />

        {!collapsed && (
          <p className="text-center font-body text-[11px] text-tadius-gray-dim">
            © {new Date().getFullYear()} Tadius. All rights reserved.
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Desktop: fixed rail, collapsible between full (labels) and icon-only
 * width via `collapsed` (persisted to localStorage by AppShell).
 * Mobile: slide-over drawer, always full-width when open — "collapsed"
 * on mobile just means the drawer starts closed, which it already does.
 */
export function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-tadius-green-500/[0.15] bg-tadius-black/60 shadow-[4px_0_28px_rgba(34,197,94,0.05)] backdrop-blur-xl transition-[width] duration-300 ease-in-out lg:block",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="relative z-10 h-full w-72 border-r border-tadius-green-500/[0.15] bg-tadius-black"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3"
              onClick={onMobileClose}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
            <SidebarContent onNavigate={onMobileClose} />
          </motion.aside>
        </div>
      )}
    </>
  );
}
