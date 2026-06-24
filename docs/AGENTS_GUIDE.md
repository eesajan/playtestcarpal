# How to Use the CarPal Test Agents

Two agents can write automated tests for you. You describe what to test — the agent writes the code.

---

## Which agent do I use?

| I want to… | Use |
|---|---|
| Describe a flow and have the agent build the test from scratch | **Generate Test** |
| Record myself clicking through the app and have the agent clean it up | **Enhance Recording** |

---

## Agent 1 — Generate Test

**What it does:** You describe the steps of a user flow in plain English. The agent opens the CarPal QA site in a browser, clicks through the flow itself, writes stable selectors, and produces a ready-to-run test file.

### How to use it

**Step 1 — Open Claude Code** in the project folder.

**Step 2 — Type in chat:**
```
/generate-test
```
or just describe what you want:
```
generate a test for creating a vehicle and opening a case
```

**Step 3 — Answer the agent's questions.** It will ask:
- What feature is this? (e.g. `vehicle`, `case`, `dashboard`)
- What are the steps? Describe them in plain English:
  > "Log in, click Create Case, click Create Temporary Case, fill in the brand as Acura, model as CL, year 2027, click Create Vehicle, then verify the case form opens"
- What should the test be called?
- Does it need login first? (almost always yes)

**Step 4 — Watch it work.** The agent will:
1. Open a browser and navigate to CarPal QA
2. Click through the steps you described
3. Inspect each element it touches to find a stable, unique selector
4. Write the locator file, helper functions, and test spec
5. Run the test once to confirm it passes

**Step 5 — Review the output.** The agent will tell you exactly which files it created.

### Example conversation

```
You:    generate a test for logging in successfully

Agent:  What feature folder should this go in? (auth, vehicle, case, dashboard)

You:    auth

Agent:  Describe the steps you want to verify.

You:    Go to the login page, enter valid credentials, verify it lands on the dashboard

Agent:  [opens browser, captures locators, writes test, runs it]
        ✅ Test created at tests/auth/login-success.spec.ts — PASSED
```

---

## Agent 2 — Enhance Recording

**What it does:** You record yourself clicking through the app using the built-in recorder. The recording is messy raw code. The moment you close the browser, the agent kicks in automatically — it reads the recording, fixes every problem (brittle selectors, hardcoded passwords, missing checks), writes a clean production-ready test, and deletes the raw recording.

### How to use it

**Step 1 — Start the recorder:**
```bash
npm run recorder
```
A browser opens at the CarPal QA login page.

**Step 2 — Click through your flow.** Log in and use the app normally — navigate to the page, fill forms, click buttons. The recorder writes code automatically.

**Step 3 — Close the browser.** That's it. The agent starts automatically.

The agent will:
1. Read your recording
2. Fix every problem it finds (hardcoded passwords, fragile selectors, missing steps, missing assertions)
3. Save the clean version to `tests/{feature}/your-flow-enhanced.spec.ts`
4. Delete the raw recording

### Example output

```
Recording saved (1 743 bytes). Starting AI enhancement...
────────────────────────────────────────────────────────────
Issues fixed:
  CRITICAL:
  - Hardcoded password "Admin@12" → replaced with CARPAL_CREDENTIALS from config
  - Login inlined → replaced with login() helper from auth.helper.ts
  - ng-select via .ng-arrow-wrapper → replaced with NgSelectComponent
  WARNINGS:
  - No test.step() groupings → added 3 phases
  - Only 1 implicit assertion → added URL check, heading check, success state
  - VIN hardcoded → replaced with generateVin()

✅ Enhanced spec saved to tests/case/update-case-enhanced.spec.ts
Raw recording deleted: recordings/latest.spec.ts
────────────────────────────────────────────────────────────
Done! Check tests/case/ for the enhanced spec.
```

### If auto-enhance fails

The raw recording is preserved at `recordings/latest.spec.ts`. Open Claude Code and type:
```
/agents:enhance-recording
```
The agent will pick it up and run the full enhancement manually.

---

## What you'll get as output

For both agents, the final output is always:

| File | What it is |
|---|---|
| `src/locators/{feature}/{feature}.locators.ts` | The stable selectors for each button/input/dropdown |
| `src/helpers/{feature}/{feature}.helper.ts` | Reusable actions (fill form, submit, etc.) |
| `tests/{feature}/{name}.spec.ts` | The actual test that runs in CI |

---

## Things to know

**You don't need to write any code.** Just describe the flow in plain English or record it.

**The agent always verifies its own selectors** — it counts how many elements each selector matches and only uses ones that match exactly 1. This is why the tests don't break when the page layout changes slightly.

**VINs are always auto-generated** — the agent never hardcodes a VIN. Each test run uses a fresh valid VIN so tests don't interfere with each other.

**Login is handled automatically** — the agent uses stored credentials from the `.env` file. You never type passwords into test code.

**If a selector can't be found reliably** — the agent will add a `TODO_VERIFY_DOM:` comment explaining exactly what to look for in the app's source. This is rare but happens when two elements share the same attribute.

---

## Prerequisites (first-time setup)

### Required for both agents

**1. Create your `.env` file** — copy `.env.example` and fill in the values (ask your tech lead):
```
CARPAL_USERNAME=your_username
CARPAL_PASSWORD=your_password
ANTHROPIC_API_KEY=your_key      ← needed for npm run agent:* scripts
```

**2. Install dependencies:**
```bash
npm install
```

**3. Install Playwright browsers** (first time only):
```bash
npx playwright install chromium
```

---

### Required for Generate Test (Agent 1) only

**4. Add Playwright MCP to Claude Code** — this lets the agent open a real browser during test generation:
```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```
Verify it's connected: open Claude Code → type `/mcp` → confirm `playwright` appears in the list.

---

### Required for Enhance Recording auto-mode (Agent 2)

**5. Claude Code CLI must be on your PATH** — the recorder script calls `claude` after recording ends.

Verify:
```bash
claude --version
```
If not found, install from [claude.ai/download](https://claude.ai/download) or:
```bash
npm install -g @anthropic-ai/claude-code
```

---

Once all steps above are done, both agents work from a single action — describe a flow or close the browser.
