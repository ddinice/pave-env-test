# Design Variable Registry

## Local setup

For a fresh clone, ensure Docker is running, then use these exact commands from
this `case-study` directory:

```sh
npm ci
npx playwright install chromium
docker compose up --build -d
for attempt in $(seq 1 60); do
  if curl --fail --silent --show-error --output /dev/null http://localhost:3000/login; then break; fi
  if [ "$attempt" -eq 60 ]; then docker compose logs --tail=100 web; exit 1; fi
  sleep 1
done
npm run test:unit
npm run test:e2e
```

For a live log stream while troubleshooting, run `docker compose logs -f web` and
use `Ctrl-C` to stop following logs without stopping the stack. When the readiness
loop completes, the application is available at <http://localhost:3000> and
redirects to `/login`.

Stop the local runtime with:

```sh
docker compose down -v
```

## Local runtime acceptance checklist

```sh
docker compose up --build -d
for attempt in $(seq 1 60); do
  if curl --fail --silent --show-error --output /dev/null http://localhost:3000/login; then break; fi
  if [ "$attempt" -eq 60 ]; then docker compose logs --tail=100 web; exit 1; fi
  sleep 1
done
# Expected: web is available at http://localhost:3000 and redirects to /login.
# The web entrypoint waits for Postgres, applies migrations, and runs the idempotent seed.

docker compose down -v
# Expected: deletes only these case-study Docker volumes.
```

This is a standalone Next.js application. Its Docker Compose stack runs an isolated
Postgres database and web service. After Postgres is healthy, the web entrypoint
runs `prisma migrate deploy`, runs the idempotent seed, and then starts Next.js.

## Seed credentials

| Role | Email | Password |
| --- | --- | --- |
| Analyst | `analyst@case-study.local` | `analyst-password` |
| Engineering lead | `lead@case-study.local` | `lead-password` |

The seed upserts these two users and 32 stable-key design variables across EPS,
Thermal, Structures, and Communications, so re-running it does not create duplicates.

## Read-only API example

`GET /api/v1/design-variables` is an authenticated, read-only collection example.
It uses the same browser session cookie as the web application; there are no API
tokens or credentials. After signing in through the browser, a request can be made
with that browser session cookie:

```sh
curl --cookie "case_study_session=<browser-session-cookie>" \
  "http://localhost:3000/api/v1/design-variables?subsystem=EPS&query=battery"
```

This is a pattern for candidates to extend, not an authentication approach for
unattended local scripts. The endpoint only returns stable design-variable records;
it does not provide saved selections, downloads, or write operations.

## Tests

Run the isolated browser suite with Docker available:

```sh
npm run test:e2e
# A single spec (or any Playwright arguments) is passed through unchanged.
npm run test:e2e -- tests/e2e/manual-edit.spec.ts
```

The script starts only the `db-e2e` Postgres 16 service on host port `5433`, using
database `case_study_e2e`, its own `case-study-e2e-db-data` volume, and the distinct
`case-study-e2e` Compose project. It exports the E2E `DATABASE_URL` and test-only
`SESSION_SECRET`, applies migrations, and starts Next.js on port `3100` through
Playwright. Every scenario resets and reseeds that database before signing in, and
the script always removes only the E2E service and volume when it exits (including
after a failed test).
