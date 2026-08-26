"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
  type SubmitEvent,
} from "react";

export type EmailMorphMotionIntensity = "subtle" | "default" | "expressive";

export type EmailMorphActionState =
  "submit" | "loading" | "success" | "error" | "disabled";

export interface EmailMorphLabels {
  /** Accessible name for the email field. */
  input: string;
  /** Accessible name for the available send action. */
  submit: string;
  /** Busy-state announcement and action name. */
  loading: string;
  /** Success-state announcement and action name. */
  success: string;
}

type ConflictingMotionInputProps =
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
  | "onTransitionEnd";

type NativeEmailInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  | ConflictingMotionInputProps
  | "children"
  | "className"
  | "defaultValue"
  | "disabled"
  | "form"
  | "onChange"
  | "onSubmit"
  | "placeholder"
  | "required"
  | "style"
  | "type"
  | "value"
>;

export interface EmailMorphProps extends NativeEmailInputProps {
  /** Controlled email value. */
  value?: string;
  /** Initial email value when uncontrolled. */
  defaultValue?: string;
  /** Called whenever an interaction requests an email change. */
  onValueChange?: (value: string) => void;
  /** Called only after the required native email input is valid. */
  onSubmit?: (email: string, event: SubmitEvent<HTMLFormElement>) => void;
  /** Keeps the action separated and replaces the arrow with a spinner. */
  loading?: boolean;
  /** Keeps the action separated and replaces the arrow with a check. */
  success?: boolean;
  /** Disables the field and action. */
  disabled?: boolean;
  /** Marks the email field invalid without requiring an inline message. */
  invalid?: boolean;
  /** Accessible inline error. Providing one also marks the field invalid. */
  error?: ReactNode;
  /** Email input placeholder. */
  placeholder?: string;
  /** Rejoin the send action when focus leaves, except while loading or success. */
  collapseOnBlur?: boolean;
  /** Controls the spring and liquid-neck character. */
  motionIntensity?: EmailMorphMotionIntensity;
  /** Accessible copy for the field and changing action state. */
  labels?: Partial<EmailMorphLabels>;
  /** Replaces the custom SVG glyph for any action state. */
  renderIcon?: (state: EmailMorphActionState) => ReactNode;
  /** Class name applied to the complete form. */
  className?: string;
  /** Inline styles applied to the complete form. */
  style?: CSSProperties;
}

interface MotionPreset {
  goo: number;
  iconRotate: number;
  spring: {
    type: "spring";
    stiffness: number;
    damping: number;
    mass: number;
  };
  stretch: number;
  tap: number;
}

const MOTION_PRESETS: Record<EmailMorphMotionIntensity, MotionPreset> = {
  subtle: {
    goo: 6,
    iconRotate: 4,
    spring: { type: "spring", stiffness: 420, damping: 38, mass: 0.7 },
    stretch: 0.08,
    tap: 0.985,
  },
  default: {
    goo: 8,
    iconRotate: 8,
    spring: { type: "spring", stiffness: 300, damping: 27, mass: 0.9 },
    stretch: 0.14,
    tap: 0.97,
  },
  expressive: {
    goo: 10,
    iconRotate: 12,
    spring: { type: "spring", stiffness: 240, damping: 23, mass: 0.95 },
    stretch: 0.19,
    tap: 0.955,
  },
};

const DEFAULT_LABELS: EmailMorphLabels = {
  input: "Email address",
  loading: "Subscribing",
  submit: "Subscribe",
  success: "Subscribed",
};

const DEFAULT_INVALID_MESSAGE = "Enter a valid email address.";
/**
 * Specular highlight clipped to the error glyphs. plus-lighter brightens
 * the type without laying a slab on the message.
 */
const ERROR_SHIMMER_GRADIENT =
  "linear-gradient(108deg, transparent 0%, color-mix(in oklab, white 40%, transparent) 30%, white 50%, color-mix(in oklab, white 40%, transparent) 70%, transparent 100%)";
