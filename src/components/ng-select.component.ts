import { expect, type Locator, type Page } from "@playwright/test";

export class NgSelectComponent {
  constructor(
    private readonly page: Page,
    private readonly root: Locator
  ) {}

  async pick(optionName: string, searchText = optionName): Promise<void> {
    await this.root.click();
    await this.root.locator('input[type="text"]').fill(searchText);
    await expect(this.page.getByRole("option", { name: optionName, exact: true })).toBeVisible();
    await this.page.getByRole("option", { name: optionName, exact: true }).click();
  }

  async pickOptional(searchText: string, optionName = searchText): Promise<void> {
    await this.root.click();
    await this.root.locator('input[type="text"]').fill(searchText);

    const option = this.page.getByRole("option", { name: optionName, exact: true });
    if (await option.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await option.click();
      return;
    }

    await this.root.locator('input[type="text"]').press("Enter");
  }

  async clear(): Promise<void> {
    const clearBtn = this.root.locator(".ng-clear-wrapper");
    if (await clearBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await clearBtn.click();
    }
  }

  async getValue(): Promise<string> {
    return (await this.root.locator(".ng-value-label").first().textContent()) ?? "";
  }
}
