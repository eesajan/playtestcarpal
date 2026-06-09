# Naming Conventions Reference

Use this skill when: naming new files, functions, variables, or test cases.

## File Naming

| Type | Pattern | Example |
|---|---|---|
| Locator file | `{feature}.locators.ts` | `vehicle.locators.ts` |
| Helper file | `{feature}.helper.ts` | `vehicle.helper.ts` |
| Page object | `{page-name}.page.ts` | `create-vehicle.page.ts` |
| Component | `{name}.component.ts` | `ng-select.component.ts` |
| Fixture | `{name}.fixture.ts` | `auth.fixture.ts` |
| Auth setup | `{name}.setup.ts` | `auth.setup.ts` |
| Test spec | `{description}.spec.ts` | `create-vehicle.spec.ts` |
| Config | `{purpose}.ts` | `credentials.ts`, `urls.ts`, `test-data.ts` |

## Folder Naming

| Folder | Convention | Examples |
|---|---|---|
| Feature folders | `kebab-case` singular | `auth/`, `vehicle/`, `case/`, `dashboard/` |
| Test feature folders | same as src | `tests/auth/`, `tests/vehicle/`, `tests/case/` |

## Function Naming

| Type | Convention | Examples |
|---|---|---|
| Locator factory | `{feature}Locators` | `loginLocators`, `vehicleLocators`, `caseLocators` |
| Helper function | verb + noun in camelCase | `login`, `fillVehicleForm`, `fillCustomerPhone`, `dismissToast` |
| Page class | PascalCase + Page suffix | `LoginPage`, `CreateVehiclePage`, `CreateCasePage` |
| Component class | PascalCase + Component suffix | `NgSelectComponent` |
| Fixture type | PascalCase + Fixtures suffix | `CarpalFixtures` |
| Exported constant | SCREAMING_SNAKE_CASE | `CARPAL_CREDENTIALS`, `BASE_URL`, `ENDPOINTS`, `DEFAULT_VEHICLE_DATA` |

## Test Naming

```typescript
// Format: "CarPal QA: <what the system should do>"
test("CarPal QA: system should login successfully")
test("CarPal QA: user can create a temporary case with vehicle")
test("CarPal QA: case should save with customer phone number")

// test.describe: group name
test.describe("Vehicle Creation", () => { ... })
test.describe("Case Management", () => { ... })

// test.step: verb phrase
await test.step("Log in", ...)
await test.step("Open temporary case vehicle form", ...)
await test.step("Fill vehicle information", ...)
await test.step("Create vehicle and case", ...)
await test.step("Assert result", ...)
```

## Variable Naming in Tests

```typescript
// Test data block — always const, always typed
const data = {
  vin: generateVin(),
  brand: "Acura",
  model: "CL",
} as const;

// Page objects — camelCase, descriptive
const vehiclePage = new CreateVehiclePage(page)
const casePage = new CreateCasePage(page)

// Locator variables (when used directly) — camelCase
const l = vehicleLocators(page)

// Dynamic values — camelCase
const vin = generateVin()
```

## Import Path Conventions

From `tests/{feature}/`:
```typescript
import { login } from "../../src/helpers/auth/auth.helper"
import { generateVin } from "../../src/helpers/common/vin.helper"
import { test, expect } from "../../src/fixtures/auth.fixture"
import { CreateVehiclePage } from "../../src/pages/vehicle/create-vehicle.page"
import { vehicleLocators } from "../../src/locators/vehicle/vehicle.locators"
import { DEFAULT_VEHICLE_DATA } from "../../src/config/test-data"
import { NgSelectComponent } from "../../src/components/ng-select.component"
```

From `src/helpers/{feature}/`:
```typescript
import { CARPAL_CREDENTIALS } from "../../config/credentials"
import { BASE_URL, ENDPOINTS } from "../../config/urls"
import { vehicleLocators } from "../../locators/vehicle/vehicle.locators"
import { NgSelectComponent } from "../../components/ng-select.component"
```

From `src/pages/{feature}/`:
```typescript
import { BasePage } from "../base.page"
import { vehicleLocators } from "../../locators/vehicle/vehicle.locators"
import { NgSelectComponent } from "../../components/ng-select.component"
```