const ERROR_SHIMMER_EM = 2.6;
const ERROR_SHIMMER_SWEEP = {
  duration: 1,
  ease: [0.4, 0, 0.2, 1],
} as const;
const ERROR_SHIMMER_FADE = {
  duration: 1,
  ease: "linear" as const,
  times: [0, 0.72, 1] as number[],
};

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const ACTION_SIZE = 48;
const ACTION_RADIUS = ACTION_SIZE / 2;
const FIELD_WIDTH = 240;
const SEPARATED_GAP = 20;
const SEPARATED_SPACE = ACTION_SIZE + SEPARATED_GAP;
const MAX_TOTAL_WIDTH = FIELD_WIDTH + SEPARATED_SPACE;
const MIN_TOTAL_WIDTH = 240;
const MIN_FIELD_WIDTH = MIN_TOTAL_WIDTH - SEPARATED_SPACE;
const VIEWPORT_GUTTER = 32;
const GOO_PAD = 36;
const MAX_PROGRESS_OVERSHOOT = 0.035;
const INSTANT = { duration: 0 } as const;

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

function joinIds(...values: (string | undefined)[]): string | undefined {
  const ids = values
    .flatMap((value) => value?.split(/\s+/) ?? [])
    .filter(Boolean);
  return ids.length > 0 ? [...new Set(ids)].join(" ") : undefined;
}

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function mix(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function smoothStep(progress: number): number {
  const value = clamp(progress);
  return value * value * (3 - 2 * value);
}

function progressSegment(progress: number, start: number, end: number): number {
  return smoothStep((progress - start) / (end - start));
}

function liquidStretch(progress: number): number {
  const pull = progressSegment(progress, 0.04, 0.32);
  const settle = progressSegment(progress, 0.36, 0.78);
  return pull * (1 - settle);
}

function getViewportWidth(): number {
  if (typeof window === "undefined") return MAX_TOTAL_WIDTH;

  const documentWidth = document.documentElement.clientWidth;
  const visualWidth = window.visualViewport?.width;
  const measured =
    visualWidth && visualWidth > 0
      ? documentWidth > 0
        ? Math.min(documentWidth, visualWidth)
        : visualWidth
      : documentWidth;

  if (measured <= 0) return MAX_TOTAL_WIDTH;
  return clamp(measured - VIEWPORT_GUTTER, MIN_TOTAL_WIDTH, MAX_TOTAL_WIDTH);
}

function getServerViewportWidth(): number {
  return MAX_TOTAL_WIDTH;
}

function subscribeToViewport(onStoreChange: () => void): () => void {
  window.addEventListener("resize", onStoreChange);
  window.visualViewport?.addEventListener("resize", onStoreChange);

  return () => {
    window.removeEventListener("resize", onStoreChange);
    window.visualViewport?.removeEventListener("resize", onStoreChange);
  };
}

function useAvailableWidth(): number {
  return useSyncExternalStore(
    subscribeToViewport,
    getViewportWidth,
    getServerViewportWidth,
  );
}

function fieldWidthFor(totalWidth: number): number {
  return clamp(totalWidth - SEPARATED_SPACE, MIN_FIELD_WIDTH, FIELD_WIDTH);
}

interface ErrorShimmerProps {
  children: ReactNode;
  reducedMotion: boolean;
  replayKey: number;
}

function ErrorShimmer({
  children,
  reducedMotion,
  replayKey,
}: ErrorShimmerProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = useState(0);
  const [em, setEm] = useState(14);

  useIsomorphicLayoutEffect(() => {
    const node = textRef.current;
    if (!node) return;

    const measure = () => {
      setTextWidth(node.offsetWidth);
      setEm(Number.parseFloat(getComputedStyle(node).fontSize) || 14);
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children]);

  const sheenWidth = em * ERROR_SHIMMER_EM;
  const showSheen = !reducedMotion && replayKey > 0 && textWidth > 0;

  return (
    <span className="relative isolate inline-block" ref={textRef}>
      {children}
      {showSheen ? (
        // Keyframe arrays play from mount. Remounting on each failed submit
        // is what lets the sheen sweep again.
        <motion.span
          animate={{ opacity: [1, 1, 0] }}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          data-slot="email-morph-error-shimmer"
          key={replayKey}
          transition={{ opacity: ERROR_SHIMMER_FADE }}
        >
          <motion.span
            animate={{
              backgroundPositionX: [-sheenWidth, textWidth + sheenWidth * 0.12],
            }}
            className="absolute inset-0 block bg-clip-text bg-no-repeat text-transparent opacity-[var(--suluu-email-morph-shimmer-intensity)] mix-blend-plus-lighter [-webkit-text-fill-color:transparent]"
            style={{
              backgroundImage: ERROR_SHIMMER_GRADIENT,
              backgroundSize: `${String(sheenWidth)}px 100%`,
            }}
            transition={{ backgroundPositionX: ERROR_SHIMMER_SWEEP }}
          >
            {children}
          </motion.span>
        </motion.span>
      ) : null}
    </span>
  );
}

interface DefaultActionIconProps {
  reducedMotion: boolean;
  rotate: number;
  state: EmailMorphActionState;
  transition: MotionPreset["spring"];
}

function DefaultActionIcon({
  reducedMotion,
  rotate,
  state,
  transition,
}: DefaultActionIconProps) {
  const loading = state === "loading";
  const success = state === "success";
  const showArrow = !loading && !success;
  const iconTransition = reducedMotion ? INSTANT : transition;

  return (
    <motion.svg
      aria-hidden="true"
      className="size-5"
      data-slot="email-morph-default-icon"
      fill="none"
      initial={false}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <motion.path
        animate={{
          opacity: showArrow ? 1 : 0,
          pathLength: showArrow ? 1 : 0,
          rotate: showArrow ? 0 : rotate,
          scale: showArrow ? 1 : 0.74,
        }}
        d="M5.5 12h12m-4.5-4.5L17.5 12 13 16.5"
        style={{ transformBox: "view-box", transformOrigin: "center" }}
        transition={iconTransition}
      />
      <motion.g
        animate={{ opacity: loading ? 1 : 0, rotate: loading ? 360 : 0 }}
        style={{ transformBox: "view-box", transformOrigin: "center" }}
        transition={
          loading && !reducedMotion
            ? { duration: 0.82, ease: "linear", repeat: Infinity }
            : { duration: reducedMotion ? 0 : 0.16 }
        }
      >
        <circle cx="12" cy="12" opacity="0.22" r="7.5" />
        <path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5" />
      </motion.g>
      <motion.path
        animate={{
          opacity: success ? 1 : 0,
          pathLength: success ? 1 : 0,
          scale: success ? 1 : 0.72,
        }}
        d="m6.4 12.4 3.7 3.5 7.5-7.8"
        transition={iconTransition}
      />
    </motion.svg>
  );
}

export const EmailMorph = forwardRef<HTMLInputElement, EmailMorphProps>(
  function EmailMorph(
    {
      "aria-describedby": ariaDescribedBy,
      "aria-errormessage": ariaErrorMessage,
      "aria-invalid": ariaInvalid,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      autoComplete = "off",
      autoCapitalize = "none",
      className,
      collapseOnBlur = true,
      defaultValue = "",
      disabled = false,
      error,
      inputMode = "email",
      invalid = false,
      labels,
      loading = false,
      motionIntensity = "default",
      name = "email",
      onBlur,
      onFocus,
      onInvalid,
      onKeyDown,
      onSubmit,
      onValueChange,
      placeholder = "Email address",
      readOnly = false,
      renderIcon,
      spellCheck = false,
      style,
      success = false,
      value,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const [focusWithin, setFocusWithin] = useState(false);
    const [opened, setOpened] = useState(false);
    const [nativeInvalid, setNativeInvalid] = useState(false);
    const [nativeError, setNativeError] = useState("");
    const [errorShimmerKey, setErrorShimmerKey] = useState(0);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const instanceId = useId();
    const errorId = `${instanceId}-error`;
    const gooId = `suluu-email-morph-goo-${instanceId.replace(/:/g, "")}`;
    const prefersReducedMotion = useReducedMotion() ?? false;
    const liquid = !prefersReducedMotion;
    const availableWidth = useAvailableWidth();
    const fieldWidth = fieldWidthFor(availableWidth);
    const compactWidth = Math.max(fieldWidth - ACTION_SIZE, MIN_FIELD_WIDTH);
    const totalWidth = fieldWidth + SEPARATED_SPACE;
    const preset = MOTION_PRESETS[motionIntensity];
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolledValue;
    const hasExternalError =
      error !== undefined && error !== null && error !== false;
    const hasAriaInvalid =
      ariaInvalid !== undefined &&
      ariaInvalid !== false &&
      ariaInvalid !== "false";
    const isInvalid =
      invalid || hasExternalError || hasAriaInvalid || nativeInvalid;
    const effectiveSuccess = success && !isInvalid && !loading;
    const expanded =
      focusWithin || loading || effectiveSuccess || (!collapseOnBlur && opened);
    const rootState = disabled
      ? "disabled"
      : loading
        ? "loading"
        : isInvalid
          ? "error"
          : effectiveSuccess
            ? "success"
            : focusWithin
              ? "focused"
              : "idle";
    const actionState: EmailMorphActionState = disabled
      ? "disabled"
      : loading
        ? "loading"
        : isInvalid
          ? "error"
          : effectiveSuccess
            ? "success"
            : "submit";
    const resolvedLabels: EmailMorphLabels = {
      input: labels?.input ?? DEFAULT_LABELS.input,
      loading: labels?.loading ?? DEFAULT_LABELS.loading,
      submit: labels?.submit ?? DEFAULT_LABELS.submit,
      success: labels?.success ?? DEFAULT_LABELS.success,
    };
    const actionLabel =
      actionState === "loading"
        ? resolvedLabels.loading
        : actionState === "success"
          ? resolvedLabels.success
          : resolvedLabels.submit;
    const visibleError = hasExternalError
      ? error
      : nativeInvalid
        ? nativeError
        : null;
    const hasErrorContent = visibleError !== null && visibleError !== "";
    const showError = hasErrorContent && (hasExternalError || expanded);
    const describedBy = joinIds(
      ariaDescribedBy,
      showError ? errorId : undefined,
    );
    const errorMessage = joinIds(
      ariaErrorMessage,
      showError ? errorId : undefined,
    );

    const targetProgress = useMotionValue(expanded ? 1 : 0);
    const springProgress = useSpring(targetProgress, preset.spring);
    const physicalProgress = useTransform(springProgress, (progress) =>
      clamp(progress, -MAX_PROGRESS_OVERSHOOT, 1 + MAX_PROGRESS_OVERSHOOT),
    );
    const clampedProgress = useTransform(physicalProgress, (progress) =>
      clamp(progress),
    );
    const compactWidthValue = useMotionValue(compactWidth);
    const totalWidthValue = useMotionValue(totalWidth);
    const trackWidth = useTransform(
      [physicalProgress, compactWidthValue, totalWidthValue],
      ([progress, compact, total]) =>
        mix(Number(compact), Number(total), Number(progress)),
    );
    const fieldRight = useTransform(
      physicalProgress,
      (progress) => SEPARATED_SPACE * progress,
    );
    const liveFieldWidth = useTransform(
      [trackWidth, fieldRight],
      ([track, right]) => Number(track) - Number(right),
    );
    const dropLeft = useTransform(
      trackWidth,
      (width) => width - ACTION_SIZE + GOO_PAD,
    );
    const dropScaleX = useTransform(clampedProgress, (progress) => {
      const stretch = liquidStretch(progress) * preset.stretch;
      return 1 + stretch;
    });
    const dropScaleY = useTransform(clampedProgress, (progress) => {
      const stretch = liquidStretch(progress) * preset.stretch;
      return 1 - stretch * 0.46;
    });
    const neckSize = useTransform(clampedProgress, (progress) =>
      mix(34, 10, progressSegment(progress, 0.12, 0.64)),
    );
    const neckOpacity = useTransform(
      clampedProgress,
      (progress) => 1 - progressSegment(progress, 0.58, 0.76),
    );
    const neckLeft = useTransform(
      [physicalProgress, neckSize, liveFieldWidth],
      ([progress, size, width]) =>
        GOO_PAD +
        Number(width) -
        ACTION_RADIUS +
        SEPARATED_SPACE * Number(progress) * 0.48 -
        Number(size) / 2,
    );
    const neckTop = useTransform(
      neckSize,
      (size) => GOO_PAD + (ACTION_SIZE - size) / 2,
    );
    const blobWidth = totalWidth + GOO_PAD * 2;
    const blobHeight = ACTION_SIZE + GOO_PAD * 2;
    const actionSurface = useTransform(clampedProgress, (progress) =>
      progressSegment(progress, 0.58, 0.78),
    );
    const iconAppearance = useTransform(clampedProgress, (progress) =>
      progressSegment(progress, 0.42, 0.68),
    );

    useEffect(() => {
      compactWidthValue.set(compactWidth);
      totalWidthValue.set(totalWidth);
    }, [compactWidth, compactWidthValue, totalWidth, totalWidthValue]);

    useEffect(() => {
      const nextProgress = expanded ? 1 : 0;
      targetProgress.set(nextProgress);
      if (prefersReducedMotion) springProgress.jump(nextProgress);
    }, [expanded, prefersReducedMotion, springProgress, targetProgress]);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;

        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    function revealNativeError() {
      setNativeInvalid(true);
      setNativeError(DEFAULT_INVALID_MESSAGE);
    }

    function dismissNativeError() {
      setNativeInvalid(false);
      setNativeError("");
      setErrorShimmerKey(0);
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const nextValue = event.currentTarget.value;
      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);

      if (nativeInvalid) {
        if (event.currentTarget.validity.valid) {
          setNativeInvalid(false);
          setNativeError("");
        } else {
          setNativeError(DEFAULT_INVALID_MESSAGE);
        }
      }
    }

    function handleFocus(event: FocusEvent<HTMLInputElement>) {
      onFocus?.(event);
      setFocusWithin(true);
      setOpened(true);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      onBlur?.(event);
    }

    function handleInvalid(event: SyntheticEvent<HTMLInputElement>) {
      event.preventDefault();
      onInvalid?.(event);
      revealNativeError();
    }

    function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
      if (event.defaultPrevented || event.key !== "Escape") return;
      if (loading || effectiveSuccess) return;

      event.preventDefault();
      setOpened(false);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
      event.preventDefault();

      if (disabled || loading || effectiveSuccess) return;

      const input = inputRef.current;
      if (!input?.checkValidity()) {
        if (input) {
          revealNativeError();
          if (!prefersReducedMotion) {
            setErrorShimmerKey((key) => key + 1);
          }
          input.focus();
        }
        return;
      }

      setNativeInvalid(false);
      setNativeError("");
      onSubmit?.(currentValue.trim(), event);
    }

    return (
      // The form intentionally receives focus, blur, and Escape bubbling from
      // its two interactive descendants so the morph behaves as one widget.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <form
        aria-busy={loading || undefined}
        aria-label={`${resolvedLabels.submit} form`}
        autoComplete="off"
        className={joinClassNames(
          "relative inline-flex max-w-full flex-col",
          disabled ? "opacity-50" : undefined,
          className,
        )}
        data-expanded={expanded ? "true" : "false"}
        data-motion-intensity={motionIntensity}
        data-slot="email-morph"
        data-state={rootState}
        noValidate
        onBlur={(event) => {
          const nextTarget = event.relatedTarget;
          if (nextTarget && event.currentTarget.contains(nextTarget)) return;
          setFocusWithin(false);
          dismissNativeError();
        }}
        onFocus={() => {
          setFocusWithin(true);
          setOpened(true);
        }}
        onKeyDown={handleFormKeyDown}
        onSubmit={handleSubmit}
        style={style}
      >
        <motion.div
          className="relative h-12 max-w-full overflow-visible"
          data-slot="email-morph-track"
          style={{ width: trackWidth }}
        >
          {liquid && (
            <>
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute h-0 w-0 overflow-hidden"
                data-slot="email-morph-bridge"
              >
                <defs>
                  <filter
                    colorInterpolationFilters="sRGB"
                    filterUnits="userSpaceOnUse"
                    height={blobHeight}
                    id={gooId}
                    primitiveUnits="userSpaceOnUse"
                    width={blobWidth}
                    x="0"
                    y="0"
                  >
                    <feGaussianBlur
                      in="SourceGraphic"
                      result="blur"
                      stdDeviation={preset.goo}
                    />
                    <feColorMatrix
                      in="blur"
                      result="goo"
                      type="matrix"
                      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
                    />
                  </filter>
                </defs>
              </svg>
              <div
                className="pointer-events-none absolute z-0"
                style={{
                  filter: `url(#${gooId})`,
                  height: blobHeight,
                  left: -GOO_PAD,
                  top: -GOO_PAD,
                  width: blobWidth,
                }}
              >
                <motion.div
                  className="absolute rounded-full bg-[var(--suluu-email-morph-surface)]"
                  data-slot="email-morph-liquid-field"
                  style={{
                    height: ACTION_SIZE,
                    left: GOO_PAD,
                    top: GOO_PAD,
                    width: liveFieldWidth,
                  }}
                />
                <motion.div
                  className="absolute rounded-full bg-[var(--suluu-email-morph-surface)]"
                  data-slot="email-morph-liquid-neck"
                  style={{
                    height: neckSize,
                    left: neckLeft,
                    opacity: neckOpacity,
                    top: neckTop,
                    width: neckSize,
                  }}
                />
                <motion.div
                  className="absolute size-12 rounded-full bg-[var(--suluu-email-morph-surface)] will-change-transform"
                  data-slot="email-morph-liquid-drop"
                  style={{
                    left: dropLeft,
                    scaleX: dropScaleX,
                    scaleY: dropScaleY,
                    top: GOO_PAD,
                  }}
                />
              </div>
            </>
          )}

          <motion.div
            className={joinClassNames(
              "absolute inset-y-0 left-0 z-10 flex min-w-0 items-center rounded-full bg-[var(--suluu-email-morph-surface)] text-[var(--suluu-email-morph-foreground)] outline-none",
              liquid
                ? undefined
                : isInvalid
                  ? "shadow-[var(--suluu-email-morph-error-shadow)]"
                  : "shadow-[var(--suluu-email-morph-shadow)]",
            )}
            data-slot="email-morph-field"
            style={{ right: fieldRight }}
          >
            {liquid && (
              <motion.span
                aria-hidden="true"
                className={joinClassNames(
                  "pointer-events-none absolute inset-0 rounded-full",
                  isInvalid
                    ? "shadow-[var(--suluu-email-morph-error-shadow)]"
                    : "shadow-[var(--suluu-email-morph-shadow)]",
                )}
                data-slot="email-morph-field-chrome"
              />
            )}
            <motion.input
              {...inputProps}
              aria-describedby={describedBy}
              aria-errormessage={errorMessage}
              aria-invalid={isInvalid ? true : ariaInvalid}
              aria-label={
                ariaLabel ?? (ariaLabelledBy ? undefined : resolvedLabels.input)
              }
              aria-labelledby={ariaLabelledBy}
              autoCapitalize={autoCapitalize}
              autoComplete={autoComplete}
              className="relative z-10 h-full min-w-0 flex-1 rounded-full bg-transparent px-[1.125rem] py-0 text-center text-base font-medium outline-none placeholder:text-[var(--suluu-email-morph-muted)] read-only:cursor-default disabled:cursor-not-allowed"
              disabled={disabled}
              inputMode={inputMode}
              name={name}
              onBlur={handleBlur}
              onChange={handleChange}
              onFocus={handleFocus}
              onInvalid={handleInvalid}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              readOnly={readOnly || loading || effectiveSuccess}
              ref={setInputRef}
              required
              spellCheck={spellCheck}
              type="email"
              value={currentValue}
            />
          </motion.div>

          <motion.button
            aria-busy={loading || undefined}
            aria-hidden={expanded ? undefined : true}
            aria-label={actionLabel}
            className={joinClassNames(
              "absolute top-0 right-0 z-30 inline-flex size-12 items-center justify-center rounded-full outline-none motion-reduce:transition-none",
              expanded
                ? "hover:brightness-[0.985] focus-visible:ring-2 focus-visible:ring-[var(--suluu-email-morph-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-email-morph-offset)] disabled:pointer-events-none"
                : "pointer-events-none",
              actionState === "success"
                ? "text-[var(--suluu-email-morph-success)]"
                : actionState === "error"
                  ? "text-[var(--suluu-email-morph-error)]"
                  : "text-[var(--suluu-email-morph-foreground)]",
            )}
            data-action-state={actionState}
            data-slot="email-morph-action"
            disabled={disabled || loading || effectiveSuccess}
            tabIndex={expanded ? undefined : -1}
            type="submit"
            {...(prefersReducedMotion ||
            disabled ||
            loading ||
            effectiveSuccess ||
            !expanded
              ? {}
              : { whileTap: { scale: preset.tap } })}
          >
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-[var(--suluu-email-morph-surface)]"
              data-slot="email-morph-action-fill"
              style={{ opacity: liquid ? actionSurface : iconAppearance }}
            />
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full shadow-[var(--suluu-email-morph-action-shadow)]"
              data-slot="email-morph-action-surface"
              style={{ opacity: actionSurface }}
            />
            <motion.span
              className="relative z-10 inline-flex items-center justify-center"
              style={{ opacity: iconAppearance }}
            >
              {renderIcon ? (
                renderIcon(actionState)
              ) : (
                <DefaultActionIcon
                  reducedMotion={prefersReducedMotion}
                  rotate={preset.iconRotate}
                  state={actionState}
                  transition={preset.spring}
                />
              )}
            </motion.span>
          </motion.button>
        </motion.div>

        <AnimatePresence initial={false}>
          {showError && (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="self-start overflow-hidden"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              key="email-error"
              style={{ width: liveFieldWidth }}
              transition={
                prefersReducedMotion
                  ? INSTANT
                  : {
                      height: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.16 },
                    }
              }
            >
              <p
                aria-live="polite"
                className="px-1 pt-2 text-center text-sm leading-5 text-[var(--suluu-email-morph-error)]"
                data-slot="email-morph-error"
                id={errorId}
              >
                <ErrorShimmer
                  reducedMotion={prefersReducedMotion}
                  replayKey={errorShimmerKey}
                >
                  {visibleError}
                </ErrorShimmer>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <span aria-live="polite" className="sr-only" role="status">
          {loading
            ? resolvedLabels.loading
            : effectiveSuccess
              ? resolvedLabels.success
              : ""}
        </span>
      </form>
    );
  },
);

EmailMorph.displayName = "EmailMorph";
