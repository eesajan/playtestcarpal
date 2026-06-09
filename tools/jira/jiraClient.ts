import axios from "axios";
import { JIRA_CREDENTIALS } from "../../src/config/credentials";

function isPlaceholder(value: string, placeholder: RegExp): boolean {
  return !value || placeholder.test(value);
}

const missingOrPlaceholder = [
  isPlaceholder(JIRA_CREDENTIALS.baseUrl, /your-domain/i) ? "JIRA_BASE_URL" : undefined,
  isPlaceholder(JIRA_CREDENTIALS.email, /your-email/i) ? "JIRA_EMAIL" : undefined,
  isPlaceholder(JIRA_CREDENTIALS.apiToken, /your-jira-api-token/i) ? "JIRA_API_TOKEN" : undefined
].filter(Boolean);

if (missingOrPlaceholder.length) {
  throw new Error(
    `Missing real Jira configuration for ${missingOrPlaceholder.join(", ")}. Update .env before running npm run generate.`
  );
}

export const jiraClient = axios.create({
  baseURL: JIRA_CREDENTIALS.baseUrl,
  auth: {
    username: JIRA_CREDENTIALS.email,
    password: JIRA_CREDENTIALS.apiToken
  },
  headers: {
    Accept: "application/json"
  }
});
