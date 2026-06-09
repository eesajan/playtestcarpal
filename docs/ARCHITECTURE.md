# Framework Architecture

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  .env  →  src/config/          Global variables (credentials, URLs) │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────┐
│  src/locators/{feature}/       Locator layer (Playwright Locators)  │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────┐
│  src/helpers/{feature}/        Helper layer (reusable async actions) │
│  src/components/               Shared UI wrappers (NgSelectComponent)│
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────┐
│  src/pages/{feature}/          Page Object layer (page abstractions) │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────┐
│  src/fixtures/                 Fixture layer (auth state, etc.)      │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────┐
│  tests/{feature}/              Test layer (spec files, no inlines)  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  tools/                        Developer tools (CLI scripts, agents) │
│  .claude/commands/             Claude Code slash commands            │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Separation of Locators
Locators are defined once in `src/locators/{feature}/` as factory functions. Pages, helpers, and tests all import from this layer — never define selectors inline.

### 2. Feature-based Organization
Every feature (auth, vehicle, case, dashboard) has its own subfolder in `locators/`, `helpers/`, `pages/`, and `tests/`. Adding a feature = adding four folders.

### 3. Config as the Single Source of Truth
All environment variables are typed and accessed via `src/config/`. Nothing reads `process.env` directly except the config files.

### 4. No Inline Helpers
Test spec files contain only test flow logic — no helper function definitions, no locator definitions, no credential references. Everything is imported.

### 5. Tools vs Framework
The `tools/` directory contains developer CLI scripts (Jira generator, AI agents). These are NOT imported by tests. The test framework lives exclusively in `src/`.

## Adding a New Feature

```
1. src/locators/{feature}/{feature}.locators.ts      ← locators first
2. src/helpers/{feature}/{feature}.helper.ts         ← helpers second
3. src/pages/{feature}/{page-name}.page.ts           ← page object (if needed)
4. tests/{feature}/{test-name}.spec.ts               ← test last
5. src/config/test-data.ts                           ← add shared data if needed
```

## Auth Caching

When running `npm run test:carpal`:
1. `tests/auth/auth.setup.ts` runs first → saves browser storage to `playwright/.auth/carpal.json`
2. All other tests reuse the saved session → no login overhead

To force re-login: delete `playwright/.auth/carpal.json`.

## Import Path Reference

| From | To | Import path |
|---|---|---|
| `tests/{feature}/` | auth helper | `../../src/helpers/auth/auth.helper` |
| `tests/{feature}/` | vin helper | `../../src/helpers/common/vin.helper` |
| `tests/{feature}/` | auth fixture | `../../src/fixtures/auth.fixture` |
| `tests/{feature}/` | page object | `../../src/pages/{feature}/{name}.page` |
| `tests/{feature}/` | locators | `../../src/locators/{feature}/{feature}.locators` |
| `tests/{feature}/` | test data | `../../src/config/test-data` |
| `src/helpers/{feature}/` | credentials | `../../config/credentials` |
| `src/helpers/{feature}/` | urls | `../../config/urls` |
| `src/helpers/{feature}/` | locators | `../../locators/{feature}/{feature}.locators` |
| `src/pages/{feature}/` | base page | `../base.page` |
| `src/pages/{feature}/` | locators | `../../locators/{feature}/{feature}.locators` |
