# Project Context

## Background

This is the QA automation framework for **CarPal**, a roadside assistance platform. The QA environment (`https://qa.carpal.com`) is an Angular SPA with a multi-step case management workflow.

## Why This Framework Exists

Manual regression testing of CarPal's core flows (vehicle creation, case creation, job assignment) is time-consuming and error-prone. This framework automates those flows and provides AI-powered agents to generate new tests from Jira tickets or Playwright recordings.

## Key Constraints

### Angular ng-select
All dropdown interactions require special handling. CarPal uses `ng-select` (Angular Material Select) throughout its forms. These components render differently from native `<select>` elements and require clicking the container, typing into a search input, and clicking the option. The `NgSelectComponent` wrapper handles this consistently.

### CarPal Brand/Model Quirk
On the vehicle creation form, both the vehicle make ("brand") and model use `ng-select[name="brand"]` — the same selector. They are distinguished by position: `.nth(0)` = make, `.nth(1)` = model. This is a documented quirk of the CarPal application, not a bug in the framework.

### Geolocation
The Pickup Location tab requires browser geolocation permission. Tests using this tab must include:
```typescript
test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 33.6844, longitude: 73.0479 } // Islamabad
})
```

### Auth Caching
The `playwright.config.carpal.ts` configuration uses two projects:
1. `setup` — logs in and saves session to `playwright/.auth/carpal.json`
2. `chromium` — all tests run with the cached session

This avoids logging in before every test, making the suite much faster.

## VIN Generation

VINs must be unique and algorithm-valid (ISO 3779). The `generateVin()` function in `src/helpers/common/vin.helper.ts` produces valid VINs locally using a check-digit algorithm. Never call external VIN services — they are offline risks in CI environments.

## AI Agents

Three Claude API agents assist with test automation:
- **Architect** — audits framework health, finds duplication
- **Generate Test** — creates spec files from requirements or Jira tickets
- **Enhance Recording** — converts raw recordings to production code

All three require `ANTHROPIC_API_KEY` in `.env`. The AI agents are developer tools in `tools/agents/` and are NOT part of the test suite itself.

## Jira Integration

`tools/index.ts` fetches test cases from Jira using JQL, parses the `Pre-req / Steps / Expected Result` format, and emits `.spec.ts` files. This is a legacy NLP-based generator — for new tests, use the AI Generate Test agent instead.
