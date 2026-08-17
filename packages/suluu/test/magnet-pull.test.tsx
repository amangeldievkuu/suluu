import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  computeMagnetOffset,
  MagnetPull,
} from "../src/magnet-pull/magnet-pull";

interface Rect {
  height: number;
  left: number;
  top: number;
  width: number;
}

const BUTTON_RECT: Rect = { height: 60, left: 100, top: 100, width: 200 };

function makeDomRect({ height, left, top, width }: Rect): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    toJSON: () => ({}),
    top,
    width,
    x: left,
    y: top,
  };
}

function readTranslate(element: HTMLElement, axis: "X" | "Y"): number {
  const match = new RegExp(`translate${axis}\\((-?[\\d.]+)px\\)`).exec(
    element.style.transform,
  );
  const value = match?.[1];

  return value === undefined ? 0 : Number(value);
}

/**
 * jsdom has no layout, so stand in for it — and, critically, report the
 * *transformed* box the way a real browser does, so the component's rest-rect
 * compensation is actually under test.
 */
function mockRect(element: HTMLElement, rect: Rect) {
  return vi.spyOn(element, "getBoundingClientRect").mockImplementation(() =>
    makeDomRect({
      ...rect,
      left: rect.left + readTranslate(element, "X"),
      top: rect.top + readTranslate(element, "Y"),
    }),
  );
}

interface MediaState {
  hover: boolean;
  reducedMotion: boolean;
}

/**
 * `test/setup.ts` reports `matches: false` for every query, so the magnet is
 * inert unless a test opts in here. Listeners are captured so a test can flip a
 * preference the way a real browser would.
 */
function mockMediaQueries(state: MediaState) {
  const listeners = new Set<() => void>();
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        addEventListener: (_type: string, listener: () => void) => {
          listeners.add(listener);
        },
        addListener: () => undefined,
        dispatchEvent: () => false,
        matches: query.includes("prefers-reduced-motion")
          ? state.reducedMotion
          : state.hover,
        media: query,
        onchange: null,
        removeEventListener: (_type: string, listener: () => void) => {
          listeners.delete(listener);
        },
        removeListener: () => undefined,
      }) as unknown as MediaQueryList,
  );

  return {
    change(next: Partial<MediaState>) {
      Object.assign(state, next);
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
}

function movePointer(clientX: number, clientY: number) {
  fireEvent(window, new MouseEvent("pointermove", { clientX, clientY }));
}

/** Lets any scheduled animation frame run before asserting an absence. */
async function flushFrames() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        resolve();
      }, 32);
    });
  });
}

function renderMagnet(element: React.ReactElement) {
  const view = render(element);
  const button = screen.getByRole("button", { name: "Get started" });
  const rect = mockRect(button, BUTTON_RECT);

  return { ...view, button, rect };
}

async function expectEngaged(button: HTMLElement, engaged: boolean) {
  await waitFor(() => {
    expect(button).toHaveAttribute(
      "data-magnet-engaged",
      engaged ? "true" : "false",
    );
  });
}

