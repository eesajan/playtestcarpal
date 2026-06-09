import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

const baseURL = process.env.BASE_APP_URL || "http://127.0.0.1:3000";
const startsLocalSampleApp = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(baseURL);

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  webServer: startsLocalSampleApp
    ? {
        command: "npm run sample-app",
        url: `${baseURL.replace(/\/$/, "")}/health`,
        reuseExistingServer: true,
        timeout: 30_000
      }
    : undefined,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }]
  ]
});
