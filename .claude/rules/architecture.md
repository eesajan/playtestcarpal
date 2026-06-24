# Architecture Rules — CarPal

TypeScript ESM Playwright framework. Strict layers, no circular dependencies.

## Layer diagram

```
src/config/          ← env variables, credentials, URLs, test data (read-only source of truth)
    ↓
src/locators/        ← selector factories — pure Playwright Locator objects, no logic
    ↓
src/components/      ← Angular component wrappers (NgSelectComponent) — use locators only
    ↓
src/helpers/         ← reusable async action/assertion functions — use locators + components
    ↓
src/pages/           ← page-object classes extending BasePage — orchestrate helpers + locators
    ↓
src/fixtures/        ← Playwright test extension (authenticatedPage) — use helpers
    ↓
tests/               ← spec files — import fixtures, helpers, pages; never raw config
```

| Layer | May import from | Must NOT import from |
|---|---|---|
| config | `process.env` only | anything else |
| locators | `@playwright/test` types only | config, helpers, pages, tests |
| components | locators, `@playwright/test` | config, helpers, pages, tests |
| helpers | config, locators, components | pages, fixtures, tests |
| pages | config, locators, components, BasePage | helpers*, fixtures, tests |
| fixtures | helpers, `@playwright/test` | pages, tests |
| tests | fixtures, helpers, pages, locators, config | — |

*pages should not import helpers — they should use locators + components directly. If logic is shared between a page and a helper, extract it to a helper and call it from both.

## Hard rules

- **Locators only in `src/locators/`**. No inline complex selectors in helpers, pages, or tests.
- **NgSelectComponent** for every `<ng-select>` interaction — never manipulate ng-select internals directly.
- **`generateVin()`** from `src/helpers/common/vin.helper.ts` — never hardcode VINs, never call external services.
- **Credentials from `src/config/credentials.ts`** — never inline in tests or helpers.
- **URLs from `src/config/urls.ts`** (`BASE_URL`, `ENDPOINTS`) — never hardcode.
- **Test data from `src/config/test-data.ts`** or a `const data = {...}` block at the top of a spec — never inline in assertions.
- **Auth via `src/fixtures/auth.fixture.ts`** or `src/helpers/auth/auth.helper.ts` — never inline login.
- **`test.step()`** required for every logical phase in a spec.
- Tests import `test` and `expect` from `src/fixtures/auth.fixture.ts` (or `@playwright/test` for non-authenticated tests), never from deep paths.

## Where new things go

| New thing | Location |
|---|---|
| New env variable | `src/config/credentials.ts` or `src/config/urls.ts` |
| New test data constant | `src/config/test-data.ts` |
| New feature locators | `src/locators/{feature}/{feature}.locators.ts` |
| New Angular component wrapper | `src/components/{name}.component.ts` |
| New reusable action/assertion | `src/helpers/{feature}/{feature}.helper.ts` |
| New page object | `src/pages/{feature}/{screen}.page.ts` |
| New spec | `tests/{feature}/{name}.spec.ts` |

## Feature folder rule

Every feature (`vehicle`, `case`, `dashboard`, `auth`) has matching folders across all layers:
```
src/locators/vehicle/vehicle.locators.ts
src/helpers/vehicle/vehicle.helper.ts
src/pages/vehicle/create-vehicle.page.ts
tests/vehicle/create-vehicle.spec.ts
```

When adding a new feature, create all layers together — do not leave any layer empty.

## Import path rule

Tests import from `../../src/...` (relative to `tests/` subfolder depth). Use:
```ts
// From tests/vehicle/:
import { vehicleLocators } from "../../src/locators/vehicle/vehicle.locators";
import { fillVehicleForm } from "../../src/helpers/vehicle/vehicle.helper";
import { CreateVehiclePage } from "../../src/pages/vehicle/create-vehicle.page";
import { test, expect } from "../../src/fixtures/auth.fixture";
import { DEFAULT_VEHICLE_DATA } from "../../src/config/test-data";
import { generateVin } from "../../src/helpers/common/vin.helper";
```

No `index.ts` barrel currently exists. Import directly from the file path.
