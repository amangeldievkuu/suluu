"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type RopeTimePeriod = "AM" | "PM";
export type RopeTimePickerMode = "hour" | "minute" | "second";
export type RopeTimePickerSize = "sm" | "default" | "lg";
export type RopeTimePickerMotionIntensity = "subtle" | "default" | "expressive";

export interface RopeTimeValue {
  /** Hour on a twelve-hour clock. */
  hours: number;
  /** Minute from 0 through 59. */
  minutes: number;
  /** Second from 0 through 59. */
  seconds: number;
  /** Twelve-hour period. */
  period: RopeTimePeriod;
}

type NativeGroupProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "defaultValue" | "onChange" | "role"
>;

export interface RopeTimePickerProps extends NativeGroupProps {
  /** Controlled time value. */
  value?: RopeTimeValue;
  /** Initial time when uncontrolled. */
  defaultValue?: RopeTimeValue;
  /** Called for every distinct time requested by an interaction. */
  onValueChange?: (value: RopeTimeValue) => void;
  /** Controlled unit being edited. */
  mode?: RopeTimePickerMode;
  /** Initial unit being edited when mode is uncontrolled. */
  defaultMode?: RopeTimePickerMode;
  /** Called when focus or a pointer requests a different unit. */
  onModeChange?: (mode: RopeTimePickerMode) => void;
  /** Shows the seconds rope and direct-entry field. */
  showSeconds?: boolean;
  /** Shows editable digital fields above the dial. */
  showDigital?: boolean;
  /** Pointer, keyboard, and direct-entry step for minutes and seconds. */
  snapStep?: 1 | 5;
  /** Dial and typography scale. */
  size?: RopeTimePickerSize;
  /** Controls endpoint settle, rope lag, and resting weight. */
  motionIntensity?: RopeTimePickerMotionIntensity;
  /** Removes every control from interaction and the tab order. */
  disabled?: boolean;
  /** Keeps controls discoverable while preventing time changes. */
  readOnly?: boolean;
}

interface SpringPreset {
  damping: number;
  mass: number;
  stiffness: number;
}

export interface RopeTimeMotionPreset {
  endpoint: SpringPreset;
  rope: SpringPreset;
  sag: number;
}

export const ROPE_TIME_MOTION_PRESETS: Record<
  RopeTimePickerMotionIntensity,
  RopeTimeMotionPreset
> = {
  subtle: {
    endpoint: { damping: 48, mass: 0.58, stiffness: 620 },
    rope: { damping: 40, mass: 0.95, stiffness: 300 },
    sag: 8,
  },
  default: {
    endpoint: { damping: 38, mass: 0.66, stiffness: 520 },
    rope: { damping: 28, mass: 1.12, stiffness: 180 },
    sag: 13,
  },
  expressive: {
    endpoint: { damping: 33, mass: 0.72, stiffness: 450 },
    rope: { damping: 24, mass: 1.22, stiffness: 135 },
    sag: 17,
  },
};

export const DEFAULT_ROPE_TIME_VALUE: Readonly<RopeTimeValue> = {
  hours: 12,
  minutes: 0,
  period: "AM",
  seconds: 0,
};

const VIEWBOX_SIZE = 240;
const DIAL_CENTER = VIEWBOX_SIZE / 2;
const DIAL_RADIUS = 108;
const CENTER_DEAD_ZONE_RATIO = 0.11;
const HOUR_LABEL_RADIUS = 87;
export const HAND_RADII: Record<RopeTimePickerMode, number> = {
  hour: 54,
  minute: 72,
  second: 74,
};

const MODE_LABELS: Record<RopeTimePickerMode, string> = {
  hour: "Hour",
  minute: "Minute",
  second: "Second",
};

const SIZE_STYLES: Record<
  RopeTimePickerSize,
  {
    center: string;
    digital: string;
    dot: string;
    dotOffset: number;
    root: string;
  }
> = {
  sm: {
    center: "size-8 text-[9px]",
    digital: "text-2xl",
    dot: "size-3",
    dotOffset: 6,
    root: "w-56",
  },
  default: {
    center: "size-9 text-[10px]",
    digital: "text-[1.75rem]",
    dot: "size-3.5",
    dotOffset: 7,
    root: "w-72",
  },
  lg: {
    center: "size-10 text-[11px]",
    digital: "text-[2rem]",
    dot: "size-4",
    dotOffset: 8,
    root: "w-[22rem]",
  },
};

function svgCoord(value: number): string {
  return value.toFixed(3);
}

const TICKS = Array.from({ length: 60 }, (_, index) => {
  const major = index % 5 === 0;
  const angle = (index / 60) * Math.PI * 2 - Math.PI / 2;
  const outer = DIAL_RADIUS - 3;
  const inner = outer - (major ? 11 : 4);

  return {
    index,
    major,
    x1: svgCoord(DIAL_CENTER + Math.cos(angle) * inner),
    x2: svgCoord(DIAL_CENTER + Math.cos(angle) * outer),
    y1: svgCoord(DIAL_CENTER + Math.sin(angle) * inner),
    y2: svgCoord(DIAL_CENTER + Math.sin(angle) * outer),
  };
});

