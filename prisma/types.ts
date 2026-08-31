import type { PrismaClient } from "@prisma/client";

export type DesignVariableClient = Pick<PrismaClient, "designVariable">;
