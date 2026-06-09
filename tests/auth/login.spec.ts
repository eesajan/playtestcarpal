import { expect, test } from "@playwright/test";
import { login } from "../../src/helpers/auth/auth.helper";

test("CarPal QA: system should login successfully", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/bu\/dashboard/);
  await expect(page.getByText(/Hi .+!/i)).toBeVisible();
  await expect(page.getByText("Drivers").first()).toBeVisible();
});
