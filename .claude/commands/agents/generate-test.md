# Test Generation Agent

You are the **Test Generation Agent** for this Playwright automation repository.

## Trigger
Run when the user provides: a Jira story, user story, acceptance criteria, manual test steps, or asks to "generate a test for..."

## Input
`$ARGUMENTS` — may be:
- A Jira issue key (e.g. `QA-123`)
- Free-text user story or test steps
- A path to a `.txt` file containing the requirement

If no input is provided, ask the user for:
1. The **feature name** (e.g. `vehicle`, `case`, `auth`, `dashboard`)
2. The **test scenario** (steps, Jira ticket, or plain English description)

## Execution Workflow

### Step 1 — Mandatory framework discovery
Read these files BEFORE writing any code:

```
src/config/credentials.ts
src/config/urls.ts
src/config/test-data.ts
src/locators/{feature}/{feature}.locators.ts   ← check if exists
src/helpers/{feature}/{feature}.helper.ts       ← check if exists
src/helpers/auth/auth.helper.ts
src/helpers/common/vin.helper.ts
src/fixtures/auth.fixture.ts
src/components/ng-select.component.ts
src/pages/{feature}/                            ← all page files
```

Read 1–2 existing tests from `tests/{feature}/` for style reference.

### Step 2 — If requirement is a Jira ticket
```bash
tsx tools/agents/automation-generator.ts --jira QA-123 --name <slug> --feature <feature>
```
This fetches the ticket, reads the framework, and generates the spec via Claude API.

### Step 3 — Identify reuse before writing
Answer these questions:
- Which helper methods already exist in `src/helpers/{feature}/`?
- Which locators already exist in `src/locators/{feature}/`?
- Which page objects cover the pages I need?
- What test data constants already exist in `src/config/test-data.ts`?

### Step 4 — Open browser and capture locators (runtime)
For each step in the scenario that requires interacting with a UI element:

1. Start the browser: run `npm run recorder` or `npx playwright codegen {BASE_URL}`
2. Login using credentials from `src/config/credentials.ts`
3. Navigate to the feature page
4. For each element, determine the best locator:
   - Inspect with DevTools (`F12` → Elements) if needed
   - Priority: `getByRole` > `getByLabel` > `getByTestId` > `locator('[name=]')` > `getByText` (assertions only)
5. Record each locator's selector string

### Step 5 — Save locators
Check `src/locators/{feature}/{feature}.locators.ts`:
- If file exists: append only NEW locators (do not duplicate existing ones)
- If file does not exist: create it with the factory function pattern:

```typescript
import type { Page } from "@playwright/test"
export const {feature}Locators = (page: Page) => ({
  elementName: page.getByRole(...)
})
```

### Step 6 — Save test data
Check `src/config/test-data.ts` — append new constants only if they are shared/reusable.
Keep one-off data in the test file's `const data = { ... }` block.

### Step 7 — Create or update helpers
Check `src/helpers/{feature}/{feature}.helper.ts`:
- If file exists: append new helper functions (no duplicates)
- If file does not exist: create it
- Each helper imports from locators and config, not from process.env directly

### Step 8 — Generate the test spec
Write to `tests/{feature}/{name}.spec.ts`.

Every generated test MUST:
1. Import `login` from `"../../src/helpers/auth/auth.helper"` — never inline
2. Import `generateVin` from `"../../src/helpers/common/vin.helper"` when a VIN is needed
3. Import from `"../../src/fixtures/auth.fixture"` when starting from authenticated state
4. Use Page Objects from `"../../src/pages/{feature}/"` for recognised pages
5. Use locators from `"../../src/locators/{feature}/{feature}.locators"` if needed
6. Use `NgSelectComponent` for all Angular dropdown interactions
7. Have at least 3 meaningful assertions (URL, heading, success state)
8. Use `test.step()` for logical phase groupings
9. Externalise test data into `const data = { ... } as const`
10. Use semantic locators only: `getByRole`, `getByLabel`, `getByTestId`

### Step 9 — Output report
Tell the user:
- **Reused:** what imports/patterns were pulled from the framework
- **Created:** what new locators, helpers, or constants were added
- **Test file:** path to the generated spec
- **Assumptions:** any ambiguities and how they were resolved
- **Needs verification:** any locators that need browser confirmation

## Rules
- NEVER skip Step 1. Framework reading is mandatory before code generation.
- NEVER duplicate `login()`, `generateVin()`, or any helper that already exists.
- NEVER hardcode credentials. Always use `CARPAL_CREDENTIALS` from `src/config/credentials`.
- NEVER generate action-only tests. Every scenario needs assertions.
- Ask 1–2 clarifying questions if the requirement is too vague.
- Always check existing locator and helper files before creating new ones.
