import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { db } from "../db";
import { canEditVariable } from "../auth/policy";
import { ForbiddenVariableChangeError, VariableNotFoundError } from "./errors";
import type {
  ChangeDesignVariableResult,
  ChangeUser,
  DesignVariableChangeInput,
  DesignVariableFieldName,
  DesignVariableRow,
} from "./types";

const TRACKED_FIELDS: DesignVariableFieldName[] = [
  "value",
  "unit",
  "name",
  "description",
  "subsystem",
  "isProtected",
];

export async function changeDesignVariable({
  externalKey,
  input,
  user,
  source,
  runId,
  tx: externalTx,
}: {
  externalKey: string;
  input: DesignVariableChangeInput;
  user: ChangeUser;
  source: "WEB" | "CLI" | "API";
  runId?: string;
  tx?: Prisma.TransactionClient;
}): Promise<ChangeDesignVariableResult> {
  const run = async (
    tx: Prisma.TransactionClient,
  ): Promise<ChangeDesignVariableResult> => {
    const rows = await tx.$queryRaw<DesignVariableRow[]>`
      SELECT * FROM "DesignVariable" WHERE "externalKey" = ${externalKey} FOR UPDATE
    `;
    const current = rows[0];
    if (!current) throw new VariableNotFoundError(externalKey);

    if (!canEditVariable(user, current))
      throw new ForbiddenVariableChangeError(externalKey);

    const changedFields: DesignVariableFieldName[] = [];
    const data: Record<string, string | boolean> = {};
    const historyRows: {
      field: DesignVariableFieldName;
      oldValue: string;
      newValue: string;
    }[] = [];

    for (const field of TRACKED_FIELDS) {
      if (!(field in input)) continue;
      const nextValue = input[field];
      if (nextValue === undefined) continue;

      const oldValue = current[field];
      if (String(oldValue) === String(nextValue)) continue;

      changedFields.push(field);
      data[field] = nextValue;
      historyRows.push({
        field,
        oldValue: String(oldValue),
        newValue: String(nextValue),
      });
    }

    if (changedFields.length === 0) {
      return { status: "unchanged", variable: current };
    }

    const changeSetId = randomUUID();

    const updated = await tx.designVariable.update({
      where: { externalKey },
      // `data` is built dynamically from the whitelisted TRACKED_FIELDS above,
      // so its per-field types can't be correlated statically.
      data: {
        ...data,
        updatedByUserId: user.id,
      } as Prisma.DesignVariableUpdateInput,
    });

    await tx.designChangeHistory.createMany({
      data: historyRows.map((change) => ({
        variableId: updated.id,
        changedByUserId: user.id,
        runId: runId ?? null,
        source,
        type: "UPDATED",
        changeSetId,
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
      })),
    });

    return { status: "updated", variable: updated, changeSetId, changedFields };
  };

  if (externalTx) return run(externalTx);
  return db.$transaction(run);
}
