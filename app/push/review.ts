import type { PushRegistryRow, PushRow, PushRowState, PushReview } from "./types";

export function classifyPushRows({
  entries,
  registry,
  canEditProtected,
}: {
  entries: { key: string; value: string }[];
  registry: PushRegistryRow[];
  canEditProtected: boolean;
}): PushReview {
  const byKey = new Map(registry.map((row) => [row.externalKey, row]));
  const rows: PushRow[] = [];
  const notFound: string[] = [];

  for (const entry of entries) {
    const current = byKey.get(entry.key);
    if (!current) {
      notFound.push(entry.key);
      continue;
    }

    const unchanged = entry.value === current.value;
    const state: PushRowState = unchanged
      ? "unchanged"
      : current.isProtected && !canEditProtected
        ? "protected"
        : "will-change";

    rows.push({
      externalKey: entry.key,
      incomingValue: entry.value,
      currentValue: current.value,
      unit: current.unit,
      updatedAt: current.updatedAt,
      updatedByName: current.updatedByUser?.name ?? null,
      isProtected: current.isProtected,
      state,
    });
  }

  return { rows, notFound };
}

export function countByState(rows: PushRow[]) {
  return {
    willChange: rows.filter((row) => row.state === "will-change").length,
    unchanged: rows.filter((row) => row.state === "unchanged").length,
    protected: rows.filter((row) => row.state === "protected").length,
  };
}

export function detectStaleness(rows: { updatedAt: Date }[]): boolean {
  if (rows.length < 2) return false;
  const oldest = Math.min(...rows.map((row) => row.updatedAt.getTime()));
  return rows.some((row) => row.updatedAt.getTime() > oldest);
}
