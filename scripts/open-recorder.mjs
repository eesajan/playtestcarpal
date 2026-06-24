/**
 * Opens the Playwright Recorder and saves the output to recordings/latest.spec.ts.
 * When the browser closes, automatically runs the enhance-recording agent to produce
 * a clean, production-ready test — then deletes the raw recording.
 *
 * Usage:  npm run recorder
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";

const outputFile = "recordings/latest.spec.ts";

fs.mkdirSync("recordings", { recursive: true });

// Snapshot mtime before recording so we can detect whether anything was saved
const beforeMtime = fs.existsSync(outputFile) ? fs.statSync(outputFile).mtimeMs : 0;

console.log("");
console.log("Opening Playwright Recorder...");
console.log(`Output will be saved to: ${outputFile}`);
console.log("");
console.log("  1. Log in to CarPal QA.");
console.log("  2. Perform the actions you want to automate.");
console.log("  3. Close the browser — AI will enhance the recording automatically.");
console.log("");

execSync(
  `npx playwright codegen --output ${outputFile} https://qa.carpal.com/login`,
  { stdio: "inherit" }
);

// Decide whether a real recording was saved
const fileExists = fs.existsSync(outputFile);
const afterMtime  = fileExists ? fs.statSync(outputFile).mtimeMs : 0;
const fileSize    = fileExists ? fs.statSync(outputFile).size    : 0;

if (!fileExists || afterMtime === beforeMtime || fileSize < 100) {
  console.log("");
  console.log("No recording was saved. Exiting.");
  process.exit(0);
}

console.log("");
console.log(`Recording saved (${fileSize} bytes). Starting AI enhancement...`);
console.log("─".repeat(60));
console.log("");

const prompt = `
Read the raw Playwright recording at recordings/latest.spec.ts.
Follow the complete workflow described in .claude/commands/agents/enhance-recording.md exactly.
Infer the feature folder (vehicle, case, auth, dashboard) from the recording's URLs and actions — do not ask.
Apply every item on the enhancement checklist without skipping any.
Write the enhanced spec to tests/{feature}/{descriptive-name}.spec.ts.
`.trim();

const result = spawnSync(
  "claude",
  ["-p", prompt, "--dangerously-skip-permissions"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: process.cwd(),
  }
);

console.log("");
console.log("─".repeat(60));

if (result.error?.code === "ENOENT") {
  console.error("ERROR: 'claude' CLI not found in PATH.");
  console.error("Install it from: https://claude.ai/download");
  console.error(`Recording preserved at: ${outputFile}`);
  console.error("Run /agents:enhance-recording in Claude Code to enhance manually.");
  process.exit(1);
}

if (result.status === 0) {
  // Delete raw recording — enhanced spec is now in tests/{feature}/
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
    console.log(`Raw recording deleted: ${outputFile}`);
  }
  console.log("Done! Check tests/{feature}/ for the enhanced spec.");
} else {
  console.log("Enhancement encountered an issue. Raw recording preserved at:", outputFile);
  console.log("Run /agents:enhance-recording in Claude Code to enhance manually.");
}
