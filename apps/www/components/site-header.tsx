import Link from "next/link";

import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-[color:var(--site-background)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link className="text-lg font-semibold tracking-[-0.03em]" href="/">
          Suluu
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-3">
          <Link
            className="rounded-full px-3 py-2 text-sm text-[var(--site-muted)] hover:text-[var(--site-foreground)] focus-visible:outline-2"
            href="/components"
          >
            Components
          </Link>
          <a
            className="rounded-full px-3 py-2 text-sm text-[var(--site-muted)] hover:text-[var(--site-foreground)] focus-visible:outline-2"
            href="https://github.com/suluu-dev/suluu"
            rel="noreferrer"
            target="_blank"
          >
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
