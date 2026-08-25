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

export function createFluidTabsRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "fluid-tabs",
    type: "registry:ui",
    title: "FluidTabs",
    description:
      "A horizontal tablist whose active circle springs open to reveal its label.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/fluid-tabs/fluid-tabs.tsx",
        type: "registry:ui",
        target: "@ui/fluid-tabs.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-fluid-tabs-font-size": "1rem",
        "suluu-fluid-tabs-background": "oklch(1 0 0)",
        "suluu-fluid-tabs-foreground": "oklch(0.35 0.01 260)",
        "suluu-fluid-tabs-border": "oklch(1 0 0 / 92%)",
        "suluu-fluid-tabs-accent": "oklch(0.61 0.21 255)",
        "suluu-fluid-tabs-ring": "oklch(0.55 0.16 255)",
        "suluu-fluid-tabs-offset": "oklch(0.97 0.004 260)",
        "suluu-fluid-tabs-shimmer-intensity": "0.7",
        "suluu-fluid-tabs-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 86%), 0 2px 3px oklch(0.2 0.02 260 / 6%), 0 12px 28px oklch(0.2 0.02 260 / 11%)",
      },
      dark: {
        "suluu-fluid-tabs-font-size": "1rem",
        "suluu-fluid-tabs-background": "oklch(0.245 0.013 260)",
        "suluu-fluid-tabs-foreground": "oklch(0.96 0.006 260)",
        "suluu-fluid-tabs-border": "oklch(1 0 0 / 10%)",
        "suluu-fluid-tabs-accent": "oklch(0.72 0.15 255)",
        "suluu-fluid-tabs-ring": "oklch(0.7 0.13 255)",
        "suluu-fluid-tabs-offset": "oklch(0.14 0.008 260)",
        "suluu-fluid-tabs-shimmer-intensity": "0.92",
        "suluu-fluid-tabs-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 7%), 0 2px 3px oklch(0 0 0 / 24%), 0 14px 32px oklch(0 0 0 / 32%)",
      },
    },
    docs: "The component requires Tailwind CSS. Give each tablist an accessible name and connect tab ids to consumer-owned tabpanels when content is present.",
    categories: ["navigation", "tabs", "animated"],
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

export function createOtpInputRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "otp-input",
    type: "registry:ui",
    title: "OtpInput",
    description:
      "A precise one-time-code and PIN field whose active slot, digits, and caret settle with restrained motion.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/otp-input/otp-input.tsx",
        type: "registry:ui",
        target: "@ui/otp-input.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-otp-background": "oklch(0.99 0.002 260)",
        "suluu-otp-foreground": "oklch(0.16 0.008 260)",
        "suluu-otp-muted": "oklch(0.53 0.014 260)",
        "suluu-otp-border": "oklch(0.9 0.007 260)",
        "suluu-otp-ring": "oklch(0.55 0.16 255)",
        "suluu-otp-caret": "oklch(0.52 0.17 255)",
        "suluu-otp-error": "oklch(0.56 0.19 25)",
        "suluu-otp-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 82%), 0 1px 2px oklch(0.2 0.02 260 / 7%), 0 5px 14px oklch(0.2 0.02 260 / 5%)",
        "suluu-otp-active-shadow":
          "inset 0 0 0 1px oklch(0.55 0.16 255 / 9%), 0 5px 16px oklch(0.5 0.18 255 / 12%)",
        "suluu-otp-error-shadow":
          "inset 0 0 0 1px oklch(0.56 0.19 25 / 8%), 0 5px 16px oklch(0.52 0.17 25 / 10%)",
      },
      dark: {
        "suluu-otp-background": "oklch(0.235 0.013 260)",
        "suluu-otp-foreground": "oklch(0.97 0.004 260)",
        "suluu-otp-muted": "oklch(0.68 0.014 260)",
        "suluu-otp-border": "oklch(1 0 0 / 12%)",
        "suluu-otp-ring": "oklch(0.7 0.13 255)",
        "suluu-otp-caret": "oklch(0.74 0.12 255)",
        "suluu-otp-error": "oklch(0.7 0.16 25)",
        "suluu-otp-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 6%), 0 1px 2px oklch(0 0 0 / 24%), 0 7px 18px oklch(0 0 0 / 18%)",
        "suluu-otp-active-shadow":
          "inset 0 0 0 1px oklch(0.7 0.13 255 / 12%), 0 7px 20px oklch(0.64 0.15 255 / 16%)",
        "suluu-otp-error-shadow":
          "inset 0 0 0 1px oklch(0.7 0.16 25 / 10%), 0 7px 20px oklch(0.64 0.15 25 / 14%)",
      },
    },
    docs: "The component requires Tailwind CSS. It accepts numeric codes, uses one native input for autofill and forms, and includes an accessible inline error when provided.",
    categories: ["forms", "inputs", "animated"],
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
      "A range slider whose fill follows the thumb with a little mass, then both settle onto the value.",
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

