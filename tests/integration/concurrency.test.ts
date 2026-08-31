import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "../../lib/db";
import { changeDesignVariable } from "../../lib/design-variables/change-service";

const e2eDatabaseUrl = "postgresql://postgres:postgres@localhost:5433/case_study_e2e";

function assertIntegrationDatabase() {
  if (process.env.DATABASE_URL !== e2eDatabaseUrl) {
    throw new Error(
      "Integration tests write real rows and are restricted to the dedicated E2E database. Run them via `npm run test:integration`.",
    );
  }
}

const createdUserIds: string[] = [];
const createdVariableIds: string[] = [];

async function createUser() {
  const user = await db.user.create({
    data: {
      email: `${randomUUID()}@integration.test`,
      name: "Integration Tester",
      role: "ANALYST",
      passwordHash: "unused",
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createVariable(overrides: Partial<{ value: string; unit: string; isProtected: boolean }> = {}) {
  const variable = await db.designVariable.create({
    data: {
      externalKey: `int.${randomUUID()}`,
      name: "Integration variable",
      value: "1",
      unit: "V",
      subsystem: "TEST",
      description: "Created for an integration test.",
      isProtected: false,
      ...overrides,
    },
  });
  createdVariableIds.push(variable.id);
  return variable;
}

describe("concurrent writes to the same variable (integration)", () => {
  beforeAll(() => {
    assertIntegrationDatabase();
  });

  afterAll(async () => {
    await db.designVariable.deleteMany({ where: { id: { in: createdVariableIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("records each write's oldValue as what the row actually held when that write ran, not a stale pre-transaction read", async () => {
    const user = await createUser();
    const variable = await createVariable({ value: "1" });
    const actor = { id: user.id, role: user.role };

    // Two overlapping transactions racing to update the same row. Without
    // the `SELECT ... FOR UPDATE` lock in changeDesignVariable, both could
    // read the original value "1" before either writes, and the second
    // write's history row would wrongly record "1" as its oldValue (a lost
    // update) instead of whatever the first write actually left behind.
    const [resultA, resultB] = await Promise.all([
      changeDesignVariable({ externalKey: variable.externalKey, input: { value: "2" }, user: actor, source: "WEB" }),
      changeDesignVariable({ externalKey: variable.externalKey, input: { value: "3" }, user: actor, source: "WEB" }),
    ]);

    expect(resultA.status).toBe("updated");
    expect(resultB.status).toBe("updated");

    const history = await db.designChangeHistory.findMany({ where: { variableId: variable.id } });
    expect(history).toHaveLength(2);
    expect(new Set(history.map((row) => row.newValue))).toEqual(new Set(["2", "3"]));

    // Order-independent: whichever write actually ran first read the
    // original "1"; the other must chain off the first write's newValue,
    // not off the stale original.
    const readOriginal = history.filter((row) => row.oldValue === "1");
    const readPriorWrite = history.filter((row) => row.oldValue !== "1");
    expect(readOriginal).toHaveLength(1);
    expect(readPriorWrite).toHaveLength(1);
    expect(readPriorWrite[0].oldValue).toBe(readOriginal[0].newValue);

    const final = await db.designVariable.findUniqueOrThrow({ where: { id: variable.id } });
    expect(final.value).toBe(readPriorWrite[0].newValue);
  });
});
