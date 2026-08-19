import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { SlideControlContextDemo } from "@/components/demos/context-demos";
import { SlideControlDemo } from "@/components/demos/slide-control-demo";
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

const entry = requireEntry("slide-control");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { SlideControl } from "@/components/ui/slide-control"

export function VolumeSetting() {
  return (
    <SlideControl
      aria-label="Volume"
      defaultValue={64}
      onValueChange={(value) => saveVolume(value)}
    />
  )
}`;
const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { SlideControl } from "suluu/slide-control"

export function VolumeSetting() {
  return <SlideControl aria-label="Volume" defaultValue={64} />
}`;
const controlledUsage = `const [volume, setVolume] = useState(64)

<SlideControl
  aria-label="Volume"
  onValueChange={setVolume}
  value={volume}
/>`;
const compositionUsage = `import { CounterNumbers } from "@/components/ui/counter-numbers"
import { SlideControl } from "@/components/ui/slide-control"

const [budget, setBudget] = useState(2400)

<div>
  <CounterNumbers
    formatOptions={{ currency: "USD", style: "currency", maximumFractionDigits: 0 }}
    value={budget}
  />
  <SlideControl
    aria-label="Monthly budget"
    max={8000}
    min={400}
    onValueChange={setBudget}
    step={100}
    value={budget}
  />
</div>`;

const props: readonly PropRow[] = [
  ["value", "number", "—", "Controlled committed value."],
  ["defaultValue", "number", "min", "Initial uncontrolled value."],
  [
    "onValueChange",
    "(value) => void",
    "—",
    "Runs when a drag, track press, or key press requests a new value.",
  ],
  ["min", "number", "0", "Inclusive lower bound of the range."],
  ["max", "number", "100", "Inclusive upper bound of the range."],
  [
    "step",
    "number",
    "1",
    "Distance between committed values. Use 0 to disable snapping.",
  ],
  ["disabled", "boolean", "false", "Disables every interaction."],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Controls the thumb spring and squash.",
  ],
  ["className", "string", "—", "Class name applied to the slider."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-slide-track", "Unfilled track surface."],
  ["--suluu-slide-fill", "Filled track surface."],
  ["--suluu-slide-thumb", "Thumb surface."],
  ["--suluu-slide-ring", "Keyboard focus ring."],
  ["--suluu-slide-offset", "Color behind the focus ring offset."],
  ["--suluu-slide-track-shadow", "Track inset depth."],
  ["--suluu-slide-fill-shadow", "Fill elevation."],
  ["--suluu-slide-thumb-shadow", "Thumb elevation."],
];

export default function SlideControlPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="slide-control">
        A tactile range control. The fill stays locked to the thumb so the value
        never reads ahead of the handle. Nearby step ticks ease the thumb in; on
        release the thumb settles onto the committed value.
      </DocsPageHeader>

      <ComponentPreview hint="Drag the thumb or click the track">
        <SlideControlDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="slide-control" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Give every slider a stable accessible name. Use{" "}
              <code className="text-xs">defaultValue</code> for local state, or
              pair <code className="text-xs">value</code> with{" "}
              <code className="text-xs">onValueChange</code> when your
              application owns the number.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>
            <h3 className="mt-10 text-sm font-medium">Controlled state</h3>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Controlled" />
            </div>
            <h3 className="mt-10 text-sm font-medium">
              Compose with CounterNumbers
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              SlideControl does not render a value label. Pair it with
              CounterNumbers when the number should roll as the thumb settles.
            </p>
            <div className="mt-4">
              <CodeBlock code={compositionUsage} label="Composition" />
            </div>
            <ContextExample description="A budget cap stays readable as a rolling currency amount while the thumb settles.">
              <SlideControlContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            SlideControl accepts safe native div attributes, uses{" "}
            <code className="text-xs">role=&quot;slider&quot;</code>, and
            forwards its ref to the root element.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The root exposes <code className="text-xs">data-dragging</code>{" "}
              while the pointer is captured.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              The control is a focusable slider with live{" "}
              <code className="text-xs">aria-valuenow</code>,{" "}
              <code className="text-xs">aria-valuemin</code>, and{" "}
              <code className="text-xs">aria-valuemax</code>. Arrow keys move by{" "}
              <code className="text-xs">step</code>, Page Up and Page Down move
              by a tenth of the range (at least one step), and Home and End jump
              to the ends. Disabled state leaves the tab order and blocks every
              input path.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              With reduced motion, dragging still works but the thumb settle and
              squash become immediate.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
