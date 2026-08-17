import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import { ComponentCard } from "@/components/component-card";
import { COMPONENT_PREVIEWS } from "@/components/demos/previews";
import { CATALOG, componentHref, getEntry } from "@/lib/catalog";

describe("component previews", () => {
  it("has a preview for every catalog entry and no orphans", () => {
    const previewSlugs = Object.keys(COMPONENT_PREVIEWS).sort();

    expect(previewSlugs).toEqual(CATALOG.map((entry) => entry.slug).sort());
  });
});

describe("ComponentCard", () => {
  const entry = getEntry("magnet-pull");
  if (!entry) throw new Error("Expected a magnet-pull catalog entry.");

  it("links to the component from its name", () => {
    render(<ComponentCard entry={entry} />);

    expect(screen.getByRole("link", { name: entry.name })).toHaveAttribute(
      "href",
      componentHref(entry.slug),
    );
  });

  it("renders the live component, outside the link", () => {
    render(<ComponentCard entry={entry} />);

    const link = screen.getByRole("link", { name: entry.name });
    const preview = screen.getByRole("button", { name: "Get started" });

    expect(preview).toBeVisible();
    // A button nested in an anchor is invalid markup and breaks both controls.
    expect(link).not.toContainElement(preview);
  });

  it("shows the category and summary", () => {
    render(<ComponentCard entry={entry} />);

    expect(screen.getByText(entry.category)).toBeVisible();
    expect(screen.getByText(entry.summary)).toBeVisible();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ComponentCard entry={entry} />);

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
