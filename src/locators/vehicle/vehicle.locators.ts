import type { Page } from "@playwright/test";

export const vehicleLocators = (page: Page) => ({
  // heading
  pageHeading: page.getByRole("heading", { name: "Create Vehicle" }),

  // ng-select dropdowns
  // CarPal uses name="brand" for both make and model — nth(0/1) is the only stable distinction
  subclientSelect: page.locator('ng-select[name="subclient"]'),
  brandSelect: page.locator('ng-select[name="brand"]').nth(0),
  modelSelect: page.locator('ng-select[name="brand"]').nth(1),
  modelYearSelect: page.locator('ng-select[name="modelYear"]'),
  countriesSelect: page.locator('ng-select[name="countries"]'),
  citiesSelect: page.locator('ng-select[name="cities"]'),

  // text inputs
  vinInput: page.getByRole("textbox", { name: "VIN *" }),
  plateInput: page.getByRole("textbox", { name: "Plate Category Code / Plate" }),
  mileageInput: page.getByRole("textbox", { name: "Mileage" }),
  colorInput: page.getByRole("textbox", { name: "Color" }),
  remarksField: page.locator('textarea[name="remarks"]'),

  // actions
  createVehicleButton: page.getByRole("button", { name: "Create Vehicle" }),
  createCaseButton: page.getByRole("button", { name: "Create Case" }),
});
