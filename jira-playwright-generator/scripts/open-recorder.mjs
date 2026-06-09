/**
 * Opens a full-size browser at CarPal QA login with the Playwright Inspector.
 *
 * Usage:  npm run recorder
 *
 * Steps:
 *   1. Browser opens at CarPal login — log in manually.
 *   2. A separate "Playwright Inspector" window opens — click Record (⏺).
 *   3. Do your actions in the browser — code is generated live.
 *   4. Click Resume (▶) in the Inspector when done.
 *   5. Copy the generated code from the Inspector and paste it in chat.
 *
 * If you cannot see the Inspector window: press Alt+Tab or check the taskbar.
 */

import { chromium } from "playwright";

const context = await chromium.launchPersistentContext(
  ".playwright-carpal-profile",
  {
    headless: false,
    viewport: null,
    args: [
      "--window-size=1600,1000",   // wide + tall enough for full CarPal layout
      "--window-position=320,0"    // leaves space on left for the Inspector panel
    ]
  }
);

const page = context.pages()[0] || await context.newPage();
await page.goto("https://qa.carpal.com/login", { waitUntil: "domcontentloaded" });

console.log("");
console.log("Browser is open at https://qa.carpal.com/login");
console.log("");
console.log("The Playwright Inspector window is opening now.");
console.log("If you cannot see it: press Alt+Tab or check the Windows taskbar.");
console.log("");
console.log("Click Record (⏺) in the Inspector to start capturing your actions.");
console.log("Click Resume (▶) when you are done.");
console.log("");

await page.pause();

await context.close();
process.exit(0);
