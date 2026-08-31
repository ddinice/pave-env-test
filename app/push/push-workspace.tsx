"use client";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/Switch/switch";
import { Tooltip } from "../../components/ui/tooltip";
import { TextEditor } from "../../components/TextEditor/text-editor";
import { cn, formatAbsoluteDate, formatRelativeTime } from "../../lib/utils";
import { PUSH_PLACEHOLDER } from "../constants/push.constant";
import pullStyles from "../pull/style.module.css";
import { countByState, detectStaleness } from "./review";
import styles from "./style.module.css";
import { usePushReview } from "./use-push-review";

export function PushWorkspace({
  models,
  canEditProtected,
}: {
  models: { id: string; name: string }[];
  canEditProtected: boolean;
}) {
  const {
    text,
    setText,
    modelId,
    setModelId,
    label,
    setLabel,
    review,
    enabledKeys,
    toggleRow,
    reviewChanges,
    isReviewing,
    apply,
    isApplying,
    result,
  } = usePushReview({ canEditProtected });

  const counts = review ? countByState(review.rows) : null;
  const stale = review ? detectStaleness(review.rows.map((row) => ({ updatedAt: row.updatedAt }))) : false;

  return (
    <>
      <div className={styles.modelRow}>
        <label>
          <span className="sr-only">Model</span>
          <select
            aria-label="Model"
            onChange={(event) => setModelId(event.target.value)}
            value={modelId}
          >
            <option value="">No model</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Label</span>
          <Input
            aria-label="Label"
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Label (optional)"
            value={label}
          />
        </label>
      </div>

      <TextEditor
        aria-label="Analysis output file"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            reviewChanges();
          }
        }}
        placeholder={PUSH_PLACEHOLDER}
        setText={setText}
        style={{ resize: "none" }}
      />

      <div>
        <Button
          className={cn(isReviewing && pullStyles.pending)}
          disabled={!text.trim() || isReviewing}
          onClick={reviewChanges}
          type="button"
        >
          {isReviewing ? "Reviewing…" : "Review changes"}
        </Button>
      </div>

      {review && counts ? (
        <>
          <p className={styles.summary}>
            {counts.willChange} to update · {counts.unchanged} unchanged · {counts.protected} protected ·{" "}
            {review.notFound.length} not found
          </p>

          {stale ? (
            <div className={styles.staleWarning} role="alert">
              <strong>Some of these values moved since this file was likely produced</strong>
              <span>Double-check before applying — someone else may have changed them since.</span>
            </div>
          ) : null}

          {review.notFound.length > 0 ? (
            <div className={styles.notFoundWarning} role="alert">
              <strong>Not in the registry</strong>
              <span>{review.notFound.join(" · ")}</span>
            </div>
          ) : null}

          {review.rows.length > 0 ? (
            <table className={styles.reviewTable}>
              <caption className="sr-only">Variables to review</caption>
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Current</th>
                  <th scope="col">Incoming</th>
                  <th scope="col">Last changed</th>
                  <th scope="col">
                    <span className="sr-only">Apply</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {review.rows.map((row) => (
                  <tr className={cn(row.state === "unchanged" && styles.rowUnchanged)} key={row.externalKey}>
                    <th className={styles.key} scope="row">
                      {row.externalKey}
                    </th>
                    <td className={styles.currentValue}>
                      {row.currentValue} {row.unit}
                    </td>
                    <td className={styles.incomingValue}>
                      {row.state === "unchanged" ? row.currentValue : row.incomingValue} {row.unit}
                    </td>
                    <td className={styles.meta}>
                      <Tooltip label={formatAbsoluteDate(row.updatedAt)}>
                        <span>
                          {row.updatedByName ?? "Unknown"} · {formatRelativeTime(row.updatedAt)}
                        </span>
                      </Tooltip>
                    </td>
                    <td>
                      {row.state === "protected" ? (
                        <span className={styles.protectedNote}>An engineering lead must apply this</span>
                      ) : (
                        <Switch
                          ariaLabel={`Apply ${row.externalKey}`}
                          checked={enabledKeys.has(row.externalKey)}
                          disabled={row.state === "unchanged"}
                          onCheckedChange={() => toggleRow(row.externalKey)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {review.rows.length > 0 ? (
            <div className={styles.applyBar}>
              <Button
                className={cn(isApplying && pullStyles.pending)}
                disabled={enabledKeys.size === 0 || isApplying}
                onClick={apply}
                type="button"
              >
                {isApplying ? "Updating…" : `Update ${enabledKeys.size} variable${enabledKeys.size === 1 ? "" : "s"}`}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {result ? (
        <p className={styles.resultSummary} role="status">
          Applied {result.results.filter((item) => item.status === "updated").length} of {result.results.length}{" "}
          updates. <a href={`/runs/${result.runId}`}>View run history</a>
        </p>
      ) : null}
    </>
  );
}
