import { CopyButton } from "./copy-button";

export function CopyCommand({ command }: { command: string }) {
  return (
    <div className="flex max-w-full items-center gap-3 rounded-2xl border bg-[var(--site-code)] p-2 pl-4">
      <code className="min-w-0 flex-1 overflow-x-auto py-1 text-xs whitespace-nowrap text-[var(--site-muted)]">
        {command}
      </code>
      <CopyButton label="Copy command" value={command} />
    </div>
  );
}
