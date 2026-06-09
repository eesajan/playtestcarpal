import type { Page } from "@playwright/test";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  abstract isLoaded(): Promise<void>;

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }
}
