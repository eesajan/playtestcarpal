# Locator Strategy — CarPal

Locators are the Object Repository layer. No business logic, no waits, no actions.

## Core rule: uniqueness is mandatory at every level

Before storing ANY selector, count how many elements it matches on the captured page. If it matches more than one element, escalate to the next level. A selector that matches 2+ elements is not a locator — it is a guess.

## Selector priority (highest → lowest)

### 1. `data-testid` / `data-cy` / `data-qa` attribute
```ts
page.getByTestId('submit-vehicle-btn')
page.locator('[data-testid="issue-type-select"]')
```
Only use if the app exposes these. Never invent them in tests.

### 2. Stable `name` or `id` attribute — verified unique on the page
```ts
page.locator('input[name="userName"]')   // unique — only 1 on login page
page.locator('#submitBtn')
```
Verify uniqueness: `await page.locator('[name="foo"]').count()` must equal 1.
`name="brand"` used by BOTH brand and model dropdowns — NOT unique; do NOT use without scoping.

### 3. `getByRole` with exact name — only when count is exactly 1
```ts
page.getByRole('button', { name: 'Create Vehicle', exact: true })
page.getByRole('heading', { name: 'Create Vehicle' })
```
Count must be exactly 1. If 2 buttons exist with the same name, this is banned.

### 4. `getByLabel` / `getByPlaceholder` — only when count is exactly 1
```ts
page.getByLabel('VIN *')
page.getByPlaceholder('Search for a location')
```

### 5. Ancestor-scoped selector (required when lower levels are non-unique)

**Component selector scoping** — Angular injects component tags into the DOM. Use them as stable ancestors:
```ts
page.locator('app-vehicle-form ng-select[name="brand"]')        // scoped to component
page.locator('app-reported-issue ng-select').first()            // first within component
```

**Label-scoped (sibling/ancestor)** — anchor to the nearest visible label:
```ts
// CSS adjacent sibling (label immediately before element):
page.locator('label:has-text("Brand") + ng-select')

// CSS general sibling (label anywhere before in same parent):
page.locator('label:has-text("Brand") ~ ng-select').first()

// Ancestor container scoping:
page.locator('div:has(> label:has-text("Brand")) ng-select')
```

**XPath with ancestor or following-sibling** — most flexible for Angular:
```ts
// Label → following-sibling ng-select:
page.locator('xpath=//label[normalize-space()="Brand"]/following-sibling::ng-select[1]')

// Label → ancestor form-group → ng-select:
page.locator('xpath=//label[normalize-space()="Brand"]/ancestor::div[contains(@class,"form-group")][1]//ng-select')
```

**formControlName** — Angular binds this attribute, reliable when present:
```ts
page.locator('[formcontrolname="issueType"]')
page.locator('[formcontrolname="paymentMethod"]')
page.locator('ng-select[formcontrolname="brand"]')
```
Check via DOM snapshot: `ng-reflect-name` or `formcontrolname` on the element or its host.

### 6. Parameterized XPath with text — required for ANY visible string
```ts
// Tab navigation:
tab: (name: string) => page.getByRole('tab', { name })

// Option in a list:
option: (name: string) => page.getByRole('option', { name, exact: true })

// Row by content:
tableRow: (text: string) => page.locator(`tr:has-text("${text}")`)

// ng-select option when role fails:
ngOption: (label: string) =>
  page.locator(`xpath=//div[contains(@class,'ng-option')][normalize-space()='${label}']`)
```

**Rule:** If the selector contains a user-visible string (option name, label text, heading, tab name), it MUST be a parameterized arrow function — even if currently unique.

---

## Angular ng-select rules

`NgSelectComponent` in `src/components/ng-select.component.ts` wraps all dropdown interactions. You MUST use it for every `<ng-select>`.

```ts
// Good — use the wrapper
await new NgSelectComponent(page, l.brandSelect).pick('Acura')
await new NgSelectComponent(page, l.citiesSelect).pickOptional('islamabad')

