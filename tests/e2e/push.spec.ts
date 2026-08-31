import { expect, test } from "@playwright/test";

import { signInAsAnalyst, signInAsLead } from "./helpers/auth";
import { resetDatabase } from "../helpers/reset-database";

test.beforeEach(async ({ page }) => {
  await resetDatabase();
  await signInAsAnalyst(page);
});

test("pasting a file, toggling a row off, and applying updates only the enabled subset", async ({ page }) => {
  await page.goto("/push");

  await page.getByLabel("Analysis output file").fill("EPS-SOLAR-ARRAY-POWER=200\nEPS-PEAK-LOAD=150");
  await page.getByRole("button", { name: "Review changes" }).click();
  await expect(page.getByText(/2 to update/)).toBeVisible();

  await page.getByRole("switch", { name: "Apply EPS-PEAK-LOAD" }).click();

  await page.getByRole("button", { name: "Update 1 variable" }).click();
  await expect(page.getByText(/Applied 1 of 1 updates/)).toBeVisible();

  const runHref = await page.getByRole("link", { name: "View run history" }).getAttribute("href");
  expect(runHref).toMatch(/^\/runs\//);

  await page.goto("/variables");
  await expect(page.locator('tr[data-external-key="EPS-SOLAR-ARRAY-POWER"]')).toContainText("200 W");
  await expect(page.locator('tr[data-external-key="EPS-PEAK-LOAD"]')).toContainText("142 W");

  await page.goto(runHref!);
  await expect(page.getByRole("heading", { name: "1 change" })).toBeVisible();
  await expect(page.getByRole("link", { name: "EPS-SOLAR-ARRAY-POWER" })).toBeVisible();
  await expect(page.getByRole("link", { name: "EPS-PEAK-LOAD" })).toHaveCount(0);
});

test("a protected variable can't be enabled by an analyst", async ({ page }) => {
  await page.goto("/push");

  await page.getByLabel("Analysis output file").fill("EPS-BUS-VOLTAGE=30");
  await page.getByRole("button", { name: "Review changes" }).click();

  await expect(page.getByText(/0 to update/)).toBeVisible();
  await expect(page.getByText(/1 protected/)).toBeVisible();
  await expect(page.getByText("An engineering lead must apply this")).toBeVisible();
  await expect(page.getByRole("switch", { name: "Apply EPS-BUS-VOLTAGE" })).toHaveCount(0);
});

test("an engineering lead can apply a change to a protected variable", async ({ page }) => {
  await signInAsLead(page);
  await page.goto("/push");

  await page.getByLabel("Analysis output file").fill("EPS-BUS-VOLTAGE=30");
  await page.getByRole("button", { name: "Review changes" }).click();
  await expect(page.getByText(/1 to update/)).toBeVisible();

  // A "will-change" row starts enabled after review — a lead doesn't need to
  // flip a switch to include a protected variable, unlike an analyst who
  // never sees a switch for one at all.
  await page.getByRole("button", { name: "Update 1 variable" }).click();
  await expect(page.getByText(/Applied 1 of 1 updates/)).toBeVisible();

  await page.goto("/variables");
  await expect(page.locator('tr[data-external-key="EPS-BUS-VOLTAGE"]')).toContainText("30 V");
});
