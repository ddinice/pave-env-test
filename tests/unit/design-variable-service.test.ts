import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  findDesignVariableByExternalKey: vi.fn(),
  updateDesignVariableValue: vi.fn(),
}));

vi.mock("../../lib/design-variables/repository", () => dependencies);

import { updateDesignVariable } from "../../lib/design-variables/service";

describe("updateDesignVariable", () => {
  const analyst = { id: "analyst-1", role: "ANALYST" as const };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists an analyst's valid update to an ordinary variable with their updater id", async () => {
    const variable = { externalKey: "battery.capacity", isProtected: false };
    dependencies.findDesignVariableByExternalKey.mockResolvedValue(variable);
    dependencies.updateDesignVariableValue.mockResolvedValue({ ...variable, value: "120.5", unit: "Wh" });

    await expect(
      updateDesignVariable({ externalKey: variable.externalKey, input: { value: "120.5", unit: "Wh" }, user: analyst }),
    ).resolves.toEqual({
      status: "updated",
      variable: { ...variable, value: "120.5", unit: "Wh" },
    });
    expect(dependencies.updateDesignVariableValue).toHaveBeenCalledWith({
      externalKey: "battery.capacity",
      value: { value: "120.5", unit: "Wh" },
      updatedByUserId: "analyst-1",
    });
  });

  it("returns Forbidden when an analyst attempts to update a protected variable", async () => {
    dependencies.findDesignVariableByExternalKey.mockResolvedValue({ externalKey: "safety.limit", isProtected: true });

    await expect(
      updateDesignVariable({ externalKey: "safety.limit", input: { value: "2", unit: "V" }, user: analyst }),
    ).resolves.toEqual({ status: "forbidden" });
    expect(dependencies.updateDesignVariableValue).not.toHaveBeenCalled();
  });

  it("returns validation errors without a repository write for malformed input", async () => {
    dependencies.findDesignVariableByExternalKey.mockResolvedValue({ externalKey: "battery.capacity", isProtected: false });

    await expect(
      updateDesignVariable({ externalKey: "battery.capacity", input: { value: "NaN", unit: "" }, user: analyst }),
    ).resolves.toMatchObject({ status: "validation", fieldErrors: { value: expect.any(Array), unit: expect.any(Array) } });
    expect(dependencies.updateDesignVariableValue).not.toHaveBeenCalled();
  });
});
