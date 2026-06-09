import { expect } from "@playwright/test";
import { NgSelectComponent } from "../../components/ng-select.component";
import { BasePage } from "../base.page";
import { vehicleLocators } from "../../locators/vehicle/vehicle.locators";
import type { VehicleFormData } from "../../helpers/vehicle/vehicle.helper";

export class CreateVehiclePage extends BasePage {
  private readonly l = vehicleLocators(this.page);

  readonly subclientSelect = new NgSelectComponent(this.page, this.l.subclientSelect);
  // CarPal uses name="brand" for both make and model — nth(0/1) is the only stable distinction
  readonly brandSelect = new NgSelectComponent(this.page, this.l.brandSelect);
  readonly modelSelect = new NgSelectComponent(this.page, this.l.modelSelect);
  readonly modelYearSelect = new NgSelectComponent(this.page, this.l.modelYearSelect);
  readonly countriesSelect = new NgSelectComponent(this.page, this.l.countriesSelect);
  readonly citiesSelect = new NgSelectComponent(this.page, this.l.citiesSelect);

  async isLoaded(): Promise<void> {
    await expect(this.l.pageHeading).toBeVisible();
  }

  async fillVin(vin: string): Promise<void> {
    await this.l.vinInput.click();
    await this.l.vinInput.fill("");
    await this.l.vinInput.pressSequentially(vin);
    await this.l.vinInput.press("Tab");
    await expect(this.l.vinInput).toHaveValue(vin);
  }

  async fill(data: VehicleFormData): Promise<void> {
    await this.subclientSelect.pick(data.client);
    await this.fillVin(data.vin);
    await this.brandSelect.pick(data.brand);
    await this.modelSelect.pick(data.model);
    await this.modelYearSelect.pick(data.modelYear);
    await this.l.plateInput.fill(data.plateNumber);
    await this.l.mileageInput.fill(data.mileage);
    if (data.color) await this.l.colorInput.fill(data.color);
    if (data.country) {
      await this.countriesSelect.pick(
        data.country,
        data.countrySearch ?? data.country.slice(0, 3).toLowerCase()
      );
    }
    if (data.citySearch) await this.citiesSelect.pickOptional(data.citySearch);
    if (data.remarks) await this.l.remarksField.fill(data.remarks);
  }

  async submit(): Promise<void> {
    await this.l.createVehicleButton.click();
    await expect(this.l.createCaseButton).toBeVisible({ timeout: 30_000 });
  }

  async submitAndCreateCase(): Promise<void> {
    await this.submit();
    await this.l.createCaseButton.click();
  }
}