const HOUR_LABELS = Array.from({ length: 12 }, (_, index) => {
  const hour = index + 1;
  const angle = (hour / 12) * Math.PI * 2 - Math.PI / 2;
  const radius = HOUR_LABEL_RADIUS;

  return {
    hour,
    x: svgCoord(DIAL_CENTER + Math.cos(angle) * radius),
    y: svgCoord(DIAL_CENTER + Math.sin(angle) * radius),
  };
});

function joinClassNames(...values: (string | undefined | false)[]): string {
  return values.filter(Boolean).join(" ");
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeTimeValue(value: RopeTimeValue): RopeTimeValue {
  return {
    hours: clampInteger(value.hours, 1, 12),
    minutes: clampInteger(value.minutes, 0, 59),
    period: value.period === "PM" ? "PM" : "AM",
    seconds: clampInteger(value.seconds, 0, 59),
  };
}

export function normalizeClockAngle(angle: number): number {
  if (!Number.isFinite(angle)) return 0;
  return ((angle % 360) + 360) % 360;
}

/** Places a normalized angle nearest to the previous continuous angle. */
export function unwrapClockAngle(previous: number, next: number): number {
  const normalizedPrevious = normalizeClockAngle(previous);
  const normalizedNext = normalizeClockAngle(next);
  let delta = normalizedNext - normalizedPrevious;

  if (delta > 180) delta -= 360;
  if (delta <= -180) delta += 360;

  return previous + delta;
}

export function clockAngleForValue(
  value: number,
  mode: RopeTimePickerMode,
): number {
  if (mode === "hour") return (clampInteger(value, 1, 12) % 12) * 30;
  return clampInteger(value, 0, 59) * 6;
}

export function clockValueFromAngle(
  angle: number,
  mode: RopeTimePickerMode,
  snapStep: 1 | 5 = 1,
): number {
  const normalized = normalizeClockAngle(angle);
  if (mode === "hour") {
    const hour = Math.round(normalized / 30) % 12;
    return hour === 0 ? 12 : hour;
  }

  const tick = Math.round(normalized / 6) % 60;
  return (Math.round(tick / snapStep) * snapStep) % 60;
}

export function pointerToClockAngle(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, "height" | "left" | "top" | "width">,
): number {
  const x = clientX - (rect.left + rect.width / 2);
  const y = clientY - (rect.top + rect.height / 2);
  if (x === 0 && y === 0) return 0;

  return normalizeClockAngle((Math.atan2(y, x) * 180) / Math.PI + 90);
}

export function snapDirectTimeValue(
  value: number,
  mode: RopeTimePickerMode,
  snapStep: 1 | 5 = 1,
): number {
  if (mode === "hour") return clampInteger(value, 1, 12);

  const clamped = clampInteger(value, 0, 59);
  const maximum = snapStep === 5 ? 55 : 59;
  return Math.min(maximum, Math.round(clamped / snapStep) * snapStep);
}

export function resolveRopeTimeKey(
  key: string,
  current: number,
  mode: RopeTimePickerMode,
  snapStep: 1 | 5 = 1,
): number | null {
  const minimum = mode === "hour" ? 1 : 0;
  const maximum = mode === "hour" ? 12 : snapStep === 5 ? 55 : 59;

  if (key === "Home") return minimum;
  if (key === "End") return maximum;

  const direction =
    key === "ArrowRight" || key === "ArrowUp"
      ? 1
      : key === "ArrowLeft" || key === "ArrowDown"
        ? -1
        : 0;
  if (direction === 0) return null;

  if (mode === "hour") {
    return ((clampInteger(current, 1, 12) - 1 + direction + 12) % 12) + 1;
  }

  const clamped = clampInteger(current, 0, 59);
  if (direction > 0) {
    const next = Math.floor(clamped / snapStep) * snapStep + snapStep;
    return next >= 60 ? 0 : next;
  }

  const next = Math.ceil(clamped / snapStep) * snapStep - snapStep;
  return next < 0 ? maximum : next;
}

function formatTime(value: RopeTimeValue, showSeconds: boolean): string {
  const hour = String(value.hours).padStart(2, "0");
  const minute = String(value.minutes).padStart(2, "0");
  const second = String(value.seconds).padStart(2, "0");
  return `${hour}:${minute}${showSeconds ? `:${second}` : ""} ${value.period}`;
}

function unitValue(value: RopeTimeValue, mode: RopeTimePickerMode): number {
  if (mode === "hour") return value.hours;
  if (mode === "minute") return value.minutes;
  return value.seconds;
}

function replaceUnit(
  value: RopeTimeValue,
  mode: RopeTimePickerMode,
  next: number,
): RopeTimeValue {
  if (mode === "hour") return { ...value, hours: next };
  if (mode === "minute") return { ...value, minutes: next };
  return { ...value, seconds: next };
}

function timeValuesEqual(a: RopeTimeValue, b: RopeTimeValue): boolean {
  return (
    a.hours === b.hours &&
    a.minutes === b.minutes &&
    a.seconds === b.seconds &&
    a.period === b.period
  );
}

function pointAtAngle(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: DIAL_CENTER + Math.cos(radians) * radius,
    y: DIAL_CENTER + Math.sin(radians) * radius,
  };
}

