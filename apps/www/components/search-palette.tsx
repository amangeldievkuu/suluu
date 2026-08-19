"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useSearch } from "@/components/search-provider";
import { componentHref, searchCatalog } from "@/lib/catalog";

export function SearchPalette() {
  const { close, isOpen, open, triggerRef } = useSearch();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const optionIdPrefix = useId();

  const results = useMemo(() => searchCatalog(query), [query]);
  const activeEntry = results[activeIndex];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Password managers, autofill, and extensions dispatch synthetic keydown
      // events with no key at all, despite what the DOM types promise. Compare
      // the value instead of calling a method on it so those cannot crash us.
      if (event.key !== "k" && event.key !== "K") return;
      if (!(event.metaKey || event.ctrlKey)) return;

      event.preventDefault();
      open();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Drive the native dialog from React state. showModal() is what gives us the
  // focus trap, Escape handling, and top-layer stacking for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setQuery("");
      setActiveIndex(0);
      dialog.showModal();
      // showModal picks a focus target heuristically; be explicit so typing
      // always lands in the query field.
      inputRef.current?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function handleClose() {
    close();
    triggerRef.current?.focus();
  }

  function navigateTo(slug: string) {
    router.push(componentHref(slug));
    handleClose();
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeEntry) navigateTo(activeEntry.slug);
    }
  }

  return (
    <dialog
      aria-label="Search components"
      className="m-0 w-full max-w-xl rounded-2xl border bg-[var(--site-background)] p-0 text-[var(--site-foreground)] backdrop:bg-black/40 backdrop:backdrop-blur-sm open:fixed open:top-[12vh] open:left-1/2 open:-translate-x-1/2"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) handleClose();
      }}
      ref={dialogRef}
    >
      <div className="flex items-center gap-3 border-b px-4">
        <svg
          aria-hidden="true"
          className="size-4 shrink-0 text-[var(--site-muted)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          aria-activedescendant={
            activeEntry ? `${optionIdPrefix}-${activeEntry.slug}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded
          aria-label="Search components"
          autoComplete="off"
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-[var(--site-muted)]"
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search components…"
          ref={inputRef}
          role="combobox"
          type="text"
          value={query}
        />
      </div>

      {results.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-[var(--site-muted)]">
          No components match “{query}”.
        </p>
      ) : (
        <ul
          aria-label="Component results"
          className="max-h-80 overflow-y-auto p-2"
          id={listId}
          role="listbox"
        >
          {results.map((entry, index) => {
            const isActive = index === activeIndex;

            return (
              <li
                aria-selected={isActive}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
                  isActive ? "bg-[var(--site-subtle)]" : ""
                }`}
                id={`${optionIdPrefix}-${entry.slug}`}
                key={entry.slug}
                onClick={() => {
                  navigateTo(entry.slug);
                }}
                onMouseEnter={() => {
                  setActiveIndex(index);
                }}
                role="option"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {entry.name}
                  </span>
                  <span className="block truncate text-xs text-[var(--site-muted)]">
                    {entry.summary}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] text-[var(--site-muted)]">
                  {entry.category}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex items-center gap-4 border-t px-4 py-2.5 text-[11px] text-[var(--site-muted)]">
        <span>↑↓ to navigate</span>
        <span>↵ to open</span>
        <span>esc to close</span>
      </p>
    </dialog>
  );
}
