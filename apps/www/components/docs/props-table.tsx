import type { ReactNode } from "react";

/** `[name, type, default, description]`. */
export type PropRow = readonly [string, string, string, string];

interface PropsTableProps {
  children: ReactNode;
  rows: readonly PropRow[];
  /** Anchor id, so a page with two tables keeps them addressable. */
  id?: string;
  title?: string;
}

export function PropsTable({
  children,
  id = "props",
  rows,
  title = "Props",
}: PropsTableProps) {
  return (
    <section className="scroll-mt-24" id={id}>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
        {children}
      </p>
      <div className="mt-6 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead className="bg-[var(--site-subtle)] text-xs text-[var(--site-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Prop</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Default</th>
              <th className="px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, type, defaultValue, description]) => (
              <tr className="border-t" key={name}>
                <td className="px-4 py-3 font-mono text-xs">{name}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--site-muted)]">
                  {type}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--site-muted)]">
                  {defaultValue}
                </td>
                <td className="px-4 py-3 text-[var(--site-muted)]">
                  {description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
