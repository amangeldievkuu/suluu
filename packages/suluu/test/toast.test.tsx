import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  computeStackLayout,
  createToaster,
  createToastStore,
  DEFAULT_TOAST_MAX,
  resolveDeckExpanded,
  resolveStackTransition,
  resolveSwipeDismiss,
  resolveSwipeThrow,
  resolveToastOrigin,
  resolveToastOriginPoint,
  resolveToastPlacement,
  resolveToastScrollTop,
  TOAST_MOTION_PRESETS,
  TOAST_EXPANDED_VISIBLE,
  TOAST_GAP,
  TOAST_PEEK,
  TOAST_SCALE_STEP,
  TOAST_STACK_VISIBLE,
  TOAST_SWIPE_THROW,
  TOAST_SWIPE_VELOCITY,
  type ToastRecord,
  type ToasterInstance,
} from "../src/toast/toast";

afterEach(() => {
  vi.restoreAllMocks();
});

function record(id: string, overrides: Partial<ToastRecord> = {}): ToastRecord {
  return { id, title: id, variant: "default", ...overrides };
}

function mockFocusVisible(element: Element, visible = true) {
  vi.spyOn(element, "matches").mockImplementation(
    (selector) => visible && selector === ":focus-visible",
  );
}

/** A fresh instance per test, so no queue is ever shared between them. */
function setup(): ToasterInstance {
  return createToaster();
}

async function pause(ms: number) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe("resolveToastPlacement", () => {
  it("grows downward from the top edge and upward from the bottom", () => {
    expect(resolveToastPlacement("top-right").sign).toBe(1);
    expect(resolveToastPlacement("bottom-right").sign).toBe(-1);
    expect(resolveToastPlacement("top-left").edge).toBe("top");
    expect(resolveToastPlacement("bottom-center").edge).toBe("bottom");
  });

  it("swipes outward toward the anchored side", () => {
    expect(resolveToastPlacement("bottom-right").swipe).toBe(1);
    expect(resolveToastPlacement("top-left").swipe).toBe(-1);
  });

  it("accepts either direction when centered", () => {
    expect(resolveToastPlacement("top-center").swipe).toBe(0);
    expect(resolveToastPlacement("bottom-center").swipe).toBe(0);
  });
});

describe("resolveToastOrigin", () => {
  it("scales from the pinned corner so receding cards share an edge", () => {
    expect(resolveToastOrigin(resolveToastPlacement("top-left"))).toBe(
      "origin-top-left",
    );
    expect(resolveToastOrigin(resolveToastPlacement("top-center"))).toBe(
      "origin-top",
    );
    expect(resolveToastOrigin(resolveToastPlacement("top-right"))).toBe(
      "origin-top-right",
    );
    expect(resolveToastOrigin(resolveToastPlacement("bottom-left"))).toBe(
      "origin-bottom-left",
    );
    expect(resolveToastOrigin(resolveToastPlacement("bottom-center"))).toBe(
      "origin-bottom",
    );
    expect(resolveToastOrigin(resolveToastPlacement("bottom-right"))).toBe(
      "origin-bottom-right",
    );
  });

  it("feeds Motion the same corner as a 0–1 origin point", () => {
    expect(
      resolveToastOriginPoint(resolveToastPlacement("bottom-right")),
    ).toEqual({ originX: 1, originY: 1 });
    expect(resolveToastOriginPoint(resolveToastPlacement("top-left"))).toEqual({
      originX: 0,
      originY: 0,
    });
    expect(
      resolveToastOriginPoint(resolveToastPlacement("top-center")),
    ).toEqual({ originX: 0.5, originY: 0 });
  });
});

describe("resolveDeckExpanded", () => {
  it("opens on hover or focus while idle", () => {
    expect(
      resolveDeckExpanded({ dragFreeze: null, focused: false, hovered: true }),
    ).toBe(true);
    expect(
      resolveDeckExpanded({ dragFreeze: null, focused: true, hovered: false }),
    ).toBe(true);
    expect(
      resolveDeckExpanded({ dragFreeze: null, focused: false, hovered: false }),
    ).toBe(false);
  });

  it("keeps a collapsed swipe collapsed even if hover would have opened it", () => {
    expect(
      resolveDeckExpanded({ dragFreeze: false, focused: false, hovered: true }),
    ).toBe(false);
  });

  it("keeps an expanded swipe expanded after the pointer leaves the deck", () => {
    expect(
      resolveDeckExpanded({ dragFreeze: true, focused: false, hovered: false }),
    ).toBe(true);
  });
});

