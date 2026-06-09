#!/usr/bin/env tsx
/**
 * Framework Architect Agent
 *
 * Scans the repository for duplication, brittle locators, and missing architecture
 * components. Optionally calls the Claude API for AI-powered recommendations.
 *
 * Usage:
 *   tsx tools/agents/framework-architect.ts
 *   tsx tools/agents/framework-architect.ts --ai
 *   tsx tools/agents/framework-architect.ts --output reports/framework.md
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { ANTHROPIC_API_KEY } from "../../src/config/credentials";

// ─── file scanner ─────────────────────────────────────────────────────────────

function scanDir(dir: string, ext = ".ts"): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (
      entry.isDirectory() &&
      !["node_modules", ".git", "playwright-report", "test-results", "dist", ".playwright-carpal-profile"].includes(entry.name)
    ) {
      results.push(...scanDir(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// ─── duplicate detection ───────────────────────────────────────────────────────

type DuplicateMap = Map<string, string[]>;

function detectDuplicateFunctions(files: string[]): DuplicateMap {
  const map: DuplicateMap = new Map();
  const pattern = /(?:^|\n)(?:export\s+)?async\s+function\s+(\w+)\s*\(/g;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(content)) !== null) {
      const name = m[1];
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(file);
    }
  }

  return new Map([...map].filter(([, locs]) => locs.length > 1));
}

// ─── brittle locator detection ─────────────────────────────────────────────────

type LocatorIssue = { file: string; line: number; issue: string; snippet: string };

function detectBrittleLocators(files: string[]): LocatorIssue[] {
  const issues: LocatorIssue[] = [];

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");
    lines.forEach((line, i) => {
      const ln = i + 1;
      const trimmed = line.trim();

      const cssMatch = trimmed.match(/locator\(['"]([^'"]{60,})['"]\)/);
      if (cssMatch) {
        issues.push({ file, line: ln, issue: "Long CSS chain", snippet: trimmed.slice(0, 120) });
      }

      if (/\.nth\(\d+\)/.test(trimmed) && !/getByRole|getByLabel|getByText|getByTestId/.test(trimmed)) {
        issues.push({ file, line: ln, issue: "nth() on non-semantic locator", snippet: trimmed.slice(0, 120) });
      }

      if (/locator\(['"]\/\//.test(trimmed)) {
        issues.push({ file, line: ln, issue: "Absolute XPath", snippet: trimmed.slice(0, 120) });
      }
    });
  }

  return issues;
}

// ─── missing architecture check ────────────────────────────────────────────────

type MissingItem = { path: string; purpose: string };

function detectMissingComponents(): MissingItem[] {
  const expected: MissingItem[] = [
    { path: "src/config/credentials.ts", purpose: "Global credentials config" },
    { path: "src/config/urls.ts", purpose: "Global URL config" },
    { path: "src/config/test-data.ts", purpose: "Shared test data constants" },
    { path: "src/locators/auth/login.locators.ts", purpose: "Login locators" },
    { path: "src/locators/vehicle/vehicle.locators.ts", purpose: "Vehicle locators" },
    { path: "src/locators/case/case.locators.ts", purpose: "Case locators" },
    { path: "src/helpers/auth/auth.helper.ts", purpose: "Auth helper (login)" },
    { path: "src/helpers/common/vin.helper.ts", purpose: "VIN generator" },
    { path: "src/fixtures/auth.fixture.ts", purpose: "Playwright auth fixture" },
    { path: "src/components/ng-select.component.ts", purpose: "NgSelect component object" },
    { path: "src/pages/base.page.ts", purpose: "Base Page Object" },
    { path: "src/pages/auth/login.page.ts", purpose: "Login Page Object" },
    { path: "src/pages/dashboard/dashboard.page.ts", purpose: "Dashboard Page Object" },
    { path: "src/pages/vehicle/create-vehicle.page.ts", purpose: "Create Vehicle Page Object" },
    { path: "src/pages/case/create-case.page.ts", purpose: "Create Case Page Object" },
    { path: "tests/auth/auth.setup.ts", purpose: "Auth storageState setup" },
    { path: "CLAUDE.md", purpose: "Framework documentation for AI agents" },
    { path: "playwright.config.carpal.ts", purpose: "CarPal-specific Playwright config" },
  ];
  return expected.filter(item => !fs.existsSync(item.path));
}

// ─── import quality check ──────────────────────────────────────────────────────

type ImportIssue = { file: string; line: number; snippet: string };

function detectInlineHelpers(files: string[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const helperPatterns = [
    /async function login\(page/,
    /async function selectNgOption\(page/,
    /async function getRandomValidVin\(page/,
  ];

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");
    lines.forEach((line, i) => {
      for (const pattern of helperPatterns) {
        if (pattern.test(line)) {
          issues.push({ file, line: i + 1, snippet: line.trim() });
        }
      }
    });
  }
  return issues;
}

// ─── report builder ────────────────────────────────────────────────────────────

function buildReport(
  srcFiles: string[],
  testFiles: string[],
  duplicates: DuplicateMap,
  brittleLocators: LocatorIssue[],
  missingComponents: MissingItem[],
  inlineHelpers: ImportIssue[]
): string {
  const ts = new Date().toISOString();
  const lines: string[] = [
    `# Framework Architect Report`,
    `Generated: ${ts}`,
    "",
    `## Summary`,
    `| Metric | Count |`,
    `|---|---|`,
    `| Source files | ${srcFiles.length} |`,
    `| Test files | ${testFiles.length} |`,
    `| Duplicated functions | ${duplicates.size} |`,
    `| Brittle locators | ${brittleLocators.length} |`,
    `| Missing components | ${missingComponents.length} |`,
    `| Inline helpers (should be imported) | ${inlineHelpers.length} |`,
    "",
  ];

  lines.push("## Source File Inventory");
  srcFiles.forEach(f => lines.push(`- ${f}`));
  lines.push("");

  lines.push("## Test File Inventory");
  testFiles.forEach(f => lines.push(`- ${f}`));
  lines.push("");

  lines.push("## Duplicated Functions");
  if (duplicates.size === 0) {
    lines.push("None detected.");
  } else {
    for (const [name, locs] of duplicates) {
      lines.push(`### \`${name}\``);
      locs.forEach(l => lines.push(`- ${l}`));
      lines.push(`> **Recommendation:** Extract to \`src/helpers/\` and import.`);
    }
  }
  lines.push("");

  lines.push("## Brittle Locators");
  if (brittleLocators.length === 0) {
    lines.push("None detected.");
  } else {
    for (const item of brittleLocators) {
      lines.push(`### ${item.file}:${item.line} — ${item.issue}`);
      lines.push("```");
      lines.push(item.snippet);
      lines.push("```");
    }
  }
  lines.push("");

  lines.push("## Inline Helpers (Duplication Risk)");
  if (inlineHelpers.length === 0) {
    lines.push("None detected.");
  } else {
    for (const item of inlineHelpers) {
      lines.push(`- **${item.file}:${item.line}** — \`${item.snippet}\``);
    }
    lines.push(`> **Recommendation:** Import from \`src/helpers/\` instead.`);
  }
  lines.push("");

  lines.push("## Missing Architecture Components");
  if (missingComponents.length === 0) {
    lines.push("All expected components are present.");
  } else {
    lines.push("| Path | Purpose |");
    lines.push("|---|---|");
    for (const item of missingComponents) {
      lines.push(`| \`${item.path}\` | ${item.purpose} |`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

// ─── AI enhancement ────────────────────────────────────────────────────────────

async function getAiRecommendations(report: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return "\n## AI Recommendations\n\n_Skipped: ANTHROPIC_API_KEY not set in .env_\n";
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a Principal SDET reviewing a Playwright automation framework analysis.

Based on this framework report, provide:
1. Top 5 highest-priority refactoring actions (be specific: file names, function names)
2. Locator improvement suggestions for the brittle locators found
3. Missing test scenarios that should be added given the existing coverage
4. Any architectural risks or technical debt that should be addressed

Report:
${report}`
      }
    ]
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  return `\n## AI Recommendations\n\n${text}\n`;
}

// ─── main ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const useAi = args.includes("--ai");
const outputArg = args.find(a => a.startsWith("--output="))?.slice(9) ||
  (args.indexOf("--output") !== -1 ? args[args.indexOf("--output") + 1] : "");

const srcFiles = scanDir("src");
const testFiles = scanDir("tests");
const allFiles = [...srcFiles, ...testFiles];

const duplicates = detectDuplicateFunctions(allFiles);
const brittleLocators = detectBrittleLocators(allFiles);
const missingComponents = detectMissingComponents();
const inlineHelpers = detectInlineHelpers(testFiles);

let report = buildReport(srcFiles, testFiles, duplicates, brittleLocators, missingComponents, inlineHelpers);

if (useAi) {
  console.log("Calling Claude API for AI recommendations...");
  const aiSection = await getAiRecommendations(report);
  report += aiSection;
}

const outputPath = outputArg || path.join("reports", "framework-analysis.md");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, report, "utf-8");

console.log(report);
console.log(`\nReport saved to: ${outputPath}`);
