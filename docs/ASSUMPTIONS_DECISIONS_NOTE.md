# Assumptions

**The user's file is the source of truth for what a workflow contains.** The
brief says the set of variables is edited weekly. I assumed that file lives in
the user's own repository next to their script and is edited there, not in the
app. So the system does not store which variables belong to whose workflow — it
stores only that a workflow by that name exists and what it changed.

**Keys absent from the registry are not an error.** A user's file may hold local
parameters that have nothing to do with the registry. Those lines are left
untouched and reported for information, not as a failure.

**An identical value is not an event.** A push that writes the same number
records no history. Otherwise three pushes a day across 50 variables would
produce 150 empty entries daily.

**Models are shared.** Everyone sees every model; only the owner edits. This
mirrors the existing rule — everyone reads all variables, role decides who
writes — and lets a new colleague copy a model instead of assembling one from
scratch. Private models across 50 users would mean 150 sets, half of them
duplicates.

**A model is a convenience, not a security boundary.** A key outside the push
list can still be applied by hand. Permissions and `isProtected` are the only
hard boundary. Otherwise a script that started emitting a new value would be
blocked until someone went and edited the model.

**Units are not converted.** Values pass through as written; `unit` is a
reference field. A model expecting kilograms gets whatever is stored, even if
the registry holds grams.

# Decisions

## Goal

Let people work in their own file format rather than adapt to ours. The
contract is the file the user already has, not a structure we impose on them.

Filling is therefore idempotent: only values change. Order, comments and
unknown keys come back untouched. Today's output is tomorrow's input, so the
file lives in the user's own repository next to their script and is versioned
along with it.

## Format

`.env` is implemented.

Since it was not known which files people actually work with, I picked the
format that any language can read and that is at the same time the hardest to
preserve while filling — comments, quoting, `export` prefixes, inline comments
after a value.

The fill logic is line-based and format-specific. JSON (flat and nested) and
CSV need their own implementation of the same contract: a tree walk for JSON, a
single column for CSV. Format detection and the selector are already in place,
so adding a format is a parser, not a redesign.

## Models

A model is a named set of variables with two directions.

The **pull list** generates a starter file with current values — set up once a
week, used daily. It removes the one step that would otherwise be repeated
three times a day: working out which keys the file needs.

The **push list** defines what gets applied by default. A key outside the list
still arrives, but with its toggle off and labelled "not in model", so inputs
the model only read are not overwritten by accident.

A model is a convenience, not a gate. Keys outside the list can still be
applied by hand — permissions and `isProtected` are the only hard boundary.
Otherwise a script that started emitting a new value would be blocked until
someone went and edited the model.

## History

A field-level log of every change.

`changeSetId` groups fields changed in one save, so editing a value and its
unit together is one event rather than two. `runId` groups every change from
one push, so 38 updates collapse into a single row in the feed instead of
burying it.

Web edits and pushes share one feed: "what changed in the registry today" does
not care where the change came from. A filter separates them for anyone who
needs it.

`runId` also makes a revert nearly free — one query over `oldValue` — which is
the first item in the next iteration.