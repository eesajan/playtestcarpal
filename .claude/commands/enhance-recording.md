# Recorder Enhancement Agent

You are the **Recorder Enhancement Agent** for this Playwright automation repository.

## Trigger
Run when the user provides: a raw Playwright recording (from `npx playwright codegen` or `page.pause()` Inspector), or asks to "clean up", "improve", or "make production-ready" a recorded spec file.

## Input
`$ARGUMENTS` — path to the recorded spec file, e.g. `generated-tests/record-more-flow.spec.ts`

## Execution Workflow

### Step 1 — Read the recording
Read the file at the path provided in `$ARGUMENTS`.

### Step 2 — Static analysis
Before calling any agent, identify these issues yourself:

| Issue | Look for |
|---|---|
| Inline helpers | `async function login(`, `async function selectNgOption(`, `async function getRandomValidVin(` |
| External services | `randomvin.com`, any `goto()` to third-party URLs for data |
| Hardcoded creds | String literals matching passwords or usernames |
| Brittle CSS | `locator(` strings > 60 chars, chains of `.ng-select.ng-select-single...` |
| nth() fragility | `.nth(0)`, `.nth(1)` on generic locators |
| Missing assertions | Fewer than 3 `expect(` calls |
| Missing steps | No `test.step(` wrapping |
| Inline test data | Magic strings or numbers scattered through the test body |
| Recording artifacts | `page.pause()` calls |

### Step 3 — Read the framework
Read these files so you know what to import:
```
jira-playwright-generator/src/helpers/carpal.helpers.ts
jira-playwright-generator/src/helpers/vin.helper.ts
jira-playwright-generator/src/fixtures/auth.fixture.ts
jira-playwright-generator/src/components/ng-select.component.ts
jira-playwright-generator/src/pages/create-vehicle.page.ts
jira-playwright-generator/src/pages/create-case.page.ts
```

### Step 4 — Enhance via Agent or directly
Option A — Use the agent script:
```bash
cd jira-playwright-generator && tsx src/agents/recorder-enhancer.ts --input "$ARGUMENTS"
```
The enhanced file will be written to the same directory with `-enhanced` suffix.

Option B — Enhance directly using your knowledge from Steps 1–3.

### Step 5 — Enhancement checklist (apply every item)
- [ ] Replace inline `login()` with `import { login } from "../src/helpers/carpal.helpers"`
- [ ] Replace inline `selectNgOption()` with `new NgSelectComponent(page, locator).pick(option)`
- [ ] Replace `getRandomValidVin()` / randomvin.com with `import { generateVin } from "../src/helpers/vin.helper"`
- [ ] Remove `page.pause()` (recording artifact)
- [ ] Replace CSS chains > 60 chars with `getByRole`/`getByLabel`/`getByTestId`
- [ ] Replace `.nth(N)` on non-semantic locators with context-scoped alternatives
- [ ] Add `test.step()` for login, data setup, navigation, form fill, assertion phases
- [ ] Add 3+ assertions: URL match after login, heading after navigation, success state after action
- [ ] Move all magic strings to a typed `const data = { ... }` at the top
- [ ] Replace hardcoded credentials with `process.env.CARPAL_USERNAME` / `CARPAL_PASSWORD`
- [ ] Add `test.use({ permissions: ["geolocation"], geolocation: ... })` if location used

### Step 6 — Write the enhanced file
Write to `jira-playwright-generator/generated-tests/<original-name>-enhanced.spec.ts`
OR overwrite the original if the user explicitly requests it.

### Step 7 — Output improvement summary
Tell the user:
- **Issues fixed:** numbered list of what was changed and why
- **Locators improved:** old → new for each replaced locator
- **Still fragile:** any locators that couldn't be improved without app changes
- **Output file:** path to the enhanced spec

## Rules
- NEVER modify the original file without explicit user confirmation.
- NEVER leave inline duplicates of shared helpers.
- NEVER remove an assertion — only add or improve them.
- If a brittle locator cannot be safely replaced, add a comment explaining why and flag it to the user.
