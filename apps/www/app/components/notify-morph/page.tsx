import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { NotifyMorphDemo } from "@/components/demos/notify-morph-demo";
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

const entry = requireEntry("notify-morph");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { NotifyMorph } from "@/components/ui/notify-morph"

export function Updates() {
  return (
    <NotifyMorph
      onSubmit={(email) => subscribe(email)}
    />
  )
}`;
const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { NotifyMorph } from "suluu/notify-morph"

export function Updates() {
  return <NotifyMorph onSubmit={(email) => subscribe(email)} />
}`;

const props: readonly PropRow[] = [
  ["label", "string", '"Notify Me"', "CTA text in both states."],
  ["placeholder", "string", '"Email"', "Email input placeholder."],
  ["className", "string", "—", "Class name applied to the form."],
  [
    "collapseOnBlur",
    "boolean",
    "true",
    "Collapse when focus leaves the widget.",
  ],
  ["disabled", "boolean", "false", "Disable every interactive control."],
  ["value", "string", "—", "Controlled email value."],
  ["defaultValue", "string", '""', "Initial uncontrolled email value."],
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
    "successMessage",
    "(email) => string",
    "Built in",
    "Builds the liquid confirmation text.",
  ],
  [
    "successDuration",
    "number",
    "3000",
    "Confirmation lifetime in milliseconds.",
  ],
  ["onSubmit", "(email, event) => void", "—", "Runs only for a valid email."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-notify-background", "Container and input surface."],
  ["--suluu-notify-foreground", "Primary text and icon."],
  ["--suluu-notify-muted", "Placeholder text."],
  ["--suluu-notify-border", "Container border."],
  ["--suluu-notify-hover", "Collapsed CTA hover surface."],
  ["--suluu-notify-accent", "Expanded submit button."],
  ["--suluu-notify-accent-foreground", "Submit button content."],
  ["--suluu-notify-ring", "Keyboard focus ring."],
  ["--suluu-notify-shadow", "Expanded action button shadow."],
  ["--suluu-notify-success-background", "Liquid confirmation surface."],
  ["--suluu-notify-success-foreground", "Confirmation text."],
  ["--suluu-notify-success-border", "Confirmation glass edge."],
  ["--suluu-notify-success-shadow", "Confirmation depth and glow."],
];

export default function NotifyMorphPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="notify-morph">
        A compact bell CTA that fluidly opens into an email form, with native
        validation and deliberate focus behavior built in.
      </DocsPageHeader>

      <ComponentPreview>
        <NotifyMorphDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="notify-morph" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Submission is intentionally callback-only. Your application owns
              success, error, clearing, and collapse behavior.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>
          </section>

          <PropsTable rows={props}>
            NotifyMorph also accepts safe native form attributes and forwards
            its ref to the form element.
          </PropsTable>

          <CssVariablesTable rows={variables} />

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              The trigger and submit actions are native buttons. Expansion moves
              focus to the email field, Escape collapses and restores focus,
              native email validation blocks invalid submissions, and reduced
              motion removes spatial animation.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
