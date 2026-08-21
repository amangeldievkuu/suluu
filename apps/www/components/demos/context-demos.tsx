"use client";

import { useState } from "react";
import { CounterNumbers } from "suluu/counter-numbers";
import { FluidTabs, type FluidTab } from "suluu/fluid-tabs";
import { MagnetPull } from "suluu/magnet-pull";
import { MorphButton } from "suluu/morph-button";
import { NotifyMorph } from "suluu/notify-morph";
import { OtpInput } from "suluu/otp-input";
import { SearchMorph } from "suluu/search-morph";
import { SegmentedControl } from "suluu/segmented-control";
import { SlideControl } from "suluu/slide-control";
import { SwitchToggle } from "suluu/switch-toggle";
import { createToaster } from "suluu/toast";

import { ThemeToggle as SiteThemeToggle } from "../theme-toggle";
import { AlertsIcon, InboxIcon, PlannerIcon } from "./fluid-tabs-demo";

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

function RefreshIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M15.5 7.25A6.25 6.25 0 1 0 16 11M15.5 3.75v3.5H12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function MagnetPullContextDemo() {
  return (
    <div className="mx-auto max-w-xl py-3 text-center sm:py-6">
      <p className="text-xs font-medium tracking-wider text-[var(--site-muted)] uppercase">
        Built for small teams
      </p>
      <h4 className="mt-4 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
        Turn the next idea into something real.
      </h4>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--site-muted)]">
        A focused workspace for shipping thoughtful product work together.
      </p>
      <div className="mt-7 flex items-center justify-center gap-4">
        <MagnetPull
          motionIntensity="subtle"
          onClick={() => undefined}
          radius={72}
          strength={0.14}
        >
          Start a project
        </MagnetPull>
        <span className="hidden text-xs text-[var(--site-muted)] sm:inline">
          Free for 14 days
        </span>
      </div>
    </div>
  );
}

export function MorphButtonContextDemo() {
  return (
    <div className="mx-auto flex max-w-xl items-center justify-between gap-6 rounded-2xl border bg-[var(--site-background)] p-4 shadow-sm sm:p-5">
      <div>
        <p className="text-sm font-medium">Projects</p>
        <p className="mt-1 text-xs text-[var(--site-muted)]">
          12 active · updated just now
        </p>
      </div>
      <MorphButton
        aria-label="Create project"
        compactContent={<PlusIcon />}
        expandedContent={
          <>
            <PlusIcon />
            <span>Create project</span>
          </>
        }
        onClick={() => undefined}
      />
    </div>
  );
}

export function ThemeToggleContextDemo() {
  return (
    <div className="mx-auto flex max-w-xl items-center justify-between gap-6 rounded-2xl border bg-[var(--site-background)] p-4 shadow-sm sm:p-5">
      <div>
        <p className="text-sm font-medium">Dark appearance</p>
        <p className="mt-1 text-xs text-[var(--site-muted)]">
          Use a quieter palette in low-light spaces.
        </p>
      </div>
      <SiteThemeToggle />
    </div>
  );
}

const COMMUNICATION_TABS: readonly FluidTab[] = [
  {
    accentColor: "#087cf0",
    icon: <InboxIcon />,
    id: "fluid-context-inbox-tab",
    label: "Inbox",
    panelId: "fluid-context-inbox-panel",
    value: "inbox",
  },
  {
    accentColor: "#f0b429",
    icon: <PlannerIcon />,
    id: "fluid-context-planner-tab",
    label: "Planner",
    panelId: "fluid-context-planner-panel",
    value: "planner",
  },
  {
    accentColor: "#f0443e",
    icon: <AlertsIcon />,
    id: "fluid-context-alerts-tab",
    label: "Alerts",
    panelId: "fluid-context-alerts-panel",
    value: "alerts",
  },
];

const COMMUNICATION_PANELS = {
  inbox: {
    eyebrow: "3 unread",
    title: "The launch review is ready",
    detail: "Mara left two notes on the final interaction pass.",
  },
  planner: {
    eyebrow: "Next up",
    title: "Motion polish · 10:30",
    detail: "A quiet half hour reserved for the final spring tuning.",
  },
  alerts: {
    eyebrow: "Just now",
    title: "Preview deployment finished",
    detail: "The latest workspace build is ready for review.",
  },
} as const;

