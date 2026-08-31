import { designVariables } from "./seed-data";
import type { DesignVariableClient } from "./types";

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
