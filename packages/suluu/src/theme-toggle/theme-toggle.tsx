"use client";

import { motion, useReducedMotion, type MotionStyle } from "motion/react";
import {
  forwardRef,
  useCallback,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

export type ThemeToggleMotionIntensity = "subtle" | "default" | "expressive";

/** Conflicting handlers that Motion redefines on its own components. */
type ConflictingButtonProps =
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
  | "onTransitionEnd";

export interface ThemeToggleProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  ConflictingButtonProps | "aria-pressed" | "children" | "style" | "type"
> {
  /** Controlled state. `true` represents dark mode. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Called whenever an interaction requests a theme-state change. */
  onCheckedChange?: (checked: boolean) => void;
  /** Controls the icon spring, crossfade character, and press response. */
  motionIntensity?: ThemeToggleMotionIntensity;
  /** Content shown when light mode is active. */
  lightIcon?: ReactNode;
  /** Content shown when dark mode is active. */
  darkIcon?: ReactNode;
  /** Inline styles passed to the Motion button. */
  style?: MotionStyle;
}

interface ThemeToggleMotionPreset {
  blur: number;
  rotate: number;
  scale: number;
  spring: {
    type: "spring";
    stiffness: number;
    damping: number;
    mass: number;
  };
  tap: number;
}

const MOTION_PRESETS: Record<
  ThemeToggleMotionIntensity,
  ThemeToggleMotionPreset
> = {
  subtle: {
    blur: 0,
    rotate: 5,
    scale: 0.94,
    spring: { type: "spring", stiffness: 420, damping: 34, mass: 0.65 },
    tap: 0.99,
  },
  default: {
    blur: 0.75,
    rotate: 10,
    scale: 0.84,
    spring: { type: "spring", stiffness: 340, damping: 28, mass: 0.8 },
    tap: 0.98,
  },
  expressive: {
    blur: 1.25,
    rotate: 16,
    scale: 0.76,
    spring: { type: "spring", stiffness: 280, damping: 26, mass: 0.9 },
    tap: 0.97,
  },
};

const CROSSFADE_EASE = [0.22, 1, 0.36, 1] as const;

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-full"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        r="3.35"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="1.65">
        <path d="M12 2.65v1.7" />
        <path d="M12 19.65v1.7" />
        <path d="m5.39 5.39 1.2 1.2" />
        <path d="m17.41 17.41 1.2 1.2" />
        <path d="M2.65 12h1.7" />
        <path d="M19.65 12h1.7" />
        <path d="m5.39 18.61 1.2-1.2" />
        <path d="m17.41 6.59 1.2-1.2" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-full"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M19.38 15.17a7.74 7.74 0 0 1-10.55-10.55 7.79 7.79 0 1 0 10.55 10.55Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  );
}

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  function ThemeToggle(
    {
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      checked,
      className,
      darkIcon,
      defaultChecked = false,
      disabled = false,
      lightIcon,
      motionIntensity = "default",
      onCheckedChange,
      onClick,
      style,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [uncontrolledChecked, setUncontrolledChecked] =
      useState(defaultChecked);
    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : uncontrolledChecked;
    const prefersReducedMotion = useReducedMotion() ?? false;
    const preset = MOTION_PRESETS[motionIntensity];

    const requestChecked = useCallback(
      (nextChecked: boolean) => {
        if (nextChecked === currentChecked) return;

        if (!isControlled) setUncontrolledChecked(nextChecked);
        onCheckedChange?.(nextChecked);
      },
      [currentChecked, isControlled, onCheckedChange],
    );

    function iconTargets(active: boolean, restingRotation: number) {
      if (prefersReducedMotion) {
        return {
          filter: "blur(0px)",
          opacity: active ? 1 : 0,
          rotate: 0,
          scale: 1,
        };
      }

      return {
        filter: active ? "blur(0px)" : `blur(${String(preset.blur)}px)`,
        opacity: active ? 1 : 0,
        rotate: active ? 0 : restingRotation,
        scale: active ? 1 : preset.scale,
      };
    }

    function iconTransition(active: boolean) {
      if (prefersReducedMotion) {
        return {
          duration: 0.12,
          ease: CROSSFADE_EASE,
        };
      }

      return {
        filter: {
          delay: active ? 0.03 : 0,
          duration: active ? 0.18 : 0.12,
          ease: CROSSFADE_EASE,
        },
        opacity: {
          delay: active ? 0.03 : 0,
          duration: active ? 0.18 : 0.12,
          ease: CROSSFADE_EASE,
        },
        rotate: { ...preset.spring, delay: active ? 0.02 : 0 },
        scale: { ...preset.spring, delay: active ? 0.02 : 0 },
      };
    }

    const accessibleLabel =
      ariaLabelledBy === undefined ? (ariaLabel ?? "Dark mode") : ariaLabel;
    const lightActive = !currentChecked;
    const darkActive = currentChecked;

    return (
      <motion.button
        {...buttonProps}
        aria-label={accessibleLabel}
        aria-labelledby={ariaLabelledBy}
        aria-pressed={currentChecked}
        className={joinClassNames(
          "relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[var(--suluu-theme-toggle-border)] bg-[var(--suluu-theme-toggle-background)] shadow-[var(--suluu-theme-toggle-shadow)] transition-[background-color,border-color,box-shadow,filter] duration-200 outline-none select-none hover:bg-[var(--suluu-theme-toggle-hover)] hover:brightness-[0.995] focus-visible:ring-2 focus-visible:ring-[var(--suluu-theme-toggle-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-theme-toggle-offset)] active:brightness-[0.985] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-colors",
          className,
        )}
        data-slot="theme-toggle"
        data-state={currentChecked ? "dark" : "light"}
        disabled={disabled}
        initial={false}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) requestChecked(!currentChecked);
        }}
        ref={forwardedRef}
        style={{ ...style }}
        transition={prefersReducedMotion ? { duration: 0 } : preset.spring}
        type="button"
        {...(prefersReducedMotion ? {} : { whileTap: { scale: preset.tap } })}
      >
        <motion.span
          animate={iconTargets(lightActive, -preset.rotate)}
          aria-hidden="true"
          className="absolute inline-flex size-[18px] items-center justify-center text-[var(--suluu-theme-toggle-sun)]"
          data-slot="theme-toggle-light-icon"
          data-state={lightActive ? "visible" : "hidden"}
          initial={false}
          style={{ transformOrigin: "center" }}
          transition={iconTransition(lightActive)}
        >
          {lightIcon ?? <SunIcon />}
        </motion.span>
        <motion.span
          animate={iconTargets(darkActive, preset.rotate)}
          aria-hidden="true"
          className="absolute inline-flex size-[18px] items-center justify-center text-[var(--suluu-theme-toggle-moon)]"
          data-slot="theme-toggle-dark-icon"
          data-state={darkActive ? "visible" : "hidden"}
          initial={false}
          style={{ transformOrigin: "center" }}
          transition={iconTransition(darkActive)}
        >
          {darkIcon ?? <MoonIcon />}
        </motion.span>
      </motion.button>
    );
  },
);

ThemeToggle.displayName = "ThemeToggle";
