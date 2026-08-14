import { CopyButton } from "./copy-button";

export function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-[var(--site-code)]">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-medium text-[var(--site-muted)]">
          {label}
        </span>
        <CopyButton label={`Copy ${label} example`} value={code} />
      </div>
      <pre className="overflow-x-auto p-5 text-[13px] leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}
