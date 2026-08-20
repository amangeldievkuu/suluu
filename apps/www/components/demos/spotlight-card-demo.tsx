"use client";

import { SpotlightCard } from "suluu/spotlight-card";

import type { DemoProps } from "./types";

/**
 * A body with one moon on a tilted orbit. The moon has to sit exactly on the
 * ellipse: off the path it reads as a blemish rather than as something in
 * orbit. The ring is held back in opacity so the two bodies stay dominant and
 * the mark does not close up into an eye at 20px.
 */
function OrbitMark() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <ellipse
        cx="12"
        cy="12"
        opacity="0.55"
        rx="9.2"
        ry="6.9"
        stroke="currentColor"
        strokeWidth="1.3"
        transform="rotate(-30 12 12)"
      />
      <circle cx="12" cy="12" fill="currentColor" r="2.7" />
      <circle cx="16.55" cy="4.8" fill="currentColor" r="1.75" />
    </svg>
  );
}

export function SpotlightCardDemo({ compact = false }: DemoProps) {
  return (
    <div className={`w-full ${compact ? "max-w-sm" : "max-w-md"}`}>
      <SpotlightCard
        className={compact ? "p-5" : "p-7 sm:p-8"}
        spotlightSize={compact ? 260 : 360}
      >
        <div className="flex items-center justify-between gap-5">
          <span className="flex size-9 items-center justify-center rounded-full border border-[var(--suluu-spotlight-card-border)] bg-[color-mix(in_oklch,var(--suluu-spotlight-card-background),white_4%)] shadow-sm">
            <OrbitMark />
          </span>
          <span className="rounded-full border border-[var(--suluu-spotlight-card-border)] px-2.5 py-1 text-[10px] font-medium tracking-wide text-[var(--suluu-spotlight-card-muted)] uppercase">
            In orbit
          </span>
        </div>
        <p
          className={`${compact ? "mt-7" : "mt-10"} text-xs font-medium tracking-[0.16em] text-[var(--suluu-spotlight-card-muted)] uppercase`}
        >
          Project Atlas
        </p>
        <h3
          className={`${compact ? "mt-2 text-lg" : "mt-3 text-2xl"} font-semibold tracking-[-0.035em]`}
        >
          A calmer place to shape ambitious work.
        </h3>
        {!compact && (
          <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--suluu-spotlight-card-muted)]">
            Keep decisions, milestones, and the people moving them forward in
            one considered space.
          </p>
        )}
      </SpotlightCard>
    </div>
  );
}

const INTENSITIES = ["subtle", "default", "expressive"] as const;

export function SpotlightCardComparisonDemo() {
  return (
    <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
      {INTENSITIES.map((intensity) => (
        <SpotlightCard
          className="min-h-48 p-5"
          key={intensity}
          motionIntensity={intensity}
          spotlightSize={240}
        >
          <p className="text-[10px] font-medium tracking-[0.16em] text-[var(--suluu-spotlight-card-muted)] uppercase">
            {intensity}
          </p>
          <h3 className="mt-8 text-base font-semibold tracking-tight">
            Quietly responsive
          </h3>
          <p className="mt-2 text-xs leading-5 text-[var(--suluu-spotlight-card-muted)]">
            The same light, with a different sense of mass and presence.
          </p>
        </SpotlightCard>
      ))}
    </div>
  );
}

export function SpotlightCardContextDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
      <SpotlightCard className="min-h-56 p-6" spotlightSize={300}>
        <p className="text-xs text-[var(--suluu-spotlight-card-muted)]">
          Weekly momentum
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] tabular-nums">
          82%
        </p>
        <p className="mt-2 text-xs text-[var(--suluu-spotlight-card-muted)]">
          9 of 11 milestones are moving
        </p>
        <div aria-hidden="true" className="mt-8 flex h-10 items-end gap-1.5">
          {[38, 54, 46, 62, 58, 76, 68, 84, 82].map((height, index) => (
            <span
              className="flex-1 rounded-t-sm bg-current opacity-[0.12]"
              key={`${String(height)}-${String(index)}`}
              style={{ height: `${String(height)}%` }}
            />
          ))}
        </div>
      </SpotlightCard>
      <SpotlightCard
        className="min-h-56 p-6"
        motionIntensity="subtle"
        spotlightColor="oklch(0.78 0.08 155)"
        spotlightSize={220}
      >
        <p className="text-xs text-[var(--suluu-spotlight-card-muted)]">
          Review queue
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] tabular-nums">
          04
        </p>
        <p className="mt-2 text-xs leading-5 text-[var(--suluu-spotlight-card-muted)]">
          Two decisions are ready for the team.
        </p>
      </SpotlightCard>
    </div>
  );
}
