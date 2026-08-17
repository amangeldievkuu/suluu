import type { ReactNode } from "react";

/** `[variable, description]`. */
export type CssVariableRow = readonly [string, string];

interface CssVariablesTableProps {
  children?: ReactNode;
  rows: readonly CssVariableRow[];
}

export function CssVariablesTable({ children, rows }: CssVariablesTableProps) {
  return (
    <section className="scroll-mt-24" id="theming">
      <h2 className="text-2xl font-semibold tracking-tight">Theming</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
        Override these variables in your light and dark theme scopes. The
        registry installs the defaults automatically.
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border">
        {rows.map(([name, description]) => (
          <div
            className="grid gap-1 border-t px-4 py-3 first:border-t-0 sm:grid-cols-[17rem_1fr]"
            key={name}
          >
            <code className="text-xs">{name}</code>
            <span className="text-sm text-[var(--site-muted)]">
              {description}
            </span>
          </div>
        ))}
      </div>
      {children}
    </section>
  );
}
