"use client";

import { PullIcon, PushIcon } from "../../components/icons/icons";
import { VariablePicker } from "../../components/VariablePicker/variable-picker";
import type { PickerVariable } from "../../components/VariablePicker/types";
import { ModelActionsMenu } from "./model-actions-menu";
import { useModelForm } from "./use-model-form";
import styles from "./style.module.css";

export function ModelForm({
  allVariables,
  initial,
  slug,
  meta,
  editable,
}: {
  allVariables: PickerVariable[];
  initial?: {
    name: string;
    description: string;
    pullIds: string[];
    pushIds: string[];
  };
  slug?: string;
  editable?: boolean;
  meta?: { owner: string | null; lastRunLabel: string };
}) {
  const {
    name,
    setName,
    description,
    setDescription,
    pullIds,
    setPullIds,
    pushIds,
    setPushIds,
    error,
    isSaving,
    isDeleting,
    unsavedChanges,
    save,
    remove,
  } = useModelForm({ initial, slug });

  return (
    <div className={styles.form}>
      <div className={styles.titleRow}>
        <div className={styles.titleField}>
          <input
            aria-label="Model name"
            className={styles.titleInput}
            onChange={(event) => setName(event.target.value)}
            placeholder="Untitled model"
            value={name}
          />
        </div>

        {slug ? (
          <div className={styles.titleActions}>
            {meta?.owner ? (
              <span className={styles.ownerName}>{meta.owner}</span>
            ) : null}
            <ModelActionsMenu isDeleting={isDeleting} onDelete={remove} />
          </div>
        ) : null}
      </div>

      <input
        aria-label="Model description"
        className={styles.descriptionInput}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Add description…"
        value={description}
      />

      {slug ? (
        <p className={styles.metaLine}>
          <span className={styles.slugText}>{slug}</span>
          {meta?.lastRunLabel ? <span> · {meta.lastRunLabel}</span> : null}
        </p>
      ) : null}

      <div className={styles.pickerGrid}>
        <VariablePicker
          allVariables={allVariables}
          icon={PullIcon}
          label="Pull"
          onChange={setPullIds}
          selectedIds={pullIds}
        />
        <VariablePicker
          allVariables={allVariables}
          icon={PushIcon}
          label="Push"
          onChange={setPushIds}
          selectedIds={pushIds}
        />
      </div>

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.saveBar}>
        <div className={styles.saveBarLeft}>
          <button
            disabled={!name.trim() || isSaving}
            className="button"
            onClick={save}
            type="button"
          >
            {isSaving ? "Saving…" : slug ? "Save changes" : "Create model"}
          </button>
          <span className={styles.shortcutHint}>⌘S</span>
        </div>
        {slug && unsavedChanges > 0 ? (
          <span className={styles.unsavedCount}>
            {unsavedChanges} unsaved change{unsavedChanges === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
