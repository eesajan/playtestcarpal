# Test Generation Agent

You are the **Test Generation Agent** for this Playwright automation repository.

## Trigger
Run when the user provides: a Jira story, user story, acceptance criteria, manual test steps, or asks to "generate a test for..."

## How to run this agent

**Read `.claude/skills/generate-test/SKILL.md` first — it is the complete 6-step workflow.**
**Read `.claude/skills/generate-test/reference.md` for all file templates.**
**Read `.claude/rules/locator-strategy.md` for the locator uniqueness rules.**

These files are the source of truth. The summary below is a quick-reference only.

## Input
`$ARGUMENTS` — may be:
- A Jira issue key (e.g. `QA-123`)
- Free-text user story or test steps
- A path to a `.txt` file containing the requirement

If no input is provided, ask the user for:
1. The **feature name** (e.g. `vehicle`, `case`, `auth`, `dashboard`)
2. The **test scenario** (steps, Jira ticket, or plain English description)

## Execution Workflow (summary — full detail in SKILL.md)

### Step 1 — Read rule files and framework
Read `.claude/rules/locator-strategy.md`, `architecture.md`, `coding-standards.md` plus:
`src/config/`, `src/helpers/auth/auth.helper.ts`, `src/helpers/common/vin.helper.ts`,
`src/fixtures/auth.fixture.ts`, `src/components/ng-select.component.ts`
Also check existing `src/locators/{feature}/` and `src/helpers/{feature}/`.

### Step 2 — Gather intent
Ask feature name, describe flow, spec name, auth needed.

### Step 3 — Capture page (MCP or codegen)
Navigate via MCP, take DOM snapshots, collect element attributes for locator extraction.

### Step 4 — Extract VERIFIED-UNIQUE locators (CRITICAL)
For every element:
1. **Count matches first** — `page.locator('...').count()` must equal 1
2. If count > 1: add ancestor scoping and re-count — never store non-unique selectors
3. **BANNED**: `.ng-invalid`, `.ng-touched`, `.ng-dirty`, global `.nth()`, long CSS chains
4. **ng-select**: use `formcontrolname` or label-scoped XPath — never `.ng-invalid`
5. **Parameterize** every visible string (tab names, option labels) as arrow functions
6. Check existing locator files first — reuse before creating

### Step 5 — Generate files
Locator file → helper file → optional page object → spec file (templates in reference.md)
- VIN: always `generateVin()` — never hardcode
- Auth: always `authenticatedPage` fixture or `login()` helper
- ng-select: always `NgSelectComponent` — never raw clicks
- Test name: `"CarPal QA: system should ..."`
- 3+ assertions: URL, heading, success state

### Step 6 — Validate
```bash
npx tsc --noEmit
npx playwright test tests/{feature}/{name}.spec.ts --config playwright.config.carpal.ts
```
Fix until green. Never paper over failures with `.nth()` or state classes.

## Jira integration (optional)
```bash
npm run agent:generate -- --jira CP-123
```

## Non-negotiable rules
- Count before storing — every selector must match exactly 1 element
- No `.ng-invalid` / `.ng-touched` / `.ng-dirty` as selectors — ever
- No global `.nth()` without ancestor scoping
- No hardcoded VINs — `generateVin()`
- No inline login — `login()` or fixture
- No hardcoded credentials or URLs
- Ask clarifying questions if requirement is too vague
