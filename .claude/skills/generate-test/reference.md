# Generate Test Reference — CarPal

Templates the generate-test skill must follow. Replace `{feature}`, `{Feature}`, `{screen}` placeholders. Mirror real examples in `src/locators/vehicle/vehicle.locators.ts`, `src/helpers/vehicle/vehicle.helper.ts`, and `tests/vehicle/create-vehicle.spec.ts`.

---

## Locator key naming

| Element | Key pattern | Example |
|---|---|---|
| Page heading | `pageHeading` | `pageHeading: page.getByRole("heading", { name: "Create Vehicle" })` |
| Button (static label) | `{action}Button` | `createVehicleButton`, `submitButton`, `saveButton` |
| Text input | `{field}Input` | `vinInput`, `plateInput`, `searchInput` |
| Textarea | `{field}Field` | `remarksField` |
| ng-select root | `{field}Select` | `brandSelect`, `issueTypeSelect`, `countryCodeSelect` |
| Tab (parameterized) | `tab` | `tab: (name: string) => page.getByRole("tab", { name })` |
| Link | `{name}Link` | `createCaseLink`, `viewCasesLink` |
| Toast / notification | `toastNotification` | stable aria-label selector |
| Table row | `tableRow` | `tableRow: (text: string) => page.locator(...)` |

---

## Locator file — `src/locators/{feature}/{feature}.locators.ts`

```ts
import type { Page } from "@playwright/test";

export const {feature}Locators = (page: Page) => ({
  // Page-level unique elements — verified count === 1
  pageHeading: page.getByRole("heading", { name: "{Page Title}" }),
  submitButton: page.getByRole("button", { name: "{Submit Label}", exact: true }),

  // Inputs — unique name or label
  {field}Input: page.getByLabel("{Label Text}"),
  {field}Input: page.locator('input[name="{name}"]'),

  // ng-select — always root <ng-select> element, located by formcontrolname or label
  {field}Select: page.locator('ng-select[formcontrolname="{controlName}"]'),
  // When formcontrolname not available, use label-sibling:
  {field}Select: page.locator('xpath=//label[normalize-space()="{Label}"]/ancestor::div[contains(@class,"form-group")][1]//ng-select'),

  // Parameterized — visible strings ALWAYS arrow functions
  tab: (name: string) => page.getByRole("tab", { name }),
  option: (name: string) => page.getByRole("option", { name, exact: true }),
  tableRow: (text: string) => page.locator(`tr:has-text("${text}")`),
});

export type {Feature}Locators = ReturnType<typeof {feature}Locators>;
```

---

## Helper file — `src/helpers/{feature}/{feature}.helper.ts`

```ts
import { expect, type Page } from "@playwright/test";
import { NgSelectComponent } from "../../components/ng-select.component";
import { {feature}Locators } from "../../locators/{feature}/{feature}.locators";
// import { generateVin } from "../common/vin.helper"; // if VIN needed

export type {Feature}FormData = {
  field1: string;
  field2: string;
  optionalField?: string;
};

/** Fill the {feature} form with provided data. */
export async function fill{Feature}Form(page: Page, data: {Feature}FormData): Promise<void> {
  const l = {feature}Locators(page);

  // Text inputs
  await l.field1Input.fill(data.field1);

  // ng-select dropdowns — always use NgSelectComponent
  await new NgSelectComponent(page, l.field2Select).pick(data.field2);

  // Optional fields
  if (data.optionalField) {
    await l.optionalInput.fill(data.optionalField);
  }
}

/** Submit the form and verify success state. */
export async function submit{Feature}(page: Page): Promise<void> {
  const l = {feature}Locators(page);
  await l.submitButton.click();
  await expect(l.successIndicator).toBeVisible({ timeout: 30_000 });
}
```

---

## Page object (optional) — `src/pages/{feature}/{screen}.page.ts`

Only create for screen-heavy flows (3+ steps all on the same page).

```ts
import { expect } from "@playwright/test";
import { NgSelectComponent } from "../../components/ng-select.component";
import { BasePage } from "../base.page";
import { {feature}Locators } from "../../locators/{feature}/{feature}.locators";
import type { {Feature}FormData } from "../../helpers/{feature}/{feature}.helper";

export class {Screen}Page extends BasePage {
  private readonly l = {feature}Locators(this.page);

  // Expose ng-select wrappers as properties
  readonly {field}Select = new NgSelectComponent(this.page, this.l.{field}Select);

  async isLoaded(): Promise<void> {
    await expect(this.l.pageHeading).toBeVisible({ timeout: 15_000 });
  }

  async fill(data: {Feature}FormData): Promise<void> {
    await this.l.field1Input.fill(data.field1);
    await this.{field}Select.pick(data.field2);
  }

  async submit(): Promise<void> {
    await this.l.submitButton.click();
    await expect(this.l.successIndicator).toBeVisible({ timeout: 30_000 });
  }
}
```