describe("resolveStackTransition", () => {
  it("opens with the intensity spring", () => {
    expect(
      resolveStackTransition({
        expanded: true,
        preset: TOAST_MOTION_PRESETS.default,
        reducedMotion: false,
      }),
    ).toEqual(TOAST_MOTION_PRESETS.default.spring);
  });

  it("collapses with extra damping so the peek settles instead of bouncing", () => {
    for (const intensity of ["subtle", "default", "expressive"] as const) {
      const preset = TOAST_MOTION_PRESETS[intensity];
      expect(
        resolveStackTransition({
          expanded: false,
          preset,
          reducedMotion: false,
        }),
      ).toEqual({
        damping: preset.collapseDamping,
        mass: preset.spring.mass,
        stiffness: preset.spring.stiffness,
        type: "spring",
      });
      expect(preset.collapseDamping).toBeGreaterThan(preset.spring.damping);
    }
  });

  it("settles instantly when the user prefers reduced motion", () => {
    expect(
      resolveStackTransition({
        expanded: false,
        preset: TOAST_MOTION_PRESETS.expressive,
        reducedMotion: true,
      }),
    ).toEqual({ duration: 0 });
  });
});

describe("computeStackLayout", () => {
  it("returns nothing for an empty deck", () => {
    expect(
      computeStackLayout({ expanded: false, heights: [], sign: -1 }),
    ).toEqual({ contentHeight: 0, entries: [], extent: 0 });
  });

  it("borrows the front height while collapsed so nothing pokes out", () => {
    const { entries } = computeStackLayout({
      expanded: false,
      heights: [64, 96, 120],
      sign: -1,
    });

    expect(entries.map((entry) => entry.height)).toEqual([64, 64, 64]);
  });

  it("recedes each collapsed toast by one peek and one scale step", () => {
    const { entries } = computeStackLayout({
      expanded: false,
      heights: [64, 64, 64],
      sign: -1,
    });

    expect(entries.map((entry) => entry.y)).toEqual([
      0,
      -TOAST_PEEK,
      -2 * TOAST_PEEK,
    ]);
    expect(entries.map((entry) => entry.scale)).toEqual([
      1,
      1 - TOAST_SCALE_STEP,
      1 - 2 * TOAST_SCALE_STEP,
    ]);
  });

  it("hides the content of every collapsed toast but the front one", () => {
    const { entries } = computeStackLayout({
      expanded: false,
      heights: [64, 64, 64],
      sign: -1,
    });

    expect(entries.map((entry) => entry.contentOpacity)).toEqual([1, 0, 0]);
  });

  it("stacks expanded toasts on a running total of their own heights", () => {
    const { entries } = computeStackLayout({
      expanded: true,
      heights: [40, 60, 80],
      sign: -1,
    });

    expect(entries.map((entry) => entry.y)).toEqual([
      0,
      -(40 + TOAST_GAP),
      -(40 + TOAST_GAP + 60 + TOAST_GAP),
    ]);
    expect(entries.map((entry) => entry.height)).toEqual([40, 60, 80]);
    expect(entries.map((entry) => entry.scale)).toEqual([1, 1, 1]);
    expect(entries.map((entry) => entry.contentOpacity)).toEqual([1, 1, 1]);
  });

  it("mirrors the offsets for a deck anchored to the top", () => {
    const { entries } = computeStackLayout({
      expanded: true,
      heights: [40, 60],
      sign: 1,
    });

    expect(entries.map((entry) => entry.y)).toEqual([0, 40 + TOAST_GAP]);
  });

  it("measures the deck's bounding box in both states", () => {
    const heights = [40, 60, 80];
    const collapsed = computeStackLayout({
      expanded: false,
      heights,
      sign: -1,
    });
    const opened = computeStackLayout({
      expanded: true,
      heights,
      sign: -1,
    });

    expect(collapsed.extent).toBe(40 + 2 * TOAST_PEEK);
    expect(collapsed.contentHeight).toBe(collapsed.extent);
    expect(opened.extent).toBe(40 + 60 + 80 + 2 * TOAST_GAP);
    expect(opened.contentHeight).toBe(opened.extent);
  });

  it("peeks at most four toasts while collapsed", () => {
    const heights = Array.from({ length: 8 }, () => 64);
    const layout = computeStackLayout({
      expanded: false,
      heights,
      sign: -1,
    });

    expect(layout.extent).toBe(64 + (TOAST_STACK_VISIBLE - 1) * TOAST_PEEK);
    expect(layout.contentHeight).toBe(layout.extent);
    expect(layout.entries.map((entry) => entry.y)).toEqual([
      0,
      -TOAST_PEEK,
      -2 * TOAST_PEEK,
      -3 * TOAST_PEEK,
      -3 * TOAST_PEEK,
      -3 * TOAST_PEEK,
      -3 * TOAST_PEEK,
      -3 * TOAST_PEEK,
    ]);
  });

  it("keeps every expanded toast in the list but clips the viewport to three", () => {
    const heights = [40, 50, 60, 70, 80, 90];
    const layout = computeStackLayout({
      expanded: true,
      heights,
      sign: -1,
    });

    expect(layout.contentHeight).toBe(
      40 + 50 + 60 + 70 + 80 + 90 + 5 * TOAST_GAP,
    );
    expect(layout.extent).toBe(40 + 50 + 60 + 2 * TOAST_GAP);
    expect(layout.entries).toHaveLength(6);
    expect(layout.entries.map((entry) => entry.contentOpacity)).toEqual([
      1, 1, 1, 1, 1, 1,
    ]);
    expect(layout.entries[3]?.y).toBe(
      -(40 + TOAST_GAP + 50 + TOAST_GAP + 60 + TOAST_GAP),
    );
  });

  it("does not clip collapsed decks of four or fewer", () => {
    const heights = [40, 50, 60, 70];
    const collapsed = computeStackLayout({
      expanded: false,
      heights,
      sign: -1,
    });
    expect(collapsed.extent).toBe(40 + 3 * TOAST_PEEK);
  });

  it("does not scroll an expanded deck of three or fewer", () => {
    const layout = computeStackLayout({
      expanded: true,
      heights: [40, 50, 60],
      sign: -1,
    });

    expect(layout.extent).toBe(layout.contentHeight);
  });

  it("honours an expandedVisible override", () => {
    const layout = computeStackLayout({
      expanded: true,
      expandedVisible: 2,
      heights: [40, 50, 60, 70],
      sign: -1,
    });

    expect(layout.extent).toBe(40 + 50 + TOAST_GAP);
    expect(layout.contentHeight).toBe(40 + 50 + 60 + 70 + 3 * TOAST_GAP);
  });

  it("never shows fewer than one expanded toast in the viewport", () => {
    const layout = computeStackLayout({
      expanded: true,
      expandedVisible: 0,
      heights: [40, 50],
      sign: -1,
    });

    expect(layout.extent).toBe(40);
    expect(layout.contentHeight).toBe(40 + 50 + TOAST_GAP);
  });

  it("never scales a deep toast past zero", () => {
    const { entries } = computeStackLayout({
      collapsedVisible: 40,
      expanded: false,
      heights: Array.from({ length: 40 }, () => 64),
      scaleStep: 0.1,
      sign: -1,
    });

    expect(entries.at(-1)?.scale).toBe(0);
  });

  it("paints the front of the deck above the cards behind it", () => {
    const { entries } = computeStackLayout({
      expanded: false,
      heights: [40, 60, 80],
      sign: -1,
    });

    expect(entries.map((entry) => entry.zIndex)).toEqual([3, 2, 1]);
  });

  it("only lets the front card take pointer events while collapsed", () => {
    const collapsed = computeStackLayout({
      expanded: false,
      heights: [40, 60, 80],
      sign: -1,
    });
    const opened = computeStackLayout({
      expanded: true,
      heights: [40, 60, 80],
      sign: -1,
    });

    expect(collapsed.entries.map((entry) => entry.interactive)).toEqual([
      true,
      false,
      false,
    ]);
    expect(opened.entries.map((entry) => entry.interactive)).toEqual([
      true,
      true,
      true,
    ]);
  });
});

