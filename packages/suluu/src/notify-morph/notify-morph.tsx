"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type SubmitEvent,
} from "react";

export type MotionIntensity = "subtle" | "default" | "expressive";

export interface NotifyMorphProps extends Omit<
  ComponentPropsWithoutRef<"form">,
  "children" | "onSubmit"
> {
  /** Text shown by the collapsed trigger and expanded submit button. */
  label?: string;
  /** Placeholder for the email input. */
  placeholder?: string;
  /** Collapse after focus leaves the complete widget. */
  collapseOnBlur?: boolean;
  /** Disable both the trigger and expanded controls. */
  disabled?: boolean;
  /** Controlled email value. */
  value?: string;
  /** Initial email value when uncontrolled. */
  defaultValue?: string;
  /** Called whenever the email value changes. */
  onValueChange?: (value: string) => void;
  /** Controlled expansion state. */
  expanded?: boolean;
  /** Initial expansion state when uncontrolled. */
  defaultExpanded?: boolean;
  /** Called whenever an interaction requests an expansion change. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Controls the spring and bell-swing character. */
  motionIntensity?: MotionIntensity;
  /** Called only after the native required email input is valid. */
  onSubmit?: (email: string, event: SubmitEvent<HTMLFormElement>) => void;
}

interface MotionPreset {
  spring: {
    type: "spring";
    stiffness: number;
    damping: number;
    mass: number;
  };
  swing: number;
  swingDuration: number;
}

const MOTION_PRESETS: Record<MotionIntensity, MotionPreset> = {
  subtle: {
    spring: { type: "spring", stiffness: 520, damping: 42, mass: 0.58 },
    swing: 6,
    swingDuration: 0.38,
  },
  default: {
    spring: { type: "spring", stiffness: 430, damping: 32, mass: 0.68 },
    swing: 10,
    swingDuration: 0.5,
  },
  expressive: {
    spring: { type: "spring", stiffness: 350, damping: 24, mass: 0.82 },
    swing: 15,
    swingDuration: 0.64,
  },
};

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

interface BellIconProps {
  duration: number;
  reducedMotion: boolean;
  swing: number;
}

function BellIcon({ duration, reducedMotion, swing }: BellIconProps) {
  return (
    <motion.svg
      aria-hidden="true"
      className="size-4 shrink-0"
      fill="none"
      initial="idle"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      variants={{
        idle: { rotate: 0 },
        swing: reducedMotion
          ? { rotate: 0 }
          : {
              rotate: [0, -swing, swing * 0.72, swing * -0.4, 0],
              transition: { duration, ease: "easeInOut" },
            },
      }}
      viewBox="0 0 24 24"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </motion.svg>
  );
}

