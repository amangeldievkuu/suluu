"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  type MotionStyle,
} from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
} from "react";

export type MagnetIntensity = "subtle" | "default" | "expressive";

/** Conflicting handlers that motion redefines on its own components. */
type ConflictingButtonProps =
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
  | "onTransitionEnd";

export interface MagnetPullProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  ConflictingButtonProps | "style"
> {
  /** Inline styles merged with the pull transform. */
  style?: MotionStyle;
  /** Distance in pixels beyond the button bounds where the pull engages. */
  radius?: number;
  /** Fraction of the cursor offset the surface travels. */
  strength?: number;
  /** Total fraction of the cursor offset the content travels. */
  contentStrength?: number;
  /** Controls the spring character of the pull and the release. */
  motionIntensity?: MagnetIntensity;
  /** Called when the pointer enters or leaves the magnetic field. */
  onEngagedChange?: (engaged: boolean) => void;
}

interface MagnetSpring {
  damping: number;
  mass: number;
  stiffness: number;
}

interface MagnetPreset {
  content: MagnetSpring;
  surface: MagnetSpring;
  tap: number;
}

const MOTION_PRESETS: Record<MagnetIntensity, MagnetPreset> = {
  subtle: {
    content: { damping: 26, mass: 0.78, stiffness: 210 },
    surface: { damping: 30, mass: 0.68, stiffness: 270 },
    tap: 0.985,
  },
  default: {
    content: { damping: 19, mass: 1, stiffness: 135 },
    surface: { damping: 22, mass: 0.88, stiffness: 185 },
    tap: 0.97,
  },
  expressive: {
    content: { damping: 13, mass: 1.22, stiffness: 88 },
    surface: { damping: 15, mass: 1.08, stiffness: 124 },
    tap: 0.945,
  },
};

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface MagnetRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface MagnetOffset {
  /** 1 over the button, falling linearly to 0 at the edge of the radius. */
  proximity: number;
  /** Horizontal distance from the button center, already scaled by proximity. */
  x: number;
  /** Vertical distance from the button center, already scaled by proximity. */
  y: number;
}

/**
 * Scales the cursor offset by how deep the cursor sits inside the field, so the
 * pull grows from exactly zero at the radius edge instead of snapping on.
 */
export function computeMagnetOffset(
  rect: MagnetRect,
  pointerX: number,
  pointerY: number,
  radius: number,
): MagnetOffset {
  const outsideX = Math.max(
    rect.left - pointerX,
    pointerX - (rect.left + rect.width),
    0,
  );
  const outsideY = Math.max(
    rect.top - pointerY,
    pointerY - (rect.top + rect.height),
    0,
  );
  const distance = Math.hypot(outsideX, outsideY);
  const proximity =
    radius > 0 ? Math.max(0, 1 - distance / radius) : distance > 0 ? 0 : 1;

  return {
    proximity,
    x: (pointerX - (rect.left + rect.width / 2)) * proximity,
    y: (pointerY - (rect.top + rect.height / 2)) * proximity,
  };
}

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

/**
 * Subscribes to a media query directly rather than using Motion's
 * `useReducedMotion`, which resolves once per module lifetime and so never
 * reacts to the preference changing. This component attaches a window-level
 * listener, and that listener has to detach the moment the preference flips.
 */
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

