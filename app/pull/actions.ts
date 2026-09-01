"use server";

import { redirect } from "next/navigation";

import { currentUser } from "../../lib/auth/current-user";
import { findDesignVariablesByExternalKeys } from "../../lib/design-variables/repository";
import { listModelPullVariables } from "../../lib/analysis-models/repository";
import type { EnvMatch } from "./types";

export async function fetchVariableValues(keys: string[]): Promise<Record<string, EnvMatch>> {
  const user = await currentUser();
  if (!user) redirect("/login");

  if (keys.length === 0) return {};

  const variables = await findDesignVariablesByExternalKeys(keys);
  return Object.fromEntries(
    variables.map((variable) => [
      variable.externalKey,
      { value: variable.value, subsystem: variable.subsystem },
    ]),
  );
}

export async function generateStarterFromModel(modelId: string): Promise<string> {
  const user = await currentUser();
  if (!user) redirect("/login");

  const variables = await listModelPullVariables(modelId);
  return variables.map(({ externalKey, value }) => `${externalKey}=${value}`).join("\n");
}
