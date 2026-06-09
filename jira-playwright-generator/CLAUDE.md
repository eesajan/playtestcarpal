# CarPal Playwright Automation Framework

This document is the authoritative reference for AI agents working in this repository.
Read it completely before generating any code.

---

## Project Purpose

This repository has two distinct layers:

| Layer | What it does |
|---|---|
| **Generator** (`src/`) | Fetches Jira test cases → parses NLP → emits `.spec.ts` files |
| **Test Suite** (`generated-tests/`) | Hand-crafted + generated Playwright specs for CarPal QA |

---

## Technology Stack

| Concern | Choice |
|---|---|
| Language | TypeScript ESNext — ESM (`"type": "module"`) |
| Test runner | `@playwright/test` |
| Runtime | `tsx` — no build step, direct `.ts` execution |
| HTTP | `axios` (Jira API), `@anthropic-ai/sdk` (AI agents) |
| Config | `dotenv` — values from `.env` |

---

## Folder Structure

```
jira-playwright-generator/
├── src/
│   ├── agents/
│   │   ├── framework-architect.ts   # Scans repo, detects duplication, calls Claude API
│   │   ├── automation-generator.ts  # Requirement → spec via Claude API
│   │   └── recorder-enhancer.ts     # Raw recording → production code via Claude API
│   ├── components/
│   │   └── ng-select.component.ts   # Reusable Angular ng-select wrapper
│   ├── fixtures/
│   │   ├── auth.fixture.ts          # Playwright test.extend() with pre-authenticated page
│   │   └── auth.setup.ts            # Saves storageState for playwright.config.carpal.ts
│   ├── generator/
│   │   └── generateSpec.ts          # NLP action → .spec.ts string emitter
│   ├── helpers/
│   │   ├── carpal.helpers.ts        # login(), selectNgOption(), searchOptionalNgOption()
│   │   └── vin.helper.ts            # generateVin() — local algorithm, no external service
│   ├── jira/
│   │   ├── jiraClient.ts            # axios instance with Basic Auth
│   │   └── fetchTestCases.ts        # Jira REST API v3 search
│   ├── pages/
│   │   ├── base.page.ts             # Abstract BasePage
│   │   ├── login.page.ts            # LoginPage POM
│   │   ├── dashboard.page.ts        # DashboardPage POM
│   │   ├── create-vehicle.page.ts   # CreateVehiclePage POM
│   │   └── create-case.page.ts      # CreateCasePage POM
│   ├── parser/
│   │   ├── normalizeActions.ts      # NLP regex → AutomationAction[]
│   │   ├── parseDescription.ts      # Section extractor (Pre-req/Steps/Expected)
│   │   └── types.ts                 # ParsedTestCase, AutomationAction, NormalizedTestCase
│   ├── utils/
│   │   ├── adfToText.ts             # Atlassian Document Format walker
│   │   └── safeFileName.ts          # Slug-safe filenames
│   ├── index.ts                     # Jira mode entry: fetch → parse → normalize → generate
│   ├── sample-app-server.ts         # Minimal HTTP SPA for sample test
│   └── sample-run.ts                # Local sample mode (no Jira)
├── generated-tests/                 # All .spec.ts files (do not add subdirectories)
├── scripts/
│   └── open-carpal-browser.mjs      # Opens persistent browser profile at CarPal login
├── .playwright-carpal-profile/      # Chromium persistent profile data (gitignore)
├── playwright.config.ts             # Default config (testDir: generated-tests, sample app)
├── playwright.config.carpal.ts      # CarPal config with auth projects
├── CLAUDE.md                        # This file
└── CODEX_REQUIREMENTS.txt           # Original setup instructions
```

---

## Target Application

**CarPal QA** — `https://qa.carpal.com`

An Angular-based roadside assistance platform. Key characteristics:
- Uses `ng-select` (Angular Select) components for all dropdowns
- Login: `input[name="userName"]` + `input[name="password"]` + `button[type="submit"]`
- Post-login URL pattern: `/bu/dashboard`
- Geolocation required for pickup/drop location features
- Form tabs on case detail pages: Vehicle and Owner Information, Customer Details, Pickup Location, Reported Issue

---

## Environment Variables

All secrets live in `.env` only. Never hardcode.

| Variable | Purpose |
|---|---|
| `CARPAL_BASE_URL` | CarPal QA base URL (default: `https://qa.carpal.com`) |
| `CARPAL_USERNAME` | Login username |
| `CARPAL_PASSWORD` | Login password |
| `ANTHROPIC_API_KEY` | Required for AI agents (`automation-generator`, `recorder-enhancer`, `framework-architect --ai`) |
| `JIRA_BASE_URL` | Jira Cloud base URL |
| `JIRA_EMAIL` | Jira account email |
| `JIRA_API_TOKEN` | Jira API token |
| `JIRA_JQL` | JQL query for fetching test cases |
| `JIRA_FIELDS` | Comma-separated fields (default: `summary,description`) |
| `BASE_APP_URL` | Sample app URL (default: `http://127.0.0.1:3000`) |

---

## Login Flow

**Standard pattern** — used in all CarPal tests:

```typescript
import { login } from "../src/helpers/carpal.helpers";

// inside a test step:
await login(page);
// → navigates to /login, fills userName + password, clicks submit
// → asserts URL matches /\/bu\/dashboard/
```

**With auth fixture** — page is already logged in when test starts:

