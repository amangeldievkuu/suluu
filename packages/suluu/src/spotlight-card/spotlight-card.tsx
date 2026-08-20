"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";

export type SpotlightCardIntensity = "subtle" | "default" | "expressive";

export interface SpotlightCardProps extends ComponentPropsWithoutRef<"div"> {
  /** Disables reactive lighting without disabling interactive descendants. */
  disabled?: boolean;
  /** Controls the tracking lag, settling character, and light presence. */
  motionIntensity?: SpotlightCardIntensity;
  /** CSS color used by the spotlight and border highlight. */
  spotlightColor?: string;
  /** Full diameter of the spotlight in pixels. */
  spotlightSize?: number;
}

interface SpotlightPreset {
  opacity: number;
  position: {
    damping: number;
    mass: number;
    stiffness: number;
  };
  presence: {
    damping: number;
    mass: number;
    stiffness: number;
  };
}

const MOTION_PRESETS: Record<SpotlightCardIntensity, SpotlightPreset> = {
  subtle: {
    opacity: 0.72,
    position: { damping: 38, mass: 0.65, stiffness: 260 },
    presence: { damping: 40, mass: 0.6, stiffness: 300 },
  },
  default: {
    opacity: 1,
    position: { damping: 28, mass: 0.78, stiffness: 180 },
    presence: { damping: 30, mass: 0.72, stiffness: 220 },
  },
  expressive: {
    opacity: 1,
    position: { damping: 22, mass: 0.95, stiffness: 120 },
    presence: { damping: 24, mass: 0.86, stiffness: 160 },
  },
};

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type SpotlightStyle = CSSProperties & {
  "--suluu-spotlight-card-size"?: string;
  "--suluu-spotlight-card-spotlight"?: string;
};

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
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => matchMediaList(query)?.matches ?? false,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const SpotlightCard = forwardRef<HTMLDivElement, SpotlightCardProps>(
  function SpotlightCard(
    {
      children,
      className,
      disabled = false,
      motionIntensity = "default",
      spotlightColor,
      spotlightSize,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [active, setActive] = useState(false);
    const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
    const hoverCapable = useMediaQuery(HOVER_QUERY);
    const preset = MOTION_PRESETS[motionIntensity];
    const pointerTargetX = useMotionValue(0);
    const pointerTargetY = useMotionValue(0);
    const presenceTarget = useMotionValue(0);
    const pointerX = useSpring(pointerTargetX, preset.position);
    const pointerY = useSpring(pointerTargetY, preset.position);
    const presence = useSpring(presenceTarget, preset.presence);
    const spotlightBackground = useMotionTemplate`radial-gradient(circle calc(var(--suluu-spotlight-card-size) / 2) at ${pointerX}px ${pointerY}px, var(--suluu-spotlight-card-spotlight) 0%, color-mix(in oklch, var(--suluu-spotlight-card-spotlight) 58%, transparent) 42%, transparent 74%)`;

    const setCardRef = useCallback(
      (node: HTMLDivElement | null) => {
        cardRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    useEffect(() => {
      const node = cardRef.current;
      if (!node) return;

      if (disabled || prefersReducedMotion || !hoverCapable) {
        presenceTarget.set(0);
        if (prefersReducedMotion) presence.jump(0);
        return;
      }

      const ownerWindow = node.ownerDocument.defaultView ?? window;
      const root = node.ownerDocument.documentElement;
      let frame = 0;
      let clientX = 0;
      let clientY = 0;

      const placeSpotlight = (jump: boolean) => {
        const rect = node.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        pointerTargetX.set(x);
        pointerTargetY.set(y);
        if (jump) {
          pointerX.jump(x);
          pointerY.jump(y);
        }
      };

      const cancelFrame = () => {
        if (frame === 0) return;
        ownerWindow.cancelAnimationFrame(frame);
        frame = 0;
      };

      const release = () => {
        cancelFrame();
        presenceTarget.set(0);
        setActive(false);
      };

      const handlePointerEnter = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;

        clientX = event.clientX;
        clientY = event.clientY;
        placeSpotlight(true);
        presenceTarget.set(preset.opacity);
        setActive(true);
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;

        clientX = event.clientX;
        clientY = event.clientY;
        if (frame !== 0) return;

        frame = ownerWindow.requestAnimationFrame(() => {
          frame = 0;
          placeSpotlight(false);
        });
      };

      node.addEventListener("pointerenter", handlePointerEnter, {
        passive: true,
      });
      node.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      node.addEventListener("pointerleave", release, { passive: true });
      node.addEventListener("pointercancel", release, { passive: true });
      ownerWindow.addEventListener("blur", release);
      root.addEventListener("pointerleave", release);

      return () => {
        node.removeEventListener("pointerenter", handlePointerEnter);
        node.removeEventListener("pointermove", handlePointerMove);
        node.removeEventListener("pointerleave", release);
        node.removeEventListener("pointercancel", release);
        ownerWindow.removeEventListener("blur", release);
        root.removeEventListener("pointerleave", release);
        release();
      };
    }, [
      disabled,
      hoverCapable,
      pointerTargetX,
      pointerTargetY,
      pointerX,
      pointerY,
      prefersReducedMotion,
      presence,
      presenceTarget,
      preset.opacity,
    ]);

    const mergedStyle: SpotlightStyle = {
      ...style,
      ...(spotlightColor === undefined
        ? {}
        : { "--suluu-spotlight-card-spotlight": spotlightColor }),
      ...(spotlightSize === undefined
        ? {}
        : {
            "--suluu-spotlight-card-size": `${String(
              Number.isFinite(spotlightSize) ? Math.max(0, spotlightSize) : 0,
            )}px`,
          }),
    };

    return (
      <div
        {...divProps}
        className={joinClassNames(
          "relative isolate overflow-hidden rounded-[var(--suluu-spotlight-card-radius)] border border-[var(--suluu-spotlight-card-border)] bg-[var(--suluu-spotlight-card-background)] p-6 text-[var(--suluu-spotlight-card-foreground)] shadow-[var(--suluu-spotlight-card-shadow)]",
          className,
        )}
        data-disabled={disabled ? "true" : "false"}
        data-slot="spotlight-card"
        data-spotlight-active={active ? "true" : "false"}
        data-spotlight-interactive={
          !disabled && !prefersReducedMotion && hoverCapable ? "true" : "false"
        }
        ref={setCardRef}
        style={mergedStyle}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          data-slot="spotlight-card-effects"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-8%,var(--suluu-spotlight-card-spotlight),transparent_64%)] opacity-[calc(var(--suluu-spotlight-card-intensity)*0.24)]" />
          <motion.div
            className="absolute inset-0"
            data-slot="spotlight-card-wash"
            style={{ opacity: presence }}
          >
            <motion.div
              className="absolute inset-0 opacity-[var(--suluu-spotlight-card-intensity)]"
              style={{ backgroundImage: spotlightBackground }}
            />
          </motion.div>
          <motion.div
            className="absolute inset-0"
            data-slot="spotlight-card-border-highlight"
            style={{ opacity: presence }}
          >
            <motion.div
              className="absolute inset-0 rounded-[inherit] p-px opacity-[calc(var(--suluu-spotlight-card-intensity)*1.5)]"
              style={{
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                backgroundImage: spotlightBackground,
                mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                maskComposite: "exclude",
              }}
            />
          </motion.div>
        </div>
        <div className="relative z-10" data-slot="spotlight-card-content">
          {children}
        </div>
      </div>
    );
  },
);

SpotlightCard.displayName = "SpotlightCard";
