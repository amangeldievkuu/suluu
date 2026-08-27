import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_DURATION_VALUE,
  DurationPill,
  compactEditorFieldWidths,
  durationValueFromSeconds,
  durationValueToSeconds,
  formatDurationValue,
  normalizeDurationValue,
  type DurationValue,
} from "../src/duration-pill/duration-pill";

function duration(hours: number, minutes: number, seconds = 0): DurationValue {
  return { hours, minutes, seconds };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("duration helpers", () => {
  it("normalizes structured units without mutating the input", () => {
    const source = duration(-2, 80, Number.NaN);

    expect(normalizeDurationValue(source)).toEqual(duration(0, 59, 0));
    expect(source).toEqual(duration(-2, 80, Number.NaN));
    expect(DEFAULT_DURATION_VALUE).toEqual(duration(0, 0, 0));
  });

  it("round-trips total seconds through canonical values", () => {
    expect(durationValueToSeconds(duration(2, 30, 45))).toBe(9045);
    expect(durationValueFromSeconds(9045)).toEqual(duration(2, 30, 45));
    expect(durationValueFromSeconds(-20)).toEqual(duration(0, 0, 0));
  });

  it("formats a clean compact value and includes seconds only when asked", () => {
    expect(formatDurationValue(duration(2, 30))).toBe("2 Hr 30 Min");
    expect(formatDurationValue(duration(0, 45, 12))).toBe("45 Min");
    expect(formatDurationValue(duration(0, 45, 12), true)).toBe(
      "45 Min 12 Sec",
    );
    expect(formatDurationValue(duration(0, 0), false)).toBe("0 Min");
    expect(formatDurationValue(duration(0, 0), true)).toBe("0 Sec");
  });
});

describe("DurationPill", () => {
  it("renders a compact, named value by default", () => {
    const { container } = render(
      <DurationPill defaultValue={duration(2, 30)} />,
    );

    expect(screen.getByRole("group", { name: "Duration" })).toHaveAttribute(
      "data-state",
      "display",
    );
    expect(
      screen.getByRole("button", {
        name: "Edit duration: 2 Hr 30 Min",
      }),
    ).toBeVisible();
    expect(container).toHaveTextContent("2Hr.30Min.");
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });

  it("uses a standard control height in the compact readout", () => {
    const { container } = render(
      <DurationPill defaultValue={duration(2, 30)} />,
    );
    const display = container.querySelector(
      '[data-slot="duration-pill-display"]',
    );

    expect(display).toHaveStyle({ height: "48px" });
  });

  it("grows the compact shell to keep large hour values legible", async () => {
    const largeValue = duration(55_434_232, 34);
    const { container } = render(<DurationPill defaultValue={largeValue} />);
    const track = container.querySelector('[data-slot="duration-pill-track"]');
    const hoursSurface = container.querySelector(
      '[data-duration-pill-surface="hours"]',
    );
    const hoursNumber = container.querySelector(
      '[data-slot="duration-pill-value-part"][data-unit="hours"] [data-slot="duration-pill-value-number"]',
    );

    await waitFor(() =>
      expect(
        Number.parseFloat((track as HTMLElement).style.width),
      ).toBeGreaterThan(184),
    );
    expect(
      Number.parseFloat((hoursSurface as HTMLElement).style.width),
    ).toBeGreaterThan(100);
    expect(hoursNumber).toHaveTextContent("55434232");
    expect(hoursNumber).toHaveClass("text-ellipsis", "overflow-hidden");
    expect(
      screen.getByRole("button", {
        name: "Edit duration: 55434232 Hr 34 Min",
      }),
    ).toBeVisible();
  });

  it("uses intrinsic content measurements for custom unit labels", async () => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.dataset.slot === "duration-pill-value-number" ? 18 : 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(
      function (this: HTMLElement) {
        if (this.dataset.slot !== "duration-pill-value-unit") return 0;
        return this.textContent === "WWW" ? 110 : 28;
      },
    );

    const { container } = render(
      <DurationPill
        defaultValue={duration(2, 30)}
        unitLabels={{ hours: "WWW" }}
      />,
    );
    const track = container.querySelector('[data-slot="duration-pill-track"]');

    await waitFor(() =>
      expect(
        Number.parseFloat((track as HTMLElement).style.width),
      ).toBeGreaterThan(240),
    );
  });

  it("opens into compact field tiles and a matching confirm action", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DurationPill defaultValue={duration(2, 30)} />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));

    const fields = container.querySelectorAll(
      '[data-slot="duration-pill-field"]',
    );
    const confirm = container.querySelector(
      '[data-slot="duration-pill-confirm"]',
    );
    const editor = container.querySelector(
      '[data-slot="duration-pill-editor"]',
    );

    expect(fields).toHaveLength(2);
    await waitFor(() =>
      expect(fields[0]).toHaveStyle({ height: "48px", width: "92px" }),
    );
    expect(fields[1]).toHaveStyle({ height: "48px", width: "92px" });
    expect(confirm).toHaveStyle({ height: "48px", width: "48px" });
    expect(editor).toHaveStyle({ gap: "12px" });
  });

  it("scales the seconds editor to the phone viewport instead of overflowing", async () => {
    const user = userEvent.setup();
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      320,
    );
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(320);

    const { container } = render(
      <DurationPill defaultValue={duration(0, 4, 30)} showSeconds />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));

    const track = container.querySelector('[data-slot="duration-pill-track"]');
    const confirm = container.querySelector(
      '[data-slot="duration-pill-confirm"]',
    );
    const fields = Array.from(
      container.querySelectorAll('[data-slot="duration-pill-segment"]'),
    );
    const inputs = screen.getAllByRole("spinbutton");

    await waitFor(() => expect(track).toHaveStyle({ width: "288px" }));
    await waitFor(() =>
      expect(
        Number.parseFloat((confirm as HTMLElement).style.width),
      ).toBeCloseTo(44.31, 2),
    );
    expect(
      Number.parseFloat((confirm as HTMLElement).style.height),
    ).toBeCloseTo(44.31, 2);
    fields.forEach((field) => {
      const style = (field as HTMLElement).style;

      expect(field).toHaveStyle({ columnGap: "6px" });
      expect(Number.parseFloat(style.paddingInline)).toBeCloseTo(8.31, 2);
    });
    inputs.forEach((input) => {
      expect(input).toHaveClass("flex-1", "min-w-0");
      expect(input.style.width).toBe("");
    });
  });

  it("keeps an arbitrarily long hour draft editable within the viewport", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const oversizedDraft = "9".repeat(80);
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      320,
    );
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(320);

    const { container } = render(
      <DurationPill
        defaultValue={duration(1, 34, 12)}
        max={duration(4, 0)}
        onValueChange={onValueChange}
        showSeconds
      />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    const hours = screen.getByRole("spinbutton", { name: "Hours" });
    const track = container.querySelector('[data-slot="duration-pill-track"]');
    const confirm = container.querySelector(
      '[data-slot="duration-pill-confirm"]',
    );
    fireEvent.change(hours, { target: { value: oversizedDraft } });

    expect(hours).toHaveValue(oversizedDraft);
    expect(hours).toHaveAttribute("aria-invalid", "true");
    expect(hours).toHaveClass("min-w-0", "flex-1");
    await waitFor(() => expect(track).toHaveStyle({ width: "288px" }));
    expect(
      Number.parseFloat((confirm as HTMLElement).style.width),
    ).toBeGreaterThanOrEqual(44);
    expect(screen.getByText("Hr.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Confirm duration" }));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(duration(4, 0));
  });

  it("caps compact content to its containing width without hiding the unit or action", async () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.dataset.testid === "duration-host" ? 220 : 0;
      },
    );
    const maximumValue = durationValueFromSeconds(Number.MAX_SAFE_INTEGER);
    const { container } = render(
      <div data-testid="duration-host">
        <DurationPill defaultValue={maximumValue} showSeconds />
      </div>,
    );
    const track = container.querySelector('[data-slot="duration-pill-track"]');
    const action = container.querySelector('[data-slot="duration-pill-edit"]');
    const hoursNumber = container.querySelector(
      '[data-slot="duration-pill-value-part"][data-unit="hours"] [data-slot="duration-pill-value-number"]',
    );

    await waitFor(() => expect(track).toHaveStyle({ width: "220px" }));
    expect(
      Number.parseFloat((action as HTMLElement).style.width),
    ).toBeGreaterThanOrEqual(44);
    expect(hoursNumber).toHaveClass("text-ellipsis", "min-w-0");
    expect(screen.getByText("Hr.")).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: `Edit duration: ${formatDurationValue(maximumValue, true)}`,
      }),
    ).toBeVisible();
  });

  it("starts every editor tile in its own section of the compact pill", () => {
    const fieldWidths = compactEditorFieldWidths(184, [92, 92], 48);
    const hiddenHoursWidths = compactEditorFieldWidths(184, [0, 76, 76], 48);
    const centers = (widths: number[], gap: number) => {
      let cursor = 0;

      return widths.map((width) => {
        const center = cursor + width / 2;
        cursor += width + gap;
        return center;
      });
    };
    const compactCenters = centers([...fieldWidths, 48], 0);
    const editorCenters = centers([92, 92, 48], 12);
    const centeredTrackShift = (184 - 256) / 2;
    const travel = editorCenters.map(
      (center, index) =>
        center + centeredTrackShift - (compactCenters[index] ?? 0),
    );

    expect(fieldWidths).toEqual([68, 68]);
    expect(hiddenHoursWidths).toEqual([0, 68, 68]);
    expect(fieldWidths.reduce((total, width) => total + width, 48)).toBe(184);
    expect(travel).toEqual([-24, 12, 36]);
  });

  it("places compact values inside the exact surfaces they separate from", () => {
    const { container } = render(
      <DurationPill defaultValue={duration(2, 34)} />,
    );
    const hoursSurface = container.querySelector(
      '[data-duration-pill-surface="hours"]',
    );
    const minutesSurface = container.querySelector(
      '[data-duration-pill-surface="minutes"]',
    );
    const actionSurface = container.querySelector(
      '[data-duration-pill-surface="action"]',
    );
    const hoursPart = container.querySelector(
      '[data-slot="duration-pill-compact-part"][data-unit="hours"]',
    );
    const minutesPart = container.querySelector(
      '[data-slot="duration-pill-compact-part"][data-unit="minutes"]',
    );

    expect(hoursSurface).toContainElement(hoursPart as HTMLElement);
    expect(minutesSurface).toContainElement(minutesPart as HTMLElement);
    expect(hoursSurface).toHaveStyle({ left: "0px", width: "68px" });
    expect(minutesSurface).toHaveStyle({ left: "68px", width: "68px" });
    expect(actionSurface).toHaveStyle({ left: "136px", width: "48px" });
  });

  it("keeps omitted units collapsed while visible units own their compact sections", () => {
    const { container } = render(
      <DurationPill defaultValue={duration(0, 4, 30)} showSeconds />,
    );
    const hoursSurface = container.querySelector(
      '[data-duration-pill-surface="hours"]',
    );
    const minutesSurface = container.querySelector(
      '[data-duration-pill-surface="minutes"]',
    );
    const secondsSurface = container.querySelector(
      '[data-duration-pill-surface="seconds"]',
    );
    const actionSurface = container.querySelector(
      '[data-duration-pill-surface="action"]',
    );
    const minutesPart = container.querySelector(
      '[data-slot="duration-pill-compact-part"][data-unit="minutes"]',
    );
    const secondsPart = container.querySelector(
      '[data-slot="duration-pill-compact-part"][data-unit="seconds"]',
    );

    expect(hoursSurface).toHaveStyle({ left: "0px", width: "0px" });
    expect(minutesSurface).toHaveStyle({ left: "0px", width: "68px" });
    expect(secondsSurface).toHaveStyle({ left: "68px", width: "68px" });
    expect(actionSurface).toHaveStyle({ left: "136px", width: "48px" });
    expect(minutesSurface).toContainElement(minutesPart as HTMLElement);
    expect(secondsSurface).toContainElement(secondsPart as HTMLElement);
    expect(
      container.querySelector(
        '[data-slot="duration-pill-compact-part"][data-unit="hours"]',
      ),
    ).toBeNull();
  });

  it("reuses the same three surfaces when it separates and merges", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DurationPill defaultValue={duration(2, 30)} />,
    );
    const action = screen.getByRole("button", { name: /Edit duration/ });
    const joinedSurfaces = Array.from(
      container.querySelectorAll("[data-duration-pill-surface]"),
    );
    const compactShell = container.querySelector(
      '[data-slot="duration-pill-compact-shell"]',
    );
    const compactShadow = container.querySelector(
      '[data-slot="duration-pill-compact-shadow"]',
    );

    expect(joinedSurfaces).toHaveLength(3);
    expect(compactShell).not.toHaveClass(
      "shadow-[var(--suluu-duration-pill-shadow)]",
    );
    expect(compactShadow).toHaveClass(
      "shadow-[var(--suluu-duration-pill-shadow)]",
    );
    expect(compactShadow).toHaveAttribute("data-state", "joined");
    joinedSurfaces.forEach((surface) => {
      expect(surface).toHaveClass("duration-300");
      expect(surface).toHaveClass("ease-in-out");
    });
    await user.click(screen.getByRole("button", { name: /Edit duration/ }));

    const separatedSurfaces = Array.from(
      container.querySelectorAll("[data-duration-pill-surface]"),
    );
    separatedSurfaces.forEach((surface, index) => {
      expect(surface).toBe(joinedSurfaces[index]);
      expect(surface).toHaveAttribute("data-state", "separated");
      expect(surface).toHaveClass("duration-200");
      expect(surface).toHaveClass("ease-out");
    });
    expect(compactShadow).toHaveAttribute("data-state", "separated");
    expect(screen.getByRole("button", { name: "Confirm duration" })).toBe(
      action,
    );

    await user.click(screen.getByRole("button", { name: "Confirm duration" }));

    const mergedSurfaces = Array.from(
      container.querySelectorAll("[data-duration-pill-surface]"),
    );
    mergedSurfaces.forEach((surface, index) => {
      expect(surface).toBe(joinedSurfaces[index]);
      expect(surface).toHaveAttribute("data-state", "joined");
      expect(surface).toHaveClass("duration-300");
      expect(surface).toHaveClass("ease-in-out");
    });
    expect(compactShadow).toHaveAttribute("data-state", "joined");
    expect(screen.getByRole("button", { name: /Edit duration/ })).toBe(action);
  });

  it("keeps the value passive and opens from an activated pencil", async () => {
    const user = userEvent.setup();
    const onEditChange = vi.fn();
    render(
      <DurationPill
        defaultValue={duration(2, 30)}
        onEditChange={onEditChange}
      />,
    );
    const trigger = screen.getByRole("button", { name: /Edit duration/ });

    await user.click(screen.getByText("Hr."));
    expect(screen.queryByRole("spinbutton")).toBeNull();

    trigger.focus();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    await user.keyboard("{Enter}");

    const hours = await screen.findByRole("spinbutton", { name: "Hours" });
    expect(hours).toHaveFocus();
    expect(hours).toHaveValue("2");
    expect(screen.getByRole("spinbutton", { name: "Minutes" })).toHaveValue(
      "30",
    );
    expect(onEditChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.getByRole("group", { name: "Duration" })).toHaveAttribute(
      "data-state",
      "edit",
    );
  });

  it("ignores the compact trigger blur during its focus handoff", async () => {
    render(<DurationPill defaultValue={duration(2, 30)} />);
    const trigger = screen.getByRole("button", { name: /Edit duration/ });

    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.blur(trigger, { relatedTarget: null });

    expect(
      await screen.findByRole("spinbutton", { name: "Hours" }),
    ).toHaveFocus();
    expect(screen.getByRole("group", { name: "Duration" })).toHaveAttribute(
      "data-state",
      "edit",
    );
  });

  it("keeps hour and minute fields hit-testable until an explicit commit", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <DurationPill
        defaultValue={duration(2, 30)}
        onValueChange={onValueChange}
      />,
    );
    const compactFields = Array.from(
      container.querySelectorAll('[data-slot="duration-pill-field"]'),
    );

    compactFields.forEach((field) => {
      expect(field).toHaveClass("pointer-events-none");
      expect(field).not.toHaveClass("pointer-events-auto");
    });

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));

    const editingFields = Array.from(
      container.querySelectorAll('[data-slot="duration-pill-field"]'),
    );
    editingFields.forEach((field) => {
      expect(field).toHaveClass("pointer-events-auto");
      expect(field).not.toHaveClass("pointer-events-none");
    });

    const minutes = screen.getByRole("spinbutton", { name: "Minutes" });
    const minutesSection = container.querySelector(
      '[data-duration-pill-surface="minutes"] [data-slot="duration-pill-segment"]',
    );
    await user.click(minutesSection as HTMLElement);
    await user.clear(minutes);
    await user.type(minutes, "45");
    expect(minutes).toHaveFocus();
    expect(minutes).toHaveValue("45");

    const hours = screen.getByRole("spinbutton", { name: "Hours" });
    const hoursSection = container.querySelector(
      '[data-duration-pill-surface="hours"] [data-slot="duration-pill-segment"]',
    );
    await user.click(hoursSection as HTMLElement);
    await user.clear(hours);
    await user.type(hours, "3");
    expect(hours).toHaveFocus();
    expect(hours).toHaveValue("3");
    expect(screen.getByRole("group", { name: "Duration" })).toHaveAttribute(
      "data-state",
      "edit",
    );
    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm duration" }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(duration(3, 45));
  });

  it("uses the active surface without drawing a focus ring around fields", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DurationPill defaultValue={duration(0, 4, 30)} showSeconds />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));

    const fields = Array.from(
      container.querySelectorAll('[data-slot="duration-pill-field"]'),
    );
    fields.forEach((field) => {
      expect(field).toHaveClass(
        "focus-within:bg-[var(--suluu-duration-pill-field-active)]",
      );
      expect(field).not.toHaveClass("focus-within:ring-2");
    });
  });

  it("opens from Space using native button semantics", async () => {
    const user = userEvent.setup();
    render(<DurationPill defaultValue={duration(2, 30)} />);
    const trigger = screen.getByRole("button", { name: /Edit duration/ });

    trigger.focus();
    await user.keyboard(" ");

    expect(
      await screen.findByRole("spinbutton", { name: "Hours" }),
    ).toHaveFocus();
  });

  it("commits an uncontrolled draft with the confirmation action", async () => {
    const user = userEvent.setup();
    const onEditChange = vi.fn();
    const onValueChange = vi.fn();
    render(
      <DurationPill
        defaultValue={duration(2, 30)}
        onEditChange={onEditChange}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Minutes" }), {
      target: { value: "45" },
    });
    await user.click(screen.getByRole("button", { name: "Confirm duration" }));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(duration(2, 45));
    expect(onEditChange.mock.calls).toEqual([[true], [false]]);
    const trigger = await screen.findByRole("button", {
      name: "Edit duration: 2 Hr 45 Min",
    });
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("keeps a controlled value authoritative after requesting a commit", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DurationPill onValueChange={onValueChange} value={duration(1, 20)} />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Minutes" }), {
      target: { value: "35" },
    });
    await user.click(screen.getByRole("button", { name: "Confirm duration" }));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(duration(1, 35));
    expect(
      await screen.findByRole("button", {
        name: "Edit duration: 1 Hr 20 Min",
      }),
    ).toBeVisible();
  });

  it("cancels the complete draft with Escape and restores focus", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DurationPill
        defaultValue={duration(2, 30)}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Hours" }), {
      target: { value: "04" },
    });
    await user.keyboard("{Escape}");

    expect(onValueChange).not.toHaveBeenCalled();
    const trigger = await screen.findByRole("button", {
      name: "Edit duration: 2 Hr 30 Min",
    });
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("commits with Enter and does not emit unchanged drafts", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DurationPill
        defaultValue={duration(0, 30)}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    await user.keyboard("{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Minutes" }), {
      target: { value: "40" },
    });
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(duration(0, 40));
  });

  it("keeps internal focus movement open and commits on an outside pointer", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <div>
        <DurationPill
          defaultValue={duration(1, 10)}
          onValueChange={onValueChange}
          showSeconds
        />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    const minutes = screen.getByRole("spinbutton", { name: "Minutes" });
    fireEvent.change(minutes, { target: { value: "25" } });
    await user.click(screen.getByRole("spinbutton", { name: "Seconds" }));

    expect(onValueChange).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("spinbutton", { name: "Hours" })).toBeVisible(),
    );
    const separatedSurfaces = Array.from(
      container.querySelectorAll("[data-duration-pill-surface]"),
    );

    await user.click(screen.getByRole("button", { name: "Outside" }));
    const joinedEditor = container.querySelector(
      '[data-slot="duration-pill-editor"]',
    );
    const visibleDisplay = container.querySelector(
      '[data-slot="duration-pill-display"]',
    );
    const joinedSurfaces = Array.from(
      container.querySelectorAll("[data-duration-pill-surface]"),
    );

    expect(joinedSurfaces).toHaveLength(separatedSurfaces.length);
    joinedSurfaces.forEach((surface, index) => {
      expect(surface).toBe(separatedSurfaces[index]);
      expect(surface).toHaveAttribute("data-state", "joined");
    });
    expect(joinedEditor).toHaveAttribute("data-state", "joined");
    expect(visibleDisplay).toHaveAttribute("data-state", "visible");
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(duration(1, 25));
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
  });

  it("preserves hidden seconds and exposes them only when requested", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const view = render(
      <DurationPill
        defaultValue={duration(1, 20, 37)}
        onValueChange={onValueChange}
      />,
    );

    expect(screen.getByRole("button", { name: /1 Hr 20 Min/ })).toBeVisible();
    expect(screen.queryByText("37")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Minutes" }), {
      target: { value: "30" },
    });
    await user.click(screen.getByRole("button", { name: "Confirm duration" }));
    expect(onValueChange).toHaveBeenCalledWith(duration(1, 30, 37));

    view.unmount();
    render(<DurationPill defaultValue={duration(1, 20, 37)} showSeconds />);
    expect(
      await screen.findByRole("button", {
        name: /1 Hr 20 Min 37 Sec/,
      }),
    ).toBeVisible();
  });

  it("steps through unit boundaries and clamps to the overall maximum", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DurationPill
        defaultValue={duration(1, 55)}
        max={duration(2, 0)}
        onValueChange={onValueChange}
        step={5}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    const minutes = screen.getByRole("spinbutton", { name: "Minutes" });
    fireEvent.keyDown(minutes, { key: "ArrowUp" });

    expect(screen.getByRole("spinbutton", { name: "Hours" })).toHaveValue("2");
    expect(minutes).toHaveValue("00");
    fireEvent.keyDown(minutes, { key: "ArrowUp" });
    expect(minutes).toHaveValue("00");

    await user.click(screen.getByRole("button", { name: "Confirm duration" }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(duration(2, 0));
  });

  it("commits exact direct entry independently of the arrow step", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DurationPill
        defaultValue={duration(0, 4, 30)}
        onValueChange={onValueChange}
        showSeconds
        step={5}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Minutes" }), {
      target: { value: "58" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Seconds" }), {
      target: { value: "59" },
    });
    await user.click(screen.getByRole("button", { name: "Confirm duration" }));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(duration(0, 58, 59));
    expect(
      await screen.findByRole("button", {
        name: "Edit duration: 58 Min 59 Sec",
      }),
    ).toBeVisible();
  });

  it("aligns off-step direct entry when an arrow key is used", async () => {
    const user = userEvent.setup();
    render(
      <DurationPill defaultValue={duration(0, 0, 30)} showSeconds step={5} />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    const minutes = screen.getByRole("spinbutton", { name: "Minutes" });
    const seconds = screen.getByRole("spinbutton", { name: "Seconds" });
    fireEvent.change(seconds, { target: { value: "59" } });
    fireEvent.keyDown(seconds, { key: "ArrowDown" });

    expect(minutes).toHaveValue("00");
    expect(seconds).toHaveValue("55");

    fireEvent.keyDown(seconds, { key: "ArrowUp" });
    expect(minutes).toHaveValue("01");
    expect(seconds).toHaveValue("00");
  });

  it("restores empty fields and clamps out-of-range drafts", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DurationPill
        defaultValue={duration(0, 12)}
        onValueChange={onValueChange}
        step={5}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    const minutes = screen.getByRole("spinbutton", { name: "Minutes" });
    fireEvent.change(minutes, { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "Confirm duration" }));
    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    const reopenedMinutes = screen.getByRole("spinbutton", { name: "Minutes" });
    fireEvent.change(reopenedMinutes, { target: { value: "99" } });
    expect(reopenedMinutes).toHaveAttribute("aria-invalid", "true");
    await user.click(screen.getByRole("button", { name: "Confirm duration" }));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(duration(0, 59));
  });

  it("supports custom compact formatting, labels, and both icon states", async () => {
    const user = userEvent.setup();
    render(
      <DurationPill
        defaultValue={duration(2, 5)}
        formatValue={(value) =>
          `${String(value.hours).padStart(2, "0")}:${String(value.minutes).padStart(2, "0")}`
        }
        labels={{
          confirm: "Save length",
          duration: "Session length",
          edit: "Change length",
          hours: "Hrs",
          minutes: "Mins",
        }}
        renderIcon={(state) => <span data-testid={`${state}-icon`} />}
        unitLabels={{ hours: "H.", minutes: "M." }}
      />,
    );

    expect(screen.getByRole("group", { name: "Session length" })).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Change length: 02:05" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("spinbutton", { name: "Hrs" })).toBeVisible(),
    );
    expect(screen.getByText("H.")).toBeVisible();
    await waitFor(() => expect(screen.getByText("M.")).toBeVisible());
    await waitFor(() =>
      expect(screen.getByTestId("confirm-icon")).toBeVisible(),
    );
    expect(screen.getByRole("button", { name: "Save length" })).toBeVisible();
  });

  it("distinguishes disabled and read-only presentation", async () => {
    const user = userEvent.setup();
    const view = render(
      <DurationPill disabled defaultValue={duration(1, 15)} />,
    );

    const disabled = screen.getByRole("button", { name: /Edit duration/ });
    expect(disabled).toBeDisabled();
    await user.click(disabled);
    expect(screen.queryByRole("spinbutton")).toBeNull();

    view.rerender(<DurationPill defaultValue={duration(1, 15)} readOnly />);
    const readOnly = screen.getByRole("textbox", { name: "1 Hr 15 Min" });
    expect(readOnly).toHaveAttribute("aria-readonly", "true");
    expect(readOnly).toHaveAttribute("tabindex", "0");
    readOnly.focus();
    expect(readOnly).toHaveFocus();
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });

  it("forwards root attributes, className, and its div ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <DurationPill
        aria-label="Estimate"
        className="custom-duration"
        data-testid="duration-root"
        motionIntensity="expressive"
        ref={ref}
      />,
    );

    expect(ref.current).toBe(screen.getByTestId("duration-root"));
    expect(ref.current).toHaveClass("custom-duration");
    expect(ref.current).toHaveAccessibleName("Estimate");
    expect(ref.current).toHaveAttribute("data-motion-intensity", "expressive");
  });

  it("renders deterministic compact markup on the server", () => {
    const markup = renderToStaticMarkup(
      <DurationPill defaultValue={duration(2, 30)} />,
    );

    expect(markup).toContain('data-slot="duration-pill"');
    expect(markup).toContain('data-state="display"');
    expect(markup).toContain("2");
    expect(markup).toContain("30");
  });

  it("has no detectable accessibility violations in its principal states", async () => {
    const user = userEvent.setup();
    const view = render(
      <DurationPill defaultValue={duration(2, 30)} showSeconds />,
    );

    expect(
      (
        await axe(view.container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);

    await user.click(screen.getByRole("button", { name: /Edit duration/ }));
    expect(
      (
        await axe(view.container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);

    view.rerender(<DurationPill defaultValue={duration(2, 30)} readOnly />);
    expect(
      (
        await axe(view.container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });
});
