import { expect, test } from "@playwright/test";

import { signInAsAnalyst } from "./helpers/auth";
import { resetDatabase } from "../helpers/reset-database";

test.beforeEach(async ({ page }) => {
  await resetDatabase();
  await signInAsAnalyst(page);
});

test("creating a model and generating a starter file from it on /pull", async ({ page }) => {
  await page.goto("/models/new");

  await page.getByLabel("Name").fill("Power Budget");
  await page.getByLabel("Description").fill("EPS pull/push set");

  await page.getByLabel("Search variables to add to Pull variables").fill("EPS-BUS-VOLTAGE");
  await page.getByRole("button", { name: /EPS-BUS-VOLTAGE/ }).click();

  await page.getByRole("button", { name: "Create model" }).click();
  await expect(page).toHaveURL(/\/models\/power-budget$/);
  await expect(page.getByRole("heading", { name: "Power Budget" })).toBeVisible();

  await page.goto("/models");
  await expect(page.getByRole("link", { name: /Power Budget/ })).toBeVisible();

  await page.goto("/pull");
  await page.getByLabel("Start from a model").selectOption({ label: "Power Budget" });
  await page.getByRole("button", { name: "Use model" }).click();

  await expect(page.getByLabel("Input .env file")).toHaveValue("EPS-BUS-VOLTAGE=28");
});

test("a non-owner sees a read-only model without edit controls", async ({ page, browser }) => {
  await page.goto("/models/new");
  await page.getByLabel("Name").fill("Owner Only");
  await page.getByRole("button", { name: "Create model" }).click();
  await expect(page).toHaveURL(/\/models\/owner-only$/);

  const leadContext = await browser.newContext();
  const leadPage = await leadContext.newPage();
  await leadPage.goto("/login");
  await leadPage.getByLabel("Email").fill("lead@case-study.local");
  await leadPage.getByLabel("Password").fill("lead-password");
  await leadPage.getByRole("button", { name: "Sign in" }).click();

  await leadPage.goto("/models/owner-only");
  await expect(leadPage.getByText(/Only Avery Analyst can edit this model/)).toBeVisible();
  await expect(leadPage.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  await expect(leadPage.getByRole("button", { name: "Delete model" })).toHaveCount(0);

  await leadContext.close();
});
