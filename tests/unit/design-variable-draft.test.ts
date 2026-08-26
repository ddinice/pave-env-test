import { describe, expect, it } from "vitest";

import { hasDesignVariableDraftChanges } from "../../lib/design-variables/draft";

describe("hasDesignVariableDraftChanges", () => {
  it("clears the dirty state when both fields are restored to their original values", () => {
    expect(hasDesignVariableDraftChanges({ draftUnit: "dBi", draftValue: "6.5", unit: "dBi", value: "6.5" })).toBe(false);
  });
});
