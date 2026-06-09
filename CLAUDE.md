# CarPal Playwright Automation Framework

**Authoritative reference for AI agents.** Read this completely before generating any code.

---

## Project Purpose

TypeScript Playwright automation framework for CarPal QA (`https://qa.carpal.com`). Angular-based roadside assistance platform.

---

## Technology Stack

| Concern | Choice |
|---|---|
| Language | TypeScript ESNext — ESM (`"type": "module"`) |
| Test runner | `@playwright/test` |
| Runtime | `tsx` — no build step |
| HTTP | `axios` (Jira API), `@anthropic-ai/sdk` (AI agents) |
| Config | `dotenv` |

---

## Directory Structure

```
playtestcarpal/
├── .claude/commands/
│   ├── agents/          # Claude slash commands: /agents:generate-test, etc.
│   └── skills/          # Reference skills: /skills:architecture, etc.
├── docs/                # ARCHITECTURE.md, CONTEXT.md, FILE_NAMING.md, LOCATOR_STRATEGY.md
├── src/
│   ├── config/
│   │   ├── credentials.ts     # CARPAL_CREDENTIALS, JIRA_CREDENTIALS, ANTHROPIC_API_KEY
│   │   ├── urls.ts            # BASE_URL, ENDPOINTS
│   │   └── test-data.ts       # DEFAULT_VEHICLE_DATA, GEOLOCATION, DEFAULT_CASE_DATA
│   ├── locators/
│   │   ├── auth/login.locators.ts
│   │   ├── dashboard/dashboard.locators.ts
│   │   ├── vehicle/vehicle.locators.ts
│   │   └── case/case.locators.ts
│   ├── helpers/
│   │   ├── auth/auth.helper.ts          # login()
│   │   ├── vehicle/vehicle.helper.ts    # fillVehicleForm(), fillVin(), submitVehicle()
│   │   ├── case/case.helper.ts          # clickCaseTab(), fillCustomerPhone(), etc.
│   │   └── common/vin.helper.ts         # generateVin(), generateVins(), isValidVin()
│   ├── pages/
│   │   ├── base.page.ts
│   │   ├── auth/login.page.ts
│   │   ├── dashboard/dashboard.page.ts
│   │   ├── vehicle/create-vehicle.page.ts
│   │   └── case/create-case.page.ts
│   ├── components/
│   │   └── ng-select.component.ts       # NgSelectComponent (Angular dropdown wrapper)
│   └── fixtures/
│       └── auth.fixture.ts              # authenticatedPage fixture
├── tests/
│   ├── auth/
│   │   ├── auth.setup.ts                # saves storageState
│   │   └── login.spec.ts
│   ├── vehicle/
│   │   └── create-vehicle.spec.ts
│   └── case/
│       └── (case specs)
├── tools/                               # CLI scripts — NOT part of test framework
│   ├── agents/                          # TypeScript agent implementations
│   ├── jira/, generator/, parser/       # Jira NLP generator
│   └── utils/
├── scripts/
│   ├── open-carpal-browser.mjs
│   └── open-recorder.mjs
├── playwright.config.ts
├── playwright.config.carpal.ts
└── .env.example
```

---

## Environment Variables

All secrets in `.env` only. Never hardcode.

| Variable | Purpose | Config location |
|---|---|---|
| `CARPAL_BASE_URL` | CarPal QA base URL | `src/config/urls.ts` |
| `CARPAL_USERNAME` | Login username | `src/config/credentials.ts` |
| `CARPAL_PASSWORD` | Login password | `src/config/credentials.ts` |
| `ANTHROPIC_API_KEY` | AI agents | `src/config/credentials.ts` |
| `JIRA_BASE_URL` | Jira Cloud base URL | `src/config/credentials.ts` |
| `JIRA_EMAIL` | Jira email | `src/config/credentials.ts` |
| `JIRA_API_TOKEN` | Jira API token | `src/config/credentials.ts` |
| `JIRA_JQL` | JQL for test case fetch | `src/config/credentials.ts` |

---

## Login Flow

**Standard import pattern:**
```typescript
import { login } from "../../src/helpers/auth/auth.helper"
await login(page)
// → navigates to /login, fills credentials from CARPAL_CREDENTIALS, asserts /bu/dashboard
```

**Pre-authenticated fixture:**
```typescript
import { test, expect } from "../../src/fixtures/auth.fixture"
test("my test", async ({ authenticatedPage: page }) => {
  // page is already on /bu/dashboard
})
```

**NEVER** define `login()` inline. Always import.

---

## Locator Strategy

