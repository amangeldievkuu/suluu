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

export function MagnetPullComparisonDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
      <div className="flex min-h-52 flex-col rounded-2xl border bg-[var(--site-background)] p-5">
        <div>
          <p className="text-xs font-medium">Subtle</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--site-muted)]">
            A short field for quieter surfaces.
          </p>
        </div>
        {/* Center the action in the space the header leaves, so both cards
            read as balanced rather than bottom-aligned. */}
        <div className="flex flex-1 items-center justify-center">
          <MagnetPull
            contentStrength={0.18}
            motionIntensity="subtle"
            onClick={() => undefined}
            radius={56}
            strength={0.1}
          >
            Learn more
          </MagnetPull>
        </div>
      </div>
      <div className="flex min-h-52 flex-col rounded-2xl border bg-[var(--site-background)] p-5">
        <div>
          <p className="text-xs font-medium">Expressive</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--site-muted)]">
            A wider reach for a primary action.
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <MagnetPull
            contentStrength={0.5}
            motionIntensity="expressive"
            onClick={() => undefined}
            radius={108}
            strength={0.3}
          >
            Get started
          </MagnetPull>
        </div>
      </div>
    </div>
  );
}
