import { db } from "../db";
import type { DesignVariableHistoryPage, WorkflowRunDetail } from "./types";

const HISTORY_PAGE_SIZE = 20;

export async function listDesignVariableHistory({
  externalKey,
  cursor,
  take = HISTORY_PAGE_SIZE,
}: {
  externalKey: string;
  cursor?: string;
  take?: number;
}): Promise<DesignVariableHistoryPage> {
  const rows = await db.designChangeHistory.findMany({
    where: { variable: { externalKey } },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { changedByUser: { select: { name: true } } },
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export function getWorkflowRun(runId: string): Promise<WorkflowRunDetail | null> {
  return db.workflowRun.findUnique({
    where: { id: runId },
    include: {
      user: { select: { name: true } },
      model: { select: { slug: true, name: true } },
      changes: {
        orderBy: { createdAt: "desc" },
        include: {
          variable: { select: { externalKey: true, name: true } },
          changedByUser: { select: { name: true } },
        },
      },
    },
  });
}
