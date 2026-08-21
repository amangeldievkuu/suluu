import type { ComponentType } from "react";

import type { ComponentSlug } from "@/lib/catalog";

import { CounterNumbersDemo } from "./counter-numbers-demo";
import { FluidTabsDemo } from "./fluid-tabs-demo";
import { MagnetPullDemo } from "./magnet-pull-demo";
import { MorphButtonDemo } from "./morph-button-demo";
import { NotifyMorphDemo } from "./notify-morph-demo";
import { OtpInputDemo } from "./otp-input-demo";
import { SearchMorphDemo } from "./search-morph-demo";
import { SegmentedControlDemo } from "./segmented-control-demo";
import { SlideControlDemo } from "./slide-control-demo";
import { SpotlightCardDemo } from "./spotlight-card-demo";
import { SwitchToggleDemo } from "./switch-toggle-demo";
import { ThemeToggleDemo } from "./theme-toggle-demo";
import { ToastDemo } from "./toast-demo";
import type { DemoProps } from "./types";

/**
 * Keyed by the slug union, so adding a catalog entry without a demo is a type
 * error rather than an empty card.
 */
export const COMPONENT_PREVIEWS: Record<
  ComponentSlug,
  ComponentType<DemoProps>
> = {
  "counter-numbers": CounterNumbersDemo,
  "fluid-tabs": FluidTabsDemo,
  "magnet-pull": MagnetPullDemo,
  "morph-button": MorphButtonDemo,
  "notify-morph": NotifyMorphDemo,
  "otp-input": OtpInputDemo,
  "search-morph": SearchMorphDemo,
  "segmented-control": SegmentedControlDemo,
  "slide-control": SlideControlDemo,
  "spotlight-card": SpotlightCardDemo,
  "switch-toggle": SwitchToggleDemo,
  "theme-toggle": ThemeToggleDemo,
  toast: ToastDemo,
};
