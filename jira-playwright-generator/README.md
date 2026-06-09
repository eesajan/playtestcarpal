# Jira → Playwright Generator + CarPal QA Automation Framework

This project does two things:

| Layer | What it does |
|---|---|
| **Generator** | Fetches Jira test cases (Pre-req / Steps / Expected Result) and emits `.spec.ts` files |
| **Test Suite** | Production-grade Playwright specs for the CarPal QA application |

---

## Quick Start

```bash
npm install
npx playwright install
cp .env.example .env   # then fill in your credentials
```

---

## Environment Variables

Edit `.env` after copying from `.env.example`:

| Variable | Purpose |
|---|---|
| `CARPAL_BASE_URL` | CarPal QA URL (default: `https://qa.carpal.com`) |
| `CARPAL_USERNAME` | Login username |
| `CARPAL_PASSWORD` | Login password |
| `ANTHROPIC_API_KEY` | Required for the three AI agents |
| `JIRA_BASE_URL` | Jira Cloud base URL |
| `JIRA_EMAIL` | Jira account email |
| `JIRA_API_TOKEN` | Jira API token |
| `JIRA_JQL` | JQL to fetch test cases |
| `JIRA_FIELDS` | Fields to fetch (default: `summary,description`) |
| `BASE_APP_URL` | Local sample app (default: `http://127.0.0.1:3000`) |

---

## npm Scripts

### Generator

```bash
npm run generate           # fetch Jira issues → generate specs in generated-tests/
npm run generate:sample    # generate from built-in sample (no Jira needed)
```

### Test Execution

```bash
npm run test:e2e           # run all specs headlessly (sample app auto-starts)
npm run test:e2e:headed    # headed browser
npm run test:e2e:ui        # Playwright UI mode
npm run test:carpal        # CarPal suite with auth state caching
npm run test:carpal:headed # CarPal suite headed
npm run report             # open HTML report
```

### AI Agents

```bash
npm run agent:architect              # scan repo: find duplication, brittle locators, gaps
npm run agent:architect:ai           # same + Claude AI recommendations (needs ANTHROPIC_API_KEY)

npm run agent:generate -- --story "User can create a temporary case" --name create-temp-case
npm run agent:generate -- --jira QA-123 --name qa-123-smoke
npm run agent:generate -- --file story.txt --name my-flow

npm run agent:enhance -- --input generated-tests/record-more-flow.spec.ts
npm run agent:enhance -- --input raw.spec.ts --output generated-tests/enhanced.spec.ts
```

---

## Framework Architecture

```
src/
├── agents/
│   ├── framework-architect.ts   # Scans repo, detects duplication, calls Claude API
│   ├── automation-generator.ts  # Requirement → Playwright spec via Claude API
│   └── recorder-enhancer.ts     # Raw recording → production code via Claude API
├── components/
│   └── ng-select.component.ts   # Angular ng-select wrapper: .pick() .pickOptional()
├── fixtures/
│   ├── auth.fixture.ts          # test.extend() — provides authenticatedPage fixture
│   └── auth.setup.ts            # saves storageState for playwright.config.carpal.ts
├── helpers/
│   ├── carpal.helpers.ts        # login(), selectNgOption(), searchOptionalNgOption()
│   └── vin.helper.ts            # generateVin() — local algorithm, no external service
├── pages/
│   ├── base.page.ts             # Abstract BasePage
│   ├── login.page.ts            # LoginPage POM
│   ├── dashboard.page.ts        # DashboardPage POM
│   ├── create-vehicle.page.ts   # CreateVehiclePage POM
│   └── create-case.page.ts      # CreateCasePage POM (tabs, customer, location, issue)
├── generator/                   # Original NLP → spec emitter (no changes)
├── jira/                        # Jira REST API client (no changes)
├── parser/                      # NLP action mapper (no changes)
└── utils/                       # ADF walker, safe filename (no changes)
```

---

## Writing a New Test

Import from shared modules — never define helpers inline:

```typescript
import { expect, test } from "@playwright/test";
import { login } from "../src/helpers/carpal.helpers";
import { generateVin } from "../src/helpers/vin.helper";
import { NgSelectComponent } from "../src/components/ng-select.component";
import { CreateVehiclePage } from "../src/pages/create-vehicle.page";

const data = {
  vin: generateVin(),
  brand: "Acura",
  model: "CL",
} as const;

test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 33.6844, longitude: 73.0479 },
});

test("CarPal QA: my new flow", async ({ page }) => {
  await test.step("Log in", async () => {
    await login(page);
    await expect(page.getByText(/Hi Csa Csa!/i)).toBeVisible();
  });

  await test.step("Navigate", async () => {
    await page.getByRole("link", { name: "Create Case", exact: true }).click();
  });
});
```

### Or use the auth fixture (page arrives already logged in)

```typescript
import { test, expect } from "../src/fixtures/auth.fixture";

test("CarPal QA: dashboard visible", async ({ authenticatedPage: page }) => {
  await expect(page.getByText(/Hi Csa Csa!/i)).toBeVisible();
});
```

---

## Three AI Agents

### `/architect` — Framework Architect Agent

Audits the entire repository without touching any files.

```bash
npm run agent:architect       # static analysis only
npm run agent:architect:ai    # + Claude API recommendations
```

Finds: duplicate functions, brittle locators, missing components, inline helpers that should be imported. Output → `reports/framework-analysis.md`.

### `/generate-test` — Automation Generation Agent

Converts a story/Jira ticket into a production-grade spec.

```bash
npm run agent:generate -- --story "CSA can search for a driver by name" --name driver-search
npm run agent:generate -- --jira QA-456 --name qa-456
```

Reads the framework first, reuses all existing helpers and page objects, then calls Claude to generate the spec.

### `/enhance-recording` — Recorder Enhancement Agent

Takes a raw Playwright recording and makes it production-ready.

```bash
# First, record something:
npm run run-record.bat   (or: npx playwright test generated-tests/record-more-flow.spec.ts --headed --debug)

# Then enhance it:
npm run agent:enhance -- --input generated-tests/record-more-flow.spec.ts
```

Replaces inline helpers with imports, brittle CSS chains with semantic locators, adds assertions and `test.step()` groupings.

---

## Locator Priority

1. `getByTestId("data-testid-value")` — most stable
2. `getByRole("button", { name: /text/i })` — semantic
3. `getByLabel(/label text/i)` — form fields
4. `getByPlaceholder(/placeholder/i)` — unlabelled inputs
5. `locator('[name="fieldName"]')` — Angular form fields
6. `locator('ng-select[name="fieldName"]')` — Angular ng-select

**Never:** long CSS class chains, absolute XPath, index-based nth() without context.

---

## Jira Test Case Format

The generator parses Jira descriptions that follow this structure:

```
Pre-req: Browser should be opened and application URL should be accessible
Steps:
When Fresh web app is launched, click on Next button on "Improve Your Morning" screen.
Enter the email -> user@example.com
Enter password -> Secret123
Expected Result:
User should land on home screen with partial text: "Tip: Quickly access tracks"
```

---

## Recording New Flows

1. Run `run-record.bat` — logs in, creates a vehicle, then opens Playwright Inspector
2. Click **Record** (⏺) in the Inspector toolbar
3. Interact with the browser
4. Click **Resume** (▶) when done
5. Run `npm run agent:enhance -- --input generated-tests/record-more-flow.spec.ts` to clean up the output

---

## Security Notes

- Never commit `.env` — it is gitignored
- `playwright/.auth/` is gitignored — it contains session tokens
- Never hardcode credentials in test files — use `process.env`
- The generator only emits code from a fixed, safe action mapping — no `eval`
