"use server";

import { redirect } from "next/navigation";

import { currentUser } from "../../lib/auth/current-user";
import { listDesignVariableHistoryFeed } from "../../lib/design-variables/history-feed";
import { getWorkflowRun } from "../../lib/design-variables/history";
import { pushDesignVariables } from "../../lib/design-variables/bulk-push";
import type {
  BulkPushResult,
  BulkPushUpdate,
  DesignVariableFieldName,
  HistoryFeedKindFilter,
  HistoryFeedPage,
} from "../../lib/design-variables/types";

export async function loadMoreActivity({
  cursor,
  kind,
  userId,
  modelId,
}: {
  cursor: string | null;
  kind: HistoryFeedKindFilter;
  userId?: string;
  modelId?: string;
}): Promise<HistoryFeedPage> {
  const user = await currentUser();
  if (!user) redirect("/login");

  return listDesignVariableHistoryFeed({ cursor: cursor ?? undefined, kind, userId, modelId });
}

const TRACKED_FIELDS: DesignVariableFieldName[] = [
  "value",
  "unit",
  "name",
  "description",
  "subsystem",
  "isProtected",
];

function isTrackedField(field: string): field is DesignVariableFieldName {
  return (TRACKED_FIELDS as string[]).includes(field);
}

export async function revertRun(runId: string): Promise<BulkPushResult> {
  const user = await currentUser();
  if (!user) redirect("/login");

  const run = await getWorkflowRun(runId);
  if (!run) throw new Error("This run no longer exists.");

  const byVariable = new Map<string, Record<string, string | boolean>>();
  for (const change of run.changes) {
    if (!change.field || change.oldValue === null || !isTrackedField(change.field)) continue;

    const input = byVariable.get(change.variable.externalKey) ?? {};
    input[change.field] = change.field === "isProtected" ? change.oldValue === "true" : change.oldValue;
    byVariable.set(change.variable.externalKey, input);
  }
  
  const updates = [...byVariable.entries()].map(
    ([externalKey, input]) => ({ externalKey, input }) as BulkPushUpdate,
  );
  if (updates.length === 0) throw new Error("Nothing to revert.");

  return pushDesignVariables({
    updates,
    user,
    modelId: null,
    label: `Revert of ${run.model?.name ?? run.label ?? "a run"}`,
    source: "WEB",
  });
}
