import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";

import { documentedCredentials } from "../../prisma/seed-data";
import { seedDesignVariables } from "../../prisma/seed-design-variables";

describe("documented seed credentials", () => {
  it.each(documentedCredentials)("verifies the documented password for $email", ({ password, passwordHash }) => {
    expect(bcrypt.compareSync(password, passwordHash)).toBe(true);
  });
});

describe("seedDesignVariables", () => {
  it("preserves a manual value, unit, and updater when seed runs again", async () => {
    const existing = { value: "999", unit: "kWh", updatedByUserId: "manual-editor" };
    const records = new Map([["EPS-BATTERY-CAPACITY", existing]]);
    const upsert = vi.fn(async ({ where, create }) => {
      if (!records.has(where.externalKey)) records.set(where.externalKey, create);
    });

    await seedDesignVariables({ designVariable: { upsert } } as never, "analyst-id");

    expect(upsert).toHaveBeenCalledTimes(32);
    expect(upsert.mock.calls[0][0]).toMatchObject({
      update: {},
      create: { updatedByUserId: "analyst-id" },
    });
    expect(records.get("EPS-BATTERY-CAPACITY")).toEqual(existing);
  });
});
