import type { Page } from "@playwright/test";

export const caseLocators = (page: Page) => ({
  // heading
  pageHeading: page.getByRole("heading", { name: /Case Details/i }),

  // tabs
  tab: (name: string) => page.getByRole("tab", { name }),

  // customer details tab
  countryCodeSelect: page.locator("#countryCode"),
  phoneNumberField: page.locator(".phone-number-field"),

  // pickup location tab
  locationInput: page.getByRole("textbox", { name: "Search for a location" }),

  // reported issue tab — first invalid ng-select on the tab holds the issue type
  issueTypeSelect: page.locator("ng-select.ng-invalid").first(),

  // job tab
  paymentMethodSelect: page.locator("ng-select.ng-invalid"),

  // actions
  saveButton: page.getByRole("button", { name: "Save" }),
  createJobButton: page.getByRole("button", { name: "Create Job" }),

  // notifications
  toastNotification: page.locator('[aria-label="Notification"]'),
});
