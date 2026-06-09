import { expect } from "@playwright/test";
import { NgSelectComponent } from "../components/ng-select.component";
import { BasePage } from "./base.page";

export class CreateCasePage extends BasePage {
  readonly countryCodeSelect = new NgSelectComponent(
    this.page,
    this.page.locator("#countryCode")
  );
  readonly phoneNumberField = this.page.locator(".phone-number-field");
  readonly locationInput = this.page.getByRole("textbox", { name: "Search for a location" });

  async isLoaded(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: /Case Details/i })).toBeVisible({ timeout: 30_000 });
  }

  async clickTab(tabName: string): Promise<void> {
    await this.page.getByRole("tab", { name: tabName }).click();
  }

  async save(): Promise<void> {
    await this.page.getByRole("button", { name: "Save" }).click();
  }

  async fillCustomerPhone(phoneNumber: string, countryCode = "PAK"): Promise<void> {
    await this.clickTab("Customer Details");
    await this.countryCodeSelect.pick(countryCode);
    await this.phoneNumberField.locator(".ng-select-container").click();
    await this.page
      .getByRole("listbox")
      .filter({ hasText: "No items found" })
      .getByRole("combobox")
      .fill(phoneNumber);
  }

  async fillPickupLocation(searchText: string, resultText: string): Promise<void> {
    await this.clickTab("Pickup Location");
    await this.locationInput.click();
    await this.locationInput.press("ControlOrMeta+a");
    await this.locationInput.fill(searchText);
    await this.page.getByText(resultText).click();
    await this.save();
  }

  async fillReportedIssue(issue: string, source: string): Promise<void> {
    await this.clickTab("Reported Issue");
    // The first invalid ng-select on this tab holds the issue type
    await this.page
      .locator("ng-select.ng-invalid")
      .first()
      .locator(".ng-arrow-wrapper")
      .click();
    await this.page.getByRole("option", { name: issue, exact: true }).click();
    await this.page.getByLabel("Reported Issue").getByText(source, { exact: true }).click();
    await this.save();
  }

  async clickCreateJob(): Promise<void> {
    await this.page.getByRole("button", { name: "Create Job" }).click();
  }
}
