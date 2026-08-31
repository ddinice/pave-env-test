import { expect, type Page } from "@playwright/test";

const analyst = {
  email: "analyst@case-study.local",
  password: "analyst-password",
};

const lead = {
  email: "lead@case-study.local",
  password: "lead-password",
};

export async function signInAsAnalyst(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(analyst.email);
  await page.getByLabel("Password").fill(analyst.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/variables$/);
}

export async function signInAsLead(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(lead.email);
  await page.getByLabel("Password").fill(lead.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/variables$/);
}
