/**
 * Opens the Playwright Recorder and saves the output to recordings/latest.spec.ts.
 *
 * Usage:  npm run recorder
 *
 * Steps:
 *   1. Browser opens at CarPal QA login — log in and perform your actions.
 *   2. Close the browser window when you are done.
 *   3. Run /agents:enhance-recording in Claude Code — it picks up the file automatically.
 */

import { execSync } from "child_process";
import fs from "fs";

const outputFile = "recordings/latest.spec.ts";

fs.mkdirSync("recordings", { recursive: true });

console.log("");
console.log("Opening Playwright Recorder...");
console.log(`Output will be saved to: ${outputFile}`);
console.log("");
console.log("  1. Log in to CarPal QA.");
console.log("  2. Perform the actions you want to automate.");
console.log("  3. Close the browser when done.");
console.log("");

execSync(
  `npx playwright codegen --output ${outputFile} https://qa.carpal.com/login`,
  { stdio: "inherit" }
);

console.log("");
console.log(`Recording saved to: ${outputFile}`);
console.log("Now run /agents:enhance-recording in Claude Code.");
console.log("");
