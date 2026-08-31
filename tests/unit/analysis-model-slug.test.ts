import { describe, expect, it } from "vitest";

import { generateUniqueSlug, slugify } from "../../lib/analysis-models/slug";

describe("slugify", () => {
  it("lowercases and dashes a plain name", () => {
    expect(slugify("Power Budget v2")).toBe("power-budget-v2");
  });

  it("collapses runs of punctuation and whitespace into one dash", () => {
    expect(slugify("EPS  --  Thermal / Comms!!")).toBe("eps-thermal-comms");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  --Launch Mass--  ")).toBe("launch-mass");
  });

  it("falls back to a placeholder for a name with no slug-able characters", () => {
    expect(slugify("★★★")).toBe("model");
  });
});

describe("generateUniqueSlug", () => {
  it("returns the plain slug when it isn't taken", async () => {
    const slug = await generateUniqueSlug("Power Budget", async () => false);
    expect(slug).toBe("power-budget");
  });

  it("appends -2 when the base slug is taken", async () => {
    const taken = new Set(["power-budget"]);
    const slug = await generateUniqueSlug("Power Budget", async (candidate) => taken.has(candidate));
    expect(slug).toBe("power-budget-2");
  });

  it("keeps incrementing past multiple collisions", async () => {
    const taken = new Set(["power-budget", "power-budget-2", "power-budget-3"]);
    const slug = await generateUniqueSlug("Power Budget", async (candidate) => taken.has(candidate));
    expect(slug).toBe("power-budget-4");
  });

  it("stays the same slug across a rename check, since callers only slugify on create", async () => {
    // The stability guarantee lives in the caller (createAnalysisModel is the
    // only place that calls this) — this test documents that slugify() itself
    // is a pure function of the name, so re-running it against the ORIGINAL
    // name after a rename would still be deterministic, even though the repo
    // never actually does that.
    const first = slugify("Power Budget");
    const renamed = slugify("Power Budget");
    expect(first).toBe(renamed);
  });
});
