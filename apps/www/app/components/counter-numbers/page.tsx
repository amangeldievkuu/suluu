import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { CounterNumbersContextDemo } from "@/components/demos/context-demos";
import { CounterNumbersDemo } from "@/components/demos/counter-numbers-demo";
import { ComponentPreview } from "@/components/docs/component-preview";
import { ContextExample } from "@/components/docs/context-example";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { DEFAULT_TOC_ITEMS } from "@/components/docs/docs-toc-items";
import { InstallSection } from "@/components/docs/install-section";
import { PropsTable, type PropRow } from "@/components/docs/props-table";
import { DocsToc } from "@/components/docs-toc";
import { requireEntry } from "@/lib/catalog";

const entry = requireEntry("counter-numbers");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `"use client"

import { useState } from "react"
import { CounterNumbers } from "@/components/ui/counter-numbers"

export function DownloadCount() {
  const [downloads, setDownloads] = useState(1284)

  return (
    <p>
      <CounterNumbers aria-live="polite" value={downloads} /> downloads
      <button onClick={() => setDownloads((value) => value + 1)}>
        Add download
      </button>
    </p>
  )
}`;
const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { CounterNumbers } from "suluu/counter-numbers"

export function Revenue() {
  return <CounterNumbers className="text-4xl font-semibold" value={1284} />
}`;
const formattingUsage = `<CounterNumbers
  locales="de-DE"
  formatOptions={{
    currency: "EUR",
    style: "currency",
  }}
  value={1234.56}
/>

<CounterNumbers
  formatOptions={{ maximumFractionDigits: 1, notation: "compact" }}
  motionIntensity="expressive"
  value={1284500}
/>`;

const props: readonly PropRow[] = [
  ["value", "number", "—", "Numeric value to format and display."],
  [
    "locales",
    "Intl.LocalesArgument",
    '"en-US"',
    "Locale or preference list passed to Intl.NumberFormat.",
  ],
  [
    "formatOptions",
    "Intl.NumberFormatOptions",
    "—",
    "Grouping, fraction, currency, unit, percent, compact, or sign options.",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Travel, stagger, and spring character of changed digit places.",
  ],
  [
    "aria-live",
    '"off" | "polite" | "assertive"',
    "—",
    "Opts meaningful value changes into screen-reader announcements.",
  ],
  ["className", "string", "—", "Typography and layout classes on the root."],
];

export default function CounterNumbersPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="counter-numbers">
        A numeric display where only the places that changed move. Increases
        roll upward, decreases roll downward, carries retain stable columns, and
        the new glyphs settle with just enough spring to make frequent updates
        feel tangible.
      </DocsPageHeader>

      <ComponentPreview hint="Increase or decrease the value">
        <CounterNumbersDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="counter-numbers" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              The rolling number is display-only: pass it the latest value and
              keep buttons, timers, and server updates in your application. A
              changed place rolls once instead of counting through every value,
              so large jumps remain quick and legible.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>
            <h3 className="mt-10 text-sm font-medium">
              Locales and number styles
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
              Formatting is delegated to{" "}
              <code className="text-xs">Intl.NumberFormat</code>. Digits keep
              identities based on their numeric place while currency signs,
              grouping separators, compact suffixes, and other symbols resize
              around them.
            </p>
            <div className="mt-4">
              <CodeBlock code={formattingUsage} label="Formatting" />
            </div>
            <ContextExample description="Rolling only the changed places gives a compact stats row a sense of continuity between refreshes.">
              <CounterNumbersContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            CounterNumbers accepts native span attributes and forwards its ref
            to the root span. It deliberately owns its children so the visual
            and accessible values cannot drift apart.
          </PropsTable>

          <section className="scroll-mt-24" id="theming">
            <h2 className="text-2xl font-semibold tracking-tight">Theming</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              The component has no color, surface, or size preset and declares
              no CSS variables. It inherits the surrounding font, color, line
              height, and OpenType numeral support; use{" "}
              <code className="text-xs">className</code> just as you would on a
              normal inline span. Tabular numerals are requested by default to
              keep columns steady.
            </p>
          </section>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              Assistive technology receives one complete formatted value, never
              the temporary stack of entering and exiting glyphs. Announcements
              are intentionally opt-in: add{" "}
              <code className="text-xs">aria-live=&quot;polite&quot;</code> only
              when the update is meaningful, not for decorative counters or
              high-frequency telemetry.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Under <code className="text-xs">prefers-reduced-motion</code>, the
              latest formatted value replaces the previous one immediately
              without rolling, fading, staggering, or retaining exit layers. The
              preference is observed live if it changes while the page is open.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
