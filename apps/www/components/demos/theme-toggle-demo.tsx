"use client";

import { ThemeToggle } from "@/components/theme-toggle";

import type { DemoProps } from "./types";

export function ThemeToggleDemo({ compact = false }: DemoProps) {
  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-24"
      }`}
    >
      <ThemeToggle />
    </div>
  );
}
