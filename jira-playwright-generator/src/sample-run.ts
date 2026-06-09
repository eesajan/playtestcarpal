import fs from "fs";
import path from "path";
import { parseDescription } from "./parser/parseDescription";
import { normalizeActions } from "./parser/normalizeActions";
import { generateSpec } from "./generator/generateSpec";

const sample = `Pre-req: Browser should be opened and application URL should be accessible
Steps:
When Fresh web app is launched, click on Next button on "Improve Your Morning, Love your life" screen.
Again click on "Next" button on 6 quick routines to win everyday.
Now click on "Login" button. Login screen should appear
Now Enter the email -> mmqa100@mailinator.com
Enter password -> Dpl@1234
Tap on Login button.
User should see the Reminder screen, Tap on Next.
A Modal will appear Tap "OK" on that
Expected Result:
User should land on home screen with a tooltip appearing with partial text: "Tip: Quickly access tracks and activities"`;

const parsed = parseDescription({
  key: "SAMPLE-1",
  title: "Fresh login onboarding flow",
  descriptionText: sample
});

const normalized = normalizeActions(parsed);
const spec = generateSpec(normalized);

const outputDir = path.resolve("generated-tests");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "sample-1-fresh-login-onboarding-flow.spec.ts"), spec, "utf-8");

console.log("Generated generated-tests/sample-1-fresh-login-onboarding-flow.spec.ts");
console.log("\nNormalized actions:");
console.log(JSON.stringify(normalized.actions, null, 2));
