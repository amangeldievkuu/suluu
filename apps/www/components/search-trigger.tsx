"use client";

import { useSearch } from "@/components/search-provider";

export function SearchTrigger() {
  const { open, triggerRef } = useSearch();

  return (
    <button
      className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm text-[var(--site-muted)] transition-colors hover:bg-[var(--site-subtle)] hover:text-[var(--site-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2"
      onClick={open}
      ref={triggerRef}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <span className="hidden sm:inline">Search components</span>
      <span className="sr-only sm:hidden">Search components</span>
      <kbd
        aria-hidden="true"
        className="hidden rounded border px-1.5 py-0.5 font-sans text-[11px] sm:inline"
      >
        ⌘K
      </kbd>
    </button>
  );
}