export function createRopeTimePickerRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "rope-time-picker",
    type: "registry:ui",
    title: "RopeTimePicker",
    description:
      "A precise analog time picker whose draggable hands bend and settle like softly weighted ropes.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/rope-time-picker/rope-time-picker.tsx",
        type: "registry:ui",
        target: "@ui/rope-time-picker.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-rope-time-background": "oklch(0.985 0.003 260)",
        "suluu-rope-time-foreground": "oklch(0.19 0.012 260)",
        "suluu-rope-time-muted": "oklch(0.58 0.014 260)",
        "suluu-rope-time-hour": "oklch(0.66 0.11 55)",
        "suluu-rope-time-border": "oklch(0.89 0.008 260)",
        "suluu-rope-time-guide": "oklch(0.82 0.012 260)",
        "suluu-rope-time-rope": "oklch(0.47 0.045 255)",
        "suluu-rope-time-rope-highlight": "oklch(1 0 0)",
        "suluu-rope-time-accent": "oklch(0.58 0.19 255)",
        "suluu-rope-time-second": "oklch(0.57 0.2 28)",
        "suluu-rope-time-control": "oklch(0.995 0.002 260)",
        "suluu-rope-time-control-border": "oklch(0.84 0.012 260)",
        "suluu-rope-time-center": "oklch(0.995 0.002 260 / 94%)",
        "suluu-rope-time-center-hover": "oklch(0.96 0.007 260)",
        "suluu-rope-time-readout": "oklch(0.97 0.004 260 / 88%)",
        "suluu-rope-time-readout-active": "oklch(0.58 0.19 255 / 9%)",
        "suluu-rope-time-readout-hover": "oklch(0.2 0.02 260 / 5%)",
        "suluu-rope-time-ring": "oklch(0.55 0.16 255)",
        "suluu-rope-time-offset": "oklch(1 0 0)",
        "suluu-rope-time-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 84%), 0 2px 4px oklch(0.2 0.02 260 / 7%), 0 18px 46px oklch(0.2 0.02 260 / 10%)",
        "suluu-rope-time-rope-shadow":
          "drop-shadow(0 1px 1px oklch(0.2 0.04 255 / 18%))",
        "suluu-rope-time-control-shadow":
          "0 1px 2px oklch(0.16 0.02 260 / 14%), 0 4px 10px oklch(0.3 0.08 255 / 12%)",
        "suluu-rope-time-center-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 82%), 0 2px 4px oklch(0.2 0.02 260 / 9%), 0 8px 20px oklch(0.2 0.02 260 / 9%)",
        "suluu-rope-time-readout-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 76%), 0 4px 14px oklch(0.2 0.02 260 / 7%)",
      },
      dark: {
        "suluu-rope-time-background": "oklch(0.205 0.012 260)",
        "suluu-rope-time-foreground": "oklch(0.96 0.006 260)",
        "suluu-rope-time-muted": "oklch(0.62 0.016 260)",
        "suluu-rope-time-hour": "oklch(0.78 0.1 58)",
        "suluu-rope-time-border": "oklch(1 0 0 / 12%)",
        "suluu-rope-time-guide": "oklch(1 0 0 / 13%)",
        "suluu-rope-time-rope": "oklch(0.7 0.065 255)",
        "suluu-rope-time-rope-highlight": "oklch(0.98 0.008 255)",
        "suluu-rope-time-accent": "oklch(0.72 0.15 255)",
        "suluu-rope-time-second": "oklch(0.68 0.18 28)",
        "suluu-rope-time-control": "oklch(0.275 0.016 260)",
        "suluu-rope-time-control-border": "oklch(1 0 0 / 18%)",
        "suluu-rope-time-center": "oklch(0.255 0.015 260 / 94%)",
        "suluu-rope-time-center-hover": "oklch(0.31 0.018 260)",
        "suluu-rope-time-readout": "oklch(0.225 0.013 260 / 90%)",
        "suluu-rope-time-readout-active": "oklch(0.72 0.15 255 / 13%)",
        "suluu-rope-time-readout-hover": "oklch(1 0 0 / 7%)",
        "suluu-rope-time-ring": "oklch(0.7 0.13 255)",
        "suluu-rope-time-offset": "oklch(0.14 0.008 260)",
        "suluu-rope-time-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 6%), 0 2px 4px oklch(0 0 0 / 24%), 0 22px 54px oklch(0 0 0 / 34%)",
        "suluu-rope-time-rope-shadow":
          "drop-shadow(0 2px 2px oklch(0 0 0 / 34%))",
        "suluu-rope-time-control-shadow":
          "0 1px 2px oklch(0 0 0 / 28%), 0 5px 12px oklch(0 0 0 / 28%)",
        "suluu-rope-time-center-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 7%), 0 2px 4px oklch(0 0 0 / 28%), 0 10px 24px oklch(0 0 0 / 28%)",
        "suluu-rope-time-readout-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 6%), 0 6px 18px oklch(0 0 0 / 24%)",
      },
    },
    docs: "The component requires Tailwind CSS. It is a twelve-hour wall-clock picker; give the group an accessible name when the default Time picker label is not specific enough.",
    categories: ["forms", "inputs", "time", "animated"],
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

