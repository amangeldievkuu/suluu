"use client";

import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  type AnimationPlaybackControls,
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
  /** Controls the trail, the size of the light, and how long it lingers. */
  motionIntensity?: SpotlightCardIntensity;
  /** CSS color used by the spotlight and border highlight. */
  spotlightColor?: string;
  /** Full diameter of the spotlight in pixels. */
  spotlightSize?: number;
}

interface SpotlightPreset {
  /** Seconds the light takes to fade once the pointer is gone. */
  fadeOut: number;
  /** Peak opacity of the reactive light. */
  opacity: number;
  /**
   * Follow spring. Damping ratios sit between 0.65 and 1 so the light trails
   * with a little mass and settles without ever wobbling. The rest thresholds
   * are in pixels, so the default 0.01 would keep the spring running long
   * after the movement stopped being visible.
   */
  position: {
    damping: number;
    mass: number;
    restDelta: number;
    restSpeed: number;
    stiffness: number;
  };
  /** Multiplier applied to the spotlight diameter. */
  scale: number;
}

const MOTION_PRESETS: Record<SpotlightCardIntensity, SpotlightPreset> = {
  subtle: {
    fadeOut: 0.32,
    opacity: 0.6,
    position: {
      damping: 40,
      mass: 0.9,
      restDelta: 0.5,
      restSpeed: 0.5,
      stiffness: 460,
    },
    scale: 0.9,
  },
  default: {
    fadeOut: 0.45,
    opacity: 0.85,
    position: {
      damping: 26,
      mass: 1,
      restDelta: 0.5,
      restSpeed: 0.5,
      stiffness: 260,
    },
    scale: 1,
  },
  expressive: {
    fadeOut: 0.62,
    opacity: 1,
    position: {
      damping: 18,
      mass: 1.15,
      restDelta: 0.5,
      restSpeed: 0.5,
      stiffness: 150,
    },
    scale: 1.12,
  },
};

/** Overdamped, so the light never bounces its way into view. */
const FADE_IN = {
  damping: 34,
  mass: 0.7,
  stiffness: 220,
  type: "spring",
} as const;

/** Light leaves more slowly than it arrives. */
const FADE_OUT_EASE = [0.22, 0.61, 0.36, 1] as const;

/** Below this the light is invisible, so it can be repositioned unseen. */
const INVISIBLE = 0.02;

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Painted once and then only translated, which keeps pointer movement on the
 * compositor instead of re-rasterizing a gradient every frame.
 */
const POOL_CLASS =
  "absolute top-0 left-0 ml-[calc(var(--suluu-spotlight-card-pool)*-0.5)] h-[var(--suluu-spotlight-card-pool)] w-[var(--suluu-spotlight-card-pool)] mt-[calc(var(--suluu-spotlight-card-pool)*-0.5)] rounded-full [mix-blend-mode:var(--suluu-spotlight-card-blend)]";

const POOL_GRADIENT =
  "radial-gradient(closest-side, var(--suluu-spotlight-card-spotlight) 0%, color-mix(in oklch, var(--suluu-spotlight-card-spotlight) 62%, transparent) 38%, color-mix(in oklch, var(--suluu-spotlight-card-spotlight) 20%, transparent) 62%, transparent 82%)";

/**
 * Keeps the wash off the perimeter. Without it the pool is sliced by the card
 * bounds while still at full brightness, leaving a hard line along the edge.
 * The border highlight is deliberately left unmasked; catching light at the
 * rim is its entire job.
 */
const EDGE_FADE = "1.25rem";
const EDGE_MASK = `linear-gradient(to right, transparent, #000 ${EDGE_FADE}, #000 calc(100% - ${EDGE_FADE}), transparent), linear-gradient(to bottom, transparent, #000 ${EDGE_FADE}, #000 calc(100% - ${EDGE_FADE}), transparent)`;

const EDGE_MASK_STYLE = {
  WebkitMaskComposite: "source-in",
  WebkitMaskImage: EDGE_MASK,
  maskComposite: "intersect",
  maskImage: EDGE_MASK,
} satisfies CSSProperties;

