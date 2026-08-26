#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/case_study_e2e"
export SESSION_SECRET="case-study-e2e-session-secret"

compose=(docker compose -p case-study-e2e -f docker-compose.e2e.yml)

cleanup() {
  "${compose[@]}" down --volumes --remove-orphans
}
trap cleanup EXIT INT TERM

"${compose[@]}" up --detach --wait
npx prisma migrate deploy
npx tsx tests/helpers/reset-database.ts
npx playwright test "$@"
