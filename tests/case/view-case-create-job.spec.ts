import { expect, test } from "@playwright/test";
import { login } from "../../src/helpers/auth/auth.helper";
import { dashboardLocators } from "../../src/locators/dashboard/dashboard.locators";
import { caseLocators } from "../../src/locators/case/case.locators";
import { clickCaseTab, saveCaseForm } from "../../src/helpers/case/case.helper";

// ── test data ─────────────────────────────────────────────────────────────────
const data = {
  caseNumber: "-015159",  // update to the target case number before running
  dropOffSearch: "i10",
  jobCost: "100",
} as const;

// ── test ──────────────────────────────────────────────────────────────────────
test("CarPal QA: view case and create job", async ({ page }) => {
  const d = dashboardLocators(page);
  const c = caseLocators(page);

  await test.step("Log in", async () => {
    await login(page);
    await expect(d.greeting).toBeVisible();
  });

  await test.step("Navigate to case", async () => {
    await d.caseManagementLink.click();
    await d.viewCasesLink.click();
    await page.getByRole("link", { name: data.caseNumber }).click();
    await expect(c.pageHeading).toBeVisible();
  });

  await test.step("Save Customer Details tab", async () => {
    await clickCaseTab(page, "Customer Details");
    await saveCaseForm(page);
  });

  await test.step("Save Pickup Location tab", async () => {
    await clickCaseTab(page, "Pickup Location");
    await saveCaseForm(page);
  });

  await test.step("Save Reported Issue tab", async () => {
    await clickCaseTab(page, "Reported Issue");
    await saveCaseForm(page);
  });

  await test.step("Create job", async () => {
    await c.createJobButton.click();

    // Select payment method — recording opened the dropdown but did not capture which option was chosen.
    // TODO: add the selected option name to data.paymentMethod and use NgSelectComponent.pick()
    await c.paymentMethodSelect.first().click();

    // Drop-off location — two "Search for a location" fields exist; nth(1) is the drop-off field.
    // FRAGILE: no distinct name/label between pickup and drop-off inputs in the DOM.
    // TODO: request data-testid="dropoff-location-input" from the dev team to remove nth().
    await c.locationInput.nth(1).fill(data.dropOffSearch);

    // Job cost field — no label or name attribute was visible in the recording.
    // FRAGILE: using last() on .ng-invalid as a fallback; will break if form state changes.
    // TODO: request name="jobCost" or data-testid="job-cost-input" from the dev team.
    await page.locator(".form-control.ng-invalid").last().fill(data.jobCost);

    await expect(c.pageHeading).toBeVisible();
  });
});
