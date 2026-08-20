"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionStyle,
  type PanInfo,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export type ToastIntensity = "subtle" | "default" | "expressive";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastAction {
  /** Text on the inline button. Keep it to one or two words. */
  label: string;
  /** Runs before the toast dismisses itself. */
  onClick: (id: string) => void;
}

export interface ToastOptions {
  /** Secondary line under the title. */
  description?: ReactNode;
  /** Chooses the icon and its tint. The surface never changes color. */
  variant?: ToastVariant;
  /** Milliseconds on screen. Use `Infinity` to keep it until dismissed. */
  duration?: number;
  /** Single inline action, dismissed after it runs. */
  action?: ToastAction;
  /** Replaces the default icon for this toast. */
  icon?: ReactNode;
  /** Runs on every dismissal path, including `toast.dismiss()`. */
  onClose?: (id: string) => void;
  /** Overrides the viewport's spring character for this toast. */
  motionIntensity?: ToastIntensity;
}

export interface ToastRecord extends ToastOptions {
  /** Stable id returned by `toast()`, used to dismiss it later. */
  id: string;
  title: ReactNode;
  variant: ToastVariant;
}

export interface ToasterProps {
  /** Corner the deck grows from. */
  position?: ToastPosition;
  /** Default milliseconds on screen, overridable per toast. */
  duration?: number;
  /**
   * How many toasts live in the deck. The rest wait their turn. The collapsed
   * stack peeks four; hover or focus expands the front three, and the rest of
   * the deck scrolls.
   */
  max?: number;
  /** Spring character of the stack, enter, and exit. */
  motionIntensity?: ToastIntensity;
  /** Replaces the default icon for a whole variant. */
  icons?: Partial<Record<ToastVariant, ReactNode>>;
  /**
   * Portal target. Omit it to use `document.body`. Pass `null` while a host
   * ref is not ready — the deck will wait rather than flash onto the page.
   * Anything else should be a positioned element.
   */
  container?: HTMLElement | null;
  /** Accessible name of the notification list. */
  label?: string;
  /** Class name applied to the list element. */
  className?: string;
  /** Inline styles applied to the list element. */
  style?: MotionStyle;
}

export interface ToastHandle {
  (title: ReactNode, options?: ToastOptions): string;
  success: (title: ReactNode, options?: ToastOptions) => string;
  error: (title: ReactNode, options?: ToastOptions) => string;
  warning: (title: ReactNode, options?: ToastOptions) => string;
  info: (title: ReactNode, options?: ToastOptions) => string;
  /** Dismisses one toast, or every toast when called without an id. */
  dismiss: (id?: string) => void;
}

export interface ToastStore {
  add: (record: ToastRecord) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  getSnapshot: () => readonly ToastRecord[];
  subscribe: (listener: () => void) => () => void;
}

export interface ToasterInstance {
  Toaster: (props: ToasterProps) => ReactNode;
  toast: ToastHandle;
}

interface ToastMotionPreset {
  spring: { type: "spring"; stiffness: number; damping: number; mass: number };
  /**
   * Extra damping while the deck squares into the peek. Expand keeps the
   * livelier `spring`; collapse should settle, not bounce through itself.
   */
  collapseDamping: number;
  exit: { type: "spring"; stiffness: number; damping: number; mass: number };
  /** Distance the toast travels in from beyond the anchored edge. */
  enterOffset: number;
  enterScale: number;
  exitScale: number;
  /** Blur on enter. Only the expressive preset uses one. */
  blur: number;
}

export const TOAST_MOTION_PRESETS: Record<ToastIntensity, ToastMotionPreset> = {
  subtle: {
    collapseDamping: 48,
    spring: { type: "spring", stiffness: 460, damping: 40, mass: 0.7 },
    exit: { type: "spring", stiffness: 620, damping: 46, mass: 0.6 },
    enterOffset: 14,
    enterScale: 0.98,
    exitScale: 0.97,
    blur: 0,
  },
  default: {
    collapseDamping: 40,
    spring: { type: "spring", stiffness: 300, damping: 30, mass: 1.05 },
    exit: { type: "spring", stiffness: 420, damping: 34, mass: 0.85 },
    enterOffset: 22,
    enterScale: 0.96,
    exitScale: 0.94,
    blur: 0,
  },
  expressive: {
    collapseDamping: 32,
    spring: { type: "spring", stiffness: 250, damping: 21, mass: 1.15 },
    exit: { type: "spring", stiffness: 360, damping: 28, mass: 0.9 },
    enterOffset: 32,
    enterScale: 0.92,
    exitScale: 0.9,
    blur: 3,
  },
};

/** Vertical breathing room between toasts once the deck is expanded. */
export const TOAST_GAP = 12;
/** How much of each toast behind the front one stays visible. */
export const TOAST_PEEK = 8;
/** Scale removed per step back into the deck. */
export const TOAST_SCALE_STEP = 0.045;
/**
 * How many cards the collapsed stack peeks. Hover or focus springs the rest
 * of the deck out into a list, three of which fit in the viewport at a time.
 */