export function createThemeToggleRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "theme-toggle",
    type: "registry:ui",
    title: "ThemeToggle",
    description:
      "A refined light-and-dark theme button with custom sun and moon icons that crossfade on controlled springs.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/theme-toggle/theme-toggle.tsx",
        type: "registry:ui",
        target: "@ui/theme-toggle.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-theme-toggle-background": "oklch(0.985 0.003 260 / 88%)",
        "suluu-theme-toggle-hover": "oklch(0.955 0.006 260)",
        "suluu-theme-toggle-border": "oklch(0.9 0.008 260 / 88%)",
        "suluu-theme-toggle-sun": "oklch(0.62 0.12 74)",
        "suluu-theme-toggle-moon": "oklch(0.42 0.045 260)",
        "suluu-theme-toggle-ring": "oklch(0.55 0.16 255)",
        "suluu-theme-toggle-offset": "oklch(1 0 0)",
        "suluu-theme-toggle-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 82%), 0 1px 2px oklch(0.2 0.02 260 / 7%), 0 5px 14px oklch(0.2 0.02 260 / 6%)",
      },
      dark: {
        "suluu-theme-toggle-background": "oklch(0.205 0.012 260 / 88%)",
        "suluu-theme-toggle-hover": "oklch(0.255 0.015 260)",
        "suluu-theme-toggle-border": "oklch(1 0 0 / 12%)",
        "suluu-theme-toggle-sun": "oklch(0.82 0.105 78)",
        "suluu-theme-toggle-moon": "oklch(0.82 0.06 255)",
        "suluu-theme-toggle-ring": "oklch(0.7 0.13 255)",
        "suluu-theme-toggle-offset": "oklch(0.14 0.008 260)",
        "suluu-theme-toggle-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 7%), 0 1px 2px oklch(0 0 0 / 24%), 0 7px 18px oklch(0 0 0 / 20%)",
      },
    },
    docs: "The component requires Tailwind CSS. `checked` represents dark mode; connect it to your theme state or provider. The default accessible name is Dark mode.",
    categories: ["buttons", "navigation", "animated"],
    meta: {
      version: "0.1.0",
    },
  } as const;

  return registryItemSchema.parse(item);
}

