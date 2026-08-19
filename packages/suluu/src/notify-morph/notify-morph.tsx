"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type RefObject,
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
  /** Builds the confirmation shown after a valid submission. */
  successMessage?: (email: string) => string;
  /** How long the confirmation remains visible, in milliseconds. */
  successDuration?: number;
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
    spring: { type: "spring", stiffness: 480, damping: 38, mass: 0.62 },
    swing: 7,
    swingDuration: 0.72,
  },
  default: {
    spring: { type: "spring", stiffness: 320, damping: 27, mass: 1.17 },
    swing: 9,
    swingDuration: 0.82,
  },
  expressive: {
    spring: { type: "spring", stiffness: 280, damping: 17, mass: 0.98 },
    swing: 20,
    swingDuration: 1.08,
  },
};

/** Layout constants mirroring the trigger's padding, icon, and gap classes. */
const TRIGGER_PADDING = 32;
const TRIGGER_ICON = 20;
const TRIGGER_GAP = 10;
/** Shell padding and input track that surround the submit button when open. */
const SHELL_PADDING = 8;
const FIELD_WIDTH = 216;
/** Floors that keep the default label rendering exactly as it always has. */
const MIN_TRIGGER_WIDTH = 152;
const MIN_SUBMIT_WIDTH = 128;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Natural width of the label, so the pill can grow for a custom label instead
 * of clipping it inside a fixed-width track.
 */
function useMeasuredWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    // offsetWidth reports the untransformed box, so the press scale on the
    // trigger cannot feed a shrinking measurement back into the layout.
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

function defaultSuccessMessage(email: string): string {
  return `You're on the list, ${email}.`;
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
      animate={reducedMotion ? "idle" : "ring"}
      className="size-5 shrink-0 origin-top"
      data-slot="notify-bell"
      fill="currentColor"
      initial="idle"
      variants={{
        idle: { rotate: 0 },
        ring: reducedMotion
          ? { rotate: 0 }
          : {
              rotate: [0, -swing, swing, swing * -0.68, swing * 0.42, 0],
              transition: {
                delay: 0.2,
                duration,
                ease: "easeInOut",
              },
            },
      }}
      viewBox="0 0 24 24"
    >
      <path d="M12 2a6 6 0 0 0-6 6v3.2c0 1.6-.55 3.15-1.57 4.39L3.2 17.1A1.16 1.16 0 0 0 4.1 19h15.8a1.16 1.16 0 0 0 .9-1.9l-1.23-1.51A6.94 6.94 0 0 1 18 11.2V8a6 6 0 0 0-6-6Zm-2.44 18.1A2.6 2.6 0 0 0 12 22a2.6 2.6 0 0 0 2.44-1.9H9.56Z" />
    </motion.svg>
  );
}

