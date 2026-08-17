"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import { componentHref, groupByCategory } from "@/lib/catalog";

const groups = groupByCategory();

export function ComponentsSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();

  return (
    <div className="lg:sticky lg:top-24 lg:self-start lg:py-20">
      <button
        aria-controls={listId}
        aria-expanded={isOpen}
        className="mt-6 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--site-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        type="button"
      >
        Browse components
        <svg
          aria-hidden="true"
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <nav
        aria-label="Components"
        className={`${isOpen ? "block" : "hidden"} pt-6 lg:block lg:pt-0`}
        id={listId}
      >
        {groups.map((group) => (
          <div className="mb-7 last:mb-0" key={group.category}>
            <p className="mb-2 px-3 text-xs font-medium tracking-wider text-[var(--site-muted)] uppercase">
              {group.category}
            </p>
            <ul>
              {group.entries.map((entry) => {
                const href = componentHref(entry.slug);
                const isActive = pathname === href;

                return (
                  <li key={entry.slug}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                        isActive
                          ? "bg-[var(--site-subtle)] font-medium text-[var(--site-foreground)]"
                          : "text-[var(--site-muted)] hover:text-[var(--site-foreground)]"
                      }`}
                      href={href}
                      onClick={() => {
                        setIsOpen(false);
                      }}
                    >
                      {entry.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="mt-7 px-3 text-xs leading-5 text-[var(--site-muted)]">
          More soon. Suluu grows carefully.
        </p>
      </nav>
    </div>
  );
}
