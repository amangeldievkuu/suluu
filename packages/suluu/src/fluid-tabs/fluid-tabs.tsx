"use client";

import { motion, useReducedMotion, type MotionStyle } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

/** Type scale the whole control is built from. */
export type FluidTabsSize = "sm" | "md" | "lg";

export interface FluidTab {
  /** CSS color used by the icon and label while this tab is active. */
  accentColor?: string;
  /** Disables this tab without disabling the rest of the list. */
  disabled?: boolean;
  /** Stable id for the tab trigger. Generated when omitted. */
  id?: string;
  /** Icon-sized content shown in both the compact and expanded states. */
  icon: ReactNode;
  /** Visible and accessible label revealed by the active tab. */
  label: string;
  /** Id of the tabpanel controlled by this trigger. */
  panelId?: string;
  /** Stable value emitted when this tab becomes active. */
  value: string;
}

type NativeTabListProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "aria-orientation" | "children" | "defaultValue" | "role"
>;

export type FluidTabsStyle = CSSProperties & {
  /** Em basis every dimension is derived from. Overrides `size`. */
  "--suluu-fluid-tabs-font-size"?: string;
};

export interface FluidTabsProps extends NativeTabListProps {
  /** Disables every tab in the list. */
  disabled?: boolean;
  /** Initial active value when uncontrolled. */
  defaultValue?: string;
  /** Called whenever an interaction requests a new active value. */
  onValueChange?: (value: string) => void;
  /** Type scale the tablist is sized from. */
  size?: FluidTabsSize;
  /** Inline styles, including an explicit `--suluu-fluid-tabs-font-size`. */
  style?: FluidTabsStyle;
  /** Tabs rendered in their visual and keyboard-navigation order. */
  tabs: readonly FluidTab[];
  /** Controlled active value. */
  value?: string;
}

/**
 * One geometry, expressed in em against the tablist's own font size, so a size
 * is only ever a change of type scale. The Tailwind classes below repeat these
 * numbers as literals — keep the two in step.
 */
const COMPACT_EM = 3;
const ICON_EM = 1.375;
const GAP_EM = 0.75;
const PADDING_EM = 1;
const MIN_EXPANDED_EM = 8.25;
const LIST_GAP_EM = 0.75;
/** Gutter left clear of the viewport edges, matching `calc(100vw - 2rem)`. */
const VIEWPORT_GUTTER = 32;

interface FluidTabsSizePreset {
  /** Em basis handed to CSS. */
  fontSize: string;
  /** Same value in pixels, for the first paint and for SSR. */
  fallback: number;
}

const SIZE_PRESETS: Record<FluidTabsSize, FluidTabsSizePreset> = {
  sm: { fontSize: "0.875rem", fallback: 14 },
  md: { fontSize: "1rem", fallback: 16 },
  lg: { fontSize: "1.3125rem", fallback: 21 },
};

const INSTANT = { duration: 0 } as const;
const FLUID_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 27,
  mass: 1.17,
};
const LABEL_ENTER_EASE = [0.22, 1, 0.36, 1] as const;
const LABEL_LEAVE_EASE = [0.4, 0, 1, 1] as const;
/**
 * Specular highlight clipped to the label glyphs. plus-lighter brightens
 * the type without laying a slab on the pill.
 */
const SHIMMER_GRADIENT =
  "linear-gradient(108deg, transparent 0%, color-mix(in oklab, white 40%, transparent) 30%, white 50%, color-mix(in oklab, white 40%, transparent) 70%, transparent 100%)";
/** Highlight width in em so it scales with the tablist type size. */
const SHIMMER_EM = 2.6;
const SHIMMER_SWEEP = {
  duration: 1,
  ease: [0.4, 0, 0.2, 1],
} as const;
const SHIMMER_FADE = {
  duration: 1,
  ease: "linear" as const,
  times: [0, 0.72, 1] as number[],
};

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type FluidTabStyle = MotionStyle & {
  "--suluu-fluid-tab-accent"?: string;
};

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