```typescript
import { test, expect } from "../src/fixtures/auth.fixture";

test("my test", async ({ authenticatedPage }) => {
  // authenticatedPage is already on /bu/dashboard
});
```

**NEVER** define `login()` inline in a test file. Always import.

---

## Locator Strategy

Priority order (always prefer higher up the list):

1. `getByTestId("data-testid-value")` — most stable
2. `getByRole("button", { name: /text/i })` — semantic, robust
3. `getByLabel(/label text/i)` — form fields
4. `getByPlaceholder(/placeholder/i)` — fallback for unlabelled inputs
5. `getByText("visible text")` — last resort for assertions only
6. `locator('[name="fieldName"]')` — Angular form fields with name attributes
7. `locator('ng-select[name="fieldName"]')` — Angular ng-select with name

**Avoid:**
- Long CSS chains: `.ng-select.ng-select-single.ng-select-searchable...` — fragile
- Absolute XPath — forbidden
- Index-based nth() without semantic parent — fragile

---

## Angular ng-select Pattern

**Always use `NgSelectComponent`:**

```typescript
import { NgSelectComponent } from "../src/components/ng-select.component";

const brandSelect = new NgSelectComponent(page, page.locator('ng-select[name="brand"]').nth(0));
await brandSelect.pick("Acura");           // searches, waits for option, clicks
await brandSelect.pickOptional("islamabad", "Islamabad"); // won't fail if not found
```

**Never** use the raw pattern inline:
```typescript
// ✗ DON'T do this:
await page.locator('ng-select[name="brand"]').nth(0).click();
await page.locator('ng-select[name="brand"]').nth(0).locator('input[type="text"]').fill("Acura");
```

---

## VIN Generation

**Always use the local generator:**

```typescript
import { generateVin } from "../src/helpers/vin.helper";
const vin = generateVin(); // unique, algorithm-valid, no external call
```

**Never** use `randomvin.com` or any external VIN service. It is an external dependency that breaks in offline/CI environments.

---

## Test File Conventions

```typescript
import { expect, test } from "@playwright/test";
// OR for authenticated tests:
import { expect, test } from "../src/fixtures/auth.fixture";

// ── test data ─────────────────────────────────────────────────────────────────
const data = {
  vin: generateVin(),
  client: "Test",
  // ...
} as const;

// ── optional: geolocation for location-based tests ───────────────────────────
test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 33.6844, longitude: 73.0479 } // Islamabad
});

// ── test ──────────────────────────────────────────────────────────────────────
test("CarPal QA: <description of flow>", async ({ page }) => {
  await test.step("Log in", async () => { ... });
  await test.step("Navigate to form", async () => { ... });
  await test.step("Fill and submit", async () => { ... });
  await test.step("Assert result", async () => { ... });
});
```

File naming: `<scope>-<flow>.spec.ts` e.g. `carpal-create-case-accident.spec.ts`

---

## npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `generate` | `tsx src/index.ts` | Fetch Jira + generate specs |
| `generate:sample` | `tsx src/sample-run.ts` | Generate from local sample |
| `test:e2e` | `playwright test generated-tests` | Headless (sample app) |
| `test:e2e:headed` | `playwright test generated-tests --headed` | Headed |
| `test:carpal` | `playwright test --config playwright.config.carpal.ts` | CarPal suite with auth |
| `agent:architect` | `tsx src/agents/framework-architect.ts` | Framework analysis |
| `agent:architect:ai` | `tsx src/agents/framework-architect.ts --ai` | With AI recommendations |
| `agent:generate` | `tsx src/agents/automation-generator.ts` | Requirement → spec |
| `agent:enhance` | `tsx src/agents/recorder-enhancer.ts` | Recording → production code |
| `sample-app` | `tsx src/sample-app-server.ts` | Start local sample app |
| `report` | `playwright show-report` | Open HTML report |

---

## Three AI Agents

### `/architect` — Framework Architect Agent
- Scans repo for duplication, brittle locators, missing components
- Runs: `tsx src/agents/framework-architect.ts --ai`
- Reports findings — does NOT modify code
- Use before any batch of test generation

### `/generate-test` — Automation Generation Agent
- Input: user story / Jira key / plain English
- Reads framework first, reuses all shared assets
- Generates spec via Claude API and writes to `generated-tests/`
- Runs: `tsx src/agents/automation-generator.ts --story "..." --name <slug>`

### `/enhance-recording` — Recorder Enhancement Agent
- Input: raw Playwright recording path
- Applies full enhancement checklist (shared imports, semantic locators, assertions, steps)
- Runs: `tsx src/agents/recorder-enhancer.ts --input <file>`

---

## Anti-Patterns (Never Do These)

| Anti-Pattern | Correct Approach |
|---|---|
| Define `login()` inline | `import { login } from "../src/helpers/carpal.helpers"` |
| Define `selectNgOption()` inline | `new NgSelectComponent(page, locator).pick(option)` |
| Call `randomvin.com` | `import { generateVin } from "../src/helpers/vin.helper"` |
| Hardcode credentials | `process.env.CARPAL_USERNAME` |
| Long CSS chains > 60 chars | `getByRole`, `getByLabel`, `ng-select[name="..."]` |
| Tests without assertions | Add ≥ 3 meaningful `expect()` calls |
| `await page.pause()` in committed tests | Remove — recording artifact only |
| Duplicate test data across files | Define a shared `data` const per file or a shared fixture |
