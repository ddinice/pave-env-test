"use client";

import { useState, useTransition } from "react";

import { entryLines, parseEnv } from "../pull/env";
import { applyPush, loadPushRegistrySnapshot } from "./actions";
import { classifyPushRows } from "./review";
import type { PushReview } from "./types";
import type { BulkPushResult } from "../../lib/design-variables/types";

export function usePushReview({ canEditProtected }: { canEditProtected: boolean }) {
  const [text, setText] = useState("");
  const [modelId, setModelId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [review, setReview] = useState<PushReview | null>(null);
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<BulkPushResult | null>(null);
  const [isReviewing, startReview] = useTransition();
  const [isApplying, startApply] = useTransition();

  function reviewChanges() {
    const entries = entryLines(parseEnv(text));

    startReview(async () => {
      const keys = entries.map((entry) => entry.key);
      const registry = await loadPushRegistrySnapshot(keys);
      const next = classifyPushRows({ entries, registry, canEditProtected });

      setReview(next);
      setResult(null);
      setEnabledKeys(
        new Set(next.rows.filter((row) => row.state === "will-change").map((row) => row.externalKey)),
      );
    });
  }

  function toggleRow(externalKey: string) {
    const row = review?.rows.find((item) => item.externalKey === externalKey);
    if (!row || row.state !== "will-change") return;

    setEnabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(externalKey)) next.delete(externalKey);
      else next.add(externalKey);
      return next;
    });
  }

  function apply() {
    if (!review) return;

    const updates = review.rows
      .filter((row) => enabledKeys.has(row.externalKey))
      .map((row) => ({ externalKey: row.externalKey, value: row.incomingValue }));

    if (updates.length === 0) return;

    startApply(async () => {
      const outcome = await applyPush({
        updates,
        modelId: modelId || null,
        label: label.trim() || null,
      });
      setResult(outcome);
    });
  }

  return {
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
  };
}
