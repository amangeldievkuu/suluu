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

export type SearchMotionIntensity = "subtle" | "default" | "expressive";

export interface SearchMorphProps extends Omit<
  ComponentPropsWithoutRef<"form">,
  "children" | "onSubmit"
> {
  /** Text shown by the collapsed trigger and expanded submit button. */
  label?: string;
  /** Placeholder for the search input. */
  placeholder?: string;
  /** Collapse after focus leaves the complete widget. */
  collapseOnBlur?: boolean;
  /** Disable both the trigger and expanded controls. */
  disabled?: boolean;
  /** Controlled query value. */
  value?: string;
  /** Initial query value when uncontrolled. */
  defaultValue?: string;
  /** Called whenever the query value changes. */
  onValueChange?: (value: string) => void;
  /** Controlled expansion state. */
  expanded?: boolean;
  /** Initial expansion state when uncontrolled. */
  defaultExpanded?: boolean;
  /** Called whenever an interaction requests an expansion change. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Controls the morph spring character. */
  motionIntensity?: SearchMotionIntensity;
  /** Controlled in-flight state. Leave undefined for the built-in acknowledgement. */
  pending?: boolean;
  /** Length of the uncontrolled submit acknowledgement, in milliseconds. */
  pendingDuration?: number;
  /** Called when the form is submitted with a non-empty query. */
  onSubmit?: (query: string, event: SubmitEvent<HTMLFormElement>) => void;
}

interface MotionPreset {
  spring: {
    type: "spring";
    stiffness: number;
    damping: number;
    mass: number;
  };
}

const MOTION_PRESETS: Record<SearchMotionIntensity, MotionPreset> = {
  subtle: {
    spring: { type: "spring", stiffness: 480, damping: 38, mass: 0.62 },
  },
  default: {
    spring: { type: "spring", stiffness: 320, damping: 27, mass: 1.17 },
  },
  expressive: {
    spring: { type: "spring", stiffness: 280, damping: 17, mass: 0.98 },
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

interface SearchIconProps {
  reducedMotion: boolean;
}

function SearchIcon({ reducedMotion }: SearchIconProps) {
  return (
    <motion.svg
      animate={reducedMotion ? { scale: 1 } : { scale: [1, 1.05, 1] }}
      aria-hidden="true"
      className="size-5 shrink-0"
      data-slot="search-morph-icon"
      fill="none"
      initial={{ scale: 1 }}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      style={{ transformBox: "view-box", transformOrigin: "center" }}
      transition={{
        delay: reducedMotion ? 0 : 0.24,
        duration: reducedMotion ? 0 : 0.44,
        ease: "easeInOut",
      }}
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </motion.svg>
  );
}

function ClearIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2.25"
      viewBox="0 0 24 24"
    >
      <path d="M17 7 7 17" />
      <path d="m7 7 10 10" />
    </svg>
  );
}

function PendingSpinner() {
  return (
    <motion.svg
      animate={{ rotate: 360 }}
      aria-hidden="true"
      className="size-5"
      fill="none"
      transition={{ duration: 0.72, ease: "linear", repeat: Infinity }}
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        opacity="0.3"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </motion.svg>
  );
}

