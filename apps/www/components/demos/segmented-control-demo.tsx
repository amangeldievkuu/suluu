"use client";

import { useState } from "react";
import { SegmentedControl } from "suluu/segmented-control";

import type { DemoProps } from "./types";

const RANGE_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

export function SegmentedControlDemo({ compact = false }: DemoProps) {
  const [value, setValue] = useState("week");

  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-24"
      }`}
    >
      <SegmentedControl
        aria-label="Range"
        onValueChange={setValue}
        options={RANGE_OPTIONS}
        value={value}
      />
    </div>
  );
}
