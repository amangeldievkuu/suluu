import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { generateRegistry, workspaceRoot } from "../src/generate";
import { REGISTRY_ITEMS } from "../src/registry-item";

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

const fixtureRoot = await mkdtemp(join(tmpdir(), "suluu-registry-"));

try {
  await generateRegistry();
  const registryJson = new Map(
    await Promise.all(
      REGISTRY_ITEMS.map(async (item): Promise<[string, Buffer]> => [
        `/${item.name}.json`,
        await readFile(resolve(workspaceRoot, item.output)),
      ]),
    ),
  );
  const server = createServer((request, response) => {
    const body = registryJson.get(request.url ?? "");
    if (!body) {
      response.writeHead(404).end();
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(body);
  });

  await new Promise<void>((resolvePromise) =>
    server.listen(0, "127.0.0.1", resolvePromise),
  );
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to determine registry smoke-test server address.");
  }

  await writeFile(
    join(fixtureRoot, "package.json"),
    JSON.stringify(
      {
        name: "suluu-registry-consumer",
        private: true,
        packageManager: "pnpm@10.33.0",
        dependencies: {
          motion: "12.23.26",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
        devDependencies: {
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
          typescript: "5.9.3",
        },
      },
      null,
      2,
    ),
  );
  await writeFile(
    join(fixtureRoot, "components.json"),
    JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema.json",
        style: "new-york",
        rsc: true,
        tsx: true,
        tailwind: {
          config: "",
          css: "src/index.css",
          baseColor: "neutral",
          cssVariables: true,
          prefix: "",
        },
        aliases: {
          components: "@/components",
          utils: "@/lib/utils",
          ui: "@/components/ui",
          lib: "@/lib",
          hooks: "@/hooks",
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
          paths: { "@/*": ["./src/*"] },
        },
        include: ["src"],
      },
      null,
      2,
    ),
  );
  await mkdir(join(fixtureRoot, "src"), { recursive: true });
  await writeFile(
    join(fixtureRoot, "src/index.css"),
    '@import "tailwindcss";\n',
  );
  await run(
    "pnpm",
    ["install", "--offline", "--ignore-scripts", "--frozen-lockfile=false"],
    fixtureRoot,
  );
  const motionBeforeInstall = (
    JSON.parse(
      await readFile(
        join(fixtureRoot, "node_modules/motion/package.json"),
        "utf8",
      ),
    ) as { version?: unknown }
  ).version;

  try {
    await run(
      "pnpm",
      [
        "exec",
        "shadcn",
        "add",
        ...REGISTRY_ITEMS.map(
          (item) =>
            `http://127.0.0.1:${String(address.port)}/${item.name}.json`,
        ),
        "--cwd",
        fixtureRoot,
        "--yes",
        "--overwrite",
      ],
      workspaceRoot,
    );
  } finally {
    await new Promise<void>((resolvePromise, reject) => {
      server.close((error) => (error ? reject(error) : resolvePromise()));
    });
  }

  for (const item of REGISTRY_ITEMS) {
    const installedPath = join(
      fixtureRoot,
      `src/components/ui/${item.name}.tsx`,
    );
    const installed = await readFile(installedPath, "utf8");
    if (!installed.includes(`export const ${item.exportName}`)) {
      throw new Error(`shadcn did not install the ${item.exportName} source.`);
    }
  }

  const motionAfterInstall = (
    JSON.parse(
      await readFile(
        join(fixtureRoot, "node_modules/motion/package.json"),
        "utf8",
      ),
    ) as { version?: unknown }
  ).version;
  if (
    motionBeforeInstall !== "12.23.26" ||
    motionAfterInstall !== motionBeforeInstall
  ) {
    throw new Error(
      `Registry install changed compatible Motion 12 from ${String(motionBeforeInstall)} to ${String(motionAfterInstall)}.`,
    );
  }

  await run(
    resolve(workspaceRoot, "node_modules/.bin/tsc"),
    ["--project", join(fixtureRoot, "tsconfig.json")],
    fixtureRoot,
  );
  process.stdout.write("Registry install smoke test passed.\n");
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