function ropePath(
  endpointAngle: number,
  ropeAngle: number,
  radius: number,
  sag: number,
): string {
  const endpoint = pointAtAngle(endpointAngle, radius);
  const radians = ((endpointAngle - 90) * Math.PI) / 180;
  const unitX = Math.cos(radians);
  const unitY = Math.sin(radians);
  const gravityProjection = unitY;
  const sagX = -unitX * gravityProjection * sag;
  const sagY = (1 - unitY * gravityProjection) * sag;
  const lag = pointAtAngle(ropeAngle, radius * 0.64);
  const controlOneX = DIAL_CENTER + unitX * radius * 0.31 + sagX * 0.65;
  const controlOneY = DIAL_CENTER + unitY * radius * 0.31 + sagY * 0.65;
  const controlTwoX = lag.x + sagX;
  const controlTwoY = lag.y + sagY;

  return [
    "M",
    String(DIAL_CENTER),
    String(DIAL_CENTER),
    "C",
    controlOneX.toFixed(3),
    controlOneY.toFixed(3),
    controlTwoX.toFixed(3),
    controlTwoY.toFixed(3),
    endpoint.x.toFixed(3),
    endpoint.y.toFixed(3),
  ].join(" ");
}

interface RopeMotionState {
  dragTo: (angle: number) => void;
  left: MotionValue<string>;
  path: MotionValue<string>;
  settleTo: (angle: number) => void;
  top: MotionValue<string>;
}

function useRopeMotion(options: {
  angle: number;
  dragging: boolean;
  preset: RopeTimeMotionPreset;
  radius: number;
  reducedMotion: boolean;
}): RopeMotionState {
  const { angle, dragging, preset, radius, reducedMotion } = options;
  const continuousAngleRef = useRef(angle);
  const targetAngle = useMotionValue(angle);
  const endpointAngle = useSpring(targetAngle, preset.endpoint);
  const ropeAngle = useSpring(endpointAngle, preset.rope);
  const path = useTransform([endpointAngle, ropeAngle], ([endpoint, rope]) =>
    ropePath(Number(endpoint), Number(rope), radius, preset.sag),
  );
  const left = useTransform(endpointAngle, (current) => {
    const point = pointAtAngle(current, radius);
    return `${svgCoord((point.x / VIEWBOX_SIZE) * 100)}%`;
  });
  const top = useTransform(endpointAngle, (current) => {
    const point = pointAtAngle(current, radius);
    return `${svgCoord((point.y / VIEWBOX_SIZE) * 100)}%`;
  });

  const settleTo = useCallback(
    (nextAngle: number) => {
      const continuous = unwrapClockAngle(
        continuousAngleRef.current,
        nextAngle,
      );
      continuousAngleRef.current = continuous;
      targetAngle.set(continuous);

      if (reducedMotion) {
        endpointAngle.jump(continuous);
        ropeAngle.jump(continuous);
      }
    },
    [endpointAngle, reducedMotion, ropeAngle, targetAngle],
  );

  const dragTo = useCallback(
    (nextAngle: number) => {
      const continuous = unwrapClockAngle(
        continuousAngleRef.current,
        nextAngle,
      );
      continuousAngleRef.current = continuous;
      targetAngle.set(continuous);
      endpointAngle.jump(continuous);
      if (reducedMotion) ropeAngle.jump(continuous);
    },
    [endpointAngle, reducedMotion, ropeAngle, targetAngle],
  );

  useEffect(() => {
    if (!dragging) settleTo(angle);
  }, [angle, dragging, settleTo]);

  return { dragTo, left, path, settleTo, top };
}

interface RopeVisualProps {
  active: boolean;
  mode: RopeTimePickerMode;
  motionState: RopeMotionState;
  reducedMotion: boolean;
}

function ropeStroke(mode: RopeTimePickerMode, active: boolean): string {
  if (mode === "second") return "var(--suluu-rope-time-second)";
  return active
    ? "var(--suluu-rope-time-accent)"
    : "var(--suluu-rope-time-rope)";
}