export function FluidTabsContextDemo() {
  const [value, setValue] =
    useState<keyof typeof COMMUNICATION_PANELS>("inbox");

  return (
    <div className="mx-auto max-w-xl rounded-3xl border bg-[var(--site-background)] p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b pb-5">
        <div>
          <p className="text-sm font-medium">Workspace</p>
          <p className="mt-1 text-xs text-[var(--site-muted)]">
            Everything waiting for you today.
          </p>
        </div>
        <span className="size-8 rounded-full bg-[linear-gradient(145deg,oklch(0.82_0.08_255),oklch(0.68_0.14_285))] shadow-sm" />
      </div>

      <div className="flex justify-center py-7">
        <FluidTabs
          aria-label="Workspace sections"
          onValueChange={(nextValue) =>
            setValue(nextValue as keyof typeof COMMUNICATION_PANELS)
          }
          tabs={COMMUNICATION_TABS}
          value={value}
        />
      </div>

      {COMMUNICATION_TABS.map((tab) => {
        const panel =
          COMMUNICATION_PANELS[tab.value as keyof typeof COMMUNICATION_PANELS];

        return (
          <section
            aria-labelledby={tab.id}
            className="rounded-2xl bg-[var(--site-subtle)] p-4"
            hidden={value !== tab.value}
            id={tab.panelId}
            key={tab.value}
            role="tabpanel"
          >
            <p className="text-[10px] font-medium tracking-wider text-[var(--site-muted)] uppercase">
              {panel.eyebrow}
            </p>
            <p className="mt-2 text-sm font-medium">{panel.title}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--site-muted)]">
              {panel.detail}
            </p>
          </section>
        );
      })}
    </div>
  );
}

export function NotifyMorphContextDemo() {
  return (
    <div className="mx-auto max-w-lg py-3 text-center sm:py-5">
      <p className="text-xs font-medium tracking-wider text-[var(--site-muted)] uppercase">
        Early access
      </p>
      <h4 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
        The next release is taking shape.
      </h4>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--site-muted)]">
        Join the quiet list. One note when it is ready, nothing in between.
      </p>
      <div className="mt-6 flex justify-center">
        <NotifyMorph
          label="Join the waitlist"
          onSubmit={() => undefined}
          placeholder="you@example.com"
        />
      </div>
    </div>
  );
}

export function OtpInputContextDemo() {
  const [pin, setPin] = useState("");
  const rejected = pin === "0000";
  const ready = pin.length === 4 && !rejected;

  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-[var(--site-background)] p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Confirm your PIN</p>
          <p className="mt-1 text-xs leading-5 text-[var(--site-muted)]">
            Enter the four digits used to secure this workspace.
          </p>
        </div>
        <span
          aria-hidden="true"
          className="rounded-full bg-[var(--site-subtle)] px-2.5 py-1 text-[10px] font-medium tracking-wider text-[var(--site-muted)] uppercase"
        >
          Secure
        </span>
      </div>
      <div className="mt-6">
        <OtpInput
          aria-label="Workspace PIN"
          error={rejected ? "That PIN was not accepted." : undefined}
          length={4}
          masked
          onValueChange={setPin}
          value={pin}
        />
      </div>
      <p aria-live="polite" className="mt-3 text-xs text-[var(--site-muted)]">
        {ready ? "PIN ready to confirm." : "Your PIN stays masked."}
      </p>
    </div>
  );
}

export function SearchMorphContextDemo() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-[var(--site-background)] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-sm font-medium">Knowledge base</p>
          <p className="mt-1 text-xs text-[var(--site-muted)]">
            84 notes across 6 spaces
          </p>
        </div>
        <SearchMorph
          label="Search notes"
          onSubmit={() => undefined}
          placeholder="Find a note"
        />
      </div>
      <div className="grid gap-3 pt-4 sm:grid-cols-2">
        {["Launch notes", "Research archive"].map((title) => (
          <div className="rounded-xl border p-3" key={title}>
            <p className="text-xs font-medium">{title}</p>
            <p className="mt-1 text-[11px] text-[var(--site-muted)]">
              Updated this week
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SwitchToggleContextDemo() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="mx-auto flex max-w-xl items-center justify-between gap-6 rounded-2xl border bg-[var(--site-background)] p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium">Product updates</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--site-muted)]">
          A concise weekly note when something meaningful changes.
        </p>
      </div>
      <SwitchToggle
        aria-label="Product update emails"
        checked={enabled}
        onCheckedChange={setEnabled}
      />
    </div>
  );
}

const RANGE_OPTIONS = [
  { value: "week", label: "7D" },
  { value: "month", label: "30D" },
  { value: "quarter", label: "90D" },
] as const;

