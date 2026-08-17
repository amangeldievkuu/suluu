import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  REGISTRY_ITEMS,
  serializeRegistryItem,
  type RegistryItemDescriptor,
} from "./registry-item";

export const workspaceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

export async function generateRegistryItem(
  item: RegistryItemDescriptor,
): Promise<string> {
  const sourcePath = resolve(workspaceRoot, item.source);
  const outputPath = resolve(workspaceRoot, item.output);
  const source = await readFile(sourcePath, "utf8");
  const serialized = serializeRegistryItem(item.create(source));

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serialized, "utf8");

  return outputPath;
}

export async function generateRegistry(): Promise<string[]> {
  return Promise.all(REGISTRY_ITEMS.map(generateRegistryItem));
}

const invokedPath = process.argv[1];
if (
  invokedPath &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  const outputPaths = await generateRegistry();
  for (const outputPath of outputPaths) {
    process.stdout.write(`Generated ${outputPath}\n`);
  }
}
