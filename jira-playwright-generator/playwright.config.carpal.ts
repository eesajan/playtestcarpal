import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./generated-tests",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: process.env.CARPAL_BASE_URL || "https://qa.carpal.com",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/carpal.json"
      },
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/
    }
  ],
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }]
  ]
});