export const NotifyMorph = forwardRef<HTMLFormElement, NotifyMorphProps>(
  function NotifyMorph(
    {
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      collapseOnBlur = true,
      defaultExpanded = false,
      defaultValue = "",
      disabled = false,
      expanded,
      label = "Notify Me",
      motionIntensity = "default",
      onBlur,
      onExpandedChange,
      onKeyDown,
      onSubmit,
      onValueChange,
      placeholder = "Email",
      successDuration = 3000,
      successMessage = defaultSuccessMessage,
      value,
      ...formProps
    },
    forwardedRef,
  ) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const [uncontrolledExpanded, setUncontrolledExpanded] =
      useState(defaultExpanded);
    const [bellAnimationKey, setBellAnimationKey] = useState(0);
    const [confirmation, setConfirmation] = useState<{
      id: number;
      message: string;
    } | null>(null);
    const inputId = useId();
    const formRef = useRef<HTMLFormElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const labelRef = useRef<HTMLSpanElement>(null);
    const previousExpandedRef = useRef(false);
    const restoreFocusRef = useRef(false);
    const confirmationIdRef = useRef(0);
    const prefersReducedMotion = useReducedMotion() ?? false;

    const isValueControlled = value !== undefined;
    const isExpandedControlled = expanded !== undefined;
    const currentValue = isValueControlled ? value : uncontrolledValue;
    const currentExpanded = isExpandedControlled
      ? expanded
      : uncontrolledExpanded;
    const preset = MOTION_PRESETS[motionIntensity];
    const morphTransition = prefersReducedMotion
      ? { duration: 0 }
      : preset.spring;

    // The label is the only variable part of the pill; everything else is fixed
    // padding, so a custom label widens the track instead of being clipped.
    const labelWidth = useMeasuredWidth(labelRef);
    const triggerWidth = Math.max(
      MIN_TRIGGER_WIDTH,
      labelWidth + TRIGGER_PADDING + TRIGGER_ICON + TRIGGER_GAP,
    );
    const submitWidth = Math.max(
      MIN_SUBMIT_WIDTH,
      labelWidth + TRIGGER_PADDING,
    );
    const shellWidth = currentExpanded
      ? submitWidth + FIELD_WIDTH + SHELL_PADDING
      : triggerWidth;

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
      previousExpandedRef.current = currentExpanded;

      if (currentExpanded && !wasExpanded) {
        const timeout = window.setTimeout(() => inputRef.current?.focus(), 40);
        return () => window.clearTimeout(timeout);
      } else if (!currentExpanded && wasExpanded && restoreFocusRef.current) {
        triggerRef.current?.focus();
        restoreFocusRef.current = false;
      }
    }, [currentExpanded]);

    useEffect(() => {
      if (!confirmation) return;

      const timeout = window.setTimeout(
        () => setConfirmation(null),
        Math.max(0, successDuration),
      );
      return () => window.clearTimeout(timeout);
    }, [confirmation, successDuration]);

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
      confirmationIdRef.current += 1;
      setConfirmation({
        id: confirmationIdRef.current,
        message: successMessage(currentValue),
      });

      if (inputRef.current) inputRef.current.value = "";

      if (!isValueControlled) setUncontrolledValue("");
      onValueChange?.("");
      requestExpanded(false);
    }

    return (
      <form
        {...formProps}
        aria-label={
          ariaLabel ?? (ariaLabelledBy ? undefined : `${label} subscription`)
        }
        aria-labelledby={ariaLabelledBy}
        className={joinClassNames(
          "relative isolate inline-flex max-w-full",
          className,
        )}
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
          animate={{
            padding: currentExpanded ? 4 : 0,
            width: shellWidth,
          }}
          className="relative flex h-12 max-w-[calc(100vw-2rem)] items-center justify-end overflow-hidden rounded-full bg-[var(--suluu-notify-background)] text-[var(--suluu-notify-foreground)]"
          initial={false}
          transition={{
            padding: morphTransition,
            width: morphTransition,
          }}
        >
          <AnimatePresence initial={false}>
            {currentExpanded && (
              <motion.div
                animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
                className="flex h-full min-w-0 flex-1 items-center"
                exit={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
                initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
                key="email-field"
                transition={{
                  clipPath: {
                    delay: prefersReducedMotion ? 0 : 0.055,
                    duration: prefersReducedMotion ? 0 : 0.34,
                    ease: [0.22, 1, 0.36, 1],
                  },
                  opacity: {
                    delay: prefersReducedMotion ? 0 : 0.055,
                    duration: prefersReducedMotion ? 0 : 0.19,
                    ease: "easeInOut",
                  },
                }}
              >
                <label className="sr-only" htmlFor={inputId}>
                  Email address
                </label>
                <input
                  autoComplete="email"
                  className="h-full min-w-0 flex-1 bg-transparent px-[1.125rem] text-base font-medium outline-none placeholder:text-[var(--suluu-notify-muted)] disabled:cursor-not-allowed disabled:opacity-50"
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
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            animate={{
              height: currentExpanded ? 40 : 48,
              scale: currentExpanded && !prefersReducedMotion ? [0.9, 1] : 1,
              width: currentExpanded ? submitWidth : triggerWidth,
            }}
            className={joinClassNames(
              "inline-flex max-w-full shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-full text-base font-semibold whitespace-nowrap transition-[background-color,box-shadow,color,filter] outline-none focus-visible:ring-2 focus-visible:ring-[var(--suluu-notify-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-notify-background)] disabled:pointer-events-none disabled:opacity-50",
              currentExpanded
                ? "bg-[var(--suluu-notify-accent)] px-4 text-[var(--suluu-notify-accent-foreground)] shadow-[var(--suluu-notify-shadow)] hover:brightness-[0.98]"
                : "bg-transparent px-4 hover:bg-[var(--suluu-notify-hover)]",
            )}
            disabled={disabled}
            initial={false}
            onClick={currentExpanded ? undefined : () => requestExpanded(true)}
            onPointerEnter={() => {
              if (!currentExpanded && !prefersReducedMotion) {
                setBellAnimationKey((key) => key + 1);
              }
            }}
            ref={triggerRef}
            {...(currentExpanded || prefersReducedMotion
              ? {}
              : { whileTap: { scale: 0.965 } })}
            transition={{
              height: morphTransition,
              scale: currentExpanded ? morphTransition : { duration: 0 },
              width: morphTransition,
            }}
            type={currentExpanded ? "submit" : "button"}
          >
            <AnimatePresence initial={false}>
              {!currentExpanded && (
                <motion.span
                  animate={{
                    marginRight: 0,
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                    width: 20,
                  }}
                  className="inline-flex shrink-0 origin-top overflow-hidden"
                  exit={{
                    marginRight: -10,
                    opacity: 0,
                    rotate: prefersReducedMotion ? 0 : -26,
                    scale: prefersReducedMotion ? 1 : 0.55,
                    width: 0,
                  }}
                  initial={{
                    marginRight: -10,
                    opacity: 0,
                    rotate: prefersReducedMotion ? 0 : -26,
                    scale: prefersReducedMotion ? 1 : 0.55,
                    width: 0,
                  }}
                  key="bell"
                  transition={{
                    marginRight: morphTransition,
                    opacity: { duration: prefersReducedMotion ? 0 : 0.16 },
                    rotate: { duration: prefersReducedMotion ? 0 : 0.3 },
                    scale: { duration: prefersReducedMotion ? 0 : 0.3 },
                    width: morphTransition,
                  }}
                >
                  <BellIcon
                    duration={preset.swingDuration}
                    key={bellAnimationKey}
                    reducedMotion={prefersReducedMotion}
                    swing={preset.swing}
                  />
                </motion.span>
              )}
            </AnimatePresence>
            <span
              className="shrink-0"
              data-slot="notify-morph-label"
              ref={labelRef}
            >
              {label}
            </span>
          </motion.button>
        </motion.div>
        <AnimatePresence initial={false}>
          {confirmation ? (
            <motion.div
              animate={
                prefersReducedMotion
                  ? { opacity: 1, y: 8 }
                  : {
                      filter: "blur(0px)",
                      opacity: 1,
                      scaleX: 1,
                      scaleY: 1,
                      y: 10,
                    }
              }
              className="pointer-events-none absolute top-full right-[4.75rem] z-20 origin-top translate-x-1/2"
              data-slot="notify-success"
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : {
                      filter: "blur(2px)",
                      opacity: 0,
                      scaleX: 0.42,
                      scaleY: 0.62,
                      y: -26,
                    }
              }
              initial={
                prefersReducedMotion
                  ? { opacity: 0, y: 8 }
                  : {
                      filter: "blur(3px)",
                      opacity: 0,
                      scaleX: 0.38,
                      scaleY: 0.58,
                      y: -28,
                    }
              }
              key={confirmation.id}
              transition={
                prefersReducedMotion
                  ? { duration: 0.15 }
                  : {
                      filter: { duration: 0.24 },
                      opacity: { duration: 0.18 },
                      scaleX: preset.spring,
                      scaleY: preset.spring,
                      y: preset.spring,
                    }
              }
            >
              <output
                aria-live="polite"
                className="relative block max-w-[calc(100vw-2rem)] overflow-hidden rounded-full border border-[var(--suluu-notify-success-border)] bg-[var(--suluu-notify-success-background)] px-4 py-2.5 text-center text-sm font-medium text-ellipsis whitespace-nowrap text-[var(--suluu-notify-success-foreground)] shadow-[var(--suluu-notify-success-shadow)] backdrop-blur-xl"
              >
                {confirmation.message}
              </output>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>
    );
  },
);

NotifyMorph.displayName = "NotifyMorph";
