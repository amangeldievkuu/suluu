"use client";

import { useEffect, useState } from "react";
import {
  RopeTimePicker,
  type RopeTimePickerSize,
  type RopeTimeValue,
} from "suluu/rope-time-picker";

import type { DemoProps } from "./types";

const INITIAL_TIME: RopeTimeValue = {
  hours: 9,
  minutes: 35,
  period: "AM",
  seconds: 20,
};

function formatTime(value: RopeTimeValue, showSeconds = false): string {
  const hours = String(value.hours).padStart(2, "0");
  const minutes = String(value.minutes).padStart(2, "0");
  const seconds = String(value.seconds).padStart(2, "0");
  return `${hours}:${minutes}${showSeconds ? `:${seconds}` : ""} ${value.period}`;
}

function wallClockValue(date = new Date()): RopeTimeValue {
  const hour = date.getHours();

  return {
    hours: hour % 12 === 0 ? 12 : hour % 12,
    minutes: date.getMinutes(),
    period: hour >= 12 ? "PM" : "AM",
    seconds: date.getSeconds(),
  };
}

function RopeTimePickerLiveClock() {
  const [value, setValue] = useState<RopeTimeValue | null>(null);

  useEffect(() => {
    let intervalId = 0;
    const tick = () => {
      setValue(wallClockValue());
    };

    tick();
    const timeoutId = window.setTimeout(
      () => {
        tick();
        intervalId = window.setInterval(tick, 1000);
      },
      1000 - (Date.now() % 1000),
    );

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  if (!value) return null;

  return (
    <div className="pointer-events-none absolute top-0 right-0 z-20 hidden origin-top-right scale-[0.72] md:block">
      <p className="mb-1 text-center text-[10px] font-medium tracking-[0.16em] text-[var(--site-muted)] uppercase">
        Now
      </p>
      <div inert>
        <RopeTimePicker
          aria-hidden="true"
          className="[&_[data-slot=rope-time-picker-period]]:text-[7px] [&_[data-slot=rope-time-picker-period]]:tracking-[0.04em]"
          readOnly
          showDigital={false}
          showSeconds
          size="sm"
          value={value}
        />
      </div>
      <span className="sr-only">Live time {formatTime(value, true)}</span>
    </div>
  );
}

export function RopeTimePickerDemo({ compact = false }: DemoProps) {
  const [value, setValue] = useState<RopeTimeValue>(INITIAL_TIME);

  return (
    <div
      className={`relative z-10 flex w-full items-center justify-center ${
        compact ? "min-h-56" : "min-h-[25rem] py-4"
      }`}
    >
      {compact ? null : <RopeTimePickerLiveClock />}
      <RopeTimePicker
        aria-label="Demo time"
        onValueChange={setValue}
        showDigital={!compact}
        showSeconds
        size={compact ? "sm" : "default"}
        value={value}
      />
    </div>
  );
}

export function RopeTimePickerContextDemo() {
  const [value, setValue] = useState<RopeTimeValue>({
    hours: 10,
    minutes: 30,
    period: "AM",
    seconds: 0,
  });

  return (
    <div className="grid items-center gap-8 sm:grid-cols-[minmax(0,1fr)_14rem]">
      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--site-muted)] uppercase">
          Focus session
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
          {formatTime(value)}
        </p>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--site-muted)]">
          Choose a calm start time. The five-minute dial stays quick while the
          editable fields remain precise and familiar.
        </p>
      </div>
      <RopeTimePicker
        aria-label="Focus session start time"
        onValueChange={setValue}
        showDigital={false}
        size="sm"
        snapStep={5}
        value={value}
      />
    </div>
  );
}

export function RopeTimePickerSizesDemo() {
  const [size, setSize] = useState<RopeTimePickerSize>("default");
  const [value, setValue] = useState<RopeTimeValue>(INITIAL_TIME);

  return (
    <div className="flex flex-col items-center gap-7">
      <div
        aria-label="Time picker size"
        className="inline-flex rounded-full border bg-[var(--site-background)] p-1"
        role="group"
      >
        {(["sm", "default", "lg"] as const).map((option) => (
          <button
            aria-pressed={size === option}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors motion-reduce:transition-none ${
              size === option
                ? "bg-[var(--site-foreground)] text-[var(--site-background)]"
                : "text-[var(--site-muted)] hover:text-[var(--site-foreground)]"
            }`}
            key={option}
            onClick={() => setSize(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      <RopeTimePicker
        aria-label={`${size} time picker`}
        onValueChange={setValue}
        showDigital={false}
        size={size}
        value={value}
      />
    </div>
  );
}
