import { expect, test } from "@playwright/test";

import { signInAsAnalyst } from "./helpers/auth";
import { resetDatabase } from "../helpers/reset-database";

test.beforeEach(async ({ page }) => {
  await resetDatabase();
  await signInAsAnalyst(page);
});

test("pulling a file, editing the result, and pushing it back is reflected in the variable list and the activity feed", async ({
  page,
}) => {
  await page.goto("/pull");

  await page.getByLabel("Input .env file").fill("EPS-PEAK-LOAD=");
  await page.getByRole("button", { name: "Fill values" }).click();
  await expect(page.getByLabel("Filled .env")).toHaveText("EPS-PEAK-LOAD=142");

  // Simulate an analyst editing the pulled file in an external tool before
  // pushing the result back — pulling and pushing the exact same values
  // would be a no-op and wouldn't prove anything reached the registry.
  await page.goto("/push");
  await page.getByLabel("Analysis output file").fill("EPS-PEAK-LOAD=150");
  await page.getByRole("button", { name: "Review changes" }).click();
  await expect(page.getByText(/1 to update/)).toBeVisible();

  await page.getByRole("button", { name: "Update 1 variable" }).click();
  await expect(page.getByText(/Applied 1 of 1 updates/)).toBeVisible();

  await page.goto("/variables");
  await expect(page.locator('tr[data-external-key="EPS-PEAK-LOAD"]')).toContainText("150 W");

  await page.goto("/activity");
  await page.getByRole("button", { name: /Show 1 change/ }).click();
  await expect(page.getByText("EPS-PEAK-LOAD")).toBeVisible();
  await expect(page.getByText("142")).toBeVisible();
  await expect(page.getByText("150")).toBeVisible();
});
