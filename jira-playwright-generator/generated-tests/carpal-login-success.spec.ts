import { expect, test } from "@playwright/test";
import { login } from "../src/helpers/carpal.helpers";

test("CarPal QA: system should login successfully", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/bu\/dashboard/);
  await expect(page.getByText(/Hi Csa Csa!/i)).toBeVisible();
  await expect(page.getByText("Drivers").first()).toBeVisible();
});