Priority order (see `docs/LOCATOR_STRATEGY.md` for full details):

1. `getByTestId("value")`
2. `getByRole("button", { name: /text/i })`
3. `getByLabel(/label text/i)`
4. `getByPlaceholder(/placeholder/i)`
5. `locator('[name="fieldName"]')` — Angular form fields
6. `locator('ng-select[name="fieldName"]')` — Angular ng-select

**Forbidden:** CSS chains > 60 chars, absolute XPath, `.nth()` without semantic parent.

All locators defined in `src/locators/{feature}/{feature}.locators.ts` as factory functions.

---

## Angular ng-select

**Always use `NgSelectComponent`:**
```typescript
import { NgSelectComponent } from "../../src/components/ng-select.component"

const brandSelect = new NgSelectComponent(page, vehicleLocators(page).brandSelect)
await brandSelect.pick("Acura")              // required — throws if not found
await brandSelect.pickOptional("islamabad")  // graceful fallback
```

**CarPal quirk:** `ng-select[name="brand"]` is used for BOTH make (.nth(0)) and model (.nth(1)).

---

## VIN Generation

```typescript
import { generateVin } from "../../src/helpers/common/vin.helper"
const vin = generateVin()       // algorithm-valid, no external service
const vin = generateVin(42)     // deterministic with seed
```

Never call `randomvin.com` or any external VIN service.

---

## Test File Pattern

```typescript
import { expect, test } from "@playwright/test"
// OR for pre-authenticated tests:
import { test, expect } from "../../src/fixtures/auth.fixture"

import { login } from "../../src/helpers/auth/auth.helper"
import { generateVin } from "../../src/helpers/common/vin.helper"
import { DEFAULT_VEHICLE_DATA } from "../../src/config/test-data"

// ── test data ─────────────────────────────────────────────────────────────────
const data = {
  ...DEFAULT_VEHICLE_DATA,
  vin: generateVin(),    // dynamic per run
} as const

// ── optional: geolocation ──────────────────────────────────────────────────────
test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 33.6844, longitude: 73.0479 }
})

// ── test ──────────────────────────────────────────────────────────────────────
test("CarPal QA: <description>", async ({ page }) => {
  await test.step("Log in", async () => { ... })
  await test.step("Navigate", async () => { ... })
  await test.step("Fill and submit", async () => { ... })
  await test.step("Assert result", async () => { ... })
})
```

---

## npm Scripts

| Script | Purpose |
|---|---|
| `npm run test:carpal` | Run CarPal suite with auth caching |
| `npm run test:carpal:headed` | Same but headed |
| `npm run test:e2e` | Run tests directory headless |
| `npm run report` | Open HTML report |
| `npm run recorder` | Open Playwright Inspector for recording |
| `npm run agent:architect` | Framework audit |
| `npm run agent:architect:ai` | Audit + Claude recommendations |
| `npm run agent:generate -- --story "..." --feature vehicle` | Generate test from story |
| `npm run agent:generate -- --jira QA-123 --feature vehicle` | Generate from Jira |
| `npm run agent:enhance -- --input recording.spec.ts --feature vehicle` | Enhance recording |

---

## Four Claude Agents

| Agent | Invoked via | Purpose |
|---|---|---|
| `/agents:architect` | `/agents:architect` | Audit framework — no modifications |
| `/agents:generate-test` | `/agents:generate-test QA-123` | Story/Jira → spec with runtime locators |
| `/agents:enhance-recording` | `/agents:enhance-recording path/to/file.spec.ts` | Recording → production code |
| `/agents:code-review` | `/agents:code-review` | Detect anti-patterns, offer fixes |

---

## Anti-Patterns (Never Do These)

| Anti-Pattern | Correct Approach |
|---|---|
| Define `login()` inline | `import { login } from "../../src/helpers/auth/auth.helper"` |
| Define `selectNgOption()` inline | `new NgSelectComponent(page, locator).pick(option)` |
| Call `randomvin.com` | `import { generateVin } from "../../src/helpers/common/vin.helper"` |
| Hardcode credentials | `CARPAL_CREDENTIALS` from `src/config/credentials` |
| Long CSS chains > 60 chars | `getByRole`, `getByLabel`, `locator('[name=...]')` |
| Tests without assertions | Add ≥ 3 meaningful `expect()` calls |
| `await page.pause()` committed | Remove — recording artifact only |
| Locators defined in spec files | Move to `src/locators/{feature}/{feature}.locators.ts` |
| Helpers defined in spec files | Move to `src/helpers/{feature}/{feature}.helper.ts` |
