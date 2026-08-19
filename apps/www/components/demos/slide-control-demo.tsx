"use client";

import { useState } from "react";
import { CounterNumbers } from "suluu/counter-numbers";
import { SlideControl } from "suluu/slide-control";

import type { DemoProps } from "./types";

export function SlideControlDemo({ compact = false }: DemoProps) {
  const [value, setValue] = useState(64);

  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-24"
      }`}
    >
      <div className="flex w-full max-w-xs items-center gap-4">
        <SlideControl
          aria-label="Volume"
          onValueChange={setValue}
          value={value}
        />
        <CounterNumbers
          aria-hidden="true"
          className="w-8 text-right text-sm font-medium text-[var(--site-muted)] tabular-nums"
          value={value}
        />
      </div>
    </div>
  );
}