// BAD — never interact with ng-select internals directly in tests or helpers
await page.locator('.ng-arrow-wrapper').click()        // BAD
await page.locator('.ng-option').first().click()       // BAD
await page.getByRole('option', { name: '...' }).click() // OK only INSIDE NgSelectComponent
```

Locators for ng-select must point to the **root `<ng-select>` element**, not its internal children.

### How to find stable ng-select locators

In order:
1. `ng-select[name="uniqueName"]` — if name is unique on page
2. `ng-select[formcontrolname="fieldName"]` — Angular form control binding
3. `label:has-text("Label") + ng-select` or `~ ng-select` — CSS sibling of its label
4. `app-component-name ng-select` — scoped to Angular component
5. `xpath=//label[normalize-space()='Label']/ancestor::div[1]//ng-select` — XPath fallback

**Never:**
- `ng-select.ng-invalid` — this is a CSS validation state class that changes when the user interacts with the form. It WILL break.
- `ng-select.ng-touched`, `ng-select.ng-dirty`, `ng-select.ng-pristine` — all state classes, all banned.
- `ng-select.ng-select-container` — internal wrapper child, not the root element.
- Global `.nth()` on ng-select without ancestor scoping.

---

## Banned patterns — flag every occurrence

| Banned | Why | Replacement |
|---|---|---|
| `.ng-invalid` / `.ng-touched` / `.ng-dirty` | CSS state class — changes as user interacts | `[formcontrolname]` or label-scoped |
| `.nth(N)` globally | Positional — breaks on DOM reorder | Scope to ancestor first, then `.nth()` as last resort |
| CSS chain > 60 chars | Brittle, unreadable | Break into ancestor + child |
| Absolute XPath from root | Brittle on app restructure | Relative XPath anchored to stable element |
| `getByText` for form elements | Matches multiple nodes | `getByLabel` or scoped selector |
| Hardcoded visible strings in non-parameterized locators | Breaks on text change | Arrow function parameter |
| Internal ng-select classes (`.ng-option`, `.ng-arrow-wrapper`, `.ng-value-label`, `.ng-select-container`) outside NgSelectComponent | Internal impl detail | Use NgSelectComponent methods |

---

## Uniqueness verification process

When using Playwright MCP to capture a page, verify each locator:

```ts
// In MCP browser session — count matches before storing:
const count = await page.locator('YOUR_SELECTOR').count();
// count must be exactly 1 for non-parameterized locators
```

If count > 1: do NOT store the selector as-is. Add ancestor scoping and re-verify until count === 1.

---

## Parameterization rule — always

Any locator that uses a user-visible string (label text, option name, tab name, heading, status) must be an arrow function parameter, **even when currently unique**. This prevents hardcoding and lets tests pass different values.

```ts
// BAD — hardcoded option name
createCaseLink: page.getByRole('link', { name: 'Create Case', exact: true })

// GOOD — parameterized (caller passes 'Create Case' or any other name)
navLink: (name: string) => page.getByRole('link', { name, exact: true })

// BAD — hardcoded tab
customerTab: page.getByRole('tab', { name: 'Customer Details' })

// GOOD
tab: (name: string) => page.getByRole('tab', { name })
```

**Exception:** Buttons/links that are truly unique page-level actions with stable labels that never vary (`submitButton`, `createVehicleButton`) may be stored as static locators — but still verify uniqueness.

---

## Locator file shape

```ts
import type { Page } from "@playwright/test";

export const featureLocators = (page: Page) => ({
  // Static — stable, verified unique
  pageHeading: page.getByRole("heading", { name: "Feature Title" }),
  submitButton: page.getByRole("button", { name: "Submit", exact: true }),

  // Scoped — ancestor + element
  brandSelect: page.locator('xpath=//label[normalize-space()="Brand"]/ancestor::div[1]//ng-select'),
  modelSelect: page.locator('xpath=//label[normalize-space()="Model"]/ancestor::div[1]//ng-select'),

  // Parameterized — visible string
  tab: (name: string) => page.getByRole("tab", { name }),
  option: (name: string) => page.getByRole("option", { name, exact: true }),
  tableRow: (text: string) => page.locator(`tr:has-text("${text}")`),
});

export type FeatureLocators = ReturnType<typeof featureLocators>;
```

No `await`, no `.click()`, no `.fill()`, no `waitFor()` in locator files.
