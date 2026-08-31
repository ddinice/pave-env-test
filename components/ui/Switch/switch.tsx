"use client";

import styles from "./style.module.css";

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={ariaLabel}
      className={styles.switch}
      disabled={disabled}
      onClick={onCheckedChange}
      role="switch"
      type="button"
    >
      <span className={styles.thumb} />
    </button>
  );
}
