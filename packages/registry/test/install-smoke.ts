import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { generateRegistry, workspaceRoot } from "../src/generate";

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
  const registryPath = await generateRegistry();
  const registryJson = await readFile(registryPath);
  const server = createServer((request, response) => {
    if (request.url !== "/notify-morph.json") {
      response.writeHead(404).end();
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(registryJson);
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
          motion: "^13.1.0",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
        devDependencies: {
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
          typescript: "^5.0.0",
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

  try {
    await run(
      "pnpm",
      [
        "exec",
        "shadcn",
        "add",
        `http://127.0.0.1:${String(address.port)}/notify-morph.json`,
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

  const installedPath = join(fixtureRoot, "src/components/ui/notify-morph.tsx");
  const installed = await readFile(installedPath, "utf8");
  if (!installed.includes("export const NotifyMorph")) {
    throw new Error("shadcn did not install the NotifyMorph source.");
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
