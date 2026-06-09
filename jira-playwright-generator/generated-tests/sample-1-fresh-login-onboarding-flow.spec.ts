import { test, expect } from "@playwright/test";

test.describe(`SAMPLE-1`, () => {
  test(`SAMPLE-1: Fresh login onboarding flow`, async ({ page }) => {
    await page.goto(`/`);

    await expect(page.getByText(`Improve Your Morning, Love your life`)).toBeVisible();
    {
      const target = page.getByRole("button", { name: /Next/i }).or(page.getByRole("link", { name: /Next/i }));
      if (await target.count()) {
        await target.first().click();
      } else {
        await page.getByText(`Next`).first().click();
      }
    }

    await expect(page.getByText(`6 quick routines to win everyday`)).toBeVisible();
    {
      const target = page.getByRole("button", { name: /Next/i }).or(page.getByRole("link", { name: /Next/i }));
      if (await target.count()) {
        await target.first().click();
      } else {
        await page.getByText(`Next`).first().click();
      }
    }

    {
      const target = page.getByRole("button", { name: /Login/i }).or(page.getByRole("link", { name: /Login/i }));
      if (await target.count()) {
        await target.first().click();
      } else {
        await page.getByText(`Login`).first().click();
      }
    }

    await expect(page.getByText(`Login`)).toBeVisible();

    await page.getByLabel(/email|username/i).or(page.getByPlaceholder(/email|username/i)).or(page.getByTestId(`email`)).first().fill(`mmqa100@mailinator.com`);

    await page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).or(page.getByTestId(`password`)).first().fill(`Dpl@1234`);

    {
      const target = page.getByRole("button", { name: /Login/i }).or(page.getByRole("link", { name: /Login/i }));
      if (await target.count()) {
        await target.first().click();
      } else {
        await page.getByText(`Login`).first().click();
      }
    }

    await expect(page.getByText(`Reminder`)).toBeVisible();

    {
      const target = page.getByRole("button", { name: /Next/i }).or(page.getByRole("link", { name: /Next/i }));
      if (await target.count()) {
        await target.first().click();
      } else {
        await page.getByText(`Next`).first().click();
      }
    }

    await expect(page.getByText(`Modal`)).toBeVisible();

    {
      const target = page.getByRole("button", { name: /OK/i }).or(page.getByRole("link", { name: /OK/i }));
      if (await target.count()) {
        await target.first().click();
      } else {
        await page.getByText(`OK`).first().click();
      }
    }

    await expect(page.getByText(/Tip: Quickly access tracks and activities/i)).toBeVisible();
  });
});
