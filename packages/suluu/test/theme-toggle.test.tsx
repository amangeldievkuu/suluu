import type * as MotionReact from "motion/react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "../src/theme-toggle/theme-toggle";

function StarIcon({ slot }: { slot: string }) {
  return (
    <svg aria-hidden="true" data-testid={slot} viewBox="0 0 20 20">
      <path d="m10 2 2.2 5.4L18 10l-5.8 2.6L10 18l-2.2-5.4L2 10l5.8-2.6Z" />
    </svg>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ThemeToggle", () => {
  it("renders a light native toggle button with crafted default icons", () => {
    const { container } = render(<ThemeToggle />);
    const toggle = screen.getByRole("button", { name: "Dark mode" });

    expect(toggle).toHaveAttribute("type", "button");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("data-state", "light");
    expect(
      container.querySelector('[data-slot="theme-toggle-light-icon"] svg'),
    ).toBeVisible();
    expect(
      container.querySelector('[data-slot="theme-toggle-dark-icon"] svg'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="theme-toggle-dark-icon"]'),
    ).toHaveAttribute("data-state", "hidden");
    expect(
      container.querySelectorAll('[data-slot="theme-toggle-light-icon"] path'),
    ).toHaveLength(8);
    expect(
      container.querySelector('[data-slot="theme-toggle-dark-icon"] path'),
    ).toBeInTheDocument();
  });

  it("supports an uncontrolled default and emits changes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<ThemeToggle defaultChecked onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole("button", { name: "Dark mode" });

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("data-state", "dark");
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("data-state", "light");
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("keeps controlled state authoritative", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { rerender } = render(
      <ThemeToggle checked={false} onCheckedChange={onCheckedChange} />,
    );
    const toggle = screen.getByRole("button", { name: "Dark mode" });

    await user.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    rerender(<ThemeToggle checked onCheckedChange={onCheckedChange} />);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("data-state", "dark");
  });

  it("supports Enter and Space through native button behavior", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<ThemeToggle onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole("button", { name: "Dark mode" });

    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
  });

  it("composes click handlers and honors preventDefault", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const onClick = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    });
    render(<ThemeToggle onCheckedChange={onCheckedChange} onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Dark mode" }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("does not respond while disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<ThemeToggle disabled onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole("button", { name: "Dark mode" });

    expect(toggle).toBeDisabled();
    await user.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("uses aria-labelledby without adding the fallback label", () => {
    render(
      <>
        <span id="appearance-label">Appearance</span>
        <ThemeToggle aria-labelledby="appearance-label" />
      </>,
    );

    const toggle = screen.getByRole("button", { name: "Appearance" });
    expect(toggle).not.toHaveAttribute("aria-label");
  });

  it("accepts a custom accessible label", () => {
    render(<ThemeToggle aria-label="Night appearance" />);

    expect(
      screen.getByRole("button", { name: "Night appearance" }),
    ).toBeVisible();
  });

  it("accepts arbitrary light and dark icon content", () => {
    render(
      <ThemeToggle
        darkIcon={<StarIcon slot="night-icon" />}
        lightIcon={<span data-testid="day-icon">Day</span>}
      />,
    );

    expect(screen.getByTestId("day-icon")).toBeInTheDocument();
    expect(screen.getByTestId("night-icon")).toBeInTheDocument();
  });

  it.each(["subtle", "default", "expressive"] as const)(
    "supports the %s motion intensity",
    async (motionIntensity) => {
      const user = userEvent.setup();
      render(<ThemeToggle motionIntensity={motionIntensity} />);
      const toggle = screen.getByRole("button", { name: "Dark mode" });

      await user.click(toggle);
      expect(toggle).toHaveAttribute("data-state", "dark");
    },
  );

  it("forwards native attributes, class names, styles, and refs", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ThemeToggle
        className="custom-theme-toggle"
        data-purpose="appearance"
        name="theme"
        ref={ref}
        style={{ opacity: 0.8 }}
      />,
    );
    const toggle = screen.getByRole("button", { name: "Dark mode" });

    expect(ref.current).toBe(toggle);
    expect(toggle).toHaveClass("custom-theme-toggle");
    expect(toggle).toHaveAttribute("data-purpose", "appearance");
    expect(toggle).toHaveAttribute("name", "theme");
    expect(toggle).toHaveStyle({ opacity: "0.8" });
  });

  it("renders consistently on the server", () => {
    const markup = renderToStaticMarkup(<ThemeToggle defaultChecked />);

    expect(markup).toContain('aria-label="Dark mode"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('data-state="dark"');
  });

  it("keeps an opacity-only state change with reduced motion", async () => {
    // Motion latches the media query once per module lifetime. Import the
    // component against a fresh hook result to exercise the reduced branch.
    vi.resetModules();
    vi.doMock("motion/react", async () => ({
      ...(await vi.importActual<typeof MotionReact>("motion/react")),
      useReducedMotion: () => true,
    }));
    const { ThemeToggle: FreshThemeToggle } =
      await import("../src/theme-toggle/theme-toggle");
    const user = userEvent.setup();
    const { container } = render(<FreshThemeToggle />);
    const toggle = screen.getByRole("button", { name: "Dark mode" });

    await user.click(toggle);

    const lightIcon = container.querySelector<HTMLElement>(
      '[data-slot="theme-toggle-light-icon"]',
    );
    const darkIcon = container.querySelector<HTMLElement>(
      '[data-slot="theme-toggle-dark-icon"]',
    );
    expect(lightIcon).toHaveStyle({ filter: "blur(0px)" });
    expect(darkIcon).toHaveStyle({ filter: "blur(0px)" });
    expect(lightIcon?.style.transform).not.toContain("rotate");
    expect(darkIcon?.style.transform).not.toContain("rotate");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    vi.doUnmock("motion/react");
  });

  it("has no accessibility violations in either state", async () => {
    const { container, rerender } = render(<ThemeToggle />);

    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);

    rerender(<ThemeToggle checked />);
    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });
});
