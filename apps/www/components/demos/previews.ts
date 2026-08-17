import type { ComponentType } from "react";

import type { ComponentSlug } from "@/lib/catalog";

import { MagnetPullDemo } from "./magnet-pull-demo";
import { NotifyMorphDemo } from "./notify-morph-demo";
import { SwitchToggleDemo } from "./switch-toggle-demo";
import type { DemoProps } from "./types";

/**
 * Keyed by the slug union, so adding a catalog entry without a demo is a type
 * error rather than an empty card.
 */
export const COMPONENT_PREVIEWS: Record<
  ComponentSlug,
  ComponentType<DemoProps>
> = {
  "magnet-pull": MagnetPullDemo,
  "notify-morph": NotifyMorphDemo,
  "switch-toggle": SwitchToggleDemo,
};
