"use client";

import { useMemo, useRef, useState, type ComponentType, type SVGProps } from "react";

import { LockIcon, SearchIcon } from "../icons/icons";
import styles from "./style.module.css";
import type { PickerVariable } from "./types";

const COLLAPSE_LIMIT = 5;

export function VariablePicker({
  label,
  icon: Icon,
  allVariables,
  selectedIds,
  onChange,
}: {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  allVariables: PickerVariable[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const byId = useMemo(() => new Map(allVariables.map((variable) => [variable.id, variable])), [allVariables]);
  const selected = selectedIds
    .map((id) => byId.get(id))
    .filter((variable): variable is PickerVariable => Boolean(variable));
  const visible = expanded ? selected : selected.slice(0, COLLAPSE_LIMIT);
  const hiddenCount = selected.length - visible.length;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allVariables
      .filter((variable) => variable.externalKey.toLowerCase().includes(q) || variable.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [allVariables, query]);

  function add(id: string) {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(id: string) {
    onChange(selectedIds.filter((existingId) => existingId !== id));
  }

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <span className={styles.headerLeft}>
          <Icon />
          <span className={styles.headerLabel}>{label}</span>
          <span className={styles.headerCount}>{selected.length}</span>
        </span>
        <button className={styles.addTrigger} onClick={openSearch} type="button">
          + Add
        </button>
      </div>

      <div className={styles.card}>
        {searchOpen ? (
          <div className={styles.searchArea}>
            <div className={styles.searchInputRow}>
              <SearchIcon />
              <input
                aria-label={`Search variables to add to ${label}`}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  const top = results[0];
                  if (top && !selectedIds.includes(top.id)) add(top.id);
                }}
                placeholder="Search by key or name…"
                ref={inputRef}
                type="search"
                value={query}
              />
            </div>

            {results.length > 0 ? (
              <ul className={styles.results}>
                {results.map((variable, index) => {
                  const alreadyAdded = selectedIds.includes(variable.id);
                  return (
                    <li key={variable.id}>
                      <button
                        className={styles.resultRow}
                        disabled={alreadyAdded}
                        onClick={() => add(variable.id)}
                        type="button"
                      >
                        <span className={styles.rowKey}>{variable.externalKey}</span>
                        <span className={styles.rowName}>{variable.name}</span>
                        {alreadyAdded ? (
                          <span className={styles.rowMeta}>already added</span>
                        ) : index === 0 ? (
                          <span aria-hidden="true" className={styles.enterHint}>
                            ↵
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}

        {visible.length > 0 ? (
          <ul className={styles.rows}>
            {visible.map((variable) => (
              <li className={styles.row} key={variable.id}>
                <span className={styles.rowKey}>{variable.externalKey}</span>
                {variable.isProtected ? <LockIcon className={styles.lockIcon} /> : null}
                {variable.modelCount ? (
                  <span className={styles.rowMeta}>
                    in {variable.modelCount} model{variable.modelCount === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className={styles.rowName}>{variable.name}</span>
                )}
                <button
                  aria-label={`Remove ${variable.externalKey} from ${label}`}
                  className={styles.rowRemove}
                  onClick={() => remove(variable.id)}
                  type="button"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : !searchOpen ? (
          <p className={styles.emptyRow}>No variables yet.</p>
        ) : null}

        {hiddenCount > 0 ? (
          <button className={styles.moreButton} onClick={() => setExpanded(true)} type="button">
            {hiddenCount} more
          </button>
        ) : null}
      </div>
    </div>
  );
}
