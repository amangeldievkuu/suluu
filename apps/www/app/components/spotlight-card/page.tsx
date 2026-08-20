import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import {
  SpotlightCardComparisonDemo,
  SpotlightCardContextDemo,
  SpotlightCardDemo,
} from "@/components/demos/spotlight-card-demo";
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

const entry = requireEntry("spotlight-card");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { SpotlightCard } from "@/components/ui/spotlight-card"

export function ProjectCard() {
  return (
    <SpotlightCard>
      <h3 className="text-lg font-semibold">Project Atlas</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        A calmer place to shape ambitious work.
      </p>
    </SpotlightCard>
  )
}`;

const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { SpotlightCard } from "suluu/spotlight-card"

export function ProjectCard() {
  return <SpotlightCard>Project Atlas</SpotlightCard>
}`;

const tuningUsage = `// A slow, wider light for a generous feature surface.
<SpotlightCard
  motionIntensity="expressive"
  spotlightColor="oklch(0.78 0.08 245)"
  spotlightSize={440}
>
  ...
</SpotlightCard>

// Turn off tracking while preserving content and the static wash.
<SpotlightCard disabled>
  ...
</SpotlightCard>`;

const props: readonly PropRow[] = [
  ["children", "ReactNode", "—", "Content rendered above the lighting layers."],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Trail, light size, peak brightness, and how long the light lingers.",
  ],
  [
    "spotlightColor",
    "string",
    "theme variable",
    "Any CSS color used by the wash and border highlight.",
  ],
  [
    "spotlightSize",
    "number",
    "theme variable",
    "Full diameter of the radial light in pixels.",
  ],
  [
    "disabled",
    "boolean",
    "false",
    "Disables reactive lighting without disabling descendants.",
  ],
  ["className", "string", "—", "Class name applied to the card surface."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-spotlight-card-background", "Card surface."],
  ["--suluu-spotlight-card-foreground", "Inherited content color."],
  ["--suluu-spotlight-card-muted", "Suggested secondary content color."],
  ["--suluu-spotlight-card-border", "Resting perimeter."],
  ["--suluu-spotlight-card-radius", "Card corner radius."],
  ["--suluu-spotlight-card-shadow", "Resting depth beneath the surface."],
  ["--suluu-spotlight-card-spotlight", "Light and border-highlight color."],
  [
    "--suluu-spotlight-card-blend",
    "Blend mode for the light. Additive in dark, plain in light.",
  ],
  ["--suluu-spotlight-card-size", "Full diameter of the radial light."],
  ["--suluu-spotlight-card-intensity", "Reactive light opacity multiplier."],
];

export default function SpotlightCardPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="spotlight-card">
        A composed surface that treats pointer movement like a light source. The
        wash arrives softly, trails with a little mass, and catches only a thin
        piece of the border before disappearing again.
      </DocsPageHeader>

      <ComponentPreview hint="Move across the surface">
        <SpotlightCardDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="spotlight-card" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              SpotlightCard is a native div wrapper. Place headings, copy,
              links, or controls inside it; the decorative layers never receive
              pointer events or cover the content.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Tuning the light</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
              Motion intensity moves three things together: how far the light
              trails behind the pointer, how large and bright the pool is, and
              how long it lingers after the pointer leaves.{" "}
              <code className="text-xs">subtle</code> follows almost exactly and
              leaves quickly; <code className="text-xs">expressive</code>{" "}
              carries a longer trail, a wider pool, and a slower fade.
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Then tune color and size for the surrounding surface. Keep custom
              colors low in chroma so the result still reads as reflected light
              rather than as a glow.
            </p>
            <div className="mt-5">
              <SpotlightCardComparisonDemo />
            </div>
            <div className="mt-5">
              <CodeBlock code={tuningUsage} label="Tuning" />
            </div>

            <ContextExample description="Use several cards together only when the light helps distinguish each surface under the pointer.">
              <SpotlightCardContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            SpotlightCard also accepts native div attributes and forwards its
            ref to the root element. Inline styles are merged with prop-driven
            spotlight overrides.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The root exposes{" "}
              <code className="text-xs">data-spotlight-active</code>,{" "}
              <code className="text-xs">data-spotlight-interactive</code>, and{" "}
              <code className="text-xs">data-disabled</code> for contextual
              styling without coupling to the internal layers.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              The card adds no role or keyboard behavior because it is a visual
              surface, not an interactive control. Links and buttons inside keep
              their native semantics and remain above the pointer-inert,
              assistive-technology-hidden lighting layers.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Tracking only runs for{" "}
              <code className="text-xs">
                (hover: hover) and (pointer: fine)
              </code>
              . Touch-first devices receive a quiet static wash. With{" "}
              <code className="text-xs">prefers-reduced-motion</code>, no
              pointer listener is attached and any active spring is stopped
              immediately.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