---

## Spec file — `tests/{feature}/{name}.spec.ts`

```ts
import { expect, test } from "../../src/fixtures/auth.fixture";
import { generateVin } from "../../src/helpers/common/vin.helper";
import { DEFAULT_VEHICLE_DATA } from "../../src/config/test-data";
import { fill{Feature}Form, submit{Feature} } from "../../src/helpers/{feature}/{feature}.helper";
import { {feature}Locators } from "../../src/locators/{feature}/{feature}.locators";
// import { {Screen}Page } from "../../src/pages/{feature}/{screen}.page";  // if using page object

// One-off test data block — import shared defaults, override as needed
const data = {
  ...DEFAULT_VEHICLE_DATA,
  vin: generateVin(),   // fresh valid VIN per run
} as const;

test("CarPal QA: system should {describe what the test verifies}", async ({ authenticatedPage: page }) => {
  const l = {feature}Locators(page);

  await test.step("Navigate to {feature} page", async () => {
    await page.goto("/bu/{feature}/create");
    await expect(l.pageHeading).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/{feature}\/create/);
  });

  await test.step("Fill {feature} form", async () => {
    await fill{Feature}Form(page, data);
  });

  await test.step("Submit and verify success", async () => {
    await submit{Feature}(page);
    await expect(page).toHaveURL(/{expected-url}/);
    await expect(l.{successIndicator}).toBeVisible({ timeout: 30_000 });
  });
});
```

---

## Auth patterns

**Option A — fixture (preferred for all authenticated tests):**
```ts
import { test, expect } from "../../src/fixtures/auth.fixture";

test("...", async ({ authenticatedPage: page }) => {
  // page is already on /bu/dashboard
});
```

**Option B — helper (for auth.setup.ts or non-fixture tests):**
```ts
import { test, expect } from "@playwright/test";  // raw — only for setup files
import { login } from "../../src/helpers/auth/auth.helper";

test("...", async ({ page }) => {
  await login(page);
  // now on /bu/dashboard
});
```

---

## NgSelectComponent patterns

```ts
import { NgSelectComponent } from "../../src/components/ng-select.component";

// Pick an exact option (search + select):
await new NgSelectComponent(page, l.brandSelect).pick('Acura');

// Pick with custom search text (when option name ≠ search text):
await new NgSelectComponent(page, l.countriesSelect).pick('Pakistan', 'pak');

// Pick if found, skip if not (for optional fields with async load):
await new NgSelectComponent(page, l.citiesSelect).pickOptional('islamabad');

// Read current value:
const brand = await new NgSelectComponent(page, l.brandSelect).getValue();

// Clear selection:
await new NgSelectComponent(page, l.brandSelect).clear();
```

---

## VIN patterns

```ts
import { generateVin, generateVins, isValidVin } from "../../src/helpers/common/vin.helper";

const vin = generateVin();          // random valid VIN
const vin = generateVin(42);        // seeded, reproducible
const vins = generateVins(5);       // array of 5 valid VINs
const ok = isValidVin(someVin);     // validate a VIN string
```

VIN input requires `pressSequentially` + `Tab` to trigger Angular validators:
```ts
await l.vinInput.click();
await l.vinInput.fill("");
await l.vinInput.pressSequentially(vin);
await l.vinInput.press("Tab");
await expect(l.vinInput).toHaveValue(vin);
```

---

## Geolocation (for pickup location tests)

```ts
import { GEOLOCATION } from "../../src/config/test-data";

// Grant in test config or context:
const context = await browser.newContext({
  permissions: ["geolocation"],
  geolocation: GEOLOCATION.islamabad,
});
```

---

## Timeouts reference

| Timeout | Value | Use for |
|---|---|---|
| Default assertion | 5 000 ms | `expect(l.x).toBeVisible()` |
| Form submission | 30 000 ms | `{ timeout: 30_000 }` after clicking submit |
| Page navigation | 15 000 ms | `{ timeout: 15_000 }` for page heading |
| ng-select option | 5 000 ms | Inside NgSelectComponent |
| Toast dismiss | 3 000 ms | Optional element check |

Always use named constants or inline comments — never a raw number without explanation.
