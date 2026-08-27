"use client";

import { useState } from "react";
import { DurationPill, type DurationValue } from "suluu/duration-pill";

import type { DemoProps } from "./types";

const INITIAL_DURATION: DurationValue = {
  hours: 2,
  minutes: 30,
  seconds: 0,
};

export function DurationPillDemo({ compact = false }: DemoProps) {
  const [value, setValue] = useState<DurationValue>(INITIAL_DURATION);

  return (
    <div
      className={`relative z-10 flex w-full items-center justify-center ${
        compact ? "min-h-32" : "min-h-36"
      }`}
    >
      <DurationPill onValueChange={setValue} step={5} value={value} />
    </div>
  );
}

export function DurationPillContextDemo() {
  const [value, setValue] = useState<DurationValue>({
    hours: 1,
    minutes: 30,
    seconds: 0,
  });

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 rounded-3xl border bg-[var(--site-background)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p className="text-sm font-medium">Design review</p>
        <p className="mt-1 text-xs leading-5 text-[var(--site-muted)]">
          Set the focused block before adding it to the team calendar.
        </p>
      </div>
      <DurationPill
        aria-label="Design review duration"
        max={{ hours: 4, minutes: 0, seconds: 0 }}
        min={{ hours: 0, minutes: 15, seconds: 0 }}
        onValueChange={setValue}
        step={15}
        value={value}
      />
    </div>
  );
}

export function DurationPillSecondsDemo() {
  const [value, setValue] = useState<DurationValue>({
    hours: 0,
    minutes: 4,
    seconds: 30,
  });

  return (
    <div className="flex min-h-28 items-center justify-center">
      <DurationPill
        aria-label="Countdown duration"
        onValueChange={setValue}
        showSeconds
        step={5}
        value={value}
      />
    </div>
  );
}
