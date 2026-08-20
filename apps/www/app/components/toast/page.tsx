import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { ToastContextDemo } from "@/components/demos/context-demos";
import { ToastDemo } from "@/components/demos/toast-demo";
import { ComponentPreview } from "@/components/docs/component-preview";
import { ContextExample } from "@/components/docs/context-example";
import {
  CssVariablesTable,
  type CssVariableRow,
} from "@/components/docs/css-variables-table";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { InstallSection } from "@/components/docs/install-section";
import { PropsTable, type PropRow } from "@/components/docs/props-table";
import { DocsToc } from "@/components/docs-toc";
import { requireEntry } from "@/lib/catalog";

const entry = requireEntry("toast");

/** Module-level for a stable identity: `DocsToc` keys a listener off it. */
const TOC_ITEMS = [
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "props", label: "Props" },
  { id: "toaster-props", label: "Toaster props" },
  { id: "theming", label: "Theming" },
  { id: "accessibility", label: "Accessibility" },
] as const;

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const registryUsage = `// app/layout.tsx
import { Toaster } from "@/components/ui/toast"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

// anywhere else
import { toast } from "@/components/ui/toast"

toast.success("Draft saved", { description: "Synced a moment ago." })`;

const npmUsage = `// app/globals.css
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";

// app/layout.tsx
import { Toaster } from "suluu/toast"

<Toaster position="top-center" duration={6000} />

// anywhere else
import { toast } from "suluu/toast"

toast.error("Upload failed")`;

const variantUsage = `toast("Note moved to trash")
toast.success("Draft saved")
toast.error("Upload failed")
toast.warning("Storage almost full")
toast.info("2 people joined the workspace")`;

const actionUsage = `toast("Note moved to trash", {
  action: { label: "Undo", onClick: restoreNote },
})

// Keep one on screen until something else resolves it.
const id = toast.info("Syncing your library", { duration: Infinity })
await sync()
toast.dismiss(id)`;

const iconUsage = `// One toast
toast.success("Deployed", { icon: <RocketIcon /> })

// Every toast of a variant
<Toaster icons={{ success: <RocketIcon /> }} />`;

const scopedUsage = `import { useState } from "react"
import { createToaster } from "@/components/ui/toast"

// An independent queue and viewport, for a modal, a canvas, or a test.
const { Toaster: PanelToaster, toast: panelToast } = createToaster()
const [host, setHost] = useState<HTMLElement | null>(null)

<div className="relative" ref={setHost}>
  <PanelToaster container={host} />
</div>`;

const toastProps: readonly PropRow[] = [
  [
    "title",
    "ReactNode",
    "—",
    "First argument. The one line that always shows.",
  ],
  ["description", "ReactNode", "—", "Secondary line under the title."],
  [
    "variant",
    '"default" | "success" | "error" | "warning" | "info"',
    '"default"',
    "Chooses the icon and its tint. The surface never changes color.",
  ],
  [
    "duration",
    "number",
    "Toaster's duration",
    "Milliseconds on screen. Use Infinity to keep it until dismissed.",
  ],
  [
    "action",
    "{ label, onClick }",
    "—",
    "Inline button. Runs, then dismisses the toast.",
  ],
  ["icon", "ReactNode", "variant icon", "Replaces the icon for this toast."],
  [
    "onClose",
    "(id) => void",
    "—",
    "Runs on every dismissal path, including toast.dismiss().",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    "Toaster's intensity",
    "Overrides the spring character for this toast.",
  ],
];

const toasterProps: readonly PropRow[] = [
  [
    "position",
    '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',
    '"bottom-right"',
    "Corner the deck grows from.",
  ],
  ["duration", "number", "4500", "Default milliseconds on screen."],
  [
    "max",
    "number",
    "8",
    "How many live in the deck. The rest wait their turn. The collapsed stack peeks four; hover or focus expands the front three, and the rest of the deck scrolls.",
  ],
  [
    "motionIntensity",
    '"subtle" | "default" | "expressive"',
    '"default"',
    "Spring character of the stack, enter, and exit.",
  ],
  [
    "icons",
    "Partial<Record<Variant, ReactNode>>",
    "—",
    "Replaces the default icon for a whole variant.",
  ],
  [
    "container",
    "HTMLElement | null",
    "document.body",
    "Portal target. null waits until a host is ready; omit to use document.body.",
  ],
  ["label", "string", '"Notifications"', "Accessible name of the landmark."],
  ["className", "string", "—", "Class name applied to the deck."],
];

const variables: readonly CssVariableRow[] = [
  ["--suluu-toast-surface", "Toast background, translucent by default."],
  ["--suluu-toast-foreground", "Title color."],
  ["--suluu-toast-muted", "Description and close button color."],
  ["--suluu-toast-border", "Hairline around the surface."],
  ["--suluu-toast-shadow", "Surface depth, including the top highlight."],
  ["--suluu-toast-ring", "Keyboard focus ring."],
  ["--suluu-toast-offset", "Color behind the focus ring offset."],
  ["--suluu-toast-track", "Unfilled part of the countdown ring."],
  ["--suluu-toast-action", "Action and close button surface."],
  ["--suluu-toast-action-foreground", "Action button label."],
  ["--suluu-toast-action-hover", "Action and close button hover surface."],
  ["--suluu-toast-neutral", "Icon tint for the default variant."],
  ["--suluu-toast-success", "Icon and ring tint for success."],
  ["--suluu-toast-error", "Icon and ring tint for error."],
  ["--suluu-toast-warning", "Icon and ring tint for warning."],
  ["--suluu-toast-info", "Icon and ring tint for info."],
];

