import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const packageSrc = fileURLToPath(
  new URL("../../packages/suluu/src", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: {
      // `pnpm validate` runs `test` before `build:package`, so resolve the
      // library from source rather than from its unbuilt `dist` output.
      "suluu/magnet-pull": `${packageSrc}/magnet-pull/index.ts`,
      "suluu/notify-morph": `${packageSrc}/notify-morph/index.ts`,
      "suluu/switch-toggle": `${packageSrc}/switch-toggle/index.ts`,
      suluu: `${packageSrc}/index.ts`,
      "@": appRoot,
    },
  },
  test: {
    coverage: {
      include: [
        "lib/**/*.ts",
        "components/component-card.tsx",
        "components/components-sidebar.tsx",
        "components/docs/**/*.tsx",
        "components/search-palette.tsx",
        "components/search-provider.tsx",
        "components/search-trigger.tsx",
      ],
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        branches: 80,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
  },
});
