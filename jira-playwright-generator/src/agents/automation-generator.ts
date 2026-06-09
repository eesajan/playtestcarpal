#!/usr/bin/env tsx
/**
 * Automation Generation Agent
 *
 * Reads the current framework (pages, helpers, fixtures, components) and generates
 * a production-grade Playwright spec from a user story, Jira description, or
 * plain-English acceptance criteria.
 *
 * Usage:
 *   tsx src/agents/automation-generator.ts --story "User can login with valid credentials" --name login-validation
 *   tsx src/agents/automation-generator.ts --file story.txt --name my-test
 *   tsx src/agents/automation-generator.ts --jira QA-123          # requires JIRA_* env vars
 */

import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
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

function readSampleTests(max = 3): string {
  const dir = "generated-tests";
  if (!fs.existsSync(dir)) return "";
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".spec.ts") && !f.includes("record-more-flow"))
    .slice(0, max);
  return files
    .map(f => `// ── generated-tests/${f} ──\n${fs.readFileSync(path.join(dir, f), "utf-8")}`)
    .join("\n\n");
}

// ─── Jira description fetcher ──────────────────────────────────────────────────

async function fetchJiraDescription(key: string): Promise<string> {
  const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error("Missing JIRA_BASE_URL, JIRA_EMAIL, or JIRA_API_TOKEN in .env");
  }

  const response = await axios.get(`${JIRA_BASE_URL}/rest/api/3/issue/${key}`, {
    auth: { username: JIRA_EMAIL, password: JIRA_API_TOKEN },
    headers: { Accept: "application/json" }
  });

  const issue = response.data;
  const summary: string = issue.fields?.summary ?? key;
  const description: unknown = issue.fields?.description;

  // Walk ADF nodes to plain text
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY in .env");

  const client = new Anthropic({ apiKey });
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
1. Import \`login\` from \`"../src/helpers/carpal.helpers"\` — never define it inline.
2. Import \`generateVin\` from \`"../src/helpers/vin.helper"\` when a VIN is needed — no external calls.
3. Import the auth fixture from \`"../src/fixtures/auth.fixture"\` when login is the starting state.
4. Use Page Objects from \`"../src/pages/"\` for recognised pages.
5. Use \`NgSelectComponent\` from \`"../src/components/ng-select.component"\` for Angular dropdowns.
6. Every test MUST include meaningful assertions (not just actions).
7. Use \`test.step()\` to group logical phases (login, fill form, assert result).
8. Externalise test data into a typed \`const data = { ... }\` block at the top.
9. Never hardcode credentials — use \`process.env.CARPAL_USERNAME\` etc.
10. Prefer \`getByRole\`, \`getByLabel\`, \`getByTestId\` over CSS or XPath.
11. Follow ESM import style — no \`.js\` extension on relative imports with tsx.
12. File must be valid TypeScript that compiles under the project's tsconfig.

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

let requirement = storyArg ?? "";
if (fileArg) requirement = fs.readFileSync(fileArg, "utf-8");
if (jiraArg) {
  console.log(`Fetching Jira issue ${jiraArg}...`);
  requirement = await fetchJiraDescription(jiraArg);
}

if (!requirement.trim()) {
  console.error(
    "Usage:\n" +
    "  tsx src/agents/automation-generator.ts --story \"<text>\" --name <slug>\n" +
    "  tsx src/agents/automation-generator.ts --file <story.txt> --name <slug>\n" +
    "  tsx src/agents/automation-generator.ts --jira <KEY> --name <slug>"
  );
  process.exit(1);
}

console.log("Reading framework context...");
console.log("Calling Claude API...");

const spec = await generateSpec(requirement, nameArg);

const safeName = nameArg.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const outputDir = "generated-tests";
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, `${safeName}.spec.ts`);
fs.writeFileSync(outputPath, spec, "utf-8");

console.log(`\nGenerated: ${outputPath}`);
