import { db } from "../db";
import { changeDesignVariable } from "./change-service";
import { ForbiddenVariableChangeError, VariableNotFoundError } from "./errors";
import type { BulkPushKeyResult, BulkPushResult, BulkPushUpdate, PushUser } from "./types";

export async function pushDesignVariables({
  updates,
  user,
  modelId = null,
  label = null,
  source = "WEB",
}: {
  updates: BulkPushUpdate[];
  user: PushUser;
  modelId?: string | null;
  label?: string | null;
  source?: "WEB" | "CLI" | "API";
}): Promise<BulkPushResult> {
  return db.$transaction(async (tx) => {
    const run = await tx.workflowRun.create({
      data: { modelId, label, userId: user.id, source },
    });

    const results: BulkPushKeyResult[] = [];

    for (const { externalKey, input } of updates) {
      try {
        const outcome = await changeDesignVariable({
          externalKey,
          input,
          user,
          source,
          runId: run.id,
          tx,
        });

        results.push(
          outcome.status === "updated"
            ? {
                externalKey,
                status: "updated",
                changedFields: outcome.changedFields,
              }
            : { externalKey, status: "unchanged" },
        );
      } catch (error) {
        if (error instanceof ForbiddenVariableChangeError) {
          results.push({ externalKey, status: "protected" });
          continue;
        }
        if (error instanceof VariableNotFoundError) {
          results.push({ externalKey, status: "not-found" });
          continue;
        }
        throw error;
      }
    }

    return { runId: run.id, results };
  });
}