export const TOAST_STACK_VISIBLE = 4;
/** How many expanded toasts fit in the deck before it scrolls. */
export const TOAST_EXPANDED_VISIBLE = 3;
/** Stand-in height before a toast has been measured. */
export const TOAST_FALLBACK_HEIGHT = 64;
/** Fraction of the toast's width a swipe must cross to dismiss it. */
export const TOAST_SWIPE_RATIO = 0.35;
/** Pixels per second that dismiss a toast regardless of distance. */
export const TOAST_SWIPE_VELOCITY = 480;
/** Distance the toast is thrown when a swipe dismisses it. */
export const TOAST_SWIPE_THROW = 420;

export const DEFAULT_TOAST_DURATION = 4500;
export const DEFAULT_TOAST_MAX = 8;

const INSTANT = { duration: 0 } as const;
const REDUCED_FADE = { duration: 0.15 } as const;
const EMPTY_TOASTS: readonly ToastRecord[] = Object.freeze([]);

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function joinClassNames(...values: (string | undefined | false)[]): string {
  return values.filter(Boolean).join(" ");
}

function getServerSnapshot(): readonly ToastRecord[] {
  return EMPTY_TOASTS;
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Plain module state with no React in it, so `toast()` works from event
 * handlers, effects, and non-React code alike. The snapshot is only
 * reassigned when it genuinely changes, which is what keeps
 * `useSyncExternalStore` from looping.
 */
export function createToastStore(): ToastStore {
  let toasts: readonly ToastRecord[] = EMPTY_TOASTS;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    add(record) {
      // Newest first: index 0 is the front of the deck.
      toasts = [record, ...toasts];
      emit();
      return record.id;
    },
    dismiss(id) {
      const target = toasts.find((toast) => toast.id === id);
      if (!target) return;

      const next = toasts.filter((toast) => toast.id !== id);
      toasts = next.length === 0 ? EMPTY_TOASTS : next;
      emit();
      target.onClose?.(id);
    },
    dismissAll() {
      const dismissed = toasts;
      if (dismissed.length === 0) return;

      toasts = EMPTY_TOASTS;
      emit();
      for (const toast of dismissed) toast.onClose?.(toast.id);
    },
    getSnapshot: () => toasts,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

export interface ToastPlacement {
  /** Edge the deck is pinned to. */
  edge: "top" | "bottom";
  align: "left" | "center" | "right";
  /** Direction toasts recede in: +1 downward, -1 upward. */
  sign: 1 | -1;
  /** Direction a swipe must travel to dismiss. 0 accepts either. */
  swipe: 1 | -1 | 0;
}

export function resolveToastPlacement(position: ToastPosition): ToastPlacement {
  const [edge, align] = position.split("-") as [
    "top" | "bottom",
    "left" | "center" | "right",
  ];

  return {
    align,
    edge,
    sign: edge === "top" ? 1 : -1,
    swipe: align === "left" ? -1 : align === "right" ? 1 : 0,
  };
}

/**
 * Scale from the pinned corner so receding cards share an edge with the
 * front one, instead of shrinking toward their centre.
 *
 * Full class names so Tailwind can see them; Motion also gets originX/Y.
 */
export function resolveToastOrigin(placement: ToastPlacement): string {
  if (placement.edge === "top") {
    if (placement.align === "left") return "origin-top-left";
    if (placement.align === "right") return "origin-top-right";
    return "origin-top";
  }
  if (placement.align === "left") return "origin-bottom-left";
  if (placement.align === "right") return "origin-bottom-right";
  return "origin-bottom";
}

export function resolveToastOriginPoint(placement: ToastPlacement): {
  originX: number;
  originY: number;
} {
  return {
    originX:
      placement.align === "left" ? 0 : placement.align === "right" ? 1 : 0.5,
    originY: placement.edge === "top" ? 0 : 1,
  };
}

/**
 * Dragging must not *open* the deck. It only freezes whatever state the
 * stack was already in, so a collapsed swipe cannot spring the pile apart.
 *
 * `focused` is keyboard intent (`:focus-visible`). A pointer click that parks
 * focus on the landmark or a control must not hold the deck open.
 */
export function resolveDeckExpanded(options: {
  hovered: boolean;
  /** True only for `:focus-visible`, not pointer-driven focus. */
  focused: boolean;
  /** Captured at drag start; `null` when no toast is being dragged. */
  dragFreeze: boolean | null;
}): boolean {
  if (options.dragFreeze !== null) return options.dragFreeze;
  return options.hovered || options.focused;
}

/**
 * Expand keeps the intensity's spring. Collapse uses the same stiffness and
 * mass with extra damping so the peek settles instead of overshooting.
 */
export function resolveStackTransition(options: {
  expanded: boolean;
  preset: ToastMotionPreset;
  reducedMotion: boolean;
}): ToastMotionPreset["spring"] | typeof INSTANT {
  if (options.reducedMotion) return INSTANT;
  if (options.expanded) return options.preset.spring;

  return {
    damping: options.preset.collapseDamping,
    mass: options.preset.spring.mass,
    stiffness: options.preset.spring.stiffness,
    type: "spring",
  };
}

function isFocusVisibleTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.matches(":focus-visible");
}

export interface ToastStackEntry {
  y: number;
  scale: number;
  height: number;
  /** Content of every toast but the front one is hidden while collapsed. */
  contentOpacity: number;
  /** Front of the deck is highest so newer toasts paint over older ones. */
  zIndex: number;
  /** Collapsed back cards must not steal the front toast's pointer. */
  interactive: boolean;
}

export interface ToastStackLayout {
  entries: ToastStackEntry[];
  /**
   * Visible box / hover target. Collapsed this is the peek; expanded it fits
   * three toasts, and the rest of the deck scrolls inside it.
   */
  extent: number;
  /** Full stack height. Taller than `extent` when the expanded deck scrolls. */
  contentHeight: number;
}

/**
 * Distance covered by the first `count` toasts, sitting one after another
 * with `gap` between them. Used for the expanded viewport and the full list.
 */
function stackedHeight(
  heights: readonly number[],
  count: number,
  gap: number,
): number {
  const limit = Math.min(Math.max(0, count), heights.length);
  let total = 0;
  for (let index = 0; index < limit; index += 1) {
    total += heights[index] ?? 0;
    if (index < limit - 1) {
      total += gap;
    }
  }
  return total;
}

/**
 * The whole stack in one pure function: collapsed, every toast borrows the
 * front toast's height so nothing pokes out from behind it, and only the first
 * four peek — anything deeper sits behind the last visible card; expanded,
 * each one takes its own height and the offsets are a running total so the
 * whole deck is in the list, with the viewport clipped to three.
 */
export function computeStackLayout(options: {
  heights: readonly number[];
  expanded: boolean;
  gap?: number;
  peek?: number;
  scaleStep?: number;
  /** How many cards peek while collapsed. Ignored once the deck is expanded. */
  collapsedVisible?: number;
  /**
   * How many expanded toasts fit in the viewport. The rest of the deck is
   * still laid out; the viewport just clips to this many and scrolls.
   */
  expandedVisible?: number;
  sign: 1 | -1;
}): ToastStackLayout {
  const {
    collapsedVisible = TOAST_STACK_VISIBLE,
    expanded,
    expandedVisible = TOAST_EXPANDED_VISIBLE,
    gap = TOAST_GAP,
    heights,
    peek = TOAST_PEEK,
    scaleStep = TOAST_SCALE_STEP,
    sign,
  } = options;

  if (heights.length === 0) {
    return { contentHeight: 0, entries: [], extent: 0 };
  }

  const frontHeight = heights[0] ?? 0;
  let offset = 0;

  // `sign * 0` is negative zero, which is a surprising thing to hand back.
  const away = (distance: number) => (distance === 0 ? 0 : sign * distance);

  const count = heights.length;
  const peekSlots = Math.max(1, collapsedVisible);
  const expandedSlots = Math.max(1, expandedVisible);

  const entries = heights.map((height, depth): ToastStackEntry => {
    const stacking = {
      interactive: expanded || depth === 0,
      zIndex: count - depth,
    };

    if (expanded) {
      const entry = {
        ...stacking,
        contentOpacity: 1,
        height,
        scale: 1,
        y: away(offset),
      };
      offset += height + gap;
      return entry;
    }

    // Cards past the peek sit on the last visible step, behind it in z-order.
    const visualDepth = Math.min(depth, peekSlots - 1);

    return {
      ...stacking,
      contentOpacity: depth === 0 ? 1 : 0,
      height: frontHeight,
      scale: Math.max(0, 1 - visualDepth * scaleStep),
      y: away(visualDepth * peek),
    };
  });

  const peeking = Math.min(count, peekSlots);
  const collapsedExtent = frontHeight + Math.max(0, peeking - 1) * peek;
  const contentHeight = expanded ? Math.max(0, offset - gap) : collapsedExtent;
  const extent = expanded
    ? stackedHeight(heights, expandedSlots, gap)
    : collapsedExtent;

  return { contentHeight, entries, extent };
}

/**
 * Scroll offset that brings a toast's visual box into the viewport. Transforms
 * place the cards, so the layout box stays on the pinned edge — this maps the
 * signed `y` back onto the scrollable content.
 */
export function resolveToastScrollTop(options: {
  contentHeight: number;
  edge: "top" | "bottom";
  scrollTop: number;
  toastHeight: number;
  toastY: number;
  viewportHeight: number;
}): number {
  const {
    contentHeight,
    edge,
    scrollTop,
    toastHeight,
    toastY,
    viewportHeight,
  } = options;

  if (contentHeight <= viewportHeight) return 0;

  const toastTop =
    edge === "top" ? toastY : contentHeight + toastY - toastHeight;
  const toastBottom = toastTop + toastHeight;
  const maxScroll = Math.max(0, contentHeight - viewportHeight);

  if (toastTop < scrollTop) {
    return Math.max(0, Math.min(maxScroll, toastTop));
  }

  if (toastBottom > scrollTop + viewportHeight) {
    return Math.max(0, Math.min(maxScroll, toastBottom - viewportHeight));
  }

  return scrollTop;
}

/**
 * Where a dismissed toast is thrown. A corner deck always throws outward; a
 * centered one follows the swipe.
 */
export function resolveSwipeThrow(
  direction: 1 | -1 | 0,
  offset: number,
): number {
  const outward = direction === 0 ? (offset < 0 ? -1 : 1) : direction;

  return outward * TOAST_SWIPE_THROW;
}

export function resolveSwipeDismiss(options: {
  offset: number;
  velocity: number;
  width: number;
  direction: 1 | -1 | 0;
}): boolean {
  const { direction, offset, velocity, width } = options;
  const travelled = direction === 0 ? Math.abs(offset) : offset * direction;
  const speed = direction === 0 ? Math.abs(velocity) : velocity * direction;
  const threshold = Math.max(56, width * TOAST_SWIPE_RATIO);

  if (travelled >= threshold) return true;

  return speed >= TOAST_SWIPE_VELOCITY && travelled > 8;
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

interface ToastMarkProps {
  d: string;
  delay?: number;
  reducedMotion: boolean;
}

/**
 * Marks draw themselves on as the toast settles. Each is a separate path so
 * the parts can be staggered.
 */
function ToastMark({ d, delay = 0, reducedMotion }: ToastMarkProps) {
  return (
    <motion.path
      animate={{ opacity: 1, pathLength: 1 }}
      d={d}
      initial={
        reducedMotion
          ? { opacity: 1, pathLength: 1 }
          : { opacity: 0.4, pathLength: 0 }
      }
      transition={
        reducedMotion
          ? INSTANT
          : {
              opacity: { delay, duration: 0.12 },
              pathLength: { delay, duration: 0.42, ease: [0.22, 1, 0.36, 1] },
            }
      }
    />
  );
}

function ToastGlyph({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="size-[1.125rem]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 20 20"
    >
      {children}
    </svg>
  );
}

function SuccessIcon({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <ToastGlyph>
      <ToastMark
        d="M5.75 10.4 8.9 13.5l5.35-6.6"
        reducedMotion={reducedMotion}
      />
    </ToastGlyph>
  );
}

function ErrorIcon({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <ToastGlyph>
      <ToastMark d="M6.9 6.9 13.1 13.1" reducedMotion={reducedMotion} />
      <ToastMark
        d="M13.1 6.9 6.9 13.1"
        delay={0.07}
        reducedMotion={reducedMotion}
      />
    </ToastGlyph>
  );
}

function WarningIcon({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <ToastGlyph>
      <ToastMark d="M10 5.6v5" reducedMotion={reducedMotion} />
      <ToastMark d="M10 13.9h.01" delay={0.1} reducedMotion={reducedMotion} />
    </ToastGlyph>
  );
}

function InfoIcon({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <ToastGlyph>
      <ToastMark d="M10 6.1h.01" reducedMotion={reducedMotion} />
      <ToastMark d="M10 9.3v4.6" delay={0.07} reducedMotion={reducedMotion} />
    </ToastGlyph>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
      viewBox="0 0 14 14"
    >
      <path d="m4 4 6 6M10 4l-6 6" />
    </svg>
  );
}

function defaultIcon(
  variant: ToastVariant,
  reducedMotion: boolean,
): ReactNode | null {
  switch (variant) {
    case "success":
      return <SuccessIcon reducedMotion={reducedMotion} />;
    case "error":
      return <ErrorIcon reducedMotion={reducedMotion} />;
    case "warning":
      return <WarningIcon reducedMotion={reducedMotion} />;
    case "info":
      return <InfoIcon reducedMotion={reducedMotion} />;
    default:
      return null;
  }
}

const VARIANT_TINT: Record<ToastVariant, string> = {
  default: "text-[var(--suluu-toast-neutral)]",
  error: "text-[var(--suluu-toast-error)]",
  info: "text-[var(--suluu-toast-info)]",
  success: "text-[var(--suluu-toast-success)]",
  warning: "text-[var(--suluu-toast-warning)]",
};

/** Errors and warnings interrupt; everything else waits its turn. */
function isAssertive(variant: ToastVariant): boolean {
  return variant === "error" || variant === "warning";
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

function subscribeToNothing(): () => void {
  return () => undefined;
}

/**
 * False on the server and through hydration, true afterwards, without a
 * render-triggering effect. The portal needs a real `document` to aim at.
 */
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function subscribeToVisibility(onStoreChange: () => void): () => void {
  if (typeof document === "undefined") return () => undefined;

  document.addEventListener("visibilitychange", onStoreChange);
  return () => document.removeEventListener("visibilitychange", onStoreChange);
}

function useDocumentHidden(): boolean {
  return useSyncExternalStore(
    subscribeToVisibility,
    () => document.hidden,
    () => false,
  );
}

/**
 * One clock drives both the dismissal and the ring, so they cannot disagree
 * about how much time is left. Pausing pauses the pair.
 */
function useToastClock(options: {
  duration: number;
  paused: boolean;
  onElapsed: () => void;
}): { progress: ReturnType<typeof useMotionValue<number>>; timed: boolean } {
  const { duration, onElapsed, paused } = options;
  const timed = Number.isFinite(duration) && duration > 0;
  const progress = useMotionValue(0);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const onElapsedRef = useRef(onElapsed);
  const pausedRef = useRef(paused);

  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    pausedRef.current = paused;
    const controls = controlsRef.current;
    if (!controls) return;

    if (paused) controls.pause();
    else controls.play();
  }, [paused]);

  useEffect(() => {
    if (!timed) return;

    const remaining = Math.max(0, (1 - progress.get()) * (duration / 1000));
    if (remaining === 0) {
      onElapsedRef.current();
      return;
    }

    const controls = animate(progress, 1, {
      duration: remaining,
      ease: "linear",
      onComplete: () => {
        controlsRef.current = null;
        onElapsedRef.current();
      },
    });
    if (pausedRef.current) controls.pause();
    controlsRef.current = controls;

    return () => {
      controlsRef.current = null;
      controls.stop();
    };
  }, [duration, progress, timed]);

  return { progress, timed };
}

function dismissLabel(title: ReactNode): string {
  return typeof title === "string" && title.length > 0
    ? `Dismiss ${title}`
    : "Dismiss notification";
}

function stopDragFromControl(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

/**
 * Natural height of a toast's content, independent of the animated height on
 * its shell. `offsetHeight` reports the untransformed box, so the deck's
 * scale cannot feed a shrinking measurement back into the layout.
 */
function useMeasuredHeight(
  ref: RefObject<HTMLElement | null>,
  onMeasure: (height: number) => void,
): void {
  const onMeasureRef = useRef(onMeasure);

  useEffect(() => {
    onMeasureRef.current = onMeasure;
  }, [onMeasure]);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => onMeasureRef.current(node.offsetHeight);

    measure();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
}

/* -------------------------------------------------------------------------- */
/* Toast                                                                      */
/* -------------------------------------------------------------------------- */

interface ToastItemProps {
  duration: number;
  entry: ToastStackEntry;
  expanded: boolean;
  icons: Partial<Record<ToastVariant, ReactNode>> | undefined;
  intensity: ToastIntensity;
  onDismiss: (id: string) => void;
  onDragStateChange: (dragging: boolean) => void;
  onMeasure: (id: string, height: number) => void;
  onRelease: (id: string) => void;
  paused: boolean;
  placement: ToastPlacement;
  record: ToastRecord;
  reducedMotion: boolean;
}

function ToastItem({
  duration,
  entry,
  expanded,
  icons,
  intensity,
  onDismiss,
  onDragStateChange,
  onMeasure,
  onRelease,
  paused,
  placement,
  record,
  reducedMotion,
}: ToastItemProps) {
  const present = useIsPresent();
  const leavingRef = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const preset = TOAST_MOTION_PRESETS[record.motionIntensity ?? intensity];
  const origin = resolveToastOrigin(placement);
  const originPoint = resolveToastOriginPoint(placement);
  const blocked = leaving || !present;

  const dismiss = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    onDismiss(record.id);
  }, [onDismiss, record.id]);

  const { progress, timed } = useToastClock({
    duration,
    onElapsed: dismiss,
    paused,
  });
  const remaining = useTransform(progress, (value) => 1 - value);

  const handleMeasure = useCallback(
    (height: number) => {
      onMeasure(record.id, height);
    },
    [onMeasure, record.id],
  );
  useMeasuredHeight(contentRef, handleMeasure);

  const id = record.id;
  useEffect(() => () => onRelease(id), [id, onRelease]);

  const icon =
    record.icon ??
    icons?.[record.variant] ??
    defaultIcon(record.variant, reducedMotion);
  // Everything on the row centers against the 28px icon when there is one,
  // and against the 20px title line when there is not.
  const hasIcon = icon !== null && icon !== undefined;
  const showRing = timed && hasIcon;
  const canDrag = entry.interactive && !blocked;

  const stackTransition = resolveStackTransition({
    expanded,
    preset,
    reducedMotion,
  });
  const enterExit = reducedMotion ? REDUCED_FADE : preset.spring;
  // A filter on the shell creates a stacking context that the surface's
  // backdrop blur would then sample from, so only the preset that wants a
  // blur declares one at all.
  const blurred = preset.blur > 0 && !reducedMotion;
  const blur = `blur(${String(preset.blur)}px)`;

  function handleDragEnd(_event: unknown, info: PanInfo) {
    onDragStateChange(false);

    const width = contentRef.current?.offsetWidth ?? 0;
    const dismissed = resolveSwipeDismiss({
      direction: placement.swipe,
      offset: info.offset.x,
      velocity: info.velocity.x,
      width,
    });
    if (!dismissed) return;

    // Throw first so the drag constraints cannot snap x back to 0, then
    // `dismiss` turns drag off via `leaving` on the next render.
    if (!reducedMotion) {
      void animate(x, resolveSwipeThrow(placement.swipe, info.offset.x), {
        damping: 34,
        stiffness: 260,
        type: "spring",
      });
    }
    dismiss();
  }

  return (
    <motion.li
      animate={{
        ...(blurred ? { filter: "blur(0px)" } : {}),
        height: entry.height,
        opacity: 1,
        scale: entry.scale,
        y: entry.y,
      }}
      className={joinClassNames(
        "group absolute inset-x-0 overflow-hidden rounded-[1.125rem]",
        origin,
        placement.edge === "top" ? "top-0" : "bottom-0",
        (!entry.interactive || blocked) && "pointer-events-none",
      )}
      data-suluu-toast-id={record.id}
      data-variant={record.variant}
      drag={canDrag ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragDirectionLock
      dragElastic={{
        bottom: 0,
        left: placement.swipe === 1 ? 0.05 : 0.85,
        right: placement.swipe === -1 ? 0.05 : 0.85,
        top: 0,
      }}
      dragMomentum={false}
      exit={{
        ...(blurred ? { filter: blur } : {}),
        opacity: 0,
        scale: preset.exitScale,
        transition: reducedMotion ? REDUCED_FADE : preset.exit,
      }}
      initial={{
        ...(blurred ? { filter: blur } : {}),
        height: entry.height,
        opacity: 0,
        scale: preset.enterScale,
        y: entry.y - placement.sign * preset.enterOffset,
      }}
      onDragEnd={handleDragEnd}
      onDragStart={() => onDragStateChange(true)}
      style={{ x, zIndex: entry.zIndex, ...originPoint }}
      transition={{
        filter: { duration: 0.28 },
        height: stackTransition,
        opacity: enterExit,
        scale: stackTransition,
        y: stackTransition,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[1.125rem] border border-[var(--suluu-toast-border)] bg-[var(--suluu-toast-surface)] shadow-[var(--suluu-toast-shadow)] backdrop-blur-xl"
      />
      {/* The live region sits inside the item rather than on it: a list item
          cannot carry a status role without costing the list its semantics. */}
      <motion.div
        animate={{ opacity: entry.contentOpacity }}
        aria-atomic="true"
        aria-live={isAssertive(record.variant) ? "assertive" : "polite"}
        className="relative flex items-start gap-3 py-3.5 pr-3 pl-3.5"
        initial={false}
        ref={contentRef}
        role={isAssertive(record.variant) ? "alert" : "status"}
        transition={
          reducedMotion
            ? INSTANT
            : entry.contentOpacity > 0
              ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0.14, ease: [0.4, 0, 1, 1] }
        }
      >
        {icon ? (
          <span
            className={joinClassNames(
              "relative inline-flex size-7 shrink-0 items-center justify-center",
              VARIANT_TINT[record.variant],
            )}
            data-slot="toast-icon"
          >
            {showRing ? (
              <svg
                aria-hidden="true"
                className="absolute inset-0 size-7 -rotate-90"
                fill="none"
                viewBox="0 0 28 28"
              >
                <circle
                  cx="14"
                  cy="14"
                  r="13"
                  stroke="var(--suluu-toast-track)"
                  strokeWidth="1"
                />
                <motion.circle
                  cx="14"
                  cy="14"
                  data-slot="toast-progress"
                  r="13"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1"
                  style={{ pathLength: remaining }}
                />
              </svg>
            ) : null}
            {icon}
          </span>
        ) : null}

        <div className={joinClassNames("min-w-0 flex-1", hasIcon && "pt-1")}>
          <p className="text-[0.8125rem] leading-5 font-medium tracking-[-0.006em] text-[var(--suluu-toast-foreground)]">
            {record.title}
          </p>
          {record.description === undefined ? null : (
            <p className="mt-0.5 text-[0.8125rem] leading-5 text-[var(--suluu-toast-muted)]">
              {record.description}
            </p>
          )}
        </div>

        {record.action ? (
          <button
            className={joinClassNames(
              !hasIcon && "-mt-1",
              `inline-flex h-7 shrink-0 items-center rounded-full bg-[var(--suluu-toast-action)] px-2.5 text-xs font-medium whitespace-nowrap text-[var(--suluu-toast-action-foreground)] transition-colors outline-none hover:bg-[var(--suluu-toast-action-hover)] focus-visible:ring-2 focus-visible:ring-[var(--suluu-toast-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-toast-offset)]`,
            )}
            onClick={() => {
              if (leavingRef.current) return;
              record.action?.onClick(record.id);
              dismiss();
            }}
            onPointerDown={stopDragFromControl}
            type="button"
          >
            {record.action.label}
          </button>
        ) : null}

        <button
          aria-label={dismissLabel(record.title)}
          className={joinClassNames(
            hasIcon ? "mt-0.5" : "-mt-0.5",
            `-mr-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--suluu-toast-muted)] opacity-100 transition-[opacity,background-color,color] outline-none hover:bg-[var(--suluu-toast-action)] hover:text-[var(--suluu-toast-foreground)] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--suluu-toast-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--suluu-toast-offset)] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100`,
          )}
          onClick={dismiss}
          onPointerDown={stopDragFromControl}
          type="button"
        >
          <CloseIcon />
        </button>

        {timed && !hasIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 bottom-2.5 block h-px overflow-hidden rounded-full bg-[var(--suluu-toast-track)]"
          >
            <motion.span
              className="block h-full origin-left bg-[var(--suluu-toast-neutral)]"
              data-slot="toast-progress"
              style={{ scaleX: remaining }}
            />
          </span>
        ) : null}
      </motion.div>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* Viewport                                                                   */
/* -------------------------------------------------------------------------- */

const ALIGN_CLASS: Record<ToastPlacement["align"], string> = {
  center: "left-1/2 -translate-x-1/2",
  left: "left-4 sm:left-6",
  right: "right-4 sm:right-6",
};

interface ToastViewportProps extends ToasterProps {
  store: ToastStore;
}

function ToastViewport({
  className,
  container,
  duration = DEFAULT_TOAST_DURATION,
  icons,
  label = "Notifications",
  max = DEFAULT_TOAST_MAX,
  motionIntensity = "default",
  position = "bottom-right",
  store,
  style,
}: ToastViewportProps) {
  const toasts = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
  const mounted = useIsHydrated();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragFreeze, setDragFreeze] = useState<boolean | null>(null);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const deckRef = useRef<HTMLElement>(null);
  const pinToFrontRef = useRef(true);
  const documentHidden = useDocumentHidden();
  const reducedMotion = useReducedMotion() ?? false;

  const placement = useMemo(() => resolveToastPlacement(position), [position]);
  const visible = useMemo(
    () => toasts.slice(0, Math.max(1, max)),
    [max, toasts],
  );
  const expanded = resolveDeckExpanded({ dragFreeze, focused, hovered });

  const onMeasure = useCallback((id: string, height: number) => {
    setHeights((previous) =>
      previous[id] === height ? previous : { ...previous, [id]: height },
    );
  }, []);

  // Each toast drops its own measurement on the way out, so the map holds one
  // entry per toast on screen rather than one per toast ever shown.
  const onRelease = useCallback((id: string) => {
    setHeights((previous) => {
      if (!(id in previous)) return previous;

      return Object.fromEntries(
        Object.entries(previous).filter(([key]) => key !== id),
      );
    });
  }, []);

  const layout = useMemo(
    () =>
      computeStackLayout({
        expanded,
        heights: visible.map((toast) => {
          const measured = heights[toast.id];
          return measured === undefined || measured <= 0
            ? TOAST_FALLBACK_HEIGHT
            : measured;
        }),
        sign: placement.sign,
      }),
    [expanded, heights, placement.sign, visible],
  );
  const scrollable = expanded && layout.contentHeight > layout.extent;
  const stackTransition = resolveStackTransition({
    expanded,
    preset: TOAST_MOTION_PRESETS[motionIntensity],
    reducedMotion,
  });

  const scrollToastIntoView = useCallback(
    (id: string) => {
      const node = deckRef.current;
      if (!node) return;

      const depth = visible.findIndex((toast) => toast.id === id);
      const entry = layout.entries[depth];
      if (!entry) return;

      node.scrollTop = resolveToastScrollTop({
        contentHeight: layout.contentHeight,
        edge: placement.edge,
        scrollTop: node.scrollTop,
        toastHeight: entry.height,
        toastY: entry.y,
        viewportHeight: node.clientHeight,
      });
    },
    [layout, placement.edge, visible],
  );

  useIsomorphicLayoutEffect(() => {
    const node = deckRef.current;
    if (!node) return;

    if (!expanded) {
      // Collapsed layout has no overflow. Zeroing scroll is safe because the
      // list is pinned to the same edge as the cards — a bottom deck stays in
      // the corner while the viewport springs shut.
      node.scrollTop = 0;
      pinToFrontRef.current = true;
      return;
    }

    if (!pinToFrontRef.current) return;

    node.scrollTop =
      placement.edge === "bottom"
        ? Math.max(0, node.scrollHeight - node.clientHeight)
        : 0;
  }, [expanded, layout.contentHeight, layout.extent, placement.edge]);

  const onDismiss = useCallback(
    (id: string) => {
      store.dismiss(id);
    },
    [store],
  );

  const onDragStateChange = useCallback(
    (dragging: boolean) => {
      setDragFreeze(dragging ? hovered || focused : null);
    },
    [focused, hovered],
  );

  // Bound natively so the list keeps plain list semantics instead of carrying
  // an interaction handler a non-interactive element should not have.
  useEffect(() => {
    const node = deckRef.current;
    if (!node) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape") return;

      const id = (event.target as HTMLElement | null)
        ?.closest<HTMLElement>("[data-suluu-toast-id]")
        ?.getAttribute("data-suluu-toast-id");
      if (!id) return;

      event.preventDefault();
      store.dismiss(id);
    };

    node.addEventListener("keydown", handleKeyDown);
    return () => {
      node.removeEventListener("keydown", handleKeyDown);
    };
    // `mounted` is what puts the list in the DOM, so it gates the binding.
  }, [mounted, store]);

  if (!mounted) return null;
  if (container === null) return null;

  const target = container ?? document.body;

  return createPortal(
    <div
      className={joinClassNames(
        "pointer-events-none z-[100]",
        container ? "absolute inset-0" : "fixed inset-0",
      )}
      data-slot="toast-viewport"
    >
      {/* A named landmark, so the deck is somewhere a screen reader can go
          back to rather than content adrift outside every region. */}
      <motion.section
        animate={{ height: layout.extent }}
        aria-label={label}
        className={joinClassNames(
          "pointer-events-auto absolute flex w-[min(24rem,calc(100%-2rem))] [scrollbar-width:thin] [scrollbar-color:var(--suluu-toast-border)_transparent] flex-col overflow-x-hidden overscroll-y-contain [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--suluu-toast-border)] [&::-webkit-scrollbar-track]:bg-transparent",
          scrollable ? "overflow-y-auto" : "overflow-hidden",
          placement.edge === "top" ? "top-4 sm:top-6" : "bottom-4 sm:bottom-6",
          ALIGN_CLASS[placement.align],
          className,
        )}
        data-expanded={expanded ? "" : undefined}
        data-scrollable={scrollable ? "" : undefined}
        initial={false}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocused(false);
          }
        }}
        onFocus={(event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;

          const keyboard = isFocusVisibleTarget(target);
          // A click on a toast surface focuses the landmark (`tabIndex={-1}`).
          // Blur it so the next Tab is not trapped in the deck.
          if (!keyboard && target === event.currentTarget) {
            target.blur();
          }

          setFocused(keyboard);
          if (!keyboard) return;

          const id = target
            .closest<HTMLElement>("[data-suluu-toast-id]")
            ?.getAttribute("data-suluu-toast-id");
          if (id) scrollToastIntoView(id);
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onScroll={() => {
          const node = deckRef.current;
          if (!node || !expanded) return;

          const maxScroll = node.scrollHeight - node.clientHeight;
          pinToFrontRef.current =
            placement.edge === "bottom"
              ? maxScroll - node.scrollTop <= 1
              : node.scrollTop <= 1;
        }}
        ref={deckRef}
        style={{ ...style }}
        tabIndex={-1}
        transition={stackTransition}
      >
        <ol
          className={joinClassNames(
            "relative shrink-0 list-none [overflow-anchor:none]",
            placement.edge === "bottom" && "mt-auto",
          )}
          style={{ height: layout.contentHeight }}
        >
          <AnimatePresence>
            {visible.map((record, depth) => (
              <ToastItem
                duration={record.duration ?? duration}
                entry={
                  layout.entries[depth] ?? {
                    contentOpacity: 1,
                    height: TOAST_FALLBACK_HEIGHT,
                    interactive: true,
                    scale: 1,
                    y: 0,
                    zIndex: 1,
                  }
                }
                expanded={expanded}
                icons={icons}
                intensity={motionIntensity}
                key={record.id}
                onDismiss={onDismiss}
                onDragStateChange={onDragStateChange}
                onMeasure={onMeasure}
                onRelease={onRelease}
                paused={
                  expanded || documentHidden || depth >= TOAST_STACK_VISIBLE
                }
                placement={placement}
                record={record}
                reducedMotion={reducedMotion}
              />
            ))}
          </AnimatePresence>
        </ol>
      </motion.section>
    </div>,
    target,
  );
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * An independent store, `toast` function, and `<Toaster />`. Most apps use the
 * default instance exported below; a second instance is what keeps two
 * previews on one page — or two tests — from sharing a queue.
 */
export function createToaster(): ToasterInstance {
  const store = createToastStore();
  let sequence = 0;

  function push(
    title: ReactNode,
    options: ToastOptions = {},
    variant?: ToastVariant,
  ): string {
    sequence += 1;

    return store.add({
      ...options,
      id: `suluu-toast-${String(sequence)}`,
      title,
      variant: variant ?? options.variant ?? "default",
    });
  }

  const toast = ((title: ReactNode, options?: ToastOptions) =>
    push(title, options)) as ToastHandle;

  toast.success = (title, options) => push(title, options, "success");
  toast.error = (title, options) => push(title, options, "error");
  toast.warning = (title, options) => push(title, options, "warning");
  toast.info = (title, options) => push(title, options, "info");
  toast.dismiss = (id) => {
    if (id === undefined) store.dismissAll();
    else store.dismiss(id);
  };

  function Toaster(props: ToasterProps) {
    return <ToastViewport {...props} store={store} />;
  }
  Toaster.displayName = "Toaster";

  return { Toaster, toast };
}

const defaultToaster = createToaster();

export const Toaster = defaultToaster.Toaster;
export const toast = defaultToaster.toast;
