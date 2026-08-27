"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface DurationValue {
  /** Whole, non-negative hours. */
  hours: number;
  /** Minutes from 0 through 59. */
  minutes: number;
  /** Seconds from 0 through 59. */
  seconds: number;
}

export type DurationPillMotionIntensity = "subtle" | "default" | "expressive";

export type DurationPillIconState = "edit" | "confirm";

export interface DurationPillLabels {
  /** Accessible name for the complete widget. */
  duration: string;
  /** Accessible action name for the compact trigger. */
  edit: string;
  /** Accessible action name for the confirmation button. */
  confirm: string;
  /** Accessible label for the hour field. */
  hours: string;
  /** Accessible label for the minute field. */
  minutes: string;
  /** Accessible label for the second field. */
  seconds: string;
}

export interface DurationPillUnitLabels {
  /** Visible abbreviation for hours. */
  hours: string;
  /** Visible abbreviation for minutes. */
  minutes: string;
  /** Visible abbreviation for seconds. */
  seconds: string;
}

type NativeDurationPillProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "defaultValue" | "onChange" | "role"
>;

export interface DurationPillProps extends NativeDurationPillProps {
  /** Controlled duration value. */
  value?: DurationValue;
  /** Initial duration when uncontrolled. */
  defaultValue?: DurationValue;
  /** Called once when a distinct draft is committed. */
  onValueChange?: (value: DurationValue) => void;
  /** Called when the internal editor opens or closes. */
  onEditChange?: (editing: boolean) => void;
  /** Inclusive minimum duration. */
  min?: DurationValue;
  /** Inclusive maximum duration. */
  max?: DurationValue;
  /** Arrow-key step for minutes and seconds; direct entry remains exact. */
  step?: number;
  /** Shows seconds in the editor and default compact formatter. */
  showSeconds?: boolean;
  /** Removes the widget from interaction and the tab order. */
  disabled?: boolean;
  /** Keeps the compact value focusable without allowing edits. */
  readOnly?: boolean;
  /** Controls the shell spring and content settle. */
  motionIntensity?: DurationPillMotionIntensity;
  /** Replaces the default compact duration string. */
  formatValue?: (value: DurationValue) => string;
  /** Overrides visible and accessible interface copy. */
  labels?: Partial<DurationPillLabels>;
  /** Overrides the visible unit abbreviations. */
  unitLabels?: Partial<DurationPillUnitLabels>;
  /** Replaces the custom SVG for either trailing action state. */
  renderIcon?: (state: DurationPillIconState) => ReactNode;
}

interface SpringPreset {
  type: "spring";
  stiffness: number;
  damping: number;
  mass: number;
}

interface DurationPillMotionPreset {
  spring: SpringPreset;
  tap: number;
}

export const DURATION_PILL_MOTION_PRESETS: Record<
  DurationPillMotionIntensity,
  DurationPillMotionPreset
> = {
  subtle: {
    spring: { type: "spring", stiffness: 480, damping: 40, mass: 0.65 },
    tap: 0.99,
  },
  default: {
    spring: { type: "spring", stiffness: 360, damping: 32, mass: 0.85 },
    tap: 0.98,
  },
  expressive: {
    spring: { type: "spring", stiffness: 300, damping: 26, mass: 0.95 },
    tap: 0.97,
  },
};

export const DEFAULT_DURATION_VALUE: Readonly<DurationValue> = {
  hours: 0,
  minutes: 0,
  seconds: 0,
};

export const DEFAULT_DURATION_PILL_LABELS: Readonly<DurationPillLabels> = {
  confirm: "Confirm duration",
  duration: "Duration",
  edit: "Edit duration",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
};

export const DEFAULT_DURATION_PILL_UNIT_LABELS: Readonly<DurationPillUnitLabels> =
  {
    hours: "Hr.",
    minutes: "Min.",
    seconds: "Sec.",
  };

const MAX_HOURS = Math.floor(Number.MAX_SAFE_INTEGER / 3600);
const MAX_TOTAL_SECONDS = Number.MAX_SAFE_INTEGER;
const VIEWPORT_GUTTER = 32;
const BASE_COMPACT_WIDTH = 184;
const BASE_THREE_PART_COMPACT_WIDTH = 232;
const BASE_TILE_HEIGHT = 48;
const BASE_TILE_RADIUS = 14;
const BASE_FIELD_WIDTH = 92;
const BASE_SECONDS_FIELD_WIDTH = 76;
const BASE_ACTION_SIZE = 48;
const BASE_TILE_GAP = 12;
const BASE_NUMBER_SIZE = 17;
const BASE_UNIT_SIZE = 14;
const BASE_TILE_PADDING = 12;
const BASE_SECONDS_TILE_PADDING = 9;
const BASE_FIELD_CONTENT_GAP = 8;
const BASE_SECONDS_FIELD_CONTENT_GAP = 6;
const BASE_ICON_SIZE = 20;
const MIN_ACTION_SIZE = 44;
const MIN_EDITOR_FIELD_SIZE = 44;
const COMPACT_PART_GUTTER = 10;
const COMPACT_FORMAT_GUTTER = 16;
const ESTIMATED_DIGIT_WIDTH = 9;
const ESTIMATED_UNIT_CHARACTER_WIDTH = 6;
const ESTIMATED_FORMAT_CHARACTER_WIDTH = 8;
const SERVER_VIEWPORT_WIDTH = 1024;
const INSTANT = { duration: 0 } as const;
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface DurationDraft {
  hours: string;
  minutes: string;
  seconds: string;
}

type DurationUnit = keyof DurationValue;

