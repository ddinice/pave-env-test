import { describe, expect, it } from "vitest";

import { canEditVariable } from "../../lib/auth/policy";

describe("canEditVariable", () => {
  const protectedVariable = { isProtected: true };
  const ordinaryVariable = { isProtected: false };

  it("does not allow an analyst to edit a protected variable", () => {
    expect(canEditVariable({ role: "ANALYST" }, protectedVariable)).toBe(false);
  });

  it("allows an engineering lead to edit a protected variable", () => {
    expect(canEditVariable({ role: "ENGINEERING_LEAD" }, protectedVariable)).toBe(true);
  });

  it.each(["ANALYST", "ENGINEERING_LEAD"] as const)("allows %s to edit an ordinary variable", (role) => {
    expect(canEditVariable({ role }, ordinaryVariable)).toBe(true);
  });

  it("does not allow an anonymous user to edit a variable", () => {
    expect(canEditVariable(null, ordinaryVariable)).toBe(false);
    expect(canEditVariable(undefined, protectedVariable)).toBe(false);
  });
});
