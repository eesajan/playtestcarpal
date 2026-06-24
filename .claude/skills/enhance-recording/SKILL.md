# Skill: Enhance Recording (CarPal)

Takes a raw Playwright recording (from `npx playwright codegen` or `npm run recorder`) and upgrades it to production-ready framework code: unique locators, NgSelectComponent, framework imports, test.step() structure, proper assertions, and VIN/auth patterns.

---

## Workflow

```
- [ ] Step 1: Read the rule files
- [ ] Step 2: Read the recording
- [ ] Step 3: Static analysis — find every problem
- [ ] Step 4: Extract verified-unique locators (reuse-first)
- [ ] Step 5: Refactor to framework patterns
- [ ] Step 6: Validate by running the enhanced spec
```

---

## Step 1: Read the rule files

Read ALL before touching the recording:
- `.claude/rules/locator-strategy.md` ← source of truth for selectors
- `.claude/rules/architecture.md` ← layer rules, import paths
- `.claude/rules/coding-standards.md` ← VIN, auth, ng-select, test shape
- `src/components/ng-select.component.ts`
- `src/helpers/common/vin.helper.ts`
- `src/fixtures/auth.fixture.ts`
- `src/config/test-data.ts`

Also read existing feature files to understand what already exists:
- `src/locators/{feature}/{feature}.locators.ts` (if exists)
- `src/helpers/{feature}/{feature}.helper.ts` (if exists)

---

## Step 2: Read the recording

Ask the user to provide the recording file path or paste it inline.

Read the file. Extract:
- Every `page.goto(...)` call — note URLs
- Every `page.click(...)` / `page.fill(...)` / `page.selectOption(...)` — note selectors used
- Every `page.locator(...)` — note selector strings
- Every `expect(...)` assertion
- Login steps (username/password filling)
- Any `page.pause()` calls
- Any hardcoded strings (VINs, credentials, URLs)

---

## Step 3: Static analysis — catalogue every problem

Go through the recording systematically and flag:

### Critical (must fix)
- [ ] **Inline login** — `page.fill('input[name="userName"]', 'user@...')` in the test → extract to `login()` or fixture
- [ ] **Hardcoded credentials** — any literal email/password string → use `CARPAL_CREDENTIALS`
- [ ] **Hardcoded VIN** — any 17-char alphanumeric string → use `generateVin()`
- [ ] **Hardcoded base URL** — `https://qa.carpal.com/...` → use `BASE_URL + ENDPOINTS.x`
- [ ] **Raw ng-select click** — `.click()` on `.ng-arrow-wrapper`, `.ng-select-container`, or `getByRole('option')` directly → wrap in `NgSelectComponent`
- [ ] **`page.pause()`** — remove entirely
- [ ] **`selectOption()`** on an ng-select — ng-select is NOT a native `<select>` → use `NgSelectComponent`

### Warnings (should fix)
- [ ] **Non-unique selectors** — any selector that could match 2+ elements (see locator strategy)
- [ ] **CSS state classes** — `.ng-invalid`, `.ng-touched`, `.ng-dirty` → replace with `formcontrolname` or label-scoped
- [ ] **Global `.nth(N)`** — positional index without ancestor scoping → scope to stable ancestor
- [ ] **Long CSS chains** — chains > 60 chars with `>` or spaces → break into ancestor + child
- [ ] **Inline locators in test body** — `page.locator('.some-class')` inline in test → extract to locator file
- [ ] **Missing `test.step()`** — no logical grouping → add steps for each phase
- [ ] **Fewer than 3 assertions** — add URL check, heading check, success indicator
- [ ] **`page.waitForTimeout(number)`** — hardcoded waits → use `waitForURL`, `waitForLoadState`, or `toBeVisible`
- [ ] **Absolute XPath from root** — `/html/body/...` style → anchor to nearest stable element
- [ ] **No `const data` block** — data inline in `.fill()` calls → extract to top-level `const data`

### Naming
- [ ] Test name doesn't follow `"CarPal QA: system should ..."` format
- [ ] No feature-folder structure (`tests/{feature}/`)

