import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  findDesignVariableByExternalKey: vi.fn(),
  changeDesignVariable: vi.fn(),
}));

vi.mock("../../lib/design-variables/repository", () => ({
  findDesignVariableByExternalKey: dependencies.findDesignVariableByExternalKey,
}));
vi.mock("../../lib/design-variables/change-service", () => ({
  changeDesignVariable: dependencies.changeDesignVariable,
}));

import { updateDesignVariable } from "../../lib/design-variables/service";

describe("updateDesignVariable", () => {
  const analyst = { id: "analyst-1", role: "ANALYST" as const };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists an analyst's valid update to an ordinary variable with their updater id", async () => {
    const variable = { externalKey: "battery.capacity", isProtected: false };
    dependencies.findDesignVariableByExternalKey.mockResolvedValue(variable);
    dependencies.changeDesignVariable.mockResolvedValue({
      status: "updated",
      variable: { ...variable, value: "120.5", unit: "Wh" },
      changeSetId: "set-1",
      changedFields: ["value", "unit"],
    });

    await expect(
      updateDesignVariable({ externalKey: variable.externalKey, input: { value: "120.5", unit: "Wh" }, user: analyst }),
    ).resolves.toEqual({
      status: "updated",
      variable: { ...variable, value: "120.5", unit: "Wh" },
    });
    expect(dependencies.changeDesignVariable).toHaveBeenCalledWith({
      externalKey: "battery.capacity",
      input: { value: "120.5", unit: "Wh" },
      user: analyst,
      source: "WEB",
    });
  });

  it("returns Forbidden when an analyst attempts to update a protected variable", async () => {
    dependencies.findDesignVariableByExternalKey.mockResolvedValue({ externalKey: "safety.limit", isProtected: true });

    await expect(
      updateDesignVariable({ externalKey: "safety.limit", input: { value: "2", unit: "V" }, user: analyst }),
    ).resolves.toEqual({ status: "forbidden" });
    expect(dependencies.changeDesignVariable).not.toHaveBeenCalled();
  });

  it("returns validation errors without a repository write for malformed input", async () => {
    dependencies.findDesignVariableByExternalKey.mockResolvedValue({ externalKey: "battery.capacity", isProtected: false });

    await expect(
      updateDesignVariable({ externalKey: "battery.capacity", input: { value: "NaN", unit: "" }, user: analyst }),
    ).resolves.toMatchObject({ status: "validation", fieldErrors: { value: expect.any(Array), unit: expect.any(Array) } });
    expect(dependencies.changeDesignVariable).not.toHaveBeenCalled();
  });

  it("returns not-found when the variable disappears between the pre-check and the locked write", async () => {
    const variable = { externalKey: "battery.capacity", isProtected: false };
    dependencies.findDesignVariableByExternalKey.mockResolvedValue(variable);
    const { VariableNotFoundError } = await import("../../lib/design-variables/errors");
    dependencies.changeDesignVariable.mockRejectedValue(new VariableNotFoundError(variable.externalKey));

    await expect(
      updateDesignVariable({ externalKey: variable.externalKey, input: { value: "120.5", unit: "Wh" }, user: analyst }),
    ).resolves.toEqual({ status: "not-found" });
  });

  it("returns forbidden when the variable becomes protected between the pre-check and the locked write", async () => {
    const variable = { externalKey: "battery.capacity", isProtected: false };
    dependencies.findDesignVariableByExternalKey.mockResolvedValue(variable);
    const { ForbiddenVariableChangeError } = await import("../../lib/design-variables/errors");
    dependencies.changeDesignVariable.mockRejectedValue(new ForbiddenVariableChangeError(variable.externalKey));

    await expect(
      updateDesignVariable({ externalKey: variable.externalKey, input: { value: "120.5", unit: "Wh" }, user: analyst }),
    ).resolves.toEqual({ status: "forbidden" });
  });
});
