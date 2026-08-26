import { describe, expect, it } from "vitest";

import { parseManualValue } from "../../lib/design-variables/schemas";

describe("parseManualValue", () => {
  it("accepts a finite decimal value and a unit", () => {
    expect(parseManualValue({ value: "120.5", unit: "Wh" })).toEqual({
      value: "120.5",
      unit: "Wh",
    });
  });

  it.each([
    { value: "", unit: "Wh" },
    { value: "not-a-number", unit: "Wh" },
    { value: "NaN", unit: "Wh" },
    { value: "Infinity", unit: "Wh" },
    { value: "120.5", unit: "   " },
  ])("rejects invalid manual values: %o", (input) => {
    expect(() => parseManualValue(input)).toThrow();
  });
});