export default function ToastPage() {
  return (
    <main className="py-20" id="content">
      <DocsPageHeader slug="toast">
        A deck rather than a list. New toasts land in front and older ones
        recede behind them; the idle stack peeks four, hover or focus springs
        the front three apart, the rest of the deck scrolls into view, and
        leaving gathers them back into the peek. The time left unwinds as a
        hairline ring around the icon.
      </DocsPageHeader>

      <ComponentPreview hint="Fire a few, or stack six, then hover and scroll">
        <ToastDemo />
      </ComponentPreview>

      <div className="mt-20 grid gap-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <DocsToc items={TOC_ITEMS} />

        <article className="min-w-0 space-y-20">
          <InstallSection slug="toast" />

          <section className="scroll-mt-24" id="usage">
            <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Render one <code className="text-xs">&lt;Toaster /&gt;</code> near
              the root of your app. State lives in a module-level store, not in
              React context, so <code className="text-xs">toast()</code> works
              from event handlers, effects, and plain functions alike — no
              provider and no hook.
            </p>
            <div className="mt-6 space-y-5">
              <CodeBlock code={registryUsage} label="Registry" />
              <CodeBlock code={npmUsage} label="npm" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Variants</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              The surface stays the same neutral in every variant. Only the icon
              and its ring take a tint, so a burst of errors never turns the
              corner of your app into a wall of red.
            </p>
            <div className="mt-4">
              <CodeBlock code={variantUsage} label="Variants" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Actions and duration</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              An action dismisses its toast once it runs. Every call returns an
              id you can pass to{" "}
              <code className="text-xs">toast.dismiss()</code>, and{" "}
              <code className="text-xs">toast.dismiss()</code> with no argument
              clears the deck.
            </p>
            <div className="mt-4">
              <CodeBlock code={actionUsage} label="Actions" />
            </div>

            <h3 className="mt-10 text-sm font-medium">Custom icons</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              The defaults are inline SVGs that draw themselves on as the toast
              settles — no icon library involved. Replace one toast&apos;s icon
              or a whole variant&apos;s.
            </p>
            <div className="mt-4">
              <CodeBlock code={iconUsage} label="Icons" />
            </div>

            <h3 className="mt-10 text-sm font-medium">A second deck</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              <code className="text-xs">createToaster()</code> returns an
              independent store, <code className="text-xs">toast</code>, and{" "}
              <code className="text-xs">Toaster</code>. Paired with{" "}
              <code className="text-xs">container</code> it keeps a deck inside
              one panel — which is exactly how the previews on this page stay in
              their boxes. Pass the host from a callback ref;{" "}
              <code className="text-xs">null</code> waits to portal instead of
              flashing onto the page.
            </p>
            <div className="mt-4">
              <CodeBlock code={scopedUsage} label="Scoped" />
            </div>

            <ContextExample description="Changing a setting confirms itself, and the confirmation carries the way back.">
              <ToastContextDemo />
            </ContextExample>
          </section>

          <PropsTable rows={toastProps}>
            Options for <code className="text-xs">toast(title, options)</code>{" "}
            and every variant helper.
          </PropsTable>

          <PropsTable
            id="toaster-props"
            rows={toasterProps}
            title="Toaster props"
          >
            Defaults for the whole deck. Every toast can override{" "}
            <code className="text-xs">duration</code> and{" "}
            <code className="text-xs">motionIntensity</code> for itself.
          </PropsTable>

          <CssVariablesTable rows={variables}>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              The deck exposes <code className="text-xs">data-expanded</code>{" "}
              while it is hovered, keyboard-focused, or being dragged,{" "}
              <code className="text-xs">data-scrollable</code> while more than
              three toasts are expanded, and each toast carries{" "}
              <code className="text-xs">data-variant</code>.
            </p>
          </CssVariablesTable>

          <section className="scroll-mt-24" id="accessibility">
            <h2 className="text-2xl font-semibold tracking-tight">
              Accessibility
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
              The deck is a named landmark holding a list, so it is somewhere a
              screen reader can return to. Success, info, and plain toasts
              announce as{" "}
              <code className="text-xs">role=&quot;status&quot;</code> politely;
              errors and warnings use{" "}
              <code className="text-xs">role=&quot;alert&quot;</code> and
              interrupt.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Every toast carries a close button that is always focusable.
              Pointer devices that can hover only see it on hover or keyboard
              focus; touch devices keep it visible. Keyboard focus
              (focus-visible) inside the deck springs it open, so a keyboard
              user never reaches a control hidden behind the front card, and it
              holds every countdown until that focus leaves. A pointer click
              does not keep the deck expanded or the timers paused once the
              pointer leaves. Escape dismisses the toast that contains focus.
              The collapsed stack peeks four; anything deeper stays in the deck
              and is paused until it is promoted. Hover or keyboard focus
              expands the front three; the rest of the live deck is a short
              scroll away. Leaving hover or keyboard focus squares the deck back
              into the peek on the pinned edge.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Countdowns also pause while the deck is hovered or the tab is in
              the background. With reduced motion the stack settles instantly
              and toasts cross-fade instead of travelling; the countdown ring
              stays, because it carries information rather than motion.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
