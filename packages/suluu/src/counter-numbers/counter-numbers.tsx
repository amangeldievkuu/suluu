"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
} from "react";

export type CounterNumbersIntensity = "subtle" | "default" | "expressive";

export interface CounterNumbersProps extends Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
> {
  /** Numeric value to format and display. */
  value: number;
  /** Locale or locale preference list passed to Intl.NumberFormat. */
  locales?: Intl.LocalesArgument;
  /** Formatting options passed to Intl.NumberFormat. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Controls the travel, stagger, and spring character of changed digits. */
  motionIntensity?: CounterNumbersIntensity;
}

type CounterDirection = -1 | 0 | 1;
type CounterTokenKind = "digit" | "symbol";

interface CounterToken {
  id: string;
  kind: CounterTokenKind;
  staggerIndex: number;
  value: string;
}

interface CounterMotionPreset {
  initialScaleY: number;
  spring: {
    damping: number;
    mass: number;
    stiffness: number;
    type: "spring";
  };
  stagger: number;
  travel: number;
}

interface DigitMotion {
  delay: number;
  direction: CounterDirection;
  preset: CounterMotionPreset;
}

interface ObservedValue {
  direction: CounterDirection;
  formattedValue: string;
  value: number;
}

const MOTION_PRESETS: Record<CounterNumbersIntensity, CounterMotionPreset> = {
  subtle: {
    initialScaleY: 0.98,
    spring: { type: "spring", stiffness: 500, damping: 42, mass: 0.65 },
    stagger: 0,
    travel: 0.45,
  },
  default: {
    initialScaleY: 0.94,
    spring: { type: "spring", stiffness: 360, damping: 28, mass: 0.75 },
    stagger: 0.015,
    travel: 0.7,
  },
  expressive: {
    initialScaleY: 0.88,
    spring: { type: "spring", stiffness: 260, damping: 18, mass: 0.9 },
    stagger: 0.025,
    travel: 0.95,
  },
};

const MAX_STAGGER = 0.075;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SYMBOL_DURATION = 0.14;

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

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = matchMediaList(query);
      if (!list) return () => undefined;

      list.addEventListener("change", onStoreChange);
      return () => {
        list.removeEventListener("change", onStoreChange);
      };
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => matchMediaList(query)?.matches ?? false,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function countPartCharacters(
  parts: Intl.NumberFormatPart[],
  type: Intl.NumberFormatPartTypes,
): number {
  return parts.reduce(
    (count, part) =>
      part.type === type ? count + Array.from(part.value).length : count,
    0,
  );
}

/**
 * Gives numeric places semantic identities, so grouping changes and leading
 * digits do not make every existing glyph look new.
 */
function createCounterTokens(parts: Intl.NumberFormatPart[]): CounterToken[] {
  const integerLength = countPartCharacters(parts, "integer");
  const fractionLength = countPartCharacters(parts, "fraction");
  const exponentLength = countPartCharacters(parts, "exponentInteger");
  const tokens: CounterToken[] = [];
  const occurrences = new Map<string, number>();
  let integerIndex = 0;
  let fractionIndex = 0;
  let exponentIndex = 0;

  function nextOccurrence(type: string): number {
    const occurrence = occurrences.get(type) ?? 0;
    occurrences.set(type, occurrence + 1);
    return occurrence;
  }

  for (const part of parts) {
    if (part.type === "integer") {
      for (const value of Array.from(part.value)) {
        const place = integerLength - integerIndex - 1;
        tokens.push({
          id: `integer:${String(place)}`,
          kind: "digit",
          staggerIndex: place,
          value,
        });
        integerIndex += 1;
      }
      continue;
    }

    if (part.type === "fraction") {
      for (const value of Array.from(part.value)) {
        tokens.push({
          id: `fraction:${String(fractionIndex)}`,
          kind: "digit",
          staggerIndex: fractionLength - fractionIndex - 1,
          value,
        });
        fractionIndex += 1;
      }
      continue;
    }

    if (part.type === "exponentInteger") {
      for (const value of Array.from(part.value)) {
        const place = exponentLength - exponentIndex - 1;
        tokens.push({
          id: `exponent:${String(place)}`,
          kind: "digit",
          staggerIndex: place,
          value,
        });
        exponentIndex += 1;
      }
      continue;
    }

    const id =
      part.type === "group"
        ? `group:${String(integerLength - integerIndex)}`
        : `${part.type}:${String(nextOccurrence(part.type))}`;
    tokens.push({ id, kind: "symbol", staggerIndex: 0, value: part.value });
  }

  return tokens;
}

function directionName(direction: CounterDirection): string {
  if (direction > 0) return "increase";
  if (direction < 0) return "decrease";
  return "none";
}

function resolveDirection(previous: number, next: number): CounterDirection {
  if (!Number.isFinite(previous) || !Number.isFinite(next)) return 0;
  if (next > previous) return 1;
  if (next < previous) return -1;
  return 0;
}

