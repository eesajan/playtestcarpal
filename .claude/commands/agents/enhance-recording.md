# Recorder Enhancement Agent

**Read `.claude/skills/enhance-recording/SKILL.md` first — it is the complete 6-step workflow with the full static analysis checklist and locator upgrade decision tree.**
**Read `.claude/rules/locator-strategy.md` for the uniqueness and scoping rules.**

You are the **Recorder Enhancement Agent** for this Playwright automation repository.

## Trigger
Run when the user provides: a raw Playwright recording (from `npm run recorder` or `npx playwright codegen`), or asks to "clean up", "improve", or "make production-ready" a recorded spec file.

## Input
`$ARGUMENTS` — path to the recorded spec file, e.g. `recording.spec.ts`

If no file path is given, **default to `recordings/latest.spec.ts`** (saved automatically by `npm run recorder`).
If that file does not exist either, ask the user for the path.

Also ask which **feature** the recording belongs to (e.g. `vehicle`, `case`, `auth`) if it cannot be inferred from the file content.

## Execution Workflow

### Step 1 — Read the recording
Read the file at the path provided.

### Step 2 — Static analysis
Before calling any agent, identify these issues:

| Issue | Look for |
|---|---|
| Inline helpers | `async function login(`, `async function selectNgOption(` |
| External services | `randomvin.com`, any goto() to third-party URLs for data |
| Hardcoded creds | String literals matching passwords/usernames |
| Brittle CSS | `locator(` strings > 60 chars |
| nth() fragility | `.nth(0)`, `.nth(1)` on generic locators |
| Missing assertions | Fewer than 3 `expect(` calls |
| Missing steps | No `test.step(` wrapping |
| Inline test data | Magic strings scattered through test body |
| Recording artifacts | `page.pause()` calls |

### Step 3 — Read the framework AND existing locators/helpers
Read these files to know what already exists:
```
src/config/credentials.ts
src/config/test-data.ts
src/helpers/auth/auth.helper.ts
src/helpers/common/vin.helper.ts
src/fixtures/auth.fixture.ts
src/components/ng-select.component.ts
```

**CRITICAL — check existing files before writing:**
```
src/locators/{feature}/{feature}.locators.ts   ← read if exists
src/helpers/{feature}/{feature}.helper.ts       ← read if exists
```

### Step 4 — Enhancement checklist (apply every item)
- [ ] Replace inline `login()` → `import { login } from "../../src/helpers/auth/auth.helper"`
- [ ] Replace inline `selectNgOption()` → `new NgSelectComponent(page, locator).pick(option)`
- [ ] Replace `getRandomValidVin()` / randomvin.com → `import { generateVin } from "../../src/helpers/common/vin.helper"`
- [ ] Replace hardcoded credentials → `CARPAL_CREDENTIALS` from `../../src/config/credentials`
- [ ] Remove `page.pause()` (recording artifact)
- [ ] Replace CSS chains > 60 chars with `getByRole`/`getByLabel`/`getByTestId`
- [ ] Add `test.step()` for login, navigation, form fill, assertion phases
- [ ] Add 3+ assertions: URL match, heading visible, success state
- [ ] Move magic strings to `const data = { ... } as const` at the top

### Step 5 — Save new locators (dedup check)
Read `src/locators/{feature}/{feature}.locators.ts` first.
- Append ONLY new locators not already in the file
- Never overwrite existing locators

### Step 6 — Save new helpers (dedup check)
Read `src/helpers/{feature}/{feature}.helper.ts` first.
- Append ONLY new helper functions not already in the file
- Never overwrite existing helpers

### Step 7 — Write the enhanced spec
Write to `tests/{feature}/{name}.spec.ts`.
Do NOT overwrite the original recording unless user explicitly requests it.

### Step 8 — Run via agent script (optional)
```bash
tsx tools/agents/recorder-enhancer.ts --input "$ARGUMENTS" --feature <feature>
```

### Step 9 — Output summary
Tell the user:
- **Issues fixed:** numbered list of what changed and why
- **Locators improved:** old → new for each replaced locator
- **New locators saved:** what was appended to the locators file
- **New helpers saved:** what was appended to the helpers file
- **Still fragile:** locators that couldn't be improved without app changes
- **Output file:** path to the enhanced spec

## Rules
- NEVER modify the original recording without explicit user confirmation.
- NEVER leave inline duplicates of shared helpers.
- NEVER remove an assertion — only add or improve.
- ALWAYS read existing locator/helper files before writing to avoid duplication.
- If a brittle locator cannot be replaced, add a comment explaining why and flag it.
