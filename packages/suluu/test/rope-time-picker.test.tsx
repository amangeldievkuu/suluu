import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clockAngleForValue,
  clockValueFromAngle,
  DEFAULT_ROPE_TIME_VALUE,
  HAND_RADII,
  normalizeClockAngle,
  normalizeTimeValue,
  pointerToClockAngle,
  resolveRopeTimeKey,
  ROPE_TIME_MOTION_PRESETS,
  RopeTimePicker,
  snapDirectTimeValue,
  unwrapClockAngle,
  type RopeTimeValue,
} from "../src/rope-time-picker/rope-time-picker";

const DIAL_LEFT = 40;
const DIAL_TOP = 20;
const DIAL_SIZE = 240;

function rect(left = DIAL_LEFT, top = DIAL_TOP, size = DIAL_SIZE): DOMRect {
  return {
    bottom: top + size,
    height: size,
    left,
    right: left + size,
    toJSON: () => ({}),
    top,
    width: size,
    x: left,
    y: top,
  };
}

function stubDial(container: HTMLElement): HTMLElement {
  const dial = container.querySelector<HTMLElement>(
    '[data-slot="rope-time-picker-dial"]',
  );
  if (!dial) throw new Error("Expected the time-picker dial to render.");
  vi.spyOn(dial, "getBoundingClientRect").mockReturnValue(rect());
  return dial;
}

function pointForAngle(angle: number, radius = 100) {
  const radians = ((angle - 90) * Math.PI) / 180;
  const centerX = DIAL_LEFT + DIAL_SIZE / 2;
  const centerY = DIAL_TOP + DIAL_SIZE / 2;
  return {
    clientX: centerX + Math.cos(radians) * radius,
    clientY: centerY + Math.sin(radians) * radius,
  };
}

