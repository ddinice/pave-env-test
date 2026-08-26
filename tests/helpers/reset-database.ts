import { execFileSync } from "node:child_process";

const e2eDatabaseUrl = "postgresql://postgres:postgres@localhost:5433/case_study_e2e";

function assertE2eDatabase() {
  if (process.env.DATABASE_URL !== e2eDatabaseUrl) {
    throw new Error("Database reset is restricted to the dedicated E2E database.");
  }
}

export function resetDatabase() {
  assertE2eDatabase();
  execFileSync("npx", ["prisma", "migrate", "reset", "--force", "--skip-generate"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  execFileSync("npm", ["run", "db:seed"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
}

if (process.argv[1]?.endsWith("reset-database.ts")) resetDatabase();
