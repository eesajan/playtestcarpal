import type { AutomationAction, NormalizedTestCase } from "../parser/types";

function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function regexEsc(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fieldLocator(field: string): string {
  const clean = field.trim();
  const safe = esc(clean);
  const rx = regexEsc(clean);

  if (/email|username/i.test(clean)) {
    return `page.getByLabel(/email|username/i).or(page.getByPlaceholder(/email|username/i)).or(page.getByTestId(\`email\`)).first()`;
  }

  if (/password/i.test(clean)) {
    return `page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).or(page.getByTestId(\`password\`)).first()`;
  }

  return `page.getByLabel(/${rx}/i).or(page.getByPlaceholder(/${rx}/i)).or(page.getByTestId(\`${safe}\`)).first()`;
}

function actionToCode(action: AutomationAction): string {
  switch (action.action) {
    case "goto":
      return `await page.goto(\`${esc(action.target)}\`);`;

    case "click": {
      const safeText = esc(action.text);
      const safeRegex = regexEsc(action.text);
      const lines: string[] = [];

      if (action.screenHint) {
        lines.push(`await expect(page.getByText(\`${esc(action.screenHint)}\`)).toBeVisible();`);
      }

      lines.push(`{
      const target = page.getByRole("button", { name: /${safeRegex}/i }).or(page.getByRole("link", { name: /${safeRegex}/i }));
      if (await target.count()) {
        await target.first().click();
      } else {
        await page.getByText(\`${safeText}\`).first().click();
      }
    }`);
      return lines.join("\n    ");
    }

    case "fill":
      return `await ${fieldLocator(action.field)}.fill(\`${esc(action.value)}\`);`;

    case "expectVisible":
      return `await expect(page.getByText(\`${esc(action.text)}\`)).toBeVisible();`;

    case "expectPartialText":
      return `await expect(page.getByText(/${regexEsc(action.text)}/i)).toBeVisible();`;

    case "comment":
      return `// ${action.text.replace(/\n/g, " ")}`;
    default:
      return `// Unsupported action`;
  }
}

export function generateSpec(testCase: NormalizedTestCase): string {
  const title = `${testCase.key}: ${testCase.title}`;
  const stepCode = testCase.actions.map((action) => `    ${actionToCode(action)}`).join("\n\n");
  const expectedCode = testCase.expectedAction ? `\n\n    ${actionToCode(testCase.expectedAction)}` : "";

  return `import { test, expect } from "@playwright/test";

test.describe(\`${esc(testCase.key)}\`, () => {
  test(\`${esc(title)}\`, async ({ page }) => {
${stepCode}${expectedCode}
  });
});
`;
}
