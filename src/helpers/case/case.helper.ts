import { type Page } from "@playwright/test";
import { NgSelectComponent } from "../../components/ng-select.component";
import { caseLocators } from "../../locators/case/case.locators";

export async function clickCaseTab(page: Page, tabName: string): Promise<void> {
  await caseLocators(page).tab(tabName).click();
}

export async function saveCaseForm(page: Page): Promise<void> {
  await caseLocators(page).saveButton.click();
}

export async function fillCustomerPhone(
  page: Page,
  phoneNumber: string,
  countryCode = "PAK"
): Promise<void> {
  const l = caseLocators(page);
  await clickCaseTab(page, "Customer Details");
  await new NgSelectComponent(page, l.countryCodeSelect).pick(countryCode);
  await l.phoneNumberField.locator(".ng-select-container").click();
  await page
    .getByRole("listbox")
    .filter({ hasText: "No items found" })
    .getByRole("combobox")
    .fill(phoneNumber);
}

export async function fillPickupLocation(
  page: Page,
  searchText: string,
  resultText: string
): Promise<void> {
  const l = caseLocators(page);
  await clickCaseTab(page, "Pickup Location");
  await l.locationInput.click();
  await l.locationInput.press("ControlOrMeta+a");
  await l.locationInput.fill(searchText);
  await page.getByText(resultText).click();
  await saveCaseForm(page);
}

export async function fillReportedIssue(
  page: Page,
  issue: string,
  source: string
): Promise<void> {
  await clickCaseTab(page, "Reported Issue");
  // The first invalid ng-select on this tab holds the issue type
  await page.locator("ng-select.ng-invalid").first().locator(".ng-arrow-wrapper").click();
  await page.getByRole("option", { name: issue, exact: true }).click();
  await page.getByLabel("Reported Issue").getByText(source, { exact: true }).click();
  await saveCaseForm(page);
}

export async function dismissToast(page: Page): Promise<void> {
  const toast = caseLocators(page).toastNotification;
  if (await toast.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await toast.click();
  }
}
