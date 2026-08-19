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

export function createCounterNumbersRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "counter-numbers",
    type: "registry:ui",
    title: "CounterNumbers",
    description:
      "An Intl-aware numeric display whose changed digit places roll and settle on springs.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/counter-numbers/counter-numbers.tsx",
        type: "registry:ui",
        target: "@ui/counter-numbers.tsx",
        content: source,
      },
    ],
    docs: "The component requires Tailwind CSS. It inherits surrounding typography and color; pass aria-live only when value changes should be announced.",
    categories: ["data display", "animated"],
    meta: {
      version: "0.1.0",
    },
  } as const;

  return registryItemSchema.parse(item);
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

export function createSearchMorphRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "search-morph",
    type: "registry:ui",
    title: "SearchMorph",
    description:
      "A compact search pill that fluidly opens into an accessible search field.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/search-morph/search-morph.tsx",
        type: "registry:ui",
        target: "@ui/search-morph.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-search-background": "oklch(0.97 0.002 260)",
        "suluu-search-foreground": "oklch(0.08 0.005 260)",
        "suluu-search-muted": "oklch(0.69 0.008 260)",
        "suluu-search-hover": "oklch(0.945 0.004 260)",
        "suluu-search-accent": "oklch(0.998 0.001 260)",
        "suluu-search-accent-foreground": "oklch(0.08 0.005 260)",
        "suluu-search-ring": "oklch(0.55 0.16 255)",
        "suluu-search-shadow":
          "0 2px 3px oklch(0.2 0.02 260 / 7%), 0 8px 18px oklch(0.2 0.02 260 / 8%)",
      },
      dark: {
        "suluu-search-background": "oklch(0.2 0.012 260)",
        "suluu-search-foreground": "oklch(0.96 0.006 260)",
        "suluu-search-muted": "oklch(0.64 0.014 260)",
        "suluu-search-hover": "oklch(0.24 0.014 260)",
        "suluu-search-accent": "oklch(0.29 0.015 260)",
        "suluu-search-accent-foreground": "oklch(0.97 0.004 260)",
        "suluu-search-ring": "oklch(0.7 0.13 255)",
        "suluu-search-shadow":
          "0 2px 3px oklch(0 0 0 / 22%), 0 10px 24px oklch(0 0 0 / 26%)",
      },
    },
    docs: "The component requires Tailwind CSS. Connect onSubmit to your search handler. The field does not render results.",
    categories: ["forms", "inputs", "animated"],
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

export function createMorphButtonRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "morph-button",
    type: "registry:ui",
    title: "MorphButton",
    description:
      "A compact icon button that fluidly expands into a labeled action on hover, focus, or application state.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/morph-button/morph-button.tsx",
        type: "registry:ui",
        target: "@ui/morph-button.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-morph-background": "oklch(0.97 0.002 260)",
        "suluu-morph-foreground": "oklch(0.08 0.005 260)",
        "suluu-morph-border": "oklch(0.94 0.005 260)",
        "suluu-morph-shadow":
          "0 1px 2px oklch(0.2 0.02 260 / 5%), 0 5px 14px oklch(0.2 0.02 260 / 6%)",
        "suluu-morph-accent": "oklch(0.998 0.001 260)",
        "suluu-morph-accent-foreground": "oklch(0.08 0.005 260)",
        "suluu-morph-accent-border": "oklch(0.93 0.005 260)",
        "suluu-morph-accent-shadow":
          "0 2px 3px oklch(0.2 0.02 260 / 7%), 0 9px 22px oklch(0.2 0.02 260 / 10%)",
        "suluu-morph-ring": "oklch(0.55 0.16 255)",
        "suluu-morph-offset": "oklch(1 0 0)",
      },
      dark: {
        "suluu-morph-background": "oklch(0.2 0.012 260)",
        "suluu-morph-foreground": "oklch(0.96 0.006 260)",
        "suluu-morph-border": "oklch(0.26 0.014 260)",
        "suluu-morph-shadow":
          "0 2px 3px oklch(0 0 0 / 18%), 0 7px 18px oklch(0 0 0 / 20%)",
        "suluu-morph-accent": "oklch(0.29 0.015 260)",
        "suluu-morph-accent-foreground": "oklch(0.97 0.004 260)",
        "suluu-morph-accent-border": "oklch(0.35 0.017 260)",
        "suluu-morph-accent-shadow":
          "0 2px 3px oklch(0 0 0 / 24%), 0 11px 26px oklch(0 0 0 / 30%)",
        "suluu-morph-ring": "oklch(0.7 0.13 255)",
        "suluu-morph-offset": "oklch(0.14 0.008 260)",
      },
    },
    docs: "The component requires Tailwind CSS. Provide an aria-label and icon-sized compact content; hover previews only run on fine-pointer devices.",
    categories: ["buttons", "call-to-action", "animated"],
    meta: {
      version: "0.1.0",
    },
  } as const;

  return registryItemSchema.parse(item);
}

