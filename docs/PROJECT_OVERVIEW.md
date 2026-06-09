# Project Overview

## What is CarPal?

CarPal is an Angular-based roadside assistance platform. The QA environment is at `https://qa.carpal.com`.

### Key User Flows
- **Login** — CSA (Customer Service Agent) authenticates via username/password
- **Create Vehicle** — Multi-field form with Angular `ng-select` dropdowns (brand, model, year, country, city)
- **Create Case** — Multi-tab form (Vehicle & Owner, Customer Details, Pickup Location, Reported Issue, Jobs)
- **Pickup Location** — Requires geolocation permission for map-based search

### Angular Quirks
- All dropdowns use `ng-select` — must use `NgSelectComponent` wrapper, never raw DOM interactions
- CarPal uses `name="brand"` for both the vehicle make AND model selectors — distinguished by `.nth(0)` and `.nth(1)` (documented quirk, not a bug)
- Post-login URL pattern: `/bu/dashboard`
- Case detail page heading: `/Case Details/i`

## Technology Stack

| Concern | Choice |
|---|---|
| Language | TypeScript ESNext (ESM, `"type": "module"`) |
| Test runner | `@playwright/test` |
| Runtime | `tsx` (no build step) |
| HTTP | `axios` (Jira API) |
| AI | `@anthropic-ai/sdk` (agent tools) |
| Config | `dotenv` |

## Test Coverage Map

| Feature | Covered | Files |
|---|---|---|
| Login / Auth | ✓ | `tests/auth/login.spec.ts` |
| Create Vehicle | ✓ | `tests/vehicle/create-vehicle.spec.ts` |
| Create Case | Partial | `tests/case/` |
| Case with Job | Partial | recorded flows |
| Pickup Location | Partial | recorded flows |

## Four Agent Tools

| Tool | Invoked via | Purpose |
|---|---|---|
| Architect | `/agents:architect` | Audit framework health |
| Generate Test | `/agents:generate-test` | Story/Jira → spec with runtime locators |
| Enhance Recording | `/agents:enhance-recording` | Raw recording → production code |
| Code Review | `/agents:code-review` | Detect anti-patterns and violations |
