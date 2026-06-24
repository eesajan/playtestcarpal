# Coding Standards — CarPal

## TypeScript

- ESM modules (`"module": "ESNext"`). Always use `import`/`export`, never `require`.
- `strict` mode is on. No `any`. Use `unknown` + narrowing, or proper types.
- Type-only imports: `import type { Page } from "@playwright/test"` when only the type is needed.
- `as const` for config/data objects: `export const DEFAULT_VEHICLE_DATA = { ... } as const`.

## VIN generation — mandatory rule

**Always** use `generateVin()` from `src/helpers/common/vin.helper.ts`.
```ts
import { generateVin } from "../../src/helpers/common/vin.helper";
const vin = generateVin();          // random valid VIN
const vin = generateVin(42);        // seeded, deterministic
```
**Never:**
- Hardcode a VIN string (`"1HGBH41JXMN109186"`)
- Use an external API or website to generate VINs
- Reuse the same VIN across tests (state pollution)

## Auth — mandatory rule

**Use the fixture** for authenticated tests:
```ts
import { test, expect } from "../../src/fixtures/auth.fixture";

test("...", async ({ authenticatedPage: page }) => {
  // page is already logged in
});
```

**Or the helper** when fixture isn't suitable:
```ts
import { login } from "../../src/helpers/auth/auth.helper";
await login(page);
```

**Never** inline login logic (filling username/password/clicking submit) in a spec.

## ng-select — mandatory rule

**Always** use `NgSelectComponent`:
```ts
import { NgSelectComponent } from "../../src/components/ng-select.component";
const ngSelect = new NgSelectComponent(page, locators.brandSelect);
await ngSelect.pick('Acura');
await ngSelect.pickOptional('islamabad');
const value = await ngSelect.getValue();
await ngSelect.clear();
```

**Never** click `.ng-arrow-wrapper`, `.ng-select-container`, or `getByRole('option')` directly from a test or helper.

## Test structure

Every spec must have:
1. A `const data = { ... }` block at the top for test data (import from `test-data.ts` or define locally for one-off values)
2. `test.step()` for each logical phase
3. Minimum 3 meaningful assertions (URL, heading, success indicator)
4. Import `test`/`expect` from fixtures, NOT `@playwright/test` (unless it's `auth.setup.ts`)

```ts
import { expect, test } from "../../src/fixtures/auth.fixture";
import { generateVin } from "../../src/helpers/common/vin.helper";
import { DEFAULT_VEHICLE_DATA } from "../../src/config/test-data";

const data = {
  ...DEFAULT_VEHICLE_DATA,
  vin: generateVin(),
} as const;

test("CarPal QA: system should create a vehicle successfully", async ({ authenticatedPage: page }) => {
  await test.step("Navigate to create vehicle", async () => {
    // ...
    await expect(page).toHaveURL(/\/vehicles\/create/);
  });
  await test.step("Fill vehicle form", async () => {
    // ...
  });
  await test.step("Submit and verify success", async () => {
    // ...
    await expect(page.getByRole("heading", { name: /case/i })).toBeVisible();
  });
});
```

## Test naming

Format: `"CarPal QA: system should <do what> <when/given context>"`

```ts
"CarPal QA: system should login successfully"
"CarPal QA: system should create a vehicle and open a case"
"CarPal QA: system should reject duplicate VIN"
```

## Geolocation

Always grant geolocation via browser context for location-based tests:
```ts
const context = await browser.newContext({
  permissions: ["geolocation"],
  geolocation: GEOLOCATION.islamabad,
});
```

Import `GEOLOCATION` from `src/config/test-data.ts`.

## Async / errors

- Always `await` promises. No floating promises.
- `try/catch` only when you can handle the error — otherwise let it surface to Playwright.
- For optional UI elements: `.isVisible({ timeout: 3_000 }).catch(() => false)`.

## Comments

- Explain non-obvious intent, constraints, Angular quirks, workarounds.
- Never narrate obvious code (`// click the button`).
- Add `// TODO_VERIFY_DOM:` when a locator was written without live DOM inspection.
- Add `// REUSABLE:` when extracting shared logic to a helper.
