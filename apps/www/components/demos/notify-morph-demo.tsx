"use client";

import { NotifyMorph } from "suluu/notify-morph";

import type { DemoProps } from "./types";

export function NotifyMorphDemo({ compact = false }: DemoProps) {
  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-24"
      }`}
    >
      <NotifyMorph onSubmit={() => undefined} />
    </div>
  );
}
