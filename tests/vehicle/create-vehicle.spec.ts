import { expect, test } from "@playwright/test";
import { login } from "../../src/helpers/auth/auth.helper";
import { generateVin } from "../../src/helpers/common/vin.helper";
import { CreateVehiclePage } from "../../src/pages/vehicle/create-vehicle.page";
import { DEFAULT_VEHICLE_DATA } from "../../src/config/test-data";
import { dashboardLocators } from "../../src/locators/dashboard/dashboard.locators";
import { vehicleLocators } from "../../src/locators/vehicle/vehicle.locators";
import { caseLocators } from "../../src/locators/case/case.locators";

// ── test data ─────────────────────────────────────────────────────────────────
const data = {
  ...DEFAULT_VEHICLE_DATA,
} as const;

// ── test ──────────────────────────────────────────────────────────────────────
test("CarPal QA: create a temporary case from manual flow", async ({ page }) => {
  const vin = generateVin();
  const d = dashboardLocators(page);
  const v = vehicleLocators(page);
  const c = caseLocators(page);

  await test.step("Log in", async () => {
    await login(page);
    await expect(d.greeting).toBeVisible();
  });

  await test.step("Open temporary case vehicle form", async () => {
    await d.createCaseLink.click();
    await d.createTemporaryCaseButton.click();
    await expect(v.pageHeading).toBeVisible();
  });

  await test.step("Fill vehicle information", async () => {
    const vehiclePage = new CreateVehiclePage(page);
    await vehiclePage.fill({
      vin,
      client: data.client,
      brand: data.brand,
      model: data.model,
      modelYear: data.modelYear,
      plateNumber: data.plateNumber,
      mileage: data.mileage,
      color: data.color,
      country: data.country,
      countrySearch: data.countrySearch,
      citySearch: data.citySearch,
      remarks: data.remarks,
    });
  });

  await test.step("Create vehicle and case", async () => {
    await v.createVehicleButton.click();
    await expect(v.createCaseButton).toBeVisible({ timeout: 30_000 });
    await v.createCaseButton.click();
    await page.waitForLoadState("networkidle");
    await expect(c.pageHeading).toBeVisible({ timeout: 30_000 });
  });
});
