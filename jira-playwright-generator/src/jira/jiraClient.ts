import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

function isPlaceholder(value: string | undefined, placeholder: RegExp): boolean {
  return !value || placeholder.test(value);
}

const missingOrPlaceholder = [
  isPlaceholder(JIRA_BASE_URL, /your-domain/i) ? "JIRA_BASE_URL" : undefined,
  isPlaceholder(JIRA_EMAIL, /your-email/i) ? "JIRA_EMAIL" : undefined,
  isPlaceholder(JIRA_API_TOKEN, /your-jira-api-token/i) ? "JIRA_API_TOKEN" : undefined
].filter(Boolean);

if (missingOrPlaceholder.length) {
  throw new Error(
    `Missing real Jira configuration for ${missingOrPlaceholder.join(", ")}. Update .env before running npm run generate.`
  );
}

const jiraBaseUrl = JIRA_BASE_URL as string;
const jiraEmail = JIRA_EMAIL as string;
const jiraApiToken = JIRA_API_TOKEN as string;

export const jiraClient = axios.create({
  baseURL: jiraBaseUrl,
  auth: {
    username: jiraEmail,
    password: jiraApiToken
  },
  headers: {
    Accept: "application/json"
  }
});
