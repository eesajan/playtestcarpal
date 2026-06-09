import { expect } from "@playwright/test";
import { NgSelectComponent } from "../../components/ng-select.component";
import { BasePage } from "../base.page";
import { caseLocators } from "../../locators/case/case.locators";

export class CreateCasePage extends BasePage {
  private readonly l = caseLocators(this.page);

  readonly countryCodeSelect = new NgSelectComponent(this.page, this.l.countryCodeSelect);

  async isLoaded(): Promise<void> {
    await expect(this.l.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  async clickTab(tabName: string): Promise<void> {
    await this.l.tab(tabName).click();
  }

  async save(): Promise<void> {
    await this.l.saveButton.click();
  }

  async fillCustomerPhone(phoneNumber: string, countryCode = "PAK"): Promise<void> {
    await this.clickTab("Customer Details");
    await this.countryCodeSelect.pick(countryCode);
    await this.l.phoneNumberField.locator(".ng-select-container").click();
    await this.page
      .getByRole("listbox")
      .filter({ hasText: "No items found" })
      .getByRole("combobox")
      .fill(phoneNumber);
  }

  async fillPickupLocation(searchText: string, resultText: string): Promise<void> {
    await this.clickTab("Pickup Location");
    await this.l.locationInput.click();
    await this.l.locationInput.press("ControlOrMeta+a");
    await this.l.locationInput.fill(searchText);
    await this.page.getByText(resultText).click();
    await this.save();
  }

  async fillReportedIssue(issue: string, source: string): Promise<void> {
    await this.clickTab("Reported Issue");
    // The first invalid ng-select on this tab holds the issue type
    await this.l.issueTypeSelect.locator(".ng-arrow-wrapper").click();
    await this.page.getByRole("option", { name: issue, exact: true }).click();
    await this.page.getByLabel("Reported Issue").getByText(source, { exact: true }).click();
    await this.save();
  }

  async clickCreateJob(): Promise<void> {
    await this.l.createJobButton.click();
  }
}
