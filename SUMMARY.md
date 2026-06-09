# CarPal Playwright Framework — Chat Context Summary

Use this file to onboard a new chat session. Paste it at the start of the conversation.

---

## What This Project Is

TypeScript Playwright automation framework for **CarPal QA** (`https://qa.carpal.com`) — an Angular roadside assistance platform.

**Workspace root:** `c:\Projects\CarPal\playtestcarpal`  
**Branch:** `agent-setup`  
**Runtime:** `tsx` (no build step), ESM modules (`"type": "module"`)

---

## Directory Structure

```
playtestcarpal/
├── .claude/commands/
│   ├── agents/          ← /agents:generate-test  /agents:enhance-recording
│   │                       /agents:code-review    /agents:architect
│   └── skills/          ← /skills:architecture  /skills:locator-strategy
│                            /skills:naming-conventions
├── docs/                ← ARCHITECTURE.md  CONTEXT.md  FILE_NAMING.md
│                            LOCATOR_STRATEGY.md  PROJECT_OVERVIEW.md
├── src/
│   ├── config/
│   │   ├── credentials.ts       ← CARPAL_CREDENTIALS, JIRA_CREDENTIALS, ANTHROPIC_API_KEY
│   │   ├── urls.ts              ← BASE_URL, ENDPOINTS
│   │   └── test-data.ts         ← DEFAULT_VEHICLE_DATA, GEOLOCATION, DEFAULT_CASE_DATA
│   ├── locators/
│   │   ├── auth/login.locators.ts
│   │   ├── dashboard/dashboard.locators.ts
│   │   ├── vehicle/vehicle.locators.ts
│   │   └── case/case.locators.ts
│   ├── helpers/
│   │   ├── auth/auth.helper.ts          ← login()
│   │   ├── vehicle/vehicle.helper.ts    ← fillVehicleForm(), submitVehicle()
│   │   ├── case/case.helper.ts          ← clickCaseTab(), fillCustomerPhone(), etc.
│   │   └── common/vin.helper.ts         ← generateVin(), generateVins(), isValidVin()
│   ├── pages/
│   │   ├── base.page.ts
│   │   ├── auth/login.page.ts
│   │   ├── dashboard/dashboard.page.ts
│   │   ├── vehicle/create-vehicle.page.ts
│   │   └── case/create-case.page.ts
│   ├── components/ng-select.component.ts    ← NgSelectComponent (Angular dropdown wrapper)
│   └── fixtures/auth.fixture.ts             ← authenticatedPage fixture
├── tests/
│   ├── auth/auth.setup.ts + login.spec.ts
│   ├── vehicle/create-vehicle.spec.ts
│   └── case/                               ← (add case specs here)
├── tools/                                  ← CLI scripts, NOT part of test framework
│   ├── agents/framework-architect.ts
│   ├── agents/automation-generator.ts
│   ├── agents/recorder-enhancer.ts
│   ├── jira/, generator/, parser/, utils/
│   └── index.ts
├── scripts/open-recorder.mjs  open-carpal-browser.mjs
├── playwright.config.ts              ← testDir: ./tests
├── playwright.config.carpal.ts       ← CarPal suite with auth caching
├── package.json
├── tsconfig.json
├── .env.example
└── CLAUDE.md                         ← authoritative AI agent reference
```

---

## Layer Responsibilities

| Layer | Location | Rule |
|---|---|---|
| Config | `src/config/` | Typed env wrappers only. No Playwright. |
| Locators | `src/locators/{feature}/{feature}.locators.ts` | Factory `fn(page)` returning Locator objects. No logic. |
| Helpers | `src/helpers/{feature}/{feature}.helper.ts` | Async named exports. Import from locators + config. |
| Pages | `src/pages/{feature}/{name}.page.ts` | Extend BasePage. Import from locators. No inline selectors. |
| Components | `src/components/` | `NgSelectComponent` — Angular ng-select wrapper. |
| Fixtures | `src/fixtures/` | Playwright `test.extend()`. Auth state. |
| Tests | `tests/{feature}/*.spec.ts` | Import everything. Define nothing inline. |
| Tools | `tools/` | CLI scripts. May import from `src/config/` only. |

---

## Key Patterns

### Import paths from `tests/{feature}/`
```typescript
import { login }              from "../../src/helpers/auth/auth.helper"
import { generateVin }        from "../../src/helpers/common/vin.helper"
import { test, expect }       from "../../src/fixtures/auth.fixture"
import { CreateVehiclePage }  from "../../src/pages/vehicle/create-vehicle.page"
import { vehicleLocators }    from "../../src/locators/vehicle/vehicle.locators"
import { DEFAULT_VEHICLE_DATA } from "../../src/config/test-data"
import { NgSelectComponent }  from "../../src/components/ng-select.component"
```

