"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BoxIcon, PersonIcon } from "../../components/icons/icons";
import type { HistoryFeedKindFilter } from "../../lib/design-variables/types";
import { cn } from "../../lib/utils";
import styles from "./style.module.css";

export function ActivityFilters({
  authors,
  models,
  kind,
  userId,
  modelId,
}: {
  authors: { id: string; name: string }[];
  models: { id: string; name: string }[];
  kind: HistoryFeedKindFilter;
  userId: string;
  modelId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(name: "kind" | "userId" | "modelId", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(name, value);
    else params.delete(name);
    router.push(params.size ? `${pathname}?${params}` : pathname);
  }

  return (
    <div className={styles.filters}>
      <button
        className={cn(styles.tab, kind === "all" && styles.tabActive)}
        onClick={() => updateFilter("kind", "all")}
        type="button"
      >
        All
      </button>
      <button
        className={cn(styles.tab, kind === "runs" && styles.tabActive)}
        onClick={() => updateFilter("kind", "runs")}
        type="button"
      >
        Runs only
      </button>
      <button
        className={cn(styles.tab, kind === "web" && styles.tabActive)}
        onClick={() => updateFilter("kind", "web")}
        type="button"
      >
        Web edits
      </button>

      <span aria-hidden="true" className={styles.divider} />

      <label className={styles.filterSelect}>
        <PersonIcon />
        <select aria-label="Filter by author" onChange={(event) => updateFilter("userId", event.target.value)} value={userId}>
          <option value="">Anyone</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filterSelect}>
        <BoxIcon />
        <select aria-label="Filter by model" onChange={(event) => updateFilter("modelId", event.target.value)} value={modelId}>
          <option value="">Any model</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
