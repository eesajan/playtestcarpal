import { expect, test } from "@playwright/test";
import { login, searchOptionalNgOption } from "../src/helpers/carpal.helpers";
import { generateVin } from "../src/helpers/vin.helper";
import { CreateVehiclePage } from "../src/pages/create-vehicle.page";

// ── test data ─────────────────────────────────────────────────────────────────
const vehicleData = {
  client: "Test",
  brand: "Acura",
  model: "CL",
  modelYear: "2027",
  plateNumber: "1234",
  mileage: "123",
  color: "yellow",
  country: "Pakistan",
  citySearch: "islamabad",
  cityResult: "Islamabad",
  remarks: "Created by Playwright automation"
} as const;

// ── test ──────────────────────────────────────────────────────────────────────
test("CarPal QA: create a temporary case from manual flow", async ({ page }) => {
  const vin = generateVin();
  console.log(`Using VIN: ${vin}`);

  await test.step("Log in", async () => {
    await login(page);
    await expect(page.getByText(/Hi Csa Csa!/i)).toBeVisible();
  });

  await test.step("Open temporary case vehicle form", async () => {
    await page.getByRole("link", { name: "Create Case", exact: true }).click();
    await page.getByRole("button", { name: "Create a Temporary" }).click();
    await expect(page.getByRole("heading", { name: "Create Vehicle" })).toBeVisible();
  });

  await test.step("Fill vehicle information", async () => {
    const vehiclePage = new CreateVehiclePage(page);
    await vehiclePage.subclientSelect.pick(vehicleData.client);

    const vinInput = page.getByRole("textbox", { name: "VIN *" });
    await vinInput.click();
    await vinInput.fill("");
    await vinInput.pressSequentially(vin);
    await expect(vinInput).toHaveValue(vin);

    await vehiclePage.brandSelect.pick(vehicleData.brand);
    await vehiclePage.modelSelect.pick(vehicleData.model);
    await vehiclePage.modelYearSelect.pick(vehicleData.modelYear);
    await page.getByRole("textbox", { name: "Plate Category Code / Plate" }).fill(vehicleData.plateNumber);
    await page.getByRole("textbox", { name: "Mileage" }).fill(vehicleData.mileage);
    await page.getByRole("textbox", { name: "Color" }).fill(vehicleData.color);
    await vehiclePage.countriesSelect.pick(vehicleData.country, "pak");
    await searchOptionalNgOption(page, page.locator('ng-select[name="cities"]'), vehicleData.citySearch, vehicleData.cityResult);
    await page.locator('textarea[name="remarks"]').fill(vehicleData.remarks);
  });

  await test.step("Create vehicle and case", async () => {
    await page.getByRole("button", { name: "Create Vehicle" }).click();
    await expect(page.getByRole("button", { name: "Create Case" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Create Case" }).click();
    await page.waitForLoadState("networkidle");
  });
});