export function createSegmentedControlRegistryItem(
  source: string,
): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "segmented-control",
    type: "registry:ui",
    title: "SegmentedControl",
    description:
      "A single-choice group whose soft pill slides under the selected option.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/segmented-control/segmented-control.tsx",
        type: "registry:ui",
        target: "@ui/segmented-control.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-segment-background": "oklch(0.945 0.004 260)",
        "suluu-segment-foreground": "oklch(0.08 0.005 260)",
        "suluu-segment-muted": "oklch(0.69 0.008 260)",
        "suluu-segment-pill": "oklch(0.998 0.001 260)",
        "suluu-segment-ring": "oklch(0.55 0.16 255)",
        "suluu-segment-offset": "oklch(1 0 0)",
        "suluu-segment-shadow": "inset 0 1px 2px oklch(0.2 0.02 260 / 8%)",
        "suluu-segment-pill-shadow":
          "0 1px 2px oklch(0.2 0.02 260 / 7%), 0 4px 12px oklch(0.2 0.02 260 / 8%)",
      },
      dark: {
        "suluu-segment-background": "oklch(0.2 0.012 260)",
        "suluu-segment-foreground": "oklch(0.96 0.006 260)",
        "suluu-segment-muted": "oklch(0.64 0.014 260)",
        "suluu-segment-pill": "oklch(0.29 0.015 260)",
        "suluu-segment-ring": "oklch(0.7 0.13 255)",
        "suluu-segment-offset": "oklch(0.14 0.008 260)",
        "suluu-segment-shadow": "inset 0 1px 3px oklch(0 0 0 / 28%)",
        "suluu-segment-pill-shadow":
          "0 2px 3px oklch(0 0 0 / 22%), 0 8px 18px oklch(0 0 0 / 20%)",
      },
    },
    docs: "The component requires Tailwind CSS. Give every group an accessible name with aria-label or aria-labelledby.",
    categories: ["forms", "inputs", "animated"],
    meta: {
      version: "0.1.0",
    },
  } as const;

  return registryItemSchema.parse(item);
}

export function createSlideControlRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "slide-control",
    type: "registry:ui",
    title: "SlideControl",
    description:
      "A range slider whose fill stays locked to the thumb, then both settle onto the value.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/slide-control/slide-control.tsx",
        type: "registry:ui",
        target: "@ui/slide-control.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-slide-track": "oklch(0.9 0.006 260)",
        "suluu-slide-fill": "oklch(0.58 0.19 255)",
        "suluu-slide-thumb": "oklch(1 0 0)",
        "suluu-slide-ring": "oklch(0.55 0.16 255)",
        "suluu-slide-offset": "oklch(1 0 0)",
        "suluu-slide-track-shadow": "inset 0 1px 2px oklch(0.2 0.02 260 / 12%)",
        "suluu-slide-fill-shadow": "0 1px 2px oklch(0.5 0.18 255 / 18%)",
        "suluu-slide-thumb-shadow":
          "0 1px 2px oklch(0.16 0.02 260 / 16%), 0 3px 7px oklch(0.16 0.02 260 / 18%)",
      },
      dark: {
        "suluu-slide-track": "oklch(0.31 0.012 260)",
        "suluu-slide-fill": "oklch(0.7 0.15 255)",
        "suluu-slide-thumb": "oklch(0.97 0.004 260)",
        "suluu-slide-ring": "oklch(0.7 0.13 255)",
        "suluu-slide-offset": "oklch(0.14 0.008 260)",
        "suluu-slide-track-shadow": "inset 0 1px 3px oklch(0 0 0 / 35%)",
        "suluu-slide-fill-shadow": "0 2px 8px oklch(0.64 0.15 255 / 22%)",
        "suluu-slide-thumb-shadow":
          "0 1px 2px oklch(0 0 0 / 28%), 0 4px 9px oklch(0 0 0 / 32%)",
      },
    },
    docs: "The component requires Tailwind CSS. Give every slider an accessible name with aria-label or aria-labelledby.",
    categories: ["forms", "inputs", "animated"],
    meta: {
      version: "0.1.0",
    },
  } as const;

  return registryItemSchema.parse(item);
}

