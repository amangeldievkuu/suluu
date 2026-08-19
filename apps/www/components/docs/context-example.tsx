import type { ReactNode } from "react";

interface ContextExampleProps {
  children: ReactNode;
  description: string;
}

export function ContextExample({ children, description }: ContextExampleProps) {
  return (
    <section className="mt-12" aria-labelledby="in-context-title">
      <h3 className="text-sm font-medium" id="in-context-title">
        In context
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--site-muted)]">
        {description}
      </p>
      <div className="relative isolate mt-5 overflow-hidden rounded-2xl border bg-white p-6 sm:p-8 dark:bg-[oklch(0.12_0.008_260)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,var(--site-subtle),transparent_66%)] opacity-70"
        />
        {children}
      </div>
    </section>
  );
}
