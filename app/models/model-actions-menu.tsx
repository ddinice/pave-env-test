"use client";

import { useState } from "react";

import styles from "./style.module.css";

export function ModelActionsMenu({
  isDeleting,
  onDelete,
}: {
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.menuWrap}>
      <button
        aria-label="Model actions"
        className={styles.menuTrigger}
        onClick={() => setOpen((isOpen) => !isOpen)}
        type="button"
      >
        •••
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          <button
            disabled={isDeleting}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            role="menuitem"
            type="button"
          >
            {isDeleting ? "Deleting…" : "Delete model"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
