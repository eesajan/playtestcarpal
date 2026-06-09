#!/usr/bin/env tsx
/**
 * Recorder Enhancement Agent
 *
 * Takes a raw Playwright recording (from codegen or page.pause() Inspector) and
 * converts it to production-grade code: replaces inline helpers with shared
 * imports, brittle CSS chains with semantic locators, adds assertions and steps.
 *
 * Usage:
 *   tsx src/agents/recorder-enhancer.ts --input generated-tests/record-more-flow.spec.ts
 *   tsx src/agents/recorder-enhancer.ts --input raw.spec.ts --output enhanced.spec.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// ─── framework context reader ──────────────────────────────────────────────────

const FRAMEWORK_PATHS = [
  "src/helpers/carpal.helpers.ts",
  "src/helpers/vin.helper.ts",
  "src/fixtures/auth.fixture.ts",
  "src/components/ng-select.component.ts",
  "src/pages/base.page.ts",
  "src/pages/login.page.ts",
  "src/pages/dashboard.page.ts",
  "src/pages/create-vehicle.page.ts",
  "src/pages/create-case.page.ts",
];

function readFrameworkContext(): string {
  return FRAMEWORK_PATHS
    .filter(p => fs.existsSync(p))
    .map(p => `// ── ${p} ──\n${fs.readFileSync(p, "utf-8")}`)
    .join("\n\n");
}

// ─── static pre-analysis ───────────────────────────────────────────────────────

type Finding = { severity: "error" | "warning" | "info"; message: string };

function analyzeRecording(code: string): Finding[] {
  const findings: Finding[] = [];

  if (/async function login\(/.test(code)) {
    findings.push({ severity: "error", message: "Inline login() — import from carpal.helpers instead" });
  }
  if (/async function selectNgOption\(/.test(code)) {
    findings.push({ severity: "error", message: "Inline selectNgOption() — use NgSelectComponent instead" });
  }
  if (/async function getRandomValidVin\(/.test(code)) {
    findings.push({ severity: "error", message: "Inline getRandomValidVin() — use generateVin() from vin.helper instead" });
  }
  if (/randomvin\.com/.test(code)) {
    findings.push({ severity: "error", message: "External VIN service (randomvin.com) — replace with local generateVin()" });
  }
  if (/CARPAL_USERNAME\s*=|CARPAL_PASSWORD\s*=/.test(code)) {
    findings.push({ severity: "error", message: "Hardcoded credentials — use process.env" });
  }

  // Brittle locators
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

async function enhance(recordedCode: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY in .env");

  const client = new Anthropic({ apiKey });
  const frameworkContext = readFrameworkContext();

  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are a Principal SDET. Enhance this raw Playwright recording into production-grade code.

## Available Framework (IMPORT from these — never duplicate)
${frameworkContext}

## Raw Recording
${recordedCode}

## Enhancement Rules
1. Replace inline \`login()\` with: \`import { login } from "../src/helpers/carpal.helpers"\`
2. Replace inline \`selectNgOption()\` with: \`new NgSelectComponent(page, locator).pick(option)\`
3. Replace \`getRandomValidVin()\` / randomvin.com calls with: \`import { generateVin } from "../src/helpers/vin.helper"\`
4. Replace hardcoded credentials with \`process.env.CARPAL_USERNAME\` / \`process.env.CARPAL_PASSWORD\`
5. Replace long CSS class chains (> 60 chars) with \`getByRole\`, \`getByLabel\`, or \`getByTestId\`
6. Replace \`.nth(N)\` on generic locators with semantic context-based alternatives where possible
7. Add \`test.step()\` wrappers for logical phases (login, fill form, assert result)
8. Add missing assertions after each significant action (URL changes, heading visible, button appeared)
9. Move all test data into a typed \`const data = { ... }\` at the top of the file
10. Add \`test.use({ permissions: ["geolocation"], geolocation: { ... } })\` if location features are used
11. Add meaningful timeouts (\`{ timeout: 30_000 }\`) only where network/DB operations cause delays
12. Remove \`page.pause()\` calls — they are recording artifacts

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

if (!inputArg) {
  console.error(
    "Usage:\n" +
    "  tsx src/agents/recorder-enhancer.ts --input <recorded.spec.ts>\n" +
    "  tsx src/agents/recorder-enhancer.ts --input <recorded.spec.ts> --output <enhanced.spec.ts>"
  );
  process.exit(1);
}

if (!fs.existsSync(inputArg)) {
  console.error(`File not found: ${inputArg}`);
  process.exit(1);
}

const recordedCode = fs.readFileSync(inputArg, "utf-8");

// Print static analysis first
const findings = analyzeRecording(recordedCode);
if (findings.length > 0) {
  console.log("\n── Static Analysis Findings ──");
  for (const f of findings) {
    const prefix = f.severity === "error" ? "✗" : f.severity === "warning" ? "⚠" : "ℹ";
    console.log(`  ${prefix} ${f.message}`);
  }
  console.log("");
}

console.log("Calling Claude API for enhancement...");
const enhanced = await enhance(recordedCode);

const outputPath = outputArg ?? (() => {
  const base = path.basename(inputArg, ".spec.ts");
  return path.join(path.dirname(inputArg), `${base}-enhanced.spec.ts`);
})();

fs.writeFileSync(outputPath, enhanced, "utf-8");
console.log(`Enhanced spec written to: ${outputPath}`);
