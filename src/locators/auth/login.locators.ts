import type { Page } from "@playwright/test";

export const loginLocators = (page: Page) => ({
  usernameInput: page.locator('input[name="userName"]'),
  passwordInput: page.locator('input[name="password"]'),
  submitButton: page.locator('button[type="submit"]'),
});
