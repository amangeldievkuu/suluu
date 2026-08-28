import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { OtpInputContextDemo } from "@/components/demos/context-demos";
import {
  OtpInputDemo,
  OtpInputSizesDemo,
} from "@/components/demos/otp-input-demo";
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

const entry = requireEntry("otp-input");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { OtpInput } from "@/components/ui/otp-input"

export function VerificationCode() {
  return (
    <OtpInput
      length={6}
      onComplete={(code) => verify(code)}
    />
  )
}`;
const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { OtpInput } from "suluu/otp-input"

export function VerificationCode() {
  return <OtpInput length={6} onComplete={verify} />
}`;
const controlledUsage = `const [code, setCode] = useState("")

<OtpInput
  aria-label="Verification code"
  length={6}
  onComplete={(completeCode) => verify(completeCode)}
  onValueChange={setCode}
  value={code}
/>`;
const pinUsage = `<OtpInput
  aria-label="Payment PIN"
  error={attemptFailed ? "That PIN was not accepted." : undefined}
  invalid={attemptFailed}
  length={4}
  masked
  name="pin"
/>`;

const props: readonly PropRow[] = [
  ["length", "number", "6", "Number of equal digit slots."],
  ["value", "string", "—", "Controlled numeric code."],
  ["defaultValue", "string", '""', "Initial uncontrolled code."],
  [
    "onValueChange",
    "(value) => void",
    "—",
    "Runs after a typed, deleted, pasted, or autofilled value change.",
  ],
  [
    "onComplete",
    "(value) => void",
    "—",
    "Runs when an interaction takes the code from incomplete to full.",
  ],
  ["masked", "boolean", "false", "Shows bullets and uses password semantics."],
  ["disabled", "boolean", "false", "Disables every input path."],
  ["invalid", "boolean", "false", "Applies the invalid visual and ARIA state."],
  [
    "error",
    "ReactNode",
    "—",
    "Linked inline error; providing one also marks the field invalid.",
  ],
  ["autoFocus", "boolean", "false", "Focuses the native input after mount."],
  ["size", '"sm" | "default" | "lg"', '"default"', "Digit slot dimensions."],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Spring character and caret rhythm.",
  ],
  ["inputMode", "HTML inputMode", '"numeric"', "Mobile keyboard hint."],
  ["pattern", "string", '"[0-9]*"', "Native form validation pattern."],
  ["className", "string", "—", "Class name applied to the complete wrapper."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-otp-background", "Digit slot surface."],
  ["--suluu-otp-foreground", "Visible digit color."],
  ["--suluu-otp-muted", "Masked bullet color."],
  ["--suluu-otp-border", "Resting slot border."],
  ["--suluu-otp-ring", "Active slot border."],
  ["--suluu-otp-caret", "Custom caret color."],
  ["--suluu-otp-error", "Invalid border and message color."],
  ["--suluu-otp-shadow", "Resting slot depth."],
  ["--suluu-otp-active-shadow", "Active slot glow."],
  ["--suluu-otp-error-shadow", "Invalid active-slot glow."],
];

export default function OtpInputPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="otp-input">
        A calm verification field built around one real input. A soft wash
        travels to the active slot, the caret breathes and advances with the
        same spring, and a completed code lets that wash rest until you press a
        slot again to edit.
      </DocsPageHeader>

      <ComponentPreview hint="Type digits or paste a complete code">
        <OtpInputDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="otp-input" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Use the uncontrolled form for local verification flows, or pair{" "}
              <code className="text-xs">value</code> with{" "}
              <code className="text-xs">onValueChange</code> when the
              application owns the code. The default accessible name is
              “One-time code” and can be replaced with an
              <code className="ml-1 text-xs">aria-label</code> or
              <code className="ml-1 text-xs">aria-labelledby</code>.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Controlled code</h3>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Controlled" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Masked PIN and errors</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Masked values use native password semantics and hide every digit
              immediately. An inline error is linked to the input and announced
              politely; use <code className="text-xs">invalid</code> alone when
              your application renders the message elsewhere.
            </p>
            <div className="mt-4">
              <CodeBlock code={pinUsage} label="PIN" />
            </div>

            <ContextExample description="A compact masked PIN flow. Enter 0000 to feel the invalid settle, or any other four digits to complete.">
              <OtpInputContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            OtpInput also accepts safe native input attributes such as{" "}
            <code className="text-xs">id</code>,{" "}
            <code className="text-xs">name</code>,{" "}
            <code className="text-xs">required</code>,{" "}
            <code className="text-xs">form</code>, and{" "}
            <code className="text-xs">autoComplete</code>. Its ref points to the
            native input while <code className="text-xs">className</code> and{" "}
            <code className="text-xs">style</code> customize the wrapper.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <div className="mt-6 rounded-2xl border bg-[var(--site-subtle)] p-5 sm:p-6">
              <p className="text-sm font-medium">Sizes</p>
              <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
                All slots stay equal and never wrap. On narrow screens their
                widths and gaps tighten together while their vertical touch area
                remains stable.
              </p>
              <div className="mt-5">
                <OtpInputSizesDemo />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The wrapper exposes state through{" "}
              <code className="text-xs">data-state</code>,{" "}
              <code className="text-xs">data-size</code>, and boolean data
              attributes. Individual slots expose active, filled, empty, and
              index data for local restyling.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              One native input owns the value, selection, form behavior, mobile
              keyboard, paste, and one-time-code autofill. The visual slots are
              hidden from assistive technology, avoiding the noisy experience of
              navigating four or six separate textboxes.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Backspace, Delete, selection, and arrow-key movement retain native
              expectations. With reduced motion, the active wash, digit settle,
              and error shift become immediate, and the custom caret stays
              steady instead of breathing.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