beforeEach(() => {
  mockMediaQueries({ hover: true, reducedMotion: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("computeMagnetOffset", () => {
  const rect = BUTTON_RECT;

  it("pulls at full strength while the pointer is over the button", () => {
    const offset = computeMagnetOffset(rect, 250, 130, 120);

    expect(offset.proximity).toBe(1);
    expect(offset.x).toBe(50);
    expect(offset.y).toBe(0);
  });

  it("falls off linearly across the field", () => {
    const offset = computeMagnetOffset(rect, 360, 130, 120);

    expect(offset.proximity).toBeCloseTo(0.5);
    expect(offset.x).toBeCloseTo(80);
    expect(offset.y).toBeCloseTo(0);
  });

  it("reaches exactly zero at the radius edge so the pull never snaps on", () => {
    const offset = computeMagnetOffset(rect, 420, 130, 120);

    expect(offset.proximity).toBe(0);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });

  it("stays disengaged beyond the radius", () => {
    expect(computeMagnetOffset(rect, 900, 900, 120).proximity).toBe(0);
  });

  it("measures diagonal distance from the nearest corner", () => {
    const offset = computeMagnetOffset(rect, 400, 200, 200);

    // 100px right of the rect, 40px below it -> hypot(100, 40).
    expect(offset.proximity).toBeCloseTo(1 - Math.hypot(100, 40) / 200);
  });

  it("treats a zero radius as button bounds only", () => {
    expect(computeMagnetOffset(rect, 250, 130, 0).proximity).toBe(1);
    expect(computeMagnetOffset(rect, 320, 130, 0).proximity).toBe(0);
  });
});

describe("MagnetPull", () => {
  it("engages when the pointer enters the field and reports it once", async () => {
    const onEngagedChange = vi.fn();
    const { button } = renderMagnet(
      <MagnetPull onEngagedChange={onEngagedChange}>Get started</MagnetPull>,
    );

    expect(button).toHaveAttribute("data-magnet-engaged", "false");

    movePointer(360, 130);
    await expectEngaged(button, true);

    movePointer(350, 130);
    await flushFrames();

    expect(onEngagedChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("disengages once the pointer leaves the field", async () => {
    const onEngagedChange = vi.fn();
    const { button } = renderMagnet(
      <MagnetPull onEngagedChange={onEngagedChange}>Get started</MagnetPull>,
    );

    movePointer(250, 130);
    await expectEngaged(button, true);

    movePointer(900, 900);
    await expectEngaged(button, false);

    expect(onEngagedChange).toHaveBeenCalledTimes(2);
    expect(onEngagedChange).toHaveBeenLastCalledWith(false);
  });

  it("coalesces a burst of pointer moves into a single frame", async () => {
    const { button } = renderMagnet(<MagnetPull>Get started</MagnetPull>);
    const requestFrame = vi.spyOn(window, "requestAnimationFrame");

    movePointer(240, 130);
    movePointer(250, 130);
    movePointer(260, 130);

    expect(requestFrame).toHaveBeenCalledTimes(1);
    await expectEngaged(button, true);
  });

  it("stays disengaged exactly at the radius edge", async () => {
    const { button } = renderMagnet(<MagnetPull>Get started</MagnetPull>);

    movePointer(420, 130);
    await flushFrames();

    expect(button).toHaveAttribute("data-magnet-engaged", "false");
  });

  it("honors a custom radius", async () => {
    const { button } = renderMagnet(
      <MagnetPull radius={400}>Get started</MagnetPull>,
    );

    movePointer(600, 130);
    await expectEngaged(button, true);
  });

  it("measures the field from the resting rect, not the pulled one", async () => {
    const { button } = renderMagnet(<MagnetPull>Get started</MagnetPull>);

    // Pointer on the right edge: full strength, so the surface travels right and
    // the transformed rect ends up noticeably closer to the cursor.
    movePointer(300, 130);
    await expectEngaged(button, true);
    await waitFor(() => {
      expect(readTranslate(button, "X")).toBeGreaterThan(10);
    });

    // 121px past the *resting* right edge — outside the 120px radius. Measured
    // from the pulled rect this would still read as inside the field.
    movePointer(421, 130);
    await expectEngaged(button, false);
  });

  it("re-evaluates the field when the page scrolls under a still cursor", async () => {
    const { button, rect } = renderMagnet(<MagnetPull>Get started</MagnetPull>);

    movePointer(250, 130);
    await expectEngaged(button, true);

    rect.mockReturnValue(makeDomRect({ ...BUTTON_RECT, top: 900 }));
    fireEvent.scroll(window);

    await expectEngaged(button, false);
  });

  it("ignores scroll before the pointer has ever moved", async () => {
    const { button, rect } = renderMagnet(<MagnetPull>Get started</MagnetPull>);
    rect.mockClear();

    fireEvent.scroll(window);
    await flushFrames();

    expect(rect).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("data-magnet-engaged", "false");
  });

  it("releases when the window loses focus", async () => {
    const { button } = renderMagnet(<MagnetPull>Get started</MagnetPull>);

    movePointer(250, 130);
    await expectEngaged(button, true);

    fireEvent.blur(window);
    await expectEngaged(button, false);
  });

  it("releases when the pointer leaves the viewport", async () => {
    const { button } = renderMagnet(<MagnetPull>Get started</MagnetPull>);

    movePointer(250, 130);
    await expectEngaged(button, true);

    fireEvent.pointerLeave(document.documentElement);
    await expectEngaged(button, false);
  });

  it("never tracks the pointer while disabled", async () => {
    const onEngagedChange = vi.fn();
    const { button, rect } = renderMagnet(
      <MagnetPull disabled onEngagedChange={onEngagedChange}>
        Get started
      </MagnetPull>,
    );
    rect.mockClear();

    movePointer(250, 130);
    await flushFrames();

    expect(button).toBeDisabled();
    expect(rect).not.toHaveBeenCalled();
    expect(onEngagedChange).not.toHaveBeenCalled();
  });

  it("never tracks the pointer when reduced motion is preferred", async () => {
    mockMediaQueries({ hover: true, reducedMotion: true });
    const { button, rect } = renderMagnet(<MagnetPull>Get started</MagnetPull>);
    rect.mockClear();

    movePointer(250, 130);
    await flushFrames();

    expect(rect).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("data-magnet-engaged", "false");
  });

  it("releases and stops tracking when reduced motion is turned on", async () => {
    const media = mockMediaQueries({ hover: true, reducedMotion: false });
    const { button, rect } = renderMagnet(<MagnetPull>Get started</MagnetPull>);

    movePointer(250, 130);
    await expectEngaged(button, true);

    media.change({ reducedMotion: true });
    await expectEngaged(button, false);

    rect.mockClear();
    movePointer(250, 130);
    await flushFrames();

    expect(rect).not.toHaveBeenCalled();
  });

  it("never tracks the pointer on coarse pointer devices", async () => {
    mockMediaQueries({ hover: false, reducedMotion: false });
    const { button, rect } = renderMagnet(<MagnetPull>Get started</MagnetPull>);
    rect.mockClear();

    movePointer(250, 130);
    await flushFrames();

    expect(rect).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("data-magnet-engaged", "false");
  });

  it("starts tracking when the device gains a fine pointer", async () => {
    const media = mockMediaQueries({ hover: false, reducedMotion: false });
    const { button } = renderMagnet(<MagnetPull>Get started</MagnetPull>);

    movePointer(250, 130);
    await flushFrames();
    expect(button).toHaveAttribute("data-magnet-engaged", "false");

    media.change({ hover: true });

    movePointer(250, 130);
    await expectEngaged(button, true);
  });

  it("stays inert when matchMedia is unavailable", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "matchMedia");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
      writable: true,
    });

    try {
      const { button, rect } = renderMagnet(
        <MagnetPull>Get started</MagnetPull>,
      );
      rect.mockClear();

      movePointer(250, 130);
      await flushFrames();

      expect(rect).not.toHaveBeenCalled();
      expect(button).toHaveAttribute("data-magnet-engaged", "false");
    } finally {
      if (descriptor) Object.defineProperty(window, "matchMedia", descriptor);
    }
  });

  it("stops tracking after unmount", async () => {
    const { button, rect, unmount } = renderMagnet(
      <MagnetPull>Get started</MagnetPull>,
    );

    movePointer(250, 130);
    await expectEngaged(button, true);

    unmount();
    rect.mockClear();
    movePointer(260, 130);
    await flushFrames();

    expect(rect).not.toHaveBeenCalled();
  });

  it("activates like a native button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MagnetPull onClick={onClick}>Get started</MagnetPull>);
    const button = screen.getByRole("button", { name: "Get started" });

    expect(button).toHaveAttribute("type", "button");
    await user.click(button);
    button.focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("accepts a submit type and native attributes", () => {
    render(
      <MagnetPull data-testid="magnet" name="cta" type="submit" value="go">
        Get started
      </MagnetPull>,
    );

    const button = screen.getByTestId("magnet");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("name", "cta");
    expect(button).toHaveAttribute("value", "go");
  });

  it("merges className and inline styles instead of replacing them", () => {
    render(
      <MagnetPull className="custom-cta" style={{ opacity: 0.5 }}>
        Get started
      </MagnetPull>,
    );

    const button = screen.getByRole("button", { name: "Get started" });
    expect(button).toHaveClass("custom-cta");
    expect(button).toHaveClass("rounded-full");
    expect(button).toHaveStyle({ opacity: "0.5" });
  });

  it("renders the content in its own parallax layer", () => {
    const { container } = render(<MagnetPull>Get started</MagnetPull>);
    const content = container.querySelector(
      '[data-slot="magnet-pull-content"]',
    );

    expect(content).toHaveTextContent("Get started");
    expect(
      container.querySelector('[data-slot="magnet-pull"]'),
    ).toContainElement(content as HTMLElement);
  });

  it("renders on the server as disengaged, without reading the browser", () => {
    const markup = renderToStaticMarkup(<MagnetPull>Get started</MagnetPull>);

    expect(markup).toContain('data-magnet-engaged="false"');
    expect(markup).toContain("Get started");
  });

  it("forwards the button ref", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<MagnetPull ref={ref}>Get started</MagnetPull>);

    expect(ref.current).toBe(
      screen.getByRole("button", { name: "Get started" }),
    );
  });

  it("supports callback refs", () => {
    const ref = vi.fn();

    const { unmount } = render(<MagnetPull ref={ref}>Get started</MagnetPull>);

    expect(ref).toHaveBeenCalledWith(
      screen.getByRole("button", { name: "Get started" }),
    );

    unmount();
    expect(ref).toHaveBeenLastCalledWith(null);
  });

  it.each(["subtle", "default", "expressive"] as const)(
    "is accessible at %s motion intensity",
    async (motionIntensity) => {
      const { container } = render(
        <MagnetPull motionIntensity={motionIntensity}>Get started</MagnetPull>,
      );

      const results = await axe(container, {
        rules: { "color-contrast": { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    },
  );
});
