import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { CopyCommand } from "@/components/copy-command";
import { NotifyDemo } from "@/components/notify-demo";

export const metadata: Metadata = {
  title: "NotifyMorph",
  description:
    "An accessible email notification form that morphs from a compact bell CTA.",
};

const registryCommand =
  "npx shadcn@latest add https://suluu.dev/r/notify-morph.json";
const npmCommand = "pnpm add suluu motion";
const registryUsage = `import { NotifyMorph } from "@/components/ui/notify-morph"

export function Updates() {
  return (
    <NotifyMorph
      label="Get updates"
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

const props = [
  ["label", "string", '"Notify me"', "CTA text in both states."],
  ["placeholder", "string", '"Email address"', "Email input placeholder."],
  ["className", "string", "—", "Class name applied to the form."],
  [
    "collapseOnBlur",
    "boolean",
    "false",
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
  ["onSubmit", "(email, event) => void", "—", "Runs only for a valid email."],
] as const;

const variables = [
  ["--suluu-notify-background", "Container and input surface."],
  ["--suluu-notify-foreground", "Primary text and icon."],
  ["--suluu-notify-muted", "Placeholder text."],
  ["--suluu-notify-border", "Container border."],
  ["--suluu-notify-hover", "Collapsed CTA hover surface."],
  ["--suluu-notify-accent", "Expanded submit button."],
  ["--suluu-notify-accent-foreground", "Submit button content."],
  ["--suluu-notify-ring", "Keyboard focus ring."],
  ["--suluu-notify-shadow", "Container shadow."],
] as const;

export default function NotifyMorphPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20 lg:px-8" id="content">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-[var(--site-muted)]">
          Components / Form
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          NotifyMorph
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--site-muted)]">
          A compact bell CTA that fluidly opens into an email form, with native
          validation and deliberate focus behavior built in.
        </p>
      </div>

      <section aria-labelledby="preview-title" className="mt-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium" id="preview-title">
            Preview
          </h2>
          <span className="text-xs text-[var(--site-muted)]">Interactive</span>
        </div>
        <div className="flex min-h-96 items-center justify-center rounded-3xl border bg-[var(--site-subtle)] p-8">
          <NotifyDemo />
        </div>
      </section>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24 space-y-3 text-sm text-[var(--site-muted)]">
            <a
              className="block hover:text-[var(--site-foreground)]"
              href="#installation"
            >
              Installation
            </a>
            <a
              className="block hover:text-[var(--site-foreground)]"
              href="#usage"
            >
              Usage
            </a>
            <a
              className="block hover:text-[var(--site-foreground)]"
              href="#props"
            >
              Props
            </a>
            <a
              className="block hover:text-[var(--site-foreground)]"
              href="#theming"
            >
              Theming
            </a>
            <a
              className="block hover:text-[var(--site-foreground)]"
              href="#accessibility"
            >
              Accessibility
            </a>
          </div>
        </nav>

        <article className="min-w-0 space-y-20">
          <section id="installation">
            <h2 className="text-2xl font-semibold tracking-tight">
              Installation
            </h2>
            <h3 className="mt-8 text-sm font-medium">Registry — recommended</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
              Copies the component into your configured shadcn UI directory and
              installs Motion.
            </p>
            <div className="mt-4">
              <CopyCommand command={registryCommand} />
            </div>
            <h3 className="mt-10 text-sm font-medium">npm package</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
              For centralized upgrades, install the optional ESM package and
              configure Tailwind source detection as shown below.
            </p>
            <div className="mt-4">
              <CopyCommand command={npmCommand} />
            </div>
          </section>

          <section id="usage">
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

          <section id="props">
            <h2 className="text-2xl font-semibold tracking-tight">Props</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              NotifyMorph also accepts safe native form attributes and forwards
              its ref to the form element.
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <thead className="bg-[var(--site-subtle)] text-xs text-[var(--site-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Prop</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Default</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {props.map(([name, type, defaultValue, description]) => (
                    <tr className="border-t" key={name}>
                      <td className="px-4 py-3 font-mono text-xs">{name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--site-muted)]">
                        {type}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--site-muted)]">
                        {defaultValue}
                      </td>
                      <td className="px-4 py-3 text-[var(--site-muted)]">
                        {description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="theming">
            <h2 className="text-2xl font-semibold tracking-tight">Theming</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Override these variables in your light and dark theme scopes. The
              registry installs the defaults automatically.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border">
              {variables.map(([name, description]) => (
                <div
                  className="grid gap-1 border-t px-4 py-3 first:border-t-0 sm:grid-cols-[17rem_1fr]"
                  key={name}
                >
                  <code className="text-xs">{name}</code>
                  <span className="text-sm text-[var(--site-muted)]">
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section id="accessibility">
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
