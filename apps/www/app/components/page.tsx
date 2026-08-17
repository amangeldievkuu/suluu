import type { Metadata } from "next";

import { ComponentCard } from "@/components/component-card";
import { CATALOG, groupByCategory } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Components",
  description: "Browse the Suluu animated React component collection.",
};

const groups = groupByCategory();

export default function ComponentsPage() {
  return (
    <main className="min-h-[calc(100vh-8rem)] py-20" id="content">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-[var(--site-muted)]">Library</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Components
        </h1>
        <p className="mt-5 text-lg leading-8 text-[var(--site-muted)]">
          A deliberately small collection of expressive primitives. Each one is
          tested, accessible, and easy to own. Every preview below is the real
          component — try them.
        </p>
        <p className="mt-4 text-sm text-[var(--site-muted)]">
          {CATALOG.length} components · press{" "}
          <kbd className="rounded border px-1.5 py-0.5 font-sans text-[11px]">
            ⌘K
          </kbd>{" "}
          to search
        </p>
      </div>

      {groups.map((group) => (
        <section
          aria-labelledby={`category-${group.category}`}
          className="mt-16"
          key={group.category}
        >
          <h2
            className="text-xs font-medium tracking-wider text-[var(--site-muted)] uppercase"
            id={`category-${group.category}`}
          >
            {group.category}
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {group.entries.map((entry) => (
              <ComponentCard entry={entry} key={entry.slug} />
            ))}
          </div>
        </section>
      ))}

      <div className="mt-16 rounded-3xl border border-dashed p-7 text-[var(--site-muted)]">
        <span className="text-xs font-medium tracking-wider uppercase">
          More soon
        </span>
        <p className="mt-3 max-w-md text-sm leading-6">
          Suluu grows carefully. New components will earn their place here.
        </p>
      </div>
    </main>
  );
}