function RopeVisual({
  active,
  mode,
  motionState,
  reducedMotion,
}: RopeVisualProps) {
  const isSecond = mode === "second";
  const transition = reducedMotion
    ? { duration: 0 }
    : { damping: 36, mass: 0.7, stiffness: 420, type: "spring" as const };
  const bodyWidth = isSecond ? (active ? 1.35 : 1.05) : active ? 2.15 : 1.5;
  const highlightWidth = isSecond ? (active ? 0.45 : 0.3) : active ? 0.7 : 0.45;
  const stroke = ropeStroke(mode, active);

  return (
    <g data-active={active ? "true" : "false"} data-mode={mode}>
      <motion.path
        animate={{
          opacity: isSecond ? (active ? 1 : 0.78) : active ? 1 : 0.56,
          strokeWidth: bodyWidth,
        }}
        d={motionState.path}
        data-slot={`rope-time-picker-${mode}-rope`}
        fill="none"
        initial={false}
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth={bodyWidth}
        style={{ filter: "var(--suluu-rope-time-rope-shadow)" }}
        transition={transition}
      />
      <motion.path
        animate={{
          opacity: isSecond ? (active ? 0.28 : 0.14) : active ? 0.34 : 0.16,
          strokeWidth: highlightWidth,
        }}
        d={motionState.path}
        fill="none"
        initial={false}
        stroke="var(--suluu-rope-time-rope-highlight)"
        strokeLinecap="round"
        strokeWidth={highlightWidth}
        transition={transition}
      />
    </g>
  );
}

interface TimeFieldProps {
  active: boolean;
  disabled: boolean;
  mode: RopeTimePickerMode;
  onModeRequest: (mode: RopeTimePickerMode) => void;
  onValueRequest: (mode: RopeTimePickerMode, value: number) => void;
  readOnly: boolean;
  snapStep: 1 | 5;
  value: number;
}

function TimeField({
  active,
  disabled,
  mode,
  onModeRequest,
  onValueRequest,
  readOnly,
  snapStep,
  value,
}: TimeFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const displayedValue = draft ?? String(value).padStart(2, "0");
  const minimum = mode === "hour" ? 1 : 0;
  const maximum = mode === "hour" ? 12 : 59;
  const parsedDraft =
    displayedValue === "" ? Number.NaN : Number(displayedValue);
  const invalidDraft =
    displayedValue !== "" &&
    (!Number.isFinite(parsedDraft) ||
      parsedDraft < minimum ||
      parsedDraft > (mode === "hour" ? 12 : 59));

  function commitDraft() {
    if (draft === null || draft === "") {
      return;
    }

    const next = snapDirectTimeValue(Number(draft), mode, snapStep);
    setDraft(String(next).padStart(2, "0"));
    onValueRequest(mode, next);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDraft = event.currentTarget.value.replace(/\D/g, "").slice(0, 2);
    setDraft(nextDraft);
    if (nextDraft === "") return;

    const parsed = Number(nextDraft);
    const rangeMaximum = mode === "hour" ? 12 : 59;
    if (parsed < minimum || parsed > rangeMaximum) return;

    onValueRequest(mode, snapDirectTimeValue(parsed, mode, snapStep));
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setDraft(String(value).padStart(2, "0"));
    onModeRequest(mode);
    event.currentTarget.select();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled || readOnly) return;

    const keyValue = resolveRopeTimeKey(event.key, value, mode, snapStep);
    if (keyValue !== null) {
      event.preventDefault();
      setDraft(String(keyValue).padStart(2, "0"));
      onValueRequest(mode, keyValue);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setDraft(null);
      event.currentTarget.blur();
    }
  }

  return (
    <input
      aria-invalid={invalidDraft || undefined}
      aria-label={MODE_LABELS[mode]}
      aria-valuemax={maximum}
      aria-valuemin={minimum}
      aria-valuenow={value}
      aria-valuetext={`${MODE_LABELS[mode]} ${String(value)}`}
      autoComplete="off"
      className={joinClassNames(
        "w-[2.25ch] rounded-lg bg-transparent px-0.5 py-1 text-center font-medium tracking-[-0.04em] tabular-nums transition-[color,background-color,box-shadow] duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--suluu-rope-time-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-rope-time-offset)] motion-reduce:transition-none",
        active
          ? "bg-[var(--suluu-rope-time-readout-active)] text-[var(--suluu-rope-time-accent)]"
          : "text-[var(--suluu-rope-time-foreground)] hover:bg-[var(--suluu-rope-time-readout-hover)]",
        disabled && "cursor-not-allowed",
        readOnly && "cursor-default",
      )}
      data-active={active ? "true" : "false"}
      data-mode={mode}
      data-slot={`rope-time-picker-${mode}-input`}
      disabled={disabled}
      inputMode="numeric"
      maxLength={2}
      onBlur={() => {
        if (!readOnly) commitDraft();
        setDraft(null);
      }}
      onChange={handleChange}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      pattern="[0-9]*"
      readOnly={readOnly}
      role="spinbutton"
      spellCheck={false}
      type="text"
      value={displayedValue}
    />
  );
}

interface HandControlProps {
  active: boolean;
  currentTime: RopeTimeValue;
  controlRef: (node: HTMLDivElement | null) => void;
  disabled: boolean;
  dragging: boolean;
  mode: RopeTimePickerMode;
  motionState: RopeMotionState;
  onKeyValue: (mode: RopeTimePickerMode, value: number) => void;
  onModeRequest: (mode: RopeTimePickerMode) => void;
  onPointerCancel: (
    event: PointerEvent<HTMLElement>,
    mode: RopeTimePickerMode,
  ) => void;
  onPointerDown: (
    event: PointerEvent<HTMLElement>,
    mode: RopeTimePickerMode,
  ) => void;
  onPointerMove: (
    event: PointerEvent<HTMLElement>,
    mode: RopeTimePickerMode,
  ) => void;
  onPointerUp: (
    event: PointerEvent<HTMLElement>,
    mode: RopeTimePickerMode,
  ) => void;
  readOnly: boolean;
  reducedMotion: boolean;
  showSeconds: boolean;
  sizeStyles: (typeof SIZE_STYLES)[RopeTimePickerSize];
  snapStep: 1 | 5;
  value: number;
}

