# Framework Architecture Reference

Use this skill when: adding new features, understanding where to put new code, onboarding, or any time you need to understand the layer responsibilities.

## Layer Diagram

```
.env / src/config/          ← Global variables layer (credentials, URLs, test data)
        ↓
src/locators/{feature}/     ← Locator layer (Playwright Locator objects, no logic)
        ↓
src/helpers/{feature}/      ← Helper layer (reusable async actions, imports locators + config)
        ↓
src/pages/{feature}/        ← Page Object layer (page-level abstractions, imports locators)
        ↓
src/fixtures/               ← Fixture layer (Playwright test extensions, e.g. auth state)
        ↓
tests/{feature}/            ← Test layer (specs only, imports from all above)
```

## Layer Responsibilities

### `src/config/`
- **credentials.ts** — typed wrappers around `process.env.CARPAL_*`, `JIRA_*`, etc.
- **urls.ts** — `BASE_URL` constant and `ENDPOINTS` object
- **test-data.ts** — shared constants used across multiple tests (`DEFAULT_VEHICLE_DATA`, `GEOLOCATION`)
- Rule: no Playwright imports here. No test logic. Only configuration.

### `src/locators/{feature}/`
- One file per feature: `auth/login.locators.ts`, `vehicle/vehicle.locators.ts`, etc.
- Pattern: factory function `{feature}Locators(page: Page)` returning a plain object of `Locator`s
- Rule: locators ONLY. No assertions. No interactions. No imports beyond `@playwright/test`.

### `src/helpers/{feature}/`
- One folder per feature: `auth/`, `vehicle/`, `case/`, `common/`
- Exports named async functions: `login()`, `fillVehicleForm()`, `fillCustomerPhone()`, etc.
- Imports from: locators layer + config layer + `NgSelectComponent`
- Rule: no test framework imports. No `test.step()`. No `expect()`.

### `src/pages/{feature}/`
- One file per page: `login.page.ts`, `create-vehicle.page.ts`, etc.
- Extends `BasePage`. Constructor initializes locators via the locator factory.
- Exports a class with public methods (actions) and no inline selector strings.
- Rule: all selectors come from the locators layer. No `process.env` access.

### `src/components/`
- `ng-select.component.ts` — wrapper for Angular `ng-select` dropdowns
- Used by: page objects, helpers
- Rule: framework components only, not test-specific logic.

### `src/fixtures/`
- `auth.fixture.ts` — Playwright `test.extend()` providing `authenticatedPage`
- Rule: fixtures set up test preconditions. No assertions on business logic.

### `tests/{feature}/`
- `auth/auth.setup.ts` — saves storageState for auth caching
- `auth/login.spec.ts`, `vehicle/create-vehicle.spec.ts`, etc.
- Rule: test files import from all layers but define NO new helpers or locators inline.

### `tools/`
- CLI scripts for Jira generation, framework audit, recording enhancement
- These are NOT part of the test framework — they are developer tools
- Rule: tools may import from `src/config/` but not from `src/helpers/` or `src/pages/`

## Adding a New Feature

1. Create `src/locators/{feature}/{feature}.locators.ts`
2. Create `src/helpers/{feature}/{feature}.helper.ts`
3. Create `src/pages/{feature}/{page-name}.page.ts` (if needed)
4. Create `tests/{feature}/{test-name}.spec.ts`
5. Update `src/config/test-data.ts` if new shared test data is needed
