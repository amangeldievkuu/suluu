import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { MagnetPullContextDemo } from "@/components/demos/context-demos";
import { MagnetPullComparisonDemo } from "@/components/demos/magnet-pull-demo";
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

const entry = requireEntry("magnet-pull");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { MagnetPull } from "@/components/ui/magnet-pull"

export function Hero() {
  return (
    <MagnetPull onClick={() => startTrial()}>
      Get started
    </MagnetPull>
  )
}`;
const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { MagnetPull } from "suluu/magnet-pull"

export function Hero() {
  return <MagnetPull onClick={() => startTrial()}>Get started</MagnetPull>
}`;
const tuningUsage = `// A wide, slow, unmistakable magnet for a hero CTA.
<MagnetPull
  contentStrength={0.6}
  motionIntensity="expressive"
  radius={200}
  strength={0.4}
>
  Get started
</MagnetPull>

// A tight, barely-there magnet for dense toolbars.
<MagnetPull
  contentStrength={0.18}
  motionIntensity="subtle"
  radius={48}
  strength={0.1}
>
  Save
</MagnetPull>`;

const props: readonly PropRow[] = [
  ["children", "ReactNode", "—", "Content rendered in the parallax layer."],
  [
    "radius",
    "number",
    "120",
    "Pixels beyond the button bounds where the pull engages.",
  ],
  [
    "strength",
    "number",
    "0.2",
    "Fraction of the cursor offset the surface travels.",
  ],
  [
    "contentStrength",
    "number",
    "0.32",
    "Total fraction the content travels, creating the parallax.",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Spring character of the pull and the release.",
  ],
  [
    "onEngagedChange",
    "(engaged) => void",
    "—",
    "Runs when the cursor enters or leaves the field.",
  ],
  ["disabled", "boolean", "false", "Disables the button and the magnetism."],
  ["className", "string", "—", "Class name applied to the button."],
  ["type", '"button" | "submit" | "reset"', '"button"', "Native button type."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-magnet-background", "Button surface."],
  ["--suluu-magnet-foreground", "Label and icon color."],
  ["--suluu-magnet-hover", "Surface while hovered."],
  ["--suluu-magnet-ring", "Keyboard focus ring."],
  ["--suluu-magnet-offset", "Color behind the focus ring offset."],
  ["--suluu-magnet-shadow", "Resting depth under the button."],
];

export default function MagnetPullPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="magnet-pull">
        A button that reaches for the cursor before the cursor reaches it. The
        pull grows from exactly zero at the edge of the field, and the label
        travels further than the surface so the two layers read as depth.
      </DocsPageHeader>

      <ComponentPreview hint="Move your cursor near the button">
        <MagnetPullComparisonDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="magnet-pull" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              MagnetPull is a native button. Everything you would pass to one —
              click handlers, form attributes, ARIA — works unchanged.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>
            <h3 className="mt-10 text-sm font-medium">Tuning the field</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
              <code className="text-xs">radius</code> sets how far the field
              reaches and <code className="text-xs">strength</code> sets how far
              the button travels. Keep the radius comfortably smaller than the
              gap to neighboring controls, so two magnets never overlap.
            </p>
            <div className="mt-4">
              <CodeBlock code={tuningUsage} label="Tuning" />
            </div>
            <ContextExample description="Use the magnetic pull sparingly on the one action that carries a page forward.">
              <MagnetPullContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            MagnetPull also accepts native button attributes and forwards its
            ref to the button element.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The button also exposes{" "}
              <code className="text-xs">data-magnet-engaged</code>, so you can
              style the engaged state directly with{" "}
              <code className="text-xs">
                data-[magnet-engaged=true]:shadow-lg
              </code>
              .
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              MagnetPull renders a plain native button and adds no ARIA of its
              own. Keyboard users get a focus-visible ring and deliberately no
              magnetism — there is no cursor to follow, and a control that moves
              when you tab to it is disorienting.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              The effect only runs on devices matching{" "}
              <code className="text-xs">
                (hover: hover) and (pointer: fine)
              </code>
              , so touch devices never see it. Under{" "}
              <code className="text-xs">prefers-reduced-motion</code> the
              pointer listener is never attached at all — the button is
              genuinely inert rather than animated at zero duration — while
              staying fully clickable.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
