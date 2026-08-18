import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps, type KeyboardEvent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "../src/segmented-control/segmented-control";

const RANGE_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

function renderRange(
  props: Partial<ComponentProps<typeof SegmentedControl>> = {},
) {
  return render(
    <SegmentedControl aria-label="Range" options={RANGE_OPTIONS} {...props} />,
  );
}

function readTransform(
  element: HTMLElement,
  transform: "scaleX" | "scaleY",
  fallback: number,
): number {
  const match = new RegExp(`${transform}\\((-?[\\d.]+)(?:px)?\\)`).exec(
    element.style.transform,
  );
  return match?.[1] === undefined ? fallback : Number(match[1]);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SegmentedControl", () => {
  it("renders a radiogroup and selects the first option by default", () => {
    const { container } = renderRange();
    const group = screen.getByRole("radiogroup", { name: "Range" });

    expect(group).toHaveAttribute("data-slot", "segmented-control");
    expect(group).toHaveAttribute("data-state", "day");
    expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Week" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Month" })).not.toBeChecked();
    expect(
      container.querySelector('[data-slot="segmented-control-pill"]'),
    ).toBeVisible();
  });

  it("supports an uncontrolled default and emits changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderRange({ defaultValue: "week", onValueChange });

    expect(screen.getByRole("radio", { name: "Week" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Month" }));

    expect(screen.getByRole("radio", { name: "Month" })).toBeChecked();
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "data-state",
      "month",
    );
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("month");
  });

  it("does not emit when the selected option is clicked again", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderRange({ defaultValue: "day", onValueChange });

    await user.click(screen.getByRole("radio", { name: "Day" }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps controlled state authoritative", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = renderRange({
      onValueChange,
      value: "day",
    });

    await user.click(screen.getByRole("radio", { name: "Week" }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("week");
    expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();

    rerender(
      <SegmentedControl
        aria-label="Range"
        onValueChange={onValueChange}
        options={RANGE_OPTIONS}
        value="week"
      />,
    );
    expect(screen.getByRole("radio", { name: "Week" })).toBeChecked();
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "data-state",
      "week",
    );
  });

  it("moves selection with arrow keys, wrapping at the ends", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderRange({ defaultValue: "week", onValueChange });

    screen.getByRole("radio", { name: "Week" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Month" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Month" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Month" })).toBeChecked();

    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();

    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Month" })).toBeChecked();
    expect(onValueChange).toHaveBeenNthCalledWith(1, "month");
    expect(onValueChange).toHaveBeenNthCalledWith(2, "day");
    expect(onValueChange).toHaveBeenNthCalledWith(3, "month");
    expect(onValueChange).toHaveBeenNthCalledWith(4, "day");
    expect(onValueChange).toHaveBeenNthCalledWith(5, "month");
  });

  it("skips disabled options while moving with the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <SegmentedControl
        aria-label="Range"
        defaultValue="day"
        options={[
          { value: "day", label: "Day" },
          { value: "week", label: "Week", disabled: true },
          { value: "month", label: "Month" },
        ]}
      />,
    );

    screen.getByRole("radio", { name: "Day" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: "Month" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Week" })).toBeDisabled();
  });

  it("uses a roving tabindex so only the selected option is tabbable", () => {
    renderRange({ defaultValue: "week" });

    expect(screen.getByRole("radio", { name: "Day" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "Week" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("radio", { name: "Month" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("does not respond while the group is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderRange({ disabled: true, onValueChange });

    expect(screen.getByRole("radio", { name: "Day" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Week" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "Week" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();
  });

  it("composes key handlers and honors preventDefault", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLDivElement>) => {
      event.preventDefault();
    });
    renderRange({ defaultValue: "day", onKeyDown, onValueChange });

    screen.getByRole("radio", { name: "Day" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(onKeyDown).toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();
  });

  it("forwards native attributes, class names, styles, and refs", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <SegmentedControl
        aria-label="Range"
        className="custom-segment"
        data-purpose="filter"
        options={RANGE_OPTIONS}
        ref={ref}
        style={{ opacity: 0.8 }}
      />,
    );
    const group = screen.getByRole("radiogroup");

    expect(ref.current).toBe(group);
    expect(group).toHaveClass("custom-segment");
    expect(group).toHaveAttribute("data-purpose", "filter");
    expect(group).toHaveStyle({ opacity: "0.8" });
  });

  it("keeps two instances independent", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SegmentedControl
          aria-label="Start"
          defaultValue="day"
          options={RANGE_OPTIONS}
        />
        <SegmentedControl
          aria-label="End"
          defaultValue="month"
          options={RANGE_OPTIONS}
        />
      </>,
    );

    await user.click(
      within(screen.getByRole("radiogroup", { name: "Start" })).getByRole(
        "radio",
        { name: "Week" },
      ),
    );

    expect(screen.getByRole("radiogroup", { name: "Start" })).toHaveAttribute(
      "data-state",
      "week",
    );
    expect(screen.getByRole("radiogroup", { name: "End" })).toHaveAttribute(
      "data-state",
      "month",
    );
    expect(
      screen
        .getAllByRole("radio", { name: "Month" })
        .filter((option) => option.getAttribute("aria-checked") === "true"),
    ).toHaveLength(1);
  });

  it("renders consistently on the server", () => {
    const markup = renderToStaticMarkup(
      <SegmentedControl
        aria-label="Range"
        defaultValue="week"
        options={RANGE_OPTIONS}
      />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain("Week");
    expect(markup).toContain('data-state="week"');
  });

  it("squashes the pill while the selection travels", async () => {
    const user = userEvent.setup();
    const { container } = renderRange({ defaultValue: "day" });

    await user.click(screen.getByRole("radio", { name: "Month" }));

    await waitFor(() => {
      const pill = container.querySelector<HTMLElement>(
        '[data-slot="segmented-control-pill"]',
      );
      if (!pill) throw new Error("Expected the segmented pill to render.");
      expect(readTransform(pill, "scaleX", 1)).toBeGreaterThan(1);
      expect(readTransform(pill, "scaleY", 1)).toBeLessThan(1);
    });
  });

  it("remains usable when reduced motion is preferred", async () => {
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

    renderRange();
    await user.click(screen.getByRole("radio", { name: "Month" }));

    expect(screen.getByRole("radio", { name: "Month" })).toBeChecked();
    const pill = document.querySelector<HTMLElement>(
      '[data-slot="segmented-control-pill"]',
    );
    if (!pill) throw new Error("Expected the segmented pill to render.");
    expect(pill).toBeVisible();
    expect(readTransform(pill, "scaleX", 1)).toBeCloseTo(1, 2);
    expect(readTransform(pill, "scaleY", 1)).toBeCloseTo(1, 2);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderRange({ defaultValue: "week" });

    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });
});
