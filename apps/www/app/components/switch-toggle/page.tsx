import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { SwitchToggleContextDemo } from "@/components/demos/context-demos";
import { SwitchToggleDemo } from "@/components/demos/switch-toggle-demo";
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

const entry = requireEntry("switch-toggle");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { SwitchToggle } from "@/components/ui/switch-toggle"

export function SoundSetting() {
  return (
    <SwitchToggle
      aria-label="Background sounds"
      defaultChecked
      onCheckedChange={(checked) => saveSoundSetting(checked)}
    />
  )
}`;
const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { SwitchToggle } from "suluu/switch-toggle"

export function SoundSetting() {
  return <SwitchToggle aria-label="Background sounds" defaultChecked />
}`;
const controlledUsage = `const [enabled, setEnabled] = useState(false)

<SwitchToggle
  aria-label="Background sounds"
  checked={enabled}
  onCheckedChange={setEnabled}
/>`;

const props: readonly PropRow[] = [
  ["checked", "boolean", "—", "Controlled checked state."],
  ["defaultChecked", "boolean", "false", "Initial uncontrolled state."],
  [
    "onCheckedChange",
    "(checked) => void",
    "—",
    "Runs when a tap, key press, or drag requests a state change.",
  ],
  ["disabled", "boolean", "false", "Disables every interaction."],
  ["className", "string", "—", "Class name applied to the switch."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-switch-background", "Unchecked track surface."],
  ["--suluu-switch-background-checked", "Checked track surface."],
  ["--suluu-switch-thumb", "Thumb surface."],
  ["--suluu-switch-icon", "Unchecked minus icon."],
  ["--suluu-switch-icon-checked", "Checked check icon."],
  ["--suluu-switch-ring", "Keyboard focus ring."],
  ["--suluu-switch-offset", "Color behind the focus ring offset."],
  ["--suluu-switch-shadow", "Unchecked track depth."],
  ["--suluu-switch-shadow-checked", "Checked track depth and glow."],
  ["--suluu-switch-thumb-shadow", "Thumb elevation."],
];

export default function SwitchTogglePage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="switch-toggle">
        A compact switch tuned for direct manipulation. Tap anywhere on the
        track or pull the thumb yourself; it previews the next state under your
        finger while remaining captured inside a pill that yields and stretches
        slightly in the same direction, then both layers settle on soft springs.
      </DocsPageHeader>

      <ComponentPreview hint="Tap or drag the switch">
        <SwitchToggleDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="switch-toggle" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Give every switch a stable accessible name. Use{" "}
              <code className="text-xs">defaultChecked</code> for local state,
              or pair <code className="text-xs">checked</code> with{" "}
              <code className="text-xs">onCheckedChange</code> when your
              application owns the setting.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>
            <h3 className="mt-10 text-sm font-medium">Controlled state</h3>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Controlled" />
            </div>
            <ContextExample description="Pair the spring switch with a persistent setting whose effect is immediate and reversible.">
              <SwitchToggleContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            SwitchToggle accepts safe native button attributes, always uses{" "}
            <code className="text-xs">type=&quot;button&quot;</code>, and
            forwards its ref to the button element.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The root exposes <code className="text-xs">data-state</code> and{" "}
              <code className="text-xs">data-dragging</code> for state-specific
              styling.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              The spring switch is a native button with{" "}
              <code className="text-xs">role=&quot;switch&quot;</code> and a
              live <code className="text-xs">aria-checked</code> state. Enter
              and Space work through native button behavior, focus remains on
              the control after dragging, and disabled state blocks every input
              path.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              With reduced motion, the control keeps direct dragging but removes
              spring overshoot, elasticity, pill follow, squash, and path
              interpolation. The short state change becomes immediate.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
