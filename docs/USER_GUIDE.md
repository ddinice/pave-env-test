# User Guide — Design Variable Registry

A registry for spacecraft design variables (bus voltage, battery capacity, thermal
limits, and similar values) with two ways to move data in and out in bulk: **Pull**
(fill a template file from the registry) and **Push** (review and apply a batch of
changes back into it), plus per-variable history and an activity feed. This guide
covers local setup and every page's functionality. For the canonical
setup/troubleshooting reference and the read-only API example, see
[`README.md`](../README.md) — this guide summarizes the same setup and then focuses
on how to actually use the app.

## Contents

- [Local setup](#local-setup)
- [Signing in](#signing-in)
- [Design Variables (`/variables`)](#design-variables-variables)
- [Variable detail page (`/variables/:externalKey`)](#variable-detail-page-variablesexternalkey)
- [Pull Variables (`/pull`)](#pull-variables-pull)
- [Push Variables (`/push`)](#push-variables-push)
- [Analysis Models (`/models`)](#analysis-models-models)
- [Activity (`/activity`)](#activity-activity)
- [Run detail (`/runs/:runId`)](#run-detail-runsrunid)
- [Roles and permissions](#roles-and-permissions)
- [Running the tests](#running-the-tests)
- [Known limitations](#known-limitations)

## Local setup

Requires Docker running locally.

### Option A — everything in Docker (recommended, matches README)

```sh
npm ci
docker compose up --build -d
```

The `web` container's entrypoint waits for Postgres, runs `prisma migrate deploy`,
seeds the database, then starts `npm run dev`. Poll until it's ready:

```sh
for attempt in $(seq 1 60); do
  if curl --fail --silent --show-error --output /dev/null http://localhost:3000/login; then break; fi
  if [ "$attempt" -eq 60 ]; then docker compose logs --tail=100 web; exit 1; fi
  sleep 1
done
```

The app is now at <http://localhost:3000>, redirecting to `/login`. Follow logs with
`docker compose logs -f web`; stop everything (and remove the volumes) with
`docker compose down -v`.

### Option B — Postgres in Docker, Next.js locally (hot reload)

Useful while actively changing code, since Option A runs `next dev` inside the
container without a live-reloading host bind mount for source edits made outside it.

```sh
npm ci
docker compose up -d db          # just the database, on localhost:5433
cp .env.example .env             # DATABASE_URL + SESSION_SECRET for local dev
npm run db:migrate               # prisma migrate deploy
npm run db:seed                  # idempotent — safe to re-run
npm run dev                      # http://localhost:3000
```

### Seed credentials

The seed upserts two users and 32 example design variables across four subsystems
(EPS, Thermal, Structures, Communications), so re-running `npm run db:seed` never
creates duplicates or clobbers a value you've since edited by hand.

| Role | Email | Password | Can edit protected variables? |
| --- | --- | --- | --- |
| Analyst | `analyst@case-study.local` | `analyst-password` | No |
| Engineering lead | `lead@case-study.local` | `lead-password` | Yes |

## Signing in

`/login` — email + password. An unauthenticated request to any other page redirects
here; visiting `/` while signed in redirects straight to `/variables`. A failed
attempt shows "Invalid email or password." without revealing which field was wrong.
Signing out is the button next to your avatar in the top-right of every page (a form
POST to `/logout` that ends the session).

Every other page shares the same shell: a left sidebar with five sections (**Design
Variables**, **Pull Variables**, **Push Variables**, **Analysis Models**,
**Activity**), and a header showing which section you're in plus your avatar
(initials, colored by a hash of your name) with a tooltip of your full name.

## Design Variables (`/variables`)

The main registry: every design variable as a table of its public ID (e.g. `DV-042`,
a short stable code derived from the internal key — not the same as the raw
`externalKey` shown on the detail page), name, subsystem, current value, and unit. A
lock badge marks protected variables.

- **Search** — a text box that filters by key, name, or description, debounced
  (~250ms) and reflected in the URL (`?query=`) so a search is shareable/bookmarkable.
- **Filter by subsystem** — a dropdown populated from whichever subsystems are
  actually present in the current result set.
- **Sort** — Name / Subsystem / Recently updated, also URL-driven (`?sort=`).
- Hovering a value cell reveals a copy button for that value.
- **Clicking any row** opens a side drawer for that variable, without navigating away
  — the fastest way to check or edit a value:
  - The drawer header shows the variable's name, subsystem, and public ID, plus a
    lock icon (protected, can't edit) or an "unsaved changes" indicator.
  - The current value and unit are shown large; if you can edit it, clicking either
    one turns it into an inline text field (auto-sized to its content) with the other
    field's label following your input's semantic width. Editing shows a floating
    save button in the drawer footer once something's actually changed.
  - Below that, a **Show changes** toggle expands this variable's change
    history: each entry shows who made the change, what changed (the field,
    and old → new value — with the unit appended for a value change), and
    when (relative time, with the exact timestamp on hover), newest first.
    History is only fetched the first time you expand it, and a **Load more**
    button appears if there's more than the first page. Then a metadata block
    (description, last-updated timestamp).
  - Leaving the page (or the tab) with unsaved changes triggers the browser's
    "are you sure" prompt.

## Variable detail page (`/variables/:externalKey`)

A full-page, linkable/bookmarkable equivalent of the drawer for one variable — the
target of links from the activity feed and run detail pages. Shows the same identity,
current value, protection badge, description, and last-updated timestamp as the
drawer, plus (if you have permission) a standalone edit form instead of the inline
one, and a "Changes saved." banner right after a successful save (`?saved=1`). If you
can't edit it, you see a protected-variable notice instead of the form. Note: unlike
the drawer, this page does **not** show the expandable change history — for that,
open the same variable from `/variables` instead.

## Pull Variables (`/pull`)

Paste a template — bare keys, `KEY=`, comments (`#...`), and blank lines are all
valid — and get it back with every recognized key filled from the current registry
value. Two ways to get a starting template:

1. Type or paste your own (the placeholder shows the expected shape — key on its
   own, or `KEY=`, grouped under `# ...` comment headers).
2. Pick an existing analysis model from the "Start from a model" dropdown and click
   **Use model**: generates a starter file of that model's Pull variable list at
   their current values (a one-time snapshot — it doesn't stay linked to the model).

```bash
EPS-BUS-VOLTAGE=
EPS-PEAK-LOAD="OLD VALUE"
EPS-CHARGE-EFFICIENCY=101010101
THERMAL-SURVIVAL-MAX
EPS-SOLAR-ARRAY-POWER-1=
KEY-IS-NOT-EXIST
```

Click **Fill values**, and the right column shows the result with syntax coloring
(keys, `=`, values); a key that has no registry match is commented out and shown
disabled rather than silently dropped. A stats line above shows how many keys were
detected/filled. 

```bash
EPS-BUS-VOLTAGE=2
EPS-PEAK-LOAD=142
EPS-CHARGE-EFFICIENCY=0.92
THERMAL-SURVIVAL-MAX=55
#EPS-SOLAR-ARRAY-POWER-1=
#KEY-IS-NOT-EXIST=
```
Toggle **Group by subsystem** to reorganize the output into
`# SUBSYSTEM` sections (with a trailing `# Not found` section for unmatched keys)
instead of preserving your original line order. Once there's output. A **Copy**
button appears to copy it to the clipboard.

```bash
#EPS
EPS-BUS-VOLTAGE=2
EPS-PEAK-LOAD=142
EPS-CHARGE-EFFICIENCY=0.92

#Thermal
THERMAL-SURVIVAL-MAX=55

# Not found
#EPS-SOLAR-ARRAY-POWER-1=
#KEY-IS-NOT-EXIST=
```

The format picker at the top shows `.env` (active) plus `JSON` and `CSV` marked
"Soon..." — only `.env`-style text is supported today.

## Push Variables (`/push`)

The inverse of Pull: paste the output of your analysis (`KEY=value` lines) and apply
a reviewed batch of changes back to the registry in one atomic run.

1. Optionally pick a **Model** (tags the resulting run for that model, shown later in
   the activity feed and used to filter it — it does not restrict which keys you can
   push) and a free-text **Label**.
2. Paste your file into the editor and click **Review changes** (or ⌘/Ctrl+Enter).
3. The review table classifies every parsed key into exactly one state:
   - **will-change** — value differs from the registry; included by default.
   - **unchanged** — matches the registry already; can't be toggled on.
   - **protected** — you don't have permission to change it (shown as a note instead
     of a toggle for an Analyst; an Engineering Lead sees it as a normal will-change
     row instead).
   - not matched to any registry key at all — surfaced separately as a "Not in the
     registry" warning, not as a row.
   
   A summary line tallies all four counts. If the values being pushed look like they
   moved since your file was likely produced (some rows updated more recently than
   others in the same batch), a staleness warning tells you to double-check before
   applying.
4. Each will-change row has a toggle to include/exclude it from the apply — turn off
   anything you don't actually want written.
5. **Update N variables** applies only the enabled rows as one push. The result line
   reports how many of the requested updates actually landed and links to that push's
   [run detail page](#run-detail-runsrunid).

Applying is all-or-nothing at the database level: if anything in the batch fails
unexpectedly partway through, nothing in that batch is left half-applied.

## Analysis Models (`/models`)

A model is just a named, reusable pair of variable lists — which keys to Pull and
which to Push — so you don't have to remember or retype a set of keys every time.
Everyone can see every model; only its owner is meant to edit it (see
[Known limitations](#known-limitations)).

- **`/models`** — every model with its Pull/Push counts, last-run time, and owner.
- **`/models/new`** and **`/models/:slug`** (edit) share the same form:
  - Name (required to save) and an optional description.
  - Two **variable pickers**, one for Pull and one for Push: click **+ Add**, type to
    search by key or name, click a result (or press Enter to add the top match) to
    add it. Added variables list below with a remove (×) button; a protected
    variable shows a lock icon inline. Long lists collapse after 5 with a "N more"
    expander.
  - **Save changes** / **Create model** (⌘/Ctrl+S also works) — validates the name is
    non-blank, then redirects to the model's page.
  - Editing an existing model shows an unsaved-change counter and a "•••" menu with
    **Delete model** (confirms first; deleting a model does not delete its run
    history, just the model link on those runs).

## Activity (`/activity`)

A newest-first feed of every registry change, each linking back to the affected
variable(s).

- **Filters**: All / Runs only / Web edits tabs, plus author and model dropdowns —
  all reflected in the URL.
- Rows sharing the same push **run** collapse into one entry ("Alex pushed 12
  variables from `power-budget`") with an expandable card listing a sample of the
  changed keys and an old → new value per key, and a **Revert this run** button that
  pushes every field in that run back to its pre-run value as a brand-new run.
- A single manual edit made from the variable drawer/detail page (a "web edit") shows
  as its own entry with the editor's avatar, the field changed, and old → new value.
  Note: two fields changed together in one manual save do **not** collapse into a
  single feed entry the way a multi-variable push run does — each field shows up as
  its own row.
- Entries are grouped under day headers ("Today", "Yesterday", or a date); **Load
  more** paginates further back.

## Run detail (`/runs/:runId`)

Reached from a run entry in the activity feed: the model/label the run was tagged
with, who ran it, when, its source (web/CLI/API), and a full table of every field
changed in that run (old → new value, who changed it), or an empty-state message if
the run applied but changed nothing.

## Roles and permissions

| Action | Analyst | Engineering Lead |
| --- | --- | --- |
| View any variable, model, run, or the activity feed | ✅ | ✅ |
| Edit/push a non-protected variable | ✅ | ✅ |
| Edit/push a **protected** variable | ❌ | ✅ |
| Create an analysis model | ✅ | ✅ |
| Edit/delete a model you own | ✅ | ✅ |

Permission checks run server-side wherever a write happens (the single-variable
editor, the bulk-push pipeline, and the underlying service layer independently), not
just in what the UI shows — the review table can still list a protected row for an
Analyst, but attempting to include it goes nowhere.

## Running the tests

```sh
npm run test:unit         # vitest, no services required
npm run test:integration  # vitest against a real, disposable Postgres
npm run test:e2e          # Playwright, spins up its own db + Next.js server
```

## Known limitations

- **JSON and CSV pull/push formats** are shown in the format picker but not
  implemented yet — only `.env`-style text works today.
