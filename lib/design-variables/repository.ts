import { Prisma } from "@prisma/client";

import { db } from "../db";
import type { ManualValue } from "./schemas";

export type DesignVariableRecord = {
  externalKey: string;
  name: string;
  value: string;
  unit: string;
  subsystem: string;
  description: string;
  isProtected: boolean;
  updatedAt: Date;
};

type ListDesignVariablesOptions = {
  query?: string;
  subsystem?: string;
  sort?: "name" | "subsystem" | "updatedAt";
};

export async function listDesignVariables({ query, subsystem, sort = "name" }: ListDesignVariablesOptions = {}): Promise<DesignVariableRecord[]> {
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

  return db.designVariable.findMany({ where, orderBy: { [sort]: sort === "updatedAt" ? "desc" : "asc" } }) as Promise<DesignVariableRecord[]>;
}

export function findDesignVariableByExternalKey(externalKey: string): Promise<DesignVariableRecord | null> {
  return db.designVariable.findUnique({ where: { externalKey } }) as Promise<DesignVariableRecord | null>;
}

export function updateDesignVariableValue({
  externalKey,
  value,
  updatedByUserId,
}: {
  externalKey: string;
  value: ManualValue;
  updatedByUserId: string;
}): Promise<DesignVariableRecord> {
  return db.designVariable.update({
    where: { externalKey },
    data: { value: value.value, unit: value.unit, updatedByUserId },
  }) as Promise<DesignVariableRecord>;
}
