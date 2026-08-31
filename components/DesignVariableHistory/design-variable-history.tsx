"use client";

import { CollapsedActivityGroup } from "../CollapsedActivityGroup/collapsed-activity-group";
import { Field } from "./types";
import {
  formatAbsoluteDate,
  formatRelativeTime,
  getInitials,
  pickAvatarColor,
} from "../../lib/utils";
import { useDesignVariableHistory } from "./useDesignVariableHistory";
import style from "./style.module.css";
import { Avatar } from "../ui/Avatar/avatar";

const fieldPhrases: Record<Field, string> = {
  value: "value",
  unit: "unit",
  name: "name",
  description: "description",
  subsystem: "subsystem",
  isProtected: "protection",
};

export function DesignVariableHistory({
  externalKey,
  unit,
}: {
  externalKey: string;
  unit: string;
}) {
  const { open, setOpen, items, nextCursor, status, loadMore } =
    useDesignVariableHistory(externalKey);

  return (
    <CollapsedActivityGroup open={open} onOpenChange={setOpen}>
      <CollapsedActivityGroup.Trigger
        collapsedLabel="Show changes"
        expandedLabel="Hide changes"
      />
      <CollapsedActivityGroup.Content className={open ? style.content : ""}>
        {status === "loading" && items.length === 0 ? (
          <p className={`${style.status} ${style.statusInfo}`}>
            Loading changes…
          </p>
        ) : null}
        {status === "error" && items.length === 0 ? (
          <p className={`${style.status} ${style.statusError}`}>
            Couldn&rsquo;t load history.
          </p>
        ) : null}
        {status === "loaded" && items.length === 0 ? (
          <p className={style.status}>No changes yet.</p>
        ) : null}
        {items.length > 0 ? (
          <ul className={style.list}>
            {items.map((entry) => {
              const authorName = entry.changedByUser?.name ?? "Unknown user";

              return (
                <li className={style.entry} key={entry.id}>
                  <Avatar
                    name={getInitials(authorName)}
                    bg={pickAvatarColor(
                      entry.changedByUserId ?? authorName,
                    )}
                  />
                  <p className={style.line}>
                    <strong>{authorName}</strong>{" "}
                    {entry.field ? (
                      <>
                        changed {fieldPhrases[entry.field] ?? entry.field}{" "}
                        {entry.oldValue !== null ? (
                          <span className={style.old}>{entry.oldValue}{entry.field === "value" && unit ? ` ${unit}` : ""}</span>
                        ) : null}{" "}
                        <span aria-hidden="true">→</span>{" "}
                        <strong>
                          {entry.newValue}
                          {entry.field === "value" && unit ? ` ${unit}` : ""}
                        </strong>
                      </>
                    ) : (
                      <>{entry.type.toLowerCase()} this variable</>
                    )}
                    <span className={style.sep}> · </span>
                    <time
                      className={style.time}
                      dateTime={entry.createdAt.toISOString()}
                      title={formatAbsoluteDate(entry.createdAt)}
                    >
                      {formatRelativeTime(entry.createdAt)}
                    </time>
                  </p>
                </li>
              );
            })}
          </ul>
        ) : null}
        {nextCursor ? (
          <button
            className={style.loadMore}
            disabled={status === "loading"}
            onClick={loadMore}
            type="button"
          >
            {status === "loading" ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </CollapsedActivityGroup.Content>
    </CollapsedActivityGroup>
  );
}
