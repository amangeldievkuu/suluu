import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { SegmentedControlDemo } from "@/components/demos/segmented-control-demo";
import { ComponentPreview } from "@/components/docs/component-preview";
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

const entry = requireEntry("segmented-control");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { SegmentedControl } from "@/components/ui/segmented-control"

export function RangeFilter() {
  return (
    <SegmentedControl
      aria-label="Range"
      defaultValue="week"
      options={[
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
        { value: "month", label: "Month" },
      ]}
    />
  )
}`;
const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { SegmentedControl } from "suluu/segmented-control"

export function RangeFilter() {
  return (
    <SegmentedControl
      aria-label="Range"
      defaultValue="week"
      options={[
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
        { value: "month", label: "Month" },
      ]}
    />
  )
}`;
const controlledUsage = `const [range, setRange] = useState("week")

<SegmentedControl
  aria-label="Range"
  onValueChange={setRange}
  options={[
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ]}
  value={range}
/>`;

const props: readonly PropRow[] = [
  [
    "options",
    "SegmentedControlOption[]",
    "—",
    "Choices rendered as radio options.",
  ],
  ["value", "string", "—", "Controlled selected value."],
  [
    "defaultValue",
    "string",
    "First option",
    "Initial uncontrolled selected value.",
  ],
  [
    "onValueChange",
    "(value) => void",
    "—",
    "Runs when a click or key press requests a new value.",
  ],
  ["disabled", "boolean", "false", "Disables every option in the group."],
  ["className", "string", "—", "Class name applied to the group."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-segment-background", "Track surface."],
  ["--suluu-segment-foreground", "Selected label."],
  ["--suluu-segment-muted", "Unselected label."],
  ["--suluu-segment-pill", "Sliding indicator surface."],
  ["--suluu-segment-ring", "Keyboard focus ring."],
  ["--suluu-segment-offset", "Color behind the focus ring offset."],
  ["--suluu-segment-shadow", "Track inset depth."],
  ["--suluu-segment-pill-shadow", "Pill elevation."],
];

export default function SegmentedControlPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="segmented-control">
        A quiet single-choice group. One pill sits under the selected option and
        slides to the next on a soft spring, squashing slightly as it travels
        the way the switch thumb does.
      </DocsPageHeader>

      <ComponentPreview hint="Click an option or use the arrow keys">
        <SegmentedControlDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="segmented-control" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Give every group a stable accessible name. Use{" "}
              <code className="text-xs">defaultValue</code> for local state, or
              pair <code className="text-xs">value</code> with{" "}
              <code className="text-xs">onValueChange</code> when your
              application owns the selection.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>
            <h3 className="mt-10 text-sm font-medium">Controlled state</h3>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Controlled" />
            </div>
          </section>

          <PropsTable rows={props}>
            SegmentedControl accepts safe native div attributes, always uses{" "}
            <code className="text-xs">role=&quot;radiogroup&quot;</code>, and
            forwards its ref to the group element. Each option may also set{" "}
            <code className="text-xs">disabled</code>.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The root exposes <code className="text-xs">data-state</code> for
              the selected value. Each option exposes{" "}
              <code className="text-xs">data-state</code> as{" "}
              <code className="text-xs">checked</code> or{" "}
              <code className="text-xs">unchecked</code>.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              SegmentedControl is a radiogroup of native buttons. Arrow keys,
              Home, and End move the selection, only the selected option is in
              the tab order, and disabled state blocks every input path.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              With reduced motion, the pill still marks the selected option but
              the slide and squash become immediate.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
