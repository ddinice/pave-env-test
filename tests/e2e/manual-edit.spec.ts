import { expect, test } from "@playwright/test";

import { signInAsAnalyst } from "./helpers/auth";
import { resetDatabase } from "../helpers/reset-database";

test.beforeEach(async ({ page }) => {
  await resetDatabase();
  await signInAsAnalyst(page);
});

test("an analyst can edit an ordinary variable from the side drawer", async ({ page }) => {
  await page.locator('tr[data-external-key="EPS-SOLAR-ARRAY-POWER"]').click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "Edit value" })).toHaveCount(0);
  await expect(drawer.getByRole("button", { name: "Save changes" })).toHaveCount(0);

  await drawer.getByRole("button", { name: "185" }).click();
  await expect(drawer.getByLabel("Value", { exact: true })).toBeFocused();
  const valueBox = await drawer.getByLabel("Value", { exact: true }).boundingBox();
  const unitBox = await drawer.getByLabel("Unit", { exact: true }).boundingBox();
  expect(valueBox?.y).toBe(unitBox?.y);
  await drawer.getByLabel("Value", { exact: true }).fill("190");
  await expect(drawer.getByRole("button", { name: "Save changes" })).toBeVisible();
  await drawer.getByRole("button", { name: "Save changes" }).click();

  await expect(drawer).toHaveCount(0);
  await expect(page.locator('tr[data-external-key="EPS-SOLAR-ARRAY-POWER"]')).toContainText("190 W");
});

test("clicking a unit in the drawer starts inline editing", async ({ page }) => {
  await page.getByRole("button", { name: "Solar array power" }).click();
  const drawer = page.getByRole("dialog");

  await drawer.getByRole("button", { name: "W" }).click();
  await expect(drawer.getByLabel("Unit", { exact: true })).toBeFocused();
});

test("an analyst sees protected access in the side drawer", async ({ page }) => {
  await page.locator('tr[data-external-key="EPS-BATTERY-CAPACITY"]').click();
  const drawer = page.getByRole("dialog");

  await expect(drawer.getByLabel("Protected variable")).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  await expect(drawer.getByLabel("Value")).toHaveCount(0);
});

test("filters update automatically and no longer require an Apply button", async ({ page }) => {
  await expect(page.getByText("32 variables", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply" })).toHaveCount(0);

  await page.getByLabel("Filter by subsystem").selectOption("EPS");
  await expect(page).toHaveURL(/subsystem=EPS/);
  await expect(page.locator('tr[data-external-key="EPS-BATTERY-CAPACITY"]')).toBeVisible();

  await page.getByLabel("Sort variables").selectOption("updatedAt");
  await expect(page).toHaveURL(/sort=updatedAt/);

  await page.getByLabel("Search variables").fill("no-matching-variable");
  await expect(page).toHaveURL(/query=no-matching-variable/);
  await expect(page.getByText("0 variables", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No variables found" })).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page.getByText("32 variables", { exact: true })).toBeVisible();
});
