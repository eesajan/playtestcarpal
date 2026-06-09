import { expect } from "@playwright/test";
import { NgSelectComponent } from "../components/ng-select.component";
import { BasePage } from "./base.page";

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
  citySearch?: string;
  remarks?: string;
};

export class CreateVehiclePage extends BasePage {
  readonly subclientSelect = new NgSelectComponent(this.page, this.page.locator('ng-select[name="subclient"]'));
  // CarPal uses name="brand" for both make and model ng-selects — nth(0/1) is the only stable distinction.
  readonly brandSelect = new NgSelectComponent(this.page, this.page.locator('ng-select[name="brand"]').nth(0));
  readonly modelSelect = new NgSelectComponent(this.page, this.page.locator('ng-select[name="brand"]').nth(1));
  readonly modelYearSelect = new NgSelectComponent(this.page, this.page.locator('ng-select[name="modelYear"]'));
  readonly countriesSelect = new NgSelectComponent(this.page, this.page.locator('ng-select[name="countries"]'));
  readonly citiesSelect = new NgSelectComponent(this.page, this.page.locator('ng-select[name="cities"]'));

  readonly vinInput = this.page.getByRole("textbox", { name: "VIN *" });
  readonly plateInput = this.page.getByRole("textbox", { name: "Plate Category Code / Plate" });
  readonly mileageInput = this.page.getByRole("textbox", { name: "Mileage" });
  readonly colorInput = this.page.getByRole("textbox", { name: "Color" });
  readonly remarksField = this.page.locator('textarea[name="remarks"]');

  async isLoaded(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Create Vehicle" })).toBeVisible();
  }

  async fillVin(vin: string): Promise<void> {
    await this.vinInput.click();
    await this.vinInput.fill("");
    await this.vinInput.pressSequentially(vin);
    await this.vinInput.press("Tab");
    await expect(this.vinInput).toHaveValue(vin);
  }

  async fill(data: VehicleFormData): Promise<void> {
    await this.subclientSelect.pick(data.client);
    await this.fillVin(data.vin);
    await this.brandSelect.pick(data.brand);
    await this.modelSelect.pick(data.model);
    await this.modelYearSelect.pick(data.modelYear);
    await this.plateInput.fill(data.plateNumber);
    await this.mileageInput.fill(data.mileage);
    if (data.color) await this.colorInput.fill(data.color);
    if (data.country) await this.countriesSelect.pick(data.country, data.country.slice(0, 3).toLowerCase());
    if (data.citySearch) await this.citiesSelect.pickOptional(data.citySearch);
    if (data.remarks) await this.remarksField.fill(data.remarks);
  }

  async submit(): Promise<void> {
    await this.page.getByRole("button", { name: "Create Vehicle" }).click();
    await expect(this.page.getByRole("button", { name: "Create Case" })).toBeVisible({ timeout: 30_000 });
  }

  async submitAndCreateCase(): Promise<void> {
    await this.submit();
    await this.page.getByRole("button", { name: "Create Case" }).click();
  }
}
