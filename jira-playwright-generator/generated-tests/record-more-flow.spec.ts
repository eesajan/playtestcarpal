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

test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 33.6844, longitude: 73.0479 }
});

// Timeout is 10 min — gives time to interact in the Inspector recorder.
test.setTimeout(600_000);

// ── test ──────────────────────────────────────────────────────────────────────
test("CarPal QA: setup + record more flow", async ({ page }) => {
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

  // ── PAUSE: Playwright Inspector opens here ────────────────────────────────
  // 1. Click the ⏺  Record button in the Inspector toolbar.
  // 2. Interact with the browser — every click/fill is captured as code.
  // 3. When done, click Resume (▶) — the console shows the recorded actions.
  // Run: npm run agent:enhance -- --input generated-tests/record-more-flow.spec.ts
  // ─────────────────────────────────────────────────────────────────────────
  await page.pause();
});
