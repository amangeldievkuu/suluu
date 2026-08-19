import Link from "next/link";

import { COMPONENT_PREVIEWS } from "@/components/demos/previews";
import {
  componentHref,
  type CatalogEntry,
  type ComponentSlug,
} from "@/lib/catalog";

interface ComponentCardProps {
  entry: CatalogEntry;
}

const PREVIEW_HINTS: Record<ComponentSlug, string> = {
  "counter-numbers": "Change the value",
  "magnet-pull": "Move your cursor",
  "morph-button": "Hover or focus",
  "notify-morph": "Open the form",
  "search-morph": "Start a search",
  "segmented-control": "Choose a range",
  "switch-toggle": "Tap or drag",
};

export function ComponentCard({ entry }: ComponentCardProps) {
  const slug = entry.slug as ComponentSlug;
  const Preview = COMPONENT_PREVIEWS[slug];

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border bg-[var(--site-background)] transition-[border-color,box-shadow,background-color] duration-300 hover:border-[color-mix(in_oklch,var(--site-border),var(--site-foreground)_16%)] hover:bg-[var(--site-subtle)] hover:shadow-[0_18px_48px_oklch(0.15_0.02_260/0.07)] motion-reduce:transition-none dark:hover:shadow-[0_20px_52px_oklch(0_0_0/0.22)]">
      {/*
        The preview is live and interactive, so it must not sit inside the
        link — a button inside an anchor is invalid and breaks both. The
        component name below is the link instead.
      */}
      <div className="relative isolate flex flex-1 items-center justify-center overflow-hidden border-b bg-[var(--site-background)] px-6 py-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_54%,var(--site-subtle),transparent_68%)] opacity-65 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
        />
        <span className="absolute top-4 left-5 inline-flex items-center gap-2 text-[10px] font-medium tracking-wide text-[var(--site-muted)]">
          <span
            aria-hidden="true"
            className="size-1 rounded-full bg-current opacity-60"
          />
          {PREVIEW_HINTS[slug]}
        </span>
        <Preview compact />
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium tracking-wider text-[var(--site-muted)] uppercase">
            {entry.category}
          </span>
          <span
            aria-hidden="true"
            className="text-[var(--site-muted)] transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-tight">
          <Link
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-4"
            href={componentHref(entry.slug)}
          >
            {entry.name}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
          {entry.summary}
        </p>
      </div>
    </article>
  );
}