export function createSpotlightCardRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "spotlight-card",
    type: "registry:ui",
    title: "SpotlightCard",
    description:
      "A quiet card surface whose soft light follows a fine pointer on carefully damped springs.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/spotlight-card/spotlight-card.tsx",
        type: "registry:ui",
        target: "@ui/spotlight-card.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-spotlight-card-background": "oklch(0.97 0.004 260)",
        "suluu-spotlight-card-foreground": "oklch(0.18 0.01 260)",
        "suluu-spotlight-card-muted": "oklch(0.52 0.014 260)",
        "suluu-spotlight-card-border": "oklch(0.89 0.009 260 / 86%)",
        "suluu-spotlight-card-radius": "1.5rem",
        "suluu-spotlight-card-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 82%), 0 1px 2px oklch(0.2 0.02 260 / 5%), 0 18px 45px oklch(0.2 0.02 260 / 8%)",
        "suluu-spotlight-card-spotlight": "oklch(0.94 0.055 78)",
        "suluu-spotlight-card-blend": "normal",
        "suluu-spotlight-card-size": "20rem",
        "suluu-spotlight-card-intensity": "0.26",
      },
      dark: {
        "suluu-spotlight-card-background": "oklch(0.19 0.012 260)",
        "suluu-spotlight-card-foreground": "oklch(0.96 0.006 260)",
        "suluu-spotlight-card-muted": "oklch(0.68 0.014 260)",
        "suluu-spotlight-card-border": "oklch(1 0 0 / 11%)",
        "suluu-spotlight-card-radius": "1.5rem",
        "suluu-spotlight-card-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 5%), 0 1px 2px oklch(0 0 0 / 26%), 0 20px 50px oklch(0 0 0 / 34%)",
        "suluu-spotlight-card-spotlight": "oklch(0.82 0.06 240)",
        "suluu-spotlight-card-blend": "plus-lighter",
        "suluu-spotlight-card-size": "20rem",
        "suluu-spotlight-card-intensity": "0.2",
      },
    },
    docs: "The component requires Tailwind CSS. Pointer tracking is skipped for reduced motion, touch-first devices, and disabled cards; interactive descendants remain fully usable.",
    categories: ["surfaces", "animated"],
    meta: {
      version: "0.1.0",
    },
  } as const;

  return registryItemSchema.parse(item);
}

