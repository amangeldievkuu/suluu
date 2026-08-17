import { registryItemSchema } from "shadcn/schema";

type RegistryItem = ReturnType<typeof registryItemSchema.parse>;

export interface RegistryItemDescriptor {
  /** Builds the validated registry item from the canonical component source. */
  create: (source: string) => RegistryItem;
  /** Named export the installed file is expected to declare. */
  exportName: string;
  /** Registry item name, which is also the served JSON filename. */
  name: string;
  /** Generated artifact path, relative to the workspace root. */
  output: string;
  /** Canonical component source path, relative to the workspace root. */
  source: string;
}

export function createNotifyMorphRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "notify-morph",
    type: "registry:ui",
    title: "NotifyMorph",
    description:
      "An accessible email notification form that fluidly morphs from a compact bell CTA.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/notify-morph/notify-morph.tsx",
        type: "registry:ui",
        target: "@ui/notify-morph.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-notify-background": "oklch(0.97 0.002 260)",
        "suluu-notify-foreground": "oklch(0.08 0.005 260)",
        "suluu-notify-muted": "oklch(0.69 0.008 260)",
        "suluu-notify-border": "oklch(0.955 0.004 260)",
        "suluu-notify-hover": "oklch(0.945 0.004 260)",
        "suluu-notify-accent": "oklch(0.998 0.001 260)",
        "suluu-notify-accent-foreground": "oklch(0.08 0.005 260)",
        "suluu-notify-ring": "oklch(0.55 0.16 255)",
        "suluu-notify-shadow":
          "0 2px 3px oklch(0.2 0.02 260 / 7%), 0 8px 18px oklch(0.2 0.02 260 / 8%)",
        "suluu-notify-success-background": "oklch(0.99 0.003 260 / 82%)",
        "suluu-notify-success-foreground": "oklch(0.18 0.008 260)",
        "suluu-notify-success-border": "oklch(1 0 0 / 72%)",
        "suluu-notify-success-shadow":
          "0 1px 1px oklch(0.2 0.02 260 / 5%), 0 10px 30px oklch(0.2 0.02 260 / 13%)",
      },
      dark: {
        "suluu-notify-background": "oklch(0.2 0.012 260)",
        "suluu-notify-foreground": "oklch(0.96 0.006 260)",
        "suluu-notify-muted": "oklch(0.64 0.014 260)",
        "suluu-notify-border": "oklch(0.25 0.016 260)",
        "suluu-notify-hover": "oklch(0.24 0.014 260)",
        "suluu-notify-accent": "oklch(0.29 0.015 260)",
        "suluu-notify-accent-foreground": "oklch(0.97 0.004 260)",
        "suluu-notify-ring": "oklch(0.7 0.13 255)",
        "suluu-notify-shadow":
          "0 2px 3px oklch(0 0 0 / 22%), 0 10px 24px oklch(0 0 0 / 26%)",
        "suluu-notify-success-background": "oklch(0.27 0.014 260 / 80%)",
        "suluu-notify-success-foreground": "oklch(0.97 0.004 260)",
        "suluu-notify-success-border": "oklch(1 0 0 / 13%)",
        "suluu-notify-success-shadow":
          "0 1px 1px oklch(0 0 0 / 18%), 0 12px 34px oklch(0 0 0 / 32%)",
      },
    },
    docs: "The component requires Tailwind CSS and renders a native email form. Connect onSubmit to your subscription service.",
    categories: ["forms", "call-to-action", "animated"],
    meta: {
      version: "0.1.0",
    },
  } as const;

  return registryItemSchema.parse(item);
}

export function createMagnetPullRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "magnet-pull",
    type: "registry:ui",
    title: "MagnetPull",
    description:
      "A button that leans toward the cursor on a spring, with its label travelling further than its surface.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/magnet-pull/magnet-pull.tsx",
        type: "registry:ui",
        target: "@ui/magnet-pull.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-magnet-background": "oklch(0.19 0.012 260)",
        "suluu-magnet-foreground": "oklch(0.98 0.003 260)",
        "suluu-magnet-hover": "oklch(0.28 0.014 260)",
        "suluu-magnet-ring": "oklch(0.55 0.16 255)",
        "suluu-magnet-offset": "oklch(1 0 0)",
        "suluu-magnet-shadow":
          "0 2px 4px oklch(0.2 0.02 260 / 10%), 0 12px 28px oklch(0.2 0.02 260 / 14%)",
      },
      dark: {
        "suluu-magnet-background": "oklch(0.97 0.004 260)",
        "suluu-magnet-foreground": "oklch(0.16 0.01 260)",
        "suluu-magnet-hover": "oklch(0.89 0.006 260)",
        "suluu-magnet-ring": "oklch(0.7 0.13 255)",
        "suluu-magnet-offset": "oklch(0.14 0.008 260)",
        "suluu-magnet-shadow":
          "0 2px 4px oklch(0 0 0 / 26%), 0 14px 34px oklch(0 0 0 / 34%)",
      },
    },
    docs: "The component requires Tailwind CSS. Magnetism is skipped for reduced motion and for devices without a fine hover-capable pointer.",
    categories: ["buttons", "call-to-action", "animated"],
    meta: {
      version: "0.1.0",
    },
  } as const;

  return registryItemSchema.parse(item);
}

export const REGISTRY_ITEMS: readonly RegistryItemDescriptor[] = [
  {
    create: createMagnetPullRegistryItem,
    exportName: "MagnetPull",
    name: "magnet-pull",
    output: "apps/www/public/r/magnet-pull.json",
    source: "packages/suluu/src/magnet-pull/magnet-pull.tsx",
  },
  {
    create: createNotifyMorphRegistryItem,
    exportName: "NotifyMorph",
    name: "notify-morph",
    output: "apps/www/public/r/notify-morph.json",
    source: "packages/suluu/src/notify-morph/notify-morph.tsx",
  },
];

export function serializeRegistryItem(item: unknown): string {
  return `${JSON.stringify(item, null, 2)}\n`;
}
