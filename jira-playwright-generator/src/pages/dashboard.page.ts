import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class DashboardPage extends BasePage {
  readonly createCaseLink = this.page.getByRole("link", { name: "Create Case", exact: true });
  readonly greeting = this.page.getByText(/Hi .+!/i);

  async isLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/bu\/dashboard/);
    await expect(this.greeting).toBeVisible();
  }

  async clickCreateCase(): Promise<void> {
    await this.createCaseLink.click();
  }

  async clickCreateTemporaryCase(): Promise<void> {
    await this.createCaseLink.click();
    await this.page.getByRole("button", { name: "Create a Temporary" }).click();
  }
}
