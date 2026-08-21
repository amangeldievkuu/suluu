"use client";

import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

export type OtpInputSize = "sm" | "default" | "lg";
export type OtpInputMotionIntensity = "subtle" | "default" | "expressive";

type NativeInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  | "children"
  | "defaultValue"
  | "disabled"
  | "maxLength"
  | "onChange"
  | "size"
  | "type"
  | "value"
>;

export interface OtpInputProps extends NativeInputProps {
  /** Number of digit slots. */
  length?: number;
  /** Controlled code value. Non-digits are removed. */
  value?: string;
  /** Initial code value when uncontrolled. Non-digits are removed. */
  defaultValue?: string;
  /** Called whenever an interaction requests a code change. */
  onValueChange?: (value: string) => void;
  /** Called when an interaction takes the code from incomplete to complete. */
  onComplete?: (value: string) => void;
  /** Replaces entered digits with privacy-preserving bullets. */
  masked?: boolean;
  /** Disables the native field and every input path. */
  disabled?: boolean;
  /** Marks the field invalid without requiring an inline message. */
  invalid?: boolean;
  /** Accessible inline error. Providing one also marks the field invalid. */
  error?: ReactNode;
  /** Controls the dimensions of every digit slot. */
  size?: OtpInputSize;
  /** Controls the character of the slot, digit, and caret motion. */
  motionIntensity?: OtpInputMotionIntensity;
}

interface MotionPreset {
  caretDuration: number;
  completeScale: number;
  digitY: number;
  squashX: number;
  squashY: number;
  spring: {
    type: "spring";
    stiffness: number;
    damping: number;
    mass: number;
  };
}

const MOTION_PRESETS: Record<OtpInputMotionIntensity, MotionPreset> = {
  subtle: {
    caretDuration: 1.9,
    completeScale: 1.04,
    digitY: 3,
    squashX: 1.04,
    squashY: 0.97,
    spring: { type: "spring", stiffness: 360, damping: 34, mass: 0.72 },
  },
  default: {
    caretDuration: 1.65,
    completeScale: 1.06,
    digitY: 4,
    squashX: 1.08,
    squashY: 0.94,
    spring: { type: "spring", stiffness: 280, damping: 26, mass: 0.92 },
  },
  expressive: {
    caretDuration: 1.35,
    completeScale: 1.09,
    digitY: 6,
    squashX: 1.12,
    squashY: 0.9,
    spring: { type: "spring", stiffness: 220, damping: 20, mass: 1.05 },
  },
};

const SETTLE_SPRINGS: Record<
  OtpInputMotionIntensity,
  { damping: number; mass: number; stiffness: number }
> = {
  subtle: { stiffness: 360, damping: 26, mass: 0.72 },
  default: { stiffness: 280, damping: 18, mass: 0.92 },
  expressive: { stiffness: 220, damping: 14, mass: 1.05 },
};

const SIZE_STYLES: Record<
  OtpInputSize,
  { gap: string; slot: string; text: string }
> = {
  sm: {
    gap: "gap-[clamp(0.25rem,1.5vw,0.375rem)]",
    slot: "h-11 w-[clamp(1.75rem,11vw,2.25rem)] rounded-xl",
    text: "text-lg",
  },
  default: {
    gap: "gap-[clamp(0.3rem,1.8vw,0.5rem)]",
    slot: "h-[52px] w-[clamp(2.15rem,12vw,2.75rem)] rounded-[0.875rem]",
    text: "text-xl",
  },
  lg: {
    gap: "gap-[clamp(0.375rem,2vw,0.625rem)]",
    slot: "h-[52px] w-[clamp(2.35rem,13vw,3.25rem)] rounded-2xl sm:h-[60px]",
    text: "text-xl sm:text-2xl",
  },
};