function HandControl({
  active,
  currentTime,
  controlRef,
  disabled,
  dragging,
  mode,
  motionState,
  onKeyValue,
  onModeRequest,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  readOnly,
  reducedMotion,
  showSeconds,
  sizeStyles,
  snapStep,
  value,
}: HandControlProps) {
  const minimum = mode === "hour" ? 1 : 0;
  const maximum = mode === "hour" ? 12 : 59;
  const transition = reducedMotion
    ? { duration: 0 }
    : { damping: 36, mass: 0.68, stiffness: 430, type: "spring" as const };

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled || readOnly) return;
    const next = resolveRopeTimeKey(event.key, value, mode, snapStep);
    if (next === null) return;

    event.preventDefault();
    onModeRequest(mode);
    onKeyValue(mode, next);
  }

  return (
    <motion.div
      animate={{
        opacity: active ? 1 : 0.72,
        scale: dragging ? 1.1 : active ? 1 : 0.86,
      }}
      aria-disabled={disabled || readOnly || undefined}
      aria-label={MODE_LABELS[mode]}
      aria-valuemax={maximum}
      aria-valuemin={minimum}
      aria-valuenow={value}
      aria-valuetext={`${MODE_LABELS[mode]} ${String(value)}, ${formatTime(currentTime, showSeconds)}`}
      className={joinClassNames(
        "absolute z-20 touch-none rounded-full border shadow-[var(--suluu-rope-time-control-shadow)] outline-none [-webkit-tap-highlight-color:transparent]",
        sizeStyles.dot,
        disabled
          ? "pointer-events-none cursor-not-allowed"
          : readOnly
            ? "cursor-default"
            : dragging
              ? "cursor-grabbing"
              : "cursor-grab",
        active
          ? mode === "second"
            ? "border-[var(--suluu-rope-time-second)] bg-[var(--suluu-rope-time-second)]"
            : "border-[var(--suluu-rope-time-accent)] bg-[var(--suluu-rope-time-accent)]"
          : "border-[var(--suluu-rope-time-control-border)] bg-[var(--suluu-rope-time-control)]",
      )}
      data-active={active ? "true" : "false"}
      data-dragging={dragging ? "true" : "false"}
      data-mode={mode}
      data-slot={`rope-time-picker-${mode}-control`}
      initial={false}
      onFocus={() => {
        if (!disabled) onModeRequest(mode);
      }}
      onKeyDown={handleKeyDown}
      onPointerCancel={(event) => onPointerCancel(event, mode)}
      onPointerDown={(event) => onPointerDown(event, mode)}
      onPointerMove={(event) => onPointerMove(event, mode)}
      onPointerUp={(event) => onPointerUp(event, mode)}
      role="slider"
      ref={controlRef}
      style={{
        left: motionState.left,
        marginLeft: -sizeStyles.dotOffset,
        marginTop: -sizeStyles.dotOffset,
        top: motionState.top,
      }}
      tabIndex={disabled ? -1 : 0}
      transition={transition}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[18%] left-[24%] size-[28%] rounded-full bg-[var(--suluu-rope-time-rope-highlight)] opacity-70"
      />
    </motion.div>
  );
}

