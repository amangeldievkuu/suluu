import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { workspaceRoot } from "./generate";
import {
  createNotifyMorphRegistryItem,
  NOTIFY_MORPH_OUTPUT,
  NOTIFY_MORPH_SOURCE,
  serializeRegistryItem,
} from "./registry-item";

const [source, generated] = await Promise.all([
  readFile(resolve(workspaceRoot, NOTIFY_MORPH_SOURCE), "utf8"),
  readFile(resolve(workspaceRoot, NOTIFY_MORPH_OUTPUT), "utf8"),
]);
const expected = serializeRegistryItem(createNotifyMorphRegistryItem(source));

if (generated !== expected) {
  throw new Error(
    "Registry output is stale. Run `pnpm registry:generate` and commit the result.",
  );
}

process.stdout.write("Registry output is current.\n");
