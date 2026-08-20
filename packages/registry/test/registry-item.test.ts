import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { registryItemSchema } from "shadcn/schema";
import { describe, expect, it } from "vitest";

import { generateRegistry, workspaceRoot } from "../src/generate";
import {
  REGISTRY_ITEMS,
  serializeRegistryItem,
  type RegistryItemDescriptor,
} from "../src/registry-item";

function readSource(item: RegistryItemDescriptor): Promise<string> {
  return readFile(resolve(workspaceRoot, item.source), "utf8");
}

describe("registry catalog", () => {
  it("keeps names and output paths unique", () => {
    const names = REGISTRY_ITEMS.map((item) => item.name);
    const outputs = REGISTRY_ITEMS.map((item) => item.output);

    expect(new Set(names).size).toBe(names.length);
    expect(new Set(outputs).size).toBe(outputs.length);
  });

  it("serves every component the package exports", () => {
    expect(REGISTRY_ITEMS.map((item) => item.name)).toEqual([
      "counter-numbers",
      "magnet-pull",
      "morph-button",
      "notify-morph",
      "search-morph",
      "segmented-control",
      "slide-control",
      "switch-toggle",
      "toast",
    ]);
  });
});

describe.each(REGISTRY_ITEMS)("$name registry item", (item) => {
  it("passes the public shadcn schema", async () => {
    const source = await readSource(item);
    const registryItem = item.create(source);

    expect(registryItemSchema.safeParse(registryItem).success).toBe(true);
    expect(registryItem.type).toBe("registry:ui");
    expect(registryItem.dependencies).toEqual(["motion@^13.1.0"]);
    const file = registryItem.files?.[0];
    expect(registryItem.files).toHaveLength(1);
    expect(file?.target).toBe(`@ui/${item.name}.tsx`);
    expect(file?.content).toBe(source);
  });

  it("themes light and dark from the same variable set", async () => {
    const source = await readSource(item);
    const { cssVars } = item.create(source);
    if (!cssVars) {
      expect(item.name).toBe("counter-numbers");
      return;
    }
    const light = Object.keys(cssVars.light ?? {});

    expect(light.length).toBeGreaterThan(0);
    expect(Object.keys(cssVars.dark ?? {})).toEqual(light);
  });

  it("serializes deterministically with a final newline", async () => {
    const source = await readSource(item);
    const first = serializeRegistryItem(item.create(source));
    const second = serializeRegistryItem(item.create(source));

    expect(first).toBe(second);
    expect(first.endsWith("\n")).toBe(true);
  });

  it("matches the checked-in generated artifact", async () => {
    await generateRegistry();
    const [source, generated] = await Promise.all([
      readSource(item),
      readFile(resolve(workspaceRoot, item.output), "utf8"),
    ]);

    expect(generated).toBe(serializeRegistryItem(item.create(source)));
  });
});
