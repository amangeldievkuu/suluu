import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createNotifyMorphRegistryItem,
  NOTIFY_MORPH_OUTPUT,
  NOTIFY_MORPH_SOURCE,
  serializeRegistryItem,
} from "./registry-item";

export const workspaceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

export async function generateRegistry(): Promise<string> {
  const sourcePath = resolve(workspaceRoot, NOTIFY_MORPH_SOURCE);
  const outputPath = resolve(workspaceRoot, NOTIFY_MORPH_OUTPUT);
  const source = await readFile(sourcePath, "utf8");
  const serialized = serializeRegistryItem(
    createNotifyMorphRegistryItem(source),
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serialized, "utf8");

  return outputPath;
}

const invokedPath = process.argv[1];
if (
  invokedPath &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  const outputPath = await generateRegistry();
  process.stdout.write(`Generated ${outputPath}\n`);
}
