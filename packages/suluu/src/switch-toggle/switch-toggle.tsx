"use client";

import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  type MotionStyle,
  type PanInfo,
} from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type PointerEvent,
} from "react";

/** Conflicting handlers that Motion redefines on its own components. */
type ConflictingButtonProps =
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
  | "onTransitionEnd";

export interface SwitchToggleProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  | ConflictingButtonProps
  | "aria-checked"
  | "aria-pressed"
  | "children"
  | "role"
  | "style"
  | "type"
> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state when uncontrolled. */
  defaultChecked?: boolean;
  /** Called whenever an interaction requests a checked-state change. */
  onCheckedChange?: (checked: boolean) => void;
  /** Inline styles merged onto the switch surface. */
  style?: MotionStyle;
}

const THUMB_TRAVEL = 22;
const DRAG_MIDPOINT = THUMB_TRAVEL / 2;
const FLICK_VELOCITY = 500;
const MINUS_PATH = "M7 12 L12 12 L17 12";
const CHECK_PATH = "M7 12.5 L10.5 16 L17 8.5";
const PILL_FOLLOW_DISTANCE = 1.75;
const PILL_STRETCH = 0.06;
const PILL_COMPRESSION = 0.016;
const SETTLE_SPRING = {
  type: "spring" as const,
  stiffness: 280,
  damping: 24,
  mass: 0.85,
};
const PILL_SPRING = {
  stiffness: 210,
  damping: 20,
  mass: 0.9,
};

/** Resolves a drag from its resting position, with a deliberate flick override. */
export function resolveSwitchDragTarget(
  position: number,
  velocity: number,
): boolean {
  if (Math.abs(velocity) >= FLICK_VELOCITY) return velocity > 0;
  return position >= DRAG_MIDPOINT;
}

function joinClassNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export const SwitchToggle = forwardRef<HTMLButtonElement, SwitchToggleProps>(
  function SwitchToggle(
    {
      checked,
      className,
      defaultChecked = false,
      disabled = false,
      onCheckedChange,
      onClick,
      onPointerDown,
      style,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [uncontrolledChecked, setUncontrolledChecked] =
      useState(defaultChecked);
    const [dragging, setDragging] = useState(false);
    const [dragPreview, setDragPreview] = useState<boolean | null>(null);
    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : uncontrolledChecked;
    const visualChecked = dragPreview ?? currentChecked;
    const prefersReducedMotion = useReducedMotion() ?? false;
    const dragControls = useDragControls();
    const thumbX = useMotionValue(currentChecked ? THUMB_TRAVEL : 0);
    const pillTargetX = useMotionValue(0);
    const pillTargetScaleX = useMotionValue(1);
    const pillTargetScaleY = useMotionValue(1);
    const pillX = useSpring(pillTargetX, PILL_SPRING);
    const pillScaleX = useSpring(pillTargetScaleX, PILL_SPRING);
    const pillScaleY = useSpring(pillTargetScaleY, PILL_SPRING);
    const draggingRef = useRef(false);
    const dragOriginRef = useRef(thumbX.get());
    const suppressClickRef = useRef(false);
    const suppressionTimerRef = useRef<number | null>(null);

    const requestChecked = useCallback(
      (nextChecked: boolean) => {
        if (nextChecked === currentChecked) return;

        if (!isControlled) setUncontrolledChecked(nextChecked);
        onCheckedChange?.(nextChecked);
      },
      [currentChecked, isControlled, onCheckedChange],
    );

    const resetPill = useCallback(
      (immediate = false) => {
        pillTargetX.set(0);
        pillTargetScaleX.set(1);
        pillTargetScaleY.set(1);

        if (immediate) {
          pillX.jump(0);
          pillScaleX.jump(1);
          pillScaleY.jump(1);
        }
      },
      [
        pillScaleX,
        pillScaleY,
        pillTargetScaleX,
        pillTargetScaleY,
        pillTargetX,
        pillX,
      ],
    );

    useEffect(() => {
      if (dragging) return;

      const target = currentChecked ? THUMB_TRAVEL : 0;
      if (prefersReducedMotion) {
        thumbX.set(target);
        return;
      }

      const controls = animate(thumbX, target, SETTLE_SPRING);
      return () => controls.stop();
    }, [currentChecked, dragging, prefersReducedMotion, thumbX]);

    useEffect(() => {
      if (prefersReducedMotion) resetPill(true);
    }, [prefersReducedMotion, resetPill]);

    useEffect(
      () => () => {
        if (suppressionTimerRef.current !== null) {
          window.clearTimeout(suppressionTimerRef.current);
        }
      },
      [],
    );

    function updatePill(position: number) {
      if (prefersReducedMotion) return;

      const progress = Math.max(
        -1,
        Math.min(1, (position - dragOriginRef.current) / THUMB_TRAVEL),
      );
      const intensity = Math.abs(progress);

      pillTargetX.set(progress * PILL_FOLLOW_DISTANCE);
      pillTargetScaleX.set(1 + intensity * PILL_STRETCH);
      pillTargetScaleY.set(1 - intensity * PILL_COMPRESSION);
    }

    useMotionValueEvent(thumbX, "change", (position) => {
      if (!draggingRef.current) return;

      const nextPreview = position >= DRAG_MIDPOINT;
      setDragPreview((previous) =>
        previous === nextPreview ? previous : nextPreview,
      );

      updatePill(position);
    });

    function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
      onPointerDown?.(event);
      if (
        event.defaultPrevented ||
        disabled ||
        event.button !== 0 ||
        !event.isPrimary
      ) {
        return;
      }

      dragOriginRef.current = thumbX.get();
      dragControls.start(event, { distanceThreshold: 3 });
    }

    function handleDragStart() {
      resetPill(prefersReducedMotion);
      draggingRef.current = true;
      updatePill(thumbX.get());
      setDragging(true);
      setDragPreview(thumbX.get() >= DRAG_MIDPOINT);
    }

    function handleDragEnd(
      _event: MouseEvent | TouchEvent | globalThis.PointerEvent,
      info: PanInfo,
    ) {
      const nextChecked = resolveSwitchDragTarget(
        thumbX.get(),
        info.velocity.x,
      );

      draggingRef.current = false;
      resetPill(prefersReducedMotion);
      setDragging(false);
      setDragPreview(null);
      suppressClickRef.current = true;
      requestChecked(nextChecked);

      if (suppressionTimerRef.current !== null) {
        window.clearTimeout(suppressionTimerRef.current);
      }
      suppressionTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        suppressionTimerRef.current = null;
      }, 0);
    }

    return (
      <motion.button
        {...buttonProps}
        aria-checked={currentChecked}
        className={joinClassNames(
          "relative inline-flex h-[30px] w-[52px] shrink-0 cursor-pointer touch-none items-center rounded-full transition-[background-color,box-shadow,filter] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--suluu-switch-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-switch-offset)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none",
          visualChecked
            ? "bg-[var(--suluu-switch-background-checked)] shadow-[var(--suluu-switch-shadow-checked)] hover:brightness-[0.98]"
            : "bg-[var(--suluu-switch-background)] shadow-[var(--suluu-switch-shadow)] hover:brightness-[0.97]",
          className,
        )}
        data-dragging={dragging ? "true" : "false"}
        data-slot="switch-toggle"
        data-state={currentChecked ? "checked" : "unchecked"}
        disabled={disabled}
        onClick={(event) => {
          if (suppressClickRef.current) {
            event.preventDefault();
            return;
          }

          onClick?.(event);
          if (!event.defaultPrevented) requestChecked(!currentChecked);
        }}
        onPointerDown={handlePointerDown}
        ref={forwardedRef}
        role="switch"
        style={{
          ...style,
          x: pillX,
          scaleX: pillScaleX,
          scaleY: pillScaleY,
        }}
        type="button"
        {...(prefersReducedMotion ? {} : { whileTap: { scale: 0.97 } })}
        transition={SETTLE_SPRING}
      >
        <motion.span
          className="absolute top-[3px] left-[3px] inline-flex size-6 items-center justify-center rounded-full bg-[var(--suluu-switch-thumb)] shadow-[var(--suluu-switch-thumb-shadow)]"
          data-slot="switch-toggle-thumb"
          drag="x"
          dragConstraints={{ left: 0, right: THUMB_TRAVEL }}
          dragControls={dragControls}
          dragElastic={0}
          dragListener={false}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          style={{ x: thumbX }}
          {...(prefersReducedMotion
            ? {}
            : { whileDrag: { scaleX: 1.1, scaleY: 0.92 } })}
          transition={SETTLE_SPRING}
        >
          <motion.svg
            aria-hidden="true"
            className={joinClassNames(
              "size-[15px] fill-none transition-colors duration-200 motion-reduce:transition-none",
              visualChecked
                ? "text-[var(--suluu-switch-icon-checked)]"
                : "text-[var(--suluu-switch-icon)]",
            )}
            data-slot="switch-toggle-icon"
            viewBox="0 0 24 24"
          >
            <motion.path
              animate={{ d: visualChecked ? CHECK_PATH : MINUS_PATH }}
              d={visualChecked ? CHECK_PATH : MINUS_PATH}
              initial={false}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
              }
            />
          </motion.svg>
        </motion.span>
      </motion.button>
    );
  },
);

SwitchToggle.displayName = "SwitchToggle";
