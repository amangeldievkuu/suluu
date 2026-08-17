import Link from "next/link";

import { COMPONENT_PREVIEWS } from "@/components/demos/previews";
import { CopyCommand } from "@/components/copy-command";
import {
  componentHref,
  FEATURED_SLUG,
  registryCommand,
  requireEntry,
} from "@/lib/catalog";

const featured = requireEntry(FEATURED_SLUG);
const FeaturedDemo = COMPONENT_PREVIEWS[FEATURED_SLUG];

export default function HomePage() {
  return (
    <main id="content">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-16 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-7 inline-flex rounded-full border px-3 py-1 text-xs font-medium tracking-wide text-[var(--site-muted)]">
            Open source · v0.1.0
          </p>
          <h1 className="text-5xl leading-[1.02] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
            Motion with a quiet point of view.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-pretty text-[var(--site-muted)]">
            Thoughtful animated React components for interfaces that should feel
            alive, never loud. Copy one component into your project and make it
            yours.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              className="rounded-full bg-[var(--site-foreground)] px-5 py-2.5 text-sm font-medium text-[var(--site-background)] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2"
              href={componentHref(featured.slug)}
            >
              Explore {featured.name}
            </Link>
            <Link
              className="rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--site-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/components"
            >
              All components
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[26rem] items-center justify-center overflow-hidden rounded-[2rem] border bg-white p-8 [--preview-grid:oklch(0.88_0.006_260)] sm:p-12 dark:bg-[oklch(0.12_0.008_260)] dark:[--preview-grid:oklch(0.25_0.012_260)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 [background-image:linear-gradient(to_right,var(--preview-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--preview-grid)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_88%_82%_at_center,black_35%,transparent_100%)] [background-size:56px_56px] [background-position:center] opacity-55"
          />
          <FeaturedDemo />
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t px-6 py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium">Registry first</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
              Own the code you ship.
            </h2>
          </div>
          <div>
            <p className="max-w-2xl leading-7 text-[var(--site-muted)]">
              Install only what you need through the shadcn CLI. The component
              arrives as readable TypeScript and Tailwind classes—ready to
              inspect, adapt, and keep.
            </p>
            <div className="mt-7">
              <CopyCommand command={registryCommand(featured.slug)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-px overflow-hidden border-y bg-[var(--site-border)] sm:grid-cols-3">
        {[
          [
            "Accessible by default",
            "Native semantics, deliberate focus, and reduced-motion support.",
          ],
          [
            "Small surface area",
            "Focused APIs and source that stays pleasant to maintain.",
          ],
          [
            "Two ways to use it",
            "Copy from the registry or consume the optional ESM package.",
          ],
        ].map(([title, description]) => (
          <div className="bg-[var(--site-background)] p-8" key={title}>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              {description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
