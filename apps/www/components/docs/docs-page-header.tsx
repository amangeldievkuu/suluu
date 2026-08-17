import Link from "next/link";
import type { ReactNode } from "react";

import { requireEntry, type ComponentSlug } from "@/lib/catalog";

interface DocsPageHeaderProps {
  children: ReactNode;
  slug: ComponentSlug;
}

export function DocsPageHeader({ children, slug }: DocsPageHeaderProps) {
  const entry = requireEntry(slug);

  return (
    <div className="max-w-3xl">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm font-medium text-[var(--site-muted)]">
          <li>
            <Link
              className="rounded hover:text-[var(--site-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/components"
            >
              Components
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>{entry.category}</li>
        </ol>
      </nav>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        {entry.name}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--site-muted)]">
        {children}
      </p>
    </div>
  );
}
