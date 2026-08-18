"use client";

import { SearchMorph } from "suluu/search-morph";

import type { DemoProps } from "./types";

export function SearchMorphDemo({ compact = false }: DemoProps) {
  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-24"
      }`}
    >
      <SearchMorph onSubmit={() => undefined} />
    </div>
  );
}