export const NotifyMorph = forwardRef<HTMLFormElement, NotifyMorphProps>(
  function NotifyMorph(
    {
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      collapseOnBlur = false,
      defaultExpanded = false,
      defaultValue = "",
      disabled = false,
      expanded,
      label = "Notify me",
      motionIntensity = "default",
      onBlur,
      onExpandedChange,
      onKeyDown,
      onSubmit,
      onValueChange,
      placeholder = "Email address",
      value,
      ...formProps
    },
    forwardedRef,
  ) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const [uncontrolledExpanded, setUncontrolledExpanded] =
      useState(defaultExpanded);
    const inputId = useId();
    const formRef = useRef<HTMLFormElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const previousExpandedRef = useRef(false);
    const restoreFocusRef = useRef(false);
    const prefersReducedMotion = useReducedMotion() ?? false;

    const isValueControlled = value !== undefined;
    const isExpandedControlled = expanded !== undefined;
    const currentValue = isValueControlled ? value : uncontrolledValue;
    const currentExpanded = isExpandedControlled
      ? expanded
      : uncontrolledExpanded;
    const preset = MOTION_PRESETS[motionIntensity];
    const layoutTransition = prefersReducedMotion
      ? { duration: 0 }
      : preset.spring;

    const setFormRef = useCallback(
      (node: HTMLFormElement | null) => {
        formRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    const requestExpanded = useCallback(
      (nextExpanded: boolean, restoreFocus = false) => {
        if (nextExpanded === currentExpanded) return;

        restoreFocusRef.current = restoreFocus;
        if (!isExpandedControlled) setUncontrolledExpanded(nextExpanded);
        onExpandedChange?.(nextExpanded);
      },
      [currentExpanded, isExpandedControlled, onExpandedChange],
    );

    useEffect(() => {
      const wasExpanded = previousExpandedRef.current;

      if (currentExpanded && !wasExpanded) {
        inputRef.current?.focus();
      } else if (!currentExpanded && wasExpanded && restoreFocusRef.current) {
        triggerRef.current?.focus();
        restoreFocusRef.current = false;
      }

      previousExpandedRef.current = currentExpanded;
    }, [currentExpanded]);

    function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      if (event.key === "Escape" && currentExpanded) {
        event.preventDefault();
        requestExpanded(false, true);
      }
    }

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
      event.preventDefault();

      if (disabled || !event.currentTarget.checkValidity()) {
        if (!disabled) event.currentTarget.reportValidity();
        return;
      }

      onSubmit?.(currentValue, event);
    }

    return (
      <form
        {...formProps}
        aria-label={
          ariaLabel ?? (ariaLabelledBy ? undefined : `${label} subscription`)
        }
        aria-labelledby={ariaLabelledBy}
        className={joinClassNames("inline-flex max-w-full", className)}
        onBlur={(event) => {
          onBlur?.(event);
          if (event.defaultPrevented || !collapseOnBlur || !currentExpanded) {
            return;
          }

          const nextTarget = event.relatedTarget;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
            requestExpanded(false);
          }
        }}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
        ref={setFormRef}
      >
        <motion.div
          className="overflow-hidden rounded-full border border-[var(--suluu-notify-border)] bg-[var(--suluu-notify-background)] text-[var(--suluu-notify-foreground)] shadow-[var(--suluu-notify-shadow)]"
          layout
          transition={{ layout: layoutTransition }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {currentExpanded ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="flex h-11 w-[min(22rem,calc(100vw-2rem))] items-center gap-1 p-1"
                exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -8 }}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 8 }}
                key="expanded"
                transition={layoutTransition}
              >
                <label className="sr-only" htmlFor={inputId}>
                  Email address
                </label>
                <input
                  autoComplete="email"
                  className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[var(--suluu-notify-muted)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={disabled}
                  id={inputId}
                  name="email"
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    if (!isValueControlled) setUncontrolledValue(nextValue);
                    onValueChange?.(nextValue);
                  }}
                  placeholder={placeholder}
                  ref={inputRef}
                  required
                  type="email"
                  value={currentValue}
                />
                <motion.button
                  animate={prefersReducedMotion ? "idle" : "swing"}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--suluu-notify-accent)] px-4 text-sm font-medium text-[var(--suluu-notify-accent-foreground)] transition-[filter] outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[var(--suluu-notify-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-notify-background)] disabled:pointer-events-none disabled:opacity-50"
                  disabled={disabled}
                  initial="idle"
                  type="submit"
                  whileFocus={prefersReducedMotion ? "idle" : "swing"}
                  whileHover={prefersReducedMotion ? "idle" : "swing"}
                >
                  <BellIcon
                    duration={preset.swingDuration}
                    reducedMotion={prefersReducedMotion}
                    swing={preset.swing}
                  />
                  <span>{label}</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors outline-none hover:bg-[var(--suluu-notify-hover)] focus-visible:ring-2 focus-visible:ring-[var(--suluu-notify-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-notify-background)] disabled:pointer-events-none disabled:opacity-50"
                disabled={disabled}
                exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
                initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
                key="collapsed"
                onClick={() => requestExpanded(true)}
                ref={triggerRef}
                transition={layoutTransition}
                type="button"
                whileFocus={prefersReducedMotion ? "idle" : "swing"}
                whileHover={prefersReducedMotion ? "idle" : "swing"}
              >
                <BellIcon
                  duration={preset.swingDuration}
                  reducedMotion={prefersReducedMotion}
                  swing={preset.swing}
                />
                <span>{label}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </form>
    );
  },
);

NotifyMorph.displayName = "NotifyMorph";
