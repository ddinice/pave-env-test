import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "../../lib/db";
import { changeDesignVariable } from "../../lib/design-variables/change-service";
import { pushDesignVariables } from "../../lib/design-variables/bulk-push";
import { listDesignVariableHistoryFeed } from "../../lib/design-variables/history-feed";

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
      value: "5",
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

describe("design variable history (integration)", () => {
  beforeAll(() => {
    assertIntegrationDatabase();
  });

  afterAll(async () => {
    // Deleting the variables cascades their DesignChangeHistory rows.
    // Deleting the users cascades their WorkflowRun rows.
    await db.designVariable.deleteMany({ where: { id: { in: createdVariableIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("writes a history row only for the field that actually changed, not for one that was resubmitted unchanged", async () => {
    const user = await createUser();
    const variable = await createVariable({ value: "5", unit: "V" });

    const result = await changeDesignVariable({
      externalKey: variable.externalKey,
      input: { value: "5", unit: "A" },
      user: { id: user.id, role: user.role },
      source: "WEB",
    });

    expect(result.status).toBe("updated");
    const history = await db.designChangeHistory.findMany({ where: { variableId: variable.id } });
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ field: "unit", oldValue: "V", newValue: "A" });
  });

  it("shares one changeSetId across every field changed in a single web save", async () => {
    const user = await createUser();
    const variable = await createVariable({ value: "5", unit: "V" });

    await changeDesignVariable({
      externalKey: variable.externalKey,
      input: { value: "10", unit: "A" },
      user: { id: user.id, role: user.role },
      source: "WEB",
    });

    const history = await db.designChangeHistory.findMany({ where: { variableId: variable.id } });
    expect(history).toHaveLength(2);
    expect(history.map((row) => row.field).sort()).toEqual(["unit", "value"]);
    expect(new Set(history.map((row) => row.changeSetId)).size).toBe(1);
    expect(history.every((row) => row.runId === null)).toBe(true);
  });

  it("collapses history rows that share a runId into one activity feed entry", async () => {
    const user = await createUser();
    const variable = await createVariable({ value: "5", unit: "V" });

    const result = await pushDesignVariables({
      updates: [{ externalKey: variable.externalKey, input: { value: "10", unit: "A" } }],
      user: { id: user.id, role: user.role },
    });

    const history = await db.designChangeHistory.findMany({ where: { runId: result.runId } });
    expect(history).toHaveLength(2); // value + unit, one run

    const feed = await listDesignVariableHistoryFeed({ userId: user.id });
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({ kind: "run", runId: result.runId, changeCount: 2 });
  });

  it("does not collapse history rows that only share a changeSetId, without a runId — each stays its own feed entry", async () => {
    // This documents the actual, deliberate design (see the comment above
    // listDesignVariableHistoryFeed in lib/design-variables/history-feed.ts):
    // only runId groups collapse. Two field-level rows from one standalone
    // web save share a changeSetId but not a runId, so they are NOT the same
    // "spec" a naive reading might expect — they appear as two entries.
    const user = await createUser();
    const variable = await createVariable({ value: "5", unit: "V" });

    await changeDesignVariable({
      externalKey: variable.externalKey,
      input: { value: "10", unit: "A" },
      user: { id: user.id, role: user.role },
      source: "WEB",
    });

    const feed = await listDesignVariableHistoryFeed({ userId: user.id });
    expect(feed.items).toHaveLength(2);
    expect(feed.items.every((item) => item.kind === "change")).toBe(true);
  });
});
