import { expect } from "@playwright/test";
import { BasePage } from "../base.page";
import { dashboardLocators } from "../../locators/dashboard/dashboard.locators";

export class DashboardPage extends BasePage {
  private readonly l = dashboardLocators(this.page);

  async isLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/bu\/dashboard/);
    await expect(this.l.greeting).toBeVisible();
  }

  async clickCreateCase(): Promise<void> {
    await this.l.createCaseLink.click();
  }

  async clickCreateTemporaryCase(): Promise<void> {
    await this.l.createCaseLink.click();
    await this.l.createTemporaryCaseButton.click();
  }
}
