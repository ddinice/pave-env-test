"use client";

import { useState, type MouseEvent } from "react";

import { CopyIcon } from "../../icons/icons";
import { cn } from "../../../lib/utils";
import styles from "./style.module.css";
import { Props } from "./types";

export const CopyButton = ({ value, ariaLabel = "Copy", isHover = false, label }: Props) => {
  const [copied, setCopied] = useState(false);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <span className={styles.wrapper}>
      <button
        aria-label={ariaLabel}
        className={cn(styles.button, label && styles.buttonLabeled, !isHover && styles.buttonHidden)}
        onClick={handleClick}
        type="button"
      >
        <CopyIcon />
        {label ? <span>{label}</span> : null}
      </button>
      <span className={cn(styles.tooltip, copied && styles.tooltipVisible)}>
        Copied!
      </span>
    </span>
  );
};
