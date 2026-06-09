#!/usr/bin/env tsx
/**
 * Automation Generation Agent
 *
 * Reads the current framework (pages, helpers, fixtures, locators, components) and
 * generates a production-grade Playwright spec from a user story, Jira description,
 * or plain-English acceptance criteria.
 *
 * Usage:
 *   tsx tools/agents/automation-generator.ts --story "User can login" --name login-test
 *   tsx tools/agents/automation-generator.ts --file story.txt --name my-test
 *   tsx tools/agents/automation-generator.ts --jira QA-123
 */

import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import fs from "fs";
import path from "path";
import { ANTHROPIC_API_KEY, JIRA_CREDENTIALS } from "../../src/config/credentials";

// ─── framework context reader ──────────────────────────────────────────────────

const FRAMEWORK_PATHS = [
  "src/config/credentials.ts",
  "src/config/urls.ts",
  "src/config/test-data.ts",
  "src/locators/auth/login.locators.ts",
  "src/locators/dashboard/dashboard.locators.ts",
  "src/locators/vehicle/vehicle.locators.ts",
  "src/locators/case/case.locators.ts",
  "src/helpers/auth/auth.helper.ts",
  "src/helpers/vehicle/vehicle.helper.ts",
  "src/helpers/case/case.helper.ts",
  "src/helpers/common/vin.helper.ts",
  "src/fixtures/auth.fixture.ts",
  "src/components/ng-select.component.ts",
  "src/pages/base.page.ts",
  "src/pages/auth/login.page.ts",
  "src/pages/dashboard/dashboard.page.ts",
  "src/pages/vehicle/create-vehicle.page.ts",
  "src/pages/case/create-case.page.ts",
];

function readFrameworkContext(): string {
  return FRAMEWORK_PATHS
    .filter(p => fs.existsSync(p))
    .map(p => `// ── ${p} ──\n${fs.readFileSync(p, "utf-8")}`)
    .join("\n\n");
}

function readSampleTests(max = 3): string {
  const dir = "tests";
  if (!fs.existsSync(dir)) return "";
  const files: string[] = [];
  function collect(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (entry.isFile() && entry.name.endsWith(".spec.ts")) files.push(full);
    }
  }
  collect(dir);
  return files.slice(0, max)
    .map(f => `// ── ${f} ──\n${fs.readFileSync(f, "utf-8")}`)
    .join("\n\n");
}

// ─── Jira description fetcher ──────────────────────────────────────────────────

async function fetchJiraDescription(key: string): Promise<string> {
  const { baseUrl, email, apiToken } = JIRA_CREDENTIALS;
  if (!baseUrl || !email || !apiToken) {
    throw new Error("Missing JIRA_BASE_URL, JIRA_EMAIL, or JIRA_API_TOKEN in .env");
  }

  const response = await axios.get(`${baseUrl}/rest/api/3/issue/${key}`, {
    auth: { username: email, password: apiToken },
    headers: { Accept: "application/json" }
  });

  const issue = response.data;
  const summary: string = issue.fields?.summary ?? key;
  const description: unknown = issue.fields?.description;

  function adfToText(node: unknown): string {
    if (!node) return "";
    if (typeof node === "string") return node;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    const parts: string[] = [];
    if (n.text) parts.push(n.text);
    if (Array.isArray(n.content)) {
      for (const child of n.content) parts.push(adfToText(child));
    }
    if (["paragraph", "heading", "listItem"].includes(n.type ?? "")) parts.push("\n");
    return parts.join("");
  }

  return `${key}: ${summary}\n\n${adfToText(description)}`;
}

// ─── spec generator ────────────────────────────────────────────────────────────

async function generateSpec(requirement: string, testName: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY in .env");

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const frameworkContext = readFrameworkContext();
  const sampleTests = readSampleTests();

  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a Principal SDET generating a production-grade Playwright TypeScript test.

## Framework (import from these — do NOT duplicate inline)
${frameworkContext}

## Existing Test Examples (match this style)
${sampleTests}

## Requirement
${requirement}

## Generation Rules
1. Import \`login\` from \`"../../src/helpers/auth/auth.helper"\` — never define it inline.
2. Import \`generateVin\` from \`"../../src/helpers/common/vin.helper"\` when a VIN is needed.
3. Import the auth fixture from \`"../../src/fixtures/auth.fixture"\` for pre-authenticated tests.
4. Use Page Objects from \`"../../src/pages/{feature}/"\` for recognised pages.
5. Use locators from \`"../../src/locators/{feature}/{feature}.locators"\` for direct locator access.
6. Use \`NgSelectComponent\` from \`"../../src/components/ng-select.component"\` for Angular dropdowns.
7. Import constants from \`"../../src/config/test-data"\` for shared test data.
8. Every test MUST include at least 3 meaningful assertions.
9. Use \`test.step()\` to group logical phases (login, fill form, assert result).
10. Externalise test-specific data into a typed \`const data = { ... }\` block at the top.
11. Never hardcode credentials — use \`src/config/credentials\`.
12. Prefer \`getByRole\`, \`getByLabel\`, \`getByTestId\` over CSS or XPath.
13. Follow ESM import style — no \`.js\` extension on relative imports with tsx.
14. Place the generated file in \`tests/{feature}/{name}.spec.ts\`.

Output ONLY the TypeScript spec file content. No explanation. No markdown fences.`
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

const storyArg = argValue("--story");
const fileArg = argValue("--file");
const jiraArg = argValue("--jira");
const nameArg = argValue("--name") ?? "generated-test";
const featureArg = argValue("--feature") ?? "misc";

let requirement = storyArg ?? "";
if (fileArg) requirement = fs.readFileSync(fileArg, "utf-8");
if (jiraArg) {
  console.log(`Fetching Jira issue ${jiraArg}...`);
  requirement = await fetchJiraDescription(jiraArg);
}

if (!requirement.trim()) {
  console.error(
    "Usage:\n" +
    "  tsx tools/agents/automation-generator.ts --story \"<text>\" --name <slug> --feature <feature>\n" +
    "  tsx tools/agents/automation-generator.ts --file <story.txt> --name <slug> --feature <feature>\n" +
    "  tsx tools/agents/automation-generator.ts --jira <KEY> --name <slug> --feature <feature>"
  );
  process.exit(1);
}

console.log("Reading framework context...");
console.log("Calling Claude API...");

const spec = await generateSpec(requirement, nameArg);

const safeName = nameArg.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const safeFeature = featureArg.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const outputDir = path.join("tests", safeFeature);
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, `${safeName}.spec.ts`);
fs.writeFileSync(outputPath, spec, "utf-8");

console.log(`\nGenerated: ${outputPath}`);
