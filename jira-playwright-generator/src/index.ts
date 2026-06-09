import fs from "fs";
import path from "path";
import { fetchTestCases } from "./jira/fetchTestCases";
import { parseDescription } from "./parser/parseDescription";
import { normalizeActions } from "./parser/normalizeActions";
import { generateSpec } from "./generator/generateSpec";
import { safeFileName } from "./utils/safeFileName";

const outputDir = path.resolve("generated-tests");

async function main(): Promise<void> {
  fs.mkdirSync(outputDir, { recursive: true });

  const jiraTestCases = await fetchTestCases();

  if (!jiraTestCases.length) {
    console.log("No Jira test cases found for the configured JQL.");
    return;
  }

  for (const jiraCase of jiraTestCases) {
    const parsed = parseDescription(jiraCase);
    const normalized = normalizeActions(parsed);
    const spec = generateSpec(normalized);
    const fileName = `${safeFileName(jiraCase.key)}-${safeFileName(jiraCase.title)}.spec.ts`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, spec, "utf-8");
    console.log(`Generated ${filePath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
