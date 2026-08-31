import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "../../lib/db";
import { pushDesignVariables } from "../../lib/design-variables/bulk-push";

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

describe("pushDesignVariables (integration)", () => {
  beforeAll(() => {
    assertIntegrationDatabase();
  });

  afterAll(async () => {
    await db.designVariable.deleteMany({ where: { id: { in: createdVariableIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("writes one run and one history row per changed field across the batch", async () => {
    const user = await createUser();
    const variableA = await createVariable();
    const variableB = await createVariable();

    const result = await pushDesignVariables({
      updates: [
        { externalKey: variableA.externalKey, input: { value: "42" } },
        { externalKey: variableB.externalKey, input: { value: "7", unit: "A" } },
      ],
      user: { id: user.id, role: user.role },
    });

    const run = await db.workflowRun.findUniqueOrThrow({ where: { id: result.runId } });
    expect(run.userId).toBe(user.id);

    const history = await db.designChangeHistory.findMany({ where: { runId: result.runId } });
    expect(history).toHaveLength(3); // A: value (1) + B: value, unit (2)
    expect(history.every((row) => row.runId === result.runId)).toBe(true);

    const reloadedA = await db.designVariable.findUniqueOrThrow({ where: { id: variableA.id } });
    const reloadedB = await db.designVariable.findUniqueOrThrow({ where: { id: variableB.id } });
    expect(reloadedA.value).toBe("42");
    expect(reloadedB).toMatchObject({ value: "7", unit: "A" });
  });

  it("keeps the run row even when every update in the batch is a no-op", async () => {
    const user = await createUser();
    const variable = await createVariable({ value: "5" });

    const result = await pushDesignVariables({
      updates: [{ externalKey: variable.externalKey, input: { value: "5" } }],
      user: { id: user.id, role: user.role },
    });

    const run = await db.workflowRun.findUnique({ where: { id: result.runId } });
    expect(run).not.toBeNull();

    const history = await db.designChangeHistory.findMany({ where: { runId: result.runId } });
    expect(history).toHaveLength(0);
  });

  it("rolls back the run and every already-applied update when a later update violates a real database constraint", async () => {
    const user = await createUser();
    const variableA = await createVariable({ value: "1" });
    const variableB = await createVariable({ value: "1" });

    await expect(
      pushDesignVariables({
        updates: [
          { externalKey: variableA.externalKey, input: { value: "999" } },
          { externalKey: variableB.externalKey, input: { isProtected: "not-a-boolean" as unknown as boolean } },
        ],
        user: { id: user.id, role: user.role },
      }),
    ).rejects.toThrow();

    const reloadedA = await db.designVariable.findUniqueOrThrow({ where: { id: variableA.id } });
    expect(reloadedA.value).toBe("1");

    const historyForA = await db.designChangeHistory.findMany({ where: { variableId: variableA.id } });
    expect(historyForA).toHaveLength(0);

    const runs = await db.workflowRun.findMany({ where: { userId: user.id } });
    expect(runs).toHaveLength(0);
  });
});
