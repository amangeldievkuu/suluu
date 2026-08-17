// @vitest-environment node
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CATALOG } from "@/lib/catalog";

/**
 * The catalog is deliberately not imported from `packages/registry` — that
 * would drag `shadcn/schema` and a workspace-root `fs` read into the Next build
 * graph. These tests keep the two in step instead, using the generated
 * artifacts that already live inside this app.
 */
const registryDir = fileURLToPath(new URL("../public/r", import.meta.url));

interface RegistryItem {
  categories?: string[];
  description?: string;
  name?: string;
  title?: string;
}

async function readRegistryItem(slug: string): Promise<RegistryItem> {
  const raw = await readFile(`${registryDir}/${slug}.json`, "utf8");

  return JSON.parse(raw) as RegistryItem;
}

describe("catalog and generated registry stay in step", () => {
  it("has no registry artifact without a catalog entry", async () => {
    const files = await readdir(registryDir);
    const published = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/, ""))
      .sort();

    expect(published).toEqual(CATALOG.map((entry) => entry.slug).sort());
  });

  it.each(CATALOG)("$slug matches its registry item", async (entry) => {
    const item = await readRegistryItem(entry.slug);

    expect(item.name).toBe(entry.slug);
    expect(item.title).toBe(entry.name);
  });

  it.each(CATALOG)("$slug agrees on category", async (entry) => {
    const item = await readRegistryItem(entry.slug);

    // The registry uses lowercase plural tags; the site uses one display label.
    expect(item.categories).toContain(entry.category.toLowerCase());
  });
});
