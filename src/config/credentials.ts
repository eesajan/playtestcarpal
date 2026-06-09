import dotenv from "dotenv";

dotenv.config();

export const CARPAL_CREDENTIALS = {
  username: process.env.CARPAL_USERNAME ?? "",
  password: process.env.CARPAL_PASSWORD ?? "",
} as const;

export const JIRA_CREDENTIALS = {
  baseUrl: process.env.JIRA_BASE_URL ?? "",
  email: process.env.JIRA_EMAIL ?? "",
  apiToken: process.env.JIRA_API_TOKEN ?? "",
  jql: process.env.JIRA_JQL ?? "",
  fields: process.env.JIRA_FIELDS ?? "summary,description",
} as const;

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