export function SegmentedControlContextDemo() {
  const [range, setRange] = useState("month");

  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-[var(--site-background)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs text-[var(--site-muted)]">Active readers</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] tabular-nums">
            7,420
          </p>
          <p className="mt-1 text-xs text-[var(--site-muted)]">
            +8.4% from the previous period
          </p>
        </div>
        <SegmentedControl
          aria-label="Analytics range"
          onValueChange={setRange}
          options={RANGE_OPTIONS}
          value={range}
        />
      </div>
      <div
        aria-hidden="true"
        className="mt-8 flex h-16 items-end gap-1.5 border-b px-1"
      >
        {[34, 49, 42, 61, 52, 70, 76, 68, 82, 74, 90, 84].map(
          (height, index) => (
            <span
              className="flex-1 rounded-t-sm bg-[var(--site-foreground)] opacity-[0.14]"
              key={`${String(height)}-${String(index)}`}
              style={{ height: `${String(height)}%` }}
            />
          ),
        )}
      </div>
    </div>
  );
}

export function SlideControlContextDemo() {
  const [budget, setBudget] = useState(2400);

  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-[var(--site-background)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium">Monthly budget</p>
          <p className="mt-1 text-xs text-[var(--site-muted)]">
            Caps the next billing period.
          </p>
        </div>
        <p className="text-xl font-semibold tracking-[-0.03em] tabular-nums">
          <CounterNumbers
            formatOptions={{
              currency: "USD",
              maximumFractionDigits: 0,
              style: "currency",
            }}
            value={budget}
          />
        </p>
      </div>
      <div className="mt-6">
        <SlideControl
          aria-label="Monthly budget"
          className="w-full"
          max={8000}
          min={400}
          onValueChange={setBudget}
          step={100}
          value={budget}
        />
      </div>
    </div>
  );
}

const INITIAL_METRICS = {
  readers: 7420,
  saves: 1284,
  shares: 392,
};

export function CounterNumbersContextDemo() {
  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  const refresh = () => {
    setMetrics((current) => ({
      readers: current.readers + 137,
      saves: current.saves + 29,
      shares: current.shares + 11,
    }));
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border bg-[var(--site-background)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-sm font-medium">Release overview</p>
          <p className="mt-1 text-xs text-[var(--site-muted)]">Last 30 days</p>
        </div>
        <button
          className="inline-flex size-9 items-center justify-center rounded-full border text-[var(--site-muted)] transition-colors hover:bg-[var(--site-subtle)] hover:text-[var(--site-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={refresh}
          type="button"
        >
          <span className="sr-only">Refresh metrics</span>
          <RefreshIcon />
        </button>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-4">
        {(
          [
            ["Readers", metrics.readers],
            ["Saves", metrics.saves],
            ["Shares", metrics.shares],
          ] as const
        ).map(([label, value]) => (
          <div className="min-w-0" key={label}>
            <dt className="truncate text-xs text-[var(--site-muted)]">
              {label}
            </dt>
            <dd className="mt-2 text-lg font-semibold tracking-[-0.03em] sm:text-2xl">
              <CounterNumbers value={value} />
            </dd>
          </div>
        ))}
      </dl>
      <span aria-live="polite" className="sr-only">
        Metrics updated: {metrics.readers} readers, {metrics.saves} saves, and{" "}
        {metrics.shares} shares.
      </span>
    </div>
  );
}

/** Isolated from the preview above, so each box keeps its own deck. */
const contextToaster = createToaster();

export function ToastContextDemo() {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [visibility, setVisibility] = useState("private");

  const change = (next: string) => {
    const previous = visibility;
    setVisibility(next);
    contextToaster.toast.success(
      next === "private" ? "Project is private" : "Project is public",
      {
        action: { label: "Undo", onClick: () => setVisibility(previous) },
        description:
          next === "private"
            ? "Only invited people can open it."
            : "Anyone with the link can open it.",
      },
    );
  };

  return (
    <div className="relative min-h-[16rem]" ref={setHost}>
      <div className="mx-auto max-w-xl rounded-2xl border bg-[var(--site-background)] p-5 shadow-sm">
        <p className="text-sm font-medium">Visibility</p>
        <p className="mt-1 text-xs text-[var(--site-muted)]">
          Changing this takes effect immediately.
        </p>
        <div className="mt-5">
          <SegmentedControl
            aria-label="Project visibility"
            onValueChange={change}
            options={[
              { value: "private", label: "Private" },
              { value: "public", label: "Public" },
            ]}
            value={visibility}
          />
        </div>
      </div>
      <contextToaster.Toaster container={host} position="bottom-right" />
    </div>
  );
}
