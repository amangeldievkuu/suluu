"use client";

import { useState } from "react";
import { OtpInput } from "suluu/otp-input";

import type { DemoProps } from "./types";

export function OtpInputDemo({ compact = false }: DemoProps) {
  const [value, setValue] = useState("");
  const complete = value.length === 6;

  return (
    <div
      className={`relative z-10 flex flex-col items-center justify-center ${
        compact ? "min-h-32" : "min-h-28"
      }`}
    >
      <OtpInput
        aria-label="Verification code"
        length={6}
        onValueChange={setValue}
        size={compact ? "sm" : "default"}
        value={value}
      />
      <span
        aria-live="polite"
        className="mt-3 text-xs text-[var(--site-muted)]"
      >
        {complete ? "Code complete" : "Enter the six-digit code"}
      </span>
    </div>
  );
}

export function OtpInputSizesDemo() {
  return (
    <div className="flex flex-col items-center gap-5 py-3">
      <OtpInput aria-label="Small verification code" length={4} size="sm" />
      <OtpInput aria-label="Default verification code" length={4} />
      <OtpInput aria-label="Large masked PIN" length={4} masked size="lg" />
    </div>
  );
}
