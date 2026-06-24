# Skill: Generate Test (CarPal)

Captures a page via Playwright MCP (or records via codegen), extracts **verified-unique** locators, and scaffolds the full layered artifacts — locator file, helper functions, optional page object, and spec — then validates by running the spec.

**Prerequisite:** Playwright MCP configured.
```bash
claude mcp add playwright -- npx @playwright/mcp
```
If MCP is unavailable, fall back to: `npx playwright codegen https://qa.carpal.com`

---

## Workflow

```
- [ ] Step 1: Read the rule files
- [ ] Step 2: Gather intent from user
- [ ] Step 3: Capture the page (MCP or codegen)
- [ ] Step 4: Extract verified-unique locators (reuse-first)
- [ ] Step 5: Generate + register files
- [ ] Step 6: Validate by running the spec
```

---

## Step 1: Read the rule files

Read ALL of these before doing anything else:
- `.claude/rules/locator-strategy.md` ← source of truth for selectors
- `.claude/rules/architecture.md` ← layer rules and import paths
- `.claude/rules/coding-standards.md` ← VIN, auth, ng-select, test shape
- `src/components/ng-select.component.ts` ← NgSelectComponent API
- `src/helpers/common/vin.helper.ts` ← generateVin() API
- `src/fixtures/auth.fixture.ts` ← authenticatedPage fixture
- `src/config/test-data.ts` ← DEFAULT_VEHICLE_DATA, GEOLOCATION
- `src/config/urls.ts` ← BASE_URL, ENDPOINTS

---

## Step 2: Gather intent

Ask the user before proceeding:
- **Feature/area name** (e.g. `vehicle`, `case`, `driver`, `job`) — used for folder and file names
- **What to test** — describe the user flow step by step (what to click, fill, verify)
- **Spec name** (e.g. `create-vehicle`, `assign-driver`, `complete-case`)
- **Auth needed?** — use `authenticatedPage` fixture (default yes) or fresh page
- **Capture mode** — MCP browser (default) or codegen recording

Also check: does a locator file or helper for this feature already exist?

---

## Step 3: Capture the page

Resolve credentials and URL from config — never hardcode.

Read from:
- `src/config/credentials.ts` → `CARPAL_CREDENTIALS.username / .password`
- `src/config/urls.ts` → `BASE_URL`, `ENDPOINTS`

**MCP capture:**
1. Navigate to `${BASE_URL}/login`
2. Fill username + password from `CARPAL_CREDENTIALS`, submit
3. Verify URL matches `/bu/dashboard`
4. Navigate to the target page for the feature
5. Perform each step the user described
6. At each interaction point: take a DOM snapshot (`browser_snapshot`) to inspect attributes
7. For each element — collect: `data-testid`, `name`, `id`, `formcontrolname`, `aria-label`, role, visible label text, Angular component tag ancestor

**Codegen fallback:**
Tell user to run:
```bash
npx playwright codegen https://qa.carpal.com
```
Then paste or save the generated script. Read it and use recorded selectors as the starting point — but ALWAYS upgrade them through the locator priority process in Step 4.

---

## Step 4: Extract verified-unique locators

### 4a. Reuse before creating

Before writing any new locator:
1. Check if a locator file exists for this feature: `src/locators/{feature}/{feature}.locators.ts`
2. Check existing files for the same element: search `src/locators/` for the element's stable attribute value (`name`, `formcontrolname`, `data-testid`, `aria-label`)
3. Decision:
   - Match found → **reuse** the existing key, import it, add `// reused from src/locators/{feature}` in the helper
   - File exists but key missing → **add the key** to the existing file
   - No file for feature → create a new one

### 4b. Uniqueness check (mandatory for every element)

For every element you need to interact with or assert on:
1. Try each selector level in priority order (see `.claude/rules/locator-strategy.md`)
2. **Count matches** at the selected level: `await page.locator('YOUR_SELECTOR').count()`
3. If count > 1 → **do not use this selector**. Add ancestor scoping and re-count.
4. Only store the selector when count === 1.

### 4c. Selector decision tree

For each element:

