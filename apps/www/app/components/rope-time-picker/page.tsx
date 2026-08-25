import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import {
  RopeTimePickerContextDemo,
  RopeTimePickerDemo,
  RopeTimePickerSizesDemo,
} from "@/components/demos/rope-time-picker-demo";
import { ComponentPreview } from "@/components/docs/component-preview";
import { ContextExample } from "@/components/docs/context-example";
import {
  CssVariablesTable,
  type CssVariableRow,
} from "@/components/docs/css-variables-table";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { DEFAULT_TOC_ITEMS } from "@/components/docs/docs-toc-items";
import { InstallSection } from "@/components/docs/install-section";
import { PropsTable, type PropRow } from "@/components/docs/props-table";
import { DocsToc } from "@/components/docs-toc";
import { requireEntry } from "@/lib/catalog";

const entry = requireEntry("rope-time-picker");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { RopeTimePicker } from "@/components/ui/rope-time-picker"

export function AlarmTime() {
  return (
    <RopeTimePicker
      defaultValue={{ hours: 7, minutes: 30, seconds: 0, period: "AM" }}
      onValueChange={(time) => saveAlarm(time)}
    />
  )
}`;

const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { RopeTimePicker } from "suluu/rope-time-picker"

export function AlarmTime() {
  return <RopeTimePicker />
}`;

const controlledUsage = `const [time, setTime] = useState({
  hours: 9,
  minutes: 35,
  seconds: 20,
  period: "AM" as const,
})

<RopeTimePicker
  onValueChange={setTime}
  showSeconds
  value={time}
/>`;

const controlledModeUsage = `const [mode, setMode] = useState<"hour" | "minute" | "second">("hour")

<RopeTimePicker
  mode={mode}
  onModeChange={setMode}
  showSeconds
/>`;

const steppedUsage = `<RopeTimePicker
  defaultValue={{ hours: 10, minutes: 30, seconds: 0, period: "AM" }}
  snapStep={5}
/>`;

