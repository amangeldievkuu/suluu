import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/index.ts", "src/notify-morph/index.ts"],
      include: ["src/**/*.tsx"],
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
    setupFiles: ["./test/setup.ts"],
  },
});
