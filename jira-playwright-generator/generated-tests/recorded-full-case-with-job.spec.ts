import { expect, test } from "@playwright/test";
import { login } from "../src/helpers/carpal.helpers";
import { NgSelectComponent } from "../src/components/ng-select.component";
import { generateVin } from "../src/helpers/vin.helper";
import { CreateVehiclePage } from "../src/pages/create-vehicle.page";

// ── test data ─────────────────────────────────────────────────────────────────
const vehicleData = {
  client: "Test",
  brand: "Acura",
  model: "CL",
  modelYear: "2027",
  plateNumber: "1234",
  mileage: "123"
} as const;

const caseData = {
  countryCode: "PAK",
  phoneNumber: "3045627061",
  pickupLocation: "i 8 ",
  pickupLocationResult: "I-8 MarkazI 8 Markaz I-8,",
  reportedIssue: "Accident",
  reportedIssueSource: "Web",
  jobType: "Accident - Major Accident",
  jobService: "Vehicle Towing - Accident",
  dropLocation: "i 10 ",
  dropLocationResult: "I-10 MarkazI 10 Markaz I-10,",
  paymentMethod: "Cash",
  amount: "100",
  discount: "10",
  noCardReason: "Don't have Credit & Debit Card"
} as const;

test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 33.6844, longitude: 73.0479 }
});

// ── test ──────────────────────────────────────────────────────────────────────
test("CarPal QA: full flow — create vehicle, case, and job", async ({ page }) => {
  const vin = generateVin();
  console.log(`Using VIN: ${vin}`);

  await test.step("Log in", async () => {
    await login(page);
    await expect(page.getByText(/Hi Csa Csa!/i)).toBeVisible();
  });

  await test.step("Open temporary vehicle flow", async () => {
    await page.getByRole("link", { name: "Create Case", exact: true }).click();
    await page.getByRole("button", { name: "Create a Temporary" }).click();
    await expect(page.getByRole("heading", { name: "Create Vehicle" })).toBeVisible();
  });

  await test.step("Create vehicle", async () => {
    const vehiclePage = new CreateVehiclePage(page);
    await vehiclePage.subclientSelect.pick(vehicleData.client);
    await vehiclePage.brandSelect.pick(vehicleData.brand);
    await vehiclePage.modelSelect.pick(vehicleData.model);
    await vehiclePage.modelYearSelect.pick(vehicleData.modelYear);
    await page.getByRole("textbox", { name: "Plate Category Code / Plate" }).fill(vehicleData.plateNumber);
    await page.getByRole("textbox", { name: "Mileage" }).fill(vehicleData.mileage);

    const vinInput = page.getByRole("textbox", { name: "VIN *" });
    await vinInput.click();
    await vinInput.fill("");
    await vinInput.pressSequentially(vin);
    await vinInput.press("Tab");
    await expect(vinInput).toHaveValue(vin);

    await page.getByRole("button", { name: "Create Vehicle" }).click();
    await expect(page.getByRole("button", { name: "Create Case" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Create Case" }).click();
    await expect(page.getByRole("heading", { name: /Case Details/i })).toBeVisible({ timeout: 30_000 });
  });

  await test.step("Save vehicle and owner information", async () => {
    await page.getByRole("tab", { name: "Vehicle and Owner Information" }).click();
    await page.getByRole("button", { name: "Save" }).click();
  });

  await test.step("Fill customer details", async () => {
    await page.getByRole("tab", { name: "Customer Details" }).click();
    // Country code dropdown (identified by its ID)
    const countrySelect = new NgSelectComponent(page, page.locator("#countryCode"));
    await countrySelect.pick(caseData.countryCode);
    // Phone number ng-select (identified by class)
    await page.locator(".phone-number-field").locator(".ng-select-container").click();
    await page
      .getByRole("listbox")
      .filter({ hasText: "No items found" })
      .getByRole("combobox")
      .fill(caseData.phoneNumber);
    await page.getByText(`+92${caseData.phoneNumber} | Eesa`).click();
    await page.getByRole("button", { name: "Save" }).click();
  });

  await test.step("Set pickup location", async () => {
    await page.getByRole("tab", { name: "Pickup Location" }).click();
    const locationInput = page.getByRole("textbox", { name: "Search for a location" });
    await locationInput.click();
    await locationInput.press("ControlOrMeta+a");
    await locationInput.fill(caseData.pickupLocation);
    await page.getByText(caseData.pickupLocationResult).click();
    await page.getByRole("button", { name: "Save" }).click();
  });

  await test.step("Set reported issue", async () => {
    await page.getByRole("tab", { name: "Reported Issue" }).click();
    // First invalid ng-select on this tab is the issue type
    await page.locator("ng-select.ng-invalid").first().locator(".ng-arrow-wrapper").click();
    await page.getByRole("option", { name: caseData.reportedIssue, exact: true }).click();
    await page.getByLabel("Reported Issue").getByText(caseData.reportedIssueSource, { exact: true }).click();
    await page.getByRole("button", { name: "Save" }).click();
  });

  await test.step("Create job", async () => {
    await page.getByRole("button", { name: "Create Job" }).click();

    // Job type — first taggable ng-select on the job form
    await page.locator("ng-select.ng-select-taggable").locator(".ng-arrow-wrapper").click();
    await page.getByText(caseData.jobType).click();

    // Service type — first remaining invalid ng-select
    const serviceSelect = new NgSelectComponent(page, page.locator("ng-select.ng-invalid").first());
    await serviceSelect.pick(caseData.jobService);

    // Drop location — second location search box on the page
    await page.getByRole("textbox", { name: "Search for a location" }).nth(1).fill(caseData.dropLocation);
    await page.getByText(caseData.dropLocationResult).click();

    // Confirm checkbox
    await page.locator(".checkmark").first().click();

    // Payment method
    const paymentSelect = new NgSelectComponent(page, page.locator("ng-select.ng-invalid").first());
    await paymentSelect.pick(caseData.paymentMethod);

    // Amount field — first numeric input on the job form
    const amountInput = page.locator('input.form-control.ng-invalid').first();
    await amountInput.click();
    await amountInput.fill(caseData.amount);

    // Discount field — second numeric input
    const discountInput = page.locator('input.form-control.ng-invalid').nth(1);
    await discountInput.click();
    await discountInput.fill(caseData.discount);

    // No-card reason
    const noCardSelect = new NgSelectComponent(page, page.locator("ng-select.ng-invalid").first());
    await noCardSelect.pick(caseData.noCardReason);

    await page.getByRole("button", { name: "Save" }).click();
  });
});
