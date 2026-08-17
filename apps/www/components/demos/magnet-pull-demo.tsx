"use client";

import { MagnetPull } from "suluu/magnet-pull";

import type { DemoProps } from "./types";

export function MagnetPullDemo({ compact = false }: DemoProps) {
  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-24"
      }`}
    >
      {/* A card is only a little wider than the button, so shrink the field to
          keep it from reaching into the neighbouring card. */}
      <MagnetPull onClick={() => undefined} radius={compact ? 64 : 120}>
        Get started
      </MagnetPull>
    </div>
  );
}