export const SearchMorph = forwardRef<HTMLFormElement, SearchMorphProps>(
  function SearchMorph(
    {
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      collapseOnBlur = true,
      defaultExpanded = false,
      defaultValue = "",
      disabled = false,
      expanded,
      label = "Search",
      motionIntensity = "default",
      onBlur,
      onExpandedChange,
      onKeyDown,
      onSubmit,
      onValueChange,
      pending,
      pendingDuration = 900,
      placeholder = "Search",
      value,
      ...formProps
    },
    forwardedRef,
  ) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const [uncontrolledExpanded, setUncontrolledExpanded] =
      useState(defaultExpanded);
    const [autoPending, setAutoPending] = useState(false);
    const inputId = useId();
    const formRef = useRef<HTMLFormElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const labelRef = useRef<HTMLSpanElement>(null);
    const previousExpandedRef = useRef(false);
    const restoreFocusRef = useRef(false);
    const expandSubmitGuardRef = useRef(false);
    const guardTimeoutRef = useRef(0);
    const prefersReducedMotion = useReducedMotion() ?? false;

    const isValueControlled = value !== undefined;
    const isExpandedControlled = expanded !== undefined;
    const currentValue = isValueControlled ? value : uncontrolledValue;
    const currentExpanded = isExpandedControlled
      ? expanded
      : uncontrolledExpanded;
    const isPendingControlled = pending !== undefined;
    const isPending = isPendingControlled ? pending : autoPending;
    const showPending = isPending && currentExpanded;
    const showClear = currentExpanded && currentValue.length > 0 && !disabled;
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

    useEffect(() => () => window.clearTimeout(guardTimeoutRef.current), []);

    const clearQuery = useCallback(() => {
      if (!isValueControlled) setUncontrolledValue("");
      onValueChange?.("");
      inputRef.current?.focus();
    }, [isValueControlled, onValueChange]);

    useEffect(() => {
      if (!autoPending) return;

      const timeout = window.setTimeout(
        () => setAutoPending(false),
        Math.max(0, pendingDuration),
      );
      return () => window.clearTimeout(timeout);
    }, [autoPending, pendingDuration]);

    useEffect(() => {
      const wasExpanded = previousExpandedRef.current;
      previousExpandedRef.current = currentExpanded;

      if (currentExpanded && !wasExpanded) {
        const timeout = window.setTimeout(() => inputRef.current?.focus(), 40);
        return () => window.clearTimeout(timeout);
      }

      if (!currentExpanded && wasExpanded) {
        // Collapsing ends the acknowledgement. Without this the timer keeps
        // running unseen and the spinner resurfaces on the next open.
        setAutoPending(false);

        if (restoreFocusRef.current) {
          triggerRef.current?.focus();
          restoreFocusRef.current = false;
        }
      }
    }, [currentExpanded]);

    function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      if (event.key === "Escape" && currentExpanded) {
        event.preventDefault();
        requestExpanded(false, true);
      }
    }

    // The action is type="button" while collapsed and type="submit" once
    // expanded. React flushes the expansion synchronously during the click,
    // so the browser reads the *new* type when it runs the button's
    // activation behaviour and submits the form on the very click that
    // opened it. Arm a guard for the rest of this task to swallow that.
    function handleTriggerClick() {
      expandSubmitGuardRef.current = true;
      window.clearTimeout(guardTimeoutRef.current);
      guardTimeoutRef.current = window.setTimeout(() => {
        expandSubmitGuardRef.current = false;
      }, 0);

      requestExpanded(true);
    }

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
      event.preventDefault();

      if (disabled || isPending) return;

      if (expandSubmitGuardRef.current) {
        expandSubmitGuardRef.current = false;
        return;
      }

      if (currentValue.trim().length === 0) {
        inputRef.current?.focus();
        return;
      }

      if (!isPendingControlled) setAutoPending(true);
      onSubmit?.(currentValue, event);
    }

    return (
      // Search landmarks still receive bubbling Escape and blur from their fields.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <form
        {...formProps}
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : label)}
        aria-labelledby={ariaLabelledBy}
        className={joinClassNames(
          "relative isolate inline-flex max-w-full",
          className,
        )}
        data-expanded={currentExpanded ? "true" : "false"}
        data-slot="search-morph"
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
        role="search"
      >
        <motion.div
          animate={{
            padding: currentExpanded ? 4 : 0,
            width: shellWidth,
          }}
          className="relative flex h-12 max-w-[calc(100vw-2rem)] items-center justify-end overflow-hidden rounded-full bg-[var(--suluu-search-background)] text-[var(--suluu-search-foreground)]"
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
                key="search-field"
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
                  Search query
                </label>
                <input
                  autoComplete="off"
                  className="h-full min-w-0 flex-1 bg-transparent px-[1.125rem] text-base font-medium outline-none placeholder:text-[var(--suluu-search-muted)] disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:[-webkit-appearance:none] [&::-webkit-search-decoration]:[-webkit-appearance:none]"
                  disabled={disabled}
                  id={inputId}
                  name="q"
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    if (!isValueControlled) setUncontrolledValue(nextValue);
                    onValueChange?.(nextValue);
                  }}
                  placeholder={placeholder}
                  ref={inputRef}
                  type="search"
                  value={currentValue}
                />
                <AnimatePresence initial={false}>
                  {showClear && (
                    <motion.button
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      aria-label="Clear search"
                      className="mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--suluu-search-muted)] transition-[background-color,color] outline-none hover:bg-[var(--suluu-search-hover)] hover:text-[var(--suluu-search-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--suluu-search-ring)]"
                      data-slot="search-morph-clear"
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, rotate: -75, scale: 0.4 }
                      }
                      initial={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, rotate: -75, scale: 0.4 }
                      }
                      key="search-clear"
                      onClick={clearQuery}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : {
                              opacity: { duration: 0.14 },
                              rotate: preset.spring,
                              scale: preset.spring,
                            }
                      }
                      type="button"
                      {...(prefersReducedMotion
                        ? {}
                        : { whileTap: { scale: 0.88 } })}
                    >
                      <ClearIcon />
                    </motion.button>
                  )}
                </AnimatePresence>
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
              "relative inline-flex max-w-full shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-full text-base font-semibold whitespace-nowrap transition-[background-color,box-shadow,color,filter] outline-none focus-visible:ring-2 focus-visible:ring-[var(--suluu-search-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-search-background)] disabled:pointer-events-none disabled:opacity-50",
              currentExpanded
                ? "bg-[var(--suluu-search-accent)] px-4 text-[var(--suluu-search-accent-foreground)] shadow-[var(--suluu-search-shadow)] hover:brightness-[0.98]"
                : "bg-transparent px-4 hover:bg-[var(--suluu-search-hover)]",
            )}
            aria-busy={showPending || undefined}
            disabled={disabled}
            initial={false}
            onClick={currentExpanded ? undefined : handleTriggerClick}
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
                    transitionEnd: { overflow: "visible" },
                    width: 20,
                  }}
                  className="inline-flex shrink-0 overflow-hidden"
                  exit={{
                    marginRight: -10,
                    opacity: 0,
                    overflow: "hidden",
                    width: 0,
                  }}
                  initial={{
                    marginRight: -10,
                    opacity: 0,
                    width: 0,
                  }}
                  key="search-icon"
                  transition={{
                    marginRight: {
                      duration: prefersReducedMotion ? 0 : 0.22,
                      ease: [0.22, 1, 0.36, 1],
                    },
                    opacity: {
                      duration: prefersReducedMotion ? 0 : 0.16,
                      ease: "easeOut",
                    },
                    width: {
                      duration: prefersReducedMotion ? 0 : 0.22,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }}
                >
                  <SearchIcon reducedMotion={prefersReducedMotion} />
                </motion.span>
              )}
            </AnimatePresence>
            <motion.span
              animate={{ opacity: showPending ? 0 : 1 }}
              className="shrink-0"
              data-slot="search-morph-label"
              initial={false}
              ref={labelRef}
              transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
            >
              {label}
            </motion.span>
            <AnimatePresence initial={false}>
              {showPending && (
                <motion.span
                  animate={{ opacity: 1, scale: 1 }}
                  aria-hidden="true"
                  className="absolute inset-0 inline-flex items-center justify-center text-sm font-semibold"
                  data-slot="search-morph-pending"
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.7 }
                  }
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.7 }
                  }
                  key="search-pending"
                  transition={{
                    opacity: { duration: prefersReducedMotion ? 0 : 0.16 },
                    scale: prefersReducedMotion
                      ? { duration: 0 }
                      : preset.spring,
                  }}
                >
                  {prefersReducedMotion ? "Searching…" : <PendingSpinner />}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
        <span aria-live="polite" className="sr-only">
          {showPending ? "Searching" : ""}
        </span>
      </form>
    );
  },
);

SearchMorph.displayName = "SearchMorph";
