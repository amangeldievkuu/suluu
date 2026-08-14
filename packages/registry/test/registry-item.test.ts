import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { registryItemSchema } from "shadcn/schema";
import { describe, expect, it } from "vitest";

import { generateRegistry, workspaceRoot } from "../src/generate";
import {
  createNotifyMorphRegistryItem,
  NOTIFY_MORPH_OUTPUT,
  NOTIFY_MORPH_SOURCE,
  serializeRegistryItem,
} from "../src/registry-item";

describe("NotifyMorph registry item", () => {
  it("passes the public shadcn schema", async () => {
    const source = await readFile(
      resolve(workspaceRoot, NOTIFY_MORPH_SOURCE),
      "utf8",
    );
    const item = createNotifyMorphRegistryItem(source);

    expect(registryItemSchema.safeParse(item).success).toBe(true);
    expect(item.type).toBe("registry:ui");
    expect(item.dependencies).toEqual(["motion@^13.1.0"]);
    const file = item.files?.[0];
    expect(item.files).toHaveLength(1);
    expect(file?.target).toBe("@ui/notify-morph.tsx");
    expect(file?.content).toBe(source);
  });

  it("serializes deterministically with a final newline", async () => {
    const source = await readFile(
      resolve(workspaceRoot, NOTIFY_MORPH_SOURCE),
      "utf8",
    );
    const first = serializeRegistryItem(createNotifyMorphRegistryItem(source));
    const second = serializeRegistryItem(createNotifyMorphRegistryItem(source));

    expect(first).toBe(second);
    expect(first.endsWith("\n")).toBe(true);
  });

  it("matches the checked-in generated artifact", async () => {
    await generateRegistry();
    const [source, generated] = await Promise.all([
      readFile(resolve(workspaceRoot, NOTIFY_MORPH_SOURCE), "utf8"),
      readFile(resolve(workspaceRoot, NOTIFY_MORPH_OUTPUT), "utf8"),
    ]);

    expect(generated).toBe(
      serializeRegistryItem(createNotifyMorphRegistryItem(source)),
    );
  });
});
