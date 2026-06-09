import { expect, test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";
import { login } from "../helpers/carpal.helpers";

const authFile = "playwright/.auth/carpal.json";

setup("save CarPal auth state", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/bu\/dashboard/);

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