describe("resolveToastScrollTop", () => {
  const contentHeight = 40 + 50 + 60 + 70 + 3 * TOAST_GAP;
  const viewportHeight = 40 + 50 + 60 + 2 * TOAST_GAP;

  it("stays at the origin when the deck fits", () => {
    expect(
      resolveToastScrollTop({
        contentHeight: 120,
        edge: "top",
        scrollTop: 0,
        toastHeight: 40,
        toastY: 0,
        viewportHeight: 200,
      }),
    ).toBe(0);
  });

  it("scrolls a top deck down to a toast below the fold", () => {
    const toastY = 40 + TOAST_GAP + 50 + TOAST_GAP + 60 + TOAST_GAP;

    expect(
      resolveToastScrollTop({
        contentHeight,
        edge: "top",
        scrollTop: 0,
        toastHeight: 70,
        toastY,
        viewportHeight,
      }),
    ).toBe(contentHeight - viewportHeight);
  });

  it("scrolls a bottom deck up to an older toast", () => {
    const toastY = -(40 + TOAST_GAP + 50 + TOAST_GAP + 60 + TOAST_GAP);

    expect(
      resolveToastScrollTop({
        contentHeight,
        edge: "bottom",
        scrollTop: contentHeight - viewportHeight,
        toastHeight: 70,
        toastY,
        viewportHeight,
      }),
    ).toBe(0);
  });

  it("leaves a visible toast where it is", () => {
    expect(
      resolveToastScrollTop({
        contentHeight,
        edge: "top",
        scrollTop: 0,
        toastHeight: 40,
        toastY: 0,
        viewportHeight,
      }),
    ).toBe(0);
  });

  it("scrolls a top deck back to a toast above the fold", () => {
    expect(
      resolveToastScrollTop({
        contentHeight,
        edge: "top",
        scrollTop: contentHeight - viewportHeight,
        toastHeight: 40,
        toastY: 0,
        viewportHeight,
      }),
    ).toBe(0);
  });
});

