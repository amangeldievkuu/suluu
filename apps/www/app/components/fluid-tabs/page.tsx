import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { FluidTabsContextDemo } from "@/components/demos/context-demos";
import { FluidTabsDemo } from "@/components/demos/fluid-tabs-demo";
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

const entry = requireEntry("fluid-tabs");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { FluidTabs } from "@/components/ui/fluid-tabs"

const tabs = [
  {
    value: "inbox",
    label: "Inbox",
    accentColor: "#087cf0",
    id: "inbox-tab",
    panelId: "inbox-panel",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M3 6.5h18v12H3zM4 8l8 6 8-6" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "planner",
    label: "Planner",
    accentColor: "#f0b429",
    id: "planner-tab",
    panelId: "planner-panel",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M4 5h16v15H4zM8 3v4m8-4v4M4 10h16" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "alerts",
    label: "Alerts",
    accentColor: "#f0443e",
    id: "alerts-tab",
    panelId: "alerts-panel",
    icon: (
      <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a6 6 0 0 0-6 6v4l-2 4v2h16v-2l-2-4V8a6 6 0 0 0-6-6Zm-2 18h4a2 2 0 0 1-4 0Z" />
      </svg>
    ),
  },
]

export function WorkspaceTabs() {
  return (
    <FluidTabs
      aria-label="Workspace"
      defaultValue="inbox"
      tabs={tabs}
    />
  )
}`;

const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { FluidTabs } from "suluu/fluid-tabs"

<FluidTabs
  aria-label="Workspace"
  defaultValue="inbox"
  tabs={tabs}
/>`;

const controlledUsage = `const [tab, setTab] = useState("inbox")

<>
  <FluidTabs
    aria-label="Workspace"
    onValueChange={setTab}
    tabs={tabs}
    value={tab}
  />

  {tabs.map((item) => (
    <section
      aria-labelledby={item.id}
      hidden={tab !== item.value}
      id={item.panelId}
      key={item.value}
      role="tabpanel"
    >
      {item.label} content
    </section>
  ))}
</>`;

const sizeUsage = `// Three type scales; every dimension is derived from them.
<FluidTabs size="sm" tabs={tabs} />
<FluidTabs tabs={tabs} />          // md, the default
<FluidTabs size="lg" tabs={tabs} />

// Or scale it continuously by setting the em basis yourself.
<FluidTabs
  style={{ "--suluu-fluid-tabs-font-size": "1.125rem" }}
  tabs={tabs}
/>`;

const props: readonly PropRow[] = [
  ["tabs", "FluidTab[]", "—", "Tabs rendered in visual and keyboard order."],
  ["tabs[].value", "string", "—", "Unique value used for selection."],
  ["tabs[].label", "string", "—", "Visible and accessible tab name."],
  ["tabs[].icon", "ReactNode", "—", "Custom icon-sized content."],
  [
    "tabs[].accentColor",
    "string",
    "Theme accent",
    "CSS color used while that tab is active.",
  ],
  [
    "tabs[].id / panelId",
    "string",
    "Generated / —",
    "Optional ids connecting a trigger to its tabpanel.",
  ],
  ["value", "string", "—", "Controlled active value."],
  [
    "defaultValue",
    "string",
    "First enabled tab",
    "Initial uncontrolled active value.",
  ],
  [
    "onValueChange",
    "(value) => void",
    "—",
    "Runs when an interaction requests another tab.",
  ],
  [
    "size",
    '"sm" | "md" | "lg"',
    '"md"',
    "Type scale the whole control is sized from.",
  ],
  ["disabled", "boolean", "false", "Disables the complete tablist."],
  ["className", "string", "—", "Class name applied to the tablist."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-fluid-tabs-font-size", "Em basis every dimension is derived from."],
  ["--suluu-fluid-tabs-background", "Individual circle and pill surface."],
  ["--suluu-fluid-tabs-foreground", "Inactive icon color."],
  ["--suluu-fluid-tabs-border", "Surface edge."],
  ["--suluu-fluid-tabs-accent", "Fallback active icon and label color."],
  ["--suluu-fluid-tabs-ring", "Keyboard focus ring."],
  ["--suluu-fluid-tabs-offset", "Color behind the focus ring offset."],
  ["--suluu-fluid-tabs-shadow", "Circle and pill elevation."],
  [
    "--suluu-fluid-tabs-shimmer-intensity",
    "Strength of the sheen that travels the revealed label as it opens.",
  ],
];

export default function FluidTabsPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="fluid-tabs">
        A compact tablist that gives the active destination room to speak. Its
        circle opens into a pill on a soft spring, the label arrives just after
        the shape begins moving, and the neighboring tabs quietly make space.
        The active tab takes its own accent, and a single sheen of light travels
        the revealed label as it opens.
      </DocsPageHeader>

      <ComponentPreview hint="Click a tab or use the arrow keys">
        <FluidTabsDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="fluid-tabs" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Supply your own icon for every tab and give the tablist a stable
              accessible name. Use item-level accent colors for distinct
              destinations, or omit them to share the theme accent.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>
            <h3 className="mt-10 text-sm font-medium">
              Controlled tabs and panels
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              FluidTabs owns the triggers only. When it switches product
              content, connect each trigger and panel with matching ids and keep
              inactive panels hidden.
            </p>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="With panels" />
            </div>
            <h3 className="mt-10 text-sm font-medium">Sizes</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              The tablist is built from a single em geometry, so a size is only
              a change of type scale. Override
              <code className="mx-1 text-xs">--suluu-fluid-tabs-font-size</code>
              on the tablist to scale it continuously instead. The active pill
              also clamps itself to the viewport, so a long label narrows rather
              than pushing the row off a small screen.
            </p>
            <div className="mt-4">
              <CodeBlock code={sizeUsage} label="Sizes" />
            </div>
            <ContextExample description="A communication workspace uses the expanding active tab to preserve context without giving every destination a permanent label.">
              <FluidTabsContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            FluidTabs accepts safe native div attributes and forwards its ref to
            the tablist. Each item may also set the
            <code className="ml-1 text-xs">disabled</code> state without
            disabling its siblings.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The root exposes <code className="text-xs">data-state</code> for
              the active value. Triggers expose
              <code className="mx-1 text-xs">data-state</code> as
              <code className="mx-1 text-xs">active</code> or
              <code className="mx-1 text-xs">inactive</code>. An item’s
              <code className="mx-1 text-xs">accentColor</code> overrides the
              fallback accent for that trigger only.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              FluidTabs is a horizontal tablist of native buttons. Left and
              Right arrows move and activate selection, Home and End jump to the
              first and last enabled tabs, and only the active tab sits in the
              page tab order.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              The label remains the accessible name even while visually
              collapsed. With reduced motion, expansion, label movement, and
              color transitions become immediate while active state remains
              clear.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              The sweep of light is decorative: it is hidden from assistive
              technology, never intercepts pointer events, and is not rendered
              at all under reduced motion. Selection stays legible through the
              accent color alone.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
