import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FlaskConical,
  TerminalSquare,
  Trophy,
  TrendingUp,
  Bookmark,
  Users,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Single source of truth for sidebar links — shared by desktop rail and
// mobile drawer so the two never drift out of sync.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Labs", href: "/labs", icon: FlaskConical },
  { label: "Playgrounds", href: "/playgrounds", icon: TerminalSquare },
  { label: "Challenges", href: "/challenges", icon: Trophy },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "Community", href: "/community", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];
