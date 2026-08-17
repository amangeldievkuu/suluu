"use client";

import { useState } from "react";
import { CounterNumbers } from "suluu/counter-numbers";

import type { DemoProps } from "./types";

const STEP = 137;

export function CounterNumbersDemo({ compact = false }: DemoProps) {
  const [value, setValue] = useState(1284);

  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-24"
      }`}
    >
      <div className="flex items-center gap-3 rounded-full border bg-[var(--site-background)] p-1 shadow-sm">
        <button
          aria-label={`Decrease by ${String(STEP)}`}
          className="inline-flex size-8 items-center justify-center rounded-full text-base text-[var(--site-muted)] transition-colors hover:bg-[var(--site-subtle)] hover:text-[var(--site-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => setValue((current) => current - STEP)}
          type="button"
        >
          −
        </button>
        <CounterNumbers
          aria-live="polite"
          className="min-w-[5ch] text-center text-2xl font-semibold tracking-[-0.03em]"
          value={value}
        />
        <button
          aria-label={`Increase by ${String(STEP)}`}
          className="inline-flex size-8 items-center justify-center rounded-full text-base text-[var(--site-muted)] transition-colors hover:bg-[var(--site-subtle)] hover:text-[var(--site-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => setValue((current) => current + STEP)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}
