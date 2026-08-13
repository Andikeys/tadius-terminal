"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { SEARCH_INDEX } from "@/lib/search-index";

/**
 * Real search — filters SEARCH_INDEX (Labs, Playgrounds, and every other
 * page) client-side and navigates on select. Previously this input had no
 * onChange handler at all; it was purely decorative.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K focuses search, Escape closes it — the visible ⌘K badge is
  // a promise to the user, so it has to actually work.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    ).slice(0, 7);
  }, [query]);

  function go(href: string) {
    router.push(href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full transition-[max-width] duration-300 ease-out",
        isFocused ? "max-w-xl" : "max-w-md"
      )}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tadius-gray-muted" />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search labs, playgrounds, pages..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setIsFocused(true);
          if (query.trim()) setOpen(true);
        }}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0].href);
        }}
        className={cn(
          "h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-10 pr-14 font-body text-sm text-white placeholder:text-tadius-gray-muted transition-shadow duration-300 focus:border-tadius-green-500/60 focus:outline-none focus:ring-2 focus:ring-tadius-green-500/30",
          isFocused && "shadow-glow-md"
        )}
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] font-medium text-tadius-gray-muted">
        &#8984;K
      </kbd>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-lg border border-white/[0.08] bg-tadius-black/95 shadow-panel backdrop-blur-xl">
          {results.length === 0 ? (
            <p className="px-4 py-3 font-body text-sm text-tadius-gray-muted">
              No results for &quot;{query}&quot;
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto scrollbar-tadius py-1">
              {results.map((item) => (
                <li key={`${item.category}-${item.id}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(item.href)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-body text-sm text-white">
                        {item.label}
                      </span>
                      <span className="block truncate font-body text-xs text-tadius-gray-muted">
                        {item.description}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-tadius-green-500">
                      {item.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
