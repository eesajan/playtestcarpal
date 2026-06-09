import { jiraClient } from "./jiraClient";
import { adfToText } from "../utils/adfToText";

export type JiraTestCase = {
  key: string;
  title: string;
  descriptionText: string;
};

type JiraIssue = {
  key: string;
  fields: Record<string, unknown> & {
    summary?: string;
    description?: unknown;
  };
};

export async function fetchTestCases(): Promise<JiraTestCase[]> {
  const jql = process.env.JIRA_JQL;
  const fields = process.env.JIRA_FIELDS || "summary,description";

  if (!jql) throw new Error("Missing JIRA_JQL in .env");

  const response = await jiraClient.get("/rest/api/3/search/jql", {
    params: {
      jql,
      fields,
      maxResults: 100
    }
  });

  const issues = response.data.issues as JiraIssue[];

  return issues.map((issue) => ({
    key: issue.key,
    title: issue.fields.summary || issue.key,
    descriptionText: adfToText(issue.fields.description)
  }));
}
