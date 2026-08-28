import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["line"]],
  outputDir: "test-results",
  use: {
    baseURL: `http://127.0.0.1:${String(port)}`,
    screenshot: "only-on-failure",
    timezoneId: "UTC",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: `pnpm start --hostname 127.0.0.1 --port ${String(port)}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: `http://127.0.0.1:${String(port)}`,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
