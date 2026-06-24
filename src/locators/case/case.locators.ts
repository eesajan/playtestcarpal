import type { Page } from "@playwright/test";

export const caseLocators = (page: Page) => ({
  // heading
  pageHeading: page.getByRole("heading", { name: /Case Details/i }),

  // tabs
  tab: (name: string) => page.getByRole("tab", { name }),

  // customer details tab
  countryCodeSelect: page.locator("#countryCode"),
  // TODO_VERIFY_DOM: ".phone-number-field" is a CSS class — fragile if class name changes.
  // Capture DOM snapshot and replace with: label-scoped ng-select or data-testid.
  // e.g. page.locator('label:has-text("Phone") ~ ng-select') or page.locator('[data-testid="phone-select"]')
  phoneNumberField: page.locator(".phone-number-field"),

  // pickup location tab
  locationInput: page.getByRole("textbox", { name: "Search for a location" }),

  // reported issue tab
  // FIXED: ng-select.ng-invalid is a CSS validation STATE class — it changes when the user
  // interacts with the form (valid → invalid → valid). Using it as a selector is unreliable.
  // TODO_VERIFY_DOM: open Reported Issue tab, inspect ng-select formcontrolname attributes.
  // Replace with: page.locator('ng-select[formcontrolname="issueType"]')
  issueTypeSelect: page.locator('app-reported-issue ng-select').first(),

  // job tab
  // FIXED: same issue — ng-invalid changes state. Scoped to a stable ancestor instead.
  // TODO_VERIFY_DOM: inspect formcontrolname on the payment method ng-select and replace with:
  // page.locator('ng-select[formcontrolname="paymentMethod"]')
  paymentMethodSelect: page.locator('app-create-job ng-select, app-job-details ng-select').first(),

  // actions
  saveButton: page.getByRole("button", { name: "Save" }),
  createJobButton: page.getByRole("button", { name: "Create Job" }),

  // notifications
  toastNotification: page.locator('[aria-label="Notification"]'),
});