function joinClassNames(...values: (string | undefined | false)[]): string {
  return values.filter(Boolean).join(" ");
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export function normalizeDurationValue(value: DurationValue): DurationValue {
  return {
    hours: clampInteger(value.hours, 0, MAX_HOURS),
    minutes: clampInteger(value.minutes, 0, 59),
    seconds: clampInteger(value.seconds, 0, 59),
  };
}

export function durationValueToSeconds(value: DurationValue): number {
  const normalized = normalizeDurationValue(value);
  return Math.min(
    MAX_TOTAL_SECONDS,
    normalized.hours * 3600 + normalized.minutes * 60 + normalized.seconds,
  );
}

export function durationValueFromSeconds(totalSeconds: number): DurationValue {
  const safeTotal = clampInteger(totalSeconds, 0, MAX_TOTAL_SECONDS);
  const hours = Math.floor(safeTotal / 3600);
  const remainder = safeTotal - hours * 3600;

  return {
    hours,
    minutes: Math.floor(remainder / 60),
    seconds: remainder % 60,
  };
}

function durationValuesEqual(a: DurationValue, b: DurationValue): boolean {
  return (
    a.hours === b.hours && a.minutes === b.minutes && a.seconds === b.seconds
  );
}

function normalizeStep(step: number): number {
  return clampInteger(step, 1, 59);
}

function largestSteppedUnit(step: number): number {
  return Math.floor(59 / step) * step;
}

interface DurationBounds {
  maximum: number | null;
  minimum: number;
}

function resolveDurationBounds(
  min: DurationValue | undefined,
  max: DurationValue | undefined,
): DurationBounds {
  const minimum = durationValueToSeconds(min ?? DEFAULT_DURATION_VALUE);
  const rawMaximum = max === undefined ? null : durationValueToSeconds(max);

  return {
    maximum: rawMaximum === null ? null : Math.max(minimum, rawMaximum),
    minimum,
  };
}

function constrainDurationValue(
  value: DurationValue,
  bounds: DurationBounds,
): DurationValue {
  const total = durationValueToSeconds(value);
  const maximum = bounds.maximum ?? Number.MAX_SAFE_INTEGER;
  return durationValueFromSeconds(
    Math.min(maximum, Math.max(bounds.minimum, total)),
  );
}

function durationDraftFromValue(value: DurationValue): DurationDraft {
  return {
    hours: String(value.hours),
    minutes: String(value.minutes).padStart(2, "0"),
    seconds: String(value.seconds).padStart(2, "0"),
  };
}

function parseDraftUnit(
  draft: string,
  fallback: number,
  maximum: number,
): number {
  if (draft === "") return fallback;

  const normalized = draft.replace(/^0+(?=\d)/, "");
  const maximumDraft = String(maximum);
  if (
    normalized.length > maximumDraft.length ||
    (normalized.length === maximumDraft.length && normalized > maximumDraft)
  ) {
    return maximum;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function durationValueFromDraft(
  draft: DurationDraft,
  openingValue: DurationValue,
  showSeconds: boolean,
): DurationValue {
  const openingDraft = durationDraftFromValue(openingValue);
  const hours =
    draft.hours === "" || draft.hours === openingDraft.hours
      ? openingValue.hours
      : clampInteger(
          parseDraftUnit(draft.hours, openingValue.hours, MAX_HOURS),
          0,
          MAX_HOURS,
        );
  const minutes =
    draft.minutes === "" || draft.minutes === openingDraft.minutes
      ? openingValue.minutes
      : clampInteger(
          parseDraftUnit(draft.minutes, openingValue.minutes, 59),
          0,
          59,
        );
  const seconds =
    !showSeconds ||
    draft.seconds === "" ||
    draft.seconds === openingDraft.seconds
      ? openingValue.seconds
      : clampInteger(
          parseDraftUnit(draft.seconds, openingValue.seconds, 59),
          0,
          59,
        );

  return { hours, minutes, seconds };
}

interface VisibleDurationPart {
  unit: DurationUnit;
  value: number;
}

const FORMAT_UNIT_LABELS: Readonly<Record<DurationUnit, string>> = {
  hours: "Hr",
  minutes: "Min",
  seconds: "Sec",
};

function visibleDurationParts(
  value: DurationValue,
  showSeconds: boolean,
): VisibleDurationPart[] {
  const parts: VisibleDurationPart[] = [];

  if (value.hours > 0) parts.push({ unit: "hours", value: value.hours });
  if (value.minutes > 0) {
    parts.push({ unit: "minutes", value: value.minutes });
  }
  if (showSeconds && value.seconds > 0) {
    parts.push({ unit: "seconds", value: value.seconds });
  }
  if (parts.length === 0) {
    parts.push({ unit: showSeconds ? "seconds" : "minutes", value: 0 });
  }

  return parts;
}

export function formatDurationValue(
  value: DurationValue,
  showSeconds = false,
): string {
  return visibleDurationParts(normalizeDurationValue(value), showSeconds)
    .map((part) => `${String(part.value)} ${FORMAT_UNIT_LABELS[part.unit]}`)
    .join(" ");
}

function getViewportWidth(): number {
  if (typeof window === "undefined") return SERVER_VIEWPORT_WIDTH;

  const documentWidth = document.documentElement.clientWidth;
  const visualWidth = window.visualViewport?.width;
  const innerWidth = window.innerWidth;
  const candidates = [documentWidth, visualWidth, innerWidth].filter(
    (candidate): candidate is number =>
      candidate !== undefined && Number.isFinite(candidate) && candidate > 0,
  );
  const measured = candidates.length > 0 ? Math.min(...candidates) : 0;

  return measured > 0 ? measured : SERVER_VIEWPORT_WIDTH;
}

function getServerViewportWidth(): number {
  return SERVER_VIEWPORT_WIDTH;
}

function subscribeToViewport(onStoreChange: () => void): () => void {
  window.addEventListener("resize", onStoreChange);
  window.visualViewport?.addEventListener("resize", onStoreChange);

  return () => {
    window.removeEventListener("resize", onStoreChange);
    window.visualViewport?.removeEventListener("resize", onStoreChange);
  };
}

function getElementContentWidth(element: HTMLElement): number | null {
  const styles = window.getComputedStyle(element);
  const padding =
    Number.parseFloat(styles.paddingLeft) +
    Number.parseFloat(styles.paddingRight);
  const width = element.clientWidth - (Number.isFinite(padding) ? padding : 0);

  return Number.isFinite(width) && width > 0 ? width : null;
}

function useAvailableWidth(rootRef: {
  readonly current: HTMLDivElement | null;
}): number {
  const viewportWidth = useSyncExternalStore(
    subscribeToViewport,
    getViewportWidth,
    getServerViewportWidth,
  );
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    const container = rootRef.current?.parentElement;
    if (!container) return;

    const measure = () => {
      const nextWidth = getElementContentWidth(container);
      setContainerWidth((previous) =>
        previous === nextWidth ? previous : nextWidth,
      );
    };

    measure();
    window.addEventListener("resize", measure);

    if (typeof ResizeObserver === "undefined") {
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [rootRef]);

  const viewportAvailable = Math.max(
    MIN_ACTION_SIZE,
    viewportWidth - VIEWPORT_GUTTER,
  );

  return Math.max(
    MIN_ACTION_SIZE,
    Math.min(viewportAvailable, containerWidth ?? viewportAvailable),
  );
}

interface DurationPillGeometry {
  actionSize: number;
  compactWidth: number;
  editorWidth: number;
  fieldContentGap: number;
  fieldWidths: number[];
  gap: number;
  height: number;
  numberSize: number;
  radius: number;
  scale: number;
  tilePadding: number;
  unitSize: number;
}

interface CompactContentMeasurements {
  formatted: number;
  parts: Record<DurationUnit, number>;
}

function minimumCompactWidth(visiblePartCount: number): number {
  return visiblePartCount >= 3
    ? BASE_THREE_PART_COMPACT_WIDTH
    : BASE_COMPACT_WIDTH;
}

function estimateCompactPartWidth(
  part: VisibleDurationPart,
  unitLabel: string,
): number {
  return (
    String(part.value).length * ESTIMATED_DIGIT_WIDTH +
    Array.from(unitLabel).length * ESTIMATED_UNIT_CHARACTER_WIDTH +
    Math.max(3, BASE_NUMBER_SIZE * 0.16)
  );
}

function preferredCompactFieldWidths(
  editorUnits: readonly DurationUnit[],
  visibleParts: readonly VisibleDurationPart[],
  unitLabels: DurationPillUnitLabels,
  measurements: CompactContentMeasurements,
): number[] {
  const visiblePartByUnit = new Map(
    visibleParts.map((part) => [part.unit, part] as const),
  );
  const baseWidth = minimumCompactWidth(visibleParts.length);
  const basePartWidth =
    (baseWidth - BASE_ACTION_SIZE) / Math.max(1, visibleParts.length);

  return editorUnits.map((unit) => {
    const part = visiblePartByUnit.get(unit);
    if (!part) return 0;

    const contentWidth = Math.max(
      measurements.parts[unit],
      estimateCompactPartWidth(part, unitLabels[unit]),
    );

    return Math.max(basePartWidth, contentWidth + COMPACT_PART_GUTTER);
  });
}

function compactBaseWidth(
  formattedValue: string,
  visiblePartCount: number,
  hasCustomFormatter: boolean,
  preferredFieldWidths: readonly number[],
  measuredFormattedWidth: number,
): number {
  const defaultWidth = minimumCompactWidth(visiblePartCount);
  if (hasCustomFormatter) {
    const contentWidth = Math.max(
      measuredFormattedWidth,
      formattedValue.length * ESTIMATED_FORMAT_CHARACTER_WIDTH,
    );

    return Math.max(
      defaultWidth,
      BASE_ACTION_SIZE + COMPACT_FORMAT_GUTTER + contentWidth,
    );
  }

  return Math.max(
    defaultWidth,
    BASE_ACTION_SIZE +
      preferredFieldWidths.reduce((total, width) => total + width, 0),
  );
}

/** Fits editor fields into the joined compact shell without changing order. */
export function compactEditorFieldWidths(
  compactWidth: number,
  fieldWidths: readonly number[],
  actionSize: number,
): number[] {
  if (fieldWidths.length === 0) return [];

  const fieldSpace = Math.max(0, compactWidth - actionSize);
  const totalFieldWidth = fieldWidths.reduce(
    (total, width) => total + width,
    0,
  );

  if (totalFieldWidth <= 0) {
    return fieldWidths.map(() => fieldSpace / fieldWidths.length);
  }

  return fieldWidths.map((width) => (width / totalFieldWidth) * fieldSpace);
}

interface SegmentCorners {
  borderBottomLeftRadius: number;
  borderBottomRightRadius: number;
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
}

function segmentCorners(
  index: number,
  count: number,
  radius: number,
): SegmentCorners {
  const first = index === 0;
  const last = index === count - 1;

  return {
    borderBottomLeftRadius: first ? radius : 0,
    borderBottomRightRadius: last ? radius : 0,
    borderTopLeftRadius: first ? radius : 0,
    borderTopRightRadius: last ? radius : 0,
  };
}

function joinedSegmentCorners(
  index: number,
  widths: readonly number[],
  radius: number,
): SegmentCorners {
  const first = widths.findIndex((width) => width > 0);
  let last = -1;

  for (let current = widths.length - 1; current >= 0; current -= 1) {
    if ((widths[current] ?? 0) > 0) {
      last = current;
      break;
    }
  }

  return {
    borderBottomLeftRadius: index === first ? radius : 0,
    borderBottomRightRadius: index === last ? radius : 0,
    borderTopLeftRadius: index === first ? radius : 0,
    borderTopRightRadius: index === last ? radius : 0,
  };
}

function segmentOffsets(widths: readonly number[], gap: number): number[] {
  let offset = 0;

  return widths.map((width) => {
    const currentOffset = offset;
    offset += width + gap;
    return currentOffset;
  });
}

function resolveDurationPillGeometry(
  availableWidth: number,
  editing: boolean,
  visiblePartCount: number,
  preferredCompactWidth: number,
  hoursLength: number,
  showSeconds: boolean,
): DurationPillGeometry {
  const unitCount = showSeconds ? 3 : 2;
  const baseFieldWidth = showSeconds
    ? BASE_SECONDS_FIELD_WIDTH
    : BASE_FIELD_WIDTH;
  const structuralEditorWidth =
    baseFieldWidth * unitCount + BASE_ACTION_SIZE + BASE_TILE_GAP * unitCount;
  const baseCompactWidth = minimumCompactWidth(visiblePartCount);
  const structuralWidth = editing ? structuralEditorWidth : baseCompactWidth;
  const minimumScale = MIN_ACTION_SIZE / BASE_ACTION_SIZE;
  const scale = Math.max(
    minimumScale,
    Math.min(1, availableWidth / structuralWidth),
  );
  const actionSize = BASE_ACTION_SIZE * scale;
  const gap = Math.min(
    BASE_TILE_GAP * scale,
    Math.max(
      0,
      (availableWidth - actionSize - MIN_EDITOR_FIELD_SIZE * unitCount) /
        unitCount,
    ),
  );
  const availableFieldSpace = Math.max(
    0,
    availableWidth - actionSize - gap * unitCount,
  );
  const baseFieldWidths = Array.from(
    { length: unitCount },
    () => baseFieldWidth * scale,
  );
  const baseFieldTotal = baseFieldWidths.reduce(
    (total, width) => total + width,
    0,
  );
  const fieldWidths =
    baseFieldTotal > availableFieldSpace
      ? compactEditorFieldWidths(availableFieldSpace, baseFieldWidths, 0)
      : baseFieldWidths;
  const hoursGrowth =
    Math.max(0, hoursLength - 3) * ESTIMATED_DIGIT_WIDTH * scale;
  if (fieldWidths.length > 0 && baseFieldTotal <= availableFieldSpace) {
    fieldWidths[0] =
      (fieldWidths[0] ?? 0) +
      Math.min(hoursGrowth, availableFieldSpace - baseFieldTotal);
  }
  const editorWidth = Math.min(
    availableWidth,
    fieldWidths.reduce((total, width) => total + width, 0) +
      actionSize +
      gap * unitCount,
  );
  const compactWidth = Math.min(
    availableWidth,
    Math.max(baseCompactWidth * scale, preferredCompactWidth * scale),
  );
  const baseFieldContentGap = showSeconds
    ? BASE_SECONDS_FIELD_CONTENT_GAP
    : BASE_FIELD_CONTENT_GAP;
  const baseTilePadding = showSeconds
    ? BASE_SECONDS_TILE_PADDING
    : BASE_TILE_PADDING;

  return {
    actionSize,
    compactWidth,
    editorWidth,
    fieldContentGap: Math.max(6, baseFieldContentGap * scale),
    fieldWidths,
    gap,
    height: BASE_TILE_HEIGHT * scale,
    numberSize: Math.max(14, BASE_NUMBER_SIZE * scale),
    radius: Math.max(12, BASE_TILE_RADIUS * scale),
    scale,
    tilePadding: Math.max(showSeconds ? 8 : 9, baseTilePadding * scale),
    unitSize: Math.max(13, BASE_UNIT_SIZE * scale),
  };
}

interface DefaultActionIconProps {
  reducedMotion: boolean;
  size: number;
  state: DurationPillIconState;
  transition: SpringPreset;
}

function DefaultActionIcon({
  reducedMotion,
  size,
  state,
  transition,
}: DefaultActionIconProps) {
  if (state === "edit") {
    return (
      <motion.svg
        aria-hidden="true"
        fill="none"
        style={{ height: size, width: size }}
        transition={reducedMotion ? INSTANT : transition}
        variants={{
          hover: reducedMotion ? {} : { rotate: -4, x: 1.25, y: -1.25 },
          idle: { rotate: 0, x: 0, y: 0 },
        }}
        viewBox="0 0 24 24"
      >
        <path
          d="m4.1 16.45-.84 4.29 4.29-.84L18.7 8.75l-3.45-3.45L4.1 16.45Z"
          fill="currentColor"
        />
        <path
          d="m16.55 4 1.18-1.18a1.72 1.72 0 0 1 2.43 0l1.02 1.02a1.72 1.72 0 0 1 0 2.43L20 7.45 16.55 4Z"
          fill="currentColor"
        />
      </motion.svg>
    );
  }

  return (
    <motion.svg
      aria-hidden="true"
      fill="none"
      style={{ height: size, width: size }}
      viewBox="0 0 24 24"
    >
      <motion.path
        animate={{ opacity: 1, pathLength: 1, scale: 1 }}
        d="m4.5 12.4 4.6 4.55L19.6 6.6"
        initial={
          reducedMotion ? false : { opacity: 0, pathLength: 0, scale: 0.86 }
        }
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.8"
        style={{ transformBox: "view-box", transformOrigin: "center" }}
        transition={reducedMotion ? INSTANT : transition}
      />
    </motion.svg>
  );
}

interface DefaultDisplayProps {
  measurementRefs?: Partial<
    Record<DurationUnit, (node: HTMLSpanElement | null) => void>
  >;
  numberSize: number;
  showSeconds: boolean;
  unitLabels: DurationPillUnitLabels;
  unitSize: number;
  value: DurationValue;
}

interface DurationValuePartProps {
  measurementRef?: (node: HTMLSpanElement | null) => void;
  numberSize: number;
  part: VisibleDurationPart;
  unitLabel: string;
  unitSize: number;
}

function DurationValuePart({
  measurementRef,
  numberSize,
  part,
  unitLabel,
  unitSize,
}: DurationValuePartProps) {
  return (
    <span
      className="inline-flex max-w-full min-w-0 items-baseline"
      data-slot="duration-pill-value-part"
      data-unit={part.unit}
      ref={measurementRef}
      style={{ gap: Math.max(3, numberSize * 0.16) }}
    >
      <span
        className="min-w-0 overflow-hidden leading-none font-semibold tracking-[-0.035em] text-ellipsis whitespace-nowrap tabular-nums"
        data-slot="duration-pill-value-number"
        style={{ fontSize: numberSize }}
      >
        {part.value}
      </span>
      <span
        className="shrink-0 leading-none font-semibold tracking-[-0.025em] text-[var(--suluu-duration-pill-muted)]"
        data-slot="duration-pill-value-unit"
        style={{ fontSize: unitSize }}
      >
        {unitLabel}
      </span>
    </span>
  );
}

function DefaultDisplay({
  measurementRefs,
  numberSize,
  showSeconds,
  unitLabels,
  unitSize,
  value,
}: DefaultDisplayProps) {
  return (
    <span
      className="inline-flex w-full min-w-0 items-baseline whitespace-nowrap"
      style={{ gap: Math.max(9, numberSize * 0.55) }}
    >
      {visibleDurationParts(value, showSeconds).map((part) => (
        <DurationValuePart
          key={part.unit}
          numberSize={numberSize}
          part={part}
          unitLabel={unitLabels[part.unit]}
          unitSize={unitSize}
          {...(measurementRefs?.[part.unit]
            ? { measurementRef: measurementRefs[part.unit] }
            : {})}
        />
      ))}
    </span>
  );
}

function measureDurationValuePart(node: HTMLSpanElement): number {
  const number = node.querySelector<HTMLElement>(
    '[data-slot="duration-pill-value-number"]',
  );
  const unit = node.querySelector<HTMLElement>(
    '[data-slot="duration-pill-value-unit"]',
  );
  const gap = Number.parseFloat(node.style.gap);

  return (
    (number?.scrollWidth ?? 0) +
    (unit?.offsetWidth ?? 0) +
    (Number.isFinite(gap) ? gap : 0)
  );
}

interface DurationFieldProps {
  disabled: boolean;
  draft: string;
  fieldContentGap: number;
  inputRef?: (node: HTMLInputElement | null) => void;
  label: string;
  maximum: number;
  mode: DurationUnit;
  numberSize: number;
  onDraftChange: (mode: DurationUnit, draft: string) => void;
  onStep: (mode: DurationUnit, direction: -1 | 1) => void;
  tilePadding: number;
  unitLabel: string;
  unitSize: number;
}

function DurationField({
  disabled,
  draft,
  fieldContentGap,
  inputRef,
  label,
  maximum,
  mode,
  numberSize,
  onDraftChange,
  onStep,
  tilePadding,
  unitLabel,
  unitSize,
}: DurationFieldProps) {
  const parsed = draft === "" ? Number.NaN : Number(draft);
  const invalid =
    draft !== "" &&
    (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum);
  const maxLength = mode === "hours" ? undefined : 2;
  const internalInputRef = useRef<HTMLInputElement | null>(null);

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      internalInputRef.current = node;
      inputRef?.(node);
    },
    [inputRef],
  );

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.currentTarget.value.replace(/\D/g, "");
    onDraftChange(mode, maxLength ? digits.slice(0, maxLength) : digits);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const direction =
      event.key === "ArrowUp" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowDown" || event.key === "ArrowLeft"
          ? -1
          : 0;
    if (direction === 0) return;

    event.preventDefault();
    onStep(mode, direction);
  }

  return (
    <label
      className="flex size-full cursor-text items-center justify-between text-[var(--suluu-duration-pill-foreground)]"
      data-slot="duration-pill-segment"
      data-unit={mode}
      onPointerDown={(event) => {
        if (
          disabled ||
          event.button !== 0 ||
          event.target === internalInputRef.current
        ) {
          return;
        }

        event.preventDefault();
        internalInputRef.current?.focus();
        internalInputRef.current?.select();
      }}
      style={{ columnGap: fieldContentGap, paddingInline: tilePadding }}
    >
      <input
        aria-invalid={invalid || undefined}
        aria-label={label}
        aria-valuemax={maximum}
        aria-valuemin={0}
        aria-valuenow={Number.isFinite(parsed) ? parsed : undefined}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-left leading-none font-semibold tracking-[-0.045em] tabular-nums outline-none disabled:cursor-not-allowed"
        data-slot={`duration-pill-${mode}-input`}
        disabled={disabled}
        inputMode="numeric"
        maxLength={maxLength}
        onChange={handleChange}
        onFocus={(event: FocusEvent<HTMLInputElement>) =>
          event.currentTarget.select()
        }
        onKeyDown={handleKeyDown}
        pattern="[0-9]*"
        ref={setInputRef}
        role="spinbutton"
        spellCheck={false}
        style={{ fontSize: numberSize }}
        type="text"
        value={draft}
      />
      <span
        aria-hidden="true"
        className="shrink-0 leading-none font-semibold tracking-[-0.025em] text-[var(--suluu-duration-pill-muted)]"
        style={{ fontSize: unitSize }}
      >
        {unitLabel}
      </span>
    </label>
  );
}

