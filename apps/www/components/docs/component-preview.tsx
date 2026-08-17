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
        <span className="text-xs text-[var(--site-muted)]">{hint}</span>
      </div>
      <div className="flex min-h-96 items-center justify-center rounded-3xl border bg-white p-8 dark:bg-[var(--site-background)]">
        {children}
      </div>
    </section>
  );
}
