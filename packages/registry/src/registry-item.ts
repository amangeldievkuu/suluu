import { registryItemSchema } from "shadcn/schema";

export const NOTIFY_MORPH_SOURCE =
  "packages/suluu/src/notify-morph/notify-morph.tsx";
export const NOTIFY_MORPH_OUTPUT = "apps/www/public/r/notify-morph.json";

export function createNotifyMorphRegistryItem(source: string) {
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
        "suluu-notify-background": "oklch(0.99 0.003 260)",
        "suluu-notify-foreground": "oklch(0.21 0.015 260)",
        "suluu-notify-muted": "oklch(0.55 0.018 260)",
        "suluu-notify-border": "oklch(0.9 0.012 260)",
        "suluu-notify-hover": "oklch(0.96 0.01 260)",
        "suluu-notify-accent": "oklch(0.22 0.018 260)",
        "suluu-notify-accent-foreground": "oklch(0.985 0.002 260)",
        "suluu-notify-ring": "oklch(0.55 0.16 255)",
        "suluu-notify-shadow":
          "0 1px 2px oklch(0.2 0.02 260 / 6%), 0 8px 28px oklch(0.2 0.02 260 / 8%)",
      },
      dark: {
        "suluu-notify-background": "oklch(0.19 0.012 260)",
        "suluu-notify-foreground": "oklch(0.96 0.006 260)",
        "suluu-notify-muted": "oklch(0.69 0.018 260)",
        "suluu-notify-border": "oklch(0.31 0.016 260)",
        "suluu-notify-hover": "oklch(0.24 0.014 260)",
        "suluu-notify-accent": "oklch(0.94 0.008 260)",
        "suluu-notify-accent-foreground": "oklch(0.19 0.012 260)",
        "suluu-notify-ring": "oklch(0.7 0.13 255)",
        "suluu-notify-shadow":
          "0 1px 2px oklch(0 0 0 / 20%), 0 10px 34px oklch(0 0 0 / 24%)",
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

export function serializeRegistryItem(item: unknown): string {
  return `${JSON.stringify(item, null, 2)}\n`;
}
