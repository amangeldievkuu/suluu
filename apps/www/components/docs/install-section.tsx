import { CopyCommand } from "@/components/copy-command";
import {
  NPM_COMMAND,
  registryCommand,
  type ComponentSlug,
} from "@/lib/catalog";

interface InstallSectionProps {
  slug: ComponentSlug;
}

export function InstallSection({ slug }: InstallSectionProps) {
  return (
    <section className="scroll-mt-24" id="installation">
      <h2 className="text-2xl font-semibold tracking-tight">Installation</h2>
      <h3 className="mt-8 text-sm font-medium">Registry — recommended</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
        Copies the component into your configured shadcn UI directory and
        installs Motion.
      </p>
      <div className="mt-4">
        <CopyCommand command={registryCommand(slug)} />
      </div>
      <h3 className="mt-10 text-sm font-medium">npm package</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
        For centralized upgrades, install the optional ESM package and configure
        Tailwind source detection as shown below.
      </p>
      <div className="mt-4">
        <CopyCommand command={NPM_COMMAND} />
      </div>
    </section>
  );
}
