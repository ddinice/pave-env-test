import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  update: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock("../../lib/db", () => ({
  db: {
    $transaction: (callback: (tx: unknown) => unknown) =>
      callback({
        $queryRaw: dependencies.queryRaw,
        designVariable: { update: dependencies.update },
        designChangeHistory: { createMany: dependencies.createMany },
      }),
  },
}));

import { changeDesignVariable } from "../../lib/design-variables/change-service";
import { ForbiddenVariableChangeError, VariableNotFoundError } from "../../lib/design-variables/errors";

const baseRow = {
  id: "var-1",
  externalKey: "battery.capacity",
  name: "Battery capacity",
  value: "100",
  unit: "Wh",
  subsystem: "EPS",
  description: "Usable battery capacity.",
  isProtected: false,
  updatedByUserId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const analyst = { id: "analyst-1", role: "ANALYST" as const };
const lead = { id: "lead-1", role: "ENGINEERING_LEAD" as const };

describe("changeDesignVariable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.queryRaw.mockResolvedValue([baseRow]);
    dependencies.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => Promise.resolve({ ...baseRow, ...data }),
    );
    dependencies.createMany.mockResolvedValue({ count: 0 });
  });

  it("writes no history row and does not touch the row when nothing changed", async () => {
    const result = await changeDesignVariable({
      externalKey: baseRow.externalKey,
      input: { value: "100", unit: "Wh" },
      user: analyst,
      source: "WEB",
    });

    expect(result.status).toBe("unchanged");
    expect(dependencies.update).not.toHaveBeenCalled();
    expect(dependencies.createMany).not.toHaveBeenCalled();
  });

  it("writes one history row per changed field, sharing a changeSetId", async () => {
    const result = await changeDesignVariable({
      externalKey: baseRow.externalKey,
      input: { value: "120", unit: "kWh" },
      user: analyst,
      source: "WEB",
    });

    expect(result.status).toBe("updated");
    expect(dependencies.createMany).toHaveBeenCalledTimes(1);

    const { data } = dependencies.createMany.mock.calls[0][0] as {
      data: { field: string; changeSetId: string }[];
    };
    expect(data).toHaveLength(2);
    expect(data.map((row) => row.field).sort()).toEqual(["unit", "value"]);
    expect(new Set(data.map((row) => row.changeSetId)).size).toBe(1);
  });

  it("skips fields whose value is unchanged and only records the ones that differ", async () => {
    await changeDesignVariable({
      externalKey: baseRow.externalKey,
      input: { value: "120", unit: "Wh" },
      user: analyst,
      source: "WEB",
    });

    const { data } = dependencies.createMany.mock.calls[0][0] as {
      data: { field: string; oldValue: string; newValue: string }[];
    };
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ field: "value", oldValue: "100", newValue: "120" });
  });

  it("rejects an analyst changing a protected variable and writes nothing", async () => {
    dependencies.queryRaw.mockResolvedValue([{ ...baseRow, isProtected: true }]);

    await expect(
      changeDesignVariable({
        externalKey: baseRow.externalKey,
        input: { value: "120", unit: "Wh" },
        user: analyst,
        source: "WEB",
      }),
    ).rejects.toBeInstanceOf(ForbiddenVariableChangeError);
    expect(dependencies.update).not.toHaveBeenCalled();
    expect(dependencies.createMany).not.toHaveBeenCalled();
  });

  it("allows an engineering lead to change a protected variable", async () => {
    dependencies.queryRaw.mockResolvedValue([{ ...baseRow, isProtected: true }]);

    const result = await changeDesignVariable({
      externalKey: baseRow.externalKey,
      input: { value: "120", unit: "Wh" },
      user: lead,
      source: "WEB",
    });

    expect(result.status).toBe("updated");
  });

  it("throws VariableNotFoundError when the row does not exist", async () => {
    dependencies.queryRaw.mockResolvedValue([]);

    await expect(
      changeDesignVariable({
        externalKey: "missing.key",
        input: { value: "1", unit: "V" },
        user: analyst,
        source: "WEB",
      }),
    ).rejects.toBeInstanceOf(VariableNotFoundError);
  });

  it("locks the row with SELECT ... FOR UPDATE before reading it", async () => {
    await changeDesignVariable({
      externalKey: baseRow.externalKey,
      input: { value: "120", unit: "Wh" },
      user: analyst,
      source: "WEB",
    });

    const [sqlParts] = dependencies.queryRaw.mock.calls[0] as [TemplateStringsArray];
    expect(sqlParts.join("")).toContain("FOR UPDATE");
  });

  it("stamps the history rows with the caller's runId when provided", async () => {
    await changeDesignVariable({
      externalKey: baseRow.externalKey,
      input: { value: "120", unit: "Wh" },
      user: analyst,
      source: "WEB",
      runId: "run-1",
    });

    const { data } = dependencies.createMany.mock.calls[0][0] as { data: { runId: string | null }[] };
    expect(data.every((row) => row.runId === "run-1")).toBe(true);
  });

  it("uses the caller-supplied transaction client instead of opening its own", async () => {
    const externalTx = {
      $queryRaw: vi.fn().mockResolvedValue([baseRow]),
      designVariable: { update: vi.fn().mockResolvedValue({ ...baseRow, value: "120" }) },
      designChangeHistory: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };

    await changeDesignVariable({
      externalKey: baseRow.externalKey,
      input: { value: "120", unit: "Wh" },
      user: analyst,
      source: "WEB",
      tx: externalTx as never,
    });

    expect(externalTx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(dependencies.queryRaw).not.toHaveBeenCalled();
  });
});