### Locator file pattern
```typescript
// src/locators/{feature}/{feature}.locators.ts
import type { Page } from "@playwright/test"
export const vehicleLocators = (page: Page) => ({
  vinInput: page.getByRole("textbox", { name: "VIN *" }),
  brandSelect: page.locator('ng-select[name="brand"]').nth(0),
})
```

### Helper file pattern
```typescript
// src/helpers/{feature}/{feature}.helper.ts
import { CARPAL_CREDENTIALS } from "../../config/credentials"
import { vehicleLocators }    from "../../locators/vehicle/vehicle.locators"
export async function fillVehicleForm(page: Page, data: VehicleFormData) { ... }
```

### Test spec pattern
```typescript
import { test, expect } from "@playwright/test"
import { login }         from "../../src/helpers/auth/auth.helper"
import { generateVin }   from "../../src/helpers/common/vin.helper"

const data = { ...DEFAULT_VEHICLE_DATA, vin: generateVin() } as const

test("CarPal QA: create vehicle", async ({ page }) => {
  await test.step("Log in",            async () => { await login(page) })
  await test.step("Navigate",          async () => { ... })
  await test.step("Fill and submit",   async () => { ... })
  await test.step("Assert result",     async () => { ... })
})
```

---

## Angular ng-select

All dropdowns use `NgSelectComponent`. Never interact with them raw.

```typescript
const select = new NgSelectComponent(page, vehicleLocators(page).brandSelect)
await select.pick("Acura")                        // required — throws if not found
await select.pick("Pakistan", "pak")              // search "pak", click "Pakistan"
await select.pickOptional("islamabad")             // graceful — won't throw
```

**CarPal quirk:** `ng-select[name="brand"]` = vehicle make `.nth(0)` AND model `.nth(1)`.

---

## npm Scripts

```bash
npm run test:carpal             # CarPal suite with auth caching (use this most)
npm run test:carpal:headed      # Same but headed (watch the browser)
npm run test:e2e                # Headless, all tests/
npm run recorder                # Open Playwright Inspector for recording
npm run agent:architect         # Scan repo for issues
npm run agent:architect:ai      # Scan + Claude AI recommendations
npm run agent:generate -- --story "..." --feature vehicle  # AI test generation
npm run agent:enhance -- --input recording.spec.ts --feature vehicle
npm run report                  # Open HTML report
```

---

## Four Claude Agents (slash commands)

| Command | Purpose |
|---|---|
| `/agents:generate-test` | Jira ticket or plain-text steps → full spec with locators, helpers, test file |
| `/agents:enhance-recording` | Raw Playwright recording → production-grade code (deduplicates existing locators/helpers) |
| `/agents:code-review` | Scan for anti-patterns (inline helpers, brittle locators, missing assertions) |
| `/agents:architect` | Framework health audit — no modifications |

Three reference skills:
- `/skills:architecture` — layer responsibilities
- `/skills:locator-strategy` — locator priority order and examples
- `/skills:naming-conventions` — file/function/variable naming rules

---

## Anti-Patterns (Never)

| Never | Always instead |
|---|---|
| `login()` inline in spec | `import { login } from "../../src/helpers/auth/auth.helper"` |
| `selectNgOption()` inline | `new NgSelectComponent(page, locator).pick(option)` |
| `randomvin.com` or any external VIN | `generateVin()` from `src/helpers/common/vin.helper` |
| Hardcoded credentials | `CARPAL_CREDENTIALS` from `src/config/credentials` |
| CSS chains > 60 chars | `getByRole`, `getByLabel`, `locator('[name=...]')` |
| Locators defined in spec/helper files | Move to `src/locators/{feature}/{feature}.locators.ts` |
| Helpers defined in spec files | Move to `src/helpers/{feature}/{feature}.helper.ts` |
| `page.pause()` committed | Remove — recording artifact |
| Tests with < 3 assertions | Add URL, heading, and success state checks |

---

## Environment Variables (.env)

```
CARPAL_BASE_URL=https://qa.carpal.com
CARPAL_USERNAME=<csa-username>
CARPAL_PASSWORD=<csa-password>
ANTHROPIC_API_KEY=<key>           # required for AI agents
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your@email.com
JIRA_API_TOKEN=<token>
JIRA_JQL=project = QA AND issuetype = "Test Case" AND status != Done
```

---

## What Still Lives in `jira-playwright-generator/`

The old subfolder still exists and has not been deleted. It contains the original unmodified framework. The new restructured framework is at the workspace root. The old folder can be deleted once the new structure is verified working.
