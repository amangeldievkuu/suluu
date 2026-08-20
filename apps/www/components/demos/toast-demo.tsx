"use client";

import { useState } from "react";
import { createToaster } from "suluu/toast";

import type { DemoProps } from "./types";

/**
 * Its own instance, so the docs previews never share a queue with each other
 * or with anything an app running this page might raise.
 */
const { Toaster, toast } = createToaster();

const EXAMPLES = [
  {
    label: "Success",
    fire: () =>
      toast.success("Draft saved", { description: "Synced a moment ago." }),
  },
  {
    label: "Error",
    fire: () =>
      toast.error("Upload failed", {
        action: { label: "Retry", onClick: () => toast.success("Uploaded") },
        description: "cover.png was larger than 8 MB.",
      }),
  },
  {
    label: "Warning",
    fire: () =>
      toast.warning("Storage almost full", { description: "92% of 10 GB." }),
  },
  {
    label: "Info",
    fire: () => toast.info("2 people joined the workspace"),
  },
  {
    label: "With action",
    fire: () =>
      toast("Note moved to trash", {
        action: {
          label: "Undo",
          onClick: () => toast.success("Note restored"),
        },
      }),
  },
] as const;

const BUTTON_CLASS =
  "inline-flex h-8 items-center rounded-full border px-3.5 text-xs font-medium text-[var(--site-muted)] transition-colors hover:bg-[var(--site-subtle)] hover:text-[var(--site-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2";

export function ToastDemo({ compact = false }: DemoProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const examples = compact ? EXAMPLES.slice(0, 3) : EXAMPLES;

  return (
    <div
      className={`relative z-10 w-full ${compact ? "min-h-40" : "min-h-[32rem]"}`}
      ref={setHost}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        {examples.map((example) => (
          <button
            className={BUTTON_CLASS}
            key={example.label}
            onClick={example.fire}
            type="button"
          >
            {example.label}
          </button>
        ))}
        {compact ? null : (
          <button
            className={BUTTON_CLASS}
            onClick={() => {
              toast.success("Draft saved", { duration: Infinity });
              toast.info("2 people joined the workspace", {
                duration: Infinity,
              });
              toast("Note moved to trash", { duration: Infinity });
              toast.warning("Storage almost full", { duration: Infinity });
              toast.error("Upload failed", { duration: Infinity });
              toast("Invite sent to Maya", { duration: Infinity });
            }}
            type="button"
          >
            Stack six
          </button>
        )}
      </div>
      <Toaster container={host} position="bottom-right" />
    </div>
  );
}
