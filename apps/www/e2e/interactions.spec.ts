import { expect, test, type Page } from "@playwright/test";

import { CATALOG } from "../lib/catalog";

function preview(page: Page) {
  return page.locator('[data-slot="component-preview-stage"]');
}

for (const entry of CATALOG) {
  test(`${entry.name} loads without browser errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(`/components/${entry.slug}`);

    await expect(preview(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      entry.name,
    );
    expect(errors).toEqual([]);
  });
}

test("FluidTabs supports keyboard selection at a mobile width", async ({
  page,
}) => {
  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/components/fluid-tabs");
  const stage = preview(page);
  const tablist = stage.getByRole("tablist", { name: "Workspace" });
  const inbox = stage.getByRole("tab", { name: "Inbox" });
  const planner = stage.getByRole("tab", { name: "Planner" });
  const alerts = stage.getByRole("tab", { name: "Alerts" });

  await expect(inbox).toHaveAttribute("aria-selected", "true");
  await inbox.focus();
  await page.keyboard.press("ArrowRight");
  await expect(planner).toBeFocused();
  await expect(planner).toHaveAttribute("aria-selected", "true");
  // The neighbouring target is physically moving while the active pill
  // settles. Wait for that spring before testing a pointer activation.
  await page.waitForTimeout(800);
  await alerts.click();
  await expect(alerts).toHaveAttribute("aria-selected", "true");

  expect(
    await tablist.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.left >= 0 && rect.right <= document.documentElement.clientWidth
      );
    }),
  ).toBe(true);
});

test("FluidTabs remains immediate with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/fluid-tabs");
  const stage = preview(page);

  await stage.getByRole("tab", { name: "Alerts" }).click();

  await expect(stage.getByRole("tab", { name: "Alerts" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(stage.locator('[data-slot="fluid-tabs-shimmer"]')).toHaveCount(
    0,
  );
});

test("OtpInput accepts a complete code", async ({ page }) => {
  await page.goto("/components/otp-input");
  const stage = preview(page);
  const input = stage.getByRole("textbox", { name: "Verification code" });

  await input.fill("123456");

  await expect(input).toHaveValue("123456");
  await expect(stage.getByText("Code complete")).toBeVisible();
});

test("SlideControl responds to the keyboard", async ({ page }) => {
  await page.goto("/components/slide-control");
  const slider = preview(page).getByRole("slider", { name: "Volume" });
  const initial = Number(await slider.getAttribute("aria-valuenow"));

  await slider.focus();
  await page.keyboard.press("ArrowRight");

  await expect(slider).toHaveAttribute("aria-valuenow", String(initial + 1));
});

test("Toaster announces a triggered notification", async ({ page }) => {
  await page.goto("/components/toast");
  const stage = preview(page);

  await stage.getByRole("button", { name: "Success" }).click();

  await expect(stage.getByRole("status")).toContainText("Draft saved");
});

test("MagnetPull reacts to and releases the pointer", async ({ page }) => {
  await page.goto("/components/magnet-pull");
  const button = preview(page).getByRole("button", { name: "Get started" });
  const box = await button.boundingBox();
  if (!box) throw new Error("MagnetPull button did not have a layout box.");

  await page.mouse.move(box.x + box.width / 2 + 24, box.y + box.height / 2);
  await expect(button).not.toHaveCSS("transform", "none");
  await page.mouse.move(0, 0);
  await expect(button).toHaveCSS("transform", "none", { timeout: 5_000 });
});
