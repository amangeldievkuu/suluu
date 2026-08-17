import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  resolveSwitchDragTarget,
  SwitchToggle,
} from "../src/switch-toggle/switch-toggle";

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveSwitchDragTarget", () => {
  it("uses the midpoint for an ordinary release", () => {
    expect(resolveSwitchDragTarget(10.9, 0)).toBe(false);
    expect(resolveSwitchDragTarget(11, 0)).toBe(true);
  });

  it("lets a deliberate flick override position", () => {
    expect(resolveSwitchDragTarget(3, 500)).toBe(true);
    expect(resolveSwitchDragTarget(20, -500)).toBe(false);
  });

  it("ignores small release velocity", () => {
    expect(resolveSwitchDragTarget(3, 499)).toBe(false);
    expect(resolveSwitchDragTarget(20, -499)).toBe(true);
  });
});

describe("SwitchToggle", () => {
  it("renders an unchecked switch with a native-safe button type", () => {
    const { container } = render(
      <SwitchToggle aria-label="Background sounds" />,
    );
    const toggle = screen.getByRole("switch", {
      name: "Background sounds",
    });

    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveAttribute("data-state", "unchecked");
    expect(toggle).toHaveAttribute("data-dragging", "false");
    expect(toggle).toHaveAttribute("type", "button");
    expect(
      container.querySelector('[data-slot="switch-toggle-thumb"]'),
    ).toBeVisible();
    expect(
      container.querySelector('[data-slot="switch-toggle-icon"]'),
    ).toBeVisible();
  });

  it("supports an uncontrolled default and emits changes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <SwitchToggle
        aria-label="Background sounds"
        defaultChecked
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole("switch");

    expect(toggle).toBeChecked();
    await user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAttribute("data-state", "unchecked");
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("morphs the icon between minus and check endpoints", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SwitchToggle aria-label="Background sounds" />,
    );
    const path = container.querySelector(
      '[data-slot="switch-toggle-icon"] path',
    );

    expect(path).toHaveAttribute("d", "M7 12 L12 12 L17 12");
    await user.click(screen.getByRole("switch"));
    await waitFor(() => {
      expect(path).toHaveAttribute("d", "M7 12.5 L10.5 16 L17 8.5");
    });
  });

  it("supports Enter and Space through native button behavior", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <SwitchToggle
        aria-label="Background sounds"
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole("switch");

    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toBeChecked();

    await user.keyboard(" ");
    expect(toggle).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
  });

  it("keeps controlled state authoritative", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { rerender } = render(
      <SwitchToggle
        aria-label="Background sounds"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole("switch");

    await user.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(toggle).not.toBeChecked();

    rerender(
      <SwitchToggle
        aria-label="Background sounds"
        checked
        onCheckedChange={onCheckedChange}
      />,
    );
    expect(toggle).toBeChecked();
    expect(toggle).toHaveAttribute("data-state", "checked");
  });

  it("composes click handlers and honors preventDefault", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const onClick = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    });
    render(
      <SwitchToggle
        aria-label="Background sounds"
        onCheckedChange={onCheckedChange}
        onClick={onClick}
      />,
    );

    await user.click(screen.getByRole("switch"));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("does not respond while disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <SwitchToggle
        aria-label="Background sounds"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole("switch");

    expect(toggle).toBeDisabled();
    await user.click(toggle);
    fireEvent.pointerDown(toggle, {
      button: 0,
      isPrimary: true,
      pointerId: 1,
    });

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(toggle).not.toBeChecked();
  });

  it("commits a drag once and suppresses its trailing click", async () => {
    const onCheckedChange = vi.fn();
    render(
      <SwitchToggle
        aria-label="Background sounds"
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole("switch");

    fireEvent.pointerDown(toggle, {
      button: 0,
      clientX: 0,
      isPrimary: true,
      pageX: 0,
      pointerId: 1,
    });
    fireEvent.pointerMove(window, {
      button: 0,
      clientX: 20,
      isPrimary: true,
      pageX: 20,
      pointerId: 1,
    });
    await waitFor(() => {
      expect(toggle).toHaveAttribute("data-dragging", "true");
    });
    await waitFor(() => {
      expect(readTransform(toggle, "translateX", 0)).toBeGreaterThan(0.1);
      expect(readTransform(toggle, "scaleX", 1)).toBeGreaterThan(1);
      expect(readTransform(toggle, "scaleY", 1)).toBeLessThan(1);
    });
    fireEvent.pointerUp(window, {
      button: 0,
      clientX: 20,
      isPrimary: true,
      pageX: 20,
      pointerId: 1,
    });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
    });
    expect(toggle).toBeChecked();
    await waitFor(
      () => {
        expect(readTransform(toggle, "translateX", 0)).toBeCloseTo(0, 1);
        expect(readTransform(toggle, "scaleX", 1)).toBeCloseTo(1, 1);
        expect(readTransform(toggle, "scaleY", 1)).toBeCloseTo(1, 1);
      },
      { timeout: 2000 },
    );
  });

  it("pulls the pill left when dragging back to unchecked", async () => {
    render(<SwitchToggle aria-label="Background sounds" defaultChecked />);
    const toggle = screen.getByRole("switch");

    fireEvent.pointerDown(toggle, {
      button: 0,
      clientX: 22,
      isPrimary: true,
      pageX: 22,
      pointerId: 1,
    });
    fireEvent.pointerMove(window, {
      button: 0,
      clientX: 2,
      isPrimary: true,
      pageX: 2,
      pointerId: 1,
    });

    await waitFor(() => {
      expect(toggle).toHaveAttribute("data-dragging", "true");
      expect(readTransform(toggle, "translateX", 0)).toBeLessThan(-0.1);
      expect(readTransform(toggle, "scaleX", 1)).toBeGreaterThan(1);
      expect(readTransform(toggle, "scaleY", 1)).toBeLessThan(1);
    });

    fireEvent.pointerUp(window, {
      button: 0,
      clientX: 2,
      isPrimary: true,
      pageX: 2,
      pointerId: 1,
    });

    await waitFor(() => {
      expect(toggle).not.toBeChecked();
    });
  });

  it.each([
    ["right", false, 0, 80, 22],
    ["left", true, 22, -58, 0],
  ] as const)(
    "keeps the thumb inside the track during %s over-drag",
    async (_direction, defaultChecked, startX, endX, expectedThumbX) => {
      const { container } = render(
        <SwitchToggle
          aria-label="Background sounds"
          defaultChecked={defaultChecked}
        />,
      );
      const toggle = screen.getByRole("switch");
      const thumb = container.querySelector<HTMLElement>(
        '[data-slot="switch-toggle-thumb"]',
      );
      if (!thumb) throw new Error("Expected the switch thumb to render.");

      fireEvent.pointerDown(toggle, {
        button: 0,
        clientX: startX,
        isPrimary: true,
        pageX: startX,
        pointerId: 1,
      });
      fireEvent.pointerMove(window, {
        button: 0,
        clientX: endX,
        isPrimary: true,
        pageX: endX,
        pointerId: 1,
      });

      await waitFor(() => {
        expect(toggle).toHaveAttribute("data-dragging", "true");
        expect(readTransform(thumb, "translateX", 0)).toBeCloseTo(
          expectedThumbX,
          1,
        );
        expect(readTransform(toggle, "scaleX", 1)).toBeGreaterThan(1.05);
      });

      fireEvent.pointerUp(window, {
        button: 0,
        clientX: endX,
        isPrimary: true,
        pageX: endX,
        pointerId: 1,
      });
    },
  );

  it("forwards native attributes, class names, styles, and refs", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <SwitchToggle
        aria-label="Background sounds"
        className="custom-switch"
        data-purpose="setting"
        name="sounds"
        ref={ref}
        style={{ opacity: 0.8 }}
      />,
    );
    const toggle = screen.getByRole("switch");

    expect(ref.current).toBe(toggle);
    expect(toggle).toHaveClass("custom-switch");
    expect(toggle).toHaveAttribute("data-purpose", "setting");
    expect(toggle).toHaveAttribute("name", "sounds");
    expect(toggle).toHaveStyle({ opacity: "0.8" });
  });

  it("renders consistently on the server", () => {
    const markup = renderToStaticMarkup(
      <SwitchToggle aria-label="Background sounds" defaultChecked />,
    );

    expect(markup).toContain('role="switch"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain('data-state="checked"');
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

    render(<SwitchToggle aria-label="Background sounds" />);
    const toggle = screen.getByRole("switch");
    await user.click(toggle);

    expect(toggle).toBeChecked();
    await waitFor(() => {
      const thumb = document.querySelector<HTMLElement>(
        '[data-slot="switch-toggle-thumb"]',
      );
      expect(thumb?.style.transform).toContain("22px");
    });

    fireEvent.pointerDown(toggle, {
      button: 0,
      clientX: 22,
      isPrimary: true,
      pageX: 22,
      pointerId: 2,
    });
    fireEvent.pointerMove(window, {
      button: 0,
      clientX: 2,
      isPrimary: true,
      pageX: 2,
      pointerId: 2,
    });
    await waitFor(() => {
      expect(toggle).toHaveAttribute("data-dragging", "true");
    });
    expect(readTransform(toggle, "translateX", 0)).toBeCloseTo(0, 2);
    expect(readTransform(toggle, "scaleX", 1)).toBeCloseTo(1, 2);
    expect(readTransform(toggle, "scaleY", 1)).toBeCloseTo(1, 2);

    fireEvent.pointerUp(window, {
      button: 0,
      clientX: 2,
      isPrimary: true,
      pageX: 2,
      pointerId: 2,
    });
  });

  it("has no accessibility violations in either state", async () => {
    const { container, rerender } = render(
      <SwitchToggle aria-label="Background sounds" />,
    );

    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);

    rerender(<SwitchToggle aria-label="Background sounds" checked />);
    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });
});