describe("resolveSwipeDismiss", () => {
  const width = 384;

  it("dismisses once the swipe crosses a third of the width", () => {
    expect(
      resolveSwipeDismiss({ direction: 1, offset: 140, velocity: 0, width }),
    ).toBe(true);
    expect(
      resolveSwipeDismiss({ direction: 1, offset: 90, velocity: 0, width }),
    ).toBe(false);
  });

  it("keeps a minimum threshold for narrow toasts", () => {
    expect(
      resolveSwipeDismiss({ direction: 1, offset: 40, velocity: 0, width: 60 }),
    ).toBe(false);
    expect(
      resolveSwipeDismiss({ direction: 1, offset: 60, velocity: 0, width: 60 }),
    ).toBe(true);
  });

  it("dismisses a short but fast flick", () => {
    expect(
      resolveSwipeDismiss({
        direction: 1,
        offset: 20,
        velocity: TOAST_SWIPE_VELOCITY,
        width,
      }),
    ).toBe(true);
  });

  it("ignores a fast flick that has barely moved", () => {
    expect(
      resolveSwipeDismiss({
        direction: 1,
        offset: 4,
        velocity: 2000,
        width,
      }),
    ).toBe(false);
  });

  it("ignores travel in the wrong direction", () => {
    expect(
      resolveSwipeDismiss({
        direction: 1,
        offset: -300,
        velocity: -900,
        width,
      }),
    ).toBe(false);
    expect(
      resolveSwipeDismiss({ direction: -1, offset: -300, velocity: 0, width }),
    ).toBe(true);
  });

  it("accepts either direction when the deck is centered", () => {
    expect(
      resolveSwipeDismiss({ direction: 0, offset: -300, velocity: 0, width }),
    ).toBe(true);
    expect(
      resolveSwipeDismiss({ direction: 0, offset: 300, velocity: 0, width }),
    ).toBe(true);
  });
});

describe("resolveSwipeThrow", () => {
  it("throws outward from a corner regardless of the swipe", () => {
    expect(resolveSwipeThrow(1, 30)).toBe(TOAST_SWIPE_THROW);
    expect(resolveSwipeThrow(-1, 30)).toBe(-TOAST_SWIPE_THROW);
  });

  it("follows the swipe when the deck is centered", () => {
    expect(resolveSwipeThrow(0, 30)).toBe(TOAST_SWIPE_THROW);
    expect(resolveSwipeThrow(0, -30)).toBe(-TOAST_SWIPE_THROW);
  });
});

