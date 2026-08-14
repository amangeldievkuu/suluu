"use client";

import { useState } from "react";

export function CopyButton({
  label = "Copy",
  value,
}: {
  label?: string;
  value: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }

    window.setTimeout(() => setStatus("idle"), 1600);
  }

  const visibleLabel =
    status === "copied" ? "Copied" : status === "failed" ? "Try again" : label;

  return (
    <button
      aria-label={`${label}: ${value}`}
      className="shrink-0 rounded-xl border bg-[var(--site-background)] px-3 py-2 text-xs font-medium hover:bg-[var(--site-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2"
      onClick={() => void copy()}
      type="button"
    >
      <span aria-live="polite">{visibleLabel}</span>
    </button>
  );
}
