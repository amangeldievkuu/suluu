import { describe, expect, it } from "vitest";

import {
  CATALOG,
  CATEGORIES,
  componentHref,
  FEATURED_SLUG,
  getEntry,
  groupByCategory,
  NPM_COMMAND,
  registryCommand,
  registryUrl,
  requireEntry,
  searchCatalog,
  type CatalogEntry,
} from "@/lib/catalog";

describe("catalog data", () => {
  it("keeps slugs and names unique", () => {
    const slugs = CATALOG.map((entry) => entry.slug);
    const names = CATALOG.map((entry) => entry.name);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("uses kebab-case slugs and non-empty summaries", () => {
    for (const entry of CATALOG) {
      expect(entry.slug).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(entry.summary.length).toBeGreaterThan(20);
      expect(entry.keywords.length).toBeGreaterThan(0);
    }
  });

  it("only uses declared categories", () => {
    for (const entry of CATALOG) {
      expect(CATEGORIES).toContain(entry.category);
    }
  });

  it("features a component that exists", () => {
    expect(getEntry(FEATURED_SLUG)).toBeDefined();
  });
});

describe("lookups", () => {
  it("finds an entry by slug and returns undefined otherwise", () => {
    expect(getEntry("magnet-pull")?.name).toBe("MagnetPull");
    expect(getEntry("nope")).toBeUndefined();
  });

  it("throws for a missing required entry", () => {
    expect(() => requireEntry("magnet-pull")).not.toThrow();
    expect(() =>
      requireEntry("nope" as (typeof CATALOG)[number]["slug"]),
    ).toThrow(/No catalog entry/);
  });

  it("builds hrefs and install commands from the slug", () => {
    expect(componentHref("magnet-pull")).toBe("/components/magnet-pull");
    expect(registryUrl("magnet-pull")).toBe(
      "https://suluu.dev/r/magnet-pull.json",
    );
    expect(registryCommand("magnet-pull")).toBe(
      "npx shadcn@latest add https://suluu.dev/r/magnet-pull.json",
    );
    expect(NPM_COMMAND).toBe("pnpm add suluu motion");
  });
});

describe("groupByCategory", () => {
  it("groups in CATEGORIES order and omits empty groups", () => {
    const groups = groupByCategory();

    expect(groups.map((group) => group.category)).toEqual([...CATEGORIES]);
    for (const group of groups) {
      expect(group.entries.length).toBeGreaterThan(0);
      for (const entry of group.entries) {
        expect(entry.category).toBe(group.category);
      }
    }
  });

  it("includes every entry exactly once", () => {
    const grouped = groupByCategory().flatMap((group) => group.entries);

    expect(grouped).toHaveLength(CATALOG.length);
    expect(new Set(grouped.map((entry) => entry.slug)).size).toBe(
      CATALOG.length,
    );
  });

  it("omits categories with no entries", () => {
    const onlyButtons = CATALOG.filter((entry) => entry.category === "Buttons");

    expect(groupByCategory(onlyButtons).map((group) => group.category)).toEqual(
      ["Buttons"],
    );
  });
});

describe("searchCatalog", () => {
  it("returns everything for an empty or whitespace query", () => {
    expect(searchCatalog("")).toHaveLength(CATALOG.length);
    expect(searchCatalog("   ")).toHaveLength(CATALOG.length);
  });

  it("returns nothing when nothing matches", () => {
    expect(searchCatalog("zzzzz")).toEqual([]);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(searchCatalog("  MAGNET  ")[0]?.slug).toBe("magnet-pull");
  });

  it("matches on a name prefix", () => {
    expect(searchCatalog("magn")[0]?.slug).toBe("magnet-pull");
  });

  it("matches on the slug", () => {
    expect(searchCatalog("notify-morph")[0]?.slug).toBe("notify-morph");
  });

  it("matches on a keyword that is in neither the name nor the summary", () => {
    const results = searchCatalog("newsletter");

    expect(results).toHaveLength(1);
    expect(results[0]?.slug).toBe("notify-morph");
  });

  it("matches on the category", () => {
    expect(searchCatalog("buttons").map((entry) => entry.slug)).toEqual([
      "magnet-pull",
      "morph-button",
    ]);
  });

  it("finds the numeric display by its category and keyword", () => {
    expect(searchCatalog("data display")[0]?.slug).toBe("counter-numbers");
    expect(searchCatalog("odometer")[0]?.slug).toBe("counter-numbers");
  });

  it("ranks a name hit above a summary-only hit", () => {
    const entries: CatalogEntry[] = [
      {
        slug: "summary-hit",
        name: "Alpha",
        category: "Forms",
        summary: "Mentions magnet in the summary only.",
        keywords: [],
      },
      {
        slug: "name-hit",
        name: "Magnet",
        category: "Buttons",
        summary: "Unrelated.",
        keywords: [],
      },
    ];

    expect(searchCatalog("magnet", entries).map((entry) => entry.slug)).toEqual(
      ["name-hit", "summary-hit"],
    );
  });

  it("ranks an exact name above a prefix match", () => {
    const entries: CatalogEntry[] = [
      {
        slug: "prefix",
        name: "Magnetic",
        category: "Buttons",
        summary: "Prefix match.",
        keywords: [],
      },
      {
        slug: "exact",
        name: "Magnet",
        category: "Buttons",
        summary: "Exact match.",
        keywords: [],
      },
    ];

    expect(searchCatalog("magnet", entries).map((entry) => entry.slug)).toEqual(
      ["exact", "prefix"],
    );
  });

  it("breaks ties alphabetically by name", () => {
    const entries: CatalogEntry[] = [
      {
        slug: "beta",
        name: "Beta",
        category: "Buttons",
        summary: "Shared term here.",
        keywords: [],
      },
      {
        slug: "alpha",
        name: "Alpha",
        category: "Buttons",
        summary: "Shared term here.",
        keywords: [],
      },
    ];

    expect(searchCatalog("shared", entries).map((entry) => entry.slug)).toEqual(
      ["alpha", "beta"],
    );
  });

  it("does not mutate the source array", () => {
    const before = CATALOG.map((entry) => entry.slug);
    searchCatalog("magnet");

    expect(CATALOG.map((entry) => entry.slug)).toEqual(before);
  });
});
