"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
} from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type SlideControlIntensity = "subtle" | "default" | "expressive";

/** Conflicting handlers that Motion redefines on its own components. */
type ConflictingDivProps =
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
  | "onTransitionEnd";

export interface SlideControlProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  ConflictingDivProps | "children" | "defaultValue" | "onChange" | "style"
> {
  /** Controlled value. */
  value?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  /** Called whenever an interaction requests a new committed value. */
  onValueChange?: (value: number) => void;
  /** Inclusive lower bound of the range. */
  min?: number;
  /** Inclusive upper bound of the range. */
  max?: number;
  /** Distance between committed values. `0` disables snapping. */
  step?: number;
  /** Disables pointer and keyboard interaction. */
  disabled?: boolean;
  /** Controls the thumb spring, fill follow, and squash character. */
  motionIntensity?: SlideControlIntensity;
  /** Inline styles merged onto the slider root. */
  style?: MotionStyle;
}

interface SlideSpring {
  damping: number;
  mass: number;
  stiffness: number;
}

export interface SlideMotionPreset {
  squashX: number;
  squashY: number;
  thumb: SlideSpring;
  /** Heavier than the thumb so the fill trails with a little mass. */
  fill: SlideSpring;
}

export type SlideKeyAction =
  { delta: number; type: "delta" } | { type: "bound"; value: "max" | "min" };

/** Diameter of the thumb, matching the `size-5` handle. */
export const SLIDE_THUMB_SIZE = 20;
const DEFAULT_TRACK_WIDTH = 224;
const MAGNET_CAPTURE = 0.32;

export const SLIDE_MOTION_PRESETS: Record<
  SlideControlIntensity,
  SlideMotionPreset
> = {
  subtle: {
    squashX: 1.06,
    squashY: 0.96,
    thumb: { damping: 42, mass: 0.65, stiffness: 520 },
    fill: { damping: 38, mass: 0.78, stiffness: 460 },
  },
  default: {
    squashX: 1.1,
    squashY: 0.92,
    thumb: { damping: 28, mass: 0.75, stiffness: 380 },
    fill: { damping: 26, mass: 0.88, stiffness: 280 },
  },
  expressive: {
    squashX: 1.14,
    squashY: 0.88,
    thumb: { damping: 18, mass: 0.9, stiffness: 280 },
    fill: { damping: 20, mass: 1.02, stiffness: 230 },
  },
};

export function clampNumber(value: number, min: number, max: number): number {
  if (min > max) return min;
  if (!Number.isFinite(value)) return min;

  return Math.min(max, Math.max(min, value));
}

function decimalPlaces(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;

  const text = step.toString().toLowerCase();
  if (text.includes("e-")) {
    const [base, exp] = text.split("e-");
    const fraction = base?.split(".")[1]?.length ?? 0;
    return fraction + Number(exp);
  }
  if (text.includes("e")) return 0;

  return text.split(".")[1]?.length ?? 0;
}

function roundToDecimals(value: number, decimals: number): number {
  if (decimals <= 0) return Math.round(value);

  const factor = 10 ** Math.min(decimals, 12);
  return Math.round(value * factor) / factor;
}