Print the full list of found issues before proceeding.

---

## Step 4: Extract verified-unique locators

For every selector in the recording:

### 4a. Reuse check
1. Check `src/locators/{feature}/{feature}.locators.ts` for an existing key for the same element
2. If found → use the existing key and import from there
3. If not found → create a new key following the rules below

### 4b. Upgrade each selector

For each raw selector from the recording, apply the priority ladder:

```
Raw codegen output                       → Upgraded locator
─────────────────────────────────────────────────────────────
page.locator('.ng-invalid').first()      → page.locator('[formcontrolname="issueType"]')
page.locator('ng-select[name="brand"]').nth(0) → page.locator('xpath=//label[normalize-space()="Brand"]/ancestor::div[1]//ng-select')
page.locator('.phone-number-field')      → page.locator('label:has-text("Phone") ~ ng-select').first()
page.getByText('Customer Details')       → page.getByRole('tab', { name: 'Customer Details' })  ← parameterize as arrow fn
page.locator('button').nth(2)            → page.getByRole('button', { name: 'Save', exact: true })
```

**Uniqueness check:** For every selector you write, note it must resolve to exactly 1 element. When in doubt, open the page with MCP (`browser_navigate` + `browser_snapshot`) and count.

### 4c. Parameterize visible strings

Any visible string inside a locator becomes an arrow function parameter:
```ts
// Before (from recording):
await page.getByRole('tab', { name: 'Customer Details' }).click();

// After (in locator file):
tab: (name: string) => page.getByRole('tab', { name })

// After (in helper call):
await l.tab('Customer Details').click();
```

---

## Step 5: Refactor to framework patterns

Apply all fixes from the analysis:

### 5a. Create/update locator file
`src/locators/{feature}/{feature}.locators.ts` — all upgraded unique selectors.

### 5b. Create/update helper file
`src/helpers/{feature}/{feature}.helper.ts` — extract:
- Form fill logic → `fill{Feature}Form(page, data)`
- Submission + wait → `submit{Feature}(page)`
- Repeated tab navigation → `click{Feature}Tab(page, tabName)`
- Any sequence > 3 steps used more than once → named exported function

### 5c. Rewrite the spec

```ts
import { expect, test } from "../../src/fixtures/auth.fixture";
import { generateVin } from "../../src/helpers/common/vin.helper";
import { DEFAULT_VEHICLE_DATA } from "../../src/config/test-data";
import { fill{Feature}Form, submit{Feature} } from "../../src/helpers/{feature}/{feature}.helper";

const data = {
  ...DEFAULT_VEHICLE_DATA,
  vin: generateVin(),
} as const;

test("CarPal QA: system should ...", async ({ authenticatedPage: page }) => {
  await test.step("Navigate", async () => { /* ... */ });
  await test.step("Fill form", async () => { await fill{Feature}Form(page, data); });
  await test.step("Submit and verify", async () => {
    await submit{Feature}(page);
    await expect(page).toHaveURL(/expected-path/);
    await expect(page.getByRole("heading", { name: /success/i })).toBeVisible();
  });
});
```

Save enhanced spec to `tests/{feature}/{original-name}-enhanced.spec.ts` — do NOT overwrite the original.

---

## Step 6: Validate

```bash
npx tsc --noEmit
npx playwright test tests/{feature}/{name}-enhanced.spec.ts --config playwright.config.carpal.ts --headed
```

Fix any failures:
- Selector not found → re-inspect DOM via MCP, apply better ancestor scoping
- Timing issue → use `waitForURL`, `waitForLoadState('networkidle')`, or `toBeVisible({ timeout: 30_000 })`
- VIN validation failure → verify `pressSequentially` + `Tab` pattern is used
- ng-select not picking → verify you're using `NgSelectComponent.pick()` with the correct root element

Report:
- Issues found and fixed (from Step 3 list)
- Locators created/reused
- Files written
- Test result (pass/fail + any remaining fragile items to verify manually)
