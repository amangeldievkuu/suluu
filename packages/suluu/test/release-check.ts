import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface PackageManifest {
  name: string;
  version: string;
}

interface RegistryArtifact {
  dependencies?: string[];
  meta?: {
    version?: string;
  };
  name: string;
}

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const expectedVersion = process.argv
  .slice(2)
  .find((argument) => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(argument));

if (!expectedVersion) {
  throw new Error(
    "Pass the release version, for example: pnpm release:check -- 0.2.0",
  );
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

const manifestPaths = [
  "package.json",
  "apps/www/package.json",
  "packages/registry/package.json",
  "packages/suluu/package.json",
];

const manifests = await Promise.all(
  manifestPaths.map(async (path) => ({
    manifest: await readJson<PackageManifest>(resolve(workspaceRoot, path)),
    path,
  })),
);

for (const { manifest, path } of manifests) {
  if (manifest.version !== expectedVersion) {
    throw new Error(
      `${path} is ${manifest.version}; expected ${expectedVersion}.`,
    );
  }
}

const changelog = await readFile(
  resolve(workspaceRoot, "CHANGELOG.md"),
  "utf8",
);
const escapedVersion = expectedVersion.replaceAll(".", "\\.");
if (
  !new RegExp(`^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}$`, "m").test(
    changelog,
  )
) {
  throw new Error(`CHANGELOG.md has no dated ${expectedVersion} section.`);
}

const registryDirectory = resolve(workspaceRoot, "apps/www/public/r");
const registryFiles = (await readdir(registryDirectory))
  .filter((file) => file.endsWith(".json"))
  .sort();

if (registryFiles.length === 0) {
  throw new Error("No generated registry artifacts were found.");
}

const artifacts = await Promise.all(
  registryFiles.map(async (file) => ({
    artifact: await readJson<RegistryArtifact>(
      resolve(registryDirectory, file),
    ),
    file,
  })),
);

for (const { artifact, file } of artifacts) {
  if (artifact.meta?.version !== expectedVersion) {
    throw new Error(
      `${file} advertises ${String(artifact.meta?.version)}; expected ${expectedVersion}.`,
    );
  }
  if (!artifact.dependencies?.includes("motion@^12.23.26 || ^13.0.0")) {
    throw new Error(`${file} does not advertise the supported Motion range.`);
  }
}

console.log(
  `Release metadata is consistent for ${expectedVersion} across ${String(manifests.length)} manifests and ${String(artifacts.length)} registry artifacts.`,
);
