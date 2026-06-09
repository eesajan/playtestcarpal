import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { login } from "../helpers/carpal.helpers";

type CarpalFixtures = {
  /** A page that is already logged in to CarPal QA. */
  authenticatedPage: Page;
};

export const test = base.extend<CarpalFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await expect(page).toHaveURL(/\/bu\/dashboard/);
    await use(page);
  }
});

export { expect };
