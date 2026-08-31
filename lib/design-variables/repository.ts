import { Prisma } from "@prisma/client";

import { db } from "../db";
import type {
  DesignVariablePickerOption,
  DesignVariableRecord,
  DesignVariableReviewRecord,
  ListDesignVariablesOptions,
} from "./types";

export async function listDesignVariables({
  query,
  subsystem,
  sort = "name",
}: ListDesignVariablesOptions = {}): Promise<DesignVariableRecord[]> {
  const where: Prisma.DesignVariableWhereInput = {
    ...(subsystem ? { subsystem } : {}),
    ...(query
      ? {
          OR: [
            { externalKey: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return db.designVariable.findMany({
    where,
    orderBy: { [sort]: sort === "updatedAt" ? "desc" : "asc" },
  }) as Promise<DesignVariableRecord[]>;
}

export function findDesignVariableByExternalKey(
  externalKey: string,
): Promise<DesignVariableRecord | null> {
  return db.designVariable.findUnique({
    where: { externalKey },
  }) as Promise<DesignVariableRecord | null>;
}

export function findDesignVariablesByExternalKeys(
  externalKeys: string[],
): Promise<DesignVariableRecord[]> {
  return db.designVariable.findMany({
    where: { externalKey: { in: externalKeys } },
  }) as Promise<DesignVariableRecord[]>;
}

export function findDesignVariablesForReview(
  externalKeys: string[],
): Promise<DesignVariableReviewRecord[]> {
  return db.designVariable.findMany({
    where: { externalKey: { in: externalKeys } },
    select: {
      externalKey: true,
      name: true,
      value: true,
      unit: true,
      isProtected: true,
      updatedAt: true,
      updatedByUser: { select: { name: true } },
    },
  });
}

export async function listDesignVariablesForPicker(
  excludeModelId?: string,
): Promise<DesignVariablePickerOption[]> {
  const variables = await db.designVariable.findMany({
    orderBy: { externalKey: "asc" },
    select: {
      id: true,
      externalKey: true,
      name: true,
      subsystem: true,
      isProtected: true,
      modelItems: { select: { modelId: true } },
    },
  });

  return variables.map((variable) => ({
    id: variable.id,
    externalKey: variable.externalKey,
    name: variable.name,
    subsystem: variable.subsystem,
    isProtected: variable.isProtected,
    modelCount: new Set(
      variable.modelItems
        .map((item) => item.modelId)
        .filter((modelId) => modelId !== excludeModelId),
    ).size,
  }));
}
