import { expect, test } from "@playwright/test";
import { login } from "../src/helpers/carpal.helpers";
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
  phoneNumber: "3045627061",
  locationSearch: "i 8 ",
  firstName: "100"
} as const;

test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 33.6844, longitude: 73.0479 }
});

// ── test ──────────────────────────────────────────────────────────────────────
test("CarPal QA: create case after vehicle creation", async ({ page }) => {
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
  });

  await test.step("Fill case details after vehicle creation", async () => {
    await expect(page.getByRole("heading", { name: /Case Details/i })).toBeVisible({ timeout: 30_000 });

    const phoneInput = page.getByRole("combobox").nth(5);
    await expect(phoneInput).toBeVisible({ timeout: 30_000 });
    await phoneInput.fill(caseData.phoneNumber);
    await expect(phoneInput).toHaveValue(caseData.phoneNumber);

    const locationInput = page.getByRole("textbox", { name: "Search for a location" });
    await expect(locationInput).toBeVisible({ timeout: 30_000 });
    await locationInput.fill(caseData.locationSearch);
    await expect(locationInput).toHaveValue(caseData.locationSearch);

    const firstNameInput = page.locator('input[name="firstName"]');
    await expect(firstNameInput).toBeVisible();
    await firstNameInput.fill(caseData.firstName);
    await expect(firstNameInput).toHaveValue(caseData.firstName);
  });
});
