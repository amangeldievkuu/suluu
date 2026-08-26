import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { EmailMorphContextDemo } from "@/components/demos/context-demos";
import { EmailMorphDemo } from "@/components/demos/email-morph-demo";
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

const entry = requireEntry("email-morph");

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `import { EmailMorph } from "@/components/ui/email-morph"

export function Newsletter() {
  return (
    <EmailMorph
      onSubmit={(email) => subscribe(email)}
    />
  )
}`;

const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// component.tsx
import { EmailMorph } from "suluu/email-morph"

export function Newsletter() {
  return <EmailMorph onSubmit={(email) => subscribe(email)} />
}`;

const controlledUsage = `const [email, setEmail] = useState("")
const [loading, setLoading] = useState(false)
const [success, setSuccess] = useState(false)
const [error, setError] = useState<string>()

<EmailMorph
  error={error}
  loading={loading}
  onSubmit={async (nextEmail) => {
    setLoading(true)
    setSuccess(false)
    setError(undefined)

    try {
      await subscribe(nextEmail)
      setSuccess(true)
    } catch {
      setError("We couldn't subscribe that address.")
    } finally {
      setLoading(false)
    }
  }}
  onValueChange={(nextEmail) => {
    setEmail(nextEmail)
    setSuccess(false)
    setError(undefined)
  }}
  success={success}
  value={email}
/>`;

const customIconUsage = `<EmailMorph
  renderIcon={(state) => {
    if (state === "success") return <BrandCheck />
    if (state === "loading") return <BrandLoader />
    return <BrandArrow />
  }}
/>`;

const props: readonly PropRow[] = [
  ["value", "string", "—", "Controlled email value."],
  ["defaultValue", "string", '""', "Initial uncontrolled email value."],
  ["onValueChange", "(value) => void", "—", "Runs when the input changes."],
  [
    "onSubmit",
    "(email, event) => void",
    "—",
    "Runs only for a valid required email.",
  ],
  [
    "loading",
    "boolean",
    "false",
    "Keeps the split open, makes the field read-only, and shows a spinner.",
  ],
  [
    "success",
    "boolean",
    "false",
    "Keeps the split and value visible while showing a check.",
  ],
  ["disabled", "boolean", "false", "Disables the field and action."],
  ["invalid", "boolean", "false", "Applies invalid visual and ARIA state."],
  [
    "error",
    "ReactNode",
    "—",
    "Linked inline error; providing one also marks the field invalid.",
  ],
  ["placeholder", "string", '"Email address"', "Email placeholder."],
  [
    "collapseOnBlur",
    "boolean",
    "true",
    "Rejoins the send action on outside blur, except while loading or success.",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Spring and liquid-neck character.",
  ],
  [
    "labels",
    "Partial<EmailMorphLabels>",
    "Built in",
    "Accessible input, submit, loading, and success copy.",
  ],
  [
    "renderIcon",
    "(state) => ReactNode",
    "Built in",
    "Replaces the action glyph for every state.",
  ],
  ["className", "string", "—", "Class name applied to the form."],
  ["style", "CSSProperties", "—", "Inline style applied to the form."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-email-morph-surface", "Input, liquid bridge, and action surface."],
  ["--suluu-email-morph-foreground", "Primary text and arrow color."],
  ["--suluu-email-morph-muted", "Placeholder text."],
  ["--suluu-email-morph-border", "Invalid-state field edge."],
  ["--suluu-email-morph-ring", "Keyboard focus ring."],
  ["--suluu-email-morph-offset", "Focus ring offset surface."],
  ["--suluu-email-morph-shadow", "Input pill depth."],
  ["--suluu-email-morph-action-shadow", "Separated action depth."],
  ["--suluu-email-morph-error", "Invalid edge, arrow, and message."],
  ["--suluu-email-morph-error-shadow", "Invalid field depth."],
  ["--suluu-email-morph-success", "Success check color."],
  [
    "--suluu-email-morph-shimmer-intensity",
    "Sheen strength on a failed-submit error.",
  ],
];

export default function EmailMorphPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="email-morph">
        A quiet email field. Focusing it lets a circular send action pinch off
        the trailing cap like a drop of water; clicking away draws that drop
        back into the field until the next tap.
      </DocsPageHeader>

      <ComponentPreview hint="Focus the field, enter an email, then submit">
        <EmailMorphDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={DEFAULT_TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="email-morph" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              EmailMorph owns input interaction and native validation. Your
              application owns the subscription request and passes truthful
              loading, success, and server-error state back to the component.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>

            <h3 className="mt-10 text-sm font-medium">
              Controlled async states
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              A successful state deliberately retains the submitted address and
              separated check. Clear or reset those values when your product is
              ready for another submission.
            </p>
            <div className="mt-4">
              <CodeBlock code={controlledUsage} label="Controlled" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Custom action glyphs</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              The defaults are dependency-free inline SVGs. Use the state render
              hook when the action should follow an existing product icon
              language.
            </p>
            <div className="mt-4">
              <CodeBlock code={customIconUsage} label="Icon render hook" />
            </div>

            <ContextExample description="The field stays quiet beneath editorial copy. Focusing it lets the send action pinch away; clicking outside draws it back.">
              <EmailMorphContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={props}>
            EmailMorph accepts safe native email-input attributes such as{" "}
            <code className="text-xs">id</code>,{" "}
            <code className="text-xs">name</code>,{" "}
            <code className="text-xs">autoComplete</code>, and ARIA labeling
            attributes. Its ref points to the native input while{" "}
            <code className="text-xs">className</code> and{" "}
            <code className="text-xs">style</code> customize the complete form.
          </PropsTable>

          <CssVariablesTable rows={variables} />

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              A required native <code className="text-xs">type=email</code>
              input owns keyboard entry, autofill, and browser validity. The
              send action is absent until the field is focused, then Enter and
              the circular button share normal form submission. Focus can move
              between field and action without collapsing the widget, and Escape
              draws the action back unless a request is in flight or succeeded.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Inline errors are linked with{" "}
              <code className="text-xs">aria-describedby</code> and{" "}
              <code className="text-xs">aria-errormessage</code>. Loading marks
              the form busy, success and error updates are announced politely,
              and reduced motion removes the gooey split, spatial spring, and
              spinner rotation while preserving every state change.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
