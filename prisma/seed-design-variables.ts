import type { PrismaClient } from "@prisma/client";

import { designVariables } from "./seed-data";

type DesignVariableClient = Pick<PrismaClient, "designVariable">;

export async function seedDesignVariables(db: DesignVariableClient, updatedByUserId: string) {
  await Promise.all(
    designVariables.map(([externalKey, name, value, unit, subsystem, description, isProtected]) =>
      db.designVariable.upsert({
        where: { externalKey },
        // Fixture values establish only missing rows; manual changes must survive restarts.
        update: {},
        create: { externalKey, name, value, unit, subsystem, description, isProtected, updatedByUserId },
      }),
    ),
  );
}
