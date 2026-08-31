"use server";

import { redirect } from "next/navigation";

import { currentUser } from "../../lib/auth/current-user";
import { findDesignVariablesForReview } from "../../lib/design-variables/repository";
import { pushDesignVariables } from "../../lib/design-variables/bulk-push";
import type { BulkPushResult, DesignVariableReviewRecord } from "../../lib/design-variables/types";

export async function loadPushRegistrySnapshot(keys: string[]): Promise<DesignVariableReviewRecord[]> {
  const user = await currentUser();
  if (!user) redirect("/login");

  if (keys.length === 0) return [];
  return findDesignVariablesForReview(keys);
}

export async function applyPush({
  updates,
  modelId,
  label,
}: {
  updates: { externalKey: string; value: string }[];
  modelId?: string | null;
  label?: string | null;
}): Promise<BulkPushResult> {
  const user = await currentUser();
  if (!user) redirect("/login");

  return pushDesignVariables({
    updates: updates.map(({ externalKey, value }) => ({ externalKey, input: { value } })),
    user,
    modelId: modelId ?? null,
    label: label ?? null,
    source: "WEB",
  });
}
