import { useEffect, useRef, useState } from "react";

import { loadDesignVariableHistory } from "../../app/variables/actions";
import type { DesignVariableHistoryEntry } from "../../lib/design-variables/types";
import { Status } from "./types";

export function useDesignVariableHistory(externalKey: string) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DesignVariableHistoryEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!open || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    let cancelled = false;
    setStatus("loading");
    loadDesignVariableHistory(externalKey)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setStatus("loaded");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [open, externalKey]);

  async function loadMore() {
    if (!nextCursor || status === "loading") return;
    setStatus("loading");
    try {
      const page = await loadDesignVariableHistory(externalKey, nextCursor);
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  return { open, setOpen, items, nextCursor, status, loadMore };
}
