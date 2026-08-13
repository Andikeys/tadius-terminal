import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class names (clsx) and then dedupes conflicting
 * Tailwind utility classes (twMerge). Standard shadcn/ui helper — every
 * component in components/ui and components/* built on top of it so
 * consumers can override styles via a `className` prop safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