export function snapToStep(
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  if (min > max) return min;

  const clamped = clampNumber(value, min, max);
  if (!(step > 0) || !Number.isFinite(step)) return clamped;

  const decimals = decimalPlaces(step);
  const snapped = roundToDecimals(
    min + Math.round((clamped - min) / step) * step,
    decimals,
  );
  const lastStep = roundToDecimals(
    min + Math.floor(Math.max(0, max - min) / step) * step,
    decimals,
  );
  let best = snapped;
  let bestDistance = Math.abs(clamped - snapped);

  for (const candidate of [lastStep, max]) {
    const distance = Math.abs(clamped - candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return clampNumber(best, min, max);
}

export function pointerToRatio(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  thumbSize: number = SLIDE_THUMB_SIZE,
): number {
  const travel = Math.max(0, trackWidth - thumbSize);
  if (travel === 0) return 0;

  return clampNumber((clientX - trackLeft - thumbSize / 2) / travel, 0, 1);
}

export function unsnappedValueFromPointer(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  min: number,
  max: number,
): number {
  if (max <= min) return min;

  return min + pointerToRatio(clientX, trackLeft, trackWidth) * (max - min);
}

export function magnetizeValue(
  value: number,
  min: number,
  max: number,
  step: number,
  capture: number = MAGNET_CAPTURE,
): number {
  const clamped = clampNumber(value, min, max);
  if (!(step > 0) || !Number.isFinite(step)) return clamped;

  const snapped = snapToStep(clamped, min, max, step);
  const distance = Math.abs(clamped - snapped);
  const threshold = step * capture;
  if (threshold <= 0 || distance >= threshold) return clamped;

  const t = 1 - distance / threshold;
  return clamped + (snapped - clamped) * t * t;
}

function pageDelta(min: number, max: number, step: number): number {
  const tenth = Math.max(0, max - min) / 10;
  if (!(step > 0)) return tenth;

  return Math.max(step, snapToStep(min + tenth, min, max, step) - min);
}

export function resolveSlideKey(
  key: string,
  min: number,
  max: number,
  step: number,
): SlideKeyAction | null {
  const unit = step > 0 ? step : Math.max((max - min) / 100, 0);

  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return { delta: unit, type: "delta" };
    case "ArrowLeft":
    case "ArrowDown":
      return { delta: -unit, type: "delta" };
    case "PageUp":
      return { delta: pageDelta(min, max, step), type: "delta" };
    case "PageDown":
      return { delta: -pageDelta(min, max, step), type: "delta" };
    case "Home":
      return { type: "bound", value: "min" };
    case "End":
      return { type: "bound", value: "max" };
    default:
      return null;
  }
}

function valueToThumbX(
  value: number,
  min: number,
  max: number,
  trackWidth: number,
): number {
  const travel = Math.max(0, trackWidth - SLIDE_THUMB_SIZE);
  if (max <= min || travel === 0) return 0;

  return ((clampNumber(value, min, max) - min) / (max - min)) * travel;
}

function fillWidthFromThumbX(thumbX: number, trackWidth: number): number {
  return clampNumber(thumbX + SLIDE_THUMB_SIZE / 2, 0, trackWidth);
}

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export const SlideControl = forwardRef<HTMLDivElement, SlideControlProps>(
  function SlideControl(
    {
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      defaultValue,
      disabled = false,
      max = 100,
      min = 0,
      motionIntensity = "default",
      onKeyDown,
      onPointerCancel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onValueChange,
      step = 1,
      style,
      value,
      ...divProps
    },
    forwardedRef,
  ) {
    const preset = SLIDE_MOTION_PRESETS[motionIntensity];
    const initialValue = snapToStep(
      value ?? defaultValue ?? min,
      min,
      max,
      step,
    );
    const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
    const [dragging, setDragging] = useState(false);
    const [trackWidth, setTrackWidth] = useState(DEFAULT_TRACK_WIDTH);
    const isControlled = value !== undefined;
    const currentValue = snapToStep(
      isControlled ? value : uncontrolledValue,
      min,
      max,
      step,
    );
    const prefersReducedMotion = useReducedMotion() ?? false;
    const draggingRef = useRef(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const initialThumbX = valueToThumbX(
      currentValue,
      min,
      max,
      DEFAULT_TRACK_WIDTH,
    );
    const thumbTarget = useMotionValue(initialThumbX);
    const trackWidthMotion = useMotionValue(DEFAULT_TRACK_WIDTH);
    const squashXTarget = useMotionValue(1);
    const squashYTarget = useMotionValue(1);
    const thumbX = useSpring(thumbTarget, preset.thumb);
    const fillX = useSpring(thumbX, preset.fill);
    const squashX = useSpring(squashXTarget, preset.thumb);
    const squashY = useSpring(squashYTarget, preset.thumb);
    const fillWidthPx = useTransform(
      [fillX, trackWidthMotion],
      ([thumbPosition, width]) =>
        `${String(fillWidthFromThumbX(Number(thumbPosition), Number(width)))}px`,
    );

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

    const requestValue = useCallback(
      (nextValue: number) => {
        const committed = snapToStep(nextValue, min, max, step);
        if (committed === currentValue) return;

        if (!isControlled) setUncontrolledValue(committed);
        onValueChange?.(committed);
      },
      [currentValue, isControlled, max, min, onValueChange, step],
    );

    const moveToValue = useCallback(
      (nextValue: number, immediate: boolean) => {
        const x = valueToThumbX(nextValue, min, max, trackWidth);

        thumbTarget.set(x);
        trackWidthMotion.set(trackWidth);

        if (immediate) {
          thumbX.jump(x);
          fillX.jump(x);
        }
      },
      [fillX, max, min, thumbTarget, thumbX, trackWidth, trackWidthMotion],
    );

    const setSquash = useCallback(
      (active: boolean, immediate: boolean) => {
        const nextX = active && !immediate ? preset.squashX : 1;
        const nextY = active && !immediate ? preset.squashY : 1;

        squashXTarget.set(nextX);
        squashYTarget.set(nextY);

        if (immediate) {
          squashX.jump(nextX);
          squashY.jump(nextY);
        }
      },
      [
        preset.squashX,
        preset.squashY,
        squashX,
        squashXTarget,
        squashY,
        squashYTarget,
      ],
    );

    useLayoutEffect(() => {
      const node = rootRef.current;
      if (!node) return;

      const measure = () => {
        const width = node.getBoundingClientRect().width;
        if (width > 0) {
          trackWidthMotion.set(width);
          setTrackWidth(width);
        }
      };

      measure();
      const observer =
        typeof ResizeObserver === "function"
          ? new ResizeObserver(measure)
          : null;
      observer?.observe(node);
      window.addEventListener("resize", measure);

      return () => {
        observer?.disconnect();
        window.removeEventListener("resize", measure);
      };
    }, [trackWidthMotion]);

    useEffect(() => {
      if (draggingRef.current) return;

      moveToValue(currentValue, prefersReducedMotion);
    }, [currentValue, moveToValue, prefersReducedMotion]);

    useEffect(() => {
      if (prefersReducedMotion) setSquash(false, true);
    }, [prefersReducedMotion, setSquash]);

    function applyPointer(clientX: number, node: HTMLElement, settle: boolean) {
      const rect = node.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : trackWidth;
      if (width > 0 && width !== trackWidth) setTrackWidth(width);

      const raw = unsnappedValueFromPointer(
        clientX,
        rect.left,
        width,
        min,
        max,
      );
      const visual = settle ? snapToStep(raw, min, max, step) : raw;
      const travel = Math.max(0, width - SLIDE_THUMB_SIZE);
      const ratio =
        max <= min ? 0 : (clampNumber(visual, min, max) - min) / (max - min);
      const x = ratio * travel;

      trackWidthMotion.set(width);
      thumbTarget.set(x);
      if (prefersReducedMotion) {
        thumbX.jump(x);
        fillX.jump(x);
      }

      requestValue(raw);
    }

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
      onPointerDown?.(event);
      if (
        event.defaultPrevented ||
        disabled ||
        event.button !== 0 ||
        !event.isPrimary
      ) {
        return;
      }

      event.preventDefault();
      event.currentTarget.focus({
        focusVisible: false,
        preventScroll: true,
      });
      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      draggingRef.current = true;
      setDragging(true);
      setSquash(true, prefersReducedMotion);
      applyPointer(event.clientX, event.currentTarget, false);
    }

    function endDrag(event: PointerEvent<HTMLDivElement>) {
      if (!draggingRef.current) return;

      applyPointer(event.clientX, event.currentTarget, true);
      draggingRef.current = false;
      setDragging(false);
      setSquash(false, prefersReducedMotion);
      if (typeof event.currentTarget.releasePointerCapture === "function") {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // Capture may already have been released by the browser.
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled) return;

      const action = resolveSlideKey(event.key, min, max, step);
      if (!action) return;

      event.preventDefault();
      if (action.type === "bound") {
        requestValue(action.value === "min" ? min : max);
        return;
      }

      requestValue(currentValue + action.delta);
    }

    return (
      <motion.div
        {...divProps}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-orientation="horizontal"
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={currentValue}
        className={joinClassNames(
          "relative flex h-8 w-56 touch-none items-center outline-none select-none [-webkit-tap-highlight-color:transparent]",
          disabled
            ? "pointer-events-none cursor-not-allowed opacity-45"
            : "cursor-grab data-[dragging=true]:cursor-grabbing",
          "focus-visible:ring-2 focus-visible:ring-[var(--suluu-slide-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-slide-offset)]",
          "data-[dragging=true]:ring-0 data-[dragging=true]:ring-offset-0",
          className,
        )}
        data-dragging={dragging ? "true" : "false"}
        data-slot="slide-control"
        onKeyDown={handleKeyDown}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          endDrag(event);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          if (!draggingRef.current || disabled) return;
          applyPointer(event.clientX, event.currentTarget, false);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          endDrag(event);
        }}
        ref={setRootRef}
        role="slider"
        style={{ ...style }}
        tabIndex={disabled ? -1 : 0}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-1/2 -mt-[3px] h-1.5 rounded-full bg-[var(--suluu-slide-track)] shadow-[var(--suluu-slide-track-shadow)]"
          data-slot="slide-control-track"
        />
        <motion.span
          className="pointer-events-none absolute top-1/2 left-0 -mt-[3px] h-1.5 rounded-full bg-[var(--suluu-slide-fill)] shadow-[var(--suluu-slide-fill-shadow)]"
          data-slot="slide-control-fill"
          style={{ width: fillWidthPx }}
        />
        <motion.span
          className="pointer-events-none absolute top-1/2 left-0 z-10 -mt-2.5 size-5 rounded-full bg-[var(--suluu-slide-thumb)] shadow-[var(--suluu-slide-thumb-shadow)]"
          data-slot="slide-control-thumb"
          style={{ scaleX: squashX, scaleY: squashY, x: thumbX }}
        />
      </motion.div>
    );
  },
);

SlideControl.displayName = "SlideControl";
