import { expect, type Locator, type Page } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export async function login(page: Page): Promise<void> {
  const baseUrl = process.env.CARPAL_BASE_URL || "https://qa.carpal.com";
  const username = process.env.CARPAL_USERNAME;
  const password = process.env.CARPAL_PASSWORD;

  if (!username || !password) {
    throw new Error("Missing CARPAL_USERNAME or CARPAL_PASSWORD in .env");
  }

  await page.goto(`${baseUrl}/login`);
  await page.locator('input[name="userName"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/bu\/dashboard/);
}

export async function selectNgOption(
  page: Page,
  select: Locator,
  optionName: string,
  searchText = optionName
): Promise<void> {
  await select.click();
  await select.locator('input[type="text"]').fill(searchText);
  await expect(page.getByRole("option", { name: optionName, exact: true })).toBeVisible();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

export async function searchOptionalNgOption(
  page: Page,
  select: Locator,
  searchText: string,
  optionName = searchText
): Promise<void> {
  await select.click();
  await select.locator('input[type="text"]').fill(searchText);

  const option = page.getByRole("option", { name: optionName, exact: true });
  if (await option.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await option.click();
    return;
  }

  await select.locator('input[type="text"]').press("Enter");
}
