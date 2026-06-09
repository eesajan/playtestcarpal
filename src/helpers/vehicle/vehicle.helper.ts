import { expect, type Page } from "@playwright/test";
import { NgSelectComponent } from "../../components/ng-select.component";
import { vehicleLocators } from "../../locators/vehicle/vehicle.locators";

export type VehicleFormData = {
  vin: string;
  client: string;
  brand: string;
  model: string;
  modelYear: string;
  plateNumber: string;
  mileage: string;
  color?: string;
  country?: string;
  countrySearch?: string;
  citySearch?: string;
  remarks?: string;
};

export async function fillVehicleForm(page: Page, data: VehicleFormData): Promise<void> {
  const l = vehicleLocators(page);

  await new NgSelectComponent(page, l.subclientSelect).pick(data.client);
  await fillVin(page, data.vin);
  await new NgSelectComponent(page, l.brandSelect).pick(data.brand);
  await new NgSelectComponent(page, l.modelSelect).pick(data.model);
  await new NgSelectComponent(page, l.modelYearSelect).pick(data.modelYear);
  await l.plateInput.fill(data.plateNumber);
  await l.mileageInput.fill(data.mileage);
  if (data.color) await l.colorInput.fill(data.color);
  if (data.country) {
    await new NgSelectComponent(page, l.countriesSelect).pick(
      data.country,
      data.countrySearch ?? data.country.slice(0, 3).toLowerCase()
    );
  }
  if (data.citySearch) {
    await new NgSelectComponent(page, l.citiesSelect).pickOptional(data.citySearch);
  }
  if (data.remarks) await l.remarksField.fill(data.remarks);
}

export async function fillVin(page: Page, vin: string): Promise<void> {
  const l = vehicleLocators(page);
  await l.vinInput.click();
  await l.vinInput.fill("");
  await l.vinInput.pressSequentially(vin);
  await l.vinInput.press("Tab");
  await expect(l.vinInput).toHaveValue(vin);
}

export async function submitVehicle(page: Page): Promise<void> {
  const l = vehicleLocators(page);
  await l.createVehicleButton.click();
  await expect(l.createCaseButton).toBeVisible({ timeout: 30_000 });
}

export async function submitVehicleAndCreateCase(page: Page): Promise<void> {
  const l = vehicleLocators(page);
  await submitVehicle(page);
  await l.createCaseButton.click();
}