export const MagnetPull = forwardRef<HTMLButtonElement, MagnetPullProps>(
  function MagnetPull(
    {
      children,
      className,
      contentStrength = 0.32,
      disabled = false,
      motionIntensity = "default",
      onEngagedChange,
      radius = 120,
      strength = 0.2,
      style,
      type = "button",
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [engaged, setEngaged] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const engagedRef = useRef(false);
    const onEngagedChangeRef = useRef(onEngagedChange);
    const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
    const hoverCapable = useMediaQuery(HOVER_QUERY);
    const preset = MOTION_PRESETS[motionIntensity];

    const surfaceTargetX = useMotionValue(0);
    const surfaceTargetY = useMotionValue(0);
    const contentTargetX = useMotionValue(0);
    const contentTargetY = useMotionValue(0);
    const surfaceX = useSpring(surfaceTargetX, preset.surface);
    const surfaceY = useSpring(surfaceTargetY, preset.surface);
    const contentX = useSpring(contentTargetX, preset.content);
    const contentY = useSpring(contentTargetY, preset.content);

    const setButtonRef = useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    useEffect(() => {
      onEngagedChangeRef.current = onEngagedChange;
    }, [onEngagedChange]);

    useEffect(() => {
      const node = buttonRef.current;
      if (!node || disabled || prefersReducedMotion || !hoverCapable) return;

      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;
      let tracking = false;

      const setEngagement = (nextEngaged: boolean) => {
        if (engagedRef.current === nextEngaged) return;

        engagedRef.current = nextEngaged;
        setEngaged(nextEngaged);
        onEngagedChangeRef.current?.(nextEngaged);
      };

      /** Springs home but keeps listening, so scrolling back into range re-engages. */
      const settle = () => {
        surfaceTargetX.set(0);
        surfaceTargetY.set(0);
        contentTargetX.set(0);
        contentTargetY.set(0);
        setEngagement(false);
      };

      /** Springs home and forgets the pointer, for when the cursor is gone. */
      const release = () => {
        tracking = false;
        settle();
      };

      const applyFrame = () => {
        frame = 0;
        if (!tracking) return;

        // getBoundingClientRect reports the *transformed* box. Subtracting the
        // offset already applied recovers the resting rect, without which the
        // measured field chases the cursor and the edge of the radius drifts.
        const measured = node.getBoundingClientRect();
        const offset = computeMagnetOffset(
          {
            height: measured.height,
            left: measured.left - surfaceX.get(),
            top: measured.top - surfaceY.get(),
            width: measured.width,
          },
          pointerX,
          pointerY,
          radius,
        );

        if (offset.proximity <= 0) {
          settle();
          return;
        }

        surfaceTargetX.set(offset.x * strength);
        surfaceTargetY.set(offset.y * strength);
        contentTargetX.set(offset.x * (contentStrength - strength));
        contentTargetY.set(offset.y * (contentStrength - strength));
        setEngagement(true);
      };

      const schedule = () => {
        if (frame === 0) frame = requestAnimationFrame(applyFrame);
      };

      const handlePointerMove = (event: PointerEvent) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        tracking = true;
        schedule();
      };

      // The button can move under a still cursor, so re-measure on layout
      // changes too rather than caching the rect.
      const handleLayoutChange = () => {
        if (tracking) schedule();
      };

      const root = node.ownerDocument.documentElement;
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      window.addEventListener("scroll", handleLayoutChange, {
        capture: true,
        passive: true,
      });
      window.addEventListener("resize", handleLayoutChange, { passive: true });
      window.addEventListener("blur", release);
      root.addEventListener("pointerleave", release);

      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("scroll", handleLayoutChange, {
          capture: true,
        });
        window.removeEventListener("resize", handleLayoutChange);
        window.removeEventListener("blur", release);
        root.removeEventListener("pointerleave", release);
        if (frame !== 0) cancelAnimationFrame(frame);
        release();
      };
    }, [
      contentStrength,
      contentTargetX,
      contentTargetY,
      disabled,
      hoverCapable,
      prefersReducedMotion,
      radius,
      strength,
      surfaceTargetX,
      surfaceTargetY,
      surfaceX,
      surfaceY,
    ]);

    return (
      <motion.button
        {...buttonProps}
        className={joinClassNames(
          "relative inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--suluu-magnet-background)] px-7 py-3.5 text-base font-semibold whitespace-nowrap text-[var(--suluu-magnet-foreground)] shadow-[var(--suluu-magnet-shadow)] transition-colors outline-none select-none hover:bg-[var(--suluu-magnet-hover)] focus-visible:ring-2 focus-visible:ring-[var(--suluu-magnet-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-magnet-offset)] disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        data-magnet-engaged={engaged ? "true" : "false"}
        data-slot="magnet-pull"
        disabled={disabled}
        ref={setButtonRef}
        style={{ ...style, x: surfaceX, y: surfaceY }}
        type={type}
        {...(prefersReducedMotion ? {} : { whileTap: { scale: preset.tap } })}
      >
        <motion.span
          className="inline-flex items-center justify-center gap-2"
          data-slot="magnet-pull-content"
          style={{ x: contentX, y: contentY }}
        >
          {children}
        </motion.span>
      </motion.button>
    );
  },
);

MagnetPull.displayName = "MagnetPull";
