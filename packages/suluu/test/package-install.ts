import { spawn } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(packageRoot, "../..");

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with code ${String(code)}`));
    });
  });
}

async function installedVersion(packageName: string): Promise<string> {
  const packageJson = JSON.parse(
    await readFile(
      resolve(workspaceRoot, "node_modules", packageName, "package.json"),
      "utf8",
    ),
  ) as { version?: unknown };

  if (typeof packageJson.version !== "string") {
    throw new Error(`Could not resolve installed ${packageName} version.`);
  }

  return packageJson.version;
}

const fixtureRoot = await mkdtemp(join(tmpdir(), "suluu-package-"));

try {
  await run("pnpm", ["build"], packageRoot);
  await run("pnpm", ["pack", "--pack-destination", fixtureRoot], packageRoot);

  const tarballs = (await readdir(fixtureRoot)).filter((file) =>
    file.endsWith(".tgz"),
  );
  const tarball = tarballs[0];
  if (!tarball) throw new Error("pnpm pack did not create a tarball.");

  const [reactVersion, reactDomVersion, motionVersion, typescriptVersion] =
    await Promise.all([
      installedVersion("react"),
      installedVersion("react-dom"),
      installedVersion("motion"),
      installedVersion("typescript"),
    ]);

  await mkdir(join(fixtureRoot, "src"));
  await writeFile(
    join(fixtureRoot, "package.json"),
    JSON.stringify(
      {
        name: "suluu-package-consumer",
        private: true,
        type: "module",
        packageManager: "pnpm@10.33.0",
        dependencies: {
          motion: motionVersion,
          react: reactVersion,
          "react-dom": reactDomVersion,
          suluu: `file:${join(fixtureRoot, tarball)}`,
        },
        devDependencies: {
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
          typescript: typescriptVersion,
        },
      },
      null,
      2,
    ),
  );
  await writeFile(
    join(fixtureRoot, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          jsx: "react-jsx",
          lib: ["DOM", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
        },
        include: ["src"],
      },
      null,
      2,
    ),
  );
  await writeFile(
    join(fixtureRoot, "src/index.tsx"),
    `import { CounterNumbers, NotifyMorph, SearchMorph, SegmentedControl, SwitchToggle } from "suluu";\nimport type { CounterNumbersProps } from "suluu/counter-numbers";\nimport type { NotifyMorphProps } from "suluu/notify-morph";\nimport type { SearchMorphProps } from "suluu/search-morph";\nimport type { SegmentedControlProps } from "suluu/segmented-control";\nimport type { SwitchToggleProps } from "suluu/switch-toggle";\nimport "suluu/styles.css";\n\nconst counterProps: CounterNumbersProps = { value: 1284 };\nconst props: NotifyMorphProps = { label: "Updates" };\nconst searchProps: SearchMorphProps = { "aria-label": "Find" };\nconst segmentProps: SegmentedControlProps = { "aria-label": "Range", options: [{ value: "day", label: "Day" }] };\nconst switchProps: SwitchToggleProps = { "aria-label": "Animations" };\nexport const counter = <CounterNumbers {...counterProps} />;\nexport const example = <NotifyMorph {...props} />;\nexport const search = <SearchMorph {...searchProps} />;\nexport const segment = <SegmentedControl {...segmentProps} />;\nexport const toggle = <SwitchToggle {...switchProps} />;\n`,
  );
  await writeFile(
    join(fixtureRoot, "src/index.css"),
    '@import "tailwindcss";\n@import "suluu/styles.css";\n@source "../node_modules/suluu/dist";\n',
  );

  await run(
    "pnpm",
    ["install", "--ignore-scripts", "--frozen-lockfile=false"],
    fixtureRoot,
  );
  await run("pnpm", ["exec", "tsc", "--noEmit"], fixtureRoot);

  const installedPackage = JSON.parse(
    await readFile(
      join(fixtureRoot, "node_modules/suluu/package.json"),
      "utf8",
    ),
  ) as { exports?: Record<string, unknown>; sideEffects?: unknown };
  const requiredExports = [
    ".",
    "./counter-numbers",
    "./magnet-pull",
    "./notify-morph",
    "./search-morph",
    "./segmented-control",
    "./switch-toggle",
    "./styles.css",
  ];
  for (const exportPath of requiredExports) {
    if (!installedPackage.exports?.[exportPath]) {
      throw new Error(`Packed package is missing the ${exportPath} export.`);
    }
  }
  if (JSON.stringify(installedPackage.sideEffects) !== '["**/*.css"]') {
    throw new Error("Only package CSS should be marked side-effectful.");
  }

  await readFile(
    join(fixtureRoot, "node_modules/suluu/dist/styles.css"),
    "utf8",
  );
  process.stdout.write("Packed npm consumer smoke test passed.\n");
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
