import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { SearchMorphDemo } from "@/components/demos/search-morph-demo";
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

const entry = requireEntry("search-morph");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { SearchMorph } from "@/components/ui/search-morph"

export function Find() {
  return (
    <SearchMorph
      onSubmit={(query) => runSearch(query)}
    />
  )
}`;
const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { SearchMorph } from "suluu/search-morph"

export function Find() {
  return <SearchMorph onSubmit={(query) => runSearch(query)} />
}`;
const controlledUsage = `const [query, setQuery] = useState("")
const [open, setOpen] = useState(false)

<SearchMorph
  expanded={open}
  onExpandedChange={setOpen}
  onSubmit={(next) => runSearch(next)}
  onValueChange={setQuery}
  value={query}
/>`;

const pendingUsage = `const [pending, setPending] = useState(false)

<SearchMorph
  onSubmit={async (query) => {
    setPending(true)
    await runSearch(query)
    setPending(false)
  }}
  pending={pending}
/>`;

const props: readonly PropRow[] = [
  ["label", "string", '"Search"', "CTA text in both states."],
  ["placeholder", "string", '"Search"', "Search input placeholder."],
  ["className", "string", "—", "Class name applied to the form."],
  [
    "collapseOnBlur",
    "boolean",
    "true",
    "Collapse when focus leaves the widget.",
  ],
  ["disabled", "boolean", "false", "Disable every interactive control."],
  ["value", "string", "—", "Controlled query value."],
  ["defaultValue", "string", '""', "Initial uncontrolled query value."],
  ["onValueChange", "(value) => void", "—", "Runs when the input changes."],
  ["expanded", "boolean", "—", "Controlled expansion state."],
  [
    "defaultExpanded",
    "boolean",
    "false",
    "Initial uncontrolled expansion state.",
  ],
  [
    "onExpandedChange",
    "(expanded) => void",
    "—",
    "Runs for expansion requests.",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Animation character.",
  ],
  [
    "pending",
    "boolean",
    "—",
    "Controlled in-flight state. Swaps the action for a spinner.",
  ],
  [
    "pendingDuration",
    "number",
    "900",
    "Length of the built-in submit acknowledgement, in ms.",
  ],
  [
    "onSubmit",
    "(query, event) => void",
    "—",
    "Runs on submit. Empty queries are allowed.",
  ],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-search-background", "Container and input surface."],
  ["--suluu-search-foreground", "Primary text and icon."],
  ["--suluu-search-muted", "Placeholder text."],
  ["--suluu-search-hover", "Collapsed CTA hover surface."],
  ["--suluu-search-accent", "Expanded submit button."],
  ["--suluu-search-accent-foreground", "Submit button content."],
  ["--suluu-search-ring", "Keyboard focus ring."],
  ["--suluu-search-shadow", "Expanded action button shadow."],
];

export default function SearchMorphPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="search-morph">
        A compact search pill that fluidly opens into a field. Same paper
        surface and spring as NotifyMorph, without a confirmation toast or a
        results list — your application owns what happens with the query.
      </DocsPageHeader>

      <ComponentPreview hint="Click Search, then type">
        <SearchMorphDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="search-morph" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Submission is callback-only. Connect{" "}
              <code className="text-xs">onSubmit</code> to your search handler.
              The field does not render results.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>
            <h3 className="mt-10 text-sm font-medium">Controlled state</h3>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Controlled" />
            </div>
            <h3 className="mt-10 text-sm font-medium">Pending state</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Submitting swaps the action for a spinner. Left uncontrolled it
              settles after <code className="text-xs">pendingDuration</code>;
              pass <code className="text-xs">pending</code> to tie it to a real
              async search instead.
            </p>
            <div className="mt-4">
              <CodeBlock code={pendingUsage} label="Pending" />
            </div>
          </section>

          <PropsTable rows={props}>
            SearchMorph also accepts safe native form attributes and forwards
            its ref to the form element.
          </PropsTable>

          <CssVariablesTable rows={variables} />

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              SearchMorph is a native form with{" "}
              <code className="text-xs">role=&quot;search&quot;</code>.
              Expansion moves focus to the search field, Escape collapses and
              restores focus to the trigger, and reduced motion removes the
              morph. The clear button is labelled{" "}
              <code className="text-xs">Clear search</code> and hands focus back
              to the field; while a search is pending the action carries{" "}
              <code className="text-xs">aria-busy</code> alongside a polite live
              announcement.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
