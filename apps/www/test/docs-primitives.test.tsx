import { render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import { ComponentPreview } from "@/components/docs/component-preview";
import { ContextExample } from "@/components/docs/context-example";
import { CssVariablesTable } from "@/components/docs/css-variables-table";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { DEFAULT_TOC_ITEMS } from "@/components/docs/docs-toc-items";
import { InstallSection } from "@/components/docs/install-section";
import { PropsTable } from "@/components/docs/props-table";
import { NPM_COMMAND, registryCommand, requireEntry } from "@/lib/catalog";

describe("DocsPageHeader", () => {
  it("derives the title and category from the catalog", () => {
    const entry = requireEntry("magnet-pull");
    render(<DocsPageHeader slug="magnet-pull">A lede.</DocsPageHeader>);

    expect(
      screen.getByRole("heading", { level: 1, name: entry.name }),
    ).toBeVisible();
    expect(screen.getByText(entry.category)).toBeVisible();
    expect(screen.getByText("A lede.")).toBeVisible();
  });

  it("links the breadcrumb back to the index", () => {
    render(<DocsPageHeader slug="notify-morph">A lede.</DocsPageHeader>);
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });

    expect(
      within(breadcrumb).getByRole("link", { name: "Components" }),
    ).toHaveAttribute("href", "/components");
  });
});

describe("InstallSection", () => {
  it("builds both install commands from the slug", () => {
    render(<InstallSection slug="magnet-pull" />);

    expect(screen.getByText(registryCommand("magnet-pull"))).toBeVisible();
    expect(screen.getByText(NPM_COMMAND)).toBeVisible();
  });

  it("anchors the section for the table of contents", () => {
    const { container } = render(<InstallSection slug="notify-morph" />);

    expect(container.querySelector("#installation")).not.toBeNull();
  });
});

describe("PropsTable", () => {
  const rows = [
    ["radius", "number", "120", "Field reach in pixels."],
    ["disabled", "boolean", "false", "Disables the control."],
  ] as const;

  it("renders a row per prop with all four columns", () => {
    render(<PropsTable rows={rows}>Intro copy.</PropsTable>);

    const table = screen.getByRole("table");
    // One header row plus one row per prop.
    expect(within(table).getAllByRole("row")).toHaveLength(rows.length + 1);
    expect(within(table).getByText("radius")).toBeVisible();
    expect(within(table).getByText("Field reach in pixels.")).toBeVisible();
    expect(screen.getByText("Intro copy.")).toBeVisible();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <PropsTable rows={rows}>Intro copy.</PropsTable>,
    );

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe("CssVariablesTable", () => {
  const rows = [
    ["--suluu-magnet-background", "Button surface."],
    ["--suluu-magnet-ring", "Focus ring."],
  ] as const;

  it("lists every variable with its description", () => {
    render(<CssVariablesTable rows={rows} />);

    for (const [name, description] of rows) {
      expect(screen.getByText(name)).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
    }
  });

  it("renders optional trailing notes", () => {
    render(
      <CssVariablesTable rows={rows}>
        <p>Extra note.</p>
      </CssVariablesTable>,
    );

    expect(screen.getByText("Extra note.")).toBeVisible();
  });
});

describe("ComponentPreview", () => {
  it("defaults the hint and renders its child", () => {
    render(
      <ComponentPreview>
        <button type="button">Demo</button>
      </ComponentPreview>,
    );

    expect(screen.getByText("Interactive")).toBeVisible();
    expect(screen.getByRole("button", { name: "Demo" })).toBeVisible();
  });

  it("accepts a custom hint", () => {
    render(
      <ComponentPreview hint="Move your cursor">
        <span>Demo</span>
      </ComponentPreview>,
    );

    expect(screen.getByText("Move your cursor")).toBeVisible();
  });
});

describe("ContextExample", () => {
  it("gives realistic examples a consistent heading and description", () => {
    render(
      <ContextExample description="A quiet product setting.">
        <button type="button">Try it</button>
      </ContextExample>,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "In context" }),
    ).toBeVisible();
    expect(screen.getByText("A quiet product setting.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try it" })).toBeVisible();
  });
});

describe("DEFAULT_TOC_ITEMS", () => {
  it("is a stable module-level array", async () => {
    const again = await import("@/components/docs/docs-toc-items");

    // DocsToc keeps `items` in a useEffect dependency array.
    expect(again.DEFAULT_TOC_ITEMS).toBe(DEFAULT_TOC_ITEMS);
  });

  it("has unique ids", () => {
    const ids = DEFAULT_TOC_ITEMS.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