export function createSwitchToggleRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "switch-toggle",
    type: "registry:ui",
    title: "SwitchToggle",
    description:
      "A tactile switch with a softly sprung thumb and a fluid minus-to-check icon morph.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/switch-toggle/switch-toggle.tsx",
        type: "registry:ui",
        target: "@ui/switch-toggle.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-switch-background": "oklch(0.88 0.007 260)",
        "suluu-switch-background-checked": "oklch(0.58 0.19 255)",
        "suluu-switch-thumb": "oklch(0.995 0.002 260)",
        "suluu-switch-icon": "oklch(0.47 0.014 260)",
        "suluu-switch-icon-checked": "oklch(0.5 0.18 255)",
        "suluu-switch-ring": "oklch(0.55 0.16 255)",
        "suluu-switch-offset": "oklch(1 0 0)",
        "suluu-switch-shadow": "inset 0 1px 2px oklch(0.2 0.02 260 / 12%)",
        "suluu-switch-shadow-checked":
          "inset 0 1px 2px oklch(0.18 0.08 255 / 16%), 0 3px 10px oklch(0.5 0.18 255 / 18%)",
        "suluu-switch-thumb-shadow":
          "0 1px 2px oklch(0.16 0.02 260 / 14%), 0 3px 7px oklch(0.16 0.02 260 / 16%)",
      },
      dark: {
        "suluu-switch-background": "oklch(0.31 0.012 260)",
        "suluu-switch-background-checked": "oklch(0.7 0.15 255)",
        "suluu-switch-thumb": "oklch(0.97 0.004 260)",
        "suluu-switch-icon": "oklch(0.48 0.014 260)",
        "suluu-switch-icon-checked": "oklch(0.5 0.18 255)",
        "suluu-switch-ring": "oklch(0.7 0.13 255)",
        "suluu-switch-offset": "oklch(0.14 0.008 260)",
        "suluu-switch-shadow": "inset 0 1px 3px oklch(0 0 0 / 35%)",
        "suluu-switch-shadow-checked":
          "inset 0 1px 2px oklch(0.2 0.08 255 / 20%), 0 3px 12px oklch(0.64 0.15 255 / 22%)",
        "suluu-switch-thumb-shadow":
          "0 1px 2px oklch(0 0 0 / 28%), 0 4px 9px oklch(0 0 0 / 32%)",
      },
    },
    docs: "The component requires Tailwind CSS. Give every switch an accessible name with aria-label or aria-labelledby.",
    categories: ["forms", "inputs", "animated"],
    meta: {
      version: "0.1.0",
    },
  } as const;

  return registryItemSchema.parse(item);
}

export const REGISTRY_ITEMS: readonly RegistryItemDescriptor[] = [
  {
    create: createCounterNumbersRegistryItem,
    exportName: "CounterNumbers",
    name: "counter-numbers",
    output: "apps/www/public/r/counter-numbers.json",
    source: "packages/suluu/src/counter-numbers/counter-numbers.tsx",
  },
  {
    create: createMagnetPullRegistryItem,
    exportName: "MagnetPull",
    name: "magnet-pull",
    output: "apps/www/public/r/magnet-pull.json",
    source: "packages/suluu/src/magnet-pull/magnet-pull.tsx",
  },
  {
    create: createMorphButtonRegistryItem,
    exportName: "MorphButton",
    name: "morph-button",
    output: "apps/www/public/r/morph-button.json",
    source: "packages/suluu/src/morph-button/morph-button.tsx",
  },
  {
    create: createNotifyMorphRegistryItem,
    exportName: "NotifyMorph",
    name: "notify-morph",
    output: "apps/www/public/r/notify-morph.json",
    source: "packages/suluu/src/notify-morph/notify-morph.tsx",
  },
  {
    create: createSearchMorphRegistryItem,
    exportName: "SearchMorph",
    name: "search-morph",
    output: "apps/www/public/r/search-morph.json",
    source: "packages/suluu/src/search-morph/search-morph.tsx",
  },
  {
    create: createSegmentedControlRegistryItem,
    exportName: "SegmentedControl",
    name: "segmented-control",
    output: "apps/www/public/r/segmented-control.json",
    source: "packages/suluu/src/segmented-control/segmented-control.tsx",
  },
  {
    create: createSlideControlRegistryItem,
    exportName: "SlideControl",
    name: "slide-control",
    output: "apps/www/public/r/slide-control.json",
    source: "packages/suluu/src/slide-control/slide-control.tsx",
  },
  {
    create: createSwitchToggleRegistryItem,
    exportName: "SwitchToggle",
    name: "switch-toggle",
    output: "apps/www/public/r/switch-toggle.json",
    source: "packages/suluu/src/switch-toggle/switch-toggle.tsx",
  },
];

export function serializeRegistryItem(item: unknown): string {
  return `${JSON.stringify(item, null, 2)}\n`;
}
