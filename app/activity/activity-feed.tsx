"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getInitials, pickAvatarColor, cn } from "../../lib/utils";
import type { HistoryFeedEntry, HistoryFeedKindFilter, HistoryFeedPage } from "../../lib/design-variables/types";
import { DashIcon, PushIcon, RevertIcon } from "../../components/icons/icons";
import { loadMoreActivity, revertRun } from "./actions";
import { ActivityFilters } from "./activity-filters";
import { groupByDay, subsystemSummary } from "./grouping";
import styles from "./style.module.css";

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });

function RunEntry({ entry }: { entry: Extract<HistoryFeedEntry, { kind: "run" }> }) {
  const [expanded, setExpanded] = useState(false);
  const [isReverting, startRevert] = useTransition();
  const [reverted, setReverted] = useState(false);
  const router = useRouter();

  const time = timeFormatter.format(entry.createdAt);
  const target = entry.model ? entry.model.slug : entry.label;

  function revert() {
    startRevert(async () => {
      await revertRun(entry.runId);
      setReverted(true);
      router.refresh();
    });
  }

  return (
    <div className={styles.entry}>
      <span className={styles.entryIcon}>{entry.changeCount === 0 ? <DashIcon /> : <PushIcon />}</span>
      <div>
        <p className={styles.entryLine}>
          <strong>{entry.user?.name ?? "Unknown"}</strong> {entry.changeCount === 0 ? "ran" : "pushed"}{" "}
          {entry.changeCount > 0 ? (
            <strong>
              {entry.changeCount} variable{entry.changeCount === 1 ? "" : "s"}
            </strong>
          ) : null}
          {entry.changeCount > 0 && target ? " from " : null}
          {target ? <code>{target}</code> : null}
          {entry.changeCount === 0 ? " · no values changed" : null}
          {" · "}
          <span className={styles.entryTime}>{time}</span>
        </p>

        {entry.changeCount > 0 ? (
          expanded ? (
            <>
              <div className={styles.runCard}>
                {entry.sampleChanges.map((change) => (
                  <div className={styles.runRow} key={change.id}>
                    <span className={styles.runRowKey}>{change.externalKey}</span>
                    <span className={styles.runRowValues}>
                      {change.oldValue !== null ? <span className={styles.oldValue}>{change.oldValue}</span> : null}
                      {change.oldValue !== null ? <span aria-hidden="true">→</span> : null}
                      <strong>{change.newValue}</strong>
                    </span>
                  </div>
                ))}
                {entry.changeCount > entry.sampleChanges.length ? (
                  <span className={styles.runMore}>{entry.changeCount - entry.sampleChanges.length} more</span>
                ) : null}
                <button className={styles.collapseToggle} onClick={() => setExpanded(false)} type="button">
                  Hide changes
                </button>
              </div>
              <button className={styles.revertButton} disabled={isReverting || reverted} onClick={revert} type="button">
                <RevertIcon />
                {reverted ? "Reverted" : isReverting ? "Reverting…" : "Revert this run"}
              </button>
            </>
          ) : (
            <button className={styles.summaryToggle} onClick={() => setExpanded(true)} type="button">
              Show {entry.changeCount} change{entry.changeCount === 1 ? "" : "s"}
              {entry.subsystems.length > 0 ? `: ${subsystemSummary(entry.subsystems)}…` : "…"}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

function ChangeEntry({ entry }: { entry: Extract<HistoryFeedEntry, { kind: "change" }> }) {
  const time = timeFormatter.format(entry.createdAt);
  const authorName = entry.changedByUser?.name ?? "Unknown user";

  return (
    <div className={styles.entry}>
      <span
        aria-hidden="true"
        className={styles.entryAvatar}
        style={{ background: pickAvatarColor(entry.changedByUser?.id ?? authorName) }}
      >
        {getInitials(authorName)}
      </span>
      <p className={styles.entryLine}>
        <strong>{authorName}</strong> changed <code>{entry.variable?.externalKey ?? "a variable"}</code>{" "}
        {entry.oldValue !== null ? <span className={styles.oldValue}>{entry.oldValue}</span> : null}{" "}
        {entry.oldValue !== null ? <span aria-hidden="true">→</span> : null} <strong>{entry.newValue}</strong>
        {" · "}
        <span className={styles.entryTime}>{time}</span>
      </p>
    </div>
  );
}

export function ActivityFeed({
  initialPage,
  authors,
  models,
  kind,
  userId,
  modelId,
}: {
  initialPage: HistoryFeedPage;
  authors: { id: string; name: string }[];
  models: { id: string; name: string }[];
  kind: HistoryFeedKindFilter;
  userId: string;
  modelId: string;
}) {
  const [items, setItems] = useState(initialPage.items);
  const [cursor, setCursor] = useState(initialPage.nextCursor);
  const [isLoadingMore, startLoadingMore] = useTransition();

  function loadMore() {
    startLoadingMore(async () => {
      const page = await loadMoreActivity({ cursor, kind, userId: userId || undefined, modelId: modelId || undefined });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    });
  }

  const groups = groupByDay(items);

  return (
    <div>
      <ActivityFilters authors={authors} kind={kind} modelId={modelId} models={models} userId={userId} />

      {groups.length === 0 ? (
        <p className={styles.empty}>Nothing here yet.</p>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <p className={styles.dayLabel}>{group.label}</p>
            <div className={styles.dayGroup}>
              <div className={styles.entries}>
                {group.items.map((entry) =>
                  entry.kind === "run" ? (
                    <RunEntry entry={entry} key={entry.runId} />
                  ) : (
                    <ChangeEntry entry={entry} key={entry.id} />
                  ),
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {cursor ? (
        <button className={cn("button button-secondary", styles.loadMore)} disabled={isLoadingMore} onClick={loadMore} type="button">
          {isLoadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
