"use client";

import { MorphButton } from "suluu/morph-button";

import type { DemoProps } from "./types";

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M10 3.75v12.5M3.75 10h12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function MorphButtonDemo({ compact = false }: DemoProps) {
  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-24"
      }`}
    >
      <MorphButton
        aria-label="Create new"
        compactContent={<PlusIcon />}
        expandedContent={
          <>
            <PlusIcon />
            <span>Create new</span>
          </>
        }
        onClick={() => undefined}
      />
    </div>
  );
}
