"use client";

import { useState } from "react";
import { SwitchToggle } from "suluu/switch-toggle";

import type { DemoProps } from "./types";

export function SwitchToggleDemo({ compact = false }: DemoProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-24"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <SwitchToggle
          aria-label="Background sounds"
          checked={checked}
          onCheckedChange={setChecked}
        />
        <span
          aria-hidden="true"
          className="w-7 text-sm font-medium text-[var(--site-muted)] tabular-nums"
        >
          {checked ? "On" : "Off"}
        </span>
      </div>
    </div>
  );
}
