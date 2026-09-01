# Rollout

The work splits into three releases. Each is usable on its own; nothing
depends on the next one shipping.

## R1 — What is built

The paste-and-fill loop end to end: pull a file, run the analysis, review the
diff, apply. History with run grouping. Models for generating the starter file.
`.env` only.

This is deliberately the smallest thing that replaces the manual cycle
completely. A colleague can adopt it without installing anything and without
changing how they run their analysis.

Rolled out to two or three people who run these models daily, with their real
files. Nothing here needs a migration path — the web app keeps working exactly
as before for anyone who ignores the new pages.

## R2 — More formats, safer edges

- **JSON and CSV.** Format detection and the selector already exist; each is a
  parser against the same contract. Driven by what R1 users actually bring.
- **Revert a run.** One query over `oldValue`. Makes push safe to undo, which
  matters more once more people use it.
- **Stale warnings on push** — flag values someone else moved after the file
  was generated. Closes the gap the brief's "no concurrent writes" assumption
  papers over.
- **Create a missing key** — a push row whose key is not in the registry links
  to variable creation with the key prefilled. Creation still goes through the
  existing permission rules; the push screen does not create anything itself.
- **Keyboard shortcuts** — submit and save on both pages, matching the rest of
  the app.

## R3 — Beyond the browser

- **CLI.** Same endpoints, thin client, API tokens. For people who would rather
  not leave the terminal. Deliberately last: the browser already covers
  everyone, so this is an optimisation, not an enabler.
- **Model visibility.** Today every model is shared. If teams turn out to want
  private drafts, add a visibility flag rather than making privacy the default.
