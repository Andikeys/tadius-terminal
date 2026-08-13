import { LABS } from "./labs";
import { DEVOPS_TOOLS } from "./devops-tools";
import { NAV_ITEMS } from "@/components/layout/sidebar-nav-items";

export interface SearchItem {
  id: string;
  label: string;
  description: string;
  href: string;
  category: "Lab" | "Playground" | "Page";
}

// Backs the top-nav global search — every entry here is a real, navigable
// destination (no dead links). Playgrounds all link to /playgrounds itself
// since each one opens as a modal from that grid rather than owning a
// dedicated route.
export const SEARCH_INDEX: SearchItem[] = [
  ...NAV_ITEMS.filter((item) => item.href !== "/").map((item) => ({
    id: item.href,
    label: item.label,
    description: `Go to ${item.label}`,
    href: item.href,
    category: "Page" as const,
  })),
  ...LABS.map((lab) => ({
    id: lab.id,
    label: lab.name,
    description: lab.description,
    href: `/labs/${lab.id}`,
    category: "Lab" as const,
  })),
  ...DEVOPS_TOOLS.map((tool) => ({
    id: tool.id,
    label: tool.playgroundName,
    description: tool.description,
    href: "/playgrounds",
    category: "Playground" as const,
  })),
];
