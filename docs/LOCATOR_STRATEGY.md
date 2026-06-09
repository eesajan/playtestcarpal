# Locator Strategy

See also: `/skills:locator-strategy` for a quick reference.

## Priority Order

1. **`getByTestId("value")`** — requires `data-testid` attribute in the app. Most stable if available.
2. **`getByRole("button", { name: /text/i })`** — semantic, robust, maps to ARIA roles.
3. **`getByLabel(/label text/i)`** — for form fields with visible `<label>`.
4. **`getByPlaceholder(/placeholder/i)`** — fallback for unlabelled inputs.
5. **`getByRole("textbox", { name: "VIN *" })`** — textbox with accessible name.
6. **`locator('[name="fieldName"]')`** — Angular form fields with `name` attribute.
7. **`locator('ng-select[name="fieldName"]')`** — Angular ng-select with name.
8. **`getByText("visible text")`** — **assertions only**, last resort for interactions.

## Forbidden Patterns

| Pattern | Why Forbidden | Alternative |
|---|---|---|
| `.ng-select.ng-select-single.ng-select-searchable .ng-select-container` (> 60 chars) | Breaks on minor Angular upgrade | `locator('ng-select[name="..."]')` |
| `//div[@class="form"]/input[2]` | Breaks on DOM reorder | `getByRole` or `getByLabel` |
| `page.locator('button').nth(3)` | Index changes with DOM changes | `getByRole("button", { name: /text/i })` |

## CarPal-Specific Locators

### Login Form
```typescript
page.locator('input[name="userName"]')
page.locator('input[name="password"]')
page.locator('button[type="submit"]')
```

### Dashboard
```typescript
page.getByRole("link", { name: "Create Case", exact: true })
page.getByRole("button", { name: "Create a Temporary" })
page.getByText(/Hi .+!/i)
```

### Vehicle Form
```typescript
// ng-selects
page.locator('ng-select[name="subclient"]')
page.locator('ng-select[name="brand"]').nth(0)   // make (CarPal quirk: brand = make)
page.locator('ng-select[name="brand"]').nth(1)   // model (CarPal quirk: brand = model)
page.locator('ng-select[name="modelYear"]')
page.locator('ng-select[name="countries"]')
page.locator('ng-select[name="cities"]')
// text inputs
page.getByRole("textbox", { name: "VIN *" })
page.getByRole("textbox", { name: "Plate Category Code / Plate" })
page.getByRole("textbox", { name: "Mileage" })
page.getByRole("textbox", { name: "Color" })
page.locator('textarea[name="remarks"]')
```

### Case Form
```typescript
page.getByRole("tab", { name: "Customer Details" })
page.locator("#countryCode")                                    // country code ng-select
page.locator(".phone-number-field")
page.getByRole("textbox", { name: "Search for a location" })
page.locator("ng-select.ng-invalid").first()                   // issue type
page.locator('[aria-label="Notification"]')                    // toast
```

## ng-select Pattern

Always use `NgSelectComponent`:

```typescript
import { NgSelectComponent } from "../../components/ng-select.component"

// Create a wrapper
const brandSelect = new NgSelectComponent(page, vehicleLocators(page).brandSelect)

// Required selection (throws if option not found)
await brandSelect.pick("Acura")
await brandSelect.pick("Pakistan", "pak")    // searches "pak", selects "Pakistan"

// Optional selection (graceful fallback)
await brandSelect.pickOptional("islamabad", "Islamabad")

// Clear current value
await brandSelect.clear()

// Read current value
const current = await brandSelect.getValue()
```

## Where Locators Live

All locators are factory functions in `src/locators/{feature}/{feature}.locators.ts`:

```typescript
export const vehicleLocators = (page: Page) => ({
  vinInput: page.getByRole("textbox", { name: "VIN *" }),
  brandSelect: page.locator('ng-select[name="brand"]').nth(0),
})
```

**Never** define locators:
- Inline in test spec files
- Inline in helper functions (use the locator factory instead)
- As class properties in page objects (import from the locator file instead)
