import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { workspaceRoot } from "./generate";
import { REGISTRY_ITEMS, serializeRegistryItem } from "./registry-item";

for (const item of REGISTRY_ITEMS) {
  const [source, generated] = await Promise.all([
    readFile(resolve(workspaceRoot, item.source), "utf8"),
    readFile(resolve(workspaceRoot, item.output), "utf8"),
  ]);

  if (generated !== serializeRegistryItem(item.create(source))) {
    throw new Error(
      `Registry output for ${item.name} is stale. Run \`pnpm registry:generate\` and commit the result.`,
    );
  }
}

process.stdout.write("Registry output is current.\n");
