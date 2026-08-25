import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "src/index.ts",
        "src/counter-numbers/index.ts",
        "src/fluid-tabs/index.ts",
        "src/magnet-pull/index.ts",
        "src/morph-button/index.ts",
        "src/notify-morph/index.ts",
        "src/otp-input/index.ts",
        "src/rope-time-picker/index.ts",
        "src/search-morph/index.ts",
        "src/segmented-control/index.ts",
        "src/slide-control/index.ts",
        "src/spotlight-card/index.ts",
        "src/switch-toggle/index.ts",
        "src/theme-toggle/index.ts",
        "src/toast/index.ts",
      ],
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
