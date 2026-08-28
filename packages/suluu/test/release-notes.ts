import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const version = process.argv
  .slice(2)
  .find((argument) => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(argument));

if (!version) {
  throw new Error(
    "Pass the release version, for example: pnpm release:notes -- 0.2.0",
  );
}

const changelog = await readFile(
  resolve(workspaceRoot, "CHANGELOG.md"),
  "utf8",
);
const heading = `## [${version}]`;
const start = changelog.indexOf(heading);

if (start === -1) {
  throw new Error(`CHANGELOG.md has no ${version} section.`);
}

const bodyStart = changelog.indexOf("\n", start) + 1;
const nextSection = changelog.indexOf("\n## [", bodyStart);
const notes = changelog
  .slice(bodyStart, nextSection === -1 ? undefined : nextSection)
  .trim();

if (!notes) {
  throw new Error(`CHANGELOG.md has no notes for ${version}.`);
}

process.stdout.write(`${notes}\n`);
