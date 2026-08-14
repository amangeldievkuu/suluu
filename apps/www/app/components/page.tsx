import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Components",
  description: "Browse the Suluu animated React component collection.",
};

export default function ComponentsPage() {
  return (
    <main
      className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-6 py-20 lg:px-8"
      id="content"
    >
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-[var(--site-muted)]">Library</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Components
        </h1>
        <p className="mt-5 text-lg leading-8 text-[var(--site-muted)]">
          A deliberately small collection of expressive primitives. Each one is
          tested, accessible, and easy to own.
        </p>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2">
        <Link
          className="group rounded-3xl border p-7 transition-colors hover:bg-[var(--site-subtle)] focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/components/notify-morph"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider text-[var(--site-muted)] uppercase">
              Form
            </span>
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </div>
          <h2 className="mt-12 text-2xl font-semibold tracking-tight">
            NotifyMorph
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--site-muted)]">
            A compact notification CTA that opens into a polished, accessible
            email form.
          </p>
        </Link>

        <div className="rounded-3xl border border-dashed p-7 text-[var(--site-muted)]">
          <span className="text-xs font-medium tracking-wider uppercase">
            More soon
          </span>
          <p className="mt-12 text-sm leading-6">
            Suluu grows carefully. New components will earn their place here.
          </p>
        </div>
      </div>
    </main>
  );
}
