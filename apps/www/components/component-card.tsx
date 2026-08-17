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

export function ComponentCard({ entry }: ComponentCardProps) {
  const Preview = COMPONENT_PREVIEWS[entry.slug as ComponentSlug];

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border transition-colors hover:bg-[var(--site-subtle)]">
      {/*
        The preview is live and interactive, so it must not sit inside the
        link — a button inside an anchor is invalid and breaks both. The
        component name below is the link instead.
      */}
      <div className="flex flex-1 items-center justify-center border-b bg-[var(--site-background)] px-6 py-10">
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