```
Does it have data-testid / data-cy?  → getByTestId()
  ↓ no
Does it have a unique name/id attr?  → locator('[name="x"]') — verify count === 1
  ↓ no
getByRole + name — count === 1?      → getByRole('button', { name: 'Submit' })
  ↓ count > 1
getByLabel — count === 1?            → getByLabel('VIN *')
  ↓ count > 1
Is it an ng-select?                  → see ng-select rules below
  ↓ no
Scope to Angular component ancestor  → page.locator('app-vehicle-form input[name="x"]')
  ↓ still not unique
Label-sibling XPath                  → page.locator('xpath=//label[normalize-space()="Label"]/following-sibling::*[1]//element')
  ↓ still not unique
Ancestor form-group + XPath          → page.locator('xpath=//label[normalize-space()="Label"]/ancestor::div[contains(@class,"form-group")][1]//element')
  ↓ none work
Controlled nth() INSIDE a scoped stable container (document the why)
```

### 4d. ng-select unique locator rules

The `<ng-select>` root element must be located via:
1. `ng-select[name="uniqueName"]` — only if name is unique on the page (count check!)
2. `ng-select[formcontrolname="fieldName"]` — check DOM: inspect `formcontrolname` attr on the element
3. `label:has-text("Label") ~ ng-select` or `+ ng-select` — CSS sibling
4. `xpath=//label[normalize-space()="Label"]/ancestor::div[1]//ng-select` — XPath via label ancestor
5. Scoped to Angular component: `app-vehicle-form ng-select[formcontrolname="brand"]`

**BANNED for ng-select:**
- `ng-select.ng-invalid` — CSS state class, changes as user fills form
- `ng-select.ng-touched` / `.ng-dirty` / `.ng-pristine`
- Global `ng-select.nth(N)` without ancestor
- `.ng-arrow-wrapper`, `.ng-select-container`, `.ng-option`, `.ng-value-label` as the root locator

### 4e. Parameterize visible strings

If a selector contains a user-visible string (tab name, option label, heading text, row content), convert it to an arrow function:
```ts
// BAD
customerTab: page.getByRole('tab', { name: 'Customer Details' })

// GOOD
tab: (name: string) => page.getByRole('tab', { name })
```

---

## Step 5: Generate files

Follow templates in `.claude/skills/generate-test/reference.md`.

### 5a. Locator file
- New file: `src/locators/{feature}/{feature}.locators.ts`
- Extending existing: add keys to the existing file
- Export: `export const {feature}Locators = (page: Page) => ({ ... })`
- Export type: `export type {Feature}Locators = ReturnType<typeof {feature}Locators>`
- No `await`, no actions, no config imports

### 5b. Helper file
- New file: `src/helpers/{feature}/{feature}.helper.ts`
- Extending existing: add exported functions to existing file
- Use `NgSelectComponent` for all `<ng-select>` interactions
- Use `generateVin()` — never hardcode VINs
- Import credentials/URLs from `src/config/` — never inline
- Mark reused locators: `// reused from src/locators/{other}`
- Mark extracted helpers: `// REUSABLE: extracted to {feature}.helper.ts`

### 5c. Page object (optional — only for screen-heavy flows)
- `src/pages/{feature}/{screen}.page.ts`
- Extend `BasePage`
- Orchestrate the helper functions
- Only create when spec will be > 3 steps all on the same page

### 5d. Spec file
- `tests/{feature}/{name}.spec.ts`
- Import `test`/`expect` from `../../src/fixtures/auth.fixture`
- `const data = { vin: generateVin(), ...DEFAULT_VEHICLE_DATA }` at top
- `test.step()` for every logical phase
- Minimum 3 assertions (URL, heading, success state)
- Test name: `"CarPal QA: system should ..."` format

---

## Step 6: Validate

Run in order, fix until both pass:

```bash
npx tsc --noEmit
npx playwright test tests/{feature}/{name}.spec.ts --config playwright.config.carpal.ts --headed
```

Fix locator issues by recapturing with MCP snapshot — never paper over with `.nth()` or state classes. Fix timing with proper waits (`waitForURL`, `waitForLoadState`, `toBeVisible`). Never use `page.waitForTimeout(number)` with a hardcoded number.

Report final files created and test result.
