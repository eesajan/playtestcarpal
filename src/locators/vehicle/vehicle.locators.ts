import type { Page } from "@playwright/test";

export const vehicleLocators = (page: Page) => ({
  // heading
  pageHeading: page.getByRole("heading", { name: "Create Vehicle" }),

  // ng-select dropdowns
  subclientSelect: page.locator('ng-select[name="subclient"]'),
  // TODO_VERIFY_DOM: both dropdowns share name="brand" in the app (Angular app bug).
  // Positional nth() is banned — breaks on any DOM reorder.
  // Capture DOM snapshot via: npx playwright open https://qa.carpal.com/bu/vehicles/create
  // then inspect formcontrolname attrs on each ng-select.
  // If formcontrolname differs (e.g. "brand" vs "model"), replace with:
  //   brandSelect: page.locator('ng-select[formcontrolname="brand"]')
  //   modelSelect: page.locator('ng-select[formcontrolname="model"]')
  // Otherwise use label-scoped XPath (requires checking label text in DOM):
  brandSelect: page.locator('xpath=//label[normalize-space()="Brand"]/ancestor::div[contains(@class,"form-group") or contains(@class,"col")][1]//ng-select'),
  modelSelect: page.locator('xpath=//label[normalize-space()="Model"]/ancestor::div[contains(@class,"form-group") or contains(@class,"col")][1]//ng-select'),
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
