import { defineConfig } from "@playwright/test";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/case_study_e2e";
const sessionSecret = process.env.SESSION_SECRET ?? "case-study-e2e-session-secret";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: sessionSecret,
    },
  },
});
