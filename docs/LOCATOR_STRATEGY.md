# Locator Strategy

Full rules: `.claude/rules/locator-strategy.md` | Quick ref: `/skills:locator-strategy`

## Core rule: count before storing

Every selector MUST resolve to exactly 1 element. Verify uniqueness before writing to a locator file. If count > 1, add ancestor scoping until count === 1.

## Priority Order

1. **`getByTestId("value")`** — requires `data-testid`. Most stable.
2. **Unique `name` / `id`** — `locator('[name="userName"]')` — **verify count === 1**
3. **`getByRole` + exact name** — `getByRole("button", { name: "Submit", exact: true })` — **count === 1 only**
4. **`getByLabel`** — form fields with visible `<label>` — **count === 1 only**
5. **`getByPlaceholder`** — unlabelled inputs — **count === 1 only**
6. **Ancestor-scoped** — when above are non-unique:
   - `ng-select[formcontrolname="brand"]`
   - `label:has-text("Brand") ~ ng-select`
   - `xpath=//label[normalize-space()="Brand"]/ancestor::div[contains(@class,"form-group")][1]//ng-select`
   - `app-vehicle-form ng-select[formcontrolname="brand"]`
7. **Parameterized arrow function** — ANY visible string (tab name, option, heading, row content):
   ```ts
   tab: (name: string) => page.getByRole("tab", { name })
   ```
8. **Controlled `.nth()` inside a scoped stable container** — last resort, document why

## Banned Patterns

| Pattern | Why Banned | Replacement |
|---|---|---|
| `ng-select.ng-invalid` / `.ng-touched` / `.ng-dirty` | CSS validation **state** — changes as user fills form | `[formcontrolname="x"]` or label-scoped |
| `ng-select[name="brand"].nth(0)` / `.nth(1)` globally | Positional — breaks on DOM reorder | `[formcontrolname="brand"]` or label XPath |
| CSS chain > 60 chars | Brittle, unreadable | Ancestor + scoped child |
| `/html/body/...` absolute XPath | Breaks on restructure | Relative XPath from stable anchor |
| Hardcoded visible string in non-parameterized locator | Breaks on copy change | Arrow function parameter |
| `.ng-arrow-wrapper` / `.ng-select-container` / `.ng-option` as root | Internal ng-select impl | Use `NgSelectComponent` — root `<ng-select>` only |

## CarPal-Specific: brand/model problem

Both brand and model share `name="brand"` (app bug). Positional `.nth()` is banned.

```typescript
// BAD — banned
brandSelect: page.locator('ng-select[name="brand"]').nth(0)
modelSelect: page.locator('ng-select[name="brand"]').nth(1)

// GOOD — capture DOM snapshot to confirm formcontrolname values
brandSelect: page.locator('ng-select[formcontrolname="brand"]')
modelSelect: page.locator('ng-select[formcontrolname="model"]')
// OR label-scoped XPath:
brandSelect: page.locator('xpath=//label[normalize-space()="Brand"]/ancestor::div[contains(@class,"form-group")][1]//ng-select')
modelSelect: page.locator('xpath=//label[normalize-space()="Model"]/ancestor::div[contains(@class,"form-group")][1]//ng-select')
```

## Stable CarPal Locators (verified)

### Login Form
```typescript
page.locator('input[name="userName"]')        // unique name on page
page.locator('input[name="password"]')        // unique name on page
page.locator('button[type="submit"]')         // unique type on page
```

### Dashboard
```typescript
page.getByRole("link", { name: "Create Case", exact: true })
page.getByRole("button", { name: "Create a Temporary" })
page.getByText(/Hi .+!/i)                     // assertions only
```

### Vehicle Form
```typescript
page.locator('ng-select[name="subclient"]')
// brand/model: capture DOM to confirm formcontrolname — see CarPal brand/model problem above
page.locator('ng-select[name="modelYear"]')
page.locator('ng-select[name="countries"]')
page.locator('ng-select[name="cities"]')
page.getByRole("textbox", { name: "VIN *" })
page.getByRole("textbox", { name: "Plate Category Code / Plate" })
page.getByRole("textbox", { name: "Mileage" })
page.getByRole("textbox", { name: "Color" })
page.locator('textarea[name="remarks"]')
```

### Case Form
```typescript
page.getByRole("tab", { name })               // parameterized
page.locator("#countryCode")                  // unique id
page.getByRole("textbox", { name: "Search for a location" })
page.locator('[aria-label="Notification"]')   // toast
// issue type: capture DOM — replace with page.locator('ng-select[formcontrolname="issueType"]')
// payment: capture DOM — replace with page.locator('ng-select[formcontrolname="paymentMethod"]')
```

## ng-select Pattern

Always use `NgSelectComponent` for every `<ng-select>` interaction:

```typescript
import { NgSelectComponent } from "../../src/components/ng-select.component";

await new NgSelectComponent(page, l.brandSelect).pick("Acura");
await new NgSelectComponent(page, l.countriesSelect).pick("Pakistan", "pak");
await new NgSelectComponent(page, l.citiesSelect).pickOptional("islamabad");
await new NgSelectComponent(page, l.brandSelect).clear();
const value = await new NgSelectComponent(page, l.brandSelect).getValue();
```

The locator passed to `NgSelectComponent` must be the root `<ng-select>` element — never an internal child.

## ng-select root locator decision tree

```
Has formcontrolname?     → ng-select[formcontrolname="x"]
Has unique name?         → ng-select[name="x"]  (count check!)
Has visible label?       → label:has-text("X") ~ ng-select  OR  label XPath
Inside Angular component? → app-component ng-select
```

## Where Locators Live

Factory functions in `src/locators/{feature}/{feature}.locators.ts`:

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

**Never** define locators inline in specs, helpers, or page objects.
