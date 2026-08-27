import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import {
  DurationPillContextDemo,
  DurationPillDemo,
  DurationPillSecondsDemo,
} from "@/components/demos/duration-pill-demo";
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

const entry = requireEntry("duration-pill");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { DurationPill } from "@/components/ui/duration-pill"

export function Estimate() {
  return (
    <DurationPill
      defaultValue={{ hours: 2, minutes: 30, seconds: 0 }}
      onValueChange={(duration) => saveEstimate(duration)}
      step={5}
    />
  )
}`;

const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { DurationPill } from "suluu/duration-pill"

export function Estimate() {
  return (
    <DurationPill
      defaultValue={{ hours: 2, minutes: 30, seconds: 0 }}
    />
  )
}`;

const controlledUsage = `const [duration, setDuration] = useState({
  hours: 1,
  minutes: 30,
  seconds: 0,
})

<DurationPill
  max={{ hours: 4, minutes: 0, seconds: 0 }}
  min={{ hours: 0, minutes: 15, seconds: 0 }}
  onValueChange={setDuration}
  step={15}
  value={duration}
/>`;

const secondsUsage = `<DurationPill
  defaultValue={{ hours: 0, minutes: 4, seconds: 30 }}
  showSeconds
  step={5}
/>`;

const formatUsage = `<DurationPill
  formatValue={({ hours, minutes }) =>
    \`\${String(hours).padStart(2, "0")}:\${String(minutes).padStart(2, "0")}\`
  }
  labels={{
    duration: "Session length",
    edit: "Change session length",
  }}
  unitLabels={{ hours: "Hrs.", minutes: "Mins." }}
/>`;

const props: readonly PropRow[] = [
  ["value", "DurationValue", "—", "Controlled duration value."],
  [
    "defaultValue",
    "DurationValue",
    "0 Hr 0 Min 0 Sec",
    "Initial uncontrolled duration.",
  ],
  [
    "onValueChange",
    "(value) => void",
    "—",
    "Runs once when a distinct draft is committed.",
  ],
  [
    "onEditChange",
    "(editing) => void",
    "—",
    "Reports internal editor state changes.",
  ],
  ["min", "DurationValue", "0", "Inclusive minimum duration."],
  ["max", "DurationValue", "—", "Inclusive maximum duration."],
  [
    "step",
    "number",
    "1",
    "Arrow-key step for minutes and seconds; direct entry remains exact.",
  ],
  [
    "showSeconds",
    "boolean",
    "false",
    "Shows seconds while preserving them either way.",
  ],
  ["disabled", "boolean", "false", "Disables every interaction."],
  [
    "readOnly",
    "boolean",
    "false",
    "Keeps the compact value focusable without opening it.",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Controls the morph spring and content settle.",
  ],
  [
    "formatValue",
    "(value) => string",
    "—",
    "Replaces the compact display formatter.",
  ],
  [
    "labels",
    "Partial<DurationPillLabels>",
    "—",
    "Accessible widget, action, and field names.",
  ],
  [
    "unitLabels",
    "Partial<DurationPillUnitLabels>",
    '{ hours: "Hr.", minutes: "Min.", seconds: "Sec." }',
    "Visible unit abbreviations.",
  ],
  [
    "renderIcon",
    '(state: "edit" | "confirm") => ReactNode',
    "—",
    "Replaces either custom SVG action icon.",
  ],
  ["className", "string", "—", "Class name applied to the root group."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-duration-pill-background", "Compact readout surface."],
  ["--suluu-duration-pill-foreground", "Primary digits and text."],
  ["--suluu-duration-pill-muted", "Unit labels and edit icon."],
  ["--suluu-duration-pill-field", "Editor field tiles."],
  ["--suluu-duration-pill-field-active", "Focused segment surface."],
  ["--suluu-duration-pill-accent", "Confirmation action surface."],
  ["--suluu-duration-pill-accent-foreground", "Confirmation action icon."],
  ["--suluu-duration-pill-ring", "Keyboard focus ring."],
  ["--suluu-duration-pill-offset", "Color behind ring offsets."],
  ["--suluu-duration-pill-shadow", "Complete pill depth."],
  ["--suluu-duration-pill-action-shadow", "Confirmation action depth."],
];

export default function DurationPillPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="duration-pill">
        A compact duration readout that makes just enough room for precise
        editing. Its surface stays aligned while the value reorganizes into
        calm, tactile segments.
      </DocsPageHeader>

      <ComponentPreview hint="Activate the pencil to edit">
        <DurationPillDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="duration-pill" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              DurationPill keeps a private edit draft. Enter, the check action,
              or moving focus outside commits one canonical value; Escape closes
              the pill without publishing the draft. The readout stays passive;
              activate its pencil button to begin editing.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>

            <h3 className="mt-10 text-sm font-medium">
              Controlled value and bounds
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Hours are non-negative while minutes and seconds stay between zero
              and 59. Direct entry remains exact within that range. Bounds apply
              to the complete duration, and arrow stepping carries naturally
              between segments.
            </p>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Controlled" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Seconds</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Seconds remain in the value when hidden. Enable their segment only
              where that precision helps the task.
            </p>
            <div className="mt-4">
              <CodeBlock code={secondsUsage} label="Seconds" />
            </div>
            <div className="mt-4 rounded-2xl border bg-[var(--site-subtle)]">
              <DurationPillSecondsDemo />
            </div>

            <h3 className="mt-10 text-sm font-medium">Formatting and copy</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              The default formatter omits zero-value units. Use a string
              formatter, accessible label overrides, and unit abbreviations when
              the surrounding product needs another notation or vocabulary.
            </p>
            <div className="mt-4">
              <CodeBlock code={formatUsage} label="Custom format" />
            </div>

            <ContextExample description="A bounded duration estimate that stays quiet until the scheduler needs to change it.">
              <DurationPillContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            DurationPill accepts safe native div attributes and forwards its ref
            to the accessible root group. It intentionally does not render a
            hidden form field; persist the committed value through{" "}
            <code className="text-xs">onValueChange</code>.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The root exposes display/edit, disabled, and read-only state with
              data attributes. The shell, display, editor, fields, and action
              also expose stable slot attributes for local refinement.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              The compact value is passive. Its pencil is a native button that
              opens with pointer activation, Enter, or Space, then moves focus
              to a real numeric spinbutton. Each segment supports direct entry
              and arrow stepping. Enter commits, Escape cancels and restores the
              pencil, and Tab can move through every field and the confirmation
              action before an outer blur commits.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Disabled pills leave the tab order. Read-only pills remain
              discoverable as a named, focusable read-only value. Reduced motion
              removes the shell spring and content displacement while keeping
              the complete editing flow intact.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
