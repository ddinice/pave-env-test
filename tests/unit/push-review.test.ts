import { describe, expect, it } from "vitest";

import { classifyPushRows, countByState, detectStaleness } from "../../app/push/review";

const now = new Date("2026-08-31T12:00:00.000Z");
const earlier = new Date("2026-08-30T12:00:00.000Z");

const registryRow = (overrides: Partial<Parameters<typeof classifyPushRows>[0]["registry"][number]> = {}) => ({
  externalKey: "EPS-BUS-VOLTAGE",
  value: "28",
  unit: "V",
  isProtected: false,
  updatedAt: now,
  updatedByUser: { name: "Avery Analyst" },
  ...overrides,
});

describe("classifyPushRows", () => {
  it("classifies a key with a differing value as will-change", () => {
    const { rows, notFound } = classifyPushRows({
      entries: [{ key: "EPS-BUS-VOLTAGE", value: "30" }],
      registry: [registryRow()],
      canEditProtected: false,
    });

    expect(notFound).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ state: "will-change", currentValue: "28", incomingValue: "30" });
  });

  it("classifies a key with the same value as unchanged, even if it's protected", () => {
    const { rows } = classifyPushRows({
      entries: [{ key: "EPS-BUS-VOLTAGE", value: "28" }],
      registry: [registryRow({ isProtected: true })],
      canEditProtected: false,
    });

    expect(rows[0].state).toBe("unchanged");
  });

  it("classifies a differing protected value as protected for an analyst", () => {
    const { rows } = classifyPushRows({
      entries: [{ key: "EPS-BUS-VOLTAGE", value: "30" }],
      registry: [registryRow({ isProtected: true })],
      canEditProtected: false,
    });

    expect(rows[0].state).toBe("protected");
  });

  it("classifies a differing protected value as will-change for an engineering lead", () => {
    const { rows } = classifyPushRows({
      entries: [{ key: "EPS-BUS-VOLTAGE", value: "30" }],
      registry: [registryRow({ isProtected: true })],
      canEditProtected: true,
    });

    expect(rows[0].state).toBe("will-change");
  });

  it("reports a key with no registry match as not-found, not a row", () => {
    const { rows, notFound } = classifyPushRows({
      entries: [{ key: "GHOST-KEY", value: "1" }],
      registry: [],
      canEditProtected: false,
    });

    expect(rows).toEqual([]);
    expect(notFound).toEqual(["GHOST-KEY"]);
  });

  it("classifies every key in a single file into exactly one of will-change, unchanged, protected or not-found", () => {
    const { rows, notFound } = classifyPushRows({
      entries: [
        { key: "WILL-CHANGE", value: "30" },
        { key: "UNCHANGED", value: "1" },
        { key: "PROTECTED", value: "30" },
        { key: "GHOST-KEY", value: "1" },
      ],
      registry: [
        registryRow({ externalKey: "WILL-CHANGE", value: "1" }),
        registryRow({ externalKey: "UNCHANGED", value: "1" }),
        registryRow({ externalKey: "PROTECTED", value: "1", isProtected: true }),
      ],
      canEditProtected: false,
    });

    expect(Object.fromEntries(rows.map((row) => [row.externalKey, row.state]))).toEqual({
      "WILL-CHANGE": "will-change",
      UNCHANGED: "unchanged",
      PROTECTED: "protected",
    });
    expect(notFound).toEqual(["GHOST-KEY"]);
    expect(rows).toHaveLength(3);
  });
});

describe("countByState", () => {
  it("tallies each state independently", () => {
    const { rows } = classifyPushRows({
      entries: [
        { key: "A", value: "2" },
        { key: "B", value: "1" },
        { key: "C", value: "9" },
      ],
      registry: [
        registryRow({ externalKey: "A", value: "1" }),
        registryRow({ externalKey: "B", value: "1" }),
        registryRow({ externalKey: "C", value: "1", isProtected: true }),
      ],
      canEditProtected: false,
    });

    expect(countByState(rows)).toEqual({ willChange: 1, unchanged: 1, protected: 1 });
  });
});

describe("detectStaleness", () => {
  it("is false when every row moved at the same time", () => {
    expect(detectStaleness([{ updatedAt: now }, { updatedAt: now }])).toBe(false);
  });

  it("is false for a single-row batch", () => {
    expect(detectStaleness([{ updatedAt: now }])).toBe(false);
  });

  it("is true when some row is newer than the oldest row in the batch", () => {
    expect(detectStaleness([{ updatedAt: earlier }, { updatedAt: now }])).toBe(true);
  });
});
