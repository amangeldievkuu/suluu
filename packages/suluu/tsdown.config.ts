import { defineConfig } from "tsdown";

export default defineConfig({
  attw: {
    excludeEntrypoints: ["styles.css"],
    level: "error",
    profile: "esm-only",
  },
  clean: true,
  copy: {
    from: "src/styles.css*",
    to: "dist",
  },
  deps: {
    neverBundle: true,
  },
  dts: {
    sourcemap: true,
  },
  entry: {
    "counter-numbers": "src/counter-numbers/index.ts",
    "fluid-tabs": "src/fluid-tabs/index.ts",
    index: "src/index.ts",
    "magnet-pull": "src/magnet-pull/index.ts",
    "morph-button": "src/morph-button/index.ts",
    "notify-morph": "src/notify-morph/index.ts",
    "otp-input": "src/otp-input/index.ts",
    "rope-time-picker": "src/rope-time-picker/index.ts",
    "search-morph": "src/search-morph/index.ts",
    "segmented-control": "src/segmented-control/index.ts",
    "slide-control": "src/slide-control/index.ts",
    "spotlight-card": "src/spotlight-card/index.ts",
    "switch-toggle": "src/switch-toggle/index.ts",
    "theme-toggle": "src/theme-toggle/index.ts",
    toast: "src/toast/index.ts",
  },
  format: "esm",
  minify: false,
  outDir: "dist",
  platform: "browser",
  publint: {
    level: "error",
  },
  sourcemap: true,
  target: ["chrome111", "firefox111", "safari16.4"],
  treeshake: true,
});
