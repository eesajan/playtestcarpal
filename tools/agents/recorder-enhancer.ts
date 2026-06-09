#!/usr/bin/env tsx
/**
 * Recorder Enhancement Agent
 *
 * Takes a raw Playwright recording and converts it to production-grade code:
 * replaces inline helpers with shared imports, brittle CSS chains with semantic
 * locators, adds assertions and test.step() groupings.
 *
 * Usage:
 *   tsx tools/agents/recorder-enhancer.ts --input recording.spec.ts --feature vehicle
 *   tsx tools/agents/recorder-enhancer.ts --input raw.spec.ts --output tests/vehicle/create.spec.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { ANTHROPIC_API_KEY } from "../../src/config/credentials";

// ─── framework context reader ──────────────────────────────────────────────────

const FRAMEWORK_PATHS = [
  "src/config/credentials.ts",
  "src/config/urls.ts",
  "src/config/test-data.ts",
  "src/helpers/auth/auth.helper.ts",
  "src/helpers/vehicle/vehicle.helper.ts",
  "src/helpers/case/case.helper.ts",
  "src/helpers/common/vin.helper.ts",
  "src/fixtures/auth.fixture.ts",
  "src/components/ng-select.component.ts",
  "src/pages/auth/login.page.ts",
  "src/pages/vehicle/create-vehicle.page.ts",
  "src/pages/case/create-case.page.ts",
];

function readFrameworkContext(): string {
  return FRAMEWORK_PATHS
    .filter(p => fs.existsSync(p))
    .map(p => `// ── ${p} ──\n${fs.readFileSync(p, "utf-8")}`)
    .join("\n\n");
}

function readExistingLocators(feature: string): string {
  const locatorFile = `src/locators/${feature}/${feature}.locators.ts`;
  if (!fs.existsSync(locatorFile)) return "";
  return `// ── EXISTING LOCATORS (${locatorFile}) — do not duplicate ──\n${fs.readFileSync(locatorFile, "utf-8")}`;
}

function readExistingHelpers(feature: string): string {
  const helperFile = `src/helpers/${feature}/${feature}.helper.ts`;
  if (!fs.existsSync(helperFile)) return "";
  return `// ── EXISTING HELPERS (${helperFile}) — do not duplicate ──\n${fs.readFileSync(helperFile, "utf-8")}`;
}

// ─── static pre-analysis ───────────────────────────────────────────────────────

type Finding = { severity: "error" | "warning" | "info"; message: string };

function analyzeRecording(code: string): Finding[] {
  const findings: Finding[] = [];

  if (/async function login\(/.test(code)) {
    findings.push({ severity: "error", message: "Inline login() — import from src/helpers/auth/auth.helper instead" });
  }
  if (/async function selectNgOption\(/.test(code)) {
    findings.push({ severity: "error", message: "Inline selectNgOption() — use NgSelectComponent instead" });
  }
  if (/async function getRandomValidVin\(/.test(code)) {
    findings.push({ severity: "error", message: "Inline getRandomValidVin() — use generateVin() from vin.helper instead" });
  }
  if (/randomvin\.com/.test(code)) {
    findings.push({ severity: "error", message: "External VIN service — replace with local generateVin()" });
  }
  if (/CARPAL_USERNAME\s*=|CARPAL_PASSWORD\s*=/.test(code)) {
    findings.push({ severity: "error", message: "Hardcoded credentials — use CARPAL_CREDENTIALS from src/config/credentials" });
  }

  const cssChains = [...code.matchAll(/locator\(['"][^'"]{60,}['"]\)/g)];
  if (cssChains.length > 0) {
    findings.push({ severity: "warning", message: `${cssChains.length} long CSS chain locator(s) — replace with getByRole/getByLabel` });
  }

  const nthUsage = [...code.matchAll(/\.nth\(\d+\)/g)];
  if (nthUsage.length > 0) {
    findings.push({ severity: "warning", message: `${nthUsage.length} nth() selector(s) — consider semantic alternatives` });
  }

  if (!code.includes("test.step")) {
    findings.push({ severity: "info", message: "No test.step() found — add logical groupings" });
  }

  if ((code.match(/expect\(/g) ?? []).length < 3) {
    findings.push({ severity: "warning", message: "Fewer than 3 assertions — add post-action validations" });
  }

  return findings;
}

// ─── enhancer ─────────────────────────────────────────────────────────────────

async function enhance(recordedCode: string, feature: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY in .env");

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const frameworkContext = readFrameworkContext();
  const existingLocators = readExistingLocators(feature);
  const existingHelpers = readExistingHelpers(feature);

  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are a Principal SDET. Enhance this raw Playwright recording into production-grade code.

## Available Framework (IMPORT from these — never duplicate)
${frameworkContext}

## Existing Locators for "${feature}" (REUSE these — do not create duplicates)
${existingLocators || "None yet — you may create new locators in src/locators/${feature}/${feature}.locators.ts"}

## Existing Helpers for "${feature}" (REUSE these — do not create duplicates)
${existingHelpers || "None yet — you may create new helpers in src/helpers/${feature}/${feature}.helper.ts"}

## Raw Recording
${recordedCode}

## Enhancement Rules
1. Replace inline \`login()\` with: \`import { login } from "../../src/helpers/auth/auth.helper"\`
2. Replace inline \`selectNgOption()\` with: \`new NgSelectComponent(page, locator).pick(option)\`
3. Replace \`getRandomValidVin()\` / randomvin.com with: \`import { generateVin } from "../../src/helpers/common/vin.helper"\`
4. Replace hardcoded credentials with \`CARPAL_CREDENTIALS\` from \`../../src/config/credentials\`
5. Replace long CSS class chains (> 60 chars) with \`getByRole\`, \`getByLabel\`, or \`getByTestId\`
6. Check if locators already exist in the locator file before creating new ones
7. Check if helpers already exist in the helper file before creating new ones
8. Add \`test.step()\` wrappers for logical phases (login, fill form, assert result)
9. Add missing assertions after each significant action
10. Move all test data into a typed \`const data = { ... }\` at the top
11. Add \`test.use({ permissions: ["geolocation"], geolocation: { ... } })\` if location features used
12. Remove \`page.pause()\` calls — recording artifacts
13. Output the spec to: tests/${feature}/{name}.spec.ts

Output ONLY the enhanced TypeScript spec file. No explanation. No markdown fences.`
      }
    ]
  });

  return msg.content[0].type === "text" ? msg.content[0].text : "";
}

// ─── CLI ───────────────────────────────────────────────────────────────────────

function argValue(flag: string): string | undefined {
  const args = process.argv.slice(2);
  return args.find(a => a.startsWith(`${flag}=`))?.slice(flag.length + 1) ||
    (args.indexOf(flag) !== -1 ? args[args.indexOf(flag) + 1] : undefined);
}

const inputArg = argValue("--input");
const outputArg = argValue("--output");
const featureArg = argValue("--feature") ?? "misc";

if (!inputArg) {
  console.error(
    "Usage:\n" +
    "  tsx tools/agents/recorder-enhancer.ts --input <recorded.spec.ts> --feature <feature>\n" +
    "  tsx tools/agents/recorder-enhancer.ts --input <raw.spec.ts> --output <tests/feature/name.spec.ts>"
  );
  process.exit(1);
}

if (!fs.existsSync(inputArg)) {
  console.error(`File not found: ${inputArg}`);
  process.exit(1);
}

const recordedCode = fs.readFileSync(inputArg, "utf-8");

const findings = analyzeRecording(recordedCode);
if (findings.length > 0) {
  console.log("\n── Static Analysis Findings ──");
  for (const f of findings) {
    const prefix = f.severity === "error" ? "✗" : f.severity === "warning" ? "⚠" : "ℹ";
    console.log(`  ${prefix} ${f.message}`);
  }
  console.log("");
}

console.log("Reading framework + existing locators/helpers...");
console.log("Calling Claude API for enhancement...");
const enhanced = await enhance(recordedCode, featureArg);

const outputPath = outputArg ?? (() => {
  const base = path.basename(inputArg, ".spec.ts");
  const outputDir = path.join("tests", featureArg);
  fs.mkdirSync(outputDir, { recursive: true });
  return path.join(outputDir, `${base}-enhanced.spec.ts`);
})();

fs.writeFileSync(outputPath, enhanced, "utf-8");
console.log(`Enhanced spec written to: ${outputPath}`);
