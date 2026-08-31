import { Prisma } from "@prisma/client";

import { db } from "../db";
import type { GroupRow, HistoryFeedEntry, HistoryFeedKindFilter, HistoryFeedPage } from "./types";

const FEED_PAGE_SIZE = 20;
const SAMPLE_SIZE = 5;

function encodeCursor(at: Date, groupId: string): string {
  return `${at.toISOString()}|${groupId}`;
}

function decodeCursor(cursor: string): { at: Date; groupId: string } {
  const separatorIndex = cursor.indexOf("|");
  return { at: new Date(cursor.slice(0, separatorIndex)), groupId: cursor.slice(separatorIndex + 1) };
}

/**
 * Newest-first global feed of design variable changes. History rows that
 * share a runId (a bulk push) collapse into one "run" entry carrying the
 * run's model/label, its touched subsystems, and a sample of changed rows.
 * History rows written without a runId (a single web edit) appear as their
 * own "change" entry. Note: two field-level rows from the same standalone
 * save (same changeSetId, no runId) are NOT collapsed — only runId groups
 * collapse, per spec.
 */
export async function listDesignVariableHistoryFeed({
  cursor,
  take = FEED_PAGE_SIZE,
  userId,
  modelId,
  kind = "all",
}: {
  cursor?: string;
  take?: number;
  userId?: string;
  modelId?: string;
  kind?: HistoryFeedKindFilter;
} = {}): Promise<HistoryFeedPage> {
  const decodedCursor = cursor ? decodeCursor(cursor) : null;

  const baseConditions = [Prisma.sql`1=1`];
  if (userId) baseConditions.push(Prisma.sql`"changedByUserId" = ${userId}`);
  if (kind === "runs") baseConditions.push(Prisma.sql`"runId" IS NOT NULL`);
  if (kind === "web") baseConditions.push(Prisma.sql`"runId" IS NULL`);
  if (modelId) {
    baseConditions.push(
      Prisma.sql`"runId" IN (SELECT id FROM "WorkflowRun" WHERE "modelId" = ${modelId})`,
    );
  }
  const baseWhere = Prisma.join(baseConditions, " AND ");

  const cursorClause = decodedCursor
    ? Prisma.sql`WHERE ("latestAt", "groupId") < (${decodedCursor.at}::timestamptz, ${decodedCursor.groupId})`
    : Prisma.empty;

  const rows = await db.$queryRaw<GroupRow[]>`
    WITH grouped AS (
      SELECT
        COALESCE("runId", id) AS "groupId",
        MAX("runId") AS "runId",
        MAX("createdAt") AS "latestAt",
        COUNT(*)::int AS "changeCount"
      FROM "DesignChangeHistory"
      WHERE ${baseWhere}
      GROUP BY COALESCE("runId", id)
    )
    SELECT "groupId", "runId", "latestAt", "changeCount"
    FROM grouped
    ${cursorClause}
    ORDER BY "latestAt" DESC, "groupId" DESC
    LIMIT ${take + 1}
  `;

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  const runIds = [...new Set(page.filter((row) => row.runId).map((row) => row.runId as string))];
  const standaloneIds = page.filter((row) => !row.runId).map((row) => row.groupId);

  const [runs, standalone] = await Promise.all([
    runIds.length > 0
      ? db.workflowRun.findMany({
          where: { id: { in: runIds } },
          include: {
            model: { select: { id: true, slug: true, name: true } },
            user: { select: { id: true, name: true } },
            changes: {
              orderBy: { createdAt: "asc" },
              include: { variable: { select: { externalKey: true, subsystem: true } } },
            },
          },
        })
      : Promise.resolve([]),
    standaloneIds.length > 0
      ? db.designChangeHistory.findMany({
          where: { id: { in: standaloneIds } },
          include: {
            variable: { select: { externalKey: true, name: true } },
            changedByUser: { select: { id: true, name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const runsById = new Map(runs.map((run) => [run.id, run]));
  const standaloneById = new Map(standalone.map((row) => [row.id, row]));

  const items: HistoryFeedEntry[] = page.map((row) => {
    if (row.runId) {
      const run = runsById.get(row.runId);
      const subsystems = run ? [...new Set(run.changes.map((change) => change.variable.subsystem))] : [];

      return {
        kind: "run",
        runId: row.runId,
        createdAt: row.latestAt,
        changeCount: row.changeCount,
        source: run?.source ?? "WEB",
        label: run?.label ?? null,
        model: run?.model ? { id: run.model.id, slug: run.model.slug, name: run.model.name } : null,
        user: run?.user ? { id: run.user.id, name: run.user.name } : null,
        subsystems,
        sampleChanges: (run?.changes ?? []).slice(0, SAMPLE_SIZE).map((change) => ({
          id: change.id,
          externalKey: change.variable.externalKey,
          oldValue: change.oldValue,
          newValue: change.newValue,
        })),
      };
    }

    const change = standaloneById.get(row.groupId);
    return {
      kind: "change",
      id: row.groupId,
      createdAt: row.latestAt,
      changeCount: row.changeCount,
      source: change?.source ?? "WEB",
      field: change?.field ?? null,
      oldValue: change?.oldValue ?? null,
      newValue: change?.newValue ?? null,
      variable: change?.variable ?? null,
      changedByUser: change?.changedByUser ?? null,
    };
  });

  const last = page[page.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last.latestAt, last.groupId) : null,
  };
}

export function listChangeAuthors(): Promise<{ id: string; name: string }[]> {
  return db.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}