const props: readonly PropRow[] = [
  ["value", "RopeTimeValue", "—", "Controlled twelve-hour wall-clock value."],
  [
    "defaultValue",
    "RopeTimeValue",
    "12:00:00 AM",
    "Initial uncontrolled value.",
  ],
  [
    "onValueChange",
    "(value) => void",
    "—",
    "Runs once for every distinct snapped value requested by an interaction.",
  ],
  [
    "mode",
    '"hour" | "minute" | "second"',
    "—",
    "Controlled unit being edited.",
  ],
  [
    "defaultMode",
    '"hour" | "minute" | "second"',
    '"hour"',
    "Initial editing unit when mode is uncontrolled.",
  ],
  [
    "onModeChange",
    "(mode) => void",
    "—",
    "Runs when a field or control point requests another unit.",
  ],
  [
    "showSeconds",
    "boolean",
    "false",
    "Shows the seconds rope, slider, and digital field.",
  ],
  [
    "showDigital",
    "boolean",
    "true",
    "Shows the editable digital fields above the dial.",
  ],
  [
    "snapStep",
    "1 | 5",
    "1",
    "Interaction step for minutes and seconds; hours always step by one.",
  ],
  [
    "size",
    '"sm" | "default" | "lg"',
    '"default"',
    "Controls dial, center, dot, and readout scale.",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Controls endpoint settle, rope lag, and resting weight.",
  ],
  [
    "disabled",
    "boolean",
    "false",
    "Disables every interaction and focus target.",
  ],
  [
    "readOnly",
    "boolean",
    "false",
    "Keeps controls discoverable while preventing value changes.",
  ],
  ["className", "string", "—", "Class name applied to the root group."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-rope-time-background", "Dial surface."],
  ["--suluu-rope-time-foreground", "Labels, digits, and period text."],
  ["--suluu-rope-time-muted", "Minute ticks and separators."],
  ["--suluu-rope-time-hour", "Hour ticks and numerals."],
  ["--suluu-rope-time-border", "Dial and readout borders."],
  ["--suluu-rope-time-guide", "Inner guide ring."],
  ["--suluu-rope-time-rope", "Inactive hour and minute rope color."],
  ["--suluu-rope-time-rope-highlight", "Rope and control-point highlight."],
  [
    "--suluu-rope-time-accent",
    "Active hour and minute rope, point, and field.",
  ],
  ["--suluu-rope-time-second", "Seconds rope and active second control."],
  ["--suluu-rope-time-control", "Inactive control-point surface."],
  ["--suluu-rope-time-control-border", "Control and center borders."],
  ["--suluu-rope-time-center", "AM/PM control surface."],
  ["--suluu-rope-time-center-hover", "AM/PM hover surface."],
  ["--suluu-rope-time-readout", "Digital readout surface."],
  ["--suluu-rope-time-readout-active", "Active digital field wash."],
  ["--suluu-rope-time-readout-hover", "Inactive field hover wash."],
  ["--suluu-rope-time-ring", "Keyboard focus ring."],
  ["--suluu-rope-time-offset", "Color behind focus-ring offsets."],
  ["--suluu-rope-time-shadow", "Dial depth."],
  ["--suluu-rope-time-rope-shadow", "Rope depth filter."],
  ["--suluu-rope-time-control-shadow", "Control-point elevation."],
  ["--suluu-rope-time-center-shadow", "AM/PM control elevation."],
  ["--suluu-rope-time-readout-shadow", "Digital readout elevation."],
];

export default function RopeTimePickerPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="rope-time-picker">
        A precise analog picker with softly weighted rope hands. Drag the hour,
        minute, or second dots, or edit the digital fields without giving up the
        calm physical character.
      </DocsPageHeader>

      <ComponentPreview hint="Drag a rope dot or edit the digits">
        <RopeTimePickerDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="rope-time-picker" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              RopeTimePicker uses a focused twelve-hour value with explicit AM
              or PM. Use <code className="text-xs">defaultValue</code> for local
              state, or pair <code className="text-xs">value</code> with{" "}
              <code className="text-xs">onValueChange</code> when your
              application owns the time.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>

            <h3 className="mt-10 text-sm font-medium">
              Controlled time and seconds
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Seconds stay in the value even when hidden, so hour and minute
              edits never discard application state.
            </p>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Controlled" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Controlled mode</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Mode normally follows the field or rope point the user chooses.
              Control it when another part of your interface needs to coordinate
              the active unit.
            </p>
            <div className="mt-4">
              <CodeBlock code={controlledModeUsage} label="Mode" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Five-minute steps</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              One-unit snapping is the default. Use five-unit snapping for
              scheduling surfaces where quick selection matters more than
              minute-by-minute granularity.
            </p>
            <div className="mt-4">
              <CodeBlock code={steppedUsage} label="Stepped" />
            </div>

            <ContextExample description="A five-minute scheduling control that keeps its wall-clock value explicit.">
              <RopeTimePickerContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            RopeTimePicker accepts safe native div attributes and forwards its
            ref to the accessible root group. It intentionally does not parse
            dates, manage timezones, submit a hidden form value, or own a
            popover.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <div className="mt-6 rounded-2xl border bg-[var(--site-subtle)] p-5 sm:p-6">
              <p className="text-sm font-medium">Sizes</p>
              <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
                Every size keeps the same SVG geometry and minimum control-point
                hit area; only its rendered scale and typography change.
              </p>
              <div className="mt-6 overflow-x-auto py-2">
                <RopeTimePickerSizesDemo />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The root exposes mode, size, disabled, read-only, and dragging
              state through data attributes. Individual ropes, fields, and
              points expose stable slot and mode attributes for local restyling.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              Each visible control point is a named slider with live minimum,
              maximum, current value, and complete time text. Arrow keys move
              one allowed step and wrap naturally around the clock; Home and End
              move to the unit bounds. This follows the{" "}
              <a
                className="underline decoration-[var(--site-border)] underline-offset-4 hover:decoration-current"
                href="https://www.w3.org/WAI/ARIA/apg/patterns/slider/"
              >
                WAI-ARIA slider pattern
              </a>
              .
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              The visible readout uses real text-editable spinbuttons,
              preserving native selection and editing while supporting arrows,
              direct numeric entry, Enter, and Escape. This also provides a
              reliable alternative to circular pointer gestures, following the{" "}
              <a
                className="underline decoration-[var(--site-border)] underline-offset-4 hover:decoration-current"
                href="https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/"
              >
                WAI-ARIA spinbutton pattern
              </a>
              .
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Reduced motion removes spring lag and moves every rope immediately
              while retaining its quiet static curve. Disabled controls leave
              the tab order; read-only controls remain discoverable but cannot
              alter the time or period.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