export const RopeTimePicker = forwardRef<HTMLDivElement, RopeTimePickerProps>(
  function RopeTimePicker(
    {
      "aria-label": ariaLabel = "Time picker",
      "aria-labelledby": ariaLabelledBy,
      className,
      defaultMode = "hour",
      defaultValue = DEFAULT_ROPE_TIME_VALUE,
      disabled = false,
      mode,
      motionIntensity = "default",
      onModeChange,
      onValueChange,
      readOnly = false,
      showDigital = true,
      showSeconds = false,
      size = "default",
      snapStep = 1,
      value,
      ...groupProps
    },
    forwardedRef,
  ) {
    const normalizedDefault = normalizeTimeValue(defaultValue);
    const [uncontrolledValue, setUncontrolledValue] =
      useState(normalizedDefault);
    const [uncontrolledMode, setUncontrolledMode] = useState(defaultMode);
    const [draggingMode, setDraggingMode] = useState<RopeTimePickerMode | null>(
      null,
    );
    const isValueControlled = value !== undefined;
    const isModeControlled = mode !== undefined;
    const currentTime = normalizeTimeValue(
      isValueControlled ? value : uncontrolledValue,
    );
    const requestedMode = isModeControlled ? mode : uncontrolledMode;
    const currentMode =
      !showSeconds && requestedMode === "second" ? "minute" : requestedMode;
    const effectiveSnapStep: 1 | 5 = snapStep === 5 ? 5 : 1;
    const prefersReducedMotion = useReducedMotion() ?? false;
    const preset = ROPE_TIME_MOTION_PRESETS[motionIntensity];
    const sizeStyles = SIZE_STYLES[size];
    const dialRef = useRef<HTMLDivElement | null>(null);
    const handRefs = useRef<
      Partial<Record<RopeTimePickerMode, HTMLDivElement | null>>
    >({});
    const activePointerRef = useRef<number | null>(null);
    const pointerModeRef = useRef<RopeTimePickerMode | null>(null);
    const lastPointerValueRef = useRef<number | null>(null);
    const captureTargetRef = useRef<HTMLElement | null>(null);
    const stopDragListenersRef = useRef<(() => void) | null>(null);

    const hourMotion = useRopeMotion({
      angle: clockAngleForValue(currentTime.hours, "hour"),
      dragging: draggingMode === "hour",
      preset,
      radius: HAND_RADII.hour,
      reducedMotion: prefersReducedMotion,
    });
    const minuteMotion = useRopeMotion({
      angle: clockAngleForValue(currentTime.minutes, "minute"),
      dragging: draggingMode === "minute",
      preset,
      radius: HAND_RADII.minute,
      reducedMotion: prefersReducedMotion,
    });
    const secondMotion = useRopeMotion({
      angle: clockAngleForValue(currentTime.seconds, "second"),
      dragging: draggingMode === "second",
      preset,
      radius: HAND_RADII.second,
      reducedMotion: prefersReducedMotion,
    });
    const handMotions: Record<RopeTimePickerMode, RopeMotionState> = {
      hour: hourMotion,
      minute: minuteMotion,
      second: secondMotion,
    };

    const requestMode = useCallback(
      (nextMode: RopeTimePickerMode) => {
        if (disabled) return;
        const visibleMode =
          !showSeconds && nextMode === "second" ? "minute" : nextMode;
        if (visibleMode === currentMode) {
          if (!isModeControlled && uncontrolledMode !== visibleMode) {
            setUncontrolledMode(visibleMode);
          }
          return;
        }

        if (!isModeControlled) setUncontrolledMode(visibleMode);
        onModeChange?.(visibleMode);
      },
      [
        currentMode,
        disabled,
        isModeControlled,
        onModeChange,
        showSeconds,
        uncontrolledMode,
      ],
    );

    const requestTime = useCallback(
      (nextTime: RopeTimeValue) => {
        const normalized = normalizeTimeValue(nextTime);
        if (timeValuesEqual(normalized, currentTime)) return;

        if (!isValueControlled) setUncontrolledValue(normalized);
        onValueChange?.(normalized);
      },
      [currentTime, isValueControlled, onValueChange],
    );

    const requestUnit = useCallback(
      (nextMode: RopeTimePickerMode, nextValue: number) => {
        requestTime(replaceUnit(currentTime, nextMode, nextValue));
      },
      [currentTime, requestTime],
    );
    const requestUnitRef = useRef(requestUnit);
    const currentTimeRef = useRef(currentTime);
    const handMotionsRef = useRef(handMotions);

    function stopDragListeners() {
      stopDragListenersRef.current?.();
      stopDragListenersRef.current = null;
    }

    function applyPointer(
      clientX: number,
      clientY: number,
      nextMode: RopeTimePickerMode,
      settle: boolean,
    ) {
      const dial = dialRef.current;
      if (!dial) return;

      const dialRect = dial.getBoundingClientRect();
      const distanceFromCenter = Math.hypot(
        clientX - (dialRect.left + dialRect.width / 2),
        clientY - (dialRect.top + dialRect.height / 2),
      );
      if (
        distanceFromCenter <
        Math.min(dialRect.width, dialRect.height) * CENTER_DEAD_ZONE_RATIO
      ) {
        return;
      }

      const angle = pointerToClockAngle(clientX, clientY, dialRect);
      const nextValue = clockValueFromAngle(angle, nextMode, effectiveSnapStep);
      const nextAngle = clockAngleForValue(nextValue, nextMode);
      const ropeMotion = handMotionsRef.current[nextMode];

      if (settle) ropeMotion.settleTo(nextAngle);
      else ropeMotion.dragTo(angle);

      if (lastPointerValueRef.current !== nextValue) {
        lastPointerValueRef.current = nextValue;
        requestUnitRef.current(nextMode, nextValue);
      }
    }

    const applyPointerRef = useRef(applyPointer);

    function finishDrag(
      event: Pick<globalThis.PointerEvent, "clientX" | "clientY" | "pointerId">,
      cancelled: boolean,
    ) {
      const pointerMode = pointerModeRef.current;
      if (
        pointerMode === null ||
        activePointerRef.current !== event.pointerId
      ) {
        return;
      }

      if (cancelled) {
        const time = currentTimeRef.current;
        handMotionsRef.current[pointerMode].settleTo(
          clockAngleForValue(unitValue(time, pointerMode), pointerMode),
        );
      } else {
        applyPointerRef.current(
          event.clientX,
          event.clientY,
          pointerMode,
          true,
        );
      }

      const target = captureTargetRef.current;
      stopDragListeners();
      if (target && typeof target.releasePointerCapture === "function") {
        try {
          target.releasePointerCapture(event.pointerId);
        } catch {
          // Capture may already have been released by the browser.
        }
      }

      captureTargetRef.current = null;
      activePointerRef.current = null;
      pointerModeRef.current = null;
      lastPointerValueRef.current = null;
      setDraggingMode(null);
    }

    function startPointer(
      event: PointerEvent<HTMLElement>,
      nextMode: RopeTimePickerMode,
    ) {
      if (
        disabled ||
        event.button !== 0 ||
        !event.isPrimary ||
        activePointerRef.current !== null
      ) {
        return;
      }

      event.preventDefault();
      const handControl = handRefs.current[nextMode];
      const wasFocused = document.activeElement === handControl;
      handControl?.focus({ preventScroll: true });
      if (wasFocused || !handControl) requestMode(nextMode);
      if (readOnly) return;

      activePointerRef.current = event.pointerId;
      pointerModeRef.current = nextMode;
      lastPointerValueRef.current = null;
      captureTargetRef.current = event.currentTarget;
      setDraggingMode(nextMode);
      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      const onMove = (nativeEvent: globalThis.PointerEvent) => {
        if (activePointerRef.current !== nativeEvent.pointerId) return;
        const pointerMode = pointerModeRef.current;
        if (pointerMode === null) return;
        applyPointerRef.current(
          nativeEvent.clientX,
          nativeEvent.clientY,
          pointerMode,
          false,
        );
      };
      const onUp = (nativeEvent: globalThis.PointerEvent) => {
        finishDrag(nativeEvent, false);
      };
      const onCancel = (nativeEvent: globalThis.PointerEvent) => {
        finishDrag(nativeEvent, true);
      };
      const onLostCapture = (nativeEvent: globalThis.PointerEvent) => {
        finishDrag(nativeEvent, true);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onCancel);
      event.currentTarget.addEventListener("lostpointercapture", onLostCapture);
      stopDragListenersRef.current = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onCancel);
        captureTargetRef.current?.removeEventListener(
          "lostpointercapture",
          onLostCapture,
        );
      };

      applyPointer(event.clientX, event.clientY, nextMode, false);
    }

    function movePointer(event: PointerEvent<HTMLElement>) {
      const pointerMode = pointerModeRef.current;
      if (
        disabled ||
        readOnly ||
        pointerMode === null ||
        activePointerRef.current !== event.pointerId
      ) {
        return;
      }

      applyPointer(event.clientX, event.clientY, pointerMode, false);
    }

    function finishPointer(
      event: PointerEvent<HTMLElement>,
      cancelled: boolean,
    ) {
      finishDrag(event, cancelled);
    }

    useLayoutEffect(() => {
      requestUnitRef.current = requestUnit;
      currentTimeRef.current = currentTime;
      handMotionsRef.current = handMotions;
      applyPointerRef.current = applyPointer;
    });

    useEffect(() => {
      return () => {
        stopDragListeners();
      };
    }, []);

    const visibleModes: RopeTimePickerMode[] = showSeconds
      ? ["hour", "minute", "second"]
      : ["hour", "minute"];
    const renderModes = [
      ...visibleModes.filter((entry) => entry !== currentMode),
      currentMode,
    ].filter(
      (entry, index, entries) =>
        visibleModes.includes(entry) && entries.indexOf(entry) === index,
    );

    return (
      <div
        {...groupProps}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabelledBy ? undefined : ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={joinClassNames(
          "inline-flex max-w-full flex-col items-center text-[var(--suluu-rope-time-foreground)]",
          sizeStyles.root,
          disabled && "opacity-45",
          className,
        )}
        data-disabled={disabled ? "true" : "false"}
        data-dragging={draggingMode ? "true" : "false"}
        data-mode={currentMode}
        data-readonly={readOnly ? "true" : "false"}
        data-size={size}
        data-slot="rope-time-picker"
        ref={forwardedRef}
        role="group"
      >
        {showDigital ? (
          <div
            aria-label="Digital time"
            className={joinClassNames(
              "mb-4 inline-flex items-center rounded-2xl border border-[var(--suluu-rope-time-border)] bg-[var(--suluu-rope-time-readout)] px-3 py-1.5 shadow-[var(--suluu-rope-time-readout-shadow)]",
              sizeStyles.digital,
            )}
            data-slot="rope-time-picker-readout"
            role="group"
          >
            <TimeField
              active={currentMode === "hour"}
              disabled={disabled}
              mode="hour"
              onModeRequest={requestMode}
              onValueRequest={requestUnit}
              readOnly={readOnly}
              snapStep={effectiveSnapStep}
              value={currentTime.hours}
            />
            <span
              aria-hidden="true"
              className="px-0.5 pb-0.5 text-[var(--suluu-rope-time-muted)]"
            >
              :
            </span>
            <TimeField
              active={currentMode === "minute"}
              disabled={disabled}
              mode="minute"
              onModeRequest={requestMode}
              onValueRequest={requestUnit}
              readOnly={readOnly}
              snapStep={effectiveSnapStep}
              value={currentTime.minutes}
            />
            {showSeconds ? (
              <>
                <span
                  aria-hidden="true"
                  className="px-0.5 pb-0.5 text-[var(--suluu-rope-time-muted)]"
                >
                  :
                </span>
                <TimeField
                  active={currentMode === "second"}
                  disabled={disabled}
                  mode="second"
                  onModeRequest={requestMode}
                  onValueRequest={requestUnit}
                  readOnly={readOnly}
                  snapStep={effectiveSnapStep}
                  value={currentTime.seconds}
                />
              </>
            ) : null}
          </div>
        ) : null}

        <div
          className="relative aspect-square w-full touch-none select-none"
          data-slot="rope-time-picker-dial"
          ref={dialRef}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 rounded-full border border-[var(--suluu-rope-time-border)] bg-[var(--suluu-rope-time-background)] shadow-[var(--suluu-rope-time-shadow)]"
            data-slot="rope-time-picker-dial-surface"
          />

          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible"
            fill="none"
            viewBox={`0 0 ${String(VIEWBOX_SIZE)} ${String(VIEWBOX_SIZE)}`}
          >
            <circle
              cx={DIAL_CENTER}
              cy={DIAL_CENTER}
              opacity="0.54"
              r={DIAL_RADIUS - 15}
              stroke="var(--suluu-rope-time-guide)"
              strokeWidth="0.75"
            />
            {TICKS.map((tick) => (
              <line
                key={tick.index}
                opacity={tick.major ? 0.9 : 0.42}
                stroke={
                  tick.major
                    ? "var(--suluu-rope-time-hour)"
                    : "var(--suluu-rope-time-muted)"
                }
                strokeLinecap="round"
                strokeWidth={tick.major ? 1.7 : 0.75}
                x1={tick.x1}
                x2={tick.x2}
                y1={tick.y1}
                y2={tick.y2}
              />
            ))}
            {renderModes.map((entry) => (
              <RopeVisual
                active={entry === currentMode}
                key={entry}
                mode={entry}
                motionState={handMotions[entry]}
                reducedMotion={prefersReducedMotion}
              />
            ))}
            {HOUR_LABELS.map((label) => (
              <text
                dominantBaseline="middle"
                fill="var(--suluu-rope-time-hour)"
                fontSize="8.5"
                fontWeight="500"
                key={label.hour}
                opacity="0.88"
                textAnchor="middle"
                x={label.x}
                y={label.y}
              >
                {label.hour}
              </text>
            ))}
            <circle
              cx={DIAL_CENTER}
              cy={DIAL_CENTER}
              fill="var(--suluu-rope-time-control)"
              r="5"
              stroke="var(--suluu-rope-time-control-border)"
              strokeWidth="1"
            />
          </svg>

          {renderModes.map((entry) => (
            <HandControl
              active={entry === currentMode}
              controlRef={(node) => {
                handRefs.current[entry] = node;
              }}
              currentTime={currentTime}
              disabled={disabled}
              dragging={draggingMode === entry}
              key={entry}
              mode={entry}
              motionState={handMotions[entry]}
              onKeyValue={requestUnit}
              onModeRequest={requestMode}
              onPointerCancel={(event) => finishPointer(event, true)}
              onPointerDown={startPointer}
              onPointerMove={movePointer}
              onPointerUp={(event) => finishPointer(event, false)}
              readOnly={readOnly}
              reducedMotion={prefersReducedMotion}
              showSeconds={showSeconds}
              sizeStyles={sizeStyles}
              snapStep={effectiveSnapStep}
              value={unitValue(currentTime, entry)}
            />
          ))}

          <button
            aria-disabled={readOnly || undefined}
            aria-label={`Period ${currentTime.period}. Change to ${currentTime.period === "AM" ? "PM" : "AM"}`}
            className={joinClassNames(
              "absolute top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--suluu-rope-time-control-border)] bg-[var(--suluu-rope-time-center)] font-semibold tracking-[0.08em] text-[var(--suluu-rope-time-foreground)] shadow-[var(--suluu-rope-time-center-shadow)] transition-[background-color,color,box-shadow,transform] duration-200 outline-none",
              "focus-visible:ring-2 focus-visible:ring-[var(--suluu-rope-time-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-rope-time-offset)] motion-reduce:transition-none",
              !disabled &&
                !readOnly &&
                "cursor-pointer hover:bg-[var(--suluu-rope-time-center-hover)] active:scale-[0.97]",
              readOnly && "cursor-default",
              sizeStyles.center,
            )}
            data-slot="rope-time-picker-period"
            disabled={disabled}
            onClick={() => {
              if (readOnly) return;
              requestTime({
                ...currentTime,
                period: currentTime.period === "AM" ? "PM" : "AM",
              });
            }}
            type="button"
          >
            {currentTime.period}
          </button>
        </div>
      </div>
    );
  },
);

RopeTimePicker.displayName = "RopeTimePicker";
