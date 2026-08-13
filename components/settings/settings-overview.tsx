"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, RotateCcw, ShieldAlert } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUserStore } from "@/store/user-store";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useSettingsStore } from "@/store/settings-store";
import { useProgressStore } from "@/store/progress-store";
import { useBookmarksStore } from "@/store/bookmarks-store";
import { useUserStats } from "@/hooks/use-user-stats";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SettingsRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0 space-y-0.5">
        <p className="font-body text-sm text-white">{label}</p>
        <p className="font-body text-xs text-tadius-gray-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

/**
 * Every control here is genuinely wired: profile fields read the real
 * session, notification toggles persist to localStorage, sign out and
 * reset progress both call the real store actions — nothing decorative.
 * There's no account-editing backend yet (name/avatar are read-only), and
 * this doesn't pretend otherwise.
 */
export function SettingsOverview() {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const signOut = useUserStore((s) => s.signOut);
  const openAuthModal = useAuthModalStore((s) => s.open);

  const sessionReminders = useSettingsStore((s) => s.sessionReminders);
  const setSessionReminders = useSettingsStore((s) => s.setSessionReminders);
  const productUpdates = useSettingsStore((s) => s.productUpdates);
  const setProductUpdates = useSettingsStore((s) => s.setProductUpdates);

  const resetProgress = useProgressStore((s) => s.resetAll);
  const clearBookmarks = useBookmarksStore((s) => s.clearAll);
  const stats = useUserStats();

  const [mounted, setMounted] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-panel h-24 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="glass-panel flex flex-col items-center gap-3 rounded-xl p-12 text-center">
        <p className="font-body text-sm text-tadius-gray-muted">
          Sign in to manage your settings.
        </p>
        <Button size="sm" onClick={() => openAuthModal("sign-in")}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-tadius-gray-muted">
          Profile
        </h2>
        <div className="glass-panel flex items-center gap-4 rounded-xl p-5">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-base">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-base font-semibold text-white">{user.name}</p>
            <p className="font-mono text-sm text-tadius-gray-muted">@{user.username}</p>
            {user.email && (
              <p className="truncate font-body text-xs text-tadius-gray-dim">{user.email}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-tadius-green-500/15 px-2.5 py-1 ring-1 ring-tadius-green-500/30">
            <span className="font-heading text-xs font-bold text-tadius-green-500">
              LVL {stats.level}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-1.5 font-heading text-sm font-semibold uppercase tracking-wide text-tadius-gray-muted">
          <Bell className="h-3.5 w-3.5" strokeWidth={2} />
          Notifications
        </h2>
        <div className="glass-panel divide-y divide-white/[0.06] overflow-hidden rounded-xl">
          <SettingsRow
            label="Session reminders"
            description="Notify me if a launched environment has been idle for a while."
            checked={sessionReminders}
            onCheckedChange={setSessionReminders}
          />
          <SettingsRow
            label="Product updates"
            description="Occasional emails about new labs and playgrounds."
            checked={productUpdates}
            onCheckedChange={setProductUpdates}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-tadius-gray-muted">
          Session
        </h2>
        <div className="glass-panel rounded-xl p-4">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => signOut()}>
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
            Sign Out
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-1.5 font-heading text-sm font-semibold uppercase tracking-wide text-red-400">
          <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} />
          Danger Zone
        </h2>
        <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-xl border-red-500/20 p-4">
          <div className="space-y-0.5">
            <p className="font-body text-sm text-white">Reset all progress</p>
            <p className="font-body text-xs text-tadius-gray-muted">
              Clears launch counts, time spent, checkpoints, and bookmarks. Doesn't touch any
              running environment.
            </p>
          </div>
          <Button
            variant={confirmingReset ? "destructive" : "outline"}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => {
              if (!confirmingReset) {
                setConfirmingReset(true);
                return;
              }
              resetProgress();
              clearBookmarks();
              setConfirmingReset(false);
            }}
            onBlur={() => setConfirmingReset(false)}
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            {confirmingReset ? "Click again to confirm" : "Reset Progress"}
          </Button>
        </div>
      </section>
    </div>
  );
}
