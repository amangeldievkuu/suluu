"use client";

import { LayoutGroup, motion, useReducedMotion, useSpring } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from "react";

export interface SegmentedControlOption {
  /** Disables this option without disabling the rest of the group. */
  disabled?: boolean;
  /** Visible label for the option. */
  label: string;
  /** Stable value emitted by the control. */
  value: string;
}

type NativeGroupProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "defaultValue" | "role"
>;

export interface SegmentedControlProps extends NativeGroupProps {
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Called whenever an interaction requests a new selected value. */
  onValueChange?: (value: string) => void;
  /** Options rendered as the mutually exclusive choices. */
  options: readonly SegmentedControlOption[];
  /** Disables every option in the group. */
  disabled?: boolean;
}

const PILL_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
  mass: 0.8,
};
const PILL_SQUASH_X = 1.1;
const PILL_SQUASH_Y = 0.92;
const PILL_SQUASH_MS = 180;

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

function findEnabledOption(
  options: readonly SegmentedControlOption[],
  startIndex: number,
  direction: 1 | -1,
): SegmentedControlOption | undefined {
  const count = options.length;
  if (count === 0) return undefined;

  for (let step = 1; step <= count; step += 1) {
    const index = (((startIndex + direction * step) % count) + count) % count;
    const option = options[index];
    if (option && !option.disabled) return option;
  }

  return undefined;
}

export const SegmentedControl = forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(function SegmentedControl(
  {
    className,
    defaultValue,
    disabled = false,
    onKeyDown,
    onValueChange,
    options,
    style,
    value,
    ...groupProps
  },
  forwardedRef,
) {
  const layoutId = useId();
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? options[0]?.value ?? "",
  );
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const prefersReducedMotion = useReducedMotion() ?? false;
  const previousValueRef = useRef(currentValue);
  const pillScaleX = useSpring(1, PILL_SPRING);
  const pillScaleY = useSpring(1, PILL_SPRING);

  useEffect(() => {
    if (previousValueRef.current === currentValue) return;
    previousValueRef.current = currentValue;

    if (prefersReducedMotion) {
      pillScaleX.jump(1);
      pillScaleY.jump(1);
      return;
    }

    pillScaleX.set(PILL_SQUASH_X);
    pillScaleY.set(PILL_SQUASH_Y);

    const timeout = window.setTimeout(() => {
      pillScaleX.set(1);
      pillScaleY.set(1);
    }, PILL_SQUASH_MS);

    return () => window.clearTimeout(timeout);
  }, [currentValue, pillScaleX, pillScaleY, prefersReducedMotion]);

  const requestValue = useCallback(
    (nextValue: string) => {
      if (disabled || nextValue === currentValue) return;

      const option = options.find((entry) => entry.value === nextValue);
      if (!option || option.disabled) return;

      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [currentValue, disabled, isControlled, onValueChange, options],
  );

  function focusOption(nextValue: string) {
    itemRefs.current.get(nextValue)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;

    const currentIndex = options.findIndex(
      (option) => option.value === currentValue,
    );
    let next: SegmentedControlOption | undefined;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = findEnabledOption(
          options,
          currentIndex === -1 ? -1 : currentIndex,
          1,
        );
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = findEnabledOption(
          options,
          currentIndex === -1 ? 0 : currentIndex,
          -1,
        );
        break;
      case "Home":
        next = options.find((option) => !option.disabled);
        break;
      case "End":
        for (let index = options.length - 1; index >= 0; index -= 1) {
          const option = options[index];
          if (option && !option.disabled) {
            next = option;
            break;
          }
        }
        break;
      default:
        return;
    }

    if (!next) return;

    event.preventDefault();
    requestValue(next.value);
    focusOption(next.value);
  }

  const tabbableValue = (() => {
    if (disabled) return undefined;
    const selected = options.find((option) => option.value === currentValue);
    if (selected && !selected.disabled) return selected.value;
    return options.find((option) => !option.disabled)?.value;
  })();

  return (
    <LayoutGroup id={layoutId}>
      <div
        {...groupProps}
        aria-disabled={disabled || undefined}
        className={joinClassNames(
          "relative inline-flex items-center rounded-full bg-[var(--suluu-segment-background)] p-1 shadow-[var(--suluu-segment-shadow)]",
          disabled ? "pointer-events-none opacity-45" : undefined,
          className,
        )}
        data-disabled={disabled ? "true" : "false"}
        data-slot="segmented-control"
        data-state={currentValue}
        onKeyDown={handleKeyDown}
        ref={forwardedRef}
        role="radiogroup"
        style={style}
        tabIndex={-1}
      >
        {options.map((option) => {
          const isSelected = option.value === currentValue;
          const isDisabled = disabled || Boolean(option.disabled);

          return (
            <button
              aria-checked={isSelected}
              className={joinClassNames(
                "relative isolate inline-flex cursor-pointer items-center justify-center rounded-full px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--suluu-segment-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-segment-offset)] disabled:cursor-not-allowed motion-reduce:transition-none",
                isSelected
                  ? "text-[var(--suluu-segment-foreground)]"
                  : "text-[var(--suluu-segment-muted)] hover:text-[var(--suluu-segment-foreground)]",
              )}
              data-slot="segmented-control-item"
              data-state={isSelected ? "checked" : "unchecked"}
              disabled={isDisabled}
              key={option.value}
              onClick={() => requestValue(option.value)}
              ref={(node) => {
                if (node) itemRefs.current.set(option.value, node);
                else itemRefs.current.delete(option.value);
              }}
              role="radio"
              tabIndex={option.value === tabbableValue ? 0 : -1}
              type="button"
            >
              {isSelected ? (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full bg-[var(--suluu-segment-pill)] shadow-[var(--suluu-segment-pill-shadow)]"
                  data-slot="segmented-control-pill"
                  initial={false}
                  layoutId={`${layoutId}-pill`}
                  style={{ scaleX: pillScaleX, scaleY: pillScaleY }}
                  transition={
                    prefersReducedMotion ? { duration: 0 } : PILL_SPRING
                  }
                />
              ) : null}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
});

SegmentedControl.displayName = "SegmentedControl";
