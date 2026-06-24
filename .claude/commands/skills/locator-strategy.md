# Locator Strategy Reference

**Full rules: `.claude/rules/locator-strategy.md`**

Use this skill when: choosing a locator for a new element, reviewing locators, or understanding why a locator was written a certain way.

## Core rule: count before storing

Every selector MUST resolve to exactly 1 element. Verify with `page.locator('...').count() === 1` before writing it to a locator file.

## Priority Order (highest → lowest)

| Priority | Method | When to use |
|---|---|---|
| 1 | `getByTestId("value")` | Element has `data-testid` attribute |
| 2 | `locator('[name="x"]')` / `locator('#id')` | Unique `name` or `id` — **verify count === 1** |
| 3 | `getByRole("button", { name: "...", exact: true })` | **count === 1** only |
| 4 | `getByLabel("...")` | **count === 1** only |
| 5 | `getByPlaceholder("...")` | **count === 1** only |
| 6 | Ancestor-scoped | `ng-select[formcontrolname="x"]`, `label:has-text("X") ~ ng-select`, XPath with ancestor |
| 7 | Parameterized arrow function | Any visible string → `(name: string) => page.getByRole('tab', { name })` |
| 8 | `.nth()` inside scoped container | Last resort — document why; never global |

## Banned patterns

| Banned | Replacement |
|---|---|
| `.ng-invalid` / `.ng-touched` / `.ng-dirty` / `.ng-pristine` | `[formcontrolname="x"]` or label-scoped |
| Global `ng-select.nth(0)` / `.nth(1)` | `ng-select[formcontrolname="brand"]` or label XPath |
| CSS chain > 60 chars | Break into ancestor + scoped child |
| `/html/body/...` absolute XPath | Relative XPath anchored to stable element |
| Hardcoded visible string in locator | Arrow function parameter |

## ng-select root locator — decision tree

```
Has formcontrolname attr?   → ng-select[formcontrolname="x"]
Has unique name attr?       → ng-select[name="x"]  (count check!)
Has a visible label?        → label:has-text("Label") ~ ng-select
Inside Angular component?   → app-component ng-select
None of above?              → xpath=//label[normalize-space()="Label"]/ancestor::div[1]//ng-select
```

**Never use ng-select internal classes** (`.ng-arrow-wrapper`, `.ng-select-container`, `.ng-option`, `.ng-value-label`) as the root locator. These are only used INSIDE `NgSelectComponent`.

## CarPal brand/model problem

Both brand and model dropdowns share `name="brand"` — a known app issue.

```typescript
// BAD — positional, breaks on reorder
brandSelect: page.locator('ng-select[name="brand"]').nth(0)
modelSelect: page.locator('ng-select[name="brand"]').nth(1)

// GOOD — use formcontrolname (check DOM) or label XPath
brandSelect: page.locator('ng-select[formcontrolname="brand"]')
modelSelect: page.locator('ng-select[formcontrolname="model"]')
// OR:
brandSelect: page.locator('xpath=//label[normalize-space()="Brand"]/ancestor::div[1]//ng-select')
modelSelect: page.locator('xpath=//label[normalize-space()="Model"]/ancestor::div[1]//ng-select')
```
Verify via DOM snapshot (MCP `browser_snapshot`) before committing.

## NgSelectComponent usage

```typescript
import { NgSelectComponent } from "../../src/components/ng-select.component";

await new NgSelectComponent(page, l.brandSelect).pick('Acura');
await new NgSelectComponent(page, l.countriesSelect).pick('Pakistan', 'pak');
await new NgSelectComponent(page, l.citiesSelect).pickOptional('islamabad');
const value = await new NgSelectComponent(page, l.brandSelect).getValue();
```

## Where to store locators

`src/locators/{feature}/{feature}.locators.ts` — factory function pattern:
```typescript
import type { Page } from "@playwright/test";
export const vehicleLocators = (page: Page) => ({
  pageHeading: page.getByRole("heading", { name: "Create Vehicle" }),
  vinInput: page.getByLabel("VIN *"),
  brandSelect: page.locator('ng-select[formcontrolname="brand"]'), // TODO_VERIFY_DOM
  tab: (name: string) => page.getByRole("tab", { name }),
});
export type VehicleLocators = ReturnType<typeof vehicleLocators>;
```

Never define locators inline in helpers, pages, or specs.