const INSTANT = { duration: 0 } as const;
const WASH_SQUASH_MS = 180;
const ERROR_SETTLE_X = 4;
const COMPLETE_PEAK_MS = 180;
const COMPLETE_SWELL_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
  mass: 0.7,
};
const COMPLETE_SPRING = {
  type: "spring" as const,
  stiffness: 150,
  damping: 34,
  mass: 0.85,
};

const DIGIT_PATTERN = /^\d$/;
const NON_DIGITS_PATTERN = /\D/g;

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

function joinIds(...values: (string | undefined)[]): string | undefined {
  const ids = values
    .flatMap((value) => value?.split(/\s+/) ?? [])
    .filter(Boolean);
  return ids.length > 0 ? [...new Set(ids)].join(" ") : undefined;
}

function normalizeLength(length: number): number {
  return Number.isFinite(length) && length > 0 ? Math.floor(length) : 6;
}

function normalizeValue(value: string, length: number): string {
  return value.replace(NON_DIGITS_PATTERN, "").slice(0, length);
}

export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(
  function OtpInput(
    {
      "aria-describedby": ariaDescribedBy,
      "aria-errormessage": ariaErrorMessage,
      "aria-invalid": ariaInvalid,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      autoComplete = "one-time-code",
      className,
      defaultValue = "",
      disabled = false,
      error,
      inputMode = "numeric",
      invalid = false,
      length = 6,
      masked = false,
      motionIntensity = "default",
      onBlur,
      onClick,
      onComplete,
      onFocus,
      onKeyDown,
      onPaste,
      onPointerDown,
      onSelect,
      onValueChange,
      pattern = "[0-9]*",
      size = "default",
      style,
      value,
      ...inputProps
    },
    forwardedRef,
  ) {
    const slotCount = normalizeLength(length);
    const [uncontrolledValue, setUncontrolledValue] = useState(() =>
      normalizeValue(defaultValue, slotCount),
    );
    const [focused, setFocused] = useState(false);
    const [caretIndex, setCaretIndex] = useState(0);
    const [resumeCompleteWash, setResumeCompleteWash] = useState(false);
    const isControlled = value !== undefined;
    const currentValue = normalizeValue(
      isControlled ? value : uncontrolledValue,
      slotCount,
    );
    const hasError = error !== undefined && error !== null && error !== false;
    const isInvalid =
      invalid || hasError || ariaInvalid === true || ariaInvalid === "true";
    const isComplete = currentValue.length === slotCount;
    const isSuccessfulComplete = isComplete && !isInvalid;
    const prefersReducedMotion = useReducedMotion() ?? false;
    const preset = MOTION_PRESETS[motionIntensity];
    const sizeStyles = SIZE_STYLES[size];
    const layoutId = useId();
    const errorId = `${layoutId}-error`;
    const inputRef = useRef<HTMLInputElement | null>(null);
    const slotRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const pendingCaretRef = useRef<number | null>(null);
    const pointerCaretRef = useRef<number | null>(null);
    const previousCaretRef = useRef<number | null>(null);
    const previousInvalidRef = useRef(false);
    const previousCompleteRef = useRef(false);
    const washScaleX = useMotionValue(1);
    const washScaleY = useMotionValue(1);
    const settleSpring = SETTLE_SPRINGS[motionIntensity];
    const trackX = useSpring(0, settleSpring);
    const completeScale = useMotionValue(1);
    const motionTransition = prefersReducedMotion ? INSTANT : preset.spring;
    const showActiveWash =
      focused && !disabled && (!isSuccessfulComplete || resumeCompleteWash);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;

        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const placeCaret = useCallback(
      (index: number) => {
        const nextIndex = Math.max(0, Math.min(index, currentValue.length));
        const input = inputRef.current;
        pendingCaretRef.current = null;
        setCaretIndex(Math.min(nextIndex, slotCount - 1));
        input?.setSelectionRange(nextIndex, nextIndex);
      },
      [currentValue.length, slotCount],
    );

    useLayoutEffect(() => {
      if (!focused) return;

      const requested = pendingCaretRef.current;
      const nativeCaret =
        inputRef.current?.selectionStart ?? currentValue.length;
      placeCaret(requested ?? Math.min(nativeCaret, currentValue.length));
    }, [currentValue, focused, placeCaret]);

    useEffect(() => {
      if (!isControlled) {
        setUncontrolledValue((previous) => normalizeValue(previous, slotCount));
      }
    }, [isControlled, slotCount]);

    useEffect(() => {
      if (!isSuccessfulComplete) setResumeCompleteWash(false);
    }, [isSuccessfulComplete]);

    useEffect(() => {
      if (!showActiveWash) {
        previousCaretRef.current = null;
        washScaleX.set(1);
        washScaleY.set(1);
        return;
      }

      const previous = previousCaretRef.current;
      previousCaretRef.current = caretIndex;

      if (prefersReducedMotion) {
        washScaleX.set(1);
        washScaleY.set(1);
        return;
      }

      if (previous === null) {
        washScaleX.set(0.92);
        washScaleY.set(0.92);
        const enterX = animate(washScaleX, 1, preset.spring);
        const enterY = animate(washScaleY, 1, preset.spring);
        return () => {
          enterX.stop();
          enterY.stop();
        };
      }

      if (previous === caretIndex) return;

      washScaleX.set(preset.squashX);
      washScaleY.set(preset.squashY);
      let squashX: ReturnType<typeof animate> | undefined;
      let squashY: ReturnType<typeof animate> | undefined;
      const timeout = window.setTimeout(() => {
        squashX = animate(washScaleX, 1, preset.spring);
        squashY = animate(washScaleY, 1, preset.spring);
      }, WASH_SQUASH_MS);

      return () => {
        window.clearTimeout(timeout);
        squashX?.stop();
        squashY?.stop();
      };
    }, [
      caretIndex,
      prefersReducedMotion,
      preset.spring,
      preset.squashX,
      preset.squashY,
      showActiveWash,
      washScaleX,
      washScaleY,
    ]);

    useEffect(() => {
      const wasInvalid = previousInvalidRef.current;
      previousInvalidRef.current = isInvalid;

      if (prefersReducedMotion) {
        trackX.jump(0);
        return;
      }

      if (!isInvalid) {
        trackX.set(0);
        return;
      }

      if (wasInvalid) return;

      trackX.jump(ERROR_SETTLE_X);
      const controls = animate(trackX, 0, settleSpring);
      return () => controls.stop();
    }, [isInvalid, prefersReducedMotion, settleSpring, trackX]);

    useEffect(() => {
      const wasComplete = previousCompleteRef.current;
      previousCompleteRef.current = isSuccessfulComplete;

      if (prefersReducedMotion) {
        completeScale.set(1);
        return;
      }

      if (!isSuccessfulComplete) {
        completeScale.set(1);
        return;
      }

      if (wasComplete) return;

      const swell = animate(
        completeScale,
        preset.completeScale,
        COMPLETE_SWELL_SPRING,
      );
      let rest: ReturnType<typeof animate> | undefined;
      const timeout = window.setTimeout(() => {
        rest = animate(completeScale, 1, COMPLETE_SPRING);
      }, COMPLETE_PEAK_MS);

      return () => {
        swell.stop();
        rest?.stop();
        window.clearTimeout(timeout);
      };
    }, [
      completeScale,
      isSuccessfulComplete,
      prefersReducedMotion,
      preset.completeScale,
    ]);

    const requestValue = useCallback(
      (requestedValue: string, requestedCaret: number) => {
        if (disabled) return;

        const nextValue = normalizeValue(requestedValue, slotCount);
        pendingCaretRef.current = Math.min(requestedCaret, nextValue.length);

        if (nextValue === currentValue) {
          placeCaret(pendingCaretRef.current);
          return;
        }

        if (!isControlled) setUncontrolledValue(nextValue);
        onValueChange?.(nextValue);

        if (currentValue.length < slotCount && nextValue.length === slotCount) {
          onComplete?.(nextValue);
        }
      },
      [
        currentValue,
        disabled,
        isControlled,
        onComplete,
        onValueChange,
        placeCaret,
        slotCount,
      ],
    );

    function readSelection(input: HTMLInputElement) {
      const start = input.selectionStart ?? currentValue.length;
      const end = input.selectionEnd ?? start;
      return {
        end: Math.max(start, Math.min(end, currentValue.length)),
        start: Math.min(start, currentValue.length),
      };
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const rawValue = event.currentTarget.value;
      const rawCaret = event.currentTarget.selectionStart ?? rawValue.length;
      const nextCaret = normalizeValue(
        rawValue.slice(0, rawCaret),
        slotCount,
      ).length;
      requestValue(rawValue, nextCaret);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || event.nativeEvent.isComposing) {
        return;
      }

      const { start, end } = readSelection(event.currentTarget);

      if (
        DIGIT_PATTERN.test(event.key) &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        if (
          start === end &&
          start === currentValue.length &&
          currentValue.length === slotCount
        ) {
          requestValue(`${currentValue.slice(0, -1)}${event.key}`, slotCount);
          return;
        }

        const replaceEnd =
          start === end && start < currentValue.length ? start + 1 : end;
        requestValue(
          `${currentValue.slice(0, start)}${event.key}${currentValue.slice(replaceEnd)}`,
          start + 1,
        );
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        if (start !== end) {
          requestValue(
            `${currentValue.slice(0, start)}${currentValue.slice(end)}`,
            start,
          );
        } else if (start > 0) {
          requestValue(
            `${currentValue.slice(0, start - 1)}${currentValue.slice(start)}`,
            start - 1,
          );
        }
        return;
      }

      if (event.key === "Delete") {
        event.preventDefault();
        if (start !== end) {
          requestValue(
            `${currentValue.slice(0, start)}${currentValue.slice(end)}`,
            start,
          );
        } else if (start < currentValue.length) {
          requestValue(
            `${currentValue.slice(0, start)}${currentValue.slice(start + 1)}`,
            start,
          );
        }
      }
    }

    function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
      onPaste?.(event);
      if (event.defaultPrevented || disabled) return;

      event.preventDefault();
      const pastedDigits = normalizeValue(
        event.clipboardData.getData("text"),
        slotCount,
      );
      if (pastedDigits === "") return;

      if (pastedDigits.length === slotCount) {
        requestValue(pastedDigits, slotCount);
        return;
      }

      const { start, end } = readSelection(event.currentTarget);
      requestValue(
        `${currentValue.slice(0, start)}${pastedDigits}${currentValue.slice(end)}`,
        start + pastedDigits.length,
      );
    }

    function handleFocus(event: FocusEvent<HTMLInputElement>) {
      onFocus?.(event);
      setFocused(true);
      pendingCaretRef.current = pointerCaretRef.current ?? currentValue.length;
      pointerCaretRef.current = null;
      setCaretIndex(
        Math.min(pendingCaretRef.current, Math.max(0, slotCount - 1)),
      );
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      onBlur?.(event);
      setFocused(false);
      pointerCaretRef.current = null;
      setResumeCompleteWash(false);
    }

    function handleSelect(event: React.SyntheticEvent<HTMLInputElement>) {
      onSelect?.(event);
      if (!focused) return;

      const start = event.currentTarget.selectionStart ?? currentValue.length;
      setCaretIndex(Math.min(start, slotCount - 1));
    }

    function findPointerCaret(clientX: number): number | null {
      const slots = slotRefs.current.filter(
        (slot): slot is HTMLSpanElement => slot !== null,
      );
      if (slots.length === 0) return null;

      const rects = slots.map((slot) => slot.getBoundingClientRect());
      if (rects.every((rect) => rect.width === 0)) return null;

      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      rects.forEach((rect, index) => {
        const distance = Math.abs(clientX - (rect.left + rect.width / 2));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const maxCaret = currentValue.length;
      if (nearestIndex >= maxCaret) return maxCaret;

      // Last filled slot: caret after that digit so Backspace removes it.
      if (nearestIndex === slotCount - 1 && nearestIndex === maxCaret - 1) {
        return maxCaret;
      }

      return nearestIndex;
    }

    function handlePointerDown(event: PointerEvent<HTMLInputElement>) {
      onPointerDown?.(event);
      if (
        event.defaultPrevented ||
        disabled ||
        event.button !== 0 ||
        !event.isPrimary
      ) {
        return;
      }

      if (isSuccessfulComplete) setResumeCompleteWash(true);
      pointerCaretRef.current = findPointerCaret(event.clientX);
    }

    const describedBy = joinIds(
      ariaDescribedBy,
      hasError ? errorId : undefined,
    );
    const errorMessage = joinIds(
      ariaErrorMessage,
      hasError ? errorId : undefined,
    );
    const accessibleLabel =
      ariaLabel ??
      (ariaLabelledBy ? undefined : masked ? "PIN code" : "One-time code");
    const rootState = isInvalid
      ? "invalid"
      : disabled
        ? "disabled"
        : isComplete
          ? "complete"
          : focused
            ? "focused"
            : "idle";

    return (
      <LayoutGroup id={layoutId}>
        <div
          className={joinClassNames(
            "inline-flex max-w-full flex-col",
            disabled ? "opacity-45" : undefined,
            className,
          )}
          data-complete={isComplete ? "true" : "false"}
          data-disabled={disabled ? "true" : "false"}
          data-invalid={isInvalid ? "true" : "false"}
          data-masked={masked ? "true" : "false"}
          data-motion-intensity={motionIntensity}
          data-size={size}
          data-slot="otp-input"
          data-state={rootState}
          style={style}
        >
          <motion.div
            className={joinClassNames(
              "relative inline-flex max-w-full",
              sizeStyles.gap,
            )}
            data-slot="otp-input-track"
            style={{ x: trackX }}
          >
            <input
              {...inputProps}
              aria-describedby={describedBy}
              aria-errormessage={errorMessage}
              aria-invalid={isInvalid ? true : ariaInvalid}
              aria-label={accessibleLabel}
              aria-labelledby={ariaLabelledBy}
              autoComplete={autoComplete}
              className="absolute inset-0 z-20 size-full cursor-text rounded-[inherit] border-0 bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-not-allowed"
              data-slot="otp-input-native"
              disabled={disabled}
              inputMode={inputMode}
              maxLength={slotCount}
              onBlur={handleBlur}
              onChange={handleChange}
              onClick={(event) => {
                onClick?.(event);
                if (event.defaultPrevented || disabled) return;

                const nextCaret =
                  pointerCaretRef.current ?? findPointerCaret(event.clientX);
                pointerCaretRef.current = null;
                if (nextCaret !== null) placeCaret(nextCaret);
              }}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onPointerDown={handlePointerDown}
              onSelect={handleSelect}
              pattern={pattern}
              ref={setInputRef}
              style={{ WebkitTextFillColor: "transparent" }}
              type={masked ? "password" : "text"}
              value={currentValue}
            />

            {Array.from({ length: slotCount }, (_, index) => {
              const digit = currentValue[index];
              const isActive = focused && index === caretIndex;
              const showWash = showActiveWash && isActive;
              const showCaret = showWash && digit === undefined;
              const slotState = showWash
                ? "active"
                : digit === undefined
                  ? "empty"
                  : "filled";

              return (
                <span
                  aria-hidden="true"
                  className={joinClassNames(
                    "relative isolate flex min-w-0 shrink items-center justify-center font-medium text-[var(--suluu-otp-foreground)] tabular-nums",
                    sizeStyles.slot,
                    sizeStyles.text,
                  )}
                  data-active={showWash ? "true" : "false"}
                  data-filled={digit === undefined ? "false" : "true"}
                  data-index={index}
                  data-slot="otp-input-slot"
                  data-state={slotState}
                  key={index}
                  ref={(node) => {
                    slotRefs.current[index] = node;
                  }}
                >
                  <motion.span
                    aria-hidden="true"
                    className={joinClassNames(
                      "pointer-events-none absolute inset-0 origin-center transform-gpu rounded-[inherit] border border-[var(--suluu-otp-border)] bg-[var(--suluu-otp-background)] shadow-[var(--suluu-otp-shadow)] transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none",
                      isInvalid
                        ? "border-[color-mix(in_oklch,var(--suluu-otp-error)_48%,var(--suluu-otp-border))]"
                        : undefined,
                    )}
                    data-slot="otp-input-surface"
                    style={{ scale: completeScale }}
                  />
                  {showWash ? (
                    <motion.span
                      animate={{ opacity: 1 }}
                      aria-hidden="true"
                      className={joinClassNames(
                        "pointer-events-none absolute inset-0 z-0 rounded-[inherit]",
                        isInvalid
                          ? "bg-[color-mix(in_oklch,var(--suluu-otp-error)_16%,transparent)] shadow-[var(--suluu-otp-error-shadow)]"
                          : "bg-[color-mix(in_oklch,var(--suluu-otp-ring)_16%,transparent)] shadow-[var(--suluu-otp-active-shadow)]",
                      )}
                      data-slot="otp-input-active"
                      initial={prefersReducedMotion ? false : { opacity: 0 }}
                      layoutId={`${layoutId}-active`}
                      style={{ scaleX: washScaleX, scaleY: washScaleY }}
                      transition={motionTransition}
                    />
                  ) : null}

                  <span className="relative z-10 flex size-full items-center justify-center overflow-hidden">
                    <AnimatePresence initial={false} mode="popLayout">
                      {digit === undefined ? null : (
                        <motion.span
                          animate={{ opacity: 1, y: 0 }}
                          className={
                            masked ? "text-[var(--suluu-otp-muted)]" : undefined
                          }
                          data-slot="otp-input-digit"
                          exit={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: -preset.digitY * 0.5 }
                          }
                          initial={
                            prefersReducedMotion || isSuccessfulComplete
                              ? false
                              : { opacity: 0, y: preset.digitY }
                          }
                          key={masked ? "masked" : digit}
                          transition={motionTransition}
                        >
                          {masked ? "•" : digit}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>

                  {showCaret ? (
                    <motion.span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                      initial={false}
                      layoutId={`${layoutId}-caret`}
                      transition={motionTransition}
                    >
                      <motion.span
                        animate={
                          prefersReducedMotion
                            ? { opacity: 1, scaleY: 1 }
                            : {
                                opacity: [1, 1, 0.32],
                                scaleY: [1, 1, 0.74],
                              }
                        }
                        className="h-[1.15em] w-[1.5px] rounded-full bg-[var(--suluu-otp-caret)]"
                        data-slot="otp-input-caret"
                        initial={{ opacity: 1, scaleY: 1 }}
                        transition={
                          prefersReducedMotion
                            ? INSTANT
                            : {
                                duration: preset.caretDuration,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatType: "mirror",
                                times: [0, 0.55, 1],
                              }
                        }
                      />
                    </motion.span>
                  ) : null}
                </span>
              );
            })}
          </motion.div>

          <AnimatePresence initial={false}>
            {hasError ? (
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                aria-live="polite"
                className="mt-2.5 w-0 min-w-full text-sm leading-5 text-[var(--suluu-otp-error)]"
                data-slot="otp-input-error"
                exit={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
                }
                id={errorId}
                initial={
                  prefersReducedMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 8 }
                }
                transition={motionTransition}
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    );
  },
);

OtpInput.displayName = "OtpInput";
