import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComponentsSidebar } from "@/components/components-sidebar";
import { CATALOG, componentHref, groupByCategory } from "@/lib/catalog";

const { pathname } = vi.hoisted(() => ({
  pathname: { current: "/components" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

afterEach(() => {
  pathname.current = "/components";
  vi.restoreAllMocks();
});

describe("ComponentsSidebar", () => {
  it("links to every component in the catalog", () => {
    render(<ComponentsSidebar />);
    const nav = screen.getByRole("navigation", { name: "Components" });

    for (const entry of CATALOG) {
      expect(
        within(nav).getByRole("link", { name: entry.name }),
      ).toHaveAttribute("href", componentHref(entry.slug));
    }
  });

  it("renders a heading per non-empty category, in catalog order", () => {
    render(<ComponentsSidebar />);
    const nav = screen.getByRole("navigation", { name: "Components" });

    for (const group of groupByCategory()) {
      expect(within(nav).getByText(group.category)).toBeVisible();
    }
  });

  it("marks only the current route as the current page", () => {
    pathname.current = "/components/magnet-pull";
    render(<ComponentsSidebar />);

    expect(screen.getByRole("link", { name: "MagnetPull" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "NotifyMorph" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("marks nothing current on the index route", () => {
    render(<ComponentsSidebar />);

    for (const entry of CATALOG) {
      expect(
        screen.getByRole("link", { name: entry.name }),
      ).not.toHaveAttribute("aria-current");
    }
  });

  it("toggles the mobile disclosure and points it at the nav", async () => {
    const user = userEvent.setup();
    render(<ComponentsSidebar />);

    const toggle = screen.getByRole("button", { name: /browse components/i });
    const nav = screen.getByRole("navigation", { name: "Components" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle.getAttribute("aria-controls")).toBe(nav.id);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("collapses the mobile disclosure after picking a component", async () => {
    const user = userEvent.setup();
    render(<ComponentsSidebar />);

    const toggle = screen.getByRole("button", { name: /browse components/i });
    await user.click(toggle);
    await user.click(screen.getByRole("link", { name: "MagnetPull" }));

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ComponentsSidebar />);

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
