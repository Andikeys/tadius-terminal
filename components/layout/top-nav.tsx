"use client";

import { Bell, Menu, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";
import { useUserStore } from "@/store/user-store";
import { useAuthModalStore } from "@/store/auth-modal-store";

interface TopNavProps {
  onMenuClick: () => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const openAuthModal = useAuthModalStore((s) => s.open);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-tadius-black/60 px-4 backdrop-blur-xl lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-tadius-green-500 shadow-glow-sm" />
        </Button>

        {isAuthenticated && user ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
          </Avatar>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAuthModal("sign-in")}
            className="gap-1.5 rounded-full border-tadius-green-500/40 text-tadius-green-500 hover:border-tadius-green-500/70 hover:bg-tadius-green-500/10"
          >
            <UserRound className="h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
