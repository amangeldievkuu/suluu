import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  magnetizeValue,
  pointerToRatio,
  resolveSlideKey,
  SLIDE_MOTION_PRESETS,
  SLIDE_THUMB_SIZE,
  SlideControl,
  snapToStep,
  unsnappedValueFromPointer,
} from "../src/slide-control/slide-control";

const TRACK_WIDTH = 220;
const TRACK_LEFT = 40;

function readTransform(
  element: HTMLElement,
  transform: "translateX" | "scaleX" | "scaleY",
  fallback: number,
): number {
  const match = new RegExp(`${transform}\\((-?[\\d.]+)(?:px)?\\)`).exec(
    element.style.transform,
  );
  return match?.[1] === undefined ? fallback : Number(match[1]);
}

function readWidth(element: HTMLElement): number {
  return Number.parseFloat(element.style.width);
}

function fillAlignedToThumb(thumb: HTMLElement, fill: HTMLElement) {
  expect(readWidth(fill)).toBeCloseTo(
    readTransform(thumb, "translateX", 0) + SLIDE_THUMB_SIZE / 2,
    0,
  );
}

function stubTrackGeometry(width = TRACK_WIDTH, left = TRACK_LEFT) {
  return vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue({
      bottom: 32,
      height: 32,
      left,
      right: left + width,
      toJSON: () => ({}),
      top: 0,
      width,
      x: left,
      y: 0,
    });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("snapToStep", () => {
  it("snaps to the nearest step and stays inside the range", () => {
    expect(snapToStep(47, 0, 100, 10)).toBe(50);
    expect(snapToStep(-4, 0, 100, 10)).toBe(0);
    expect(snapToStep(112, 0, 100, 10)).toBe(100);
  });

  it("keeps decimal steps precise", () => {
    expect(snapToStep(0.34, 0, 1, 0.1)).toBe(0.3);
    expect(snapToStep(1.25, 0, 2, 0.1)).toBe(1.3);
  });

  it("allows the range maximum even when it is not on a step", () => {
    expect(snapToStep(95, 0, 100, 30)).toBe(90);
    expect(snapToStep(98, 0, 100, 30)).toBe(100);
  });

  it("returns the clamped value when step is not positive", () => {
    expect(snapToStep(40, 0, 100, 0)).toBe(40);
    expect(snapToStep(140, 0, 100, -1)).toBe(100);
  });

  it("collapses an inverted range to the minimum", () => {
    expect(snapToStep(8, 10, 4, 1)).toBe(10);
  });
});

describe("pointerToRatio", () => {
  it("maps the thumb center across the usable travel", () => {
    expect(pointerToRatio(TRACK_LEFT, TRACK_LEFT, TRACK_WIDTH)).toBe(0);
    expect(
      pointerToRatio(TRACK_LEFT + TRACK_WIDTH, TRACK_LEFT, TRACK_WIDTH),
    ).toBe(1);
    expect(
      pointerToRatio(TRACK_LEFT + TRACK_WIDTH / 2, TRACK_LEFT, TRACK_WIDTH),
    ).toBeCloseTo(0.5, 5);
  });

  it("clamps points outside the track", () => {
    expect(pointerToRatio(TRACK_LEFT - 40, TRACK_LEFT, TRACK_WIDTH)).toBe(0);
    expect(
      pointerToRatio(TRACK_LEFT + TRACK_WIDTH + 40, TRACK_LEFT, TRACK_WIDTH),
    ).toBe(1);
  });

  it("returns zero when the track is too small to travel", () => {
    expect(pointerToRatio(80, 40, SLIDE_THUMB_SIZE)).toBe(0);
  });
});

describe("unsnappedValueFromPointer", () => {
  it("converts a pointer into a continuous value", () => {
    expect(
      unsnappedValueFromPointer(
        TRACK_LEFT + TRACK_WIDTH / 2,
        TRACK_LEFT,
        TRACK_WIDTH,
        10,
        30,
      ),
    ).toBeCloseTo(20, 5);
  });
});

describe("magnetizeValue", () => {
  it("leaves values far from a tick unchanged", () => {
    expect(magnetizeValue(14, 0, 100, 10)).toBe(14);
  });

  it("pulls values near a tick toward that tick", () => {
    const pulled = magnetizeValue(48.4, 0, 100, 10);

    expect(pulled).toBeGreaterThan(48.4);
    expect(pulled).toBeLessThan(50);
  });

  it("does not magnetize when step is not positive", () => {
    expect(magnetizeValue(48.4, 0, 100, 0)).toBe(48.4);
  });
});

describe("resolveSlideKey", () => {
  it("moves by a single step on arrows", () => {
    expect(resolveSlideKey("ArrowRight", 0, 100, 5)).toEqual({
      delta: 5,
      type: "delta",
    });
    expect(resolveSlideKey("ArrowUp", 0, 100, 5)).toEqual({
      delta: 5,
      type: "delta",
    });
    expect(resolveSlideKey("ArrowLeft", 0, 100, 5)).toEqual({
      delta: -5,
      type: "delta",
    });
    expect(resolveSlideKey("ArrowDown", 0, 100, 5)).toEqual({
      delta: -5,
      type: "delta",
    });
  });

  it("uses a tenth of the range for page keys, at least one step", () => {
    expect(resolveSlideKey("PageUp", 0, 100, 1)).toEqual({
      delta: 10,
      type: "delta",
    });
    expect(resolveSlideKey("PageDown", 0, 100, 25)).toEqual({
      delta: -25,
      type: "delta",
    });
  });

  it("jumps to the ends with Home and End", () => {
    expect(resolveSlideKey("Home", 0, 100, 1)).toEqual({
      type: "bound",
      value: "min",
    });
    expect(resolveSlideKey("End", 0, 100, 1)).toEqual({
      type: "bound",
      value: "max",
    });
  });

  it("ignores unrelated keys", () => {
    expect(resolveSlideKey("Enter", 0, 100, 1)).toBeNull();
  });
});

describe("SLIDE_MOTION_PRESETS", () => {
  it("uses a calmer thumb settle as intensity becomes more expressive", () => {
    expect(SLIDE_MOTION_PRESETS.subtle.thumb.stiffness).toBeGreaterThan(
      SLIDE_MOTION_PRESETS.default.thumb.stiffness,
    );
    expect(SLIDE_MOTION_PRESETS.default.thumb.stiffness).toBeGreaterThan(
      SLIDE_MOTION_PRESETS.expressive.thumb.stiffness,
    );
  });

  it("gives the fill more mass and a slower spring than the thumb", () => {
    for (const preset of Object.values(SLIDE_MOTION_PRESETS)) {
      expect(preset.fill.mass).toBeGreaterThan(preset.thumb.mass);
      expect(preset.fill.stiffness).toBeLessThan(preset.thumb.stiffness);
    }
  });
});

describe("SlideControl", () => {
  it("renders a horizontal slider at the range minimum by default", () => {
    const { container } = render(<SlideControl aria-label="Volume" />);
    const slider = screen.getByRole("slider", { name: "Volume" });

    expect(slider).toHaveAttribute("aria-orientation", "horizontal");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
    expect(slider).toHaveAttribute("aria-valuenow", "0");
    expect(slider).toHaveAttribute("data-slot", "slide-control");
    expect(slider).toHaveAttribute("data-dragging", "false");
    expect(slider).toHaveAttribute("tabindex", "0");
    expect(slider.className).toContain("data-[dragging=true]:ring-0");
    expect(
      container.querySelector('[data-slot="slide-control-track"]'),
    ).toBeVisible();
    expect(
      container.querySelector('[data-slot="slide-control-fill"]'),
    ).toBeVisible();
    expect(
      container.querySelector('[data-slot="slide-control-thumb"]'),
    ).toBeVisible();
  });

  it("supports an uncontrolled default and emits committed changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SlideControl
        aria-label="Volume"
        defaultValue={20}
        onValueChange={onValueChange}
        step={10}
      />,
    );
    const slider = screen.getByRole("slider");

    expect(slider).toHaveAttribute("aria-valuenow", "20");
    slider.focus();
    await user.keyboard("{ArrowRight}");

    expect(slider).toHaveAttribute("aria-valuenow", "30");
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(30);
  });

  it("does not emit when a key would not change the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SlideControl
        aria-label="Volume"
        defaultValue={0}
        onValueChange={onValueChange}
      />,
    );

    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowLeft}");
    await user.keyboard("{Home}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
  });

  it("keeps controlled state authoritative", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <SlideControl
        aria-label="Volume"
        onValueChange={onValueChange}
        value={10}
      />,
    );
    const slider = screen.getByRole("slider");

    slider.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(11);
    expect(slider).toHaveAttribute("aria-valuenow", "10");

    rerender(
      <SlideControl
        aria-label="Volume"
        onValueChange={onValueChange}
        value={11}
      />,
    );
    expect(slider).toHaveAttribute("aria-valuenow", "11");
  });

  it("moves with arrows, page keys, Home, and End", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SlideControl
        aria-label="Volume"
        defaultValue={40}
        onValueChange={onValueChange}
      />,
    );
    const slider = screen.getByRole("slider");

    slider.focus();
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{PageUp}");
    await user.keyboard("{End}");
    await user.keyboard("{PageDown}");
    await user.keyboard("{Home}");

    expect(onValueChange).toHaveBeenNthCalledWith(1, 41);
    expect(onValueChange).toHaveBeenNthCalledWith(2, 51);
    expect(onValueChange).toHaveBeenNthCalledWith(3, 100);
    expect(onValueChange).toHaveBeenNthCalledWith(4, 90);
    expect(onValueChange).toHaveBeenNthCalledWith(5, 0);
    expect(slider).toHaveAttribute("aria-valuenow", "0");
  });

  it("does not respond while disabled", async () => {
    stubTrackGeometry();
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SlideControl
        aria-label="Volume"
        defaultValue={20}
        disabled
        onValueChange={onValueChange}
      />,
    );
    const slider = screen.getByRole("slider");

    expect(slider).toHaveAttribute("aria-disabled", "true");
    expect(slider).toHaveAttribute("tabindex", "-1");
    slider.focus();
    await user.keyboard("{ArrowRight}");
    fireEvent.pointerDown(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH,
      isPrimary: true,
      pointerId: 1,
    });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-valuenow", "20");
    expect(slider).toHaveAttribute("data-dragging", "false");
  });

  it("commits a pointer drag and squashes the thumb while dragging", async () => {
    stubTrackGeometry();
    const onValueChange = vi.fn();
    const { container } = render(
      <SlideControl
        aria-label="Volume"
        defaultValue={0}
        onValueChange={onValueChange}
        step={10}
      />,
    );
    const slider = screen.getByRole("slider");
    const thumb = container.querySelector<HTMLElement>(
      '[data-slot="slide-control-thumb"]',
    );
    if (!thumb) throw new Error("Expected the slider thumb to render.");

    fireEvent.pointerDown(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH * 0.62,
      isPrimary: true,
      pointerId: 1,
    });

    await waitFor(() => {
      expect(slider).toHaveAttribute("data-dragging", "true");
      expect(readTransform(thumb, "scaleX", 1)).toBeGreaterThan(1);
      expect(readTransform(thumb, "scaleY", 1)).toBeLessThan(1);
    });
    expect(onValueChange).toHaveBeenCalledWith(60);
    expect(slider).toHaveAttribute("aria-valuenow", "60");

    fireEvent.pointerMove(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH,
      isPrimary: true,
      pointerId: 1,
    });
    await waitFor(() => {
      expect(slider).toHaveAttribute("aria-valuenow", "100");
    });

    fireEvent.pointerUp(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH,
      isPrimary: true,
      pointerId: 1,
    });

    await waitFor(() => {
      expect(slider).toHaveAttribute("data-dragging", "false");
      expect(readTransform(thumb, "scaleX", 1)).toBeCloseTo(1, 1);
      expect(readTransform(thumb, "scaleY", 1)).toBeCloseTo(1, 1);
    });
    expect(onValueChange).toHaveBeenLastCalledWith(100);
  });

  it("lets the fill trail the thumb with mass while dragging left", async () => {
    stubTrackGeometry();
    const { container } = render(
      <SlideControl aria-label="Volume" defaultValue={80} />,
    );
    const slider = screen.getByRole("slider");
    const thumb = container.querySelector<HTMLElement>(
      '[data-slot="slide-control-thumb"]',
    );
    const fill = container.querySelector<HTMLElement>(
      '[data-slot="slide-control-fill"]',
    );
    if (!thumb || !fill) {
      throw new Error("Expected the slider thumb and fill to render.");
    }

    fireEvent.pointerDown(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH * 0.8,
      isPrimary: true,
      pointerId: 5,
    });
    fireEvent.pointerMove(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH * 0.2,
      isPrimary: true,
      pointerId: 5,
    });

    await waitFor(() => {
      expect(slider).toHaveAttribute("data-dragging", "true");
      expect(readTransform(thumb, "translateX", 0)).toBeLessThan(140);
    });
    expect(readWidth(fill)).toBeGreaterThan(
      readTransform(thumb, "translateX", 0) + SLIDE_THUMB_SIZE / 2,
    );

    fireEvent.pointerUp(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH * 0.2,
      isPrimary: true,
      pointerId: 5,
    });

    await waitFor(
      () => {
        fillAlignedToThumb(thumb, fill);
      },
      { timeout: 2000 },
    );
  });

  it("cancels an in-flight drag without leaving the thumb squashed", async () => {
    stubTrackGeometry();
    const onValueChange = vi.fn();
    const { container } = render(
      <SlideControl
        aria-label="Volume"
        defaultValue={0}
        onValueChange={onValueChange}
        step={10}
      />,
    );
    const slider = screen.getByRole("slider");
    const thumb = container.querySelector<HTMLElement>(
      '[data-slot="slide-control-thumb"]',
    );
    if (!thumb) throw new Error("Expected the slider thumb to render.");

    fireEvent.pointerDown(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH * 0.62,
      isPrimary: true,
      pointerId: 3,
    });
    await waitFor(() => {
      expect(slider).toHaveAttribute("data-dragging", "true");
    });

    fireEvent.pointerCancel(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH * 0.62,
      isPrimary: true,
      pointerId: 3,
    });

    await waitFor(() => {
      expect(slider).toHaveAttribute("data-dragging", "false");
      expect(readTransform(thumb, "scaleX", 1)).toBeCloseTo(1, 1);
    });
    expect(onValueChange).toHaveBeenCalledWith(60);
  });

  it("honors preventDefault on pointer and keyboard handlers", async () => {
    stubTrackGeometry();
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SlideControl
        aria-label="Volume"
        defaultValue={20}
        onKeyDown={(event) => {
          event.preventDefault();
        }}
        onPointerDown={(event) => {
          event.preventDefault();
        }}
        onValueChange={onValueChange}
      />,
    );
    const slider = screen.getByRole("slider");

    fireEvent.pointerDown(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH,
      isPrimary: true,
      pointerId: 4,
    });
    slider.focus();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-valuenow", "20");
    expect(slider).toHaveAttribute("data-dragging", "false");
  });

  it("ignores secondary pointer buttons", () => {
    stubTrackGeometry();
    const onValueChange = vi.fn();
    render(<SlideControl aria-label="Volume" onValueChange={onValueChange} />);
    const slider = screen.getByRole("slider");

    fireEvent.pointerDown(slider, {
      button: 2,
      clientX: TRACK_LEFT + TRACK_WIDTH,
      isPrimary: false,
      pointerId: 1,
    });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("data-dragging", "false");
  });

  it("forwards native attributes, class names, styles, and refs", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <SlideControl
        aria-label="Volume"
        className="custom-slider"
        data-purpose="mix"
        id="volume"
        ref={ref}
        style={{ opacity: 0.8 }}
      />,
    );
    const slider = screen.getByRole("slider");

    expect(ref.current).toBe(slider);
    expect(slider).toHaveClass("custom-slider");
    expect(slider).toHaveAttribute("data-purpose", "mix");
    expect(slider).toHaveAttribute("id", "volume");
    expect(slider).toHaveStyle({ opacity: "0.8" });
  });

  it("renders consistently on the server", () => {
    const markup = renderToStaticMarkup(
      <SlideControl aria-label="Volume" defaultValue={40} max={80} min={20} />,
    );

    expect(markup).toContain('role="slider"');
    expect(markup).toContain('aria-valuenow="40"');
    expect(markup).toContain('aria-valuemin="20"');
    expect(markup).toContain('aria-valuemax="80"');
    expect(markup).toContain('data-slot="slide-control"');
  });

  it("remains usable when reduced motion is preferred", async () => {
    stubTrackGeometry();
    const user = userEvent.setup();
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          addEventListener: () => undefined,
          addListener: () => undefined,
          dispatchEvent: () => false,
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          removeEventListener: () => undefined,
          removeListener: () => undefined,
        }) as MediaQueryList,
    );

    const { container } = render(
      <SlideControl aria-label="Volume" defaultValue={0} />,
    );
    const slider = screen.getByRole("slider");
    const thumb = container.querySelector<HTMLElement>(
      '[data-slot="slide-control-thumb"]',
    );
    const fill = container.querySelector<HTMLElement>(
      '[data-slot="slide-control-fill"]',
    );
    if (!thumb || !fill) {
      throw new Error("Expected the slider thumb and fill to render.");
    }

    slider.focus();
    await user.keyboard("{End}");
    expect(slider).toHaveAttribute("aria-valuenow", "100");

    fireEvent.pointerDown(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH * 0.4,
      isPrimary: true,
      pointerId: 2,
    });
    await waitFor(() => {
      expect(slider).toHaveAttribute("data-dragging", "true");
      expect(readTransform(thumb, "scaleX", 1)).toBeCloseTo(1, 2);
      expect(readTransform(thumb, "scaleY", 1)).toBeCloseTo(1, 2);
      fillAlignedToThumb(thumb, fill);
    });

    fireEvent.pointerUp(slider, {
      button: 0,
      clientX: TRACK_LEFT + TRACK_WIDTH * 0.4,
      isPrimary: true,
      pointerId: 2,
    });
  });

  it("has no accessibility violations at either end of the range", async () => {
    const { container, rerender } = render(
      <SlideControl aria-label="Volume" />,
    );

    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);

    rerender(<SlideControl aria-label="Volume" value={100} />);
    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });
});
