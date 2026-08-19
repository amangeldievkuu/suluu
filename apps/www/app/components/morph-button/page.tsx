import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { MorphButtonContextDemo } from "@/components/demos/context-demos";
import { MorphButtonDemo } from "@/components/demos/morph-button-demo";
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

const entry = requireEntry("morph-button");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { MorphButton } from "@/components/ui/morph-button"

export function CreateAction() {
  return (
    <MorphButton
      aria-label="Create new"
      compactContent={<PlusIcon />}
      expandedContent={
        <>
          <PlusIcon />
          <span>Create new</span>
        </>
      }
      onClick={() => createItem()}
    />
  )
}`;
const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { MorphButton } from "suluu/morph-button"

export function CreateAction() {
  return (
    <MorphButton
      aria-label="Create new"
      compactContent={<PlusIcon />}
      expandedContent={<><PlusIcon /><span>Create new</span></>}
      onClick={() => createItem()}
    />
  )
}`;
const controlledUsage = `const [creating, setCreating] = useState(false)

<MorphButton
  aria-label="Create project"
  compactContent={<PlusIcon />}
  expanded={creating}
  expandedContent={
    creating
      ? <span>Creating…</span>
      : <><PlusIcon /><span>Create project</span></>
  }
  onClick={async () => {
    setCreating(true)
    await createProject()
    setCreating(false)
  }}
/>`;

const props: readonly PropRow[] = [
  [
    "aria-label",
    "string",
    "Required",
    "Stable accessible name for both visual states.",
  ],
  [
    "compactContent",
    "ReactNode",
    "Required",
    "Icon-sized content rendered in the circular state.",
  ],
  [
    "expandedContent",
    "ReactNode",
    "Required",
    "Content rendered in the expanded pill.",
  ],
  [
    "expanded",
    "boolean",
    "false",
    "Holds the pill open in addition to hover and focus previews.",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Spring, rotation, and press character.",
  ],
  ["disabled", "boolean", "false", "Disables activation and previews."],
  ["className", "string", "—", "Class name applied to the button."],
  ["type", '"button" | "submit" | "reset"', '"button"', "Native type."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-morph-background", "Compact button surface."],
  ["--suluu-morph-foreground", "Compact icon color."],
  ["--suluu-morph-border", "Compact button edge."],
  ["--suluu-morph-shadow", "Compact button depth."],
  ["--suluu-morph-accent", "Expanded pill surface."],
  ["--suluu-morph-accent-foreground", "Expanded pill content."],
  ["--suluu-morph-accent-border", "Expanded pill edge."],
  ["--suluu-morph-accent-shadow", "Expanded pill depth."],
  ["--suluu-morph-ring", "Keyboard focus ring."],
  ["--suluu-morph-offset", "Surface behind the focus ring."],
];

export default function MorphButtonPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="morph-button">
        A compact action that makes room for its meaning exactly when it is
        needed. Its icon folds inward as the surface springs into a labeled
        pill, with the same transition available to application state.
      </DocsPageHeader>

      <ComponentPreview hint="Hover or focus the button">
        <MorphButtonDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="morph-button" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              The morphing action is a native button. Hover and keyboard focus
              preview the label, while the optional controlled state can keep it
              open for loading, success, or other application feedback.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Holding the state</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
              The <code className="text-xs">expanded</code> prop is additive:
              true keeps the pill open, and false still allows hover and focus
              previews.
            </p>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Application state" />
            </div>
            <ContextExample description="A compact create action can stay out of the way until its label is useful.">
              <MorphButtonContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            MorphButton also accepts safe native button attributes, Motion
            inline styles, and forwards its ref to the button element.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The button exposes <code className="text-xs">data-expanded</code>,
              allowing state-specific styling without changing its behavior.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              A required <code className="text-xs">aria-label</code> keeps the
              accessible name stable while the visual slots crossfade. Keyboard
              focus previews the expanded label only when focus-visible applies,
              so pointer clicks do not leave the button unexpectedly open.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Hover previews only run for fine, hover-capable pointers. Touch
              taps activate immediately in the compact state. Reduced motion
              preserves the content change while removing layout springs,
              rotation, blur, and press transforms.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
