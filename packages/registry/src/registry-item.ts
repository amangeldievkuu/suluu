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

export function serializeRegistryItem(item: unknown): string {
  return `${JSON.stringify(item, null, 2)}\n`;
}
