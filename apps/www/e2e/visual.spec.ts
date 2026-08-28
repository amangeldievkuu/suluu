import { expect, test, type Page } from "@playwright/test";

import { CATALOG } from "../lib/catalog";

const MOBILE_COMPONENTS = [
  "fluid-tabs",
  "otp-input",
  "rope-time-picker",
  "toast",
] as const;

async function prepareTheme(page: Page, theme: "dark" | "light") {
  await page.clock.setFixedTime(new Date("2026-08-28T09:35:20Z"));
  await page.emulateMedia({
    colorScheme: theme,
    reducedMotion: "reduce",
  });
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("theme", selectedTheme);
  }, theme);
}

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Chromium baselines",
);

for (const entry of CATALOG) {
  for (const theme of ["light", "dark"] as const) {
    test(`${entry.name} ${theme} preview`, async ({ page }) => {
      await prepareTheme(page, theme);
      await page.goto(`/components/${entry.slug}`);
      const stage = page.locator('[data-slot="component-preview-stage"]');
      await expect(stage).toBeVisible();
      await page.evaluate(async () => document.fonts.ready);

      await expect(stage).toHaveScreenshot(`${entry.slug}-${theme}.png`, {
        animations: "disabled",
        caret: "hide",
        scale: "css",
      });
    });
  }
}

for (const slug of MOBILE_COMPONENTS) {
  test(`${slug} mobile preview`, async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 });
    await prepareTheme(page, "light");
    await page.goto(`/components/${slug}`);
    const stage = page.locator('[data-slot="component-preview-stage"]');
    await expect(stage).toBeVisible();
    await page.evaluate(async () => document.fonts.ready);

    await expect(stage).toHaveScreenshot(`${slug}-mobile.png`, {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    });
  });
}
