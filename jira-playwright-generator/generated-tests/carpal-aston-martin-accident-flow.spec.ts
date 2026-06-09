import { expect, test } from "@playwright/test";
import { login } from "../src/helpers/carpal.helpers";
import { generateVin } from "../src/helpers/vin.helper";
import { NgSelectComponent } from "../src/components/ng-select.component";
import { CreateVehiclePage } from "../src/pages/create-vehicle.page";

// ── test data ─────────────────────────────────────────────────────────────────
const data = {
  client: "Test",
  brand: "Aston Martin",
  model: "DBS",
  modelYear: "2027",
  plateNumber: "123",
  mileage: "456",
  countryCode: "PAK",
  phoneNumber: "3045627061",
  phoneDisplay: "+923045627061 | Eesa",
  customerFirstName: "Test",
  pickupSearch: "i 8 ",
  pickupResult: "I-8 MarkazI 8 Markaz I-8,",
  reportedIssue: "Accident",
  issueSource: "Web",
  jobType: "Accident - Major Accident",
  jobService: "Vehicle Towing - Accident",
  dropSearch: "i 10 ",
  dropResult: "I-10 MarkazI 10 Markaz I-10,",
  paymentMethod: "Cash",
  amount: "100",
  discount: "10",
  noCardReason: "Don't have Credit & Debit Card"
} as const;

test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 33.6844, longitude: 73.0479 }
});

// ── helpers ───────────────────────────────────────────────────────────────────
async function dismissToasts(page: import("@playwright/test").Page): Promise<void> {
  const toast = page.locator('[aria-label="Notification"]');
  let visible = await toast.first().isVisible().catch(() => false);
  while (visible) {
    await toast.first().click({ force: true });
    await page.waitForTimeout(300);
    visible = await toast.first().isVisible().catch(() => false);
  }
}

