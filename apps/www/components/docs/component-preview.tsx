import type { ReactNode } from "react";

interface ComponentPreviewProps {
  children: ReactNode;
  /** Short note on the right, e.g. how to interact with the demo. */
  hint?: string;
}

export function ComponentPreview({
  children,
  hint = "Interactive",
}: ComponentPreviewProps) {
  return (
    <section aria-labelledby="preview-title" className="mt-16">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium" id="preview-title">
          Preview
        </h2>
        <span className="inline-flex items-center gap-2 text-xs text-[var(--site-muted)]">
          <span
            aria-hidden="true"
            className="size-1 rounded-full bg-current opacity-60"
          />
          {hint}
        </span>
      </div>
      <div className="relative isolate flex min-h-[26rem] items-center justify-center overflow-hidden rounded-[2rem] border bg-white p-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.7)] sm:p-12 dark:bg-[oklch(0.12_0.008_260)] dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_46%,var(--site-subtle),transparent_66%)] opacity-80"
        />
        <div className="relative z-10 flex w-full items-center justify-center">
          {children}
        </div>
      </div>
    </section>
  );
}