const digitVariants = {
  animate: ({ delay, preset }: DigitMotion) => ({
    opacity: 1,
    scaleY: 1,
    transition: {
      opacity: { delay, duration: 0.12 },
      scaleY: { ...preset.spring, delay },
      y: { ...preset.spring, delay },
    },
    y: "0em",
  }),
  exit: ({ direction, preset }: DigitMotion) => ({
    opacity: 0,
    scaleY: preset.initialScaleY,
    transition: {
      opacity: { duration: 0.1 },
      scaleY: preset.spring,
      y: preset.spring,
    },
    y: `${String(direction * -preset.travel)}em`,
  }),
  initial: ({ direction, preset }: DigitMotion) => ({
    opacity: 0,
    scaleY: preset.initialScaleY,
    y: `${String(direction * preset.travel)}em`,
  }),
};

interface AnimatedTokenProps {
  direction: CounterDirection;
  preset: CounterMotionPreset;
  token: CounterToken;
}

function AnimatedToken({ direction, preset, token }: AnimatedTokenProps) {
  if (token.kind === "symbol") {
    return (
      <span
        className="inline-grid align-baseline"
        data-slot="counter-symbol"
        data-token={token.id}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            className="[grid-area:1/1]"
            exit={{ opacity: 0, scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.9 }}
            key={token.value}
            transition={{ duration: SYMBOL_DURATION, ease: "easeOut" }}
          >
            {token.value}
          </motion.span>
        </AnimatePresence>
      </span>
    );
  }

  const delay = Math.min(MAX_STAGGER, token.staggerIndex * preset.stagger);
  const custom = { delay, direction, preset } satisfies DigitMotion;

  return (
    <span
      className="inline-grid overflow-hidden align-baseline"
      data-slot="counter-digit"
      data-token={token.id}
    >
      <AnimatePresence custom={custom} initial={false} mode="popLayout">
        <motion.span
          animate="animate"
          className="origin-center [grid-area:1/1]"
          custom={custom}
          data-direction={directionName(direction)}
          exit="exit"
          initial="initial"
          key={token.value}
          variants={digitVariants}
        >
          {token.value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface VisualValueProps {
  direction: CounterDirection;
  preset: CounterMotionPreset;
  reducedMotion: boolean;
  tokens: CounterToken[];
}

function VisualValue({
  direction,
  preset,
  reducedMotion,
  tokens,
}: VisualValueProps) {
  if (reducedMotion) {
    return tokens.map((token) => (
      <span
        data-slot={token.kind === "digit" ? "counter-digit" : "counter-symbol"}
        data-token={token.id}
        key={token.id}
      >
        {token.value}
      </span>
    ));
  }

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {tokens.map((token) => (
        <motion.span
          animate={{ opacity: 1, width: "auto" }}
          className="inline-block align-baseline"
          exit={{ opacity: 0, width: 0 }}
          initial={{ opacity: 0, width: 0 }}
          key={token.id}
          transition={{ duration: SYMBOL_DURATION, ease: "easeOut" }}
        >
          <AnimatedToken direction={direction} preset={preset} token={token} />
        </motion.span>
      ))}
    </AnimatePresence>
  );
}

export const CounterNumbers = forwardRef<HTMLSpanElement, CounterNumbersProps>(
  function CounterNumbers(
    {
      "aria-atomic": ariaAtomic,
      "aria-live": ariaLive,
      className,
      formatOptions,
      locales = "en-US",
      motionIntensity = "default",
      value,
      ...spanProps
    },
    forwardedRef,
  ) {
    const formatter = useMemo(
      () => new Intl.NumberFormat(locales, formatOptions),
      [formatOptions, locales],
    );
    const parts = formatter.formatToParts(value);
    const formattedValue = parts.map((part) => part.value).join("");
    const tokens = createCounterTokens(parts);
    const [observedValue, setObservedValue] = useState<ObservedValue>({
      direction: 0,
      formattedValue,
      value,
    });
    const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
    const valueChanged =
      !Object.is(observedValue.value, value) ||
      observedValue.formattedValue !== formattedValue;
    const nextDirection =
      observedValue.formattedValue !== formattedValue
        ? resolveDirection(observedValue.value, value)
        : 0;
    const direction = valueChanged ? nextDirection : observedValue.direction;
    const preset = MOTION_PRESETS[motionIntensity];
    const announcesChanges = ariaLive === "polite" || ariaLive === "assertive";

    if (valueChanged) {
      setObservedValue({
        direction: nextDirection,
        formattedValue,
        value,
      });
    }

    return (
      <span
        {...spanProps}
        aria-atomic={ariaAtomic ?? (announcesChanges ? true : undefined)}
        aria-live={ariaLive}
        className={joinClassNames(
          "relative inline-block whitespace-nowrap tabular-nums",
          className,
        )}
        data-slot="counter-numbers"
        ref={forwardedRef}
      >
        <span className="sr-only" data-slot="counter-value">
          {formattedValue}
        </span>
        <span
          aria-hidden="true"
          className="inline-block"
          data-direction={directionName(direction)}
          data-slot="counter-visual"
        >
          <VisualValue
            direction={direction}
            preset={preset}
            reducedMotion={prefersReducedMotion}
            tokens={tokens}
          />
        </span>
      </span>
    );
  },
);

CounterNumbers.displayName = "CounterNumbers";