export const DurationPill = forwardRef<HTMLDivElement, DurationPillProps>(
  function DurationPill(
    {
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      defaultValue = DEFAULT_DURATION_VALUE,
      disabled = false,
      formatValue,
      labels,
      max,
      min,
      motionIntensity = "default",
      onBlur,
      onEditChange,
      onKeyDown,
      onValueChange,
      readOnly = false,
      renderIcon,
      showSeconds = false,
      step = 1,
      unitLabels,
      value,
      ...rootProps
    },
    forwardedRef,
  ) {
    const bounds = useMemo(() => resolveDurationBounds(min, max), [max, min]);
    const normalizedStep = normalizeStep(step);
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(() =>
      constrainDurationValue(defaultValue, bounds),
    );
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<DurationDraft>(() =>
      durationDraftFromValue(constrainDurationValue(defaultValue, bounds)),
    );
    const [compactMeasurements, setCompactMeasurements] =
      useState<CompactContentMeasurements>({
        formatted: 0,
        parts: { hours: 0, minutes: 0, seconds: 0 },
      });
    const rootRef = useRef<HTMLDivElement | null>(null);
    const actionButtonRef = useRef<HTMLButtonElement | null>(null);
    const hoursInputRef = useRef<HTMLInputElement | null>(null);
    const compactPartMeasurementNodesRef = useRef(
      new Map<DurationUnit, HTMLSpanElement>(),
    );
    const formattedMeasurementNodeRef = useRef<HTMLSpanElement | null>(null);
    const openingValueRef = useRef<DurationValue>(
      constrainDurationValue(defaultValue, bounds),
    );
    const authorityKeyRef = useRef("");
    const editingRef = useRef(false);
    const openingFocusRef = useRef(false);
    const restoreFocusRef = useRef(false);
    const setCompactPartMeasurementRef = useCallback(
      (unit: DurationUnit, node: HTMLSpanElement | null) => {
        if (node) compactPartMeasurementNodesRef.current.set(unit, node);
        else compactPartMeasurementNodesRef.current.delete(unit);
      },
      [],
    );
    const compactPartMeasurementRefs = useMemo<
      Record<DurationUnit, (node: HTMLSpanElement | null) => void>
    >(
      () => ({
        hours: (node) => setCompactPartMeasurementRef("hours", node),
        minutes: (node) => setCompactPartMeasurementRef("minutes", node),
        seconds: (node) => setCompactPartMeasurementRef("seconds", node),
      }),
      [setCompactPartMeasurementRef],
    );
    const prefersReducedMotion = useReducedMotion() ?? false;
    const availableWidth = useAvailableWidth(rootRef);
    const preset = DURATION_PILL_MOTION_PRESETS[motionIntensity];
    const currentLabels = {
      ...DEFAULT_DURATION_PILL_LABELS,
      ...labels,
    };
    const currentUnitLabels = {
      ...DEFAULT_DURATION_PILL_UNIT_LABELS,
      ...unitLabels,
    };
    const sourceValue = isControlled ? value : uncontrolledValue;
    const currentValue = useMemo(
      () => constrainDurationValue(sourceValue, bounds),
      [bounds, sourceValue],
    );
    const currentKey = `${String(currentValue.hours)}:${String(currentValue.minutes)}:${String(currentValue.seconds)}:${String(bounds.minimum)}:${String(bounds.maximum)}`;
    const formattedValue = formatValue
      ? formatValue(currentValue)
      : formatDurationValue(currentValue, showSeconds);
    const visibleParts = useMemo(
      () => visibleDurationParts(currentValue, showSeconds),
      [currentValue, showSeconds],
    );
    const editorUnits: DurationUnit[] = showSeconds
      ? ["hours", "minutes", "seconds"]
      : ["hours", "minutes"];
    const hasCustomFormatter = formatValue !== undefined;
    const compactPreferredFieldWidths = preferredCompactFieldWidths(
      editorUnits,
      visibleParts,
      currentUnitLabels,
      compactMeasurements,
    );
    const preferredCompactWidth = compactBaseWidth(
      formattedValue,
      visibleParts.length,
      hasCustomFormatter,
      compactPreferredFieldWidths,
      compactMeasurements.formatted,
    );
    const displayGeometry = resolveDurationPillGeometry(
      availableWidth,
      false,
      visibleParts.length,
      preferredCompactWidth,
      draft.hours.length,
      showSeconds,
    );
    const editorGeometry = resolveDurationPillGeometry(
      availableWidth,
      true,
      visibleParts.length,
      preferredCompactWidth,
      draft.hours.length,
      showSeconds,
    );
    const geometry = editing ? editorGeometry : displayGeometry;
    const targetWidth = editing
      ? editorGeometry.editorWidth
      : displayGeometry.compactWidth;
    const geometryTransition = prefersReducedMotion ? INSTANT : preset.spring;
    const displayContentTransition = prefersReducedMotion
      ? INSTANT
      : editing
        ? { opacity: { duration: 0.08, ease: "easeOut" as const } }
        : {
            opacity: {
              delay: 0.14,
              duration: 0.14,
              ease: "easeOut" as const,
            },
          };
    const editorContentTransition = prefersReducedMotion
      ? INSTANT
      : editing
        ? {
            opacity: {
              delay: 0.06,
              duration: 0.12,
              ease: "easeOut" as const,
            },
          }
        : { opacity: { duration: 0.08, ease: "easeOut" as const } };
    const compactShellTransition = prefersReducedMotion
      ? INSTANT
      : editing
        ? { opacity: { duration: 0.08, ease: "easeOut" as const } }
        : {
            opacity: {
              delay: 0.18,
              duration: 0.12,
              ease: "easeOut" as const,
            },
          };
    const compactShadowTransition = prefersReducedMotion
      ? INSTANT
      : editing
        ? { opacity: { duration: 0.18, ease: "easeOut" as const } }
        : {
            opacity: {
              delay: 0.06,
              duration: 0.24,
              ease: "easeOut" as const,
            },
          };

    useIsomorphicLayoutEffect(() => {
      if (editing) return;

      const measuredNodes = hasCustomFormatter
        ? [formattedMeasurementNodeRef.current].filter(
            (node): node is HTMLSpanElement => node !== null,
          )
        : visibleParts
            .map((part) =>
              compactPartMeasurementNodesRef.current.get(part.unit),
            )
            .filter((node): node is HTMLSpanElement => node !== undefined);
      if (measuredNodes.length === 0) return;

      const measure = () => {
        const measurementScale = Math.max(displayGeometry.scale, 0.001);
        const nextParts: Record<DurationUnit, number> = {
          hours: 0,
          minutes: 0,
          seconds: 0,
        };

        if (!hasCustomFormatter) {
          for (const part of visibleParts) {
            const node = compactPartMeasurementNodesRef.current.get(part.unit);
            if (node) {
              nextParts[part.unit] =
                measureDurationValuePart(node) / measurementScale;
            }
          }
        }

        const nextFormatted = hasCustomFormatter
          ? (formattedMeasurementNodeRef.current?.scrollWidth ?? 0) /
            measurementScale
          : 0;

        setCompactMeasurements((previous) => {
          const unchanged =
            previous.formatted === nextFormatted &&
            previous.parts.hours === nextParts.hours &&
            previous.parts.minutes === nextParts.minutes &&
            previous.parts.seconds === nextParts.seconds;

          return unchanged
            ? previous
            : { formatted: nextFormatted, parts: nextParts };
        });
      };

      measure();
      const observer =
        typeof ResizeObserver === "function"
          ? new ResizeObserver(measure)
          : null;
      for (const node of measuredNodes) {
        observer?.observe(node);
        for (const child of node.children) observer?.observe(child);
      }

      const fontSet = (document as unknown as { fonts?: FontFaceSet }).fonts;
      let active = true;
      void fontSet?.ready.then(() => {
        if (active) measure();
      });

      return () => {
        active = false;
        observer?.disconnect();
      };
    }, [
      currentKey,
      currentUnitLabels.hours,
      currentUnitLabels.minutes,
      currentUnitLabels.seconds,
      displayGeometry.scale,
      editing,
      formattedValue,
      hasCustomFormatter,
      showSeconds,
      visibleParts,
    ]);

    const setRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const setActionButtonRef = useCallback((node: HTMLButtonElement | null) => {
      actionButtonRef.current = node;
      if (!node || !restoreFocusRef.current) return;

      restoreFocusRef.current = false;
      node.focus();
    }, []);

    const setHoursInputRef = useCallback((node: HTMLInputElement | null) => {
      hoursInputRef.current = node;
      if (!node || !editingRef.current || !openingFocusRef.current) return;

      node.focus();
      node.select();
      queueMicrotask(() => {
        openingFocusRef.current = false;
      });
    }, []);

    const closeEditor = useCallback(
      (restoreFocus: boolean) => {
        if (!editingRef.current) return;
        editingRef.current = false;
        restoreFocusRef.current = restoreFocus;
        setEditing(false);
        onEditChange?.(false);
      },
      [onEditChange],
    );

    const commitDraft = useCallback(
      (restoreFocus: boolean) => {
        if (!editingRef.current) return;
        const candidate = constrainDurationValue(
          durationValueFromDraft(draft, openingValueRef.current, showSeconds),
          bounds,
        );

        if (!durationValuesEqual(candidate, currentValue)) {
          if (!isControlled) setUncontrolledValue(candidate);
          onValueChange?.(candidate);
        }

        closeEditor(restoreFocus);
      },
      [
        bounds,
        closeEditor,
        currentValue,
        draft,
        isControlled,
        onValueChange,
        showSeconds,
      ],
    );

    const cancelDraft = useCallback(
      (restoreFocus: boolean) => {
        if (!editingRef.current) return;
        setDraft(durationDraftFromValue(currentValue));
        closeEditor(restoreFocus);
      },
      [closeEditor, currentValue],
    );

    const openEditor = useCallback(() => {
      if (disabled || readOnly || editingRef.current) return;

      editingRef.current = true;
      openingFocusRef.current = true;
      openingValueRef.current = { ...currentValue };
      authorityKeyRef.current = currentKey;
      setDraft(durationDraftFromValue(currentValue));
      setEditing(true);
      onEditChange?.(true);
    }, [currentKey, currentValue, disabled, onEditChange, readOnly]);

    useIsomorphicLayoutEffect(() => {
      if (editing) {
        const input = hoursInputRef.current;
        if (!input) return;

        input.focus();
        input.select();
        queueMicrotask(() => {
          openingFocusRef.current = false;
        });
        return;
      }

      if (!restoreFocusRef.current) return;
      const button = actionButtonRef.current;
      if (!button) return;

      restoreFocusRef.current = false;
      button.focus();
    }, [editing]);

    useEffect(() => {
      if (!editing || authorityKeyRef.current === currentKey) return;

      authorityKeyRef.current = currentKey;
      openingValueRef.current = { ...currentValue };
      setDraft(durationDraftFromValue(currentValue));
    }, [currentKey, currentValue, editing]);

    useEffect(() => {
      if (!editing || (!disabled && !readOnly)) return;
      cancelDraft(false);
    }, [cancelDraft, disabled, editing, readOnly]);

    useEffect(() => {
      if (!editing) return;

      const handlePointerDown = (event: globalThis.PointerEvent) => {
        const target = event.target;
        if (!(target instanceof Node) || rootRef.current?.contains(target)) {
          return;
        }
        commitDraft(false);
      };

      document.addEventListener("pointerdown", handlePointerDown, true);
      return () =>
        document.removeEventListener("pointerdown", handlePointerDown, true);
    }, [commitDraft, editing]);

    function handleDraftChange(mode: DurationUnit, nextDraft: string) {
      setDraft((current) => ({ ...current, [mode]: nextDraft }));
    }

    function handleUnitStep(mode: DurationUnit, direction: -1 | 1) {
      const draftValue = durationValueFromDraft(
        draft,
        openingValueRef.current,
        showSeconds,
      );
      let delta = direction * 3600;

      if (mode !== "hours") {
        const currentUnit = draftValue[mode];
        const maximum = largestSteppedUnit(normalizedStep);
        const nextUnit =
          direction > 0
            ? currentUnit >= maximum
              ? 0
              : Math.min(
                  maximum,
                  Math.floor(currentUnit / normalizedStep) * normalizedStep +
                    normalizedStep,
                )
            : currentUnit <= 0
              ? maximum
              : Math.max(
                  0,
                  Math.ceil(currentUnit / normalizedStep) * normalizedStep -
                    normalizedStep,
                );
        const unitDelta =
          direction > 0
            ? nextUnit === 0
              ? 60 - currentUnit
              : nextUnit - currentUnit
            : nextUnit === maximum && currentUnit === 0
              ? -(60 - maximum)
              : nextUnit - currentUnit;
        delta = unitDelta * (mode === "minutes" ? 60 : 1);
      }

      const total = durationValueToSeconds(draftValue);
      const maximum = bounds.maximum ?? Number.MAX_SAFE_INTEGER;
      const nextValue = durationValueFromSeconds(
        Math.min(maximum, Math.max(bounds.minimum, total + delta)),
      );
      setDraft(durationDraftFromValue(nextValue));
    }

    function handleRootBlur(event: FocusEvent<HTMLDivElement>) {
      onBlur?.(event);
      if (event.defaultPrevented || !editing || openingFocusRef.current) return;

      const nextTarget = event.relatedTarget;
      if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
        commitDraft(false);
      }
    }

    function handleRootKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || !editing) return;

      if (event.key === "Escape") {
        event.preventDefault();
        cancelDraft(true);
      } else if (event.key === "Enter") {
        event.preventDefault();
        commitDraft(true);
      }
    }

    const visiblePartByUnit = new Map(
      visibleParts.map((part) => [part.unit, part] as const),
    );
    const fieldLabels: Record<DurationUnit, string> = {
      hours: currentLabels.hours,
      minutes: currentLabels.minutes,
      seconds: currentLabels.seconds,
    };
    const fieldMaximums: Record<DurationUnit, number> = {
      hours: MAX_HOURS,
      minutes: 59,
      seconds: 59,
    };
    const compactSourceFieldWidths = hasCustomFormatter
      ? editorGeometry.fieldWidths
      : compactPreferredFieldWidths.map(
          (width) => width * displayGeometry.scale,
        );
    const compactFieldWidths = compactEditorFieldWidths(
      displayGeometry.compactWidth,
      compactSourceFieldWidths,
      displayGeometry.actionSize,
    );
    const compactActionSize =
      displayGeometry.compactWidth -
      compactFieldWidths.reduce((total, width) => total + width, 0);
    const compactSegmentWidths = [...compactFieldWidths, compactActionSize];
    const editorSegmentWidths = [
      ...editorGeometry.fieldWidths,
      editorGeometry.actionSize,
    ];
    const compactSegmentOffsets = segmentOffsets(compactSegmentWidths, 0);
    const editorSegmentOffsets = segmentOffsets(
      editorSegmentWidths,
      editorGeometry.gap,
    );
    const actionIndex = editorUnits.length;
    const actionState: DurationPillIconState = editing ? "confirm" : "edit";
    const iconSize = Math.max(18, BASE_ICON_SIZE * geometry.scale);

    return (
      // Focus and keyboard events from the current interactive layout are
      // intentionally coordinated by the complete widget.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <div
        {...rootProps}
        aria-label={
          ariaLabel ?? (ariaLabelledBy ? undefined : currentLabels.duration)
        }
        aria-labelledby={ariaLabelledBy}
        className={joinClassNames(
          "relative isolate inline-flex max-w-full align-middle",
          disabled && "opacity-50",
          className,
        )}
        data-disabled={disabled ? "true" : "false"}
        data-motion-intensity={motionIntensity}
        data-readonly={readOnly ? "true" : "false"}
        data-slot="duration-pill"
        data-state={editing ? "edit" : "display"}
        onBlur={handleRootBlur}
        onKeyDown={handleRootKeyDown}
        ref={setRootRef}
        role="group"
      >
        <motion.div
          animate={{ height: geometry.height, width: targetWidth }}
          className="relative grid max-w-[calc(100vw-2rem)] items-center overflow-visible text-[var(--suluu-duration-pill-foreground)]"
          data-slot="duration-pill-track"
          initial={false}
          transition={{
            height: geometryTransition,
            width: geometryTransition,
          }}
        >
          <motion.div
            animate={{ opacity: editing ? 0 : 1 }}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 z-0 bg-[var(--suluu-duration-pill-background)]"
            data-slot="duration-pill-compact-shell"
            initial={false}
            style={{
              borderRadius: displayGeometry.radius,
              height: displayGeometry.height,
              width: displayGeometry.compactWidth,
            }}
            transition={compactShellTransition}
          />

          <motion.div
            animate={{ opacity: editing ? 0 : 1 }}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 z-0 shadow-[var(--suluu-duration-pill-shadow)]"
            data-slot="duration-pill-compact-shadow"
            data-state={editing ? "separated" : "joined"}
            initial={false}
            style={{
              borderRadius: displayGeometry.radius,
              height: displayGeometry.height,
              width: displayGeometry.compactWidth,
            }}
            transition={compactShadowTransition}
          />

          <div
            className="pointer-events-none absolute inset-0 z-10"
            data-slot="duration-pill-editor"
            data-state={editing ? "separated" : "joined"}
            style={{ gap: editorGeometry.gap }}
          >
            {editorUnits.map((mode, index) => {
              const joinedCorners = joinedSegmentCorners(
                index,
                compactSegmentWidths,
                displayGeometry.radius,
              );
              const separatedCorners = segmentCorners(
                0,
                1,
                editorGeometry.radius,
              );
              const compactWidth = compactSegmentWidths[index] ?? 0;
              const fieldWidth = editorSegmentWidths[index] ?? 0;
              const compactLeft = compactSegmentOffsets[index] ?? 0;
              const editorLeft = editorSegmentOffsets[index] ?? 0;
              const compactPart = visiblePartByUnit.get(mode);

              return (
                <motion.div
                  animate={
                    editing
                      ? {
                          ...separatedCorners,
                          height: editorGeometry.height,
                          left: editorLeft,
                          width: fieldWidth,
                        }
                      : {
                          ...joinedCorners,
                          height: displayGeometry.height,
                          left: compactLeft,
                          width: compactWidth,
                        }
                  }
                  className={joinClassNames(
                    "absolute top-0 overflow-hidden bg-[var(--suluu-duration-pill-background)] transition-[background-color,box-shadow] motion-reduce:transition-none",
                    editing
                      ? "pointer-events-auto bg-[var(--suluu-duration-pill-field)] shadow-[var(--suluu-duration-pill-shadow)] duration-200 ease-out focus-within:bg-[var(--suluu-duration-pill-field-active)]"
                      : "pointer-events-none duration-300 ease-in-out",
                  )}
                  data-duration-pill-surface={mode}
                  data-slot="duration-pill-field"
                  data-state={editing ? "separated" : "joined"}
                  data-unit={mode}
                  initial={false}
                  key={mode}
                  transition={geometryTransition}
                >
                  <AnimatePresence initial={false}>
                    {editing ? (
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="absolute inset-0"
                        exit={{
                          opacity: 0,
                          transition: prefersReducedMotion
                            ? INSTANT
                            : { duration: 0.08, ease: "easeOut" },
                        }}
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        key={`${mode}-editor-content`}
                        transition={editorContentTransition}
                      >
                        <DurationField
                          disabled={disabled}
                          draft={draft[mode]}
                          fieldContentGap={editorGeometry.fieldContentGap}
                          label={fieldLabels[mode]}
                          maximum={fieldMaximums[mode]}
                          mode={mode}
                          numberSize={editorGeometry.numberSize}
                          onDraftChange={handleDraftChange}
                          onStep={handleUnitStep}
                          tilePadding={editorGeometry.tilePadding}
                          unitLabel={currentUnitLabels[mode]}
                          unitSize={editorGeometry.unitSize}
                          {...(mode === "hours"
                            ? { inputRef: setHoursInputRef }
                            : {})}
                        />
                      </motion.div>
                    ) : !readOnly && !formatValue && compactPart ? (
                      <motion.div
                        animate={{ opacity: 1 }}
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
                        data-slot="duration-pill-compact-part"
                        data-unit={mode}
                        exit={{
                          opacity: 0,
                          transition: prefersReducedMotion
                            ? INSTANT
                            : { duration: 0.08, ease: "easeOut" },
                        }}
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        key={`${mode}-display-content`}
                        transition={displayContentTransition}
                      >
                        <DurationValuePart
                          measurementRef={compactPartMeasurementRefs[mode]}
                          numberSize={displayGeometry.numberSize}
                          part={compactPart}
                          unitLabel={currentUnitLabels[mode]}
                          unitSize={displayGeometry.unitSize}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {!readOnly ? (
              <motion.button
                animate={
                  editing
                    ? {
                        ...segmentCorners(0, 1, editorGeometry.radius),
                        height: editorGeometry.actionSize,
                        left:
                          editorSegmentOffsets[actionIndex] ??
                          editorGeometry.editorWidth -
                            editorGeometry.actionSize,
                        width: editorGeometry.actionSize,
                      }
                    : {
                        ...joinedSegmentCorners(
                          actionIndex,
                          compactSegmentWidths,
                          displayGeometry.radius,
                        ),
                        height: displayGeometry.height,
                        left:
                          compactSegmentOffsets[actionIndex] ??
                          displayGeometry.compactWidth - compactActionSize,
                        width: compactActionSize,
                      }
                }
                aria-label={
                  editing
                    ? currentLabels.confirm
                    : `${currentLabels.edit}: ${formattedValue}`
                }
                className={joinClassNames(
                  "pointer-events-auto absolute top-0 inline-flex cursor-pointer items-center justify-center overflow-hidden bg-[var(--suluu-duration-pill-background)] transition-[background-color,box-shadow,color,filter] outline-none focus-visible:ring-2 focus-visible:ring-[var(--suluu-duration-pill-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-duration-pill-offset)] disabled:cursor-not-allowed motion-reduce:transition-none",
                  editing
                    ? "bg-[var(--suluu-duration-pill-accent)] text-[var(--suluu-duration-pill-accent-foreground)] shadow-[var(--suluu-duration-pill-action-shadow)] duration-200 ease-out hover:brightness-[0.985]"
                    : "text-[var(--suluu-duration-pill-muted)] duration-300 ease-in-out hover:text-[var(--suluu-duration-pill-foreground)]",
                )}
                data-duration-pill-surface="action"
                data-slot={
                  editing ? "duration-pill-confirm" : "duration-pill-edit"
                }
                data-state={editing ? "separated" : "joined"}
                disabled={disabled}
                initial={false}
                onClick={() => {
                  if (editing) {
                    commitDraft(true);
                    return;
                  }

                  openEditor();
                }}
                ref={setActionButtonRef}
                transition={geometryTransition}
                type="button"
                {...(disabled || prefersReducedMotion
                  ? {}
                  : {
                      ...(!editing ? { whileHover: "hover" as const } : {}),
                      whileTap: { scale: preset.tap },
                    })}
              >
                <AnimatePresence initial={false}>
                  <motion.span
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inline-flex items-center justify-center"
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      transition: prefersReducedMotion
                        ? INSTANT
                        : { duration: 0.08, ease: "easeOut" },
                    }}
                    initial={
                      prefersReducedMotion
                        ? false
                        : {
                            opacity: 0,
                            scale: editing ? 0.84 : 0.88,
                          }
                    }
                    key={actionState}
                    transition={geometryTransition}
                  >
                    {renderIcon ? (
                      renderIcon(actionState)
                    ) : (
                      <DefaultActionIcon
                        reducedMotion={prefersReducedMotion}
                        size={iconSize}
                        state={actionState}
                        transition={preset.spring}
                      />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            ) : null}
          </div>

          <motion.div
            animate={{ opacity: editing ? 0 : 1 }}
            aria-hidden={editing || undefined}
            aria-label={readOnly ? formattedValue : undefined}
            aria-readonly={readOnly ? "true" : undefined}
            className={joinClassNames(
              "pointer-events-none relative z-20 col-start-1 row-start-1 flex items-center overflow-hidden",
              readOnly ? "justify-start" : "justify-center",
              readOnly &&
                "outline-none focus-visible:ring-2 focus-visible:ring-[var(--suluu-duration-pill-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-duration-pill-offset)]",
            )}
            data-slot="duration-pill-display"
            data-state={editing ? "hidden" : "visible"}
            initial={false}
            role={readOnly ? "textbox" : undefined}
            style={{
              borderRadius: displayGeometry.radius,
              height: displayGeometry.height,
              paddingInline: displayGeometry.tilePadding,
              pointerEvents: readOnly && !editing ? "auto" : "none",
              width: readOnly
                ? displayGeometry.compactWidth
                : displayGeometry.compactWidth - compactActionSize,
            }}
            tabIndex={readOnly && !editing ? 0 : undefined}
            transition={displayContentTransition}
          >
            {readOnly || formatValue ? (
              <span
                aria-hidden={readOnly ? undefined : "true"}
                className={joinClassNames(
                  "min-w-0 overflow-hidden",
                  readOnly ? "flex-1" : "w-full text-center",
                )}
              >
                {formatValue ? (
                  <span
                    className="block truncate leading-none font-semibold tracking-[-0.035em] whitespace-nowrap tabular-nums"
                    ref={formattedMeasurementNodeRef}
                    style={{ fontSize: displayGeometry.numberSize }}
                  >
                    {formattedValue}
                  </span>
                ) : (
                  <DefaultDisplay
                    measurementRefs={compactPartMeasurementRefs}
                    numberSize={displayGeometry.numberSize}
                    showSeconds={showSeconds}
                    unitLabels={currentUnitLabels}
                    unitSize={displayGeometry.unitSize}
                    value={currentValue}
                  />
                )}
              </span>
            ) : null}
          </motion.div>
        </motion.div>
      </div>
    );
  },
);

DurationPill.displayName = "DurationPill";
