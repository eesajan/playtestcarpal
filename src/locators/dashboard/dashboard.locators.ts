import type { Page } from "@playwright/test";

export const dashboardLocators = (page: Page) => ({
  createCaseLink: page.getByRole("link", { name: "Create Case", exact: true }),
  createTemporaryCaseButton: page.getByRole("button", { name: "Create a Temporary" }),
  greeting: page.getByText(/Hi .+!/i),

  // sidebar navigation
  caseManagementLink: page.locator("app-sidebar a").filter({ hasText: "Case Managment" }),
  viewCasesLink: page.locator("a").filter({ hasText: /^View Cases$/ }),
});
