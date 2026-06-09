# Locator Strategy Reference

Use this skill when: choosing a locator for a new element, reviewing locators, or understanding why a locator was written a certain way.

## Priority Order (always prefer higher)

| Priority | Method | When to use |
|---|---|---|
| 1 | `getByTestId("value")` | Element has `data-testid` attribute — most stable |
| 2 | `getByRole("button", { name: /text/i })` | Buttons, links, headings, inputs with accessible labels |
| 3 | `getByLabel(/label text/i)` | Form fields with visible `<label>` elements |
| 4 | `getByPlaceholder(/placeholder/i)` | Unlabelled inputs with placeholder text |
| 5 | `locator('[name="fieldName"]')` | Angular form fields with `name` attribute |
| 6 | `locator('ng-select[name="fieldName"]')` | Angular ng-select dropdowns |
| 7 | `getByText("visible text")` | **Assertions only** — last resort for interactions |

## Examples

```typescript
// ✓ Preferred: semantic role
page.getByRole("button", { name: /Create Vehicle/i })
page.getByRole("link", { name: "Create Case", exact: true })
page.getByRole("heading", { name: "Create Vehicle" })
page.getByRole("tab", { name: "Customer Details" })

// ✓ Preferred: label
page.getByLabel(/VIN/i)
page.getByLabel("Mileage")

// ✓ Acceptable: name attribute (Angular forms)
page.locator('input[name="userName"]')
page.locator('button[type="submit"]')
page.locator('textarea[name="remarks"]')
page.locator('ng-select[name="modelYear"]')

// ✓ Acceptable: textbox role with name
page.getByRole("textbox", { name: "VIN *" })
page.getByRole("textbox", { name: "Plate Category Code / Plate" })

// ✗ Forbidden: long CSS chain
page.locator('.ng-select.ng-select-single.ng-select-searchable .ng-select-container .ng-value-container')

// ✗ Forbidden: absolute XPath
page.locator('//div[@class="form"]/input[2]')

// ✗ Forbidden: nth() on non-semantic locator
page.locator('button').nth(3)

// ✓ Exception: nth() with semantic context (documented CarPal quirk)
page.locator('ng-select[name="brand"]').nth(0)  // brand make
page.locator('ng-select[name="brand"]').nth(1)  // brand model
```

## CarPal-Specific Locators

CarPal uses Angular with `ng-select` dropdowns for all selects. Always use `NgSelectComponent`:

```typescript
import { NgSelectComponent } from "../../components/ng-select.component"

const select = new NgSelectComponent(page, page.locator('ng-select[name="countries"]'))
await select.pick("Pakistan", "pak")         // searches "pak", clicks "Pakistan"
await select.pickOptional("islamabad")        // graceful — won't fail if not found
await select.clear()                         // clears the selection
await select.getValue()                      // returns current value text
```

## Where to Store Locators

All locators live in `src/locators/{feature}/{feature}.locators.ts` as factory functions:

```typescript
// src/locators/vehicle/vehicle.locators.ts
import type { Page } from "@playwright/test"

export const vehicleLocators = (page: Page) => ({
  vinInput: page.getByRole("textbox", { name: "VIN *" }),
  brandSelect: page.locator('ng-select[name="brand"]').nth(0),
  // ...
})
```

Page objects and helpers receive locators by calling the factory:
```typescript
const l = vehicleLocators(this.page)
await l.vinInput.fill(vin)
```

Never define locators inline in test spec files or helpers.
