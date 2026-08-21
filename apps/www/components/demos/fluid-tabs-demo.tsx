"use client";

import { useState } from "react";
import { FluidTabs, type FluidTab } from "suluu/fluid-tabs";

import type { DemoProps } from "./types";

export function InboxIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 30 30">
      <rect fill="currentColor" height="23" rx="7" width="30" y="3.5" />
      <path
        d="m7.5 11.25 6.05 4.7a2.35 2.35 0 0 0 2.9 0l6.05-4.7"
        stroke="var(--suluu-fluid-tabs-background)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.7"
      />
    </svg>
  );
}

export function PlannerIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 30 30">
      <rect fill="currentColor" height="28" rx="7" width="28" x="1" y="1" />
      {[
        [9, 10],
        [15, 10],
        [21, 10],
        [9, 16],
        [15, 16],
        [21, 16],
        [9, 22],
        [15, 22],
        [21, 22],
      ].map(([cx, cy]) => (
        <circle
          cx={cx}
          cy={cy}
          fill="var(--suluu-fluid-tabs-background)"
          key={`${String(cx)}-${String(cy)}`}
          r="1.35"
        />
      ))}
    </svg>
  );
}

export function AlertsIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 30 30">
      <path d="M15 2.5a3.1 3.1 0 0 0-3 2.3 8.45 8.45 0 0 0-5.35 7.85v4.1c0 1.15-.42 2.25-1.18 3.1l-1.2 1.34a1.8 1.8 0 0 0 1.34 3h18.78a1.8 1.8 0 0 0 1.34-3l-1.2-1.34a4.65 4.65 0 0 1-1.18-3.1v-4.1A8.45 8.45 0 0 0 18 4.8a3.1 3.1 0 0 0-3-2.3ZM11.55 25.7a3.65 3.65 0 0 0 6.9 0h-6.9Z" />
    </svg>
  );
}

export const WORKSPACE_TABS: readonly FluidTab[] = [
  {
    accentColor: "#087cf0",
    icon: <InboxIcon />,
    id: "fluid-preview-inbox-tab",
    label: "Inbox",
    panelId: "fluid-preview-inbox-panel",
    value: "inbox",
  },
  {
    accentColor: "#f0b429",
    icon: <PlannerIcon />,
    id: "fluid-preview-planner-tab",
    label: "Planner",
    panelId: "fluid-preview-planner-panel",
    value: "planner",
  },
  {
    accentColor: "#f0443e",
    icon: <AlertsIcon />,
    id: "fluid-preview-alerts-tab",
    label: "Alerts",
    panelId: "fluid-preview-alerts-panel",
    value: "alerts",
  },
];

export function FluidTabsDemo({ compact = false }: DemoProps) {
  const [value, setValue] = useState("inbox");

  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-36" : "min-h-24"
      }`}
    >
      <FluidTabs
        aria-label="Workspace"
        onValueChange={setValue}
        tabs={WORKSPACE_TABS}
        value={value}
      />
      {WORKSPACE_TABS.map((tab) => (
        <div
          aria-labelledby={tab.id}
          className="sr-only"
          hidden={value !== tab.value}
          id={tab.panelId}
          key={tab.value}
          role="tabpanel"
        >
          {tab.label} content
        </div>
      ))}
    </div>
  );
}
