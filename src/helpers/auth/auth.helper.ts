import { expect, type Page } from "@playwright/test";
import { CARPAL_CREDENTIALS } from "../../config/credentials";
import { BASE_URL, ENDPOINTS } from "../../config/urls";
import { loginLocators } from "../../locators/auth/login.locators";

export async function login(page: Page): Promise<void> {
  const { username, password } = CARPAL_CREDENTIALS;

  if (!username || !password) {
    throw new Error("Missing CARPAL_USERNAME or CARPAL_PASSWORD in .env");
  }

  const l = loginLocators(page);
  await page.goto(`${BASE_URL}${ENDPOINTS.login}`);
  await l.usernameInput.fill(username);
  await l.passwordInput.fill(password);
  await l.submitButton.click();
  await expect(page).toHaveURL(/\/bu\/dashboard/);
}
