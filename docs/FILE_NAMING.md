# File Naming Conventions

See also: `/skills:naming-conventions` for the full reference with examples.

## Quick Reference

| File type | Pattern | Location | Example |
|---|---|---|---|
| Locators | `{feature}.locators.ts` | `src/locators/{feature}/` | `vehicle.locators.ts` |
| Helpers | `{feature}.helper.ts` | `src/helpers/{feature}/` | `case.helper.ts` |
| Page object | `{page-name}.page.ts` | `src/pages/{feature}/` | `create-vehicle.page.ts` |
| Component | `{name}.component.ts` | `src/components/` | `ng-select.component.ts` |
| Fixture | `{name}.fixture.ts` | `src/fixtures/` | `auth.fixture.ts` |
| Auth setup | `{name}.setup.ts` | `tests/auth/` | `auth.setup.ts` |
| Test spec | `{description}.spec.ts` | `tests/{feature}/` | `create-vehicle.spec.ts` |
| Config | `{purpose}.ts` | `src/config/` | `credentials.ts` |
| Tool/script | `{name}.ts` or `{name}.mjs` | `tools/` or `scripts/` | `framework-architect.ts` |

## Folder Structure Overview

```
playtestcarpal/
├── src/
│   ├── config/                  ← credentials.ts  urls.ts  test-data.ts
│   ├── locators/
│   │   ├── auth/               ← login.locators.ts
│   │   ├── dashboard/          ← dashboard.locators.ts
│   │   ├── vehicle/            ← vehicle.locators.ts
│   │   └── case/               ← case.locators.ts
│   ├── helpers/
│   │   ├── auth/               ← auth.helper.ts
│   │   ├── vehicle/            ← vehicle.helper.ts
│   │   ├── case/               ← case.helper.ts
│   │   └── common/             ← vin.helper.ts
│   ├── pages/
│   │   ├── base.page.ts
│   │   ├── auth/               ← login.page.ts
│   │   ├── dashboard/          ← dashboard.page.ts
│   │   ├── vehicle/            ← create-vehicle.page.ts
│   │   └── case/               ← create-case.page.ts
│   ├── components/             ← ng-select.component.ts
│   └── fixtures/               ← auth.fixture.ts
├── tests/
│   ├── auth/                   ← auth.setup.ts  login.spec.ts
│   ├── vehicle/                ← create-vehicle.spec.ts
│   └── case/                   ← create-case.spec.ts
├── tools/
│   ├── agents/                 ← framework-architect.ts  etc.
│   ├── jira/                   ← jiraClient.ts  fetchTestCases.ts
│   ├── generator/              ← generateSpec.ts
│   ├── parser/                 ← types.ts  parseDescription.ts  normalizeActions.ts
│   └── utils/                  ← adfToText.ts  safeFileName.ts
└── scripts/                    ← open-recorder.mjs  open-carpal-browser.mjs
```

## Feature Folder Rules

1. A "feature" = one area of the app (auth, vehicle, case, dashboard)
2. Each feature has the same subfolder name in `locators/`, `helpers/`, `pages/`, and `tests/`
3. Adding a new feature: create all four folders at once
4. Feature folder names: `kebab-case`, singular (not plural)

## Case Study: Adding a "Reports" Feature

```
src/locators/reports/reports.locators.ts
src/helpers/reports/reports.helper.ts
src/pages/reports/reports-list.page.ts
tests/reports/view-reports.spec.ts
```