function findEnabledTab(
  tabs: readonly FluidTab[],
  startIndex: number,
  direction: 1 | -1,
): FluidTab | undefined {
  const count = tabs.length;
  if (count === 0) return undefined;

  for (let step = 1; step <= count; step += 1) {
    const index = (((startIndex + direction * step) % count) + count) % count;
    const tab = tabs[index];
    if (tab && !tab.disabled) return tab;
  }

  return undefined;
}

export const FluidTabs = forwardRef<HTMLDivElement, FluidTabsProps>(
  function FluidTabs(
    {
      className,
      defaultValue,
      disabled = false,
      onKeyDown,
      onValueChange,
      size = "md",
      style,
      tabs,
      value,
      ...tabListProps
    },
    forwardedRef,
  ) {
    const generatedId = useId();
    const rootRef = useRef<HTMLDivElement | null>(null);
    const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
    const labelRefs = useRef(new Map<string, HTMLSpanElement>());
    const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});
    const [unit, setUnit] = useState(0);
    const [availableWidth, setAvailableWidth] = useState(0);
    const [uncontrolledValue, setUncontrolledValue] = useState(
      defaultValue ?? tabs.find((tab) => !tab.disabled)?.value ?? "",
    );
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolledValue;
    const prefersReducedMotion = useReducedMotion() ?? false;
    const preset = SIZE_PRESETS[size];

    const setRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    useEffect(() => {
      if (isControlled || tabs.some((tab) => tab.value === uncontrolledValue)) {
        return;
      }

      setUncontrolledValue(tabs.find((tab) => !tab.disabled)?.value ?? "");
    }, [isControlled, tabs, uncontrolledValue]);

    useIsomorphicLayoutEffect(() => {
      const measure = () => {
        // The em basis is read back from the DOM rather than assumed, so the
        // control also follows a font size the consumer sets on it.
        const root = rootRef.current;
        if (root) {
          const nextUnit = Number.parseFloat(
            window.getComputedStyle(root).fontSize,
          );
          if (Number.isFinite(nextUnit) && nextUnit > 0) {
            setUnit((previous) =>
              previous === nextUnit ? previous : nextUnit,
            );
          }
        }

        const nextAvailable =
          document.documentElement.clientWidth - VIEWPORT_GUTTER;
        setAvailableWidth((previous) =>
          previous === nextAvailable ? previous : nextAvailable,
        );

        const nextWidths: Record<string, number> = {};

        for (const tab of tabs) {
          const node = labelRefs.current.get(tab.value);
          if (node) nextWidths[tab.value] = node.offsetWidth;
        }

        setLabelWidths((previous) => {
          const values = Object.keys(nextWidths);
          const unchanged =
            values.length === Object.keys(previous).length &&
            values.every((key) => previous[key] === nextWidths[key]);

          return unchanged ? previous : nextWidths;
        });
      };

      measure();
      window.addEventListener("resize", measure);

      if (typeof ResizeObserver === "undefined") {
        return () => window.removeEventListener("resize", measure);
      }

      const observer = new ResizeObserver(measure);
      for (const node of labelRefs.current.values()) observer.observe(node);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", measure);
      };
    }, [tabs]);

    const requestValue = useCallback(
      (nextValue: string) => {
        if (disabled || nextValue === currentValue) return;

        const nextTab = tabs.find((tab) => tab.value === nextValue);
        if (!nextTab || nextTab.disabled) return;

        if (!isControlled) setUncontrolledValue(nextValue);
        onValueChange?.(nextValue);
      },
      [currentValue, disabled, isControlled, onValueChange, tabs],
    );

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest<HTMLElement>(
        '[data-slot="fluid-tabs-trigger"]',
      );
      const triggerValue = trigger?.dataset.value;
      const currentIndex = tabs.findIndex((tab) => tab.value === triggerValue);
      if (currentIndex === -1) return;

      let nextTab: FluidTab | undefined;

      switch (event.key) {
        case "ArrowRight":
          nextTab = findEnabledTab(tabs, currentIndex, 1);
          break;
        case "ArrowLeft":
          nextTab = findEnabledTab(tabs, currentIndex, -1);
          break;
        case "Home":
          nextTab = tabs.find((tab) => !tab.disabled);
          break;
        case "End":
          for (let index = tabs.length - 1; index >= 0; index -= 1) {
            const tab = tabs[index];
            if (tab && !tab.disabled) {
              nextTab = tab;
              break;
            }
          }
          break;
        default:
          return;
      }

      if (!nextTab) return;

      event.preventDefault();
      requestValue(nextTab.value);
      triggerRefs.current.get(nextTab.value)?.focus();
    }

    const tabbableValue = (() => {
      if (disabled) return undefined;
      const selected = tabs.find((tab) => tab.value === currentValue);
      if (selected && !selected.disabled) return selected.value;
      return tabs.find((tab) => !tab.disabled)?.value;
    })();

    const em = unit || preset.fallback;
    const compactSize = em * COMPACT_EM;
    const chromeWidth = em * (PADDING_EM * 2 + ICON_EM + GAP_EM);
    // The other tabs stay circles, so only what they leave behind is available
    // to the one that opens.
    const reserved =
      Math.max(0, tabs.length - 1) * (compactSize + em * LIST_GAP_EM);
    const maxExpanded =
      availableWidth > 0
        ? Math.max(compactSize, availableWidth - reserved)
        : Number.POSITIVE_INFINITY;

    const rootStyle: FluidTabsStyle = {
      "--suluu-fluid-tabs-font-size": preset.fontSize,
      fontSize: "var(--suluu-fluid-tabs-font-size)",
      ...style,
    };

    return (
      <div
        {...tabListProps}
        aria-disabled={disabled || undefined}
        aria-orientation="horizontal"
        className={joinClassNames(
          "inline-flex max-w-full items-center justify-center gap-[0.75em]",
          disabled ? "opacity-45" : undefined,
          className,
        )}
        data-disabled={disabled ? "true" : "false"}
        data-size={size}
        data-slot="fluid-tabs"
        data-state={currentValue}
        onKeyDown={handleKeyDown}
        ref={setRootRef}
        role="tablist"
        style={rootStyle}
        tabIndex={-1}
      >
        {tabs.map((tab, index) => {
          const isSelected = tab.value === currentValue;
          const isDisabled = disabled || Boolean(tab.disabled);
          const labelWidth = labelWidths[tab.value] ?? 0;
          const naturalWidth = Math.max(
            em * MIN_EXPANDED_EM,
            chromeWidth + labelWidth,
          );
          const expandedWidth = Math.min(naturalWidth, maxExpanded);
          const visibleLabelWidth = Math.max(
            0,
            Math.min(labelWidth, expandedWidth - chromeWidth),
          );
          const sheenWidth = em * SHIMMER_EM;
          const showSheen =
            isSelected &&
            !isDisabled &&
            !prefersReducedMotion &&
            labelWidth > 0;
          const iconSize = em * ICON_EM;
          // Rest inset of the icon+label row. Animating this instead of
          // flex-centering the trigger keeps the icon on one spring instead
          // of a new center every time width, gap, and label width overshoot.
          const groupX = isSelected
            ? (expandedWidth - iconSize - em * GAP_EM - visibleLabelWidth) / 2
            : (compactSize - iconSize) / 2;
          const tabStyle: FluidTabStyle = {
            "--suluu-fluid-tab-accent":
              tab.accentColor ?? "var(--suluu-fluid-tabs-accent)",
            originX: 0,
          };
          // Everything that moves rides the same spring, so the label settles
          // with the shape instead of landing ahead of it. Opacity stays a
          // tween because a spring on it reads as a flicker.
          const labelTransition = prefersReducedMotion
            ? INSTANT
            : isSelected
              ? {
                  marginLeft: FLUID_SPRING,
                  opacity: {
                    delay: 0.06,
                    duration: 0.2,
                    ease: LABEL_ENTER_EASE,
                  },
                  width: FLUID_SPRING,
                  x: FLUID_SPRING,
                }
              : {
                  marginLeft: FLUID_SPRING,
                  opacity: { duration: 0.1, ease: LABEL_LEAVE_EASE },
                  width: FLUID_SPRING,
                  x: FLUID_SPRING,
                };

          return (
            <motion.button
              animate={{ width: isSelected ? expandedWidth : compactSize }}
              aria-controls={tab.panelId}
              aria-selected={isSelected}
              className={joinClassNames(
                "relative inline-flex h-[3em] shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-[var(--suluu-fluid-tabs-border)] bg-[var(--suluu-fluid-tabs-background)] shadow-[var(--suluu-fluid-tabs-shadow)] transition-[color,filter,box-shadow] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--suluu-fluid-tabs-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-fluid-tabs-offset)] disabled:cursor-not-allowed motion-reduce:transition-none",
                // Both colours live in the ternary: two `text-*` classes on
                // one element would be resolved by stylesheet order, not by
                // which branch is active.
                isSelected
                  ? "text-[var(--suluu-fluid-tab-accent)]"
                  : "text-[var(--suluu-fluid-tabs-foreground)] hover:brightness-[0.985]",
              )}
              data-disabled={isDisabled ? "true" : "false"}
              data-slot="fluid-tabs-trigger"
              data-state={isSelected ? "active" : "inactive"}
              data-value={tab.value}
              disabled={isDisabled}
              id={tab.id ?? `${generatedId}-tab-${String(index)}`}
              initial={false}
              key={tab.value}
              onClick={() => requestValue(tab.value)}
              ref={(node) => {
                if (node) triggerRefs.current.set(tab.value, node);
                else triggerRefs.current.delete(tab.value);
              }}
              role="tab"
              style={tabStyle}
              tabIndex={tab.value === tabbableValue ? 0 : -1}
              transition={prefersReducedMotion ? INSTANT : FLUID_SPRING}
              type="button"
              whileTap={
                isDisabled || prefersReducedMotion ? {} : { scale: 0.975 }
              }
            >
              <motion.span
                animate={{ x: groupX }}
                className="absolute inset-y-0 left-0 flex items-center"
                data-slot="fluid-tabs-content"
                initial={false}
                transition={prefersReducedMotion ? INSTANT : FLUID_SPRING}
              >
                <span
                  aria-hidden="true"
                  className="grid size-[1.375em] shrink-0 place-items-center [&>svg]:size-full"
                  data-slot="fluid-tabs-icon"
                >
                  {tab.icon}
                </span>
                <motion.span
                  animate={{
                    marginLeft: isSelected ? em * GAP_EM : 0,
                    opacity: isSelected ? 1 : 0,
                    width: isSelected ? visibleLabelWidth : 0,
                    x: isSelected ? 0 : -6,
                  }}
                  className="relative block overflow-hidden leading-none font-semibold tracking-[-0.025em] whitespace-nowrap"
                  data-slot="fluid-tabs-label"
                  initial={false}
                  transition={labelTransition}
                >
                  <span
                    className="relative isolate block w-max"
                    ref={(node) => {
                      if (node) labelRefs.current.set(tab.value, node);
                      else labelRefs.current.delete(tab.value);
                    }}
                  >
                    {tab.label}
                    {showSheen ? (
                      // Pixel travel stays complete while the pill settles.
                      // Keyframe arrays play from mount — the trigger's
                      // `initial={false}` would suppress a declared `initial`.
                      // Unmounting on deselect is what lets it replay.
                      <motion.span
                        animate={{ opacity: [1, 1, 0] }}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        data-slot="fluid-tabs-shimmer"
                        transition={{ opacity: SHIMMER_FADE }}
                      >
                        <motion.span
                          animate={{
                            backgroundPositionX: [
                              -sheenWidth,
                              labelWidth + sheenWidth * 0.12,
                            ],
                          }}
                          className="absolute inset-0 block bg-clip-text bg-no-repeat text-transparent opacity-[var(--suluu-fluid-tabs-shimmer-intensity)] mix-blend-plus-lighter [-webkit-text-fill-color:transparent]"
                          style={{
                            backgroundImage: SHIMMER_GRADIENT,
                            backgroundSize: `${String(sheenWidth)}px 100%`,
                          }}
                          transition={{ backgroundPositionX: SHIMMER_SWEEP }}
                        >
                          {tab.label}
                        </motion.span>
                      </motion.span>
                    ) : null}
                  </span>
                </motion.span>
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    );
  },
);

FluidTabs.displayName = "FluidTabs";