/** Hairline ring: the border box minus the content box. */
const RING_MASK_STYLE = {
  WebkitMask:
    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  maskComposite: "exclude",
} satisfies CSSProperties;

type SpotlightStyle = CSSProperties & {
  "--suluu-spotlight-card-pool"?: string;
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
    // Outlives `active` by the length of the fade, so the compositor hint is
    // not pulled while the light is still on screen and still moving.
    const [lit, setLit] = useState(false);
    const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
    const hoverCapable = useMediaQuery(HOVER_QUERY);
    const preset = MOTION_PRESETS[motionIntensity];
    const presetRef = useRef(preset);
    const fadeRef = useRef<AnimationPlaybackControls | null>(null);
    const pointerTargetX = useMotionValue(0);
    const pointerTargetY = useMotionValue(0);
    const pointerX = useSpring(pointerTargetX, preset.position);
    const pointerY = useSpring(pointerTargetY, preset.position);
    const presence = useMotionValue(0);

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

    // Read through a ref so changing intensity retunes the light in place
    // rather than tearing down and re-attaching every pointer listener.
    useEffect(() => {
      presetRef.current = preset;
    }, [preset]);

    useEffect(() => {
      const node = cardRef.current;
      if (!node) return;

      const stopFade = () => {
        fadeRef.current?.stop();
        fadeRef.current = null;
      };

      if (disabled || prefersReducedMotion || !hoverCapable) {
        stopFade();
        presence.set(0);
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
        stopFade();
        fadeRef.current = animate(presence, 0, {
          duration: presetRef.current.fadeOut,
          ease: FADE_OUT_EASE,
          onComplete: () => {
            setLit(false);
          },
        });
        setActive(false);
      };

      const handlePointerEnter = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;

        clientX = event.clientX;
        clientY = event.clientY;
        // Teleport only while the light is off screen. Re-entering before the
        // last glow has faded lets the spring carry it across instead.
        placeSpotlight(presence.get() < INVISIBLE);
        stopFade();
        fadeRef.current = animate(presence, presetRef.current.opacity, FADE_IN);
        setActive(true);
        setLit(true);
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
        cancelFrame();
        stopFade();
        presence.set(0);
        setActive(false);
        setLit(false);
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
    ]);

    const poolClassName = joinClassNames(
      POOL_CLASS,
      lit ? "will-change-transform" : undefined,
    );
    const mergedStyle: SpotlightStyle = {
      ...style,
      "--suluu-spotlight-card-pool": `calc(var(--suluu-spotlight-card-size) * ${String(preset.scale)})`,
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
          {/* Ambient light from above. Also the whole effect under reduced motion. */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-8%,var(--suluu-spotlight-card-spotlight),transparent_64%)] opacity-[calc(var(--suluu-spotlight-card-intensity)*0.24)]" />
          <motion.div
            className="absolute inset-0"
            data-slot="spotlight-card-wash"
            style={{ ...EDGE_MASK_STYLE, opacity: presence }}
          >
            <motion.div
              className={joinClassNames(
                poolClassName,
                "opacity-[var(--suluu-spotlight-card-intensity)]",
              )}
              style={{
                backgroundImage: POOL_GRADIENT,
                x: pointerX,
                y: pointerY,
              }}
            />
          </motion.div>
          <motion.div
            className="absolute inset-0"
            data-slot="spotlight-card-border-highlight"
            style={{ opacity: presence }}
          >
            <div
              className="absolute inset-0 overflow-hidden rounded-[inherit] p-px"
              style={RING_MASK_STYLE}
            >
              <motion.div
                className={joinClassNames(
                  poolClassName,
                  "opacity-[calc(var(--suluu-spotlight-card-intensity)*1.5)]",
                )}
                style={{
                  backgroundImage: POOL_GRADIENT,
                  x: pointerX,
                  y: pointerY,
                }}
              />
            </div>
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
