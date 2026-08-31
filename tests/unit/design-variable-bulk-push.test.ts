import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  create: vi.fn(),
  changeDesignVariable: vi.fn(),
}));

vi.mock("../../lib/db", () => ({
  db: {
    $transaction: (callback: (tx: unknown) => unknown) =>
      callback({ workflowRun: { create: dependencies.create } }),
  },
}));
vi.mock("../../lib/design-variables/change-service", () => ({
  changeDesignVariable: dependencies.changeDesignVariable,
}));

import { pushDesignVariables } from "../../lib/design-variables/bulk-push";
import { ForbiddenVariableChangeError, VariableNotFoundError } from "../../lib/design-variables/errors";

const analyst = { id: "analyst-1", role: "ANALYST" as const };

describe("pushDesignVariables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.create.mockResolvedValue({ id: "run-1" });
  });

  it("creates the run before applying any update, and passes its id to every change", async () => {
    dependencies.changeDesignVariable.mockResolvedValue({
      status: "updated",
      variable: {},
      changeSetId: "set-1",
      changedFields: ["value"],
    });

    await pushDesignVariables({
      updates: [
        { externalKey: "a", input: { value: "1" } },
        { externalKey: "b", input: { value: "2" } },
      ],
      user: analyst,
    });

    expect(dependencies.create).toHaveBeenCalledTimes(1);
    expect(dependencies.changeDesignVariable).toHaveBeenCalledTimes(2);
    for (const call of dependencies.changeDesignVariable.mock.calls) {
      expect(call[0]).toMatchObject({ runId: "run-1" });
    }
  });

  it("reports a per-key result for updated, unchanged, protected and not-found outcomes", async () => {
    dependencies.changeDesignVariable
      .mockResolvedValueOnce({ status: "updated", variable: {}, changeSetId: "s", changedFields: ["value"] })
      .mockResolvedValueOnce({ status: "unchanged", variable: {} })
      .mockRejectedValueOnce(new ForbiddenVariableChangeError("protected.key"))
      .mockRejectedValueOnce(new VariableNotFoundError("missing.key"));

    const result = await pushDesignVariables({
      updates: [
        { externalKey: "updated.key", input: { value: "1" } },
        { externalKey: "unchanged.key", input: { value: "1" } },
        { externalKey: "protected.key", input: { value: "1" } },
        { externalKey: "missing.key", input: { value: "1" } },
      ],
      user: analyst,
    });

    expect(result).toEqual({
      runId: "run-1",
      results: [
        { externalKey: "updated.key", status: "updated", changedFields: ["value"] },
        { externalKey: "unchanged.key", status: "unchanged" },
        { externalKey: "protected.key", status: "protected" },
        { externalKey: "missing.key", status: "not-found" },
      ],
    });
  });

  it("keeps the run even when every update turns out to be a no-op", async () => {
    dependencies.changeDesignVariable.mockResolvedValue({ status: "unchanged", variable: {} });

    const result = await pushDesignVariables({
      updates: [{ externalKey: "a", input: { value: "1" } }],
      user: analyst,
    });

    expect(result.runId).toBe("run-1");
    expect(dependencies.create).toHaveBeenCalledTimes(1);
  });

  it("lets an unexpected error propagate instead of swallowing it into a per-key status", async () => {
    dependencies.changeDesignVariable.mockRejectedValue(new Error("connection reset"));

    await expect(
      pushDesignVariables({ updates: [{ externalKey: "a", input: { value: "1" } }], user: analyst }),
    ).rejects.toThrow("connection reset");
  });

  it("passes modelId and label through to the run, defaulting both to null", async () => {
    dependencies.changeDesignVariable.mockResolvedValue({ status: "unchanged", variable: {} });

    await pushDesignVariables({ updates: [], user: analyst });
    expect(dependencies.create).toHaveBeenCalledWith({
      data: { modelId: null, label: null, userId: analyst.id, source: "WEB" },
    });

    dependencies.create.mockClear();
    await pushDesignVariables({ updates: [], user: analyst, modelId: "model-1", label: "Nightly sync" });
    expect(dependencies.create).toHaveBeenCalledWith({
      data: { modelId: "model-1", label: "Nightly sync", userId: analyst.id, source: "WEB" },
    });
  });
});
