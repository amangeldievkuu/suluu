"use client";

import { motion, type MotionStyle } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
} from "react";

export type MorphButtonIntensity = "subtle" | "default" | "expressive";

/** Conflicting handlers that Motion redefines on its own components. */
type ConflictingButtonProps =
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
  | "onTransitionEnd";

export interface MorphButtonProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  ConflictingButtonProps | "aria-label" | "children" | "style"
> {
  /** Stable accessible name while the visual content morphs. */
  "aria-label": string;
  /** Icon-sized content shown in the compact circular state. */
  compactContent: ReactNode;
  /** Content shown in the expanded pill state. */
  expandedContent: ReactNode;
  /** Holds the button open in addition to hover and focus-visible previews. */
  expanded?: boolean;
  /** Controls the spring, content rotation, and press character. */
  motionIntensity?: MorphButtonIntensity;
  /** Inline styles passed to the Motion button. */
  style?: MotionStyle;
}

interface MorphPreset {
  contractDamping: number;
  rotate: number;
  spring: {
    type: "spring";
    stiffness: number;
    damping: number;
    mass: number;
  };
  tap: number;
}

const MOTION_PRESETS: Record<MorphButtonIntensity, MorphPreset> = {
  subtle: {
    contractDamping: 38,
    rotate: 8,
    spring: { type: "spring", stiffness: 480, damping: 38, mass: 0.62 },
    tap: 0.985,
  },
  default: {
    contractDamping: 37,
    rotate: 18,
    spring: { type: "spring", stiffness: 320, damping: 27, mass: 1.17 },
    tap: 0.97,
  },
  expressive: {
    contractDamping: 29,
    rotate: 28,
    spring: { type: "spring", stiffness: 280, damping: 17, mass: 0.98 },
    tap: 0.95,
  },
};

/** Diameter of the compact circle, matching the h-12 track. */
const COMPACT_SIZE = 48;
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SETTLE_EASE = [0.22, 1, 0.36, 1] as const;
const LEAVE_EASE = [0.4, 0, 1, 1] as const;
const INSTANT = { duration: 0 } as const;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

function matchMediaList(query: string): MediaQueryList | null {
  return typeof window.matchMedia === "function"
    ? window.matchMedia(query)
    : null;
}

function getServerSnapshot(): boolean {
  return false;
}

