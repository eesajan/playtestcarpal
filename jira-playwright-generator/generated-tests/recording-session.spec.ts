import { test } from "@playwright/test";

test("recording session", async ({ page }) => {
  await page.goto("https://qa.carpal.com/login");
  await page.pause(); // Inspector opens here — perform your steps, then click Resume
});
