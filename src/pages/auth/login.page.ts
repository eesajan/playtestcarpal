import { expect } from "@playwright/test";
import { BasePage } from "../base.page";
import { loginLocators } from "../../locators/auth/login.locators";
import { CARPAL_CREDENTIALS } from "../../config/credentials";
import { BASE_URL, ENDPOINTS } from "../../config/urls";

export class LoginPage extends BasePage {
  private readonly l = loginLocators(this.page);

  async goto(): Promise<void> {
    await this.page.goto(`${BASE_URL}${ENDPOINTS.login}`);
  }

  async isLoaded(): Promise<void> {
    await expect(this.l.usernameInput).toBeVisible();
    await expect(this.l.submitButton).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.l.usernameInput.fill(username);
    await this.l.passwordInput.fill(password);
    await this.l.submitButton.click();
    await expect(this.page).toHaveURL(/\/bu\/dashboard/);
  }

  async loginWithEnv(): Promise<void> {
    const { username, password } = CARPAL_CREDENTIALS;
    if (!username || !password) {
      throw new Error("Missing CARPAL_USERNAME or CARPAL_PASSWORD in .env");
    }
    await this.goto();
    await this.login(username, password);
  }
}
