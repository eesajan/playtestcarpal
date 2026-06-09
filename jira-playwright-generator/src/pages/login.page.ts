import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.locator('input[name="userName"]');
  private readonly passwordInput = this.page.locator('input[name="password"]');
  private readonly submitButton = this.page.locator('button[type="submit"]');

  async goto(): Promise<void> {
    const baseUrl = process.env.CARPAL_BASE_URL || "https://qa.carpal.com";
    await this.page.goto(`${baseUrl}/login`);
  }

  async isLoaded(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await expect(this.page).toHaveURL(/\/bu\/dashboard/);
  }

  async loginWithEnv(): Promise<void> {
    const username = process.env.CARPAL_USERNAME;
    const password = process.env.CARPAL_PASSWORD;
    if (!username || !password) {
      throw new Error("Missing CARPAL_USERNAME or CARPAL_PASSWORD in .env");
    }
    await this.goto();
    await this.login(username, password);
  }
}