function time(
  hours: number,
  minutes: number,
  seconds = 0,
  period: "AM" | "PM" = "AM",
): RopeTimeValue {
  return { hours, minutes, period, seconds };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("time helpers", () => {
  it("normalizes every unit and period without mutating the input", () => {
    const source = time(18.6, -4, Number.POSITIVE_INFINITY, "PM");

    expect(normalizeTimeValue(source)).toEqual(time(12, 0, 0, "PM"));
    expect(source).toEqual(time(18.6, -4, Number.POSITIVE_INFINITY, "PM"));
    expect(
      normalizeTimeValue({
        hours: Number.NaN,
        minutes: 80,
        period: "nope" as "AM",
        seconds: 12.6,
      }),
    ).toEqual(time(1, 59, 13));
    expect(DEFAULT_ROPE_TIME_VALUE).toEqual(time(12, 0));
  });

  it("normalizes and unwraps angles across the clock boundary", () => {
    expect(normalizeClockAngle(450)).toBe(90);
    expect(normalizeClockAngle(-30)).toBe(330);
    expect(normalizeClockAngle(Number.NaN)).toBe(0);
    expect(unwrapClockAngle(350, 10)).toBe(370);
    expect(unwrapClockAngle(10, 350)).toBe(-10);
    expect(unwrapClockAngle(0, 180)).toBe(180);
  });

  it("maps unit values to exact clock angles", () => {
    expect(clockAngleForValue(12, "hour")).toBe(0);
    expect(clockAngleForValue(3, "hour")).toBe(90);
    expect(clockAngleForValue(15, "minute")).toBe(90);
    expect(clockAngleForValue(45, "second")).toBe(270);
  });

  it("maps clock angles to hours and stepped minute values", () => {
    expect(clockValueFromAngle(0, "hour")).toBe(12);
    expect(clockValueFromAngle(91, "hour")).toBe(3);
    expect(clockValueFromAngle(78, "minute")).toBe(13);
    expect(clockValueFromAngle(78, "minute", 5)).toBe(15);
    expect(clockValueFromAngle(354, "second", 5)).toBe(0);
  });

  it("converts pointer coordinates with twelve o'clock at zero", () => {
    const geometry = rect();
    const centerX = geometry.left + geometry.width / 2;
    const centerY = geometry.top + geometry.height / 2;

    expect(pointerToClockAngle(centerX, geometry.top, geometry)).toBe(0);
    expect(pointerToClockAngle(geometry.right, centerY, geometry)).toBe(90);
    expect(pointerToClockAngle(centerX, geometry.bottom, geometry)).toBe(180);
    expect(pointerToClockAngle(geometry.left, centerY, geometry)).toBe(270);
    expect(pointerToClockAngle(centerX, centerY, geometry)).toBe(0);
  });

  it("snaps typed values linearly inside each unit's range", () => {
    expect(snapDirectTimeValue(0, "hour")).toBe(1);
    expect(snapDirectTimeValue(15, "hour")).toBe(12);
    expect(snapDirectTimeValue(13, "minute", 5)).toBe(15);
    expect(snapDirectTimeValue(59, "second", 5)).toBe(55);
    expect(snapDirectTimeValue(-4, "minute")).toBe(0);
  });

  it("resolves clock keys with cyclic movement and useful bounds", () => {
    expect(resolveRopeTimeKey("ArrowUp", 12, "hour")).toBe(1);
    expect(resolveRopeTimeKey("ArrowLeft", 1, "hour")).toBe(12);
    expect(resolveRopeTimeKey("ArrowRight", 13, "minute", 5)).toBe(15);
    expect(resolveRopeTimeKey("ArrowDown", 13, "minute", 5)).toBe(10);
    expect(resolveRopeTimeKey("ArrowUp", 55, "second", 5)).toBe(0);
    expect(resolveRopeTimeKey("ArrowDown", 0, "second", 5)).toBe(55);
    expect(resolveRopeTimeKey("Home", 30, "minute", 5)).toBe(0);
    expect(resolveRopeTimeKey("End", 30, "minute", 5)).toBe(55);
    expect(resolveRopeTimeKey("End", 4, "hour")).toBe(12);
    expect(resolveRopeTimeKey("PageUp", 4, "hour")).toBeNull();
  });
});

describe("RopeTimePicker", () => {
  it("renders a deterministic two-hand picker by default", () => {
    const { container } = render(<RopeTimePicker />);
    const picker = screen.getByRole("group", { name: "Time picker" });
    const sliders = screen.getAllByRole("slider");
    const fields = screen.getAllByRole("spinbutton");

    expect(picker).toHaveAttribute("data-mode", "hour");
    expect(picker).toHaveAttribute("data-size", "default");
    expect(sliders).toHaveLength(2);
    expect(fields).toHaveLength(2);
    expect(screen.getByRole("slider", { name: "Hour" })).toHaveAttribute(
      "aria-valuenow",
      "12",
    );
    expect(screen.getByRole("slider", { name: "Minute" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.queryByRole("slider", { name: "Second" })).toBeNull();
    expect(screen.getByRole("button", { name: /Period AM/ })).toBeVisible();
    expect(
      container.querySelector('[data-slot="rope-time-picker-hour-rope"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-slot="rope-time-picker-minute-rope"]'),
    ).not.toBeNull();
    expect(container.querySelectorAll("line")).toHaveLength(60);
    expect(container.querySelectorAll("text")).toHaveLength(12);
    expect(
      container.querySelector('[data-slot="rope-time-picker-hour-rope"]'),
    ).toHaveAttribute("stroke", "var(--suluu-rope-time-accent)");
    expect(
      container.querySelector('[data-slot="rope-time-picker-minute-rope"]'),
    ).toHaveAttribute("stroke", "var(--suluu-rope-time-rope)");

    const ticks = [...container.querySelectorAll("line")];
    expect(
      ticks.filter(
        (tick) => tick.getAttribute("stroke") === "var(--suluu-rope-time-hour)",
      ),
    ).toHaveLength(12);
    expect(
      ticks.filter(
        (tick) =>
          tick.getAttribute("stroke") === "var(--suluu-rope-time-muted)",
      ),
    ).toHaveLength(48);
    for (const label of container.querySelectorAll("text")) {
      expect(label).toHaveAttribute("fill", "var(--suluu-rope-time-hour)");
    }
  });

  it("shows seconds and the full controlled value", () => {
    render(
      <RopeTimePicker
        mode="second"
        showSeconds
        value={time(8, 24, 37, "PM")}
      />,
    );

    expect(screen.getAllByRole("slider")).toHaveLength(3);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
    expect(screen.getByRole("slider", { name: "Hour" })).toHaveAttribute(
      "aria-valuenow",
      "8",
    );
    expect(screen.getByRole("slider", { name: "Minute" })).toHaveAttribute(
      "aria-valuenow",
      "24",
    );
    expect(screen.getByRole("slider", { name: "Second" })).toHaveAttribute(
      "aria-valuenow",
      "37",
    );
    expect(screen.getByRole("spinbutton", { name: "Hour" })).toHaveValue("08");
    expect(screen.getByRole("spinbutton", { name: "Minute" })).toHaveValue(
      "24",
    );
    expect(screen.getByRole("spinbutton", { name: "Second" })).toHaveValue(
      "37",
    );
    expect(screen.getByRole("group", { name: "Time picker" })).toHaveAttribute(
      "data-mode",
      "second",
    );
  });

  it("keeps the seconds rope red and thinner than the other hands", () => {
    const { container } = render(
      <RopeTimePicker mode="hour" showSeconds value={time(3, 15, 42)} />,
    );
    const hourRope = container.querySelector(
      '[data-slot="rope-time-picker-hour-rope"]',
    );
    const secondRope = container.querySelector(
      '[data-slot="rope-time-picker-second-rope"]',
    );

    expect(hourRope).toHaveAttribute("stroke", "var(--suluu-rope-time-accent)");
    expect(secondRope).toHaveAttribute(
      "stroke",
      "var(--suluu-rope-time-second)",
    );
    expect(Number(hourRope?.getAttribute("stroke-width") ?? 0)).toBeGreaterThan(
      Number(secondRope?.getAttribute("stroke-width") ?? 0),
    );
  });

  it("can hide the direct-entry readout without removing keyboard sliders", () => {
    render(<RopeTimePicker showDigital={false} showSeconds />);

    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.getAllByRole("slider")).toHaveLength(3);
  });

  it("toggles period in uncontrolled and controlled forms", async () => {
    const user = userEvent.setup();
    const uncontrolledChange = vi.fn();
    const view = render(
      <RopeTimePicker
        defaultValue={time(9, 42, 11, "AM")}
        onValueChange={uncontrolledChange}
        showSeconds
      />,
    );

    await user.click(screen.getByRole("button", { name: /Period AM/ }));
    expect(uncontrolledChange).toHaveBeenCalledExactlyOnceWith(
      time(9, 42, 11, "PM"),
    );
    expect(screen.getByRole("button", { name: /Period PM/ })).toBeVisible();

    const controlledChange = vi.fn();
    view.rerender(
      <RopeTimePicker
        onValueChange={controlledChange}
        value={time(3, 15, 0, "PM")}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Period PM/ }));
    expect(controlledChange).toHaveBeenCalledExactlyOnceWith(
      time(3, 15, 0, "AM"),
    );
    expect(screen.getByRole("button", { name: /Period PM/ })).toBeVisible();
  });

  it("supports uncontrolled and controlled editing modes", () => {
    const onModeChange = vi.fn();
    const view = render(<RopeTimePicker onModeChange={onModeChange} />);
    const picker = screen.getByRole("group", { name: "Time picker" });

    fireEvent.focus(screen.getByRole("spinbutton", { name: "Minute" }));
    expect(onModeChange).toHaveBeenCalledExactlyOnceWith("minute");
    expect(picker).toHaveAttribute("data-mode", "minute");

    onModeChange.mockClear();
    view.rerender(
      <RopeTimePicker mode="hour" onModeChange={onModeChange} showSeconds />,
    );
    fireEvent.focus(screen.getByRole("slider", { name: "Second" }));
    expect(onModeChange).toHaveBeenCalledExactlyOnceWith("second");
    expect(picker).toHaveAttribute("data-mode", "hour");
  });

  it("uses minute mode when seconds are hidden", () => {
    const { rerender } = render(
      <RopeTimePicker defaultMode="second" showSeconds={false} />,
    );
    const picker = screen.getByRole("group", { name: "Time picker" });

    expect(picker).toHaveAttribute("data-mode", "minute");
    rerender(<RopeTimePicker defaultMode="second" showSeconds />);
    expect(picker).toHaveAttribute("data-mode", "second");
  });

  it("edits digital fields and preserves hidden seconds", () => {
    const onValueChange = vi.fn();
    render(
      <RopeTimePicker
        defaultValue={time(10, 22, 47, "PM")}
        onValueChange={onValueChange}
        snapStep={5}
      />,
    );
    const minute = screen.getByRole("spinbutton", { name: "Minute" });

    fireEvent.focus(minute);
    fireEvent.change(minute, { target: { value: "13" } });
    expect(onValueChange).toHaveBeenLastCalledWith(time(10, 15, 47, "PM"));
    fireEvent.blur(minute);
    expect(minute).toHaveValue("15");
    expect(screen.queryByRole("slider", { name: "Second" })).toBeNull();
  });

  it("keeps invalid input as a draft, then clamps it on blur", () => {
    const onValueChange = vi.fn();
    render(
      <RopeTimePicker
        defaultValue={time(4, 20)}
        onValueChange={onValueChange}
        snapStep={5}
      />,
    );
    const minute = screen.getByRole("spinbutton", { name: "Minute" });

    fireEvent.focus(minute);
    fireEvent.change(minute, { target: { value: "99" } });
    expect(minute).toHaveAttribute("aria-invalid", "true");
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.blur(minute);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(time(4, 55));
    expect(minute).toHaveValue("55");
  });

  it("restores empty and escaped digital drafts", () => {
    render(<RopeTimePicker defaultValue={time(7, 8)} />);
    const hour = screen.getByRole("spinbutton", { name: "Hour" });

    fireEvent.focus(hour);
    fireEvent.change(hour, { target: { value: "" } });
    fireEvent.blur(hour);
    expect(hour).toHaveValue("07");

    fireEvent.focus(hour);
    fireEvent.change(hour, { target: { value: "11" } });
    fireEvent.keyDown(hour, { key: "Escape" });
    expect(hour).toHaveValue("11");
  });

  it("handles direct-entry keyboard steps, bounds, and Enter", () => {
    const onValueChange = vi.fn();
    render(
      <RopeTimePicker
        defaultValue={time(12, 55)}
        onValueChange={onValueChange}
        snapStep={5}
      />,
    );
    const hour = screen.getByRole("spinbutton", { name: "Hour" });
    const minute = screen.getByRole("spinbutton", { name: "Minute" });

    fireEvent.focus(hour);
    fireEvent.keyDown(hour, { key: "ArrowUp" });
    expect(onValueChange).toHaveBeenLastCalledWith(time(1, 55));

    fireEvent.focus(minute);
    fireEvent.keyDown(minute, { key: "ArrowUp" });
    expect(onValueChange).toHaveBeenLastCalledWith(time(1, 0));
    fireEvent.keyDown(minute, { key: "End" });
    expect(onValueChange).toHaveBeenLastCalledWith(time(1, 55));
    fireEvent.change(minute, { target: { value: "31" } });
    fireEvent.keyDown(minute, { key: "Enter" });
    expect(onValueChange).toHaveBeenLastCalledWith(time(1, 30));
  });

  it("supports slider keys and cyclic wrapping for every visible hand", () => {
    const onValueChange = vi.fn();
    render(
      <RopeTimePicker
        defaultValue={time(12, 55, 0)}
        onValueChange={onValueChange}
        showSeconds
        snapStep={5}
      />,
    );
    const hour = screen.getByRole("slider", { name: "Hour" });
    const minute = screen.getByRole("slider", { name: "Minute" });
    const second = screen.getByRole("slider", { name: "Second" });

    fireEvent.keyDown(hour, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenLastCalledWith(time(1, 55, 0));
    fireEvent.keyDown(minute, { key: "ArrowUp" });
    expect(onValueChange).toHaveBeenLastCalledWith(time(1, 0, 0));
    fireEvent.keyDown(second, { key: "ArrowDown" });
    expect(onValueChange).toHaveBeenLastCalledWith(time(1, 0, 55));
    fireEvent.keyDown(second, { key: "Home" });
    expect(onValueChange).toHaveBeenLastCalledWith(time(1, 0, 0));
    fireEvent.keyDown(second, { key: "PageUp" });
    expect(onValueChange).toHaveBeenCalledTimes(4);
  });

  it("drags a rope dot and emits distinct snapped steps", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <RopeTimePicker
        defaultValue={time(12, 0)}
        onValueChange={onValueChange}
      />,
    );
    stubDial(container);
    const hour = screen.getByRole("slider", { name: "Hour" });
    const right = pointForAngle(90);
    const bottom = pointForAngle(180);

    fireEvent.pointerDown(hour, {
      ...right,
      button: 0,
      isPrimary: true,
      pointerId: 3,
    });
    expect(onValueChange).toHaveBeenLastCalledWith(time(3, 0));
    expect(container.firstElementChild).toHaveAttribute(
      "data-dragging",
      "true",
    );

    fireEvent.pointerMove(hour, {
      ...bottom,
      isPrimary: true,
      pointerId: 3,
    });
    fireEvent.pointerMove(hour, {
      ...bottom,
      isPrimary: true,
      pointerId: 3,
    });
    fireEvent.pointerMove(hour, {
      clientX: DIAL_LEFT + DIAL_SIZE / 2,
      clientY: DIAL_TOP + DIAL_SIZE / 2,
      isPrimary: true,
      pointerId: 3,
    });
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenLastCalledWith(time(6, 0));

    fireEvent.pointerUp(hour, {
      ...bottom,
      button: 0,
      isPrimary: true,
      pointerId: 3,
    });
    expect(container.firstElementChild).toHaveAttribute(
      "data-dragging",
      "false",
    );
  });

  it("keeps dragging when the pointer leaves the bead quickly", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <RopeTimePicker
        defaultValue={time(12, 0)}
        onValueChange={onValueChange}
      />,
    );
    stubDial(container);
    const hour = screen.getByRole("slider", { name: "Hour" });

    fireEvent.pointerDown(hour, {
      ...pointForAngle(90),
      button: 0,
      isPrimary: true,
      pointerId: 11,
    });
    fireEvent.pointerMove(document, {
      ...pointForAngle(180),
      isPrimary: true,
      pointerId: 11,
    });
    fireEvent.pointerUp(document, {
      ...pointForAngle(180),
      button: 0,
      isPrimary: true,
      pointerId: 11,
    });

    expect(onValueChange).toHaveBeenCalledWith(time(3, 0));
    expect(onValueChange).toHaveBeenLastCalledWith(time(6, 0));
    expect(container.firstElementChild).toHaveAttribute(
      "data-dragging",
      "false",
    );
  });

  it("does not drag from the dial face", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <RopeTimePicker
        defaultValue={time(12, 0)}
        onValueChange={onValueChange}
      />,
    );
    stubDial(container);
    const surface = container.querySelector(
      '[data-slot="rope-time-picker-dial-surface"]',
    );
    if (!(surface instanceof HTMLElement)) {
      throw new Error("Expected the dial surface to render.");
    }

    fireEvent.pointerDown(surface, {
      ...pointForAngle(90),
      button: 0,
      isPrimary: true,
      pointerId: 3,
    });
    fireEvent.pointerMove(surface, {
      ...pointForAngle(180),
      isPrimary: true,
      pointerId: 3,
    });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(container.firstElementChild).toHaveAttribute(
      "data-dragging",
      "false",
    );
    expect(
      screen.getByRole("slider", { name: "Hour" }).className,
    ).not.toContain("focus-visible:ring");
  });

  it("selects and drags any control point with five-step snapping", () => {
    const onModeChange = vi.fn();
    const onValueChange = vi.fn();
    const { container } = render(
      <RopeTimePicker
        defaultValue={time(8, 0, 0)}
        onModeChange={onModeChange}
        onValueChange={onValueChange}
        showSeconds
        snapStep={5}
      />,
    );
    stubDial(container);
    const minute = screen.getByRole("slider", { name: "Minute" });
    const nearThirteen = pointForAngle(78);

    fireEvent.pointerDown(minute, {
      ...nearThirteen,
      button: 0,
      isPrimary: true,
      pointerId: 4,
    });
    expect(onModeChange).toHaveBeenCalledWith("minute");
    expect(onValueChange).toHaveBeenLastCalledWith(time(8, 15, 0));
    fireEvent.pointerUp(minute, {
      ...nearThirteen,
      button: 0,
      isPrimary: true,
      pointerId: 4,
    });

    const second = screen.getByRole("slider", { name: "Second" });
    const left = pointForAngle(270);
    fireEvent.pointerDown(second, {
      ...left,
      button: 0,
      isPrimary: true,
      pointerId: 5,
    });
    fireEvent.pointerUp(second, {
      ...left,
      button: 0,
      isPrimary: true,
      pointerId: 5,
    });
    expect(onValueChange).toHaveBeenLastCalledWith(time(8, 15, 45));
  });

  it("uses pointer capture when available and tolerates a lost capture", () => {
    const { container } = render(<RopeTimePicker />);
    stubDial(container);
    const hour = screen.getByRole("slider", { name: "Hour" });
    const setPointerCapture = vi.fn();
    const releasePointerCapture = vi.fn(() => {
      throw new Error("already lost");
    });
    Object.assign(hour, { releasePointerCapture, setPointerCapture });
    const top = pointForAngle(0);

    fireEvent.pointerDown(hour, {
      ...top,
      button: 0,
      isPrimary: true,
      pointerId: 8,
    });
    fireEvent.pointerUp(hour, {
      ...top,
      button: 0,
      isPrimary: true,
      pointerId: 8,
    });

    expect(setPointerCapture).toHaveBeenCalledWith(8);
    expect(releasePointerCapture).toHaveBeenCalledWith(8);
  });

  it("cancels a drag without committing the cancel position", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <RopeTimePicker onValueChange={onValueChange} value={time(2, 10)} />,
    );
    stubDial(container);
    const hour = screen.getByRole("slider", { name: "Hour" });
    const right = pointForAngle(90);

    fireEvent.pointerDown(hour, {
      ...right,
      button: 0,
      isPrimary: true,
      pointerId: 9,
    });
    expect(onValueChange).toHaveBeenCalledWith(time(3, 10));
    fireEvent.pointerCancel(hour, {
      ...pointForAngle(180),
      isPrimary: true,
      pointerId: 9,
    });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(container.firstElementChild).toHaveAttribute(
      "data-dragging",
      "false",
    );
  });

  it("ignores secondary pointers and extra pointers during a drag", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <RopeTimePicker onValueChange={onValueChange} />,
    );
    stubDial(container);
    const hour = screen.getByRole("slider", { name: "Hour" });

    fireEvent.pointerDown(hour, {
      ...pointForAngle(90),
      button: 2,
      isPrimary: false,
      pointerId: 1,
    });
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.pointerDown(hour, {
      ...pointForAngle(90),
      button: 0,
      isPrimary: true,
      pointerId: 2,
    });
    fireEvent.pointerDown(hour, {
      ...pointForAngle(180),
      button: 0,
      isPrimary: true,
      pointerId: 3,
    });
    fireEvent.pointerMove(hour, {
      ...pointForAngle(270),
      isPrimary: true,
      pointerId: 3,
    });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(hour, {
      ...pointForAngle(90),
      isPrimary: true,
      pointerId: 2,
    });
  });

  it("blocks every value path while disabled", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    const onValueChange = vi.fn();
    const { container } = render(
      <RopeTimePicker
        disabled
        onModeChange={onModeChange}
        onValueChange={onValueChange}
        showSeconds
      />,
    );
    stubDial(container);
    const picker = screen.getByRole("group", { name: "Time picker" });
    const hour = screen.getByRole("slider", { name: "Hour" });
    const period = screen.getByRole("button", { name: /Period AM/ });

    expect(picker).toHaveAttribute("aria-disabled", "true");
    expect(hour).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("spinbutton", { name: "Hour" })).toBeDisabled();
    expect(period).toBeDisabled();
    fireEvent.keyDown(hour, { key: "ArrowUp" });
    fireEvent.pointerDown(hour, {
      ...pointForAngle(90),
      button: 0,
      isPrimary: true,
      pointerId: 1,
    });
    await user.click(period);
    expect(onModeChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps read-only controls focusable without changing the time", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <RopeTimePicker
        defaultValue={time(6, 30)}
        onValueChange={onValueChange}
        readOnly
      />,
    );
    stubDial(container);
    const picker = screen.getByRole("group", { name: "Time picker" });
    const hour = screen.getByRole("slider", { name: "Hour" });
    const input = screen.getByRole("spinbutton", { name: "Hour" });
    const period = screen.getByRole("button", { name: /Period AM/ });

    expect(picker).toHaveAttribute("data-readonly", "true");
    expect(hour).toHaveAttribute("tabindex", "0");
    expect(hour).toHaveAttribute("aria-disabled", "true");
    expect(input).toHaveAttribute("readonly");
    expect(period).toHaveAttribute("aria-disabled", "true");
    fireEvent.keyDown(hour, { key: "ArrowUp" });
    fireEvent.pointerDown(hour, {
      ...pointForAngle(90),
      button: 0,
      isPrimary: true,
      pointerId: 1,
    });
    await user.click(period);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each(["sm", "default", "lg"] as const)("renders the %s size", (size) => {
    render(<RopeTimePicker size={size} />);
    expect(screen.getByRole("group", { name: "Time picker" })).toHaveAttribute(
      "data-size",
      size,
    );
  });

  it.each(["subtle", "default", "expressive"] as const)(
    "renders with %s motion",
    (motionIntensity) => {
      const { container } = render(
        <RopeTimePicker motionIntensity={motionIntensity} />,
      );
      expect(
        container.querySelector('[data-slot="rope-time-picker-hour-rope"]'),
      ).not.toBeNull();
      expect(ROPE_TIME_MOTION_PRESETS[motionIntensity].sag).toBeGreaterThan(0);
    },
  );

  it("keeps a visible hang on every motion preset", () => {
    expect(ROPE_TIME_MOTION_PRESETS.subtle.sag).toBe(8);
    expect(ROPE_TIME_MOTION_PRESETS.default.sag).toBe(13);
    expect(ROPE_TIME_MOTION_PRESETS.expressive.sag).toBe(17);
  });

  it("stops every rope before the hour numerals", () => {
    const numeralRadius = 87;

    expect(HAND_RADII.hour).toBeLessThan(HAND_RADII.minute);
    expect(HAND_RADII.hour).toBeLessThan(HAND_RADII.second);
    expect(HAND_RADII.minute).toBeLessThan(numeralRadius);
    expect(HAND_RADII.second).toBeLessThan(numeralRadius);
  });

  it("stays fully usable with reduced motion", () => {
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
    const onValueChange = vi.fn();
    const { container } = render(
      <RopeTimePicker onValueChange={onValueChange} showSeconds />,
    );
    stubDial(container);
    const minute = screen.getByRole("slider", { name: "Minute" });

    fireEvent.keyDown(minute, { key: "ArrowUp" });
    expect(onValueChange).toHaveBeenCalledWith(time(12, 1));
    fireEvent.pointerDown(minute, {
      ...pointForAngle(90),
      button: 0,
      isPrimary: true,
      pointerId: 7,
    });
    fireEvent.pointerUp(minute, {
      ...pointForAngle(90),
      isPrimary: true,
      pointerId: 7,
    });
    expect(onValueChange).toHaveBeenLastCalledWith(time(12, 15));
  });

  it("forwards native group attributes, styles, naming, and refs", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <RopeTimePicker
        aria-label="Alarm time"
        className="custom-time"
        data-purpose="alarm"
        id="alarm-time"
        ref={ref}
        style={{ opacity: 0.8 }}
      />,
    );
    const picker = screen.getByRole("group", { name: "Alarm time" });

    expect(ref.current).toBe(picker);
    expect(picker).toHaveClass("custom-time");
    expect(picker).toHaveAttribute("data-purpose", "alarm");
    expect(picker).toHaveAttribute("id", "alarm-time");
    expect(picker).toHaveStyle({ opacity: "0.8" });
  });

  it("prefers aria-labelledby over the default label", () => {
    render(
      <>
        <h2 id="meeting-label">Meeting time</h2>
        <RopeTimePicker aria-labelledby="meeting-label" />
      </>,
    );

    expect(
      screen.getByRole("group", { name: "Meeting time" }),
    ).not.toHaveAttribute("aria-label");
  });

  it("renders consistently on the server", () => {
    const markup = renderToStaticMarkup(
      <RopeTimePicker defaultValue={time(7, 5, 30, "PM")} showSeconds />,
    );

    expect(markup).toContain('data-slot="rope-time-picker"');
    expect(markup).toContain('role="slider"');
    expect(markup).toContain('aria-valuenow="7"');
    expect(markup).toContain("07");
    expect(markup).toContain("PM");
  });

  it("keeps dial coordinates stable enough for hydration", () => {
    const markup = renderToStaticMarkup(
      <RopeTimePicker defaultValue={time(7, 5, 30, "PM")} showSeconds />,
    );
    const coords = [
      ...markup.matchAll(/\s(?:x|y|x1|x2|y1|y2)="(-?\d+(?:\.\d+)?)"/g),
    ];

    expect(coords.length).toBeGreaterThan(70);
    for (const [, value] of coords) {
      expect(value.split(".")[1]?.length ?? 0).toBeLessThanOrEqual(3);
    }
  });

  it("has no automated accessibility violations in interactive states", async () => {
    const { container, rerender } = render(
      <RopeTimePicker aria-label="Start time" showSeconds />,
    );

    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);

    rerender(
      <RopeTimePicker
        aria-label="Start time"
        readOnly
        showSeconds
        value={time(11, 59, 59, "PM")}
      />,
    );
    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });
});
