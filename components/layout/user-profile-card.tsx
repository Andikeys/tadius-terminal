"use client";

import { Flame, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserStore } from "@/store/user-store";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useUserStats } from "@/hooks/use-user-stats";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface UserProfileCardProps {
  /** Icon-only variant for the collapsed sidebar rail. */
  collapsed?: boolean;
}

/**
 * Bottom-of-sidebar identity slot. Two real states, no loading skeleton
 * needed here since sign-in is an explicit user action, not a fetch race:
 *
 *  - Guest (default): lock icon, sign-in prompt, Sign In / Register CTAs.
 *  - Authenticated: avatar, level badge, XP bar, streak — all computed
 *    live from real progress-store activity via useUserStats(), never
 *    seeded numbers.
 *
 * Both branches read exclusively from useUserStore / useUserStats, so
 * wiring real OAuth / session persistence later only touches those, never
 * this component.
 */
export function UserProfileCard({ collapsed = false }: UserProfileCardProps) {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);
  const openAuthModal = useAuthModalStore((s) => s.open);
  // Called unconditionally (Rules of Hooks) even though the guest branch
  // below doesn't use it — it's cheap (a couple of store reads + a sum
  // over LABS) and keeps this component's hook order stable regardless of
  // auth state.
  const stats = useUserStats();

  if (!isAuthenticated || !user) {
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => openAuthModal("sign-in")}
              disabled={isLoading}
              aria-label="Sign in to Tadius"
              className="glass-panel mx-auto flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-tadius-green-500/30 transition-colors hover:bg-tadius-green-500/10"
            >
              <Lock className="h-5 w-5 text-tadius-green-500" strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Sign in to Tadius</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div className="glass-panel flex flex-col items-center gap-3 rounded-xl p-4 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tadius-green-500/10 ring-1 ring-tadius-green-500/30">
          <Lock className="h-5 w-5 text-tadius-green-500" strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <p className="font-heading text-sm font-semibold text-white">
            Welcome to Tadius
          </p>
          <p className="font-body text-xs leading-relaxed text-tadius-gray-muted">
            Sign in or register to save your progress, earn XP and unlock
            all labs.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Button
            size="sm"
            className="w-full"
            disabled={isLoading}
            onClick={() => openAuthModal("sign-in")}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isLoading}
            onClick={() => openAuthModal("sign-up")}
          >
            Register
          </Button>
        </div>
      </div>
    );
  }

  const xpPercent = Math.min(100, Math.round((stats.xp / stats.xpToNextLevel) * 100));

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mx-auto flex flex-col items-center gap-1">
            <Avatar className="ring-2 ring-tadius-green-500/40">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="font-heading text-[9px] font-bold text-tadius-green-500">
              LVL {stats.level}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          {user.name} · {stats.xp.toLocaleString()} XP · {stats.dayStreak} day streak
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-white">
            {user.name}
          </p>
          <p className="truncate font-mono text-xs text-tadius-gray-muted">
            @{user.username}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-tadius-green-500/15 px-2 py-1 ring-1 ring-tadius-green-500/30">
          <span className="font-heading text-[11px] font-bold text-tadius-green-500">
            LVL {stats.level}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between font-mono text-[11px] text-tadius-gray-muted">
          <span>{stats.xp.toLocaleString()} XP</span>
          <span>{stats.xpToNextLevel.toLocaleString()} XP</span>
        </div>
        <Progress value={xpPercent} />
      </div>

      <div className="flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5 font-mono text-xs text-tadius-gray-soft">
        <Flame className="h-3.5 w-3.5 text-tadius-green-500" />
        <span className="font-semibold text-white">{stats.dayStreak}</span>
        <span className="text-tadius-gray-muted">day streak</span>
      </div>
    </div>
  );
}
