import { chromium } from "playwright";

const context = await chromium.launchPersistentContext(".playwright-carpal-profile", {
  headless: false,
  viewport: null,
  args: ["--start-maximized"]
});

const page = context.pages()[0] || await context.newPage();
await page.goto("https://qa.carpal.com/login", { waitUntil: "domcontentloaded" });

process.on("SIGINT", async () => {
  await context.close();
  process.exit(0);
});

await new Promise(() => {});
