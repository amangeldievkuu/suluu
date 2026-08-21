import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { ThemeToggleContextDemo } from "@/components/demos/context-demos";
import { ThemeToggleDemo } from "@/components/demos/theme-toggle-demo";
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

const entry = requireEntry("theme-toggle");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `"use client"

import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function AppThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <ThemeToggle
      checked={isDark}
      disabled={resolvedTheme === undefined}
      onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
    />
  )
}`;

const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { ThemeToggle } from "suluu/theme-toggle"

export function AppearanceSetting() {
  return <ThemeToggle defaultChecked />
}`;

const controlledUsage = `const [isDark, setIsDark] = useState(false)

<ThemeToggle
  checked={isDark}
  onCheckedChange={setIsDark}
  motionIntensity="subtle"
/>`;

const customIconsUsage = `<ThemeToggle
  lightIcon={<BrandDayIcon />}
  darkIcon={<BrandNightIcon />}
/>`;

const props: readonly PropRow[] = [
  ["checked", "boolean", "—", "Controlled state. True represents dark mode."],
  ["defaultChecked", "boolean", "false", "Initial uncontrolled state."],
  [
    "onCheckedChange",
    "(checked) => void",
    "—",
    "Runs when a click or key press requests a state change.",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Controls icon rotation, contraction, blur, spring, and press response.",
  ],
  ["lightIcon", "ReactNode", "custom sun", "Replaces the light-mode icon."],
  ["darkIcon", "ReactNode", "custom moon", "Replaces the dark-mode icon."],
  ["disabled", "boolean", "false", "Disables interaction."],
  [
    "aria-label",
    "string",
    '"Dark mode"',
    "Stable accessible name. aria-labelledby is also supported.",
  ],
  ["className", "string", "—", "Class name applied to the button."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-theme-toggle-background", "Resting button surface."],
  ["--suluu-theme-toggle-hover", "Hovered button surface."],
  ["--suluu-theme-toggle-border", "Hairline border."],
  ["--suluu-theme-toggle-sun", "Default light-mode icon color."],
  ["--suluu-theme-toggle-moon", "Default dark-mode icon color."],
  ["--suluu-theme-toggle-ring", "Keyboard focus ring."],
  ["--suluu-theme-toggle-offset", "Color behind the focus ring offset."],
  ["--suluu-theme-toggle-shadow", "Quiet surface depth."],
];

export default function ThemeTogglePage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="theme-toggle">
        A compact theme control centered on one carefully restrained gesture.
        Its custom sun and crescent trade places through a soft crossfade,
        slight counter-rotation, and controlled spring settlement while the
        surface stays quiet enough for navigation bars and settings rows.
      </DocsPageHeader>

      <ComponentPreview hint="Switch the site theme">
        <ThemeToggleDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="theme-toggle" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              The component owns only its boolean state and presentation. Pair
              it with your theme provider, document class, or persisted setting.
              A checked toggle represents dark mode. ThemeToggle renders only
              the circular control; visible labels and status text belong to
              your surrounding markup.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Controlled state</h3>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Controlled" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Custom icons</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Pass any React nodes. Suluu keeps ownership of the transition
              wrappers, so custom artwork receives the same crossfade and spring
              treatment without being cloned or restyled.
            </p>
            <div className="mt-4">
              <CodeBlock code={customIconsUsage} label="Icon overrides" />
            </div>

            <ContextExample description="A theme toggle stays visually light beside a persistent appearance setting.">
              <ThemeToggleContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            ThemeToggle accepts safe native button attributes, always uses{" "}
            <code className="text-xs">type=&quot;button&quot;</code>, and
            forwards its ref to the button element.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The root exposes <code className="text-xs">data-state</code> as{" "}
              <code className="text-xs">light</code> or{" "}
              <code className="text-xs">dark</code> for application-specific
              styling.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              The control is a native toggle button with a live{" "}
              <code className="text-xs">aria-pressed</code> state, so Enter and
              Space work without custom keyboard handling. Keep its accessible
              name stable; the pressed state communicates whether dark mode is
              active.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              When reduced motion is preferred, icon rotation, contraction,
              blur, and press scaling are removed. Only a short opacity
              crossfade remains.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