// ── test ──────────────────────────────────────────────────────────────────────
test("CarPal QA: create vehicle, case and job — Aston Martin Accident", async ({ page }) => {
  const vin = generateVin();
  console.log(`Using VIN: ${vin}`);

  await test.step("Log in", async () => {
    await login(page);
    await expect(page.getByText(/Hi Csa Csa!/i)).toBeVisible();
  });

  await test.step("Open temporary vehicle form", async () => {
    await page.getByRole("link", { name: "Create Case", exact: true }).click();
    await page.getByRole("button", { name: "Create a Temporary" }).click();
    await expect(page.getByRole("heading", { name: "Create Vehicle" })).toBeVisible();
  });

  await test.step("Fill vehicle details", async () => {
    const vehiclePage = new CreateVehiclePage(page);

    await vehiclePage.subclientSelect.pick(data.client);

    // Pick dropdowns first — Angular change detection on ng-select can clear text inputs
    await vehiclePage.brandSelect.pick(data.brand);
    await vehiclePage.modelSelect.pick(data.model);
    await vehiclePage.modelYearSelect.pick(data.modelYear);

    // Fill VIN after dropdowns so Angular reactivity doesn't wipe it
    const vinInput = page.getByRole("textbox", { name: "VIN *" });
    await vinInput.click();
    await vinInput.pressSequentially(vin, { delay: 20 });
    await expect(vinInput).toHaveValue(vin);

    await page.getByRole("textbox", { name: "Plate Category Code / Plate" }).fill(data.plateNumber);
    await page.getByRole("textbox", { name: "Mileage" }).fill(data.mileage);
  });

  await test.step("Create vehicle and open case", async () => {
    await page.getByRole("button", { name: "Create Vehicle" }).click();
    await expect(page.getByRole("button", { name: "Create Case" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Create Case" }).click();
    await expect(page.getByRole("heading", { name: /Case Details/i })).toBeVisible({ timeout: 30_000 });
  });

  await test.step("Save vehicle and owner information", async () => {
    await dismissToasts(page);
    await page.locator("app-vehicle-and-owner-info").getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(1500);
  });

  await test.step("Fill and save customer details", async () => {
    const section = page.locator("app-customer-detail");

    const countrySelect = new NgSelectComponent(page, page.locator("#countryCode"));
    await countrySelect.pick(data.countryCode);

    // Open the phone number search field and type the number
    const phoneField = page.locator(".phone-number-field");
    await phoneField.locator(".ng-select-container").click();
    await phoneField.getByRole("combobox").fill(data.phoneNumber);

    // Wait for the ng-select dropdown panel (avoids matching hidden native <option> elements)
    await page.locator(".ng-dropdown-panel .ng-option").first().waitFor({ state: "visible", timeout: 10_000 });
    await page.locator(".ng-dropdown-panel .ng-option").first().click();

    // First Name is required (auto-populated only when selecting an existing contact)
    await section.getByRole("textbox").first().fill(data.customerFirstName);

    // Language is required
    await section.getByRole("radio", { name: "English" }).click();

    await dismissToasts(page);
    await section.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(1500);
  });

  await test.step("Set and save pickup location", async () => {
    const section = page.locator("app-pickup-location");

    const locationInput = section.getByRole("textbox", { name: "Search for a location" });
    await locationInput.click();
    await locationInput.press("ControlOrMeta+a");
    await locationInput.fill(data.pickupSearch);
    await page.getByText(data.pickupResult).click();

    await dismissToasts(page);
    await section.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(1500);
  });

  await test.step("Set and save reported issue", async () => {
    const section = page.locator("app-reported-issue");

    await section.locator("ng-select").first().locator(".ng-arrow-wrapper").click();
    await page.getByRole("option", { name: data.reportedIssue, exact: true }).click();

    await section.getByText(data.issueSource, { exact: true }).click();

    await dismissToasts(page);
    await section.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(1500);
  });

  await test.step("Create job", async () => {
    // Dismiss any lingering toasts before clicking Create Job (toasts block button clicks)
    await dismissToasts(page);

    // Capture count before click — the job form adds a new ng-select-taggable outside the tabpanel
    const taggablesBefore = await page.locator("ng-select.ng-select-taggable").count();

    await page.getByRole("tabpanel", { name: /^Jobs/ }).getByRole("button", { name: "Create Job" }).click();

    // Wait for a new ng-select-taggable to appear (the Job Type dropdown)
    await expect(page.locator("ng-select.ng-select-taggable")).toHaveCount(taggablesBefore + 1, { timeout: 20_000 });

    // The newly added one is always last
    const jobTypeSelect = page.locator("ng-select.ng-select-taggable").last();
    await jobTypeSelect.locator(".ng-arrow-wrapper").click();
    await page.getByText(data.jobType).click();

    // Service type — appears after job type is selected
    await page.getByRole("combobox").nth(3).click();
    await page.getByText(data.jobService).click();

    // Drop location
    await page.getByRole("textbox", { name: "Search for a location" }).nth(1).fill(data.dropSearch);
    await page.getByText(data.dropResult).click();

    // Same location checkbox
    await page.locator(".checkmark").first().click();

    // Payment method
    await page.locator("ng-select.ng-invalid").first().locator(".ng-arrow-wrapper").click();
    await page.getByRole("option", { name: data.paymentMethod }).click();

    // Amount
    await page.locator("input.form-control.ng-invalid").first().fill(data.amount);

    // Discount
    await page.locator(".col-xs-12 > div:nth-child(2) > div:nth-child(2) > .form-group > .form-control").fill(data.discount);

    // No card reason
    await page.locator("ng-select.ng-invalid").first().locator(".ng-arrow-wrapper").click();
    await page.getByRole("option", { name: data.noCardReason }).click();

    await dismissToasts(page);
    await page.getByRole("button", { name: "Save" }).last().click();
  });

  await test.step("Verify job saved", async () => {
    await expect(
      page.getByRole("tabpanel", { name: /^Jobs/ }).getByRole("button", { name: "Save" })
    ).toBeVisible({ timeout: 15_000 });
  });
});