describe("createToastStore", () => {
  it("puts the newest toast at the front of the deck", () => {
    const store = createToastStore();
    store.add(record("a"));
    store.add(record("b"));

    expect(store.getSnapshot().map((toast) => toast.id)).toEqual(["b", "a"]);
  });

  it("keeps the snapshot referentially stable between changes", () => {
    const store = createToastStore();
    const empty = store.getSnapshot();

    expect(store.getSnapshot()).toBe(empty);
    store.add(record("a"));
    const one = store.getSnapshot();
    expect(store.getSnapshot()).toBe(one);

    store.dismiss("missing");
    expect(store.getSnapshot()).toBe(one);
  });

  it("notifies subscribers until they unsubscribe", () => {
    const store = createToastStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.add(record("a"));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.add(record("b"));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("runs onClose for a single dismissal and for a clear-all", () => {
    const store = createToastStore();
    const onClose = vi.fn();

    store.add(record("a", { onClose }));
    store.dismiss("a");
    expect(onClose).toHaveBeenCalledWith("a");

    store.add(record("b", { onClose }));
    store.add(record("c", { onClose }));
    store.dismissAll();
    expect(onClose).toHaveBeenCalledWith("b");
    expect(onClose).toHaveBeenCalledWith("c");
    expect(store.getSnapshot()).toHaveLength(0);
  });

  it("ignores a clear-all on an empty deck", () => {
    const store = createToastStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.dismissAll();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("createToaster", () => {
  it("assigns the variant from the helper that was called", () => {
    const { toast } = setup();
    const ids = [
      toast("Plain"),
      toast.success("Saved"),
      toast.error("Failed"),
      toast.warning("Careful"),
      toast.info("Heads up"),
    ];

    expect(new Set(ids).size).toBe(5);
  });

  it("honours an explicit variant on the bare call", () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("Careful", { variant: "warning" });
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("returns an id that dismisses that toast", async () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    let id = "";
    act(() => {
      id = toast("Saved", { duration: Infinity });
    });
    expect(screen.getByText("Saved")).toBeInTheDocument();

    act(() => {
      toast.dismiss(id);
    });
    await waitFor(() => {
      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    });
  });

  it("clears every toast when dismiss is called without an id", async () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
    });
    expect(screen.getAllByRole("status")).toHaveLength(2);

    act(() => {
      toast.dismiss();
    });
    await waitFor(() => {
      expect(screen.queryAllByRole("status")).toHaveLength(0);
    });
  });

  it("keeps two instances from sharing a queue", () => {
    const first = setup();
    const second = setup();
    render(
      <>
        <first.Toaster label="First" />
        <second.Toaster label="Second" />
      </>,
    );

    act(() => {
      first.toast("Only mine", { duration: Infinity });
    });

    expect(
      within(screen.getByRole("region", { name: "First" })).getByText(
        "Only mine",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Second" })).queryByText(
        "Only mine",
      ),
    ).not.toBeInTheDocument();
  });
});

describe("Toaster", () => {
  it("renders the title and the optional description", async () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast.success("Draft saved", {
        description: "Synced 2 seconds ago",
        duration: Infinity,
      });
    });

    // Waiting on visibility also proves the enter animation resolves.
    await waitFor(() => {
      expect(screen.getByText("Draft saved")).toBeVisible();
    });
    expect(screen.getByText("Synced 2 seconds ago")).toBeVisible();
  });

  it("names the deck so the landmark is findable", () => {
    const { Toaster } = setup();
    render(<Toaster />);

    expect(
      screen.getByRole("region", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  it("interrupts for errors and warnings, and waits its turn otherwise", () => {
    const { Toaster, toast } = setup();
    render(<Toaster max={5} />);

    act(() => {
      toast.error("Failed", { duration: Infinity });
      toast.success("Saved", { duration: Infinity });
    });

    const alert = screen.getByRole("alert");
    const status = screen.getByRole("status");

    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(alert).toHaveAttribute("aria-atomic", "true");
  });

  it("renders no more than max toasts at a time", () => {
    const { Toaster, toast } = setup();
    render(<Toaster max={2} />);

    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
      toast("Three", { duration: Infinity });
    });

    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.queryByText("One")).not.toBeInTheDocument();
  });

  it("promotes a queued toast once one ahead of it leaves", async () => {
    const { Toaster, toast } = setup();
    render(<Toaster max={1} />);

    let newest = "";
    act(() => {
      toast("One", { duration: Infinity });
      newest = toast("Two", { duration: Infinity });
    });
    // Newest is the front of the deck, so the older one is what waits.
    expect(screen.getByText("Two")).toBeInTheDocument();
    expect(screen.queryByText("One")).not.toBeInTheDocument();

    act(() => {
      toast.dismiss(newest);
    });
    await waitFor(() => {
      expect(screen.getByText("One")).toBeInTheDocument();
    });
  });

  it("defaults to peeking four inside a deck of eight, three expanded at a time", () => {
    expect(DEFAULT_TOAST_MAX).toBe(8);
    expect(TOAST_STACK_VISIBLE).toBe(4);
    expect(TOAST_EXPANDED_VISIBLE).toBe(3);
  });

  it("keeps six toasts in the deck and shows all of them on hover", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
      toast("Three", { duration: Infinity });
      toast("Four", { duration: Infinity });
      toast("Five", { duration: Infinity });
      toast("Six", { duration: Infinity });
    });

    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Six")).toBeInTheDocument();

    const deck = screen.getByRole("region", { name: "Notifications" });
    expect(deck).not.toHaveAttribute("data-expanded");
    expect(deck).not.toHaveAttribute("data-scrollable");

    await user.hover(deck);
    expect(deck).toHaveAttribute("data-expanded");
    expect(deck).toHaveAttribute("data-scrollable");
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Six")).toBeInTheDocument();

    await user.unhover(deck);
    expect(deck).not.toHaveAttribute("data-expanded");
    expect(deck).not.toHaveAttribute("data-scrollable");
  });

  it("pins a bottom deck's list to the end so collapse cannot jump off the corner", () => {
    const { Toaster, toast } = setup();
    render(<Toaster position="bottom-right" />);

    act(() => {
      toast("One", { duration: Infinity });
    });

    const deck = screen.getByRole("region", { name: "Notifications" });
    const list = deck.querySelector("ol");

    expect(deck.className).toContain("flex");
    expect(deck.className).toContain("flex-col");
    expect(list?.className).toContain("mt-auto");
  });

  it("keeps a top deck's list at the start", () => {
    const { Toaster, toast } = setup();
    render(<Toaster position="top-right" />);

    act(() => {
      toast("One", { duration: Infinity });
    });

    const list = screen
      .getByRole("region", { name: "Notifications" })
      .querySelector("ol");

    expect(list?.className).not.toContain("mt-auto");
  });

  it("does not scroll an expanded deck of three", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
      toast("Three", { duration: Infinity });
    });

    const deck = screen.getByRole("region", { name: "Notifications" });
    await user.hover(deck);
    expect(deck).toHaveAttribute("data-expanded");
    expect(deck).not.toHaveAttribute("data-scrollable");
  });

  it("pins a top deck to the start of the list when it opens", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster position="top-right" />);

    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
      toast("Three", { duration: Infinity });
      toast("Four", { duration: Infinity });
    });

    const deck = screen.getByRole("region", { name: "Notifications" });
    await user.hover(deck);
    expect(deck).toHaveAttribute("data-scrollable");
    expect(deck.scrollTop).toBe(0);

    act(() => {
      deck.scrollTop = 24;
      deck.dispatchEvent(new Event("scroll"));
      toast("Five", { duration: Infinity });
    });
    expect(deck).toHaveAttribute("data-scrollable");
    expect(screen.getByText("Five")).toBeInTheDocument();
  });

  it("scrolls an older toast into view once it receives focus", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
      toast("Three", { duration: Infinity });
      toast("Four", { duration: Infinity });
    });

    const deck = screen.getByRole("region", { name: "Notifications" });
    await user.hover(deck);

    const close = within(
      screen.getByText("One").closest("li") as HTMLElement,
    ).getByRole("button", { name: /Dismiss/ });
    mockFocusVisible(close);

    act(() => {
      deck.dispatchEvent(new Event("scroll"));
      close.focus();
    });

    expect(deck).toHaveAttribute("data-expanded");
  });

  it("holds toasts behind the collapsed peek until they are promoted", async () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    const front: string[] = [];
    act(() => {
      toast("Waiting", { duration: 80 });
      front.push(toast("Four", { duration: Infinity }));
      front.push(toast("Three", { duration: Infinity }));
      front.push(toast("Two", { duration: Infinity }));
      front.push(toast("One", { duration: Infinity }));
    });

    await pause(220);
    expect(screen.getByText("Waiting")).toBeInTheDocument();

    act(() => {
      for (const id of front) toast.dismiss(id);
    });

    await waitFor(
      () => {
        expect(screen.queryByText("Waiting")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("dismisses itself once its duration elapses", async () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast.success("Draft saved", { duration: 80 });
    });
    expect(screen.getByText("Draft saved")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText("Draft saved")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("stays until dismissed when the duration is infinite", async () => {
    const { Toaster, toast } = setup();
    render(<Toaster duration={40} />);

    act(() => {
      toast("Persistent", { duration: Infinity });
    });

    await pause(220);
    expect(screen.getByText("Persistent")).toBeInTheDocument();
  });

  it("holds the toast while the deck is hovered", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("Hover me", { duration: 120 });
    });
    await user.hover(screen.getByRole("region", { name: "Notifications" }));

    await pause(400);
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("expands the deck on hover and collapses it again", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
    });
    const deck = screen.getByRole("region", { name: "Notifications" });
    expect(deck).not.toHaveAttribute("data-expanded");

    await user.hover(deck);
    expect(deck).toHaveAttribute("data-expanded");

    await user.unhover(deck);
    expect(deck).not.toHaveAttribute("data-expanded");
  });

  it("expands the deck when keyboard focus lands inside it", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("One", { duration: Infinity });
    });
    const deck = screen.getByRole("region", { name: "Notifications" });
    const close = screen.getByRole("button", { name: /Dismiss/ });
    mockFocusVisible(close);

    await user.click(document.body);
    act(() => {
      close.focus();
    });
    expect(deck).toHaveAttribute("data-expanded");

    act(() => {
      close.blur();
    });
    await waitFor(() => {
      expect(deck).not.toHaveAttribute("data-expanded");
    });
  });

  it("does not keep the deck expanded after a pointer click leaves", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
    });

    const deck = screen.getByRole("region", { name: "Notifications" });
    await user.hover(deck);
    await user.click(screen.getByText("Two"));
    mockFocusVisible(deck, false);
    act(() => {
      deck.focus();
    });
    await user.unhover(deck);

    expect(deck).not.toHaveAttribute("data-expanded");
  });

  it("does not hold the deck open for pointer focus on a control", () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("One", { duration: Infinity });
    });

    const deck = screen.getByRole("region", { name: "Notifications" });
    const close = screen.getByRole("button", { name: /Dismiss/ });
    mockFocusVisible(close, false);

    act(() => {
      close.focus();
    });

    expect(deck).not.toHaveAttribute("data-expanded");
  });

  it("resumes the countdown after a pointer click when the pointer leaves", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("Hover me", { duration: 80 });
    });

    const deck = screen.getByRole("region", { name: "Notifications" });
    await user.hover(deck);
    await user.click(screen.getByText("Hover me"));
    mockFocusVisible(deck, false);
    act(() => {
      deck.focus();
    });
    await user.unhover(deck);

    await waitFor(
      () => {
        expect(screen.queryByText("Hover me")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("runs the action, then dismisses the toast", async () => {
    const { Toaster, toast } = setup();
    const onClick = vi.fn();
    render(<Toaster />);

    let id = "";
    act(() => {
      id = toast("Draft deleted", {
        action: { label: "Undo", onClick },
        duration: Infinity,
      });
    });

    const undo = screen.getByRole("button", { name: "Undo" });
    act(() => {
      undo.click();
      undo.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(id);
    await waitFor(() => {
      expect(screen.queryByText("Draft deleted")).not.toBeInTheDocument();
    });
  });

  it("dismisses from the close button", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    const onClose = vi.fn();
    render(<Toaster />);

    act(() => {
      toast("Closable", { duration: Infinity, onClose });
    });

    await user.click(screen.getByRole("button", { name: /Dismiss/ }));
    await waitFor(() => {
      expect(screen.queryByText("Closable")).not.toBeInTheDocument();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses the focused toast on Escape", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster max={5} />);

    act(() => {
      toast("First", { duration: Infinity });
      toast("Second", { duration: Infinity });
    });

    const second = screen.getByText("Second").closest("li");
    act(() => {
      within(second as HTMLElement)
        .getByRole("button", { name: /Dismiss/ })
        .focus();
    });
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("Second")).not.toBeInTheDocument();
    });
    expect(screen.getByText("First")).toBeInTheDocument();
  });

  it("ignores Escape pressed outside any toast", async () => {
    const user = userEvent.setup();
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("Still here", { duration: Infinity });
    });
    act(() => {
      screen.getByRole("region", { name: "Notifications" }).focus();
    });
    await user.keyboard("{Escape}");

    expect(screen.getByText("Still here")).toBeInTheDocument();
  });

  it("draws a default icon for every variant but the plain one", () => {
    const { Toaster, toast } = setup();
    render(<Toaster max={5} />);

    act(() => {
      toast("Plain", { duration: Infinity });
      toast.success("Saved", { duration: Infinity });
      toast.error("Failed", { duration: Infinity });
      toast.warning("Careful", { duration: Infinity });
      toast.info("Heads up", { duration: Infinity });
    });

    for (const [title, variant] of [
      ["Saved", "success"],
      ["Failed", "error"],
      ["Careful", "warning"],
      ["Heads up", "info"],
    ] as const) {
      const item = screen.getByText(title).closest("li");
      expect(item).toHaveAttribute("data-variant", variant);
      expect(item?.querySelector('[data-slot="toast-icon"]')).not.toBeNull();
    }

    expect(
      screen
        .getByText("Plain")
        .closest("li")
        ?.querySelector('[data-slot="toast-icon"]'),
    ).toBeNull();
  });

  it("lets a single toast override its icon", () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast.success("Saved", {
        duration: Infinity,
        icon: <span data-testid="custom-icon" />,
      });
    });

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("lets the viewport override a whole variant's icon", () => {
    const { Toaster, toast } = setup();
    render(<Toaster icons={{ info: <span data-testid="house-info" /> }} />);

    act(() => {
      toast.info("Heads up", { duration: Infinity });
    });

    expect(screen.getByTestId("house-info")).toBeInTheDocument();
  });

  it("shows the depleting ring only while a toast is timed", () => {
    const { Toaster, toast } = setup();
    render(<Toaster max={5} />);

    act(() => {
      toast.success("Timed", { duration: 5000 });
      toast.success("Forever", { duration: Infinity });
    });

    expect(
      screen
        .getByText("Timed")
        .closest("li")
        ?.querySelector('[data-slot="toast-progress"]'),
    ).not.toBeNull();
    expect(
      screen
        .getByText("Forever")
        .closest("li")
        ?.querySelector('[data-slot="toast-progress"]'),
    ).toBeNull();
  });

  it("draws a quiet hairline on a timed toast that has no icon to ring", () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("Plain", { duration: 5000 });
    });

    expect(
      screen
        .getByText("Plain")
        .closest("li")
        ?.querySelector('[data-slot="toast-progress"]'),
    ).not.toBeNull();
  });

  it("anchors the deck to the requested corner", () => {
    const { Toaster } = setup();
    const { rerender } = render(<Toaster position="top-left" />);
    const deck = screen.getByRole("region", { name: "Notifications" });

    expect(deck.className).toContain("top-4");
    expect(deck.className).toContain("left-4");
    expect(deck.className).not.toContain("left-0");

    rerender(<Toaster position="bottom-center" />);
    expect(deck.className).toContain("bottom-4");
    expect(deck.className).toContain("left-1/2");
  });

  it("scales each toast from the pinned corner of the deck", () => {
    const { Toaster, toast } = setup();
    render(<Toaster position="top-left" />);

    act(() => {
      toast("Pinned", { duration: Infinity });
    });

    expect(screen.getByText("Pinned").closest("li")?.className).toContain(
      "origin-top-left",
    );
  });

  it("gives the newest toast a higher z-index than the one behind it", () => {
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
    });

    const newest = screen.getByText("Two").closest("li") as HTMLElement;
    const older = screen.getByText("One").closest("li") as HTMLElement;

    expect(Number(newest.style.zIndex)).toBeGreaterThan(
      Number(older.style.zIndex),
    );
  });

  it("waits to portal until a null container becomes a real host", () => {
    const { Toaster, toast } = setup();
    const { rerender } = render(<Toaster container={null} />);

    act(() => {
      toast("Waiting", { duration: Infinity });
    });
    expect(screen.queryByText("Waiting")).not.toBeInTheDocument();

    const host = document.createElement("div");
    document.body.append(host);
    rerender(<Toaster container={host} />);

    expect(host.textContent).toContain("Waiting");
    host.remove();
  });

  it("portals into a container when one is given", () => {
    const { Toaster, toast } = setup();
    const host = document.createElement("div");
    document.body.append(host);

    render(<Toaster container={host} />);
    act(() => {
      toast("Scoped", { duration: Infinity });
    });

    expect(host.textContent).toContain("Scoped");
    host.remove();
  });

  it("forwards a class name and style to the deck", () => {
    const { Toaster } = setup();
    render(<Toaster className="custom-deck" style={{ zIndex: 12 }} />);
    const deck = screen.getByRole("region", { name: "Notifications" });

    expect(deck).toHaveClass("custom-deck");
    expect(deck).toHaveStyle({ zIndex: "12" });
  });

  it("holds the toast while the tab is hidden", async () => {
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast("Background", { duration: 60 });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await pause(300);
    expect(screen.getByText("Background")).toBeInTheDocument();
    hidden.mockRestore();
  });

  it("settles instantly when the user prefers reduced motion", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          addEventListener: () => undefined,
          addListener: () => undefined,
          dispatchEvent: () => false,
          matches: query.includes("reduce"),
          media: query,
          onchange: null,
          removeEventListener: () => undefined,
          removeListener: () => undefined,
        }) as MediaQueryList,
    );

    const { Toaster, toast } = setup();
    render(<Toaster />);

    act(() => {
      toast.success("Draft saved", { duration: 80 });
    });
    expect(screen.getByText("Draft saved")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText("Draft saved")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("supports every motion intensity", () => {
    const { Toaster, toast } = setup();

    for (const motionIntensity of [
      "subtle",
      "default",
      "expressive",
    ] as const) {
      const view = render(<Toaster motionIntensity={motionIntensity} />);
      act(() => {
        toast.success(`Saved ${motionIntensity}`, { duration: Infinity });
      });
      expect(screen.getByText(`Saved ${motionIntensity}`)).toBeInTheDocument();

      act(() => {
        toast.dismiss();
      });
      view.unmount();
    }
  });

  it("lets a single toast pick its own intensity", () => {
    const { Toaster, toast } = setup();
    render(<Toaster motionIntensity="subtle" />);

    act(() => {
      toast.success("Loud one", {
        duration: Infinity,
        motionIntensity: "expressive",
      });
    });

    expect(screen.getByText("Loud one")).toBeInTheDocument();
  });

  it("has no accessibility violations with a populated deck", async () => {
    const { Toaster, toast } = setup();
    render(<Toaster max={3} />);

    act(() => {
      toast.success("Draft saved", {
        description: "Synced 2 seconds ago",
        duration: Infinity,
      });
      toast.error("Upload failed", {
        action: { label: "Retry", onClick: () => undefined },
        duration: Infinity,
      });
      toast.info("2 new invites", { duration: Infinity });
    });

    expect(
      (
        await axe(document.body, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });

  it("renders nothing on the server", () => {
    const { Toaster } = setup();

    expect(renderToStaticMarkup(<Toaster />)).toBe("");
  });
});
