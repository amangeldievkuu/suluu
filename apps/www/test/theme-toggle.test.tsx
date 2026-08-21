import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "@/components/theme-toggle";

const themeState = vi.hoisted(
  (): {
    resolvedTheme: string | undefined;
    setTheme: ReturnType<typeof vi.fn>;
  } => ({
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
);

vi.mock("next-themes", () => ({
  useTheme: () => themeState,
}));

beforeEach(() => {
  themeState.resolvedTheme = "light";
  themeState.setTheme.mockReset();
});

describe("site ThemeToggle", () => {
  it("maps the resolved theme to the public control", () => {
    themeState.resolvedTheme = "dark";
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Dark mode" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("maps requested states back to explicit next-themes values", () => {
    const { rerender } = render(<ThemeToggle />);
    const toggle = screen.getByRole("button", { name: "Dark mode" });

    fireEvent.click(toggle);
    expect(themeState.setTheme).toHaveBeenCalledExactlyOnceWith("dark");

    themeState.resolvedTheme = "dark";
    rerender(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(themeState.setTheme).toHaveBeenLastCalledWith("light");
  });

  it("renders a disabled, hydration-safe server snapshot", () => {
    themeState.resolvedTheme = "dark";
    const markup = renderToStaticMarkup(<ThemeToggle />);

    expect(markup).toContain("disabled");
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain('data-state="light"');
  });
});