function useMediaQuery(query: string, onDisabled?: () => void): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = matchMediaList(query);
      if (!list) return () => undefined;

      const handleChange = () => {
        if (!list.matches) onDisabled?.();
        onStoreChange();
      };

      list.addEventListener("change", handleChange);
      return () => list.removeEventListener("change", handleChange);
    },
    [onDisabled, query],
  );
  const getSnapshot = useCallback(
    () => matchMediaList(query)?.matches ?? false,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Natural width of the expanded content, so the pill can spring its own width
 * instead of being scaled by a layout projection. Scaling the surface would
 * re-rasterize the label on every frame; animating width leaves the text alone.
 */
function useMeasuredWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    // offsetWidth reports the untransformed box. getBoundingClientRect would
    // fold in the press scale and feed a shrinking target back into the spring.
    const measure = () =>
      setWidth((previous) =>
        node.offsetWidth === previous ? previous : node.offsetWidth,
      );

    measure();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

export const MorphButton = forwardRef<HTMLButtonElement, MorphButtonProps>(
  function MorphButton(
    {
      "aria-label": ariaLabel,
      className,
      compactContent,
      disabled = false,
      expanded = false,
      expandedContent,
      motionIntensity = "default",
      onBlur,
      onFocus,
      onPointerEnter,
      onPointerLeave,
      style,
      type = "button",
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [hovered, setHovered] = useState(false);
    const [focusVisible, setFocusVisible] = useState(false);
    const contentRef = useRef<HTMLSpanElement>(null);
    const clearPointerPreview = useCallback(() => setHovered(false), []);
    const hoverCapable = useMediaQuery(HOVER_QUERY, clearPointerPreview);
    const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
    const measuredWidth = useMeasuredWidth(contentRef);
    const preset = MOTION_PRESETS[motionIntensity];
    const hasPointerPreview = hoverCapable && hovered && !disabled;
    const hasFocusPreview = focusVisible && !disabled;
    const currentExpanded = expanded || hasPointerPreview || hasFocusPreview;
    const morphTransition = prefersReducedMotion
      ? INSTANT
      : currentExpanded
        ? preset.spring
        : { ...preset.spring, damping: preset.contractDamping };
    // Until the content has been measured the width classes carry the layout,
    // so the button is still correct without JavaScript.
    const targetWidth =
      measuredWidth > 0
        ? currentExpanded
          ? Math.max(COMPACT_SIZE, measuredWidth)
          : COMPACT_SIZE
        : null;

    const expandedTransition = prefersReducedMotion
      ? { filter: INSTANT, opacity: INSTANT }
      : currentExpanded
        ? {
            filter: { delay: 0.05, duration: 0.28, ease: SETTLE_EASE },
            opacity: { delay: 0.05, duration: 0.2, ease: SETTLE_EASE },
          }
        : {
            // The label leaves before the closing pill can squeeze it.
            filter: { duration: 0.14, ease: LEAVE_EASE },
            opacity: { duration: 0.1, ease: LEAVE_EASE },
          };
    const compactTransition = prefersReducedMotion
      ? { filter: INSTANT, opacity: INSTANT, rotate: INSTANT, scale: INSTANT }
      : currentExpanded
        ? {
            filter: { duration: 0.16, ease: LEAVE_EASE },
            opacity: { duration: 0.1, ease: LEAVE_EASE },
            rotate: { duration: 0.16, ease: LEAVE_EASE },
            scale: { duration: 0.16, ease: LEAVE_EASE },
          }
        : {
            filter: { delay: 0.06, duration: 0.18, ease: SETTLE_EASE },
            opacity: { delay: 0.06, duration: 0.18, ease: SETTLE_EASE },
            rotate: { ...preset.spring, delay: 0.06 },
            scale: { ...preset.spring, delay: 0.06 },
          };

    const expandedTargets = {
      filter:
        currentExpanded || prefersReducedMotion ? "blur(0px)" : "blur(4px)",
      opacity: currentExpanded ? 1 : 0,
    };
    const compactTargets = {
      filter:
        currentExpanded && !prefersReducedMotion ? "blur(2px)" : "blur(0px)",
      opacity: currentExpanded ? 0 : 1,
      rotate: currentExpanded && !prefersReducedMotion ? preset.rotate : 0,
      scale: currentExpanded && !prefersReducedMotion ? 0.7 : 1,
    };

    return (
      <motion.button
        {...buttonProps}
        animate={targetWidth === null ? {} : { width: targetWidth }}
        aria-label={ariaLabel}
        className={joinClassNames(
          "relative inline-flex h-12 min-w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border text-base font-semibold whitespace-nowrap transition-[background-color,border-color,box-shadow,color,filter] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--suluu-morph-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-morph-offset)] disabled:pointer-events-none disabled:opacity-50",
          currentExpanded
            ? "w-auto border-[var(--suluu-morph-accent-border)] bg-[var(--suluu-morph-accent)] text-[var(--suluu-morph-accent-foreground)] shadow-[var(--suluu-morph-accent-shadow)] hover:brightness-[0.985]"
            : "w-12 border-[var(--suluu-morph-border)] bg-[var(--suluu-morph-background)] text-[var(--suluu-morph-foreground)] shadow-[var(--suluu-morph-shadow)]",
          className,
        )}
        data-expanded={currentExpanded ? "true" : "false"}
        data-slot="morph-button"
        disabled={disabled}
        initial={false}
        onBlur={(event) => {
          onBlur?.(event);
          setFocusVisible(false);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          if (!event.defaultPrevented && !disabled) {
            setFocusVisible(event.currentTarget.matches(":focus-visible"));
          }
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented && hoverCapable && !disabled) {
            setHovered(true);
          }
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          setHovered(false);
        }}
        ref={forwardedRef}
        style={{ borderRadius: 9999, ...style }}
        transition={{ width: morphTransition }}
        type={type}
        {...(prefersReducedMotion ? {} : { whileTap: { scale: preset.tap } })}
      >
        {/* Sizes the pill. While compact it simply overflows the circle and is
            clipped from both edges, which is what reveals it on expansion. */}
        <motion.span
          animate={{
            ...expandedTargets,
            ...(currentExpanded ? ({ visibility: "visible" } as const) : {}),
            transitionEnd: currentExpanded
              ? ({ filter: "none" } as const)
              : ({ visibility: "hidden" } as const),
          }}
          aria-hidden="true"
          className="inline-flex shrink-0 items-center justify-center gap-2 px-5"
          data-slot="morph-button-expanded-content"
          data-state={currentExpanded ? "visible" : "hidden"}
          initial={{
            ...expandedTargets,
            visibility: currentExpanded ? "visible" : "hidden",
          }}
          ref={contentRef}
          transition={expandedTransition}
        >
          {expandedContent}
        </motion.span>
        <motion.span
          animate={{
            ...compactTargets,
            ...(currentExpanded ? {} : ({ visibility: "visible" } as const)),
            transitionEnd: currentExpanded
              ? ({ visibility: "hidden" } as const)
              : ({ filter: "none" } as const),
          }}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          data-slot="morph-button-compact-content"
          data-state={currentExpanded ? "hidden" : "visible"}
          initial={{
            ...compactTargets,
            visibility: currentExpanded ? "hidden" : "visible",
          }}
          transition={compactTransition}
        >
          {compactContent}
        </motion.span>
      </motion.button>
    );
  },
);

MorphButton.displayName = "MorphButton";