export function createToastRegistryItem(source: string): RegistryItem {
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "toast",
    type: "registry:ui",
    title: "Toaster",
    description:
      "A quiet toast deck that peeks four, springs the front three apart on hover, and scrolls the rest of the deck into view.",
    author: "Suluu contributors",
    dependencies: ["motion@^13.1.0"],
    files: [
      {
        path: "registry/toast/toast.tsx",
        type: "registry:ui",
        target: "@ui/toast.tsx",
        content: source,
      },
    ],
    cssVars: {
      light: {
        "suluu-toast-surface": "oklch(0.995 0.002 260 / 88%)",
        "suluu-toast-foreground": "oklch(0.16 0.008 260)",
        "suluu-toast-muted": "oklch(0.53 0.014 260)",
        "suluu-toast-border": "oklch(0.9 0.006 260 / 80%)",
        "suluu-toast-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 70%), 0 1px 1px oklch(0.2 0.02 260 / 7%), 0 12px 34px oklch(0.2 0.02 260 / 14%)",
        "suluu-toast-ring": "oklch(0.55 0.16 255)",
        "suluu-toast-offset": "oklch(0.99 0.002 260)",
        "suluu-toast-track": "oklch(0.2 0.02 260 / 10%)",
        "suluu-toast-action": "oklch(0.2 0.02 260 / 7%)",
        "suluu-toast-action-foreground": "oklch(0.16 0.008 260)",
        "suluu-toast-action-hover": "oklch(0.2 0.02 260 / 12%)",
        "suluu-toast-neutral": "oklch(0.53 0.014 260)",
        "suluu-toast-success": "oklch(0.56 0.13 158)",
        "suluu-toast-error": "oklch(0.56 0.19 25)",
        "suluu-toast-warning": "oklch(0.62 0.14 70)",
        "suluu-toast-info": "oklch(0.55 0.16 255)",
      },
      dark: {
        "suluu-toast-surface": "oklch(0.255 0.014 260 / 88%)",
        "suluu-toast-foreground": "oklch(0.97 0.004 260)",
        "suluu-toast-muted": "oklch(0.7 0.013 260)",
        "suluu-toast-border": "oklch(1 0 0 / 12%)",
        "suluu-toast-shadow":
          "inset 0 1px 0 oklch(1 0 0 / 6%), 0 1px 1px oklch(0 0 0 / 20%), 0 16px 40px oklch(0 0 0 / 40%)",
        "suluu-toast-ring": "oklch(0.7 0.13 255)",
        "suluu-toast-offset": "oklch(0.2 0.012 260)",
        "suluu-toast-track": "oklch(1 0 0 / 12%)",
        "suluu-toast-action": "oklch(1 0 0 / 9%)",
        "suluu-toast-action-foreground": "oklch(0.97 0.004 260)",
        "suluu-toast-action-hover": "oklch(1 0 0 / 15%)",
        "suluu-toast-neutral": "oklch(0.7 0.013 260)",
        "suluu-toast-success": "oklch(0.75 0.15 158)",
        "suluu-toast-error": "oklch(0.7 0.16 25)",
        "suluu-toast-warning": "oklch(0.79 0.14 78)",
        "suluu-toast-info": "oklch(0.72 0.13 255)",
      },
    },
    docs: "The component requires Tailwind CSS. Render one <Toaster /> near the root of your app, then call toast() from anywhere. Use createToaster() when a page needs a second, isolated deck.",
    categories: ["feedback", "overlay", "animated"],
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
    create: createFluidTabsRegistryItem,
    exportName: "FluidTabs",
    name: "fluid-tabs",
    output: "apps/www/public/r/fluid-tabs.json",
    source: "packages/suluu/src/fluid-tabs/fluid-tabs.tsx",
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
    create: createOtpInputRegistryItem,
    exportName: "OtpInput",
    name: "otp-input",
    output: "apps/www/public/r/otp-input.json",
    source: "packages/suluu/src/otp-input/otp-input.tsx",
  },
  {
    create: createRopeTimePickerRegistryItem,
    exportName: "RopeTimePicker",
    name: "rope-time-picker",
    output: "apps/www/public/r/rope-time-picker.json",
    source: "packages/suluu/src/rope-time-picker/rope-time-picker.tsx",
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
    create: createSpotlightCardRegistryItem,
    exportName: "SpotlightCard",
    name: "spotlight-card",
    output: "apps/www/public/r/spotlight-card.json",
    source: "packages/suluu/src/spotlight-card/spotlight-card.tsx",
  },
  {
    create: createSwitchToggleRegistryItem,
    exportName: "SwitchToggle",
    name: "switch-toggle",
    output: "apps/www/public/r/switch-toggle.json",
    source: "packages/suluu/src/switch-toggle/switch-toggle.tsx",
  },
  {
    create: createThemeToggleRegistryItem,
    exportName: "ThemeToggle",
    name: "theme-toggle",
    output: "apps/www/public/r/theme-toggle.json",
    source: "packages/suluu/src/theme-toggle/theme-toggle.tsx",
  },
  {
    create: createToastRegistryItem,
    exportName: "Toaster",
    name: "toast",
    output: "apps/www/public/r/toast.json",
    source: "packages/suluu/src/toast/toast.tsx",
  },
];

export function serializeRegistryItem(item: unknown): string {
  return `${JSON.stringify(item, null, 2)}\n`;
}
